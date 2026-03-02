import fs from 'fs';

let data = {};
if (fs.existsSync('scripts/cws_descriptions.json')) {
    data = JSON.parse(fs.readFileSync('scripts/cws_descriptions.json', 'utf8'));
}

let html = `<html><head><title>Clipboard Helper</title>
<style>
  body { font-family: monospace; display: flex; flex-wrap: wrap; }
  .box { margin: 10px; border: 1px solid #ccc; padding: 10px; width: 400px; }
  textarea { width: 100%; height: 100px; }
</style>
</head><body>
<h1>Clipboard Helper for Browser Subagent</h1>
<p>Instructions: Click inside a textarea, hit Ctrl+A, then Ctrl+C to copy.</p>
`;

for (let [locale, text] of Object.entries(data)) {
    // Escape HTML securely
    let safeText = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
    html += `<div class="box">
        <h3>Locale: ${locale}</h3>
        <textarea id="ta-${locale}">${safeText}</textarea>
    </div>\n`;
}
html += `</body></html>`;

fs.writeFileSync('C:\\Users\\Joseph Wilson\\.gemini\\antigravity\\brain\\f246e13e-a342-4e1d-b0ef-d9ccd351537f\\browser\\copy_helper.html', html);
console.log("Helper HTML created with " + Object.keys(data).length + " textareas.");
