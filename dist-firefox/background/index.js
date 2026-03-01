var de = Object.defineProperty;
var ue = (n, e, t) => e in n ? de(n, e, { enumerable: !0, configurable: !0, writable: !0, value: t }) : n[e] = t;
var K = (n, e, t) => ue(n, typeof e != "symbol" ? e + "" : e, t);
function he(n) {
  return n && n.__esModule && Object.prototype.hasOwnProperty.call(n, "default") ? n.default : n;
}
var J = { exports: {} }, fe = J.exports, re;
function pe() {
  return re || (re = 1, (function(n, e) {
    (function(t, s) {
      s(n);
    })(typeof globalThis < "u" ? globalThis : typeof self < "u" ? self : fe, function(t) {
      if (!(globalThis.chrome && globalThis.chrome.runtime && globalThis.chrome.runtime.id))
        throw new Error("This script should only be loaded in a browser extension.");
      if (globalThis.browser && globalThis.browser.runtime && globalThis.browser.runtime.id)
        t.exports = globalThis.browser;
      else {
        const s = "The message port closed before a response was received.", a = (r) => {
          const o = {
            alarms: {
              clear: {
                minArgs: 0,
                maxArgs: 1
              },
              clearAll: {
                minArgs: 0,
                maxArgs: 0
              },
              get: {
                minArgs: 0,
                maxArgs: 1
              },
              getAll: {
                minArgs: 0,
                maxArgs: 0
              }
            },
            bookmarks: {
              create: {
                minArgs: 1,
                maxArgs: 1
              },
              get: {
                minArgs: 1,
                maxArgs: 1
              },
              getChildren: {
                minArgs: 1,
                maxArgs: 1
              },
              getRecent: {
                minArgs: 1,
                maxArgs: 1
              },
              getSubTree: {
                minArgs: 1,
                maxArgs: 1
              },
              getTree: {
                minArgs: 0,
                maxArgs: 0
              },
              move: {
                minArgs: 2,
                maxArgs: 2
              },
              remove: {
                minArgs: 1,
                maxArgs: 1
              },
              removeTree: {
                minArgs: 1,
                maxArgs: 1
              },
              search: {
                minArgs: 1,
                maxArgs: 1
              },
              update: {
                minArgs: 2,
                maxArgs: 2
              }
            },
            browserAction: {
              disable: {
                minArgs: 0,
                maxArgs: 1,
                fallbackToNoCallback: !0
              },
              enable: {
                minArgs: 0,
                maxArgs: 1,
                fallbackToNoCallback: !0
              },
              getBadgeBackgroundColor: {
                minArgs: 1,
                maxArgs: 1
              },
              getBadgeText: {
                minArgs: 1,
                maxArgs: 1
              },
              getPopup: {
                minArgs: 1,
                maxArgs: 1
              },
              getTitle: {
                minArgs: 1,
                maxArgs: 1
              },
              openPopup: {
                minArgs: 0,
                maxArgs: 0
              },
              setBadgeBackgroundColor: {
                minArgs: 1,
                maxArgs: 1,
                fallbackToNoCallback: !0
              },
              setBadgeText: {
                minArgs: 1,
                maxArgs: 1,
                fallbackToNoCallback: !0
              },
              setIcon: {
                minArgs: 1,
                maxArgs: 1
              },
              setPopup: {
                minArgs: 1,
                maxArgs: 1,
                fallbackToNoCallback: !0
              },
              setTitle: {
                minArgs: 1,
                maxArgs: 1,
                fallbackToNoCallback: !0
              }
            },
            browsingData: {
              remove: {
                minArgs: 2,
                maxArgs: 2
              },
              removeCache: {
                minArgs: 1,
                maxArgs: 1
              },
              removeCookies: {
                minArgs: 1,
                maxArgs: 1
              },
              removeDownloads: {
                minArgs: 1,
                maxArgs: 1
              },
              removeFormData: {
                minArgs: 1,
                maxArgs: 1
              },
              removeHistory: {
                minArgs: 1,
                maxArgs: 1
              },
              removeLocalStorage: {
                minArgs: 1,
                maxArgs: 1
              },
              removePasswords: {
                minArgs: 1,
                maxArgs: 1
              },
              removePluginData: {
                minArgs: 1,
                maxArgs: 1
              },
              settings: {
                minArgs: 0,
                maxArgs: 0
              }
            },
            commands: {
              getAll: {
                minArgs: 0,
                maxArgs: 0
              }
            },
            contextMenus: {
              remove: {
                minArgs: 1,
                maxArgs: 1
              },
              removeAll: {
                minArgs: 0,
                maxArgs: 0
              },
              update: {
                minArgs: 2,
                maxArgs: 2
              }
            },
            cookies: {
              get: {
                minArgs: 1,
                maxArgs: 1
              },
              getAll: {
                minArgs: 1,
                maxArgs: 1
              },
              getAllCookieStores: {
                minArgs: 0,
                maxArgs: 0
              },
              remove: {
                minArgs: 1,
                maxArgs: 1
              },
              set: {
                minArgs: 1,
                maxArgs: 1
              }
            },
            devtools: {
              inspectedWindow: {
                eval: {
                  minArgs: 1,
                  maxArgs: 2,
                  singleCallbackArg: !1
                }
              },
              panels: {
                create: {
                  minArgs: 3,
                  maxArgs: 3,
                  singleCallbackArg: !0
                },
                elements: {
                  createSidebarPane: {
                    minArgs: 1,
                    maxArgs: 1
                  }
                }
              }
            },
            downloads: {
              cancel: {
                minArgs: 1,
                maxArgs: 1
              },
              download: {
                minArgs: 1,
                maxArgs: 1
              },
              erase: {
                minArgs: 1,
                maxArgs: 1
              },
              getFileIcon: {
                minArgs: 1,
                maxArgs: 2
              },
              open: {
                minArgs: 1,
                maxArgs: 1,
                fallbackToNoCallback: !0
              },
              pause: {
                minArgs: 1,
                maxArgs: 1
              },
              removeFile: {
                minArgs: 1,
                maxArgs: 1
              },
              resume: {
                minArgs: 1,
                maxArgs: 1
              },
              search: {
                minArgs: 1,
                maxArgs: 1
              },
              show: {
                minArgs: 1,
                maxArgs: 1,
                fallbackToNoCallback: !0
              }
            },
            extension: {
              isAllowedFileSchemeAccess: {
                minArgs: 0,
                maxArgs: 0
              },
              isAllowedIncognitoAccess: {
                minArgs: 0,
                maxArgs: 0
              }
            },
            history: {
              addUrl: {
                minArgs: 1,
                maxArgs: 1
              },
              deleteAll: {
                minArgs: 0,
                maxArgs: 0
              },
              deleteRange: {
                minArgs: 1,
                maxArgs: 1
              },
              deleteUrl: {
                minArgs: 1,
                maxArgs: 1
              },
              getVisits: {
                minArgs: 1,
                maxArgs: 1
              },
              search: {
                minArgs: 1,
                maxArgs: 1
              }
            },
            i18n: {
              detectLanguage: {
                minArgs: 1,
                maxArgs: 1
              },
              getAcceptLanguages: {
                minArgs: 0,
                maxArgs: 0
              }
            },
            identity: {
              launchWebAuthFlow: {
                minArgs: 1,
                maxArgs: 1
              }
            },
            idle: {
              queryState: {
                minArgs: 1,
                maxArgs: 1
              }
            },
            management: {
              get: {
                minArgs: 1,
                maxArgs: 1
              },
              getAll: {
                minArgs: 0,
                maxArgs: 0
              },
              getSelf: {
                minArgs: 0,
                maxArgs: 0
              },
              setEnabled: {
                minArgs: 2,
                maxArgs: 2
              },
              uninstallSelf: {
                minArgs: 0,
                maxArgs: 1
              }
            },
            notifications: {
              clear: {
                minArgs: 1,
                maxArgs: 1
              },
              create: {
                minArgs: 1,
                maxArgs: 2
              },
              getAll: {
                minArgs: 0,
                maxArgs: 0
              },
              getPermissionLevel: {
                minArgs: 0,
                maxArgs: 0
              },
              update: {
                minArgs: 2,
                maxArgs: 2
              }
            },
            pageAction: {
              getPopup: {
                minArgs: 1,
                maxArgs: 1
              },
              getTitle: {
                minArgs: 1,
                maxArgs: 1
              },
              hide: {
                minArgs: 1,
                maxArgs: 1,
                fallbackToNoCallback: !0
              },
              setIcon: {
                minArgs: 1,
                maxArgs: 1
              },
              setPopup: {
                minArgs: 1,
                maxArgs: 1,
                fallbackToNoCallback: !0
              },
              setTitle: {
                minArgs: 1,
                maxArgs: 1,
                fallbackToNoCallback: !0
              },
              show: {
                minArgs: 1,
                maxArgs: 1,
                fallbackToNoCallback: !0
              }
            },
            permissions: {
              contains: {
                minArgs: 1,
                maxArgs: 1
              },
              getAll: {
                minArgs: 0,
                maxArgs: 0
              },
              remove: {
                minArgs: 1,
                maxArgs: 1
              },
              request: {
                minArgs: 1,
                maxArgs: 1
              }
            },
            runtime: {
              getBackgroundPage: {
                minArgs: 0,
                maxArgs: 0
              },
              getPlatformInfo: {
                minArgs: 0,
                maxArgs: 0
              },
              openOptionsPage: {
                minArgs: 0,
                maxArgs: 0
              },
              requestUpdateCheck: {
                minArgs: 0,
                maxArgs: 0
              },
              sendMessage: {
                minArgs: 1,
                maxArgs: 3
              },
              sendNativeMessage: {
                minArgs: 2,
                maxArgs: 2
              },
              setUninstallURL: {
                minArgs: 1,
                maxArgs: 1
              }
            },
            sessions: {
              getDevices: {
                minArgs: 0,
                maxArgs: 1
              },
              getRecentlyClosed: {
                minArgs: 0,
                maxArgs: 1
              },
              restore: {
                minArgs: 0,
                maxArgs: 1
              }
            },
            storage: {
              local: {
                clear: {
                  minArgs: 0,
                  maxArgs: 0
                },
                get: {
                  minArgs: 0,
                  maxArgs: 1
                },
                getBytesInUse: {
                  minArgs: 0,
                  maxArgs: 1
                },
                remove: {
                  minArgs: 1,
                  maxArgs: 1
                },
                set: {
                  minArgs: 1,
                  maxArgs: 1
                }
              },
              managed: {
                get: {
                  minArgs: 0,
                  maxArgs: 1
                },
                getBytesInUse: {
                  minArgs: 0,
                  maxArgs: 1
                }
              },
              sync: {
                clear: {
                  minArgs: 0,
                  maxArgs: 0
                },
                get: {
                  minArgs: 0,
                  maxArgs: 1
                },
                getBytesInUse: {
                  minArgs: 0,
                  maxArgs: 1
                },
                remove: {
                  minArgs: 1,
                  maxArgs: 1
                },
                set: {
                  minArgs: 1,
                  maxArgs: 1
                }
              }
            },
            tabs: {
              captureVisibleTab: {
                minArgs: 0,
                maxArgs: 2
              },
              create: {
                minArgs: 1,
                maxArgs: 1
              },
              detectLanguage: {
                minArgs: 0,
                maxArgs: 1
              },
              discard: {
                minArgs: 0,
                maxArgs: 1
              },
              duplicate: {
                minArgs: 1,
                maxArgs: 1
              },
              executeScript: {
                minArgs: 1,
                maxArgs: 2
              },
              get: {
                minArgs: 1,
                maxArgs: 1
              },
              getCurrent: {
                minArgs: 0,
                maxArgs: 0
              },
              getZoom: {
                minArgs: 0,
                maxArgs: 1
              },
              getZoomSettings: {
                minArgs: 0,
                maxArgs: 1
              },
              goBack: {
                minArgs: 0,
                maxArgs: 1
              },
              goForward: {
                minArgs: 0,
                maxArgs: 1
              },
              highlight: {
                minArgs: 1,
                maxArgs: 1
              },
              insertCSS: {
                minArgs: 1,
                maxArgs: 2
              },
              move: {
                minArgs: 2,
                maxArgs: 2
              },
              query: {
                minArgs: 1,
                maxArgs: 1
              },
              reload: {
                minArgs: 0,
                maxArgs: 2
              },
              remove: {
                minArgs: 1,
                maxArgs: 1
              },
              removeCSS: {
                minArgs: 1,
                maxArgs: 2
              },
              sendMessage: {
                minArgs: 2,
                maxArgs: 3
              },
              setZoom: {
                minArgs: 1,
                maxArgs: 2
              },
              setZoomSettings: {
                minArgs: 1,
                maxArgs: 2
              },
              update: {
                minArgs: 1,
                maxArgs: 2
              }
            },
            topSites: {
              get: {
                minArgs: 0,
                maxArgs: 0
              }
            },
            webNavigation: {
              getAllFrames: {
                minArgs: 1,
                maxArgs: 1
              },
              getFrame: {
                minArgs: 1,
                maxArgs: 1
              }
            },
            webRequest: {
              handlerBehaviorChanged: {
                minArgs: 0,
                maxArgs: 0
              }
            },
            windows: {
              create: {
                minArgs: 0,
                maxArgs: 1
              },
              get: {
                minArgs: 1,
                maxArgs: 2
              },
              getAll: {
                minArgs: 0,
                maxArgs: 1
              },
              getCurrent: {
                minArgs: 0,
                maxArgs: 1
              },
              getLastFocused: {
                minArgs: 0,
                maxArgs: 1
              },
              remove: {
                minArgs: 1,
                maxArgs: 1
              },
              update: {
                minArgs: 2,
                maxArgs: 2
              }
            }
          };
          if (Object.keys(o).length === 0)
            throw new Error("api-metadata.json has not been included in browser-polyfill");
          class i extends WeakMap {
            constructor(d, p = void 0) {
              super(p), this.createItem = d;
            }
            get(d) {
              return this.has(d) || this.set(d, this.createItem(d)), super.get(d);
            }
          }
          const c = (m) => m && typeof m == "object" && typeof m.then == "function", g = (m, d) => (...p) => {
            r.runtime.lastError ? m.reject(new Error(r.runtime.lastError.message)) : d.singleCallbackArg || p.length <= 1 && d.singleCallbackArg !== !1 ? m.resolve(p[0]) : m.resolve(p);
          }, u = (m) => m == 1 ? "argument" : "arguments", f = (m, d) => function(E, ...C) {
            if (C.length < d.minArgs)
              throw new Error(`Expected at least ${d.minArgs} ${u(d.minArgs)} for ${m}(), got ${C.length}`);
            if (C.length > d.maxArgs)
              throw new Error(`Expected at most ${d.maxArgs} ${u(d.maxArgs)} for ${m}(), got ${C.length}`);
            return new Promise((v, P) => {
              if (d.fallbackToNoCallback)
                try {
                  E[m](...C, g({
                    resolve: v,
                    reject: P
                  }, d));
                } catch (l) {
                  console.warn(`${m} API method doesn't seem to support the callback parameter, falling back to call it without a callback: `, l), E[m](...C), d.fallbackToNoCallback = !1, d.noCallback = !0, v();
                }
              else d.noCallback ? (E[m](...C), v()) : E[m](...C, g({
                resolve: v,
                reject: P
              }, d));
            });
          }, A = (m, d, p) => new Proxy(d, {
            apply(E, C, v) {
              return p.call(C, m, ...v);
            }
          });
          let h = Function.call.bind(Object.prototype.hasOwnProperty);
          const w = (m, d = {}, p = {}) => {
            let E = /* @__PURE__ */ Object.create(null), C = {
              has(P, l) {
                return l in m || l in E;
              },
              get(P, l, b) {
                if (l in E)
                  return E[l];
                if (!(l in m))
                  return;
                let x = m[l];
                if (typeof x == "function")
                  if (typeof d[l] == "function")
                    x = A(m, m[l], d[l]);
                  else if (h(p, l)) {
                    let R = f(l, p[l]);
                    x = A(m, m[l], R);
                  } else
                    x = x.bind(m);
                else if (typeof x == "object" && x !== null && (h(d, l) || h(p, l)))
                  x = w(x, d[l], p[l]);
                else if (h(p, "*"))
                  x = w(x, d[l], p["*"]);
                else
                  return Object.defineProperty(E, l, {
                    configurable: !0,
                    enumerable: !0,
                    get() {
                      return m[l];
                    },
                    set(R) {
                      m[l] = R;
                    }
                  }), x;
                return E[l] = x, x;
              },
              set(P, l, b, x) {
                return l in E ? E[l] = b : m[l] = b, !0;
              },
              defineProperty(P, l, b) {
                return Reflect.defineProperty(E, l, b);
              },
              deleteProperty(P, l) {
                return Reflect.deleteProperty(E, l);
              }
            }, v = Object.create(m);
            return new Proxy(v, C);
          }, T = (m) => ({
            addListener(d, p, ...E) {
              d.addListener(m.get(p), ...E);
            },
            hasListener(d, p) {
              return d.hasListener(m.get(p));
            },
            removeListener(d, p) {
              d.removeListener(m.get(p));
            }
          }), I = new i((m) => typeof m != "function" ? m : function(p) {
            const E = w(p, {}, {
              getContent: {
                minArgs: 0,
                maxArgs: 0
              }
            });
            m(E);
          }), O = new i((m) => typeof m != "function" ? m : function(p, E, C) {
            let v = !1, P, l = new Promise((G) => {
              P = function($) {
                v = !0, G($);
              };
            }), b;
            try {
              b = m(p, E, P);
            } catch (G) {
              b = Promise.reject(G);
            }
            const x = b !== !0 && c(b);
            if (b !== !0 && !x && !v)
              return !1;
            const R = (G) => {
              G.then(($) => {
                C($);
              }, ($) => {
                let q;
                $ && ($ instanceof Error || typeof $.message == "string") ? q = $.message : q = "An unexpected error occurred", C({
                  __mozWebExtensionPolyfillReject__: !0,
                  message: q
                });
              }).catch(($) => {
                console.error("Failed to send onMessage rejected reply", $);
              });
            };
            return R(x ? b : l), !0;
          }), N = ({
            reject: m,
            resolve: d
          }, p) => {
            r.runtime.lastError ? r.runtime.lastError.message === s ? d() : m(new Error(r.runtime.lastError.message)) : p && p.__mozWebExtensionPolyfillReject__ ? m(new Error(p.message)) : d(p);
          }, M = (m, d, p, ...E) => {
            if (E.length < d.minArgs)
              throw new Error(`Expected at least ${d.minArgs} ${u(d.minArgs)} for ${m}(), got ${E.length}`);
            if (E.length > d.maxArgs)
              throw new Error(`Expected at most ${d.maxArgs} ${u(d.maxArgs)} for ${m}(), got ${E.length}`);
            return new Promise((C, v) => {
              const P = N.bind(null, {
                resolve: C,
                reject: v
              });
              E.push(P), p.sendMessage(...E);
            });
          }, F = {
            devtools: {
              network: {
                onRequestFinished: T(I)
              }
            },
            runtime: {
              onMessage: T(O),
              onMessageExternal: T(O),
              sendMessage: M.bind(null, "sendMessage", {
                minArgs: 1,
                maxArgs: 3
              })
            },
            tabs: {
              sendMessage: M.bind(null, "sendMessage", {
                minArgs: 2,
                maxArgs: 3
              })
            }
          }, k = {
            clear: {
              minArgs: 1,
              maxArgs: 1
            },
            get: {
              minArgs: 1,
              maxArgs: 1
            },
            set: {
              minArgs: 1,
              maxArgs: 1
            }
          };
          return o.privacy = {
            network: {
              "*": k
            },
            services: {
              "*": k
            },
            websites: {
              "*": k
            }
          }, w(r, F, o);
        };
        t.exports = a(chrome);
      }
    });
  })(J)), J.exports;
}
var Ae = pe();
const S = /* @__PURE__ */ he(Ae);
var y = /* @__PURE__ */ ((n) => (n.GOOGLE_FREE = "google_free", n.BING_FREE = "bing_free", n.YANDEX = "yandex", n.LINGVA = "lingva", n.MYMEMORY = "mymemory", n.LIBRE_TRANSLATE = "libre_translate", n.DEEPL = "deepl", n.OPENAI = "openai", n.CLAUDE = "claude", n.MICROSOFT = "microsoft", n.CHROME_BUILTIN = "chrome_builtin", n))(y || {});
class U {
  constructor(e) {
    K(this, "config");
    this.config = e;
  }
  async detectLanguage(e) {
    return null;
  }
  async explain(e, t, s) {
    throw new Error("Grammar explanation is not supported by this engine. Please select an AI engine like OpenAI or Claude.");
  }
}
class le extends U {
  getMaxBatchSize() {
    return 20;
  }
  async translate(e, t, s) {
    const a = [], r = this.getMaxBatchSize();
    for (let o = 0; o < e.length; o += r) {
      const i = e.slice(o, o + r), c = await this.translateBatchStr(i, t, s);
      a.push(...c);
    }
    return a;
  }
  async translateBatchStr(e, t, s, a = 3) {
    const o = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${t === "auto" ? "auto" : t}&tl=${s}&dt=t`, i = e.join(`

`);
    for (let c = 0; c < a; c++)
      try {
        const g = new URLSearchParams();
        g.append("q", i);
        const u = await fetch(o, {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded;charset=utf-8" },
          body: g.toString()
        });
        if (!u.ok) {
          if (u.status === 429 && c < a - 1) {
            await this.delay(1e3 * Math.pow(2, c));
            continue;
          }
          throw new Error(`Google Translate HTTP ${u.status}`);
        }
        const f = await u.json();
        if (Array.isArray(f) && Array.isArray(f[0])) {
          const h = f[0].map((w) => w[0]).join("").split(`

`);
          return h.length !== e.length ? (console.warn("[LinguaFlow] Google Translate swallowed batch delimiters. Returning original batch."), e) : h;
        }
      } catch (g) {
        if (c === a - 1) throw g;
        await this.delay(1e3 * Math.pow(2, c));
      }
    throw new Error("Google Translate failed after retries");
  }
  async validateConfig() {
    try {
      return await this.translateBatchStr(["hello"], "en", "es", 1), { valid: !0 };
    } catch (e) {
      return { valid: !1, error: e.message };
    }
  }
  async detectLanguage(e) {
    const t = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=en&dt=t&q=${encodeURIComponent(e.slice(0, 200))}`;
    try {
      return (await (await fetch(t)).json())[2] ?? null;
    } catch {
      return null;
    }
  }
  delay(e) {
    return new Promise((t) => setTimeout(t, e));
  }
}
class ye extends U {
  getMaxBatchSize() {
    return 50;
  }
  getEndpoint() {
    var e;
    return this.config.customEndpoint ?? ((e = this.config.apiKey) != null && e.endsWith(":fx") ? "https://api-free.deepl.com/v2/translate" : "https://api.deepl.com/v2/translate");
  }
  async translate(e, t, s) {
    const a = [], r = this.getMaxBatchSize();
    for (let o = 0; o < e.length; o += r) {
      const i = e.slice(o, o + r), c = await this.translateBatch(i, t, s);
      a.push(...c);
    }
    return a;
  }
  async translateBatch(e, t, s) {
    const a = {
      text: e,
      target_lang: this.toDeepLLang(s)
    };
    t !== "auto" && (a.source_lang = this.toDeepLLang(t)), this.config.formality && this.config.formality !== "auto" && (a.formality = this.config.formality === "formal" ? "more" : "less");
    const r = await fetch(this.getEndpoint(), {
      method: "POST",
      headers: {
        Authorization: `DeepL-Auth-Key ${this.config.apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(a)
    });
    if (!r.ok) {
      const i = await r.text();
      throw r.status === 403 ? new Error("DeepL API key is invalid or unauthorized. Please check your API key in Settings.") : r.status === 456 ? new Error("DeepL quota exceeded. Your free API usage limit has been reached.") : new Error(`DeepL API error ${r.status}: ${i}`);
    }
    return (await r.json()).translations.map((i) => i.text);
  }
  async validateConfig() {
    if (!this.config.apiKey)
      return { valid: !1, error: "API key is required" };
    try {
      return await this.translateBatch(["hello"], "en", "es"), { valid: !0 };
    } catch (e) {
      return { valid: !1, error: e.message };
    }
  }
  toDeepLLang(e) {
    return {
      en: "EN",
      "en-us": "EN-US",
      "en-gb": "EN-GB",
      de: "DE",
      fr: "FR",
      es: "ES",
      pt: "PT-PT",
      "pt-br": "PT-BR",
      it: "IT",
      nl: "NL",
      pl: "PL",
      ru: "RU",
      ja: "JA",
      zh: "ZH-HANS",
      "zh-tw": "ZH-HANT",
      ko: "KO",
      ar: "AR",
      cs: "CS",
      da: "DA",
      el: "EL",
      fi: "FI",
      hu: "HU",
      id: "ID",
      ro: "RO",
      sv: "SV",
      tr: "TR",
      uk: "UK"
    }[e.toLowerCase()] ?? e.toUpperCase();
  }
}
const L = [
  { code: "auto", name: "Auto Detect" },
  // Major world languages
  { code: "en", name: "English" },
  { code: "zh", name: "Chinese (Simplified)" },
  { code: "zh-TW", name: "Chinese (Traditional)" },
  { code: "ja", name: "Japanese" },
  { code: "ko", name: "Korean" },
  { code: "fr", name: "French" },
  { code: "de", name: "German" },
  { code: "es", name: "Spanish" },
  { code: "pt", name: "Portuguese" },
  { code: "pt-BR", name: "Portuguese (Brazil)" },
  { code: "ru", name: "Russian" },
  { code: "ar", name: "Arabic" },
  { code: "hi", name: "Hindi" },
  { code: "it", name: "Italian" },
  { code: "nl", name: "Dutch" },
  { code: "th", name: "Thai" },
  { code: "vi", name: "Vietnamese" },
  { code: "id", name: "Indonesian" },
  { code: "tr", name: "Turkish" },
  { code: "pl", name: "Polish" },
  { code: "sv", name: "Swedish" },
  { code: "da", name: "Danish" },
  { code: "fi", name: "Finnish" },
  { code: "el", name: "Greek" },
  { code: "cs", name: "Czech" },
  { code: "ro", name: "Romanian" },
  { code: "hu", name: "Hungarian" },
  { code: "uk", name: "Ukrainian" },
  { code: "he", name: "Hebrew" },
  // European languages
  { code: "bg", name: "Bulgarian" },
  { code: "hr", name: "Croatian" },
  { code: "sk", name: "Slovak" },
  { code: "sl", name: "Slovenian" },
  { code: "sr", name: "Serbian" },
  { code: "bs", name: "Bosnian" },
  { code: "mk", name: "Macedonian" },
  { code: "sq", name: "Albanian" },
  { code: "et", name: "Estonian" },
  { code: "lv", name: "Latvian" },
  { code: "lt", name: "Lithuanian" },
  { code: "mt", name: "Maltese" },
  { code: "is", name: "Icelandic" },
  { code: "ga", name: "Irish" },
  { code: "cy", name: "Welsh" },
  { code: "gd", name: "Scottish Gaelic" },
  { code: "eu", name: "Basque" },
  { code: "ca", name: "Catalan" },
  { code: "gl", name: "Galician" },
  { code: "lb", name: "Luxembourgish" },
  { code: "no", name: "Norwegian" },
  { code: "nb", name: "Norwegian Bokmal" },
  // Asian languages
  { code: "ms", name: "Malay" },
  { code: "tl", name: "Filipino (Tagalog)" },
  { code: "bn", name: "Bengali" },
  { code: "ta", name: "Tamil" },
  { code: "te", name: "Telugu" },
  { code: "kn", name: "Kannada" },
  { code: "ml", name: "Malayalam" },
  { code: "mr", name: "Marathi" },
  { code: "gu", name: "Gujarati" },
  { code: "pa", name: "Punjabi" },
  { code: "ur", name: "Urdu" },
  { code: "ne", name: "Nepali" },
  { code: "si", name: "Sinhala" },
  { code: "my", name: "Myanmar (Burmese)" },
  { code: "km", name: "Khmer" },
  { code: "lo", name: "Lao" },
  { code: "ka", name: "Georgian" },
  { code: "hy", name: "Armenian" },
  { code: "az", name: "Azerbaijani" },
  { code: "uz", name: "Uzbek" },
  { code: "kk", name: "Kazakh" },
  { code: "mn", name: "Mongolian" },
  // African languages
  { code: "sw", name: "Swahili" },
  { code: "af", name: "Afrikaans" },
  { code: "zu", name: "Zulu" },
  { code: "xh", name: "Xhosa" },
  { code: "am", name: "Amharic" },
  { code: "ha", name: "Hausa" },
  { code: "yo", name: "Yoruba" },
  { code: "ig", name: "Igbo" },
  { code: "so", name: "Somali" },
  { code: "mg", name: "Malagasy" },
  // Middle Eastern / Central Asian
  { code: "fa", name: "Persian (Farsi)" },
  { code: "ku", name: "Kurdish" },
  { code: "ps", name: "Pashto" },
  { code: "tg", name: "Tajik" },
  // Other languages
  { code: "la", name: "Latin" },
  { code: "eo", name: "Esperanto" },
  { code: "haw", name: "Hawaiian" },
  { code: "mi", name: "Maori" },
  { code: "sm", name: "Samoan" },
  { code: "ceb", name: "Cebuano" },
  { code: "jw", name: "Javanese" },
  { code: "su", name: "Sundanese" },
  { code: "ht", name: "Haitian Creole" },
  { code: "yi", name: "Yiddish" },
  { code: "co", name: "Corsican" },
  { code: "fy", name: "Frisian" }
];
L.filter((n) => n.code !== "auto");
const Z = `
---SPLIT---
`;
class we extends U {
  getMaxBatchSize() {
    return 10;
  }
  async translate(e, t, s, a) {
    const r = [], o = this.getMaxBatchSize();
    for (let i = 0; i < e.length; i += o) {
      const c = e.slice(i, i + o), g = await this.translateBatch(c, t, s, a);
      r.push(...g);
    }
    return r;
  }
  async translateBatch(e, t, s, a) {
    var I, O, N, M, F, k;
    const r = ((I = L.find((m) => m.code === s)) == null ? void 0 : I.name) ?? s, o = t === "auto" ? "the detected language" : ((O = L.find((m) => m.code === t)) == null ? void 0 : O.name) ?? t, i = this.config.formality === "formal" ? `
Use formal register and polite forms (e.g., "vous" in French, "usted" in Spanish, "Sie" in German, polite forms in Japanese/Korean).` : this.config.formality === "informal" ? `
Use informal/casual register (e.g., "tu" in French, "tu" in Spanish, "du" in German, casual forms in Japanese/Korean).` : "", c = this.config.customPrompt ? `

Additional Instructions:
${this.config.customPrompt}` : "", g = `You are an expert translator producing natural, publication-quality translations from ${o} to ${r}.

Rules:
- Preserve the original tone, intent, and style (humor, sarcasm, formality).
- Translate idioms and cultural references into natural equivalents in the target language rather than translating literally.
- Preserve any HTML tags, markdown formatting, or special characters exactly as they appear.
- Do not add explanations, notes, or commentary — output only the translated text.${i}
${e.length > 1 ? `- Multiple texts are separated by "${Z.trim()}". Translate each independently and return them in the same order with the same delimiter.` : ""}${c}`, u = e.join(Z), f = this.config.customEndpoint ?? "https://api.openai.com/v1/chat/completions", A = this.config.model ?? "gpt-4o-mini", h = await fetch(f, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.config.apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: A,
        messages: [
          { role: "system", content: g },
          { role: "user", content: u }
        ],
        temperature: 0.3,
        stream: !!a
      })
    });
    if (!h.ok) {
      const m = await h.text();
      throw new Error(`OpenAI API error ${h.status}: ${m}`);
    }
    let w = "";
    if (a && h.body) {
      const m = h.body.getReader(), d = new TextDecoder("utf-8");
      for (; ; ) {
        const { done: p, value: E } = await m.read();
        if (p) break;
        const v = d.decode(E, { stream: !0 }).split("\\n");
        for (const P of v)
          if (P.startsWith("data: ")) {
            const l = P.slice(6);
            if (l === "[DONE]") continue;
            try {
              const x = (M = (N = JSON.parse(l).choices[0]) == null ? void 0 : N.delta) == null ? void 0 : M.content;
              x && (w += x, a(x));
            } catch {
            }
          }
      }
    } else
      w = ((k = (F = (await h.json()).choices[0]) == null ? void 0 : F.message) == null ? void 0 : k.content) ?? "";
    if (e.length === 1)
      return [w.trim()];
    const T = w.split(Z.trim()).map((m) => m.trim());
    return T.length !== e.length && e.length === 1 ? [w.trim()] : T;
  }
  async explain(e, t, s) {
    var f, A, h, w;
    const a = ((f = L.find((T) => T.code === s)) == null ? void 0 : f.name) ?? s, o = `You are an expert language teacher. Explain the grammar, vocabulary, and sentence structure of the provided text from ${t === "auto" ? "the detected language" : ((A = L.find((T) => T.code === t)) == null ? void 0 : A.name) ?? t} (translated to ${a}). Keep it concise, formatted in markdown, and highlight key grammar rules or interesting idioms used. Do not translate the whole sentence again unless necessary for explanation.`, i = this.config.customEndpoint ?? "https://api.openai.com/v1/chat/completions", c = this.config.model ?? "gpt-4o-mini", g = await fetch(i, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.config.apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: c,
        messages: [
          { role: "system", content: o },
          { role: "user", content: e }
        ],
        temperature: 0.3
      })
    });
    if (!g.ok) {
      const T = await g.text();
      throw new Error(`OpenAI API error ${g.status}: ${T}`);
    }
    return ((w = (h = (await g.json()).choices[0]) == null ? void 0 : h.message) == null ? void 0 : w.content) ?? "";
  }
  async validateConfig() {
    if (!this.config.apiKey)
      return { valid: !1, error: "API key is required" };
    try {
      return await this.translateBatch(["hello"], "en", "es"), { valid: !0 };
    } catch (e) {
      return { valid: !1, error: e.message };
    }
  }
  async translateImage(e, t, s) {
    var f, A, h, w, T, I, O;
    const a = ((f = L.find((N) => N.code === s)) == null ? void 0 : f.name) ?? s, o = `You are an OCR translation expert. Extract all text from this image and translate it from ${t === "auto" ? "the detected language" : ((A = L.find((N) => N.code === t)) == null ? void 0 : A.name) ?? t} to ${a}. Keep the original formatting and layout as much as possible, using markdown. ONLY output the translated text, do not add any conversational words or explanations.`, i = (h = this.config.model) != null && h.includes("gpt-4") ? this.config.model : "gpt-4o-mini", c = this.config.customEndpoint ?? "https://api.openai.com/v1/chat/completions", g = await fetch(c, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.config.apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: i,
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: o },
              { type: "image_url", image_url: { url: e } }
            ]
          }
        ],
        max_tokens: 2048,
        temperature: 0.3
      })
    });
    if (!g.ok) {
      const N = await g.text();
      throw new Error(`OpenAI Vision API error ${g.status}: ${N}`);
    }
    return ((O = (I = (T = (w = (await g.json()).choices) == null ? void 0 : w[0]) == null ? void 0 : T.message) == null ? void 0 : I.content) == null ? void 0 : O.trim()) ?? "";
  }
}
const Q = `
---SPLIT---
`;
class xe extends U {
  getMaxBatchSize() {
    return 10;
  }
  async translate(e, t, s, a) {
    const r = [], o = this.getMaxBatchSize();
    for (let i = 0; i < e.length; i += o) {
      const c = e.slice(i, i + o), g = await this.translateBatch(c, t, s, a);
      r.push(...g);
    }
    return r;
  }
  async translateBatch(e, t, s, a) {
    var I, O, N, M, F;
    const r = ((I = L.find((k) => k.code === s)) == null ? void 0 : I.name) ?? s, o = t === "auto" ? "the detected language" : ((O = L.find((k) => k.code === t)) == null ? void 0 : O.name) ?? t, i = this.config.formality === "formal" ? `
Use formal register and polite forms (e.g., "vous" in French, "usted" in Spanish, "Sie" in German, polite forms in Japanese/Korean).` : this.config.formality === "informal" ? `
Use informal/casual register (e.g., "tu" in French, "tu" in Spanish, "du" in German, casual forms in Japanese/Korean).` : "", c = this.config.customPrompt ? `

Additional Instructions:
${this.config.customPrompt}` : "", g = `You are an expert translator producing natural, publication-quality translations from ${o} to ${r}.

Rules:
- Preserve the original tone, intent, and style (humor, sarcasm, formality).
- Translate idioms and cultural references into natural equivalents in the target language rather than translating literally.
- Preserve any HTML tags, markdown formatting, or special characters exactly as they appear.
- Do not add explanations, notes, or commentary — output only the translated text.${i}
${e.length > 1 ? `- Multiple texts are separated by "${Q.trim()}". Translate each independently and return them in the same order with the same delimiter.` : ""}${c}`, u = e.join(Q), f = this.config.customEndpoint ?? "https://api.anthropic.com/v1/messages", A = this.config.model ?? "claude-sonnet-4-5-20250514", h = await fetch(f, {
      method: "POST",
      headers: {
        "x-api-key": this.config.apiKey,
        "anthropic-version": "2023-06-01",
        "Content-Type": "application/json",
        "anthropic-dangerous-direct-browser-access": "true"
      },
      body: JSON.stringify({
        model: A,
        max_tokens: 4096,
        system: g,
        messages: [
          { role: "user", content: u }
        ],
        stream: !!a
      })
    });
    if (!h.ok) {
      const k = await h.text();
      throw new Error(`Claude API error ${h.status}: ${k}`);
    }
    let w = "";
    if (a && h.body) {
      const k = h.body.getReader(), m = new TextDecoder("utf-8");
      for (; ; ) {
        const { done: d, value: p } = await k.read();
        if (d) break;
        const C = m.decode(p, { stream: !0 }).split("\\n");
        for (const v of C)
          if (v.startsWith("data: ")) {
            const P = v.slice(6);
            if (P === "[DONE]") continue;
            try {
              const l = JSON.parse(P);
              l.type === "content_block_delta" && ((N = l.delta) != null && N.text) && (w += l.delta.text, a(l.delta.text));
            } catch {
            }
          }
      }
    } else
      w = ((F = (M = (await h.json()).content) == null ? void 0 : M[0]) == null ? void 0 : F.text) ?? "";
    if (e.length === 1)
      return [w.trim()];
    const T = w.split(Q.trim()).map((k) => k.trim());
    return T.length !== e.length && e.length === 1 ? [w.trim()] : T;
  }
  async explain(e, t, s) {
    var f, A, h, w;
    const a = ((f = L.find((T) => T.code === s)) == null ? void 0 : f.name) ?? s, o = `You are an expert language teacher. Explain the grammar, vocabulary, and sentence structure of the provided text from ${t === "auto" ? "the detected language" : ((A = L.find((T) => T.code === t)) == null ? void 0 : A.name) ?? t} (translated to ${a}). Keep it concise, formatted in markdown, and highlight key grammar rules or interesting idioms used. Do not translate the whole sentence again unless necessary for explanation.`, i = this.config.customEndpoint ?? "https://api.anthropic.com/v1/messages", c = this.config.model ?? "claude-sonnet-4-5-20250514", g = await fetch(i, {
      method: "POST",
      headers: {
        "x-api-key": this.config.apiKey,
        "anthropic-version": "2023-06-01",
        "Content-Type": "application/json",
        "anthropic-dangerous-direct-browser-access": "true"
      },
      body: JSON.stringify({
        model: c,
        max_tokens: 1500,
        system: o,
        messages: [
          { role: "user", content: e }
        ]
      })
    });
    if (!g.ok) {
      const T = await g.text();
      throw new Error(`Claude API error ${g.status}: ${T}`);
    }
    return ((w = (h = (await g.json()).content) == null ? void 0 : h[0]) == null ? void 0 : w.text) ?? "";
  }
  async validateConfig() {
    if (!this.config.apiKey)
      return { valid: !1, error: "API key is required" };
    try {
      return await this.translateBatch(["hello"], "en", "es"), { valid: !0 };
    } catch (e) {
      return { valid: !1, error: e.message };
    }
  }
  async translateImage(e, t, s) {
    var w, T, I, O, N;
    const a = ((w = L.find((M) => M.code === s)) == null ? void 0 : w.name) ?? s, o = `You are an OCR translation expert. Extract all text from this image and translate it from ${t === "auto" ? "the detected language" : ((T = L.find((M) => M.code === t)) == null ? void 0 : T.name) ?? t} to ${a}. Keep the original formatting and layout as much as possible, using markdown. ONLY output the translated text, do not add any conversational words or explanations.`, i = this.config.customEndpoint ?? "https://api.anthropic.com/v1/messages", c = this.config.model ?? "claude-3-5-sonnet-20241022", g = e.match(/^data:(image\/[a-zA-Z]+);base64,(.+)$/);
    if (!g) throw new Error("Invalid image base64 format. Expected data:image/...;base64,...");
    const u = g[1], f = g[2], A = await fetch(i, {
      method: "POST",
      headers: {
        "x-api-key": this.config.apiKey,
        "anthropic-version": "2023-06-01",
        "Content-Type": "application/json",
        "anthropic-dangerous-direct-browser-access": "true"
      },
      body: JSON.stringify({
        model: c,
        max_tokens: 2048,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "image",
                source: {
                  type: "base64",
                  media_type: u,
                  data: f
                }
              },
              { type: "text", text: o }
            ]
          }
        ]
      })
    });
    if (!A.ok) {
      const M = await A.text();
      throw new Error(`Claude Vision API error ${A.status}: ${M}`);
    }
    return ((N = (O = (I = (await A.json()).content) == null ? void 0 : I[0]) == null ? void 0 : O.text) == null ? void 0 : N.trim()) ?? "";
  }
}
class Te extends U {
  getMaxBatchSize() {
    return 25;
  }
  async translate(e, t, s) {
    const a = this.config.apiKey;
    if (!a) throw new Error("Microsoft Translator API key not set");
    const r = t === "auto" ? "" : `&from=${t}`, o = `https://api.cognitive.microsofttranslator.com/translate?api-version=3.0&to=${s}${r}`, i = e.map((u) => ({ Text: u })), c = await fetch(o, {
      method: "POST",
      headers: {
        "Ocp-Apim-Subscription-Key": a,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(i)
    });
    if (!c.ok) {
      const u = await c.text();
      throw c.status === 401 ? new Error("Microsoft Translator API key is invalid. Please check your API key in Settings.") : new Error(`Microsoft Translator HTTP ${c.status}: ${u}`);
    }
    return (await c.json()).map(
      (u) => u.translations[0].text
    );
  }
  async validateConfig() {
    try {
      return await this.translate(["hello"], "en", "es"), { valid: !0 };
    } catch (e) {
      return { valid: !1, error: e.message };
    }
  }
}
class Ee extends U {
  getMaxBatchSize() {
    return 1;
  }
  async translate(e, t, s) {
    if (this.config.tabId) {
      const a = await S.tabs.sendMessage(this.config.tabId, {
        type: "EXECUTE_CHROME_BUILTIN",
        payload: { texts: e, sourceLang: t, targetLang: s }
      });
      if (a && !a.success)
        throw new Error(a.error);
      return a ? a.data : e.map(() => "Error routing offline translation to page context.");
    }
    throw new Error("Chrome Built-in engine cannot run in this context without a target tab.");
  }
  async validateConfig() {
    return { valid: !0 };
  }
}
const _ = class _ extends U {
  /** Clear cached auth token (useful for testing) */
  static resetCache() {
    _.cachedToken = null, _.tokenExpiry = 0;
  }
  getMaxBatchSize() {
    return 25;
  }
  async translate(e, t, s) {
    const a = await this.getAuthToken(), r = t === "auto" ? "" : `&from=${t}`, o = `https://api-edge.cognitive.microsofttranslator.com/translate?api-version=3.0&to=${s}${r}`, i = e.map((u) => ({ Text: u })), c = await fetch(o, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${a}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(i)
    });
    if (!c.ok) {
      if (c.status === 401) {
        _.cachedToken = null;
        const u = await this.getAuthToken(), f = await fetch(o, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${u}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify(i)
        });
        if (!f.ok)
          throw new Error(`Bing Translate HTTP ${f.status}`);
        return (await f.json()).map(
          (h, w) => {
            var T, I;
            return ((I = (T = h == null ? void 0 : h.translations) == null ? void 0 : T[0]) == null ? void 0 : I.text) ?? e[w];
          }
        );
      }
      throw new Error(`Bing Translate HTTP ${c.status}`);
    }
    return (await c.json()).map(
      (u, f) => {
        var A, h;
        return ((h = (A = u == null ? void 0 : u.translations) == null ? void 0 : A[0]) == null ? void 0 : h.text) ?? e[f];
      }
    );
  }
  async getAuthToken() {
    if (_.cachedToken && Date.now() < _.tokenExpiry)
      return _.cachedToken;
    const e = await fetch("https://edge.microsoft.com/translate/auth", {
      method: "GET"
    });
    if (!e.ok)
      throw new Error(`Failed to get Bing auth token: HTTP ${e.status}`);
    const t = await e.text();
    return _.cachedToken = t, _.tokenExpiry = Date.now() + 600 * 1e3, t;
  }
  async validateConfig() {
    try {
      return await this.translate(["hello"], "en", "es"), { valid: !0 };
    } catch (e) {
      return { valid: !1, error: e.message };
    }
  }
  async detectLanguage(e) {
    var t;
    try {
      const s = await this.getAuthToken(), a = await fetch(
        "https://api-edge.cognitive.microsofttranslator.com/detect?api-version=3.0",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${s}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify([{ Text: e.slice(0, 200) }])
        }
      );
      return a.ok ? ((t = (await a.json())[0]) == null ? void 0 : t.language) ?? null : null;
    } catch {
      return null;
    }
  }
};
K(_, "cachedToken", null), K(_, "tokenExpiry", 0);
let te = _;
const D = class D extends U {
  /** Clear cached SID (useful for testing) */
  static resetCache() {
    D.cachedSid = null, D.sidExpiry = 0;
  }
  getMaxBatchSize() {
    return 10;
  }
  async translate(e, t, s) {
    const a = await this.getSid(), r = t === "auto" ? "" : t, o = r ? `${r}-${s}` : s, i = e.map((f) => `text=${encodeURIComponent(f)}`).join("&"), c = `https://translate.yandex.net/api/v1/tr.json/translate?srv=tr-url-widget&sid=${a}&lang=${o}&${i}`, g = await fetch(c);
    if (!g.ok) {
      if (g.status === 403 || g.status === 401) {
        D.cachedSid = null;
        const A = `https://translate.yandex.net/api/v1/tr.json/translate?srv=tr-url-widget&sid=${await this.getSid()}&lang=${o}&${i}`, h = await fetch(A);
        if (!h.ok)
          throw new Error(`Yandex Translate HTTP ${h.status}`);
        return (await h.json()).text;
      }
      throw new Error(`Yandex Translate HTTP ${g.status}`);
    }
    return (await g.json()).text;
  }
  async getSid() {
    if (D.cachedSid && Date.now() < D.sidExpiry)
      return D.cachedSid;
    const e = await fetch("https://translate.yandex.com/", {
      headers: {
        "User-Agent": "Mozilla/5.0"
      }
    });
    if (!e.ok)
      throw new Error(`Failed to get Yandex SID: HTTP ${e.status}`);
    const s = (await e.text()).match(/SID\s*[:=]\s*['"]([^'"]+)['"]/);
    if (!s)
      throw new Error("Could not extract Yandex SID from page");
    const a = s[1].split(".").map((r) => r.split("").reverse().join("")).join(".");
    return D.cachedSid = a, D.sidExpiry = Date.now() + 1800 * 1e3, a;
  }
  async validateConfig() {
    try {
      return await this.translate(["hello"], "en", "es"), { valid: !0 };
    } catch (e) {
      return { valid: !1, error: e.message };
    }
  }
};
K(D, "cachedSid", null), K(D, "sidExpiry", 0);
let ne = D;
const V = class V extends U {
  getMaxBatchSize() {
    return 1;
  }
  getBaseUrl() {
    return (this.config.customEndpoint ?? V.DEFAULT_INSTANCE).replace(/\/+$/, "");
  }
  async translate(e, t, s) {
    const a = [];
    for (let o = 0; o < e.length; o += 5) {
      const i = e.slice(o, o + 5), c = await Promise.all(
        i.map((g) => this.translateSingle(g, t, s))
      );
      a.push(...c);
    }
    return a;
  }
  async translateSingle(e, t, s, a = 2) {
    const r = t === "auto" ? "auto" : t, i = `${this.getBaseUrl()}/api/v1/${r}/${s}/${encodeURIComponent(e)}`;
    for (let c = 0; c < a; c++)
      try {
        const g = await fetch(i);
        if (!g.ok) {
          if (g.status === 429 && c < a - 1) {
            await this.delay(1e3 * Math.pow(2, c));
            continue;
          }
          throw new Error(`Lingva Translate HTTP ${g.status}`);
        }
        return (await g.json()).translation ?? "";
      } catch (g) {
        if (c === a - 1) throw g;
        await this.delay(1e3 * Math.pow(2, c));
      }
    throw new Error("Lingva Translate failed after retries");
  }
  async validateConfig() {
    try {
      return await this.translateSingle("hello", "en", "es", 1), { valid: !0 };
    } catch (e) {
      return { valid: !1, error: e.message };
    }
  }
  delay(e) {
    return new Promise((t) => setTimeout(t, e));
  }
};
K(V, "DEFAULT_INSTANCE", "https://lingva.ml");
let ae = V;
class be extends U {
  getMaxBatchSize() {
    return 1;
  }
  async translate(e, t, s) {
    const a = [];
    for (let o = 0; o < e.length; o += 3) {
      const i = e.slice(o, o + 3), c = await Promise.all(
        i.map((g) => this.translateSingle(g, t, s))
      );
      a.push(...c);
    }
    return a;
  }
  async translateSingle(e, t, s) {
    var g;
    const r = `${t === "auto" ? "en" : t}|${s}`;
    let o = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(e)}&langpair=${encodeURIComponent(r)}`;
    this.config.apiKey && (o += `&de=${encodeURIComponent(this.config.apiKey)}`);
    const i = await fetch(o);
    if (!i.ok)
      throw new Error(`MyMemory HTTP ${i.status}`);
    const c = await i.json();
    if (c.responseStatus !== 200)
      throw new Error(c.responseDetails || `MyMemory error: status ${c.responseStatus}`);
    return ((g = c.responseData) == null ? void 0 : g.translatedText) ?? "";
  }
  async validateConfig() {
    try {
      return await this.translateSingle("hello", "en", "es"), { valid: !0 };
    } catch (e) {
      return { valid: !1, error: e.message };
    }
  }
}
const W = class W extends U {
  getMaxBatchSize() {
    return 1;
  }
  getBaseUrl() {
    return (this.config.customEndpoint ?? W.DEFAULT_INSTANCE).replace(/\/+$/, "");
  }
  async translate(e, t, s) {
    const a = [];
    for (let o = 0; o < e.length; o += 3) {
      const i = e.slice(o, o + 3), c = await Promise.all(
        i.map((g) => this.translateSingle(g, t, s))
      );
      a.push(...c);
    }
    return a;
  }
  async translateSingle(e, t, s) {
    const a = `${this.getBaseUrl()}/translate`, r = {
      q: e,
      source: t === "auto" ? "auto" : t,
      target: s,
      format: "text"
    };
    this.config.apiKey && (r.api_key = this.config.apiKey);
    const o = await fetch(a, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(r)
    });
    if (!o.ok) {
      const c = await o.text();
      throw o.status === 403 ? new Error("LibreTranslate: API key required or invalid") : o.status === 429 ? new Error("LibreTranslate: Rate limit exceeded") : new Error(`LibreTranslate HTTP ${o.status}: ${c}`);
    }
    return (await o.json()).translatedText ?? "";
  }
  async validateConfig() {
    try {
      return await this.translateSingle("hello", "en", "es"), { valid: !0 };
    } catch (e) {
      return { valid: !1, error: e.message };
    }
  }
  async detectLanguage(e) {
    var t;
    try {
      const s = `${this.getBaseUrl()}/detect`, a = { q: e.slice(0, 200) };
      this.config.apiKey && (a.api_key = this.config.apiKey);
      const r = await fetch(s, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(a)
      });
      return r.ok ? ((t = (await r.json())[0]) == null ? void 0 : t.language) ?? null : null;
    } catch {
      return null;
    }
  }
};
K(W, "DEFAULT_INSTANCE", "https://libretranslate.com");
let se = W;
function Y(n, e) {
  switch (n) {
    case y.GOOGLE_FREE:
      return new le(e);
    case y.BING_FREE:
      return new te(e);
    case y.YANDEX:
      return new ne(e);
    case y.LINGVA:
      return new ae(e);
    case y.MYMEMORY:
      return new be(e);
    case y.LIBRE_TRANSLATE:
      return new se(e);
    case y.DEEPL:
      return new ye(e);
    case y.OPENAI:
      return new we(e);
    case y.CLAUDE:
      return new xe(e);
    case y.MICROSOFT:
      return new Te(e);
    case y.CHROME_BUILTIN:
      return new Ee(e);
    default:
      throw new Error(`Unknown translation engine: ${n}`);
  }
}
const ee = "[LinguaFlow]", B = {
  info: (...n) => console.log(ee, ...n),
  warn: (...n) => console.warn(ee, ...n),
  error: (...n) => console.error(ee, ...n),
  debug: (...n) => {
  }
}, Se = "immersive-translate-cache", j = "translations", Ce = 1, oe = 1e4, ke = 10080 * 60 * 1e3;
function ge(n, e, t, s) {
  const a = `${s}:${e}:${t}:${n.trim().toLowerCase()}`;
  let r = 2166136261;
  for (let o = 0; o < a.length; o++)
    r ^= a.charCodeAt(o), r = Math.imul(r, 16777619);
  return (r >>> 0).toString(36);
}
function X() {
  return new Promise((n, e) => {
    const t = indexedDB.open(Se, Ce);
    t.onupgradeneeded = () => {
      const s = t.result;
      if (!s.objectStoreNames.contains(j)) {
        const a = s.createObjectStore(j, { keyPath: "key" });
        a.createIndex("createdAt", "createdAt", { unique: !1 }), a.createIndex("accessedAt", "accessedAt", { unique: !1 });
      }
    }, t.onsuccess = () => n(t.result), t.onerror = () => e(t.error);
  });
}
async function Pe(n, e, t, s) {
  try {
    const a = await X(), r = ge(n, e, t, s), i = a.transaction(j, "readwrite").objectStore(j);
    return new Promise((c) => {
      const g = i.get(r);
      g.onsuccess = () => {
        const u = g.result;
        if (!u) {
          c(null);
          return;
        }
        if (Date.now() - u.createdAt > ke) {
          i.delete(r), c(null);
          return;
        }
        u.accessedAt = Date.now(), i.put(u), c(u.translatedText);
      }, g.onerror = () => c(null);
    });
  } catch {
    return null;
  }
}
async function ve(n, e, t, s, a) {
  try {
    const r = await X(), o = ge(n, t, s, a), c = r.transaction(j, "readwrite").objectStore(j), g = {
      key: o,
      originalText: n,
      translatedText: e,
      sourceLang: t,
      targetLang: s,
      engine: a,
      createdAt: Date.now(),
      accessedAt: Date.now()
    };
    c.put(g);
    const u = c.count();
    u.onsuccess = () => {
      u.result > oe && Ie(c, u.result - oe);
    };
  } catch (r) {
    B.error("Cache put failed:", r);
  }
}
function Ie(n, e) {
  const s = n.index("accessedAt").openCursor();
  let a = 0;
  s.onsuccess = () => {
    const r = s.result;
    r && a < e && (r.delete(), a++, r.continue());
  };
}
async function Ne() {
  (await X()).transaction(j, "readwrite").objectStore(j).clear();
}
async function $e() {
  try {
    const t = (await X()).transaction(j, "readonly").objectStore(j);
    return new Promise((s) => {
      const a = t.count();
      a.onsuccess = () => s({ count: a.result }), a.onerror = () => s({ count: 0 });
    });
  } catch {
    return { count: 0 };
  }
}
const Me = {
  sourceLang: "auto",
  targetLang: "en",
  engine: y.GOOGLE_FREE,
  engineConfigs: {},
  hoverMode: !1,
  displayMode: "replace",
  translationStyle: {
    fontSize: 0.92,
    fontFamily: "inherit",
    color: "#555555",
    borderColor: "#4a90d9",
    italic: !0
  },
  onboardingCompleted: !1,
  tourCompleted: !1,
  theme: "system",
  showFreeEngines: !0,
  showPaidEngines: !0,
  autoTranslateSites: [],
  neverTranslateSites: [],
  siteRules: [],
  popupScale: 1,
  uiLocale: "auto",
  fabEnabled: !0,
  fabSize: 48,
  formality: "auto",
  compareEngine: void 0,
  enableSync: !1,
  dyslexiaFont: !1
};
async function H() {
  return (await S.storage.local.get("settings")).settings ?? Me;
}
async function Oe(n) {
  const { engineConfigs: e, ...t } = n;
  await S.storage.sync.set({ syncedSettings: t });
}
async function Re(n) {
  await S.storage.local.set({ settings: n }), n.enableSync && await Oe(n).catch(() => {
  });
}
async function Le(n) {
  const t = { ...await H(), ...n };
  return await Re(t), t;
}
const Be = [
  { id: y.GOOGLE_FREE, name: "Google Translate", requiresKey: !1, color: "#4285F4", description: "Free Google endpoint, no key needed" },
  { id: y.BING_FREE, name: "Bing Translate", requiresKey: !1, color: "#0078D4", description: "Free Microsoft Edge translation" },
  { id: y.YANDEX, name: "Yandex Translate", requiresKey: !1, color: "#FC3F1D", description: "Free Yandex translation service" },
  { id: y.LINGVA, name: "Lingva", requiresKey: !1, color: "#4CAF50", description: "Privacy-focused Google Translate proxy" },
  { id: y.MYMEMORY, name: "MyMemory", requiresKey: !1, color: "#FF9800", description: "Free crowdsourced translation memory" },
  { id: y.LIBRE_TRANSLATE, name: "LibreTranslate", requiresKey: !1, color: "#1976D2", description: "Open source, self-hostable" },
  { id: y.MICROSOFT, name: "Microsoft Translator", requiresKey: !0, color: "#0078D4", description: "Azure Cognitive Services" },
  { id: y.DEEPL, name: "DeepL", requiresKey: !0, color: "#0F2B46", description: "High-quality neural translation" },
  { id: y.OPENAI, name: "OpenAI", requiresKey: !0, defaultModel: "gpt-4o-mini", color: "#10A37F", description: "GPT-powered translation" },
  { id: y.CLAUDE, name: "Claude", requiresKey: !0, defaultModel: "claude-sonnet-4-5-20250514", color: "#D97757", description: "Anthropic AI translation" },
  { id: y.CHROME_BUILTIN, name: "Offline (Chrome Built-in)", requiresKey: !1, color: "#3367D6", description: "On-device private translation" }
];
function me(n) {
  return Be.find((e) => e.id === n);
}
const ie = "linguaflow_glossary";
async function _e() {
  return (await S.storage.local.get([ie]))[ie] || [];
}
const ce = 3;
function De(n) {
  return n.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
function Ge(n, e) {
  if (!e.length) return { processedTexts: n, mappedTerms: [] };
  const t = [];
  return { processedTexts: n.map((a) => {
    let r = a;
    return e.forEach((o) => {
      if (!o.sourceTerm) return;
      const i = o.caseSensitive ? "g" : "gi", c = new RegExp(`\\b${De(o.sourceTerm)}\\b`, i);
      r = r.replace(c, () => {
        const g = t.length;
        return t.push(o.targetTerm), `[GLS_${g}_GLS]`;
      });
    }), r;
  }), mappedTerms: t };
}
function Ue(n, e) {
  return e.length ? n.map((t) => t.replace(/\[\s*GLS\s*_\s*(\d+)\s*_\s*GLS\s*\]/gi, (s, a) => {
    const r = parseInt(a, 10);
    return e[r] || s;
  })) : n;
}
async function je(n, e, t, s, a, r) {
  var P;
  const o = await H(), i = s ?? o.engine, g = {
    ...((P = o.engineConfigs) == null ? void 0 : P[i]) ?? { engine: i },
    formality: o.formality ?? "auto",
    tabId: r
  }, u = me(i);
  if (u.requiresKey && !g.apiKey)
    throw new Error(`API key required for ${u.name}. Open the extension settings to add your key.`);
  const f = await Promise.all(
    n.map((l) => Pe(l, e, t, i))
  ), A = [], h = new Array(n.length);
  let w = !0;
  for (let l = 0; l < n.length; l++)
    f[l] !== null ? h[l] = f[l] : (A.push(l), w = !1);
  if (w)
    return {
      originalTexts: n,
      translatedTexts: h,
      engine: i,
      cached: !0,
      timestamp: Date.now()
    };
  B.info(`Translating ${A.length} uncached texts with engine: ${i}`);
  const T = Y(i, g), I = T.getMaxBatchSize(), O = A.map((l) => n[l]), N = await _e(), { processedTexts: M, mappedTerms: F } = Ge(O, N), k = [];
  for (let l = 0; l < M.length; l += I)
    k.push(M.slice(l, l + I));
  const m = [
    y.GOOGLE_FREE,
    y.BING_FREE,
    y.LINGVA
  ];
  async function d(l) {
    const b = typeof navigator < "u" && !navigator.onLine;
    if (b && i !== y.CHROME_BUILTIN)
      throw new Error("Device is offline. Translation requires an active internet connection or the Chrome Built-in engine.");
    try {
      return {
        texts: await T.translate(l, e, t, a),
        engineUsed: i
      };
    } catch (x) {
      if (B.warn(`Primary engine ${i} failed: ${x.message}.`), b)
        throw new Error(`Offline translation failed: ${x.message}`);
      B.info("Trying fallbacks...");
      const R = m.filter(($) => $ !== i);
      let G = x;
      for (const $ of R)
        try {
          return B.info(`Attempting fallback with ${$}`), {
            texts: await Y($, { engine: $ }).translate(l, e, t),
            engineUsed: $
          };
        } catch (q) {
          B.warn(`Fallback engine ${$} failed: ${q.message}`), G = q;
        }
      throw G;
    }
  }
  const p = [];
  for (let l = 0; l < k.length; l += ce) {
    const b = k.slice(l, l + ce), x = await Promise.all(
      b.map((R) => d(R))
    );
    p.push(...x);
  }
  let E = i;
  const C = [];
  for (let l = 0, b = 0, x = 0; l < A.length; l++) {
    const { texts: R, engineUsed: G } = p[b];
    C.push(R[x]), G !== i && (E = G), x++, x >= R.length && (b++, x = 0);
  }
  const v = Ue(C, F);
  for (let l = 0; l < A.length; l++) {
    const b = A[l], x = v[l];
    h[b] = x, ve(n[b], x, e, t, E).catch(
      (R) => B.error("Cache write failed:", R)
    );
  }
  return {
    originalTexts: n,
    translatedTexts: h,
    engine: E,
    cached: !1,
    timestamp: Date.now()
  };
}
async function Fe(n) {
  var a;
  const t = ((a = (await H()).engineConfigs) == null ? void 0 : a[n]) ?? { engine: n };
  return Y(n, t).validateConfig();
}
async function Ke(n, e, t) {
  var i;
  const s = await H(), a = [
    s.engine,
    s.compareEngine,
    y.OPENAI,
    y.CLAUDE
  ].find((c) => c === y.OPENAI || c === y.CLAUDE);
  if (!a)
    throw new Error("Please configure OpenAI or Claude in settings to use the Grammar Explain feature.");
  const r = ((i = s.engineConfigs) == null ? void 0 : i[a]) ?? { engine: a };
  if (!r.apiKey)
    throw new Error(`API key required for ${me(a).name}. Please configure it in settings.`);
  return Y(a, r).explain(n, e, t);
}
async function qe(n, e, t, s) {
  var g, u;
  const a = await H(), r = s ?? a.engine;
  let o = !1, i = null, c = null;
  if (r === y.OPENAI || r === y.CLAUDE) {
    const f = ((g = a.engineConfigs) == null ? void 0 : g[r]) ?? { engine: r };
    f.apiKey && (o = !0, i = r, c = f);
  }
  if (!o) {
    const f = [y.OPENAI, y.CLAUDE];
    for (const A of f) {
      const h = (u = a.engineConfigs) == null ? void 0 : u[A];
      if (h && h.apiKey) {
        o = !0, i = A, c = h;
        break;
      }
    }
  }
  if (o && i && c) {
    B.info(`Using Vision API: ${i}`);
    const f = Y(i, c);
    if (f.translateImage)
      return f.translateImage(n, e, t);
  }
  throw new Error("NO_VISION_API_AVAILABLE");
}
function ze() {
  S.runtime.onMessage.addListener(((n, e, t) => (He(n, e).then(t).catch((s) => {
    B.error("Message handler error:", s), t({ success: !1, error: s.message });
  }), !0)));
}
async function He(n, e) {
  var t;
  switch (n.type) {
    case "TRANSLATE_REQUEST": {
      const { texts: s, sourceLang: a, targetLang: r, engine: o } = n.payload, i = (t = e.tab) == null ? void 0 : t.id;
      return { success: !0, data: await je(s, a, r, o, i ? (u) => {
        S.tabs.sendMessage(i, {
          type: "TRANSLATION_STREAM_CHUNK",
          payload: { chunk: u }
        });
      } : void 0, i) };
    }
    case "TRANSLATE_IMAGE_REQUEST": {
      const { imageBase64: s, sourceLang: a, targetLang: r, engine: o } = n.payload;
      return { success: !0, data: await qe(s, a, r, o) };
    }
    case "EXPLAIN_GRAMMAR_REQUEST": {
      const { text: s, sourceLang: a, targetLang: r } = n.payload;
      return { success: !0, data: await Ke(s, a, r) };
    }
    case "GET_SETTINGS":
      return { success: !0, data: await H() };
    case "UPDATE_SETTINGS":
      return { success: !0, data: await Le(n.payload) };
    case "VALIDATE_ENGINE":
      return { success: !0, data: await Fe(n.payload.engine) };
    case "CLEAR_CACHE":
      return await Ne(), { success: !0, data: null };
    case "GET_CACHE_STATS":
      return { success: !0, data: await $e() };
    case "DETECT_LANGUAGE":
      return { success: !0, data: await new le({ engine: y.GOOGLE_FREE }).detectLanguage(n.payload.text) };
    default:
      return { success: !1, error: `Unknown message type: ${n.type}` };
  }
}
async function z(n, e) {
  return S.tabs.sendMessage(n, e);
}
async function Ye(n) {
  try {
    await S.tabs.sendMessage(n, { type: "__PING__" });
  } catch {
    await S.scripting.executeScript({
      target: { tabId: n },
      files: ["content/index.js"]
    }), await S.scripting.insertCSS({
      target: { tabId: n },
      files: ["content/linguaflow.css"]
    });
  }
}
function Je() {
  S.contextMenus.create({
    id: "translate-page",
    title: "Translate Entire Page",
    contexts: ["page"]
  }), S.contextMenus.create({
    id: "translate-selection",
    title: "Translate Selection",
    contexts: ["selection"]
  }), S.contextMenus.create({
    id: "translate-image",
    title: "Translate Image",
    contexts: ["image"]
  }), S.contextMenus.onClicked.addListener(async (n, e) => {
    if (e != null && e.id)
      try {
        await Ye(e.id), n.menuItemId === "translate-page" ? await z(e.id, { type: "TRANSLATE_PAGE" }) : n.menuItemId === "translate-selection" && n.selectionText ? await z(e.id, {
          type: "TRANSLATE_SELECTION",
          payload: { text: n.selectionText }
        }) : n.menuItemId === "translate-image" && n.srcUrl && await z(e.id, {
          type: "TRANSLATE_IMAGE",
          payload: { srcUrl: n.srcUrl }
        });
      } catch (t) {
        B.error("Context menu action failed:", t);
      }
  });
}
function Ve() {
  S.commands.onCommand.addListener(async (n) => {
    const [e] = await S.tabs.query({ active: !0, currentWindow: !0 });
    if (e != null && e.id)
      switch (n) {
        case "toggle-translation":
          z(e.id, { type: "TOGGLE_TRANSLATION" }).catch(() => {
          });
          break;
        case "toggle-hover-mode":
          z(e.id, { type: "TOGGLE_HOVER_MODE" }).catch(() => {
          });
          break;
        case "toggle-selection-mode":
          z(e.id, { type: "TRANSLATE_CURRENT_SELECTION" }).catch(() => {
          });
          break;
      }
  });
}
B.info("Service worker starting");
ze();
Ve();
S.runtime.onInstalled.addListener((n) => {
  B.info("Extension installed, setting up context menus"), Je(), n.reason === "install" && S.tabs.create({ url: "welcome/index.html" });
});
S.storage.onChanged.addListener(async (n, e) => {
  var t, s;
  if (e === "local" && ((t = n.settings) != null && t.newValue)) {
    const a = await S.tabs.query({});
    for (const r of a)
      r.id && S.tabs.sendMessage(r.id, {
        type: "SETTINGS_CHANGED",
        payload: n.settings.newValue
      }).catch(() => {
      });
  }
  if (e === "sync" && ((s = n.syncedSettings) != null && s.newValue)) {
    const r = (await S.storage.local.get("settings")).settings || {}, o = {
      ...r,
      ...n.syncedSettings.newValue,
      engineConfigs: r.engineConfigs || {}
    };
    await S.storage.local.set({ settings: o });
  }
});
B.info("Service worker ready");
