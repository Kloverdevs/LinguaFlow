# LinguaFlow Implementation Plan

Prioritized roadmap based on the competitive audit. Organized into 5 phases with estimated effort and dependencies.

---

## Phase 1: Quick Wins (1-2 weeks)
*Low effort, high impact. No architectural changes needed.*

### 1.1 Expand language support (29 → 100+)
- **Files**: `src/constants/languages.ts`
- **Work**: Add ~70 more language entries (ISO 639-1 codes, display names)
- **Impact**: Dramatically improves Chrome Web Store appeal; most competitors have 100+
- **Effort**: Small — data entry only

### 1.2 Text-to-Speech for translations
- **Files**: `src/content/translator-ui.ts`, `src/content/content.css`
- **Work**: Add a small speaker icon on each bilingual block; on click, use `window.speechSynthesis.speak()` with the target language voice
- **Dependencies**: None — Web Speech API is built into all browsers
- **Effort**: Small

### 1.3 Formality toggle (formal/informal)
- **Files**: `src/types/settings.ts`, `src/constants/defaults.ts`, `src/popup/App.tsx`, `src/shared/i18n.ts`
- **Engine files**: `src/engines/deepl-engine.ts` (DeepL has native `formality` parameter), `src/engines/openai-engine.ts`, `src/engines/claude-engine.ts` (add to system prompt)
- **Work**: Add `formality: 'auto' | 'formal' | 'informal'` setting; pass to engines
- **Effort**: Small-Medium

### 1.4 Improved AI translation prompts
- **Files**: `src/engines/openai-engine.ts`, `src/engines/claude-engine.ts`
- **Work**: Better system prompts — domain-aware, tone-preserving, cultural adaptation, handle idioms naturally, preserve markdown/HTML structure
- **Effort**: Small

### 1.5 "Show original on hover" in replace mode
- **Files**: `src/content/translator-ui.ts`, `src/content/content.css`
- **Work**: In replace mode, store original text in `data-original-text` attribute; on hover, show original in a tooltip
- **Effort**: Small

### 1.6 IntersectionObserver for visible-first translation
- **Files**: `src/content/index.ts`
- **Work**: Instead of translating all nodes top-to-bottom, use IntersectionObserver to prioritize visible viewport elements first, then translate off-screen elements
- **Effort**: Small-Medium

### 1.7 Translation progress indicator
- **Files**: `src/content/floating-button.ts`, `src/content/content.css`
- **Work**: Show "12/47" or a progress ring on the FAB during translation
- **Effort**: Small

### 1.8 More keyboard shortcuts
- **Files**: `public/manifest.json`, `src/background/keyboard-shortcuts.ts`
- **Work**: Add `Ctrl+Shift+H` for hover mode toggle, `Ctrl+Shift+S` for selection mode
- **Effort**: Small

### 1.9 Engine fallback on failure
- **Files**: `src/background/translation-service.ts`
- **Work**: If the selected engine fails (network error, rate limit), automatically retry with a free fallback engine (Google → Bing → Lingva)
- **Effort**: Small-Medium

### 1.10 Smooth translation animations
- **Files**: `src/content/content.css`, `src/content/translator-ui.ts`
- **Work**: Fade-in animation for bilingual blocks instead of sudden appearance; skeleton loading state
- **Effort**: Small

---

## Phase 2: Competitive Parity (3-4 weeks)
*Medium effort. These are features most serious competitors already have.*

### 2.1 YouTube dual subtitle translation
- **New files**: `src/content/video-subtitles.ts`, `src/content/video-subtitles.css`
- **Modified**: `src/content/index.ts`, `public/manifest.json` (add youtube.com content script match)
- **Work**:
  - Detect YouTube player and subtitle/caption container
  - MutationObserver on subtitle DOM for new caption text
  - Translate each caption line and display below original (dual subtitle)
  - Support play/pause sync, font size matching
  - Handle ad breaks (pause translation during ads)
- **Effort**: Large
- **Priority**: Very High — #1 most requested feature across market

### 2.2 PDF translation with bilingual display
- **New files**: `src/content/pdf-handler.ts`, `src/popup/components/PdfTranslate.tsx`
- **Work**:
  - Detect PDF viewer pages (Chrome's built-in PDF viewer, pdf.js)
  - Extract text layers from PDF
  - Option 1: Render translated PDF in a side panel (bilingual view)
  - Option 2: Overlay translations on existing PDF text
  - Preserve layout, images, tables
- **Dependencies**: May need pdf.js library for text extraction
- **Effort**: Large
- **Priority**: High — every serious competitor has this

### 2.3 Word-level dictionary popup on double-click
- **New files**: `src/content/dictionary-popup.ts`, `src/content/dictionary-popup.css`
- **Work**:
  - Listen for `dblclick` events on text nodes
  - Extract the double-clicked word
  - Translate just that word + show definition, pronunciation, part of speech
  - Use existing engine for word translation
  - Optional: show romanization/pinyin for CJK
- **Effort**: Medium

### 2.4 Improved selection translation popup
- **Files**: `src/content/index.ts` (refactor `createSelectionTooltip`)
- **New files**: `src/content/selection-popup.ts`, `src/content/selection-popup.css`
- **Work**:
  - Resizable popup window (not just a tooltip)
  - Pinnable (stays open when clicking elsewhere)
  - Copy translated text button
  - TTS button
  - Show source/target language labels
  - Engine indicator
- **Effort**: Medium

### 2.5 Vocabulary saving with export
- **New files**: `src/shared/vocabulary.ts`, `src/popup/components/VocabList.tsx`, `src/options/components/VocabManager.tsx`
- **Types**: Add `VocabEntry` to `src/types/`
- **Work**:
  - "Save word" button on dictionary popup and selection popup
  - Store in `chrome.storage.local` (or IndexedDB for large lists)
  - Vocabulary list viewer in popup/options
  - Export to Anki deck format (.apkg or tab-separated for AnkiWeb import)
  - Export to CSV
  - Include context sentence, source URL, timestamp
- **Effort**: Medium-Large

### 2.6 Per-site engine and language rules
- **Files**: `src/types/settings.ts`, `src/popup/App.tsx`, `src/content/index.ts`
- **Work**:
  - Add `siteRules: Record<string, { engine?: TranslationEngine, targetLang?: string }>` to settings
  - UI to configure per-domain rules
  - Content script checks hostname against rules before translating
  - Falls back to global settings if no rule matches
- **Effort**: Medium

### 2.7 Settings import/export
- **Files**: `src/options/components/SettingsBackup.tsx`, `src/options/App.tsx`
- **Work**:
  - Export all settings as JSON file
  - Import from JSON file with validation
  - Merge vs replace option
- **Effort**: Small-Medium

### 2.8 Streaming translations for LLM engines
- **Files**: `src/engines/openai-engine.ts`, `src/engines/claude-engine.ts`, `src/content/translator-ui.ts`
- **Work**:
  - Use streaming API endpoints for OpenAI and Claude
  - Show translation text as it generates (character by character)
  - Requires refactoring background→content communication to support streaming
- **Effort**: Medium-Large

---

## Phase 3: Differentiation (4-6 weeks)
*Features that set LinguaFlow apart from competitors.*

### 3.1 Chrome Translator API integration (offline/on-device)
- **New files**: `src/engines/chrome-builtin-engine.ts`
- **Files**: `src/types/translation.ts` (add engine enum), `src/constants/engines.ts`
- **Work**:
  - Detect if Chrome Translator API is available (`'translation' in self`)
  - Download language packs on demand
  - Use `translator.translate()` for on-device translation
  - Mark as "Offline" engine with privacy badge
  - No API key, no network, completely private
- **Dependencies**: Chrome 138+ (released 2025)
- **Effort**: Medium
- **Priority**: High — $1.9B market, almost nobody supports this yet

### 3.2 Custom glossary system
- **New files**: `src/shared/glossary.ts`, `src/options/components/GlossaryManager.tsx`
- **Types**: `src/types/glossary.ts`
- **Work**:
  - UI to create/edit glossary entries (source term → target term)
  - Apply glossary before sending to engine (for all engines)
  - Post-process translations to enforce glossary terms
  - Import/export glossaries (CSV, JSON)
  - Per-domain glossaries (e.g., medical terms for medical sites)
- **Effort**: Medium-Large

### 3.3 Engine comparison mode
- **New files**: `src/content/comparison-view.ts`, `src/content/comparison-view.css`
- **Work**:
  - New display mode: "Compare" — translates with 2-3 engines and shows results side-by-side
  - User picks which translation is best
  - Useful for professional translators and language learners
- **Effort**: Medium

### 3.4 Grammar explanations via LLM
- **New files**: `src/content/grammar-panel.ts`
- **Work**:
  - Button on bilingual blocks: "Explain grammar"
  - Sends original + translation to OpenAI/Claude with grammar analysis prompt
  - Shows breakdown: word-by-word mapping, grammar rules, literal vs natural translation
  - Only available when an LLM engine is configured
- **Effort**: Medium

### 3.5 Cross-device settings sync
- **Files**: `src/shared/storage.ts`
- **Work**:
  - Migrate settings from `chrome.storage.local` to `chrome.storage.sync`
  - Sync vocabulary, glossaries, site rules across devices
  - Handle storage limits (sync has 100KB limit — may need selective sync)
- **Effort**: Small-Medium

### 3.6 Accessibility features
- **Files**: `src/content/content.css`, `src/types/settings.ts`, `src/popup/App.tsx`
- **Work**:
  - Option: dyslexia-friendly font (OpenDyslexic) for translated text
  - Option: high-contrast mode for translations
  - Ensure all injected elements are screen-reader accessible (proper ARIA labels)
  - TTS auto-read option (read translations aloud automatically)
  - Configurable font size range (larger than current 70-120%)
- **Effort**: Medium

### 3.7 Reading mode integration
- **New files**: `src/content/reading-mode.ts`, `src/content/reading-mode.css`
- **Work**:
  - Strip page clutter (ads, nav, sidebar, comments)
  - Present clean article text with bilingual translations
  - Customizable background color, font, spacing
  - Inspired by Firefox Reader View + translation
- **Effort**: Medium-Large

---

## Phase 4: Growth Features (6-8 weeks)
*Features that expand the market and enable monetization.*

### 4.1 Netflix dual subtitle translation
- **New files**: `src/content/netflix-subtitles.ts`
- **Work**:
  - Detect Netflix player and subtitle container
  - Translate subtitles in real-time
  - Handle timing synchronization with video playback
  - Ad break handling
  - Language pair selector for subtitles
- **Dependencies**: Phase 2.1 (YouTube subtitles) — shares architecture
- **Effort**: Large

### 4.2 EPUB e-book translation
- **New files**: `src/content/epub-handler.ts`
- **Work**:
  - Detect EPUB reader pages or provide built-in EPUB viewer
  - Extract chapters and text
  - Bilingual display per paragraph
  - Reading progress tracking
- **Effort**: Large

### 4.3 Image/OCR translation
- **New files**: `src/content/ocr-translate.ts`
- **Dependencies**: Tesseract.js or similar OCR library
- **Work**:
  - Right-click on image → "Translate text in image"
  - OCR text extraction → translate → overlay on image
  - Support for screenshots, manga, signs
- **Effort**: Large

### 4.4 Spaced repetition (SRS) system
- **New files**: `src/popup/components/SrsReview.tsx`, `src/shared/srs.ts`
- **Dependencies**: Phase 2.5 (vocabulary saving)
- **Work**:
  - SM-2 algorithm for scheduling reviews
  - Review interface in popup or standalone tab
  - Show word in context (original sentence from where it was saved)
  - Text, audio, and typing practice modes
- **Effort**: Large

### 4.5 Meeting translation (Zoom/Google Meet)
- **New files**: `src/content/meeting-captions.ts`
- **Work**:
  - Detect Zoom/Google Meet/Teams caption containers
  - Translate captions in real-time
  - Show bilingual captions as overlay
- **Effort**: Very Large

### 4.6 Community shared glossaries
- **Backend required**: API server for glossary storage
- **New files**: `src/shared/community-api.ts`, `src/options/components/CommunityGlossaries.tsx`
- **Work**:
  - Upload/download glossaries from shared repository
  - Domain-specific glossaries (medical, legal, technical)
  - Voting/quality scoring
- **Effort**: Very Large (requires backend)

---

## Phase 5: Monetization (ongoing)
*Features that justify a Pro tier.*

### 5.1 Pricing structure
**Free (forever):**
- All 6 free engines
- Full page translation, bilingual mode, hover translate
- FAB, keyboard shortcuts, context menu
- 11 UI languages, 100+ translation languages
- Translation cache
- Basic vocabulary saving (up to 100 words)
- Chrome Translator API (offline)

**Pro ($5/month or $48/year):**
- Premium AI engines (BYOK — user provides own API keys for DeepL, OpenAI, Claude, Microsoft)
- PDF translation
- YouTube/Netflix dual subtitles
- Custom glossary (unlimited entries)
- Grammar explanations
- Engine comparison mode
- Vocabulary saving (unlimited) + Anki export
- Per-site engine/language rules
- Settings sync across devices
- Priority support

### 5.2 Implementation
- **New files**: `src/shared/license.ts`, `src/popup/components/ProBadge.tsx`
- **Work**:
  - License key validation (could use Gumroad, LemonSqueezy, or Stripe)
  - Feature gating in content script and popup
  - "Pro" badge on premium features
  - Trial period (7 days)
- **Effort**: Medium

---

## Dependency Graph

```
Phase 1 (no dependencies — all can start immediately)
  │
  ├── 1.1 Languages ──────────────────────────────────┐
  ├── 1.2 TTS ────────────────────────────────────────┤
  ├── 1.3 Formality ──────────────────────────────────┤
  ├── 1.4 AI Prompts ─────────────────────────────────┤
  ├── 1.5 Show Original ──────────────────────────────┤
  ├── 1.6 IntersectionObserver ───────────────────────┤
  ├── 1.7 Progress Indicator ─────────────────────────┤
  ├── 1.8 Keyboard Shortcuts ─────────────────────────┤
  ├── 1.9 Engine Fallback ────────────────────────────┤
  └── 1.10 Animations ───────────────────────────────┤
                                                      │
Phase 2 (can start after Phase 1, mostly independent) │
  ├── 2.1 YouTube Subtitles ──────┐                   │
  ├── 2.2 PDF Translation        │                   │
  ├── 2.3 Dictionary Popup ──────┼── 2.5 Vocabulary  │
  ├── 2.4 Selection Popup ───────┘        Saving     │
  ├── 2.6 Per-site Rules                             │
  ├── 2.7 Settings Import/Export                     │
  └── 2.8 Streaming Translations                     │
                                                      │
Phase 3 (can start after Phase 1, mostly independent) │
  ├── 3.1 Chrome Translator API (offline)            │
  ├── 3.2 Custom Glossary                            │
  ├── 3.3 Engine Comparison                          │
  ├── 3.4 Grammar Explanations                       │
  ├── 3.5 Cross-device Sync                          │
  ├── 3.6 Accessibility                              │
  └── 3.7 Reading Mode                               │
                                                      │
Phase 4 (depends on earlier phases)                   │
  ├── 4.1 Netflix Subtitles ← 2.1 YouTube           │
  ├── 4.2 EPUB Translation                           │
  ├── 4.3 Image/OCR Translation                      │
  ├── 4.4 SRS System ← 2.5 Vocabulary               │
  ├── 4.5 Meeting Translation                        │
  └── 4.6 Community Glossaries ← 3.2 Glossary       │
                                                      │
Phase 5 (can start after Phase 2 features exist)      │
  └── 5.1-5.2 Monetization / Pro tier                │
```

---

## Priority Matrix

| Feature | User Impact | Effort | Competitive Gap | Priority |
|---------|-----------|--------|----------------|----------|
| More languages (100+) | Very High | Small | Critical | **P0** |
| YouTube subtitles | Very High | Large | Critical | **P0** |
| TTS | High | Small | High | **P1** |
| PDF translation | High | Large | Critical | **P1** |
| IntersectionObserver | High | Small | Medium | **P1** |
| Formality toggle | Medium | Small | Medium | **P1** |
| AI prompt improvements | High | Small | High | **P1** |
| Chrome offline API | High | Medium | Very High (first mover) | **P1** |
| Dictionary popup | High | Medium | High | **P2** |
| Vocabulary saving | High | Medium | High | **P2** |
| Custom glossary | High | Medium | Very High (rare) | **P2** |
| Engine comparison | Medium | Medium | Very High (unique) | **P2** |
| Selection popup redesign | Medium | Medium | Medium | **P2** |
| Streaming translations | Medium | Medium | Medium | **P2** |
| Per-site rules | Medium | Medium | Medium | **P2** |
| Grammar explanations | Medium | Medium | High | **P3** |
| Netflix subtitles | High | Large | High | **P3** |
| Reading mode | Medium | Medium | High (unique) | **P3** |
| SRS system | High | Large | High | **P3** |
| Image/OCR | Medium | Large | Medium | **P4** |
| Meeting translation | Medium | Very Large | Medium | **P4** |
| Community glossaries | Medium | Very Large | High | **P4** |
