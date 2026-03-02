import AdmZip from 'adm-zip';
import fs from 'fs';

console.log('Starting cross-platform POSIX-compliant ZIP compilation...');

try {
    if (fs.existsSync('linguaflow-chrome.zip')) {
        fs.unlinkSync('linguaflow-chrome.zip');
    }
    const zipChrome = new AdmZip();
    zipChrome.addLocalFolder('dist/', ''); // Empty string forces exact root placement
    zipChrome.writeZip('linguaflow-chrome.zip');
    console.log('Successfully created linguaflow-chrome.zip with manifest.json at root');
} catch (e) {
    console.error('Failed Chrome zip', e);
}

try {
    if (fs.existsSync('linguaflow-firefox.zip')) {
        fs.unlinkSync('linguaflow-firefox.zip');
    }
    const zipFirefox = new AdmZip();
    zipFirefox.addLocalFolder('dist-firefox/', ''); // Empty string forces exact root placement
    zipFirefox.writeZip('linguaflow-firefox.zip');
    console.log('Successfully created linguaflow-firefox.zip with manifest.json at root');
} catch (e) {
    console.error('Failed Firefox zip', e);
}
