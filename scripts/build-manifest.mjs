import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const TARGET = process.env.TARGET || 'chrome';
const OUT_DIR = path.resolve(__dirname, '..', TARGET === 'firefox' ? 'dist-firefox' : 'dist');
const BASE_MANIFEST_PATH = path.resolve(__dirname, '../public/manifest.json');
const DEST_MANIFEST_PATH = path.resolve(OUT_DIR, 'manifest.json');

async function buildManifest() {
  console.log(`[LinguaFlow] Building manifest for target: ${TARGET}`);

  // 1. Ensure output directory exists
  if (!fs.existsSync(OUT_DIR)) {
    fs.mkdirSync(OUT_DIR, { recursive: true });
  }

  // 2. Read the base public manifest
  const rawData = fs.readFileSync(BASE_MANIFEST_PATH, 'utf8');
  const manifest = JSON.parse(rawData);

  // 3. Apply browser-specific mutations
  if (TARGET === 'firefox') {
    // Firefox uses background 'scripts', not 'service_worker'
    if (manifest.background && manifest.background.service_worker) {
      manifest.background = {
        scripts: [manifest.background.service_worker],
        type: manifest.background.type
      };
    }
    
    // Firefox requires a Gecko ID, explicit versioning, and mandatory Data Collection scopes natively
    // Firefox requires a Gecko ID, explicit versioning, and mandatory Data Collection scopes natively
    // Firefox requires a Gecko ID, explicit versioning, and mandatory Data Collection scopes natively
    manifest.browser_specific_settings = {
      gecko: {
        id: "linguaflow@kloverdevs.com"
      }
    };
    // Force modern Mozilla background type compatibility while preventing validation warnings
    if(manifest.background) {
         manifest.background.type = "module";
    }

    // Explicitly declare Data Collection payload for reviewers using the Mozilla Object schema
    if (!manifest.browser_specific_settings.gecko) manifest.browser_specific_settings.gecko = {};
    manifest.browser_specific_settings.gecko.strict_min_version = "109.0";
    
    // Explicitly declare Data Collection payload for reviewers
    manifest.browser_specific_settings.gecko.data_collection_permissions = {
        required: [
            "websiteContent",
            "browsingActivity"
        ]
    };
  } else {
    // Chrome / Edge / Brave defaults remain untouched
    // Note: The base manifest in /public already uses `service_worker`
  }

  // 4. Write the mutated manifest to the out directory
  fs.writeFileSync(DEST_MANIFEST_PATH, JSON.stringify(manifest, null, 2), 'utf8');
  console.log(`[LinguaFlow] Successfully wrote ${DEST_MANIFEST_PATH}`);
}

buildManifest().catch(err => {
  console.error('[LinguaFlow] Manifest generation failed:', err);
  process.exit(1);
});
