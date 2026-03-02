import fs from 'fs';
import path from 'path';
import translate from 'google-translate-api-x';

const locales = ['am','ar','bg','bn','ca','cs','da','de','el','en','en_AU','en_GB','en_US','es','es_419','et','fa','fi','fil','fr','gu','he','hi','hr','hu','id','it','ja','kn','ko','lt','lv','ml','mr','ms','nl','no','pl','pt_BR','pt_PT','ro','ru','sk','sl','sr','sv','sw','ta','te','th','tr','uk','vi','zh_CN','zh_TW'];

const localeMap = {
  'am': 'am', 'ar': 'ar', 'bg': 'bg', 'bn': 'bn', 'ca': 'ca', 'cs': 'cs', 'da': 'da', 'de': 'de', 'el': 'el', 
  'en_AU': 'en', 'en_GB': 'en', 'en_US': 'en', 'es_419': 'es', 'es': 'es', 'et': 'et', 'fa': 'fa', 'fi': 'fi', 'fil': 'tl', 
  'gu': 'gu', 'fr': 'fr', 'he': 'iw', 'hi': 'hi', 'hr': 'hr', 'hu': 'hu', 'id': 'id', 'it': 'it', 'ja': 'ja', 'kn': 'kn', 
  'ko': 'ko', 'lt': 'lt', 'lv': 'lv', 'ml': 'ml', 'mr': 'mr', 'ms': 'ms', 'nl': 'nl', 'no': 'no', 'pl': 'pl', 
  'pt_BR': 'pt', 'pt_PT': 'pt', 'ro': 'ro', 'ru': 'ru', 'sk': 'sk', 'sl': 'sl', 'sr': 'sr', 'sv': 'sv', 'sw': 'sw', 
  'ta': 'ta', 'te': 'te', 'th': 'th', 'tr': 'tr', 'uk': 'uk', 'vi': 'vi', 'zh_CN': 'zh-cn', 'zh_TW': 'zh-tw'
};

const enTitle = "LinguaFlow - Bilingual Web & PDF Translator";
const enSummary = "Open-source bilingual translator for web pages, images, and PDFs via AI engines (OpenAI, Claude) and local offline modes.";

const enDetailed = `Discover the ultimate open-source reading and language learning companion. LinguaFlow intelligently translates web pages, local PDFs, and images into bilingual text using top-tier AI like OpenAI, Claude, or completely offline Chrome built-in local models.

🌟 Core Capabilities 🌟
- 📖 Bilingual Reading Mode: Retains original text formatting, injecting translations side-by-side or block-by-block. Perfect for learning new languages in context without losing your place.
- 📄 Full-Page PDF Translator: Effortlessly translates embedded PDF files. We map the text layers perfectly to preserve complex absolute-positioned native layouts natively.
- 📷 Image Translation & OCR: Extract text from screen areas and translate Japanese manga, Korean webtoons, or scanned documents locally.
- 🧠 Smart Hover & Selection Translator: Double-click words for instant dictionary popups, or highlight paragraphs for structural grammar explanations powered by LLMs.
- 🤖 Bring Your Own API & Privacy: Connect your own OpenAI or Anthropic Claude keys for maximum privacy and translation quality, or utilize our built-in offline tools for localized processing.
- 🌐 Domain Overrides: Automatically apply specific languages or translation engines to exact websites.
- 📚 Vocabulary Hub: Save words to your integrated dictionary while reading and export them to Anki or CSV for flashcard practicing.

LinguaFlow is completely free and 100% Open Source. Join the community, verify our transparent privacy code, and contribute today!

Website & Source: https://github.com/Kloverdevs/LinguaFlow
Support: contact@kloverdevs.ca`;

async function delay(ms) {
    return new Promise(r => setTimeout(r, ms));
}

async function run() {
    const detailedDescriptions = {};
    for (let i = 0; i < locales.length; i++) {
        const locale = locales[i];
        if (locale.startsWith('en')) {
            console.log(`Skipping English: ${locale}`);
            detailedDescriptions[locale] = enDetailed;
            continue;
        }

        console.log(`Translating ${i + 1}/${locales.length}: ${locale}`);
        const gLang = localeMap[locale];
        
        try {
            // Translate the detailed description
            const detailRes = await translate(enDetailed, { from: 'en', to: gLang, forceBatch: false });
            detailedDescriptions[locale] = detailRes.text;

            // Translate title and summary
            const titleRes = await translate(enTitle, { from: 'en', to: gLang, forceBatch: false });
            const summaryRes = await translate(enSummary, { from: 'en', to: gLang, forceBatch: false });

            // Truncate title to 45 chars for Web Store limits natively
            let localizedTitle = titleRes.text;
            if (localizedTitle.length > 45) {
                localizedTitle = localizedTitle.substring(0, 42) + '...';
            }
            
            let localizedSummary = summaryRes.text;
            if (localizedSummary.length > 132) {
                localizedSummary = localizedSummary.substring(0, 129) + '...';
            }

            // Write into messages.json directly
            const msgPath = path.join('public', '_locales', locale, 'messages.json');
            if (fs.existsSync(msgPath)) {
                const msgData = JSON.parse(fs.readFileSync(msgPath, 'utf8'));
                msgData.appName.message = localizedTitle;
                msgData.appDesc.message = localizedSummary;
                fs.writeFileSync(msgPath, JSON.stringify(msgData, null, 2));
            }

            await delay(1200); // Prevent rate limiting
        } catch (e) {
            console.error(`Failed to translate ${locale}`, e.message);
        }
    }
    fs.writeFileSync('scripts/cws_descriptions.json', JSON.stringify(detailedDescriptions, null, 2));
    console.log("All translations completed successfully.");
}

run();
