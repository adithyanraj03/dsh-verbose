/**
 * dsh-verbose — mount harness for the browser half.
 *
 * The client file is a `window.__ModuleLoader__.load({ factory })` bundle, so it
 * cannot be imported. This evaluates the real file against a shim and asserts
 * the things that decide whether it works at all:
 *
 *  1. every service `apply()` touches is declared (cordis refuses an undeclared
 *     read — that is exactly how an earlier version failed to load),
 *  2. every strict codec can materialize its schema (dsh 0.2 rule; there are two,
 *     and only fixing the named one leaves the plugin refused),
 *  3. the utilities registration shadows the shipped Session-log button,
 *  4. the turn-footer registration exists and renders metrics from a Turn,
 *  5. the two extra settings are actually wired into the dialog.
 *
 * Engine classification is covered separately by classify.test.mjs.
 *
 * Run:  node tests/client.test.mjs
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const here = fileURLToPath(new URL(".", import.meta.url));
const source = readFileSync(here + "../client.js", "utf8");

let failures = 0;
const check = (label, ok, extra = "") => {
  console.log((ok ? "PASS  " : "FAIL  ") + label + (extra ? "  -> " + extra : ""));
  if (!ok) failures += 1;
};

// ---------------------------------------------------------------- shims ----
let captured = null;
const fakeReact = {
  createElement: (type, props, ...children) => ({ type, props, children }),
  useState: (initial) => [typeof initial === "function" ? initial() : initial, () => {}],
  useEffect: () => {},
  useCallback: (fn) => fn,
  useMemo: (fn) => fn(),
  useRef: (value) => ({ current: value ?? null })
};
const styles = [];
const fakeDocument = {
  getElementById: () => null,
  querySelector: () => null,
  createElement: () => ({ style: {}, dataset: {}, textContent: "", id: "", appendChild() {} }),
  head: { appendChild: (node) => styles.push(node) },
  body: { appendChild() {} },
  documentElement: { dataset: {} },
  addEventListener: () => {},
  removeEventListener: () => {}
};
const store = new Map();
const fakeWindow = {
  __ModuleLoader__: { load: (definition) => (captured = definition) },
  localStorage: {
    getItem: (key) => (store.has(key) ? store.get(key) : null),
    setItem: (key, value) => store.set(key, String(value))
  },
  addEventListener: () => {},
  removeEventListener: () => {},
  dispatchEvent: () => true,
  matchMedia: () => ({ matches: false, addEventListener: () => {}, removeEventListener: () => {} })
};

const requireFn = (id) => {
  if (id === "react") return fakeReact;
  throw new Error("unexpected require in client.js: " + id);
};

new Function("window", "document", "navigator", source)(fakeWindow, fakeDocument, {
  clipboard: { writeText: async () => {} }
});

check("the bundle registers with the module loader", captured !== null);
check("the loader id is the package name", captured?.id === "dsh-verbose", captured?.id);

const mod = captured.factory(requireFn);

// ------------------------------------------------ cordis surface -----
console.log("\n--- what decides whether it mounts ---");
const declared = new Set(mod.inject ?? []);
check("inject declares every service apply reads", declared.has("slots") && declared.has("remote") && declared.has("configForms"), [...declared].join(", "));
check("apply is an async function", mod.apply?.constructor?.name === "AsyncFunction");

const strictCodecs = source.split("\n").filter((line) => line.includes('mode: "strict"'));
check(
  "every strict codec can materialize its schema (dsh 0.2 rule)",
  strictCodecs.length > 0 && strictCodecs.every((line) => line.includes("create:")),
  `${strictCodecs.length} codec(s), ${strictCodecs.filter((line) => line.includes("create:")).length} with create()`
);

// ------------------------------------------------ registration -----
console.log("\n--- the two slot registrations ---");
const registrations = [];
let mountCalls = 0;
const ctx = {
  effect: () => () => {},
  get: () => undefined,
  logger: { info: () => {}, warn: () => {} },
  remote: {
    async $mount() {
      mountCalls += 1;
      return () => {};
    }
  },
  slots: {
    inject: (name, register) => register(),
    register: (meta, component) => {
      registrations.push({ meta, component });
      return () => {};
    }
  }
};

await mod.apply(ctx);

check("two slots are registered (menu + turn footer)", registrations.length === 2, String(registrations.length));
const menu = registrations.find((entry) => entry.meta.name === "conversation.session.header.utilities");
const footer = registrations.find((entry) => entry.meta.name === "conversation.chat.turnTail");

check("the menu registers into the header utilities", menu !== undefined, menu?.meta?.name);
check("it registers under its OWN id, so nothing is shadowed", menu?.meta?.id === "verbose-dialog-host", menu?.meta?.id);
check("it declares no priority override", menu?.meta?.priority === undefined, String(menu?.meta?.priority));
check("the shipped menu is left untouched", menu?.meta?.id !== "session-log-download");
check("the footer registers into the turn tail", footer !== undefined, footer?.meta?.name);
check("the footer has a stable id", footer?.meta?.id === "verbose-turn-footer", footer?.meta?.id);
check("the governor remote is mounted in a try (optional bridge)", mountCalls === 1, String(mountCalls));

// ------------------------------------------------ render -----
console.log("\n--- rendering ---");
let rendered = null;
try {
  rendered = menu.component({ sessionId: "session-abc" });
} catch (error) {
  check("the dialog host renders", false, String(error));
}
check("the dialog host is invisible until asked", rendered === null);

let tree = rendered;
if (typeof rendered?.type === "function") tree = rendered.type(rendered.props);
const flat = JSON.stringify(tree);
check("the rows are injected into the shipped menu, not slotted", source.includes("function augmentMenu") && source.includes("function watchSessionMenu"));
check("the injection is guarded to that menu only", source.includes("function isSessionMenu") && source.includes('"session log"'));
check("the dialog opens on an event, so it stays React", source.includes('"dshvm:open-dialog"') && source.includes("function DialogHost"));

const at = Date.parse("2026-10-27T00:00:00Z");
const turn = {
  nodes: [
    { kind: "assistant", at, usage: { promptTokens: 900, completionTokens: 100 } },
    { kind: "tool", at: at + 1500, usage: { totalTokens: 500 } },
    { kind: "assistant", at: at + 4000, usage: { totalTokens: 250 } }
  ]
};
let footTree = footer.component({ turn });
if (typeof footTree?.type === "function") footTree = footTree.type(footTree.props);
const footFlat = JSON.stringify(footTree);
check("the footer renders for a turn", footTree !== null && footTree !== undefined);
check("it shows the measured elapsed time", footFlat.includes("4.0s"), footFlat.slice(0, 160));
check("it shows the node and tool counts", footFlat.includes("3 nodes") && footFlat.includes("1 tool"), footFlat.slice(0, 200));
check("it shows the token total", footFlat.includes("1.8k tokens"), footFlat.slice(0, 220));
check("raw JSON is off by default, so no pre block", !footFlat.includes("dshvm-raw"));

const emptyFoot = JSON.stringify(footer.component({ turn: {} }));
check("an empty turn degrades instead of throwing", !emptyFoot.includes("NaN") && !emptyFoot.includes("undefined"));

// ------------------------------------------------ the extra settings -----
console.log("\n--- the two settings this port adds ---");
check("the extra categories exist", source.includes('"Turn metrics"') && source.includes('"Raw turn JSON"'));
check("both are wired into the dialog", source.includes("props.onToggleExtra") && source.includes("EXTRAS.map"));
check("their defaults are declared", /metrics:\s*true/.test(source) && /rawTurn:\s*false/.test(source));
check("preferences are namespaced to this plugin", source.includes('"dsh-verbose.verbose"') && source.includes('"dsh-verbose.categories"'));
check("the footer has its own stylesheet", source.includes('"dshvm-styles-footer"'));

// The third group: what happens to a finished turn. The first two values are
// dsh's own collapse timing; "never" reuses the per-chat Verbose switch instead
// of inventing a flag that could disagree with it.
const foldSection = source.slice(source.indexOf("const FOLD_OPTIONS"), source.indexOf("const DEFAULT_PREFS"));
check("three fold choices exist", ["completion", "next-input", "never"].every((id) => foldSection.includes(`id: "${id}"`)), foldSection.replace(/\s+/g, " ").slice(0, 120));
check("the fold group is rendered in the dialog", source.includes('"After a turn"') && source.includes("props.onFold"));
check("two choices write dsh's own collapse timing", source.includes("writeCollapseTiming("));
check('the third flips the per-chat Verbose switch instead', /next === "never"[\s\S]{0,160}setChatVerbose\(openSessionId, true\)/.test(source));
check("the chat settings form is the one dsh owns", source.includes('ctx.configForms.get("ui-chat")'));

// The dialog treats an absent key as ON while the engine requires === true, so a
// category missing from DEFAULT_PREFS renders as enabled and expands nothing.
const missingDefaults = ["thinking", "tools", "terminal", "groups"].filter(
  (key) => !new RegExp("\\b" + key + "\\s*:\\s*true").test(source)
);
check("every category is on by default, so the dialog and the engine agree", missingDefaults.length === 0, missingDefaults.join(", "));
check("the nested step-group rows are part of the row query", source.includes("[data-process-activity][aria-expanded]"));
check("programmatic clicks give the keyboard back", source.includes("clickingWithoutFocus") && source.includes("preventScroll: true"));
check("a click cannot scroll the transcript to the row", source.includes("function clickQuietly") && source.includes("row.focus = () => {}"));

// Viewport-scoped expansion: the engine must know how to expand what is on
// screen, collapse what is not, and notice scrolling.
check("expansion scope defaults to the viewport", /visibleOnly:\s*true/.test(source));
check("the dialog offers the expansion scope", source.includes('"Only what is on screen"'));
check("the engine can sync to the viewport", source.includes("syncViewport(prefs)") && source.includes("shouldOpen(row)") && source.includes("shouldClose(row)"));
check("expansion and collapse use separate bands (no boomerang)", /OPEN_EDGE\s*=\s*(\d+)/.test(source) && /CLOSE_EDGE\s*=\s*(\d+)/.test(source) && Number(/CLOSE_EDGE\s*=\s*(\d+)/.exec(source)[1]) > Number(/OPEN_EDGE\s*=\s*(\d+)/.exec(source)[1]));
check("folding waits for the scroll to settle", source.includes("lastInputAt") && source.includes("> 600"));
check("the pass corrects the scroll position so content does not jump", source.includes("findAnchor()") && source.includes("scrollParentOf(row)") && source.includes("scrollTop += delta"));
check("a fold fades instead of snapping", source.includes("row.animate(") && source.includes("duration: 170"));
check("a pass that clicked suppresses its own mutations", source.includes("suppressUntil") && source.includes("320"));
check("scrolling re-runs the pass", source.includes('document.addEventListener("scroll"') && source.includes('document.removeEventListener("scroll"'));
check("flipping the scope re-runs the engine", /key !== "visibleOnly"[\s\S]{0,220}engine\.pass\(\)/.test(source));

console.log(`\n${failures === 0 ? "ALL CHECKS PASSED" : failures + " CHECK(S) FAILED"}`);
process.exit(failures === 0 ? 0 : 1);
