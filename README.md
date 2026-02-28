# LinguaFlow

A Chrome extension for bilingual webpage translation. Translates paragraphs on any webpage and displays the translation below the original text.

Built with **React 19**, **TypeScript**, **Vite 6**, and **Chrome Manifest V3**.

---

## Features

- **Bilingual display** — translated text appears below each original paragraph
- **Replace mode** — swap original text with translation entirely
- **5 translation engines** — Google Translate (free), DeepL, OpenAI, Claude, Microsoft Translator
- **Hover translate** — hover over any paragraph to translate it instantly (300ms debounce)
- **Keyboard shortcut** — `Alt+A` to toggle translation
- **Context menu** — right-click selected text to translate
- **IndexedDB cache** — translations are cached locally (LRU, 10K entries, 7-day TTL)
- **SPA support** — MutationObserver watches for dynamically added content
- **Floating action button** — quick-access FAB on every page for translate, mode toggle, and hover toggle
- **In-app settings** — configure API keys, display preferences, and engine defaults without leaving the popup
- **Onboarding** — first-time tooltip guiding new users
- **Customizable styles** — font size, text color, border color, italic toggle for translations

---

## Supported Engines

| Engine               | API Key Required | Batch Size | Notes                                       |
| -------------------- | ---------------- | ---------- | ------------------------------------------- |
| Google Translate      | No               | 1          | Free `translate.googleapis.com` endpoint     |
| Microsoft Translator  | Yes              | 25         | Azure Cognitive Services                     |
| DeepL                 | Yes              | 50         | Auto-detects free vs pro key (`:fx` suffix)  |
| OpenAI                | Yes              | Flexible   | Uses Chat Completions API (`gpt-4o-mini`)    |
| Claude                | Yes              | Flexible   | Uses Anthropic Messages API (`claude-sonnet-4-5-20250514`) |

---

## Supported Languages

Auto Detect, English, Chinese (Simplified & Traditional), Japanese, Korean, French, German, Spanish, Portuguese, Russian, Arabic, Hindi, Italian, Dutch, Thai, Vietnamese, Indonesian, Turkish, Polish, Swedish, Danish, Finnish, Greek, Czech, Romanian, Hungarian, Ukrainian, Hebrew.

---

## Project Structure

```
translate/
├── public/
│   ├── manifest.json              # Chrome Manifest V3 configuration
│   └── icons/                     # Extension icons (16/32/48/128px + logo)
├── src/
│   ├── types/
│   │   ├── translation.ts         # TranslationEngine enum, TranslationRequest/Result, EngineConfig
│   │   ├── settings.ts            # UserSettings, DisplayMode, TranslationStyle
│   │   ├── messages.ts            # MessageToBackground, MessageToContent unions
│   │   └── dom.ts                 # TranslatableNode interface
│   ├── constants/
│   │   ├── languages.ts           # Supported language list with ISO codes
│   │   ├── engines.ts             # Engine metadata (name, color, requiresKey, defaultModel)
│   │   ├── defaults.ts            # Default settings values
│   │   └── index.ts               # Re-exports
│   ├── shared/
│   │   ├── storage.ts             # Typed chrome.storage.local wrapper (get/update/onChanged)
│   │   ├── cache.ts               # IndexedDB translation cache (FNV-1a hash, LRU eviction)
│   │   ├── message-bus.ts         # Typed sendToBackground/sendToContent/sendToActiveTab helpers
│   │   └── logger.ts              # Prefixed console logger
│   ├── engines/
│   │   ├── base-engine.ts         # Abstract class: translate(), validateConfig(), getMaxBatchSize()
│   │   ├── google-translate.ts    # Free googleapis.com endpoint, no key, single-text calls
│   │   ├── deepl-engine.ts        # DeepL API with auto free/pro endpoint detection
│   │   ├── openai-engine.ts       # Chat Completions API with translation system prompt
│   │   ├── claude-engine.ts       # Anthropic Messages API with translation system prompt
│   │   ├── microsoft-engine.ts    # Azure Cognitive Services Translator API
│   │   └── index.ts               # Factory: createEngine(type, config)
│   ├── background/
│   │   ├── index.ts               # Service worker entry point
│   │   ├── message-handler.ts     # Routes incoming messages to handlers
│   │   ├── translation-service.ts # Batching + cache lookup + engine dispatch + concurrency limit
│   │   ├── context-menu.ts        # Right-click "Translate Selection" and "Translate Page" menus
│   │   └── keyboard-shortcuts.ts  # Alt+A command listener
│   ├── content/
│   │   ├── index.ts               # Content script entry, page translation orchestrator
│   │   ├── content.css            # Bilingual block styles, loading spinner, error states
│   │   ├── dom-walker.ts          # TreeWalker to find translatable text nodes
│   │   ├── content-detector.ts    # Element exclusion filters, text script detection, page language
│   │   ├── translator-ui.ts       # Inject/remove bilingual translation blocks
│   │   ├── hover-handler.ts       # 300ms debounced hover-to-translate
│   │   ├── floating-button.ts     # Floating action button (FAB) with radial menu
│   │   ├── onboarding.ts          # First-time user onboarding tooltip
│   │   └── mutation-observer.ts   # Watches for SPA dynamic content changes
│   ├── popup/
│   │   ├── index.html             # Popup HTML shell
│   │   ├── main.tsx               # React entry point
│   │   ├── App.tsx                # Main popup + in-app settings page with slide transitions
│   │   ├── popup.css              # All popup and settings styles
│   │   ├── components/
│   │   │   ├── TranslateToggle.tsx
│   │   │   ├── LanguageSelector.tsx
│   │   │   ├── EngineSelector.tsx
│   │   │   ├── StatusIndicator.tsx
│   │   │   └── SettingsLink.tsx
│   │   └── hooks/
│   │       ├── useSettings.ts     # React hook for reading/writing chrome.storage settings
│   │       └── useTranslationState.ts  # React hook for translation active/status state
│   └── options/
│       ├── index.html
│       ├── main.tsx
│       ├── App.tsx
│       ├── options.css
│       └── components/
│           ├── ApiKeyForm.tsx
│           ├── CacheManager.tsx   # Cache stats display + clear button (also used in popup)
│           ├── EngineDefaults.tsx
│           ├── LanguageDefaults.tsx
│           └── StylePreferences.tsx
├── tests/
│   └── mocks/
│       └── chrome.ts              # Mock chrome APIs for testing
├── package.json
├── tsconfig.json
├── vite.config.ts                 # Popup + Options pages (React multi-page)
├── vite.content.config.ts         # Content script (IIFE bundle, no React)
├── vite.background.config.ts      # Service worker (ES module)
└── vitest.config.ts
```

---

## Architecture

### Build System

Three separate Vite configurations build independent bundles:

| Config                     | Output                  | Format   | Purpose                     |
| -------------------------- | ----------------------- | -------- | --------------------------- |
| `vite.config.ts`           | `popup/`, `options/`    | ES module| React popup & options pages |
| `vite.content.config.ts`   | `content/index.js`      | IIFE     | Content script (no ES modules in content scripts) |
| `vite.background.config.ts`| `background/index.js`   | ES module| Service worker              |

All three run in parallel during development via `concurrently`.

### Message Passing

Typed discriminated union messages flow between the three extension contexts:

```
┌──────────┐     TRANSLATE_REQUEST      ┌────────────┐
│  Content  │ ──────────────────────────▶│ Background │
│  Script   │◀─────────────────────────── │  (Service  │
│           │    TranslationResult       │   Worker)  │
└──────────┘                             └────────────┘
      ▲                                        ▲
      │  TOGGLE_TRANSLATION                    │
      │  TRANSLATE_PAGE                        │
      │  SETTINGS_CHANGED                      │
      │                                        │
      └──────── Popup/Options ─────────────────┘
                 (React UI)
```

**Content → Background**: `TRANSLATE_REQUEST`, `GET_SETTINGS`, `DETECT_LANGUAGE`, `VALIDATE_ENGINE`, `CLEAR_CACHE`, `GET_CACHE_STATS`

**Background/Popup → Content**: `TOGGLE_TRANSLATION`, `TRANSLATE_PAGE`, `TRANSLATE_SELECTION`, `REMOVE_TRANSLATIONS`, `SETTINGS_CHANGED`

### DOM Walking

The content script uses a `TreeWalker` to find translatable elements:

1. **Exclusion filter** — skips `<script>`, `<style>`, `<nav>`, ads, hidden elements, and the extension's own UI
2. **Translatable tags** — `P`, `H1`-`H6`, `LI`, `TD`, `TH`, `BLOCKQUOTE`, `FIGCAPTION`, `A`, `SPAN`, etc.
3. **Container fallback** — `DIV`, `SECTION`, `ARTICLE` are translated only if they have direct text content without translatable children
4. **Deduplication** — `data-immersive-translated` attribute prevents double-translation
5. **Visibility check** — only visible elements are translated

### Translation Caching

- **Storage**: IndexedDB (`immersive-translate-cache` database)
- **Key**: FNV-1a hash of `engine:sourceLang:targetLang:normalizedText`
- **Eviction**: LRU at 10,000 entries
- **TTL**: 7 days
- **Behavior**: Cache is checked before each API call; results are stored immediately after translation

### State Management

No external state library. `chrome.storage.local` is the single source of truth:

- **`useSettings` hook** reads settings on mount, subscribes to `chrome.storage.onChanged`
- **`updateSettings`** writes partial updates and broadcasts to all tabs
- **Content script** listens for `SETTINGS_CHANGED` messages to apply changes retroactively

---

## Getting Started

### Prerequisites

- Node.js 18+
- npm 9+
- Chrome 116+ (Manifest V3 support)

### Installation

```bash
git clone <repo-url>
cd translate
npm install
```

### Development

```bash
npm run dev
```

This starts all three Vite watchers in parallel. Load the `dist/` folder in Chrome:

1. Open `chrome://extensions`
2. Enable **Developer mode**
3. Click **Load unpacked** and select the `dist/` directory
4. The extension icon appears in the toolbar

### Production Build

```bash
npm run build
```

Outputs to `dist/` with minified bundles.

### Other Commands

| Command             | Description                              |
| ------------------- | ---------------------------------------- |
| `npm run dev`       | Watch mode for all three bundles         |
| `npm run build`     | Production build                         |
| `npm run clean`     | Remove `dist/` directory                 |
| `npm run lint`      | ESLint check                             |
| `npm run typecheck` | TypeScript type checking                 |
| `npm run test`      | Run tests with Vitest                    |
| `npm run test:watch`| Run tests in watch mode                  |

---

## Configuration

### API Keys

Open the popup and click the **gear icon** (or "All settings" link) to access the in-app settings page. Enter your API keys for any engine under the **API Keys** section.

- **Google Translate** — no key needed (uses free endpoint)
- **DeepL** — get a key at [deepl.com/pro](https://www.deepl.com/pro). Free keys end with `:fx`
- **OpenAI** — get a key at [platform.openai.com](https://platform.openai.com/api-keys)
- **Claude** — get a key at [console.anthropic.com](https://console.anthropic.com/)
- **Microsoft Translator** — get a key via [Azure Cognitive Services](https://azure.microsoft.com/en-us/products/ai-services/ai-translator)

If the selected engine requires an API key and none is configured, the **Translate Page** button is disabled with an "API Key Required" message.

### Display Modes

- **Replace** — original text is replaced with the translation
- **Bilingual** — translation is shown below the original text with an accent border

Switching modes while a page is translated will automatically re-translate with the new mode.

### Style Customization

In settings, customize:

- **Font size** — 70%–120% of the original text size
- **Text color** — color picker for translation text
- **Italic** — toggle italic style for translations

---

## Permissions

| Permission       | Reason                                           |
| ---------------- | ------------------------------------------------ |
| `activeTab`      | Access the current tab's DOM for translation      |
| `storage`        | Persist settings and engine configurations        |
| `contextMenus`   | Right-click "Translate Selection/Page" menu items |
| `scripting`      | Inject content scripts programmatically           |

### Host Permissions

API endpoints for each translation engine:

- `https://translate.googleapis.com/*`
- `https://api-free.deepl.com/*` / `https://api.deepl.com/*`
- `https://api.openai.com/*`
- `https://api.anthropic.com/*`
- `https://api.cognitive.microsofttranslator.com/*`

---

## Tech Stack

| Layer        | Technology                    |
| ------------ | ----------------------------- |
| UI Framework | React 19                      |
| Language     | TypeScript 5.7                |
| Build Tool   | Vite 6                        |
| Testing      | Vitest 2                      |
| Extension    | Chrome Manifest V3            |
| Cache        | IndexedDB                     |
| Styling      | Plain CSS with CSS variables  |

---

## License

MIT
