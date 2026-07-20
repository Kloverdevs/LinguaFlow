# LinguaFlow

**Open-source bilingual webpage translation extension for Chrome & Firefox.**

LinguaFlow translates web pages, PDFs, and images in-place, showing translations alongside the original text. It supports 11 translation engines (6 free, 4 paid, plus an offline on-device engine), 29 languages, hover-to-translate mode, double-click dictionary lookups, a rich text-selection popup, a fully localized UI in 11 languages, and a draggable floating action button for quick access.

Built with **React 19**, **TypeScript 5.7**, **Vite 6**, and **Manifest V3** — packaged for both **Chrome** (`dist/`) and **Firefox** (`dist-firefox/`).

---

## Features

- **Bilingual display** — translated text appears below each original paragraph with an accent border
  <br>
  <img src="./store-assets/store_screenshot_1_final.png" width="800" alt="Bilingual Mode Example" />
- **Replace mode** — swap original text with translation entirely
- **11 translation engines** — 6 free (no API key), 4 paid with API key validation, plus an offline on-device engine (Chrome Built-in AI)
- **29 languages** — auto-detect source language, 28 target languages
- **Hover translate** — hover over any paragraph to translate it individually (300ms debounce); works independently alongside full-page translation
- **Floating Action Button (FAB)** — draggable on-page button with radial menu for Translate Page, Restore Original, Bilingual Mode, and Hover Translate. Configurable size (32–72px), remembers its position across page loads, and can be disabled in settings
- **Auto-detect & prompt** — when a page is in a foreign language, a slim top bar offers to translate it (Translate / Always for this site / dismiss); honors auto- and never-translate lists and per-session dismissals
- **Keyboard shortcuts** — `Alt+A` toggle translation, `Ctrl+Shift+H` toggle hover mode, `Ctrl+Shift+S` translate selection
- **Context menu** — right-click "Translate Selection" or "Translate Page"
- **Smart content detection** — identifies main content areas (`<article>`, `<main>`, `[role="main"]`) with text-density scoring fallback; skips nav, footer, sidebar, ads, scripts
- **SPA support** — MutationObserver watches for dynamically added content
- **Translation cache** — IndexedDB-backed LRU cache (10,000 entries, 7-day TTL)
- **UI localization** — extension UI in 11 languages: English, Spanish, French, German, Portuguese, Italian, Chinese, Japanese, Korean, Russian, Arabic (auto-detects browser language)
- **Theme support** — light, dark, and system-auto themes
- **Customizable translation style** — font size, font family, text color, border color, italic toggle
- **Popup scaling** — adjust popup size for accessibility
- **Site lists** — auto-translate and never-translate domain lists
- **API key management** — per-engine configuration with validation
- **Selection popup** — select text to translate, compare a second engine, get an LLM grammar explanation, listen via text-to-speech, or save the word to your vocabulary list
- **Dictionary lookups** — double-click any word for an inline definition popup
- **Reading mode** — extract and translate the main article (Readability-powered), with an optional dyslexia-friendly font
- **PDF translation** — split-view native renderer for local and online PDFs
- **Image OCR** — right-click "Inspect Image Text" to OCR and translate flat images (Tesseract.js)
- **Live captions & video subtitles** — translate on-screen captions and video subtitle tracks
- **Per-site rules** — pin a specific engine and target language per domain
- **Formality control** — auto/formal/informal tone on supported engines
- **Settings sync** — optional `storage.sync` of preferences (API keys are never synced)
- **Guided product tour** — optional interactive walkthrough
- **Onboarding** — first-time tooltip guiding new users
- **253 unit tests** across 26 test files

---

## Translation Engines

### Free (no API key required)

| Engine | Notes |
|--------|-------|
| **Google Translate** | Free `translate.googleapis.com` endpoint |
| **Bing Translate** | Microsoft Edge translation service |
| **Yandex Translate** | Yandex translation service |
| **Lingva** | Privacy-focused Google Translate proxy |
| **MyMemory** | Crowdsourced translation memory |
| **LibreTranslate** | Open source, self-hostable |

### Paid (API key required)

| Engine | Default Model | Notes |
|--------|---------------|-------|
| **DeepL** | — | High-quality neural translation; auto-detects free vs pro key |
| **OpenAI** | `gpt-4o-mini` | GPT-powered translation via Chat Completions API |
| **Claude** | `claude-sonnet-4-5-20250514` | Anthropic Messages API |
| **Microsoft Translator** | — | Azure Cognitive Services |

Configure API keys in **Settings > API Keys**. Each engine has a **Validate** button to test your key before use.

### Offline (on-device, no key)

| Engine | Notes |
|--------|-------|
| **Chrome Built-in AI** | Private on-device translation via Chrome's built-in Translator API (Chrome 138+ with the built-in AI translation feature available) |

---

## Supported Languages

Auto Detect, English, Chinese (Simplified & Traditional), Japanese, Korean, French, German, Spanish, Portuguese, Russian, Arabic, Hindi, Italian, Dutch, Thai, Vietnamese, Indonesian, Turkish, Polish, Swedish, Danish, Finnish, Greek, Czech, Romanian, Hungarian, Ukrainian, Hebrew.

---

## Getting Started

### Prerequisites

- Node.js 18+
- npm 9+
- Chrome 116+ or Firefox 142+ (Manifest V3 support)

### Install & Build

```bash
git clone <repo-url>
cd linguaflow
npm install
npm run build
```

`npm run build` produces both browser bundles plus packaged zips:
- `dist/` + `linguaflow-chrome.zip` — Chrome / Edge / Brave
- `dist-firefox/` + `linguaflow-firefox.zip` — Firefox

**Chrome / Edge / Brave**
1. Open `chrome://extensions`
2. Enable **Developer mode** (top right)
3. Click **Load unpacked** and select the `dist/` folder

**Firefox**
1. Open `about:debugging#/runtime/this-firefox`
2. Click **Load Temporary Add-on…**
3. Select `dist-firefox/manifest.json`

### Development

```bash
npm run dev
```

Starts all three Vite watchers in parallel (popup/options, content script, background service worker). Changes rebuild automatically — reload the extension in Chrome to pick them up.

### Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Watch mode for all three bundles |
| `npm run build` | Production build for Chrome + Firefox, then zip |
| `npm run build:chrome` | Chrome-only build to `dist/` |
| `npm run build:firefox` | Firefox-only build to `dist-firefox/` |
| `npm run zip:source` | Package reproducible source into `linguaflow-source.zip` |
| `npm run test` | Run 253 unit tests with Vitest |
| `npm run test:watch` | Run tests in watch mode |
| `npm run lint` | ESLint check |
| `npm run typecheck` | TypeScript type checking |
| `npm run clean` | Remove build output (`dist/`, `dist-firefox/`) and zips |

### Building for store reviewers (reproducible)

The submitted store packages are minified Vite output. To reproduce them exactly
from source (e.g. for Firefox Add-on review):

```bash
npm ci              # install exact, pinned dependencies from package-lock.json
npm run build       # writes dist/ + dist-firefox/ and both store zips
```

- `npm run build:firefox` alone produces the Firefox add-on in `dist-firefox/`
  (contents are identical to `linguaflow-firefox.zip`).
- `npm run build:chrome` alone produces the Chrome build in `dist/`.
- Per-target manifests are generated by `scripts/build-manifest.mjs`
  (`TARGET=chrome` uses `background.service_worker`; `TARGET=firefox` uses
  `background.scripts` + `browser_specific_settings.gecko`, `strict_min_version` 142.0).
- `npm run zip:source` regenerates `linguaflow-source.zip` (excludes
  `node_modules/`, `.git/`, `dist*/` and existing zips; includes `package-lock.json`
  for a byte-for-byte reproducible install).

**Reference build environment:** Node.js 24.12.0 (Node 18 LTS+ works), npm 11.6.2.

---

## Usage

### Translate a page

1. Navigate to any webpage
2. Click the LinguaFlow icon in the toolbar (or press `Alt+A`)
3. Select your target language and translation engine
4. Click **Translate Page**
5. Translated text appears below each paragraph

### Hover mode

1. Toggle **Hover Translation** in the popup or FAB menu
2. Hover over any paragraph — it highlights and translates after a brief pause
3. Hover mode works independently: enable it alongside full-page translation, and only hovered paragraphs get individually translated while the rest remain stable

<img src="./store-assets/store_screenshot_2_final.png" width="800" alt="Hover & Selection Translation" />

### Floating Action Button (FAB)

A draggable button on every page with quick actions:
- **Translate Page** / **Restore Original**
- **Bilingual Mode** toggle
- **Hover Translate** toggle



Drag it anywhere on the page — its position is remembered across page loads. In Settings, you can disable the FAB or adjust its size (32–72px). The FAB menu translates when you change the UI language.

### Context menu & Images

Right-click on a page or image for:
- **Translate Selection** — translates only highlighted text
- **Translate Page** — translates the entire page
- **Inspect Image Text** — invokes built-in OCR to analyze and translate flat images

<img src="./store-assets/store_screenshot_3_final.png" width="800" alt="Image OCR Translation" />

### PDF Rendering

Drop a local PDF or visit an online PDF to activate the split-view native renderer. LinguaFlow intercepts the file, preserves identical structural formatting, and allows parallel block translations natively over the canvas.

<img src="./store-assets/store_screenshot_4_final.png" width="800" alt="Split-screen PDF Translation" />

---

## Settings

Access settings via the gear icon in the popup. The sleek interfaces allow deep customization:
<br>


| Section | Options |
|---------|---------|
| **General** | Source language, target language, display mode (bilingual/replace), auto-detect & prompt |
| **Engine** | Select active engine, filter by free/paid |
| **API Keys** | Per-engine key input with Validate button |
| **Translation Style** | Font size (70–120%), font family, text color, border color, italic |
| **Interface** | Theme (light/dark/system), UI language (11 locales), popup scale |
| **Floating Button** | Enable/disable FAB, adjust size (32–72px) |
| **Shortcuts** | `Alt+A` toggle translation, `Ctrl+Shift+H` hover mode, `Ctrl+Shift+S` translate selection |
| **Data** | Cache stats and clear button |
| **Site Lists** | Auto-translate domains, never-translate domains |

---

## Project Structure

```
linguaflow/
├── public/
│   ├── manifest.json              # Base Manifest V3 (Chrome + Firefox variants generated at build)
│   ├── _locales/                  # Native manifest i18n (name/description)
│   ├── pdfjs/                      # Bundled PDF.js viewer assets
│   ├── tesseract/                 # Bundled Tesseract.js OCR assets
│   └── icons/                     # Extension icons (16/32/48/128px + logo)
├── src/
│   ├── types/                     # TypeScript interfaces & enums
│   │   ├── translation.ts         # TranslationEngine enum, Request/Result types
│   │   ├── settings.ts            # UserSettings, TranslationStyle, UILocale
│   │   ├── messages.ts            # Discriminated union message types
│   │   └── dom.ts                 # TranslatableNode interface
│   ├── constants/
│   │   ├── languages.ts           # 29 languages with ISO codes
│   │   ├── engines.ts             # 11 engine definitions (name, color, requiresKey)
│   │   └── defaults.ts            # Default settings values
│   ├── shared/
│   │   ├── storage.ts             # Typed storage wrapper (local + optional sync)
│   │   ├── cache.ts               # IndexedDB cache (FNV-1a hash, LRU, 7-day TTL)
│   │   ├── message-bus.ts         # Typed message helpers
│   │   ├── i18n.ts                # 11-locale i18n system with flag emoji support
│   │   ├── glossary-store.ts      # Custom glossary term overrides
│   │   ├── vocab-store.ts         # Saved vocabulary entries
│   │   ├── site-rulesHelper.ts    # Per-site rule resolution
│   │   └── logger.ts              # Prefixed console logger
│   ├── engines/
│   │   ├── base-engine.ts         # Abstract base class
│   │   ├── google-translate.ts    # Free endpoint, no key
│   │   ├── bing-free-engine.ts    # Free Bing translation
│   │   ├── yandex-engine.ts       # Free Yandex translation
│   │   ├── lingva-engine.ts       # Privacy-focused proxy
│   │   ├── libre-engine.ts        # Open source engine
│   │   ├── mymemory-engine.ts     # Crowdsourced memory
│   │   ├── deepl-engine.ts        # DeepL API (free/pro auto-detect)
│   │   ├── openai-engine.ts       # GPT Chat Completions
│   │   ├── claude-engine.ts       # Anthropic Messages API
│   │   ├── microsoft-engine.ts    # Azure Cognitive Services
│   │   ├── chrome-builtin-engine.ts # Offline on-device Translator API
│   │   └── index.ts               # Engine factory
│   ├── background/
│   │   ├── index.ts               # Service worker entry
│   │   ├── message-handler.ts     # Message routing
│   │   ├── translation-service.ts # Batching, caching, engine dispatch
│   │   ├── context-menu.ts        # Right-click menu items
│   │   └── keyboard-shortcuts.ts  # Alt+A listener
│   ├── content/
│   │   ├── index.ts               # Content script orchestrator
│   │   ├── content.css            # Bilingual block styles, spinners
│   │   ├── safe-dom.ts            # Trusted-HTML / sanitized DOM helpers
│   │   ├── dom-walker.ts          # TreeWalker for translatable nodes
│   │   ├── content-detector.ts    # Content area heuristics, exclusion filters
│   │   ├── translator-ui.ts       # Inject/remove bilingual blocks
│   │   ├── translation-progress.ts # On-page progress indicator
│   │   ├── hover-handler.ts       # 300ms debounced hover translate
│   │   ├── selection-popup.ts     # Selection translate/compare/explain/TTS/save
│   │   ├── dictionary-popup.ts    # Double-click word definition popup
│   │   ├── reading-mode.ts        # Readability article extraction + translation
│   │   ├── pdf-handler.ts         # Local/online PDF split-view rendering
│   │   ├── image-translator.ts    # Image OCR translation (Tesseract.js)
│   │   ├── live-captions.ts       # On-screen caption translation
│   │   ├── video-subtitles.ts     # Video subtitle track translation
│   │   ├── floating-button.ts     # Draggable FAB with i18n labels + position persistence
│   │   ├── translate-prompt.ts    # Auto-detect language & offer-to-translate bar
│   │   ├── onboarding.ts          # First-time tooltip
│   │   ├── product-tour.ts        # Optional guided walkthrough (driver.js)
│   │   └── mutation-observer.ts   # SPA content change watcher
│   ├── popup/
│   │   ├── index.html             # Popup shell
│   │   ├── main.tsx               # React entry
│   │   ├── App.tsx                # Popup + in-app settings with slide transitions
│   │   ├── popup.css              # All popup styles
│   │   ├── components/            # TranslateToggle, LanguageSelector, EngineSelector, etc.
│   │   └── hooks/
│   │       ├── useSettings.ts     # Settings read/write hook
│   │       └── useTranslationState.ts  # Translation state hook
│   └── options/
│       ├── index.html
│       ├── main.tsx
│       ├── App.tsx                # Full options page with tabs
│       ├── options.css
│       └── components/            # ApiKeyForm, CacheManager, StylePreferences, SiteRulesManager, etc.
├── src/welcome/                   # Post-install welcome page (React)
├── tests/
│   ├── mocks/chrome.ts            # Chrome API mocks for Vitest
│   └── unit/                      # 253 tests across 26 files
│       ├── engines/               # Tests for all engine implementations
│       ├── content/               # content-detector, dom-walker, hover-handler, translator-ui, pdf-handler
│       ├── shared/                # storage, message-bus, i18n, logger
│       ├── constants/             # defaults, engines
│       └── background/            # translation-service
├── vite.config.ts                 # Popup + Options (React multi-page)
├── vite.content.config.ts         # Content script (IIFE)
├── vite.background.config.ts      # Service worker (ES module)
└── vitest.config.ts               # Test configuration (jsdom)
```

---

## Architecture

### Build System

Three separate Vite configurations produce independent bundles:

| Config | Entry | Format | Output |
|--------|-------|--------|--------|
| `vite.config.ts` | Popup + Options + Welcome HTML | ES modules | `dist/popup/`, `dist/options/`, `dist/welcome/` |
| `vite.content.config.ts` | `src/content/index.ts` | IIFE | `dist/content/index.js` |
| `vite.background.config.ts` | `src/background/index.ts` | ES module | `dist/background/index.js` |

All three run in parallel during development via `concurrently`.

A cross-browser manifest is generated per target by `scripts/build-manifest.mjs` — Chrome uses `background.service_worker`; Firefox uses `background.scripts` plus `browser_specific_settings`. `npm run build` runs the full pipeline for both `dist/` (Chrome) and `dist-firefox/` (Firefox) and zips each.

### Message Passing

Typed discriminated union messages flow between contexts:

```
┌──────────┐     TRANSLATE_REQUEST      ┌────────────┐
│  Content  │ ──────────────────────────>│ Background │
│  Script   │<────────────────────────── │  (Service  │
│           │    TranslationResult       │   Worker)  │
└──────────┘                             └────────────┘
      ^                                        ^
      │  TOGGLE_TRANSLATION                    │
      │  TRANSLATE_PAGE                        │
      │  SETTINGS_CHANGED                      │
      │                                        │
      └──────── Popup/Options ─────────────────┘
                 (React UI)
```

### DOM Walking

1. **Exclusion filter** — skips `<script>`, `<style>`, `<nav>`, ads, hidden elements, and the extension's own UI
2. **Translatable tags** — `P`, `H1`–`H6`, `LI`, `TD`, `TH`, `BLOCKQUOTE`, `FIGCAPTION`, `A`, `SPAN`, etc.
3. **Container fallback** — `DIV`, `SECTION`, `ARTICLE` translated only if they have direct text without translatable children
4. **Deduplication** — `data-immersive-translated` attribute prevents double-translation

### Translation Cache

- **Storage**: IndexedDB (`immersive-translate-cache`)
- **Key**: FNV-1a hash of `engine:sourceLang:targetLang:normalizedText`
- **Eviction**: LRU at 10,000 entries
- **TTL**: 7 days

### State Management

No external state library. `chrome.storage.local` is the single source of truth:

- `useSettings` hook reads on mount, subscribes to `chrome.storage.onChanged`
- `updateSettings` writes partial updates and broadcasts to all tabs
- Content script listens for `SETTINGS_CHANGED` to apply changes in real-time (theme, locale, FAB size/visibility, etc.)

---

## Permissions

| Permission | Reason |
|------------|--------|
| `activeTab` | Access the current tab's DOM for translation |
| `storage` | Persist settings and engine configurations |
| `contextMenus` | Right-click "Translate Selection/Page" menu items |
| `scripting` | Inject content scripts when needed |

### Host Permissions

API endpoints for each translation engine:

- `https://translate.googleapis.com/*`
- `https://api-free.deepl.com/*` / `https://api.deepl.com/*`
- `https://api.openai.com/*`
- `https://api.anthropic.com/*`
- `https://api.cognitive.microsofttranslator.com/*` / `https://api-edge.cognitive.microsofttranslator.com/*`
- `https://translate.yandex.net/*` / `https://translate.yandex.com/*`
- `https://api.mymemory.translated.net/*`
- `https://libretranslate.com/*`
- `https://lingva.ml/*`

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| UI Framework | React 19 |
| Language | TypeScript 5.7 |
| Build Tool | Vite 6 |
| Testing | Vitest 2 (253 tests, jsdom) |
| Extension | Manifest V3 (Chrome + Firefox) |
| Cache | IndexedDB |
| Styling | Plain CSS |

---

## Contributing

Contributions are welcome! This is an open-source project. Feel free to open issues and pull requests.

## License

MIT
