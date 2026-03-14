import AdmZip from 'adm-zip';
import fs from 'fs';
import path from 'path';

console.log('Starting cross-platform POSIX-compliant ZIP compilation...');

/**
 * Normalize all zip entry paths to use forward slashes (POSIX).
 * adm-zip on Windows may produce backslash entry names which
 * Firefox Add-ons validation rejects.
 */
function normalizeEntryPaths(zip) {
    for (const entry of zip.getEntries()) {
        if (entry.entryName.includes('\\')) {
            entry.entryName = entry.entryName.replace(/\\/g, '/');
        }
    }
}

function createZip(sourceDir, outputFile, label) {
    try {
        if (fs.existsSync(outputFile)) {
            fs.unlinkSync(outputFile);
        }
        const zip = new AdmZip();
        zip.addLocalFolder(sourceDir, '');
        normalizeEntryPaths(zip);
        zip.writeZip(outputFile);
        console.log(`Successfully created ${outputFile} (${label})`);
    } catch (e) {
        console.error(`Failed ${label} zip:`, e);
        process.exit(1);
    }
}

createZip('dist', 'linguaflow-chrome.zip', 'Chrome');
createZip('dist-firefox', 'linguaflow-firefox.zip', 'Firefox');
