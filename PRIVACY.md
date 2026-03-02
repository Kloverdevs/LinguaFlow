# Privacy Policy for LinguaFlow

**Last Updated:** March 2, 2026

LinguaFlow ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how our browser extension collects, uses, and safeguards your information. 

## 1. Information We Do Not Collect
We strongly believe in data minimization. LinguaFlow operates on a strict **zero-telemetry** architecture:
* **No Analytics:** We do not use Google Analytics, Mixpanel, or any tracking scripts.
* **No Usage Data:** We do not track which websites you visit or what text you translate.
* **No Accounts:** You do not need an account to use LinguaFlow. We do not collect names, emails, or passwords.

## 2. Information Handled Locally
LinguaFlow is designed to process as much data locally on your device as possible:
* **Settings & Preferences:** Your UI language, theme, font sizes, and custom prompts are stored strictly within your browser's local `chrome.storage`.
* **Vocabulary Deck:** Words and phrases you save are stored locally on your device.
* **Cached Translations:** To improve performance and save API quotas, recent translations are cached in your local IndexedDB. This cache never leaves your browser and can be wiped manually at any time via the Settings menu.

## 3. Translation APIs & Third-Party Services
LinguaFlow connects directly from your browser to the translation engines you select. We do not route your text through any intermediate LinguaFlow servers.

When you use a translation engine, the text you select is sent directly to that provider. Please refer to their respective privacy policies:
* **Google Translate / Chrome Built-in:** Processed according to Google's Privacy Policy. (Note: Chrome's built-in Nano API operates entirely offline on-device).
* **OpenAI (GPT-4o):** Processed according to OpenAI's API Data Privacy Policy. (API requests are not used to train their consumer models).
* **Anthropic (Claude):** Processed according to Anthropic's Privacy Policy.
* **DeepL, Bing, Yandex, LibreTranslate, etc.:** Processed according to their respective policies.

### 3.1 API Keys
If you provide personal API keys (e.g., for OpenAI or Anthropic), these keys are stored securely in your browser's local storage. They are **only** transmitted directly to the respective official API endpoints. We never see, store, or transmit your API keys to our own servers.

## 4. Required Permissions
The extension requests the following permissions to function:
* `activeTab`: Required to read the DOM and inject translations onto the *current* page only when you explicitly interact with the extension.
* `storage`: Required to save your settings, API keys, and vocabulary locally.
* `contextMenus`: Required to provide right-click translation options.
* `scripting`: Required to inject translation display scripts dynamically.
* **Host Permissions (`*://*/*`)**: Required for the extension to fetch translations from external API endpoints (like `api.openai.com` or `translate.googleapis.com`) directly from your browser without throwing CORS errors.

## 5. Changes to This Policy
We may update this Privacy Policy periodically to reflect new features. Any changes will be posted in this repository.

## 6. Contact Us
If you have any questions or concerns about this Privacy Policy, please open an issue in the GitHub repository or contact us at `kloverdevs@gmail.com`.
