import fs from 'fs';

const locales = ['am','ar','bg','bn','ca','cs','da','de','el','en_AU','en_GB','en_US','es_419','et','fa','fi','fil','gu','he','hi','hr','hu','id','it','ja','kn','ko','lt','lv','ml','mr','ms','nl','no','pl','pt_BR','pt_PT','ro','ru','sk','sl','sr','sv','sw','ta','te','th','tr','uk','vi','zh_CN','zh_TW'];

const localeMap = {
  'am': 'am', 'ar': 'ar', 'bg': 'bg', 'bn': 'bn', 'ca': 'ca', 'cs': 'cs', 'da': 'da', 'de': 'de', 'el': 'el', 
  'en_AU': 'en', 'en_GB': 'en', 'en_US': 'en', 'es_419': 'es', 'et': 'et', 'fa': 'fa', 'fi': 'fi', 'fil': 'tl', 
  'gu': 'gu', 'he': 'iw', 'hi': 'hi', 'hr': 'hr', 'hu': 'hu', 'id': 'id', 'it': 'it', 'ja': 'ja', 'kn': 'kn', 
  'ko': 'ko', 'lt': 'lt', 'lv': 'lv', 'ml': 'ml', 'mr': 'mr', 'ms': 'ms', 'nl': 'nl', 'no': 'no', 'pl': 'pl', 
  'pt_BR': 'pt', 'pt_PT': 'pt', 'ro': 'ro', 'ru': 'ru', 'sk': 'sk', 'sl': 'sl', 'sr': 'sr', 'sv': 'sv', 'sw': 'sw', 
  'ta': 'ta', 'te': 'te', 'th': 'th', 'tr': 'tr', 'uk': 'uk', 'vi': 'vi', 'zh_CN': 'zh-CN', 'zh_TW': 'zh-TW'
};

const englishText = `Discover the ultimate open-source reading and language learning companion. LinguaFlow intelligently translates web pages, local PDFs, and images into bilingual text using top-tier AI like OpenAI, Claude, or completely offline Chrome built-in local models. 

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

async function translateText(text, targetLang) {
    if (targetLang === 'en') return text;
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=${targetLang}&dt=t`;
    const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ q: text })
    });
    if (!response.ok) return text;
    const data = await response.json();
    return data[0].map(x => x[0]).join('');
}

async function run() {
    const results = {};
    for (let i = 0; i < locales.length; i++) {
        const locale = locales[i];
        console.log("Translating " + (i+1) + "/" + locales.length + ": " + locale);
        const gLang = localeMap[locale] || 'en';
        try {
            const translated = await translateText(englishText, gLang);
            results[locale] = translated;
        } catch(e) {
            console.error("Failed", locale, e);
        }
        await new Promise(r => setTimeout(r, 600)); // anti-rate limit delay
    }
    fs.writeFileSync('cws_descriptions.json', JSON.stringify(results, null, 2));
    console.log("Translation generation complete!");
}
run();
