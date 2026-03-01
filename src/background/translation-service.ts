import { TranslationEngine, TranslationResult, EngineConfig } from '@/types/translation';
import { createEngine } from '@/engines';
import { getCached, putCached } from '@/shared/cache';
import { getSettings } from '@/shared/storage';
import { getEngineInfo } from '@/constants/engines';
import { logger } from '@/shared/logger';
import { getGlossary } from '@/shared/glossary-store';
import { GlossaryEntry } from '@/types/glossary';
import { UserSettings } from '@/types/settings';
import { createWorker } from 'tesseract.js';

const MAX_CONCURRENT_BATCHES = 3;

function escapeRegExp(string: string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function applyGlossaryPreProcessing(texts: string[], glossary: GlossaryEntry[]): { processedTexts: string[], mappedTerms: string[] } {
  if (!glossary.length) return { processedTexts: texts, mappedTerms: [] };
  
  const mappedTerms: string[] = [];
  const processedTexts = texts.map(text => {
    let newText = text;
    glossary.forEach(entry => {
      if (!entry.sourceTerm) return;
      const flags = entry.caseSensitive ? 'g' : 'gi';
      const regex = new RegExp(`\\b${escapeRegExp(entry.sourceTerm)}\\b`, flags);
      
      newText = newText.replace(regex, () => {
        const index = mappedTerms.length;
        mappedTerms.push(entry.targetTerm);
        return `[GLS_${index}_GLS]`;
      });
    });
    return newText;
  });
  
  return { processedTexts, mappedTerms };
}

function applyGlossaryPostProcessing(translatedTexts: string[], mappedTerms: string[]): string[] {
  if (!mappedTerms.length) return translatedTexts;
  
  return translatedTexts.map(text => {
    return text.replace(/\[\s*GLS\s*_\s*(\d+)\s*_\s*GLS\s*\]/gi, (match, indexStr) => {
      const index = parseInt(indexStr, 10);
      return mappedTerms[index] || match;
    });
  });
}

export async function translateTexts(
  texts: string[],
  sourceLang: string,
  targetLang: string,
  engineOverride?: TranslationEngine,
  onStream?: (chunk: string) => void
): Promise<TranslationResult> {
  const settings = await getSettings();
  const engineType = engineOverride ?? settings.engine;
  const baseConfig = settings.engineConfigs?.[engineType] ?? { engine: engineType };
  const engineConfig: EngineConfig = {
    ...baseConfig,
    formality: settings.formality ?? 'auto',
  };

  // Validate API key for engines that require one
  const engineInfo = getEngineInfo(engineType);
  if (engineInfo.requiresKey && !engineConfig.apiKey) {
    throw new Error(`API key required for ${engineInfo.name}. Open the extension settings to add your key.`);
  }

  // Check cache for each text
  const cacheResults = await Promise.all(
    texts.map((text) => getCached(text, sourceLang, targetLang, engineType))
  );

  const uncachedIndices: number[] = [];
  const translatedTexts: string[] = new Array(texts.length);
  let allCached = true;

  for (let i = 0; i < texts.length; i++) {
    if (cacheResults[i] !== null) {
      translatedTexts[i] = cacheResults[i]!;
    } else {
      uncachedIndices.push(i);
      allCached = false;
    }
  }

  // If all cached, return immediately
  if (allCached) {
    return {
      originalTexts: texts,
      translatedTexts,
      engine: engineType,
      cached: true,
      timestamp: Date.now(),
    };
  }

  // Translate uncached texts
  logger.info(`Translating ${uncachedIndices.length} uncached texts with engine: ${engineType}`);
  const engine = createEngine(engineType, engineConfig);
  const batchSize = engine.getMaxBatchSize();
  const uncachedTexts = uncachedIndices.map((i) => texts[i]);

  // Pre-process uncached texts with glossary rules
  const glossary = await getGlossary();
  const { processedTexts: uncachedProcessedTexts, mappedTerms } = applyGlossaryPreProcessing(uncachedTexts, glossary);

  // Create batches
  const batches: string[][] = [];
  for (let i = 0; i < uncachedProcessedTexts.length; i += batchSize) {
    batches.push(uncachedProcessedTexts.slice(i, i + batchSize));
  }

  const FALLBACK_CHAIN = [
    TranslationEngine.GOOGLE_FREE,
    TranslationEngine.BING_FREE,
    TranslationEngine.LINGVA,
  ];

  async function tryTranslateBatchWithFallback(batch: string[]): Promise<{ texts: string[]; engineUsed: TranslationEngine }> {
    try {
      return { 
        texts: await engine.translate(batch, sourceLang, targetLang, onStream),
        engineUsed: engineType 
      };
    } catch (err) {
      logger.warn(`Primary engine ${engineType} failed: ${(err as Error).message}. Trying fallbacks...`);
      
      const fallbacks = FALLBACK_CHAIN.filter(e => e !== engineType);
      let lastError = err;
      
      for (const fallbackType of fallbacks) {
        try {
          logger.info(`Attempting fallback with ${fallbackType}`);
          const fallbackEngineConfig: EngineConfig = { engine: fallbackType };
          const fallbackEngine = createEngine(fallbackType, fallbackEngineConfig);
          return { 
            texts: await fallbackEngine.translate(batch, sourceLang, targetLang),
            engineUsed: fallbackType 
          };
        } catch (fallbackErr) {
          logger.warn(`Fallback engine ${fallbackType} failed: ${(fallbackErr as Error).message}`);
          lastError = fallbackErr;
        }
      }
      
      throw lastError;
    }
  }

  // Process batches with concurrency limit
  const batchResults: Array<{ texts: string[]; engineUsed: TranslationEngine }> = [];
  for (let i = 0; i < batches.length; i += MAX_CONCURRENT_BATCHES) {
    const concurrentBatches = batches.slice(i, i + MAX_CONCURRENT_BATCHES);
    const results = await Promise.all(
      concurrentBatches.map(batch => tryTranslateBatchWithFallback(batch))
    );
    batchResults.push(...results);
  }

  // Flatten batch results and map back to original indices
  let finalEngine = engineType;
  const rawTranslatedTexts: string[] = [];

  for (let i = 0, batchIdx = 0, itemIdx = 0; i < uncachedIndices.length; i++) {
    const { texts: batchTexts, engineUsed } = batchResults[batchIdx];
    rawTranslatedTexts.push(batchTexts[itemIdx]);
    
    if (engineUsed !== engineType) finalEngine = engineUsed;

    itemIdx++;
    if (itemIdx >= batchTexts.length) {
      batchIdx++;
      itemIdx = 0;
    }
  }

  // Post-process to inject glossary target terms back in
  const postProcessedTexts = applyGlossaryPostProcessing(rawTranslatedTexts, mappedTerms);

  // Map back to final array and cache
  for (let i = 0; i < uncachedIndices.length; i++) {
    const originalIndex = uncachedIndices[i];
    const finalTranslatedText = postProcessedTexts[i];
    
    translatedTexts[originalIndex] = finalTranslatedText;

    // Cache the original uncached context with the final translated result
    putCached(texts[originalIndex], finalTranslatedText, sourceLang, targetLang, finalEngine).catch(
      (err) => logger.error('Cache write failed:', err)
    );
  }

  return {
    originalTexts: texts,
    translatedTexts,
    engine: finalEngine,
    cached: false,
    timestamp: Date.now(),
  };
}

export async function validateEngine(engineType: TranslationEngine): Promise<{ valid: boolean; error?: string }> {
  const settings = await getSettings();
  const engineConfig: EngineConfig = settings.engineConfigs?.[engineType] ?? { engine: engineType };
  const engine = createEngine(engineType, engineConfig);
  return engine.validateConfig();
}

export async function explainGrammar(text: string, sourceLang: string, targetLang: string): Promise<string> {
  const settings = await getSettings();
  
  // Try to find an LLM engine to use (OpenAI or Claude)
  const llmEngineType = [
    settings.engine,
    settings.compareEngine,
    TranslationEngine.OPENAI,
    TranslationEngine.CLAUDE
  ].find(e => e === TranslationEngine.OPENAI || e === TranslationEngine.CLAUDE);
  
  if (!llmEngineType) {
    throw new Error('Please configure OpenAI or Claude in settings to use the Grammar Explain feature.');
  }
  
  const engineConfig: EngineConfig = settings.engineConfigs?.[llmEngineType] ?? { engine: llmEngineType };
  
  if (!engineConfig.apiKey) {
    throw new Error(`API key required for ${getEngineInfo(llmEngineType).name}. Please configure it in settings.`);
  }
  
  const engine = createEngine(llmEngineType, engineConfig);
  return engine.explain(text, sourceLang, targetLang);
}

// Map our language codes to Tesseract codes
function mapLangToTesseract(lang: string): string {
  if (!lang || lang === 'auto') return 'eng';
  const map: Record<string, string> = {
    'en': 'eng', 'es': 'spa', 'fr': 'fra', 'de': 'deu', 'it': 'ita', 
    'pt': 'por', 'ru': 'rus', 'ja': 'jpn', 'zh': 'chi_sim', 'zh-CN': 'chi_sim',
    'zh-TW': 'chi_tra', 'ko': 'kor', 'ar': 'ara', 'nl': 'nld', 'tr': 'tur'
  };
  return map[lang.split('-')[0]] || 'eng';
}

async function performTesseractFallback(
  imageBase64: string, 
  sourceLang: string, 
  targetLang: string, 
  engineType: TranslationEngine, 
  settings: UserSettings
): Promise<string> {
  logger.info(`Vision engine not available. Falling back to tesseract.js OCR for language: ${sourceLang}`);
  const tessLang = mapLangToTesseract(sourceLang);
  
  // Create Tesseract worker pointing to local files to satisfy MV3 CSP
  const worker = await createWorker(tessLang, 1, {
    workerPath: chrome.runtime.getURL('tesseract/worker.min.js'),
    corePath: chrome.runtime.getURL('tesseract/tesseract-core.wasm.js'),
  });
  
  const ret = await worker.recognize(imageBase64);
  const extractedText = ret.data.text.trim();
  
  await worker.terminate();

  if (!extractedText) {
    throw new Error('OCR Failed: Could not extract any text from the image.');
  }

  logger.info(`Extracted ${extractedText.length} characters using OCR. Translating...`);

  // Translate the extracted text using the primary configured engine
  const engineConfig = settings.engineConfigs?.[engineType] ?? { engine: engineType };
  const engine = createEngine(engineType, engineConfig);
  
  const translations = await engine.translate([extractedText], sourceLang, targetLang);
  return translations[0];
}

export async function translateImage(
  imageBase64: string,
  sourceLang: string,
  targetLang: string,
  engineOverride?: TranslationEngine
): Promise<string> {
  const settings = await getSettings();
  const engineType = engineOverride ?? settings.engine;

  let useVisionAPI = false;
  let visionEngineType: TranslationEngine | null = null;
  let engineConfig: EngineConfig | null = null;

  // Check if primary engine is a Vision Engine with a key
  if (engineType === TranslationEngine.OPENAI || engineType === TranslationEngine.CLAUDE) {
    const config = settings.engineConfigs?.[engineType] ?? { engine: engineType };
    if (config.apiKey) {
      useVisionAPI = true;
      visionEngineType = engineType;
      engineConfig = config;
    }
  }

  // If primary isn't vision-capable, see if they have OpenAI/Claude configured as a fallback
  if (!useVisionAPI) {
    const fallbackTypes = [TranslationEngine.OPENAI, TranslationEngine.CLAUDE];
    for (const type of fallbackTypes) {
      const config = settings.engineConfigs?.[type];
      if (config && config.apiKey) {
        useVisionAPI = true;
        visionEngineType = type;
        engineConfig = config;
        break;
      }
    }
  }

  // Use the Vision API if we found configured keys
  if (useVisionAPI && visionEngineType && engineConfig) {
    logger.info(`Using Vision API: ${visionEngineType}`);
    const engine = createEngine(visionEngineType, engineConfig);
    if (engine.translateImage) {
      return engine.translateImage(imageBase64, sourceLang, targetLang);
    }
  }

  // If no API keys for OpenAI/Claude exist, fallback to Tesseract JS + Standard Translation Engine
  return await performTesseractFallback(imageBase64, sourceLang, targetLang, engineType, settings);
}
