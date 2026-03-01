import { TranslationEngine, TranslationResult, EngineConfig } from '@/types/translation';
import { createEngine } from '@/engines';
import { getCached, putCached } from '@/shared/cache';
import { getSettings } from '@/shared/storage';
import { getEngineInfo } from '@/constants/engines';
import { logger } from '@/shared/logger';

const MAX_CONCURRENT_BATCHES = 3;

export async function translateTexts(
  texts: string[],
  sourceLang: string,
  targetLang: string,
  engineOverride?: TranslationEngine
): Promise<TranslationResult> {
  const settings = await getSettings();
  const engineType = engineOverride ?? settings.engine;
  const engineConfig: EngineConfig = settings.engineConfigs?.[engineType] ?? { engine: engineType };

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

  // Create batches
  const batches: string[][] = [];
  for (let i = 0; i < uncachedTexts.length; i += batchSize) {
    batches.push(uncachedTexts.slice(i, i + batchSize));
  }

  // Process batches with concurrency limit
  const batchResults: string[][] = [];
  for (let i = 0; i < batches.length; i += MAX_CONCURRENT_BATCHES) {
    const concurrentBatches = batches.slice(i, i + MAX_CONCURRENT_BATCHES);
    const results = await Promise.all(
      concurrentBatches.map((batch) =>
        engine.translate(batch, sourceLang, targetLang)
      )
    );
    batchResults.push(...results);
  }

  // Flatten batch results and map back to original indices
  const flatResults = batchResults.flat();
  for (let i = 0; i < uncachedIndices.length; i++) {
    const originalIndex = uncachedIndices[i];
    translatedTexts[originalIndex] = flatResults[i];

    // Cache the result
    putCached(texts[originalIndex], flatResults[i], sourceLang, targetLang, engineType).catch(
      (err) => logger.error('Cache write failed:', err)
    );
  }

  return {
    originalTexts: texts,
    translatedTexts,
    engine: engineType,
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
