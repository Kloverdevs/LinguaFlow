import fs from 'fs';
import path from 'path';

const locales = ['am','ar','bg','bn','ca','cs','da','de','el','en','en_AU','en_GB','en_US','es','es_419','et','fa','fi','fil','fr','gu','he','hi','hr','hu','id','it','ja','kn','ko','lt','lv','ml','mr','ms','nl','no','pl','pt_BR','pt_PT','ro','ru','sk','sl','sr','sv','sw','ta','te','th','tr','uk','vi','zh_CN','zh_TW'];

locales.forEach(l => {
  const file = path.join('public', '_locales', l, 'messages.json');
  if (fs.existsSync(file)) {
    const data = JSON.parse(fs.readFileSync(file, 'utf8'));
    // Max 45 characters for CWS
    // "LinguaFlow - Bilingual Web & PDF Translator" is 43 characters
    data.appName.message = "LinguaFlow - Bilingual Web & PDF Translator";
    if (l.startsWith('es')) {
        data.appName.message = "LinguaFlow - Traductor Web y PDF Bilingüe"; // 41 chars
    } else if (l.startsWith('fr')) {
        data.appName.message = "LinguaFlow - Traducteur Web et PDF Bilingue"; // 43 chars
    }
    fs.writeFileSync(file, JSON.stringify(data, null, 2));
  }
});
console.log("Titles updated!");
