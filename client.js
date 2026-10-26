window.__ModuleLoader__.load({
  id: "dsh-verbose",
  factory: (require) => {
    var module = { exports: {} };
    var exports = module.exports;
    Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });

    const React = require("react");
    const h = React.createElement;

    /* ================================================================== *
     * Remote contribution for the `contextGovernor` namespace.
     *
     * The host half of THIS plugin republishes context-governor's plain cordis
     * service over Typert; these descriptors are the browser end of it. When
     * context-governor is not mounted the host answers `available: false`, and
     * the Compact settings item hides itself rather than erroring.
     * ================================================================== */
    function identity(value) {
      return value;
    }
    // dsh 0.2 refuses any strict codec that cannot materialize its schema.
    const CG_CODEC = { mode: "strict", typeSymbol: "dsh-verbose/json", schema: { parse: identity }, create: () => CG_CODEC.schema };
    function cgParameter(name) {
      return { name, wire: name, source: "json", codec: CG_CODEC };
    }
    function cgDescriptor(method, names) {
      return {
        id: "dsh-verbose#contextGovernor/" + method,
        service: "contextGovernor",
        namespace: "contextGovernor",
        method,
        invocation: { kind: "direct" },
        parameters: names.map(cgParameter),
        result: { mode: "strict", typeSymbol: "dsh-verbose/json", schema: { parse: identity }, create: () => CG_CODEC.schema },
        sourceLocation: { file: "dsh-verbose/client.js", line: 1, column: 1 },
      };
    }
    const CG_CONTRIBUTION = {
      package: "dsh-verbose",
      descriptors: [
        cgDescriptor("status", ["sessionId"]),
        cgDescriptor("setSettings", ["sessionId", "patch"]),
        cgDescriptor("setDefaults", ["patch"]),
        cgDescriptor("compactNow", ["sessionId"]),
        cgDescriptor("listRoutes", []),
      ],
    };

    /**
     * Unwrap one gateway response.
     *
     * Every remote call resolves to an envelope — `{ok: true, value}` or
     * `{ok: false, error}`. Reading a field off the envelope itself yields
     * undefined with no rejection, so the failure is silent; that exact mistake
     * produced two "empty panel" bugs elsewhere in this profile.
     */
    function unwrap(answer) {
      if (answer && answer.ok === false) {
        const error = answer.error || {};
        throw new Error((error.code ? error.code + ": " : "") + (error.message || "the host refused the call"));
      }
      if (answer && Object.prototype.hasOwnProperty.call(answer, "value")) return answer.value;
      return answer;
    }

    function governorRemote(ctx) {
      try {
        return ctx.get("remote.contextGovernor");
      } catch (error) {
        return undefined;
      }
    }

    /** Thousands separators without pulling in a formatter. */
    function commas(value) {
      return typeof value === "number" ? value.toLocaleString() : "—";
    }

    /** Compact token count, matching how the composer's own bar reads. */
    function compact(value) {
      if (typeof value !== "number") return "—";
      if (value < 1000) return String(value);
      const thousands = value / 1000;
      return (thousands >= 100 ? Math.round(thousands) : Math.round(thousands * 10) / 10) + "K";
    }

    /**
     * Disclosure chevron: `>` collapsed, rotated to a `v` when open.
     *
     * One glyph rotated rather than two swapped, so the change animates and the
     * arrow cannot end up disagreeing with the row's aria-expanded state.
     */
    const IconChevronRight = () =>
      h(
        "svg",
        { width: 12, height: 12, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2.4, strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true" },
        h("path", { d: "M9 6l6 6-6 6" }),
      );

    /**
     * Pressure band for a used/budget ratio against this chat's compaction point.
     *
     * "tight" starts at the compaction threshold rather than at some fixed fraction,
     * so the colour means the same thing as the setting the user chose.
     */
    function levelOf(ratio, nudgePct) {
      if (typeof ratio !== "number") return "none";
      if (ratio >= 1) return "over";
      if (ratio >= (typeof nudgePct === "number" ? nudgePct : 0.7)) return "tight";
      return "ok";
    }

    /* ================================================================== *
     * Styles
     *
     * Scoped by the dshvm- prefix. Host class names are build-time hashes of
     * another package and are not a contract, so host markup is reached
     * through semantic attributes instead; the single remaining hash-suffix
     * heuristic is called out where it appears.
     * ================================================================== */
    const CSS = [
      /* -- trigger ------------------------------------------------------- */
      // The header lays its utilities out on a text baseline, which drops an
      // inline-flex box below the icon buttons beside it. Centring the box and
      // aligning it middle puts the glyph on their centre line.
      ".dshvm-wrap{position:relative;display:inline-flex;align-items:center;align-self:center;vertical-align:middle}",
      ".dshvm-dots{appearance:none;display:inline-flex;align-items:center;justify-content:center;width:26px;height:26px;padding:0;border-radius:6px;border:1px solid transparent;background:transparent;color:var(--dsw-alias-label-secondary);cursor:pointer;vertical-align:middle}",
      ".dshvm-dots:hover{background:var(--dsw-alias-bg-module-platform);color:var(--dsw-alias-label-primary)}",
      ".dshvm-dots[aria-expanded=true]{background:var(--dsw-alias-bg-module-platform);color:var(--dsw-alias-label-primary);border-color:var(--dsw-alias-label-dimmed)}",
      ".dshvm-dots:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:1px}",
      /* -- menu ---------------------------------------------------------- */
      ".dshvm-scrim{position:fixed;inset:0;z-index:70;background:transparent;border:0;padding:0;cursor:default}",
      ".dshvm-menu{position:absolute;top:calc(100% + 6px);right:0;z-index:71;min-width:200px;padding:6px;border-radius:12px;border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-layer-2);box-shadow:0 10px 30px rgba(0,0,0,.32)}",
      ".dshvm-item{position:relative;display:flex;align-items:center;gap:10px;width:100%;padding:7px 10px;border:0;border-radius:8px;background:transparent;color:var(--dsw-alias-label-primary);font:inherit;font-size:13px;line-height:20px;text-align:left;cursor:pointer}",
      ".dshvm-item:hover{background:var(--dsw-alias-bg-module-platform)}",
      ".dshvm-item:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:-2px}",
      ".dshvm-item:disabled{opacity:.55;cursor:default}",
      ".dshvm-label{flex:1;min-width:0}",
      ".dshvm-icon{flex:none;display:inline-flex;color:var(--dsw-alias-label-tertiary)}",
      ".dshvm-caret{flex:none;color:var(--dsw-alias-label-tertiary)}",
      ".dshvm-check{flex:none;width:14px;color:var(--dsw-alias-brand-primary)}",
      ".dshvm-err{margin:4px 8px 2px;font-size:12px;line-height:1.4;color:var(--dsw-alias-label-error)}",
      /* The wrapper is the hover bridge: it reaches to the parent menu's edge
         and carries the visual gap as transparent padding, so the pointer
         never crosses dead space on its way to the panel. */
      ".dshvm-subwrap{position:absolute;top:-6px;right:100%;padding-right:6px}",
      ".dshvm-sub{min-width:150px;padding:6px;border-radius:12px;border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-layer-2);box-shadow:0 10px 30px rgba(0,0,0,.32)}",
      /* -- settings popup ------------------------------------------------ */
      ".dshvm-modal{position:fixed;inset:0;z-index:80;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,.45)}",
      // The dialog itself must never grow past the viewport: expanding a
      // server with fifteen tools used to push the Done button off-screen.
      ".dshvm-dialog{display:flex;flex-direction:column;width:min(400px,94vw);max-height:min(88vh,760px);overflow-y:auto;overscroll-behavior:contain;padding:18px;border-radius:14px;border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-layer-2);box-shadow:0 18px 48px rgba(0,0,0,.4)}",
      // Only the middle scrolls, so the title and the actions stay put.
      ".dshvm-dbody{flex:1;min-height:0;overflow-y:auto;overscroll-behavior:contain;padding-right:4px;margin-right:-4px}",
      ".dshvm-dbody::-webkit-scrollbar{width:8px}",
      ".dshvm-dbody::-webkit-scrollbar-thumb{background:var(--dsw-alias-border-l2);border-radius:999px;border:2px solid transparent;background-clip:padding-box}",
      ".dshvm-dbody::-webkit-scrollbar-track{background:transparent}",
      ".dshvm-dtitle{margin:0 0 4px;font-size:15px;font-weight:600;color:var(--dsw-alias-label-primary)}",
      ".dshvm-dhint{margin:0 0 14px;font-size:12px;line-height:1.5;color:var(--dsw-alias-label-tertiary)}",
      ".dshvm-row{display:flex;align-items:flex-start;gap:10px;padding:8px 0;border-top:1px solid var(--dsw-alias-border-l2)}",
      ".dshvm-compactLog{display:flex;flex-direction:column;gap:3px;margin:8px 0 2px}",
      ".dshvm-compactEntry{font-size:12px;color:var(--dsw-alias-label-secondary);font-variant-numeric:tabular-nums;overflow-wrap:anywhere}",
      ".dshvm-compactFail{color:#ef4444}",
      ".dshvm-rtext{flex:1;min-width:0;display:flex;flex-direction:column;gap:2px}",
      ".dshvm-rname{font-size:13px;font-weight:500;color:var(--dsw-alias-label-primary)}",
      ".dshvm-rdesc{font-size:12px;line-height:1.45;color:var(--dsw-alias-label-tertiary)}",
      ".dshvm-switch{appearance:none;flex:none;margin-top:2px;width:38px;height:21px;border-radius:999px;border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-module-platform);position:relative;cursor:pointer;transition:background .16s,border-color .16s}",
      ".dshvm-switchOn{background:var(--dsw-alias-brand-primary);border-color:var(--dsw-alias-brand-primary)}",
      ".dshvm-knob{position:absolute;top:2px;left:2px;width:15px;height:15px;border-radius:999px;background:var(--dsw-alias-bg-layer-3);transition:transform .16s}",
      ".dshvm-knobOn{transform:translateX(17px)}",
      ".dshvm-foot{display:flex;justify-content:flex-end;gap:8px;margin-top:16px}",
      /* -- gauge trigger, sitting to the left of the dots ---------------- */
      ".dshvm-gauge{appearance:none;position:relative;display:inline-flex;align-items:center;justify-content:center;width:26px;height:26px;padding:0;margin-right:2px;border-radius:6px;border:1px solid transparent;background:transparent;color:var(--dsw-alias-label-secondary);cursor:pointer;vertical-align:middle}",
      ".dshvm-gauge:hover{background:var(--dsw-alias-bg-module-platform);color:var(--dsw-alias-label-primary)}",
      ".dshvm-gauge:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:1px}",
      /* A pressure pip, so the header carries the state without being asked. */
      ".dshvm-pip{position:absolute;right:3px;bottom:3px;width:6px;height:6px;border-radius:999px;background:var(--dsw-cg-ok);box-shadow:0 0 0 1.5px var(--dsw-alias-bg-base)}",
      ".dshvm-pip[data-level=\"tight\"]{background:var(--dsw-cg-warn)}",
      ".dshvm-pip[data-level=\"over\"]{background:var(--dsw-cg-danger)}",
      ".dshvm-pip[data-level=\"none\"]{display:none}",
      /* -- palette ------------------------------------------------------- */
      ":root,body{--dsw-cg-system:#8b949e;--dsw-cg-tools:#a371f7;--dsw-cg-messages:#4c8dff;--dsw-cg-ok:#3fb950;--dsw-cg-warn:#d29922;--dsw-cg-danger:#f85149}",
      /* -- segmented meter ----------------------------------------------- */
      ".dshvm-meter{position:relative;margin:10px 0 8px;height:10px;border-radius:999px;background:var(--dsw-alias-bg-module-platform);overflow:hidden;display:flex}",
      ".dshvm-seg{height:100%;transition:width .25s}",
      ".dshvm-seg[data-part=\"system\"]{background:var(--dsw-cg-system)}",
      ".dshvm-seg[data-part=\"tools\"]{background:var(--dsw-cg-tools)}",
      ".dshvm-seg[data-part=\"messages\"]{background:var(--dsw-cg-messages)}",
      ".dshvm-seg[data-part=\"used\"]{background:var(--dsw-cg-messages)}",
      /* Threshold ticks drawn over the track, so the slider has a target. */
      ".dshvm-tick{position:absolute;top:-2px;bottom:-2px;width:2px;border-radius:1px;pointer-events:none}",
      ".dshvm-tick[data-kind=\"nudge\"]{background:var(--dsw-alias-label-primary);opacity:.75}",
      ".dshvm-tick[data-kind=\"emergency\"]{background:var(--dsw-cg-danger);opacity:.85}",
      ".dshvm-legend{display:flex;flex-wrap:wrap;gap:4px 14px;margin:0 0 10px;font-size:12px;line-height:18px}",
      ".dshvm-lg{display:inline-flex;align-items:center;gap:6px;color:var(--dsw-alias-label-tertiary)}",
      ".dshvm-sw{width:8px;height:8px;border-radius:2px;flex:none}",
      ".dshvm-lgval{color:var(--dsw-alias-label-secondary);font-variant-numeric:tabular-nums}",
      ".dshvm-headline{display:flex;align-items:baseline;justify-content:space-between;gap:10px;margin:2px 0 0}",
      ".dshvm-big{font-size:20px;font-weight:600;color:var(--dsw-alias-label-primary);font-variant-numeric:tabular-nums}",
      ".dshvm-sub{font-size:12px;color:var(--dsw-alias-label-tertiary);font-variant-numeric:tabular-nums}",
      ".dshvm-badge{display:inline-block;padding:1px 7px;border-radius:999px;font-size:11px;line-height:16px;background:var(--dsw-alias-bg-module-platform);color:var(--dsw-alias-label-tertiary)}",
      ".dshvm-badge[data-level=\"tight\"]{background:color-mix(in srgb,var(--dsw-cg-warn) 22%,transparent);color:var(--dsw-cg-warn)}",
      ".dshvm-badge[data-level=\"over\"]{background:color-mix(in srgb,var(--dsw-cg-danger) 22%,transparent);color:var(--dsw-cg-danger)}",
      ".dshvm-meterFill{height:100%;border-radius:999px;background:var(--dsw-alias-brand-primary,#4c8dff);transition:width .2s,background .2s}",
      ".dshvm-meterFill[data-tight=\"true\"]{background:var(--dsw-alias-state-warn-label,#d29922)}",
      ".dshvm-meterFill[data-over=\"true\"]{background:var(--dsw-alias-state-error-primary,#f85149)}",
      ".dshvm-facts{display:grid;grid-template-columns:auto 1fr;gap:2px 12px;margin:8px 0 2px;font-size:12px;line-height:18px}",
      ".dshvm-fkey{color:var(--dsw-alias-label-tertiary)}",
      ".dshvm-fval{color:var(--dsw-alias-label-secondary);font-variant-numeric:tabular-nums}",
      ".dshvm-slider{width:100%;margin:6px 0 0;accent-color:var(--dsw-alias-brand-primary,#4c8dff)}",
      ".dshvm-sliderRow{display:flex;align-items:baseline;justify-content:space-between;gap:10px;padding-top:10px;border-top:1px solid var(--dsw-alias-border-l2)}",
      ".dshvm-sliderVal{font-size:13px;font-weight:600;color:var(--dsw-alias-label-primary);font-variant-numeric:tabular-nums}",
      /* -- inventory tree ------------------------------------------------ */
      ".dshvm-tree{margin:2px 0 10px;border-top:1px solid var(--dsw-alias-border-l2)}",
      ".dshvm-trow{display:flex;align-items:center;gap:8px;width:100%;padding:5px 2px;border:0;background:transparent;color:inherit;font:inherit;font-size:12px;line-height:18px;text-align:left;cursor:default}",
      ".dshvm-trow[data-clickable=\"true\"]{cursor:pointer}",
      ".dshvm-trow[data-clickable=\"true\"]:hover{background:var(--dsw-alias-bg-module-platform);border-radius:6px}",
      ".dshvm-tname{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:var(--dsw-alias-label-secondary)}",
      ".dshvm-tnum{flex:none;color:var(--dsw-alias-label-primary);font-variant-numeric:tabular-nums}",
      ".dshvm-tpct{flex:none;width:44px;text-align:right;color:var(--dsw-alias-label-tertiary);font-variant-numeric:tabular-nums}",
      ".dshvm-tcount{flex:none;padding:0 6px;border-radius:999px;background:var(--dsw-alias-bg-module-platform);color:var(--dsw-alias-label-tertiary);font-size:11px}",
      ".dshvm-tchev{flex:none;width:12px;color:var(--dsw-alias-label-tertiary);transition:transform .12s}",
      ".dshvm-tchev[data-open=\"true\"]{transform:rotate(90deg)}",
      // A long tool list scrolls inside its own group rather than stretching
      // the dialog: fifteen MCP tools is a normal number, not an exception.
      ".dshvm-titems{max-height:190px;overflow-y:auto;overscroll-behavior:contain}",
      ".dshvm-titems::-webkit-scrollbar{width:8px}",
      ".dshvm-titems::-webkit-scrollbar-thumb{background:var(--dsw-alias-border-l2);border-radius:999px;border:2px solid transparent;background-clip:padding-box}",
      ".dshvm-titems::-webkit-scrollbar-track{background:transparent}",
      ".dshvm-titem{padding-left:22px}",
      ".dshvm-titem .dshvm-tname{color:var(--dsw-alias-label-tertiary)}",
      /* -- route picker --------------------------------------------------- */
      ".dshvm-select{width:100%;margin:4px 0 0;padding:6px 8px;border-radius:8px;border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-base);color:var(--dsw-alias-label-primary);font:inherit;font-size:13px}",
      ".dshvm-actions{display:flex;flex-wrap:wrap;gap:12px;margin:8px 0 0}",
      ".dshvm-reset{appearance:none;border:0;background:transparent;padding:0;font:inherit;font-size:12px;color:var(--dsw-alias-label-tertiary);cursor:pointer;text-decoration:underline}",
      ".dshvm-done{appearance:none;font:inherit;font-size:13px;padding:6px 16px;border-radius:8px;border:0;background:var(--dsw-alias-label-primary);color:var(--dsw-alias-bg-layer-3);cursor:pointer}",
      /* -- verbose transcript -------------------------------------------- */
      "body.dshvm-verbose{--dsl-terminal-output-max-height:none}",
      /* The tool I/O card clamps itself to 150px and scrolls. That class name
         IS a build hash, but its readable suffix is stable across builds, so a
         suffix match is the least brittle option available; if it stops
         matching, Verbose merely stops unclamping and the rest still works. */
      'body.dshvm-verbose [class*="_ioSection"]{max-height:none!important;overflow-y:visible!important}',
      'body.dshvm-verbose [class*="_terminal"]{--dsl-terminal-output-max-height:none}',
    ].join("");

    /* ================================================================== *
     * Turn footer styles
     *
     * A second stylesheet rather than an edit to the shipped one: the original
     * CSS belongs to the menu, and keeping the footer's rules apart makes it
     * obvious which half is a port and which half is new.
     * ================================================================== */
    const FOOTER_CSS = [
      ".dshvm-tfoot{display:flex;flex-wrap:wrap;align-items:center;gap:8px;padding:4px 0 2px;font-size:11px;",
      "color:var(--dsw-alias-label-tertiary,#9aa0a6);font-variant-numeric:tabular-nums}",
      ".dshvm-chip{display:inline-flex;align-items:center;gap:4px;padding:1px 7px;border-radius:999px;",
      "background:var(--dsw-alias-interactive-bg-hover-solid,rgba(128,128,128,.14))}",
      ".dshvm-link{appearance:none;border:0;background:none;padding:0;cursor:pointer;font:inherit;font-size:11px;",
      "color:var(--dsw-alias-label-secondary,#c4c7c5);text-decoration:underline;text-underline-offset:2px}",
      ".dshvm-rawwrap{display:flex;flex-direction:column;gap:6px;flex-basis:100%;margin-top:4px}",
      ".dshvm-raw{margin:0;max-height:240px;overflow:auto;padding:8px 10px;border-radius:8px;white-space:pre-wrap;",
      "word-break:break-word;font-family:ui-monospace,SFMono-Regular,monospace;font-size:10.5px;line-height:1.5;",
      "background:var(--dsw-alias-markdown-code-block,rgba(128,128,128,.08))}",
      ".dshvm-seg{display:flex;gap:6px;margin:2px 0 2px;flex-wrap:wrap}",
      ".dshvm-seg button{appearance:none;border:.5px solid var(--dsw-alias-border-l2,rgba(128,128,128,.3));",
      "background:transparent;color:var(--dsw-alias-label-secondary,#c4c7c5);font:inherit;font-size:11.5px;",
      "padding:4px 10px;border-radius:999px;cursor:pointer}",
      ".dshvm-seg button[data-on]{background:var(--dsw-alias-interactive-bg-hover-solid,rgba(128,128,128,.18));",
      "border-color:var(--dsw-alias-border-l3,rgba(128,128,128,.5));color:var(--dsw-alias-label-primary,#e8eaed);font-weight:600}",      /* Injected-menu overrides live here because this sheet loads after the
         ported one — the original .dshvm-sub rule is elsewhere in there. */
      ".dshvm-sub{display:flex;flex-direction:column;min-width:132px;padding:4px;border-radius:10px;",
      "background:var(--dsw-alias-bg-layer-2,#1f2023);border:.5px solid var(--dsw-alias-border-l2,rgba(128,128,128,.3));",
      "box-shadow:0 10px 28px rgba(0,0,0,.35);position:fixed;transform:translateX(-100%)}",
      ".dshvm-sub .dshvm-subItem{appearance:none;border:0;background:transparent;color:inherit;font:inherit;",
      "font-size:13px;text-align:left;padding:6px 10px;border-radius:7px;display:flex;align-items:center;",
      "justify-content:space-between;gap:16px;cursor:pointer}",
      ".dshvm-sub .dshvm-subItem:hover{background:var(--dsw-alias-interactive-bg-hover-solid,rgba(128,128,128,.16))}",      ".dshvm-group{margin:14px 0 2px;font-size:11px;text-transform:uppercase;letter-spacing:.07em;",
      "color:var(--dsw-alias-label-tertiary,#9aa0a6)}",
    ].join("");
    function injectStyles() {
      // Two sheets: the menu's (shipped with the port) and the footer's (new).
      if (document.getElementById("dshvm-styles") === null) {
        const style = document.createElement("style");
        style.id = "dshvm-styles";
        style.textContent = CSS;
        document.head.appendChild(style);
      }
      if (document.getElementById("dshvm-styles-footer") === null) {
        const style = document.createElement("style");
        style.id = "dshvm-styles-footer";
        style.textContent = FOOTER_CSS;
        document.head.appendChild(style);
      }
    }

    /* ================================================================== *
     * Stored settings
     *
     * Two scopes, deliberately:
     *  - WHICH CHAT is verbose is per session id (a reading choice about one
     *    conversation).
     *  - WHAT VERBOSE MEANS is one global set of categories; it describes the
     *    mode itself, so per-chat copies would only create drift.
     * Both live in localStorage: this is how you want to read, not part of the
     * session's content.
     * ================================================================== */
    const VERBOSE_KEY = "dsh-verbose.verbose";
    const PREFS_KEY = "dsh-verbose.categories";

const EXTRA_PREFS = { metrics: true, rawTurn: false, foldAfter: "completion", visibleOnly: true };

    /**
     * What happens to a finished turn.
     *
     * The first two are dsh's own `ui-chat.collapseTiming`; the third is not a
     * dsh value at all - "keep this chat expanded" is the per-chat Verbose
     * switch, so choosing it flips that switch rather than inventing a second
     * flag that could disagree with it.
     */
    const FOLD_OPTIONS = [
      { id: "completion", label: "At answer end" },
      { id: "next-input", label: "On next message" },
      { id: "never", label: "Keep expanded" },
    ];

    /** One event keeps every footer in the page in step with the settings dialog. */
    const PREFS_EVENT = "dsh-verbose:prefs";

    /**
     * The switches this plugin adds on top of the engine categories.
     *
     * The categories answer "what does Verbose expand"; these answer "what does
     * the transcript show on its own". They are deliberately NOT in CATEGORIES:
     * the engine classifies disclosure rows by category, and a "metrics" row
     * does not exist — putting them there would make the engine look for rows
     * that can never be found.
     */
    const EXTRAS = [
      { key: "metrics", name: "Turn metrics", desc: "Elapsed time, node and tool counts, and token totals under each turn." },
      { key: "rawTurn", name: "Raw turn JSON", desc: "A collapsed copy of the turn object with a copy button, for when a renderer surprises you." },
    ];

    const DEFAULT_PREFS = { thinking: true, tools: true, terminal: true, groups: true, ...EXTRA_PREFS };

    function readJson(key, fallback) {
      try {
        const raw = window.localStorage.getItem(key);
        if (raw === null) return fallback;
        const parsed = JSON.parse(raw);
        return parsed !== null && typeof parsed === "object" ? parsed : fallback;
      } catch (error) {
        return fallback;
      }
    }

    function writeJson(key, value) {
      try {
        window.localStorage.setItem(key, JSON.stringify(value));
      } catch (error) {
        /* private mode / quota - the choice still applies for this page */
      }
      if (key !== PREFS_KEY) return;
      // localStorage emits nothing in the writing tab, and the footer lives in a
      // separate component tree from the menu, so a write announces itself.
      try {
        window.dispatchEvent(new Event(PREFS_EVENT));
      } catch (error) {
        /* no window events (test shim); the footer still reads on mount */
      }
    }

    const isVerbose = (sessionId) =>
      sessionId !== undefined && readJson(VERBOSE_KEY, {})[String(sessionId)] === true;

    function setVerbose(sessionId, on) {
      if (sessionId === undefined) return;
      const map = readJson(VERBOSE_KEY, {});
      // Absent already means Normal, so deleting keeps the map from growing a
      // row for every chat ever opened.
      if (on) map[String(sessionId)] = true;
      else delete map[String(sessionId)];
      writeJson(VERBOSE_KEY, map);
    }

    const readPrefs = () => ({ ...DEFAULT_PREFS, ...readJson(PREFS_KEY, {}) });

    /* ================================================================== *
     * Turn footer — the two switches that are ours, not dsh's
     *
     * dsh's renderer has no toggle for turn metrics or for the raw Turn object,
     * so the `conversation.chat.turnTail` slot gets an extra node. Everything
     * shown here is measured from the Turn the slot hands over; a field that is
     * absent is omitted, never printed as a zero.
     * ================================================================== */
    function clampText(text, max) {
      const value = typeof text === "string" ? text : String(text);
      if (!Number.isFinite(max) || max <= 0 || value.length <= max) return value;
      let end = Math.floor(max);
      const code = value.charCodeAt(end - 1);
      if (code >= 0xd800 && code <= 0xdbff) end -= 1;
      return value.slice(0, end) + `\n… ${value.length - end} more characters`;
    }

    function safeJson(value, max) {
      const seen = new WeakSet();
      let text;
      try {
        text = JSON.stringify(
          value,
          (_key, item) => {
            if (typeof item === "bigint") return `${item.toString()}n`;
            if (typeof item === "function") return "[function]";
            if (item !== null && typeof item === "object") {
              if (seen.has(item)) return "[circular]";
              seen.add(item);
            }
            return item;
          },
          2,
        );
      } catch {
        return "(this turn could not be serialized)";
      }
      if (typeof text !== "string") return String(text);
      return clampText(text, Number.isFinite(max) ? max : 20000);
    }

    function toEpochMs(value) {
      if (typeof value === "number" && Number.isFinite(value)) return value > 1e12 ? value : value * 1000;
      if (typeof value === "string") {
        const parsed = Date.parse(value);
        return Number.isNaN(parsed) ? null : parsed;
      }
      return null;
    }

    function humanMs(ms) {
      if (typeof ms !== "number" || !Number.isFinite(ms) || ms < 0) return "";
      if (ms < 1000) return Math.round(ms) + "ms";
      if (ms < 60000) return (ms / 1000).toFixed(1) + "s";
      const minutes = Math.floor(ms / 60000);
      const seconds = Math.round((ms % 60000) / 1000);
      return minutes + "m " + String(seconds).padStart(2, "0") + "s";
    }

    function humanTokens(value) {
      if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) return "";
      return value >= 1000 ? (value / 1000).toFixed(1) + "k" : String(Math.round(value));
    }

    /**
     * Read what one Turn contains without assuming a private shape.
     *
     * The interior of the Turn is not this plugin's contract, so every field is
     * optional; the summary degrades to a node count rather than throwing when
     * dsh renames something.
     */
    function summarizeTurn(turn) {
      const summary = { nodes: 0, tools: 0, tokens: null, elapsedMs: null };
      if (turn === null || typeof turn !== "object") return summary;

      const nodes = Array.isArray(turn.nodes) ? turn.nodes : Array.isArray(turn.items) ? turn.items : [];
      summary.nodes = nodes.length;

      let tokens = 0;
      let sawTokens = false;
      let first = null;
      let last = null;

      function absorb(usage) {
        if (usage === null || typeof usage !== "object") return;
        const total =
          typeof usage.totalTokens === "number"
            ? usage.totalTokens
            : (typeof usage.promptTokens === "number" ? usage.promptTokens : 0) +
              (typeof usage.completionTokens === "number" ? usage.completionTokens : 0);
        if (typeof total === "number" && total > 0) {
          tokens += total;
          sawTokens = true;
        }
      }

      absorb(turn.usage);
      absorb(turn.tokenUsage);

      for (const node of nodes) {
        if (node === null || typeof node !== "object") continue;
        const kind = typeof node.kind === "string" ? node.kind : typeof node.type === "string" ? node.type : "";
        if (kind === "tool" || kind === "tool-call" || kind === "tool.result") summary.tools += 1;
        absorb(node.usage);
        const at = toEpochMs(node.at ?? node.time ?? node.timestamp ?? node.createdAt);
        if (at !== null) {
          if (first === null || at < first) first = at;
          if (last === null || at > last) last = at;
        }
      }

      if (sawTokens) summary.tokens = tokens;
      const started = toEpochMs(turn.startedAt ?? turn.start ?? turn.createdAt);
      const ended = toEpochMs(turn.endedAt ?? turn.finishedAt ?? turn.completedAt ?? turn.end);
      const from = started ?? first;
      const to = ended ?? last;
      if (from !== null && to !== null && to >= from) summary.elapsedMs = to - from;
      return summary;
    }

    /** The footer node: chips when metrics are on, a disclosure when raw JSON is. */
    function TurnFooter(props) {
      const prefsHook = React.useState(readPrefs);
      const prefs = prefsHook[0];
      const setPrefs = prefsHook[1];
      const rawHook = React.useState(false);
      const rawOpen = rawHook[0];
      const setRawOpen = rawHook[1];

      React.useEffect(() => {
        function sync() {
          setPrefs(readPrefs());
        }
        window.addEventListener(PREFS_EVENT, sync);
        window.addEventListener("storage", sync);
        return () => {
          window.removeEventListener(PREFS_EVENT, sync);
          window.removeEventListener("storage", sync);
        };
      }, []);

      if (prefs.metrics !== true && prefs.rawTurn !== true) return null;

      const summary = summarizeTurn(props?.turn);
      const chips = [];
      if (prefs.metrics === true) {
        if (summary.elapsedMs !== null) chips.push("⏱ " + humanMs(summary.elapsedMs));
        if (summary.nodes > 0) chips.push(summary.nodes + (summary.nodes === 1 ? " node" : " nodes"));
        if (summary.tools > 0) chips.push(summary.tools + (summary.tools === 1 ? " tool" : " tools"));
        if (summary.tokens !== null) chips.push(humanTokens(summary.tokens) + " tokens");
      }

      return h(
        "div",
        { className: "dshvm-tfoot", "data-dshvm-foot": "" },
        chips.map((label, index) => h("span", { className: "dshvm-chip", key: index + ":" + label }, label)),
        prefs.rawTurn === true
          ? h(
              "button",
              {
                type: "button",
                className: "dshvm-link",
                "aria-expanded": rawOpen,
                onClick: () => setRawOpen(!rawOpen),
              },
              rawOpen ? "Hide raw JSON" : "Raw JSON",
            )
          : null,
        prefs.rawTurn === true && rawOpen
          ? h(
              "div",
              { className: "dshvm-rawwrap" },
              h("pre", { className: "dshvm-raw" }, safeJson(props?.turn, 20000)),
              h(
                "button",
                {
                  type: "button",
                  className: "dshvm-link",
                  onClick: () => {
                    try {
                      void navigator.clipboard.writeText(safeJson(props?.turn, 200000));
                    } catch (error) {
                      /* no clipboard permission; the text is visible above */
                    }
                  },
                },
                "Copy",
              ),
            )
          : null,
      );
    }

    /* ================================================================== *
     * The Verbose engine
     *
     * dsh keeps every disclosure's open/closed state in React-local state with
     * nothing exposed to read or set, so Verbose works the only way available
     * from outside: it opens collapsed rows and keeps opening ones that arrive
     * while an answer streams.
     *
     * The hooks are semantic, not cosmetic — no class hashes, no risk of
     * clicking unrelated controls. Every expandable row is rendered by the
     * `DisclosureRow` primitive as
     *
     *   <div data-disclosure-row data-expandable role="button" aria-expanded>
     *
     * (`data-expandable` and the click handler appear only when the caller
     * passes `expandOnRowClick`, which the transcript's rows all do), and the
     * bash toolview renders its own row carrying `data-sample="bash"` on that
     * same element.
     *
     * CLASSIFICATION MUST WALK UP, and getting that wrong is what made the
     * category switches inert. `data-variant="think"` is set by `ReasoningRow`
     * on a WRAPPER around the disclosure — it is never on the clickable row
     * itself. So the old compound selector `[data-expandable][data-variant=…]`
     * matched nothing at all, and worse, the "everything else" selector then
     * matched thinking rows: turning Thinking off changed nothing, while
     * turning Tool calls off silently governed thinking too.
     *
     * `closest()` is the fix. It also includes the element itself, which is
     * what makes the bash row — where `data-sample` and `data-expandable` share
     * one element — resolve correctly.
     * ================================================================== */
    /** The Chat entry that owns dsh's native collapse timing. */
    function chatForm(ctx) {
      try {
        return ctx.configForms.get("ui-chat");
      } catch (error) {
        return null;
      }
    }

    function readCollapseTiming(ctx) {
      const form = chatForm(ctx);
      const snapshot = form === null ? null : form.getSnapshot();
      if (snapshot !== null && snapshot.status === "ready" && snapshot.value && typeof snapshot.value.collapseTiming === "string") {
        return snapshot.value.collapseTiming;
      }
      return null;
    }

    async function writeCollapseTiming(ctx, value) {
      const form = chatForm(ctx);
      if (form === null || typeof form.mutate !== "function") return false;
      try {
        const accepted = await form.mutate([{ op: "set", path: ["collapseTiming"], value }]);
        return accepted !== false;
      } catch (error) {
        return false;
      }
    }
    // dsh 0.2 does NOT use the 0.1.5 markup. There, every transcript row was
    // `[data-expandable][aria-expanded]`; here the chat groups its process rows
    // into one disclosure button marked `data-turn-process`, and only the bash
    // toolview still marks itself expandable (with `data-variant="bash"`, not
    // `data-sample="bash"`). Matching the old selectors found nothing at all,
    // which is why Verbose appeared to do nothing here.
    const ROW = "[data-turn-process][aria-expanded], [data-process-activity][aria-expanded], [data-expandable][aria-expanded]";
    const THINK = '[data-variant="think"]';
    /** The nested group titles ("Ran commands", "Read files…"). */
    const GROUPS = "[data-process-activity]";
    const TERMINAL = '[data-variant="bash"], [data-sample="bash"]';

    /**
     * Which category a row belongs to: one of the `prefs` keys.
     *
     * Thinking is tested first so a tool row nested inside a reasoning block
     * counts as thinking — the enclosing kind is the one the user switched off.
     */
    function categoryOf(row) {
      if (row.closest(THINK) !== null) return "thinking";
      if (row.closest(TERMINAL) !== null) return "terminal";
      // The nested "Ran commands" rows are ChatGroupSeat titles; they carry
      // data-process-activity and are a level below the turn's own disclosure.
      if (row.matches(GROUPS) || row.closest(GROUPS) !== null) return "groups";
      return "tools";
    }

    /**
     * Viewport bands, asymmetric on purpose.
     *
     * A single "is it visible" test boomeranged: expanding a row pushes the next
     * one past the threshold, the pass then folds it, the layout snaps back, and
     * the row qualifies again. Two separate bands leave a dead zone in which the
     * engine does nothing at all, so a row must be clearly on screen before it
     * opens and clearly gone before it closes.
     */
    const OPEN_EDGE = 120;
    const CLOSE_EDGE = 260;

    /** Clearly enough on screen to be worth opening. */
    function shouldOpen(row) {
      const rect = row.getBoundingClientRect();
      if (rect.height === 0) return false;
      const viewport = window.innerHeight;
      return rect.top < viewport - OPEN_EDGE && rect.bottom > OPEN_EDGE;
    }

    /** Clearly far enough away that folding it cannot move what the reader sees. */
    function shouldClose(row) {
      const rect = row.getBoundingClientRect();
      const viewport = window.innerHeight;
      return rect.bottom < -CLOSE_EDGE || rect.top > viewport + CLOSE_EDGE;
    }

    /**
     * The element that actually scrolls a row.
     *
     * The chat scrolls inside its own container, not the window, and that
     * container is the only place a scrollTop correction has any effect.
     */
    function scrollParentOf(node) {
      let element = node.parentElement;
      while (element !== null && element !== document.body) {
        const style = window.getComputedStyle(element);
        if (/(auto|scroll)/.test(style.overflowY) && element.scrollHeight > element.clientHeight) return element;
        element = element.parentElement;
      }
      return document.scrollingElement ?? document.documentElement;
    }

    /**
     * Run programmatic clicks without letting them take the keyboard.
     *
     * dsh's own disclosure rows call `event.currentTarget.focus()` inside their
     * click handler, so a synthetic click parks focus on that row. The next
     * Enter then re-toggles the row instead of sending the message — and the
     * focus call scrolls the transcript to wherever that row lives, which is
     * how pressing Enter appeared to jump to an older section.
     *
     * Restoring focus with `preventScroll` is the actual fix; the blink of a
     * focus ring is not worth trading for a stolen Enter key.
     */
    /**
     * Click a disclosure row without letting it take focus.
     *
     * dsh's rows call `event.currentTarget.focus()` inside their handler. Focus
     * moves the scrollport to the focused element, so during a live generation
     * — where every arriving tool call triggers a pass — clicking a row above
     * the reader yanked the transcript up to it. Restoring focus afterwards is
     * too late: the scroll already happened. Shadowing `focus` on that one
     * element for the duration of the click removes the cause.
     */
    function clickQuietly(row) {
      const original = row.focus;
      let shadowed = false;
      try {
        row.focus = () => {};
        shadowed = true;
      } catch (error) {
        /* a frozen element cannot be shadowed; the restore below still helps */
      }
      try {
        row.click();
      } finally {
        if (shadowed) {
          try {
            row.focus = original;
          } catch (error) {
            /* the instance keeps the no-op; it unmounts with the row */
          }
        }
      }
    }
    function clickingWithoutFocus(work) {
      const previous = document.activeElement;
      work();
      const current = document.activeElement;
      if (current === previous) return;
      if (previous !== null && previous !== undefined && previous.isConnected !== false && typeof previous.focus === "function") {
        try {
          previous.focus({ preventScroll: true });
          return;
        } catch (error) {
          /* fall through to blurring the row */
        }
      }
      if (current !== null && current !== undefined && current !== document.body && typeof current.blur === "function") {
        try {
          current.blur();
        } catch (error) {
          /* nothing else to restore */
        }
      }
    }

    const engine = {
      observer: null,
      timer: null,
      active: false,
      /** Last scroll/input time: folding waits for the reader to settle. */
      lastInputAt: 0,
      /** Clicks we caused must not schedule another decision immediately. */
      suppressUntil: 0,
      prefs: DEFAULT_PREFS,

      /** Click every row of an enabled category currently at `expanded`. */
      toggleMatching(expanded, prefs) {
        const active = prefs ?? this.prefs;
        if (!CATEGORIES.some((category) => active[category.key] === true)) return;
        const wanted = expanded ? "true" : "false";
        clickingWithoutFocus(() => {
          for (const row of document.querySelectorAll(ROW)) {
            // Re-read rather than trust the query: a click earlier in this pass
            // may already have flipped this row through a shared parent.
            if (row.getAttribute("aria-expanded") !== wanted) continue;
            if (active[categoryOf(row)] !== true) continue;
            try {
              clickQuietly(row);
            } catch (error) {
              /* a row mid-unmount is not an error worth surfacing */
            }
          }
        });
      },

      expand() {
        this.toggleMatching(false);
      },

      /**
       * Move each row to the state its band asks for, and never in between.
       *
       * Three rules keep this from oscillating:
       *  - the two bands (OPEN_EDGE / CLOSE_EDGE) leave a dead zone, so the
       *    layout shift an expansion causes cannot immediately disqualify it;
       *  - folding waits until the reader has stopped, so nothing collapses out
       *    from under a scroll in progress;
       *  - a pass that clicked anything raises `suppressUntil`, so the DOM
       *    changes it just caused cannot schedule another decision — that was
       *    the actual boomerang.
       */
      syncViewport(prefs) {
        const active = prefs ?? this.prefs;
        if (!CATEGORIES.some((category) => active[category.key] === true)) return;
        const settled = Date.now() - (this.lastInputAt ?? 0) > 600;

        // Remember what the reader is looking at BEFORE touching the DOM.
        //
        // Opening a row above the reading position grows the content above the
        // scrollport, so the browser keeps scrollTop and everything visibly
        // jumps. Measuring the anchor row and correcting scrollTop by the same
        // delta is what makes scrolling back into a chat feel like scrolling
        // rather than like the page stuttering.
        const anchor = this.findAnchor();

        let clicked = 0;
        clickingWithoutFocus(() => {
          for (const row of document.querySelectorAll(ROW)) {
            if (active[categoryOf(row)] !== true) continue;
            const expanded = row.getAttribute("aria-expanded") === "true";
            const wanted = expanded ? (settled && shouldClose(row) ? false : undefined) : shouldOpen(row) ? true : undefined;
            if (wanted === undefined) continue;
            try {
              clickQuietly(row);
              this.flash(row);
              clicked += 1;
            } catch (error) {
              /* a row mid-unmount is not an error worth surfacing */
            }
          }
        });
        if (clicked === 0) return;

        if (anchor !== null) {
          const delta = anchor.row.getBoundingClientRect().top - anchor.top;
          if (Math.abs(delta) > 0.5) anchor.scroller.scrollTop += delta;
        }

        this.suppressUntil = Date.now() + 320;
        // Re-check once the layout has settled. This is the pass that decides
        // whether the new geometry is stable; with the dead zone it normally
        // finds nothing to do and stops there.
        this.schedule();
      },

      /**
       * The row anchoring the reading position: the first one whose top is in
       * the upper half of the viewport, with the element that scrolls it.
       */
      findAnchor() {
        const middle = window.innerHeight * 0.5;
        for (const row of document.querySelectorAll(ROW)) {
          const rect = row.getBoundingClientRect();
          if (rect.height === 0 || rect.top < 0 || rect.top > middle) continue;
          return { row, top: rect.top, scroller: scrollParentOf(row) };
        }
        return null;
      },

      /** Soften a fold/open by fading the row it happens to, briefly. */
      flash(row) {
        if (typeof row.animate !== "function") return;
        try {
          row.animate(
            [{ opacity: 0.55, transform: "translateY(-1px)" }, { opacity: 1, transform: "translateY(0)" }],
            { duration: 170, easing: "cubic-bezier(.2,.7,.3,1)" }
          );
        } catch (error) {
          /* Web Animations unavailable — the change still happened */
        }
      },

      /**
       * Close what Verbose opened. Run only on the way back to Normal, never
       * continuously: Verbose owns "everything open", so returning to Normal
       * has to undo it or the switch is one-way.
       */
      collapse(prefs) {
        this.toggleMatching(true, prefs);
      },

      /** Coalesce the mutation storm a streaming answer produces. */
      schedule() {
        if (this.timer !== null) return;
        // After our own clicks, wait longer: the mutations we just caused have
        // to finish laying out before a new decision means anything.
        const delay = Date.now() < (this.suppressUntil ?? 0) ? 220 : 120;
        this.timer = window.setTimeout(() => {
          this.timer = null;
          if (!this.active) return;
          this.pass();
        }, delay);
      },

      /** One full pass in whichever scope the preferences ask for. */
      pass() {
        if (this.prefs.visibleOnly === true) this.syncViewport();
        else this.expand();
      },

      start() {
        if (this.active) {
          // Already on: a category change just needs another pass.
          this.pass();
          return;
        }
        this.active = true;
        document.body.classList.add("dshvm-verbose");
        // First pass on the next frame, not in the commit that switched chats:
        // dsh restores the scroll position of the opened session during that
        // commit, and expanding rows before it lands would measure a viewport
        // that is about to move (the stutter on switching back to a chat).
        const first = () => this.pass();
        if (typeof requestAnimationFrame === "function") requestAnimationFrame(first);
        else first();
        this.observer = new MutationObserver(() => this.schedule());
        this.observer.observe(document.body, { childList: true, subtree: true });
        // Scroll events do not bubble, but they do capture: listening on the
        // document in the capture phase catches the chat's inner scroller and
        // every other container without knowing which one moves.
        this.onScroll = () => {
          this.lastInputAt = Date.now();
          this.schedule();
        };
        document.addEventListener("scroll", this.onScroll, true);
      },

      stop() {
        if (!this.active) return;
        this.active = false;
        document.body.classList.remove("dshvm-verbose");
        if (this.onScroll !== undefined) {
          document.removeEventListener("scroll", this.onScroll, true);
          this.onScroll = undefined;
        }
        if (this.observer !== null) {
          this.observer.disconnect();
          this.observer = null;
        }
        if (this.timer !== null) {
          window.clearTimeout(this.timer);
          this.timer = null;
        }
      },

      sync(on, prefs) {
        if (prefs !== undefined) this.prefs = prefs;
        if (on) {
          this.start();
          return;
        }
        // Tear the observer down BEFORE collapsing, or its own mutations
        // reschedule an expand pass and the two fight each other.
        const wasActive = this.active;
        this.stop();
        if (wasActive) this.collapse();
      },
    };

    /* ================================================================== *
     * Session log download
     *
     * Delegated to the shipped exporter's own controller, which it publishes as
     * a browser service:
     *
     *   ctx.provide("sessionLogDownload", controller)   // dsh-session-log-export
     *   controller.download(sessionId)                  // what its button called
     *
     * So this menu item now runs exactly the code the old button ran — the HEAD
     * preflight, the save, the progress/success/error dialog, and the
     * de-duplication of concurrent gestures for one session. Replacing the
     * button was always the intent; re-implementing its behaviour was not.
     *
     * The direct-endpoint fallback stays for a composition where the exporter
     * is absent (this plugin does not `inject` it, so that it can still mount
     * and show the Transcript view even then). `hostBase` mirrors the
     * exporter's own null-origin handling — `location.origin` is the string
     * "null" under some carriers, and `new URL(path, "null")` throws.
     * ================================================================== */
    function hostBase() {
      const origin = globalThis.location && globalThis.location.origin;
      return origin !== undefined && origin !== null && origin !== "null" ? origin : "http://dsh.internal";
    }

    async function downloadDirect(sessionId) {
      const url = new URL("/api/session.export", hostBase());
      url.searchParams.set("sessionId", String(sessionId));
      url.searchParams.set("includeDescendants", "true");

      // HEAD first, as the built-in does: on failure the body is an error page,
      // and saving that as a .zip is worse than reporting the failure.
      const response = await fetch(url.toString(), { method: "HEAD" });
      if (!response.ok) throw new Error("Export failed: HTTP " + response.status);

      const anchor = document.createElement("a");
      anchor.href = url.toString();
      anchor.download = "dsh-session-" + String(sessionId).replace(/[^A-Za-z0-9_-]/g, "_") + ".zip";
      anchor.rel = "noopener";
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
    }

    async function downloadSessionLog(ctx, sessionId) {
      if (sessionId === undefined || sessionId === null || String(sessionId) === "") {
        throw new Error("No open session to export.");
      }
      let controller;
      try {
        controller = ctx.get("sessionLogDownload");
      } catch (err) {
        controller = undefined;
      }
      if (controller !== undefined && typeof controller.download === "function") {
        await controller.download(sessionId);
        return;
      }
      await downloadDirect(sessionId);
    }

    /* ================================================================== *
     * Icons
     * ================================================================== */
    const svg = (children, size) =>
      h(
        "svg",
        {
          width: size ?? 15,
          height: size ?? 15,
          viewBox: "0 0 24 24",
          fill: "none",
          stroke: "currentColor",
          strokeWidth: 1.8,
          strokeLinecap: "round",
          strokeLinejoin: "round",
          "aria-hidden": "true",
        },
        ...children,
      );

    // Dots spaced 6/12/18 rather than 5/12/19: the wider spread read as a
    // taller control than the panel toggles beside it.
    const IconDots = () =>
      h(
        "svg",
        { width: 14, height: 14, viewBox: "0 0 24 24", fill: "currentColor", "aria-hidden": "true" },
        h("circle", { cx: 12, cy: 6, r: 1.7 }),
        h("circle", { cx: 12, cy: 12, r: 1.7 }),
        h("circle", { cx: 12, cy: 18, r: 1.7 }),
      );

    const IconDownload = () =>
      svg([
        h("path", { key: "a", d: "M12 3v12" }),
        h("path", { key: "b", d: "M7 12l5 5 5-5" }),
        h("path", { key: "c", d: "M4 21h16" }),
      ]);

    const IconEye = () =>
      svg([
        h("path", { key: "a", d: "M2 12s3.6-6 10-6 10 6 10 6-3.6 6-10 6-10-6-10-6z" }),
        h("circle", { key: "b", cx: 12, cy: 12, r: 2.6 }),
      ]);

    // A gauge: this is about how full the context is, not about preferences.
    const IconGauge = () =>
      svg([
        h("path", { d: "M12 21a9 9 0 1 1 9-9" }),
        h("path", { d: "M12 12l5-3" }),
        h("circle", { cx: 12, cy: 12, r: 1.4, fill: "currentColor", stroke: "none" }),
      ]);

    const IconGear = () =>
      svg([
        h("circle", { key: "a", cx: 12, cy: 12, r: 3.2 }),
        h("path", { key: "b", d: "M12 2.6v2.2M12 19.2v2.2M4.4 12H2.2M21.8 12h-2.2M6.6 6.6L5 5M19 19l-1.6-1.6M17.4 6.6L19 5M5 19l1.6-1.6" }),
      ]);

    const IconCaret = () => svg([h("path", { key: "a", d: "M9 6l6 6-6 6" })], 14);
    const IconCheck = () => svg([h("path", { key: "a", d: "M4 12.5l5 5 11-11" })], 14);

    /* ================================================================== *
     * Settings popup
     * ================================================================== */
    const CATEGORIES = [
      { key: "thinking", name: "Thinking", desc: "Expand the model's reasoning blocks." },
      { key: "tools", name: "Tool calls", desc: "Expand tool calls and their results." },
      { key: "terminal", name: "Terminal output", desc: "Expand shell samples and unclamp their output height." },
      {
        key: "groups",
        name: "Step groups",
        desc: "Expand the collapsed \"Ran commands\" rows inside a turn, one level below the turn itself.",
      },
    ];

    /** Settings → the one dialog: what Verbose expands, then what the footer shows. */
    function VerboseSettings(props) {
      const prefs = props.prefs;

      React.useEffect(() => {
        function onKey(event) {
          if (event.key === "Escape") props.onClose();
        }
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
      }, [props]);

      function switchRow(item, on, toggle) {
        return h(
          "div",
          { className: "dshvm-row", key: item.key },
          h(
            "span",
            { className: "dshvm-rtext" },
            h("span", { className: "dshvm-rname" }, item.name),
            h("span", { className: "dshvm-rdesc" }, item.desc),
          ),
          h(
            "button",
            {
              type: "button",
              role: "switch",
              "aria-checked": on,
              "aria-label": (on ? "Disable " : "Enable ") + item.name,
              className: "dshvm-switch" + (on ? " dshvm-switchOn" : ""),
              onClick: () => toggle(item.key, !on),
            },
            h("span", { className: "dshvm-knob" + (on ? " dshvm-knobOn" : "") }),
          ),
        );
      }

      return h(
        "div",
        {
          className: "dshvm-modal",
          role: "presentation",
          onClick: (event) => {
            if (event.target === event.currentTarget) props.onClose();
          },
        },
        h(
          "div",
          { className: "dshvm-dialog", role: "dialog", "aria-modal": "true", "aria-label": "Verbose settings" },
          h("p", { className: "dshvm-dtitle" }, "Verbose settings"),
          h(
            "p",
            { className: "dshvm-dhint" },
            "What Verbose expands. This applies to every chat you switch to Verbose — it defines the mode, while Normal/Verbose itself stays per chat.",
          ),
          CATEGORIES.map((category) => switchRow(category, prefs[category.key] !== false, props.onToggle)),
          h("p", { className: "dshvm-group" }, "Expansion"),
          switchRow(
            {
              key: "visibleOnly",
              name: "Only what is on screen",
              desc: "Open the step rows you can see; rows you scroll away from close again, so the transcript never becomes a wall of open steps.",
            },
            prefs.visibleOnly === true,
            props.onToggleExtra,
          ),
          h("p", { className: "dshvm-group" }, "Turn footer"),
          h(
            "p",
            { className: "dshvm-dhint" },
            "Shown under every turn in both modes. Measured from the turn itself; a field that is not present is omitted.",
          ),
          EXTRAS.map((extra) => switchRow(extra, prefs[extra.key] === true, props.onToggleExtra)),
          h("p", { className: "dshvm-group" }, "After a turn"),
          h(
            "p",
            { className: "dshvm-dhint" },
            "When a finished answer folds away. The first two write dsh's own collapse timing; keeping a chat expanded is that chat's Verbose switch.",
          ),
          h(
            "div",
            { className: "dshvm-seg", role: "group", "aria-label": "After a turn" },
            FOLD_OPTIONS.map((option) =>
              h(
                "button",
                {
                  type: "button",
                  key: option.id,
                  "data-on": prefs.foldAfter === option.id ? "true" : undefined,
                  "aria-pressed": prefs.foldAfter === option.id ? "true" : "false",
                  onClick: () => props.onFold(option.id),
                },
                option.label,
              ),
            ),
          ),          h(
            "div",
            { className: "dshvm-foot" },
            h("button", { type: "button", className: "dshvm-done", onClick: props.onClose }, "Done"),
          ),
        ),
      );
    }

    /**
     * Compact settings for ONE chat.
     *
     * The meter and the slider are both expressed against the USABLE BUDGET —
     * the context window minus the tokens reserved for the reply — not the raw
     * window. That distinction is the whole reason this panel exists: a chat can
     * sit at "70% of the window" while every further request is already too
     * large to satisfy, because the reply no longer fits beside the prompt.
     */
    function CompactSettings(props) {
      const ctx = props.menuCtx;
      const sessionId = props.sessionId;
      const stateHook = React.useState(null);
      const state = stateHook[0];
      const setState = stateHook[1];
      const errHook = React.useState("");
      const err = errHook[0];
      const setErr = errHook[1];
      // Held locally while dragging so the slider tracks the pointer instead of
      // waiting for a round trip on every pixel.
      const draftHook = React.useState(null);
      const draft = draftHook[0];
      const setDraft = draftHook[1];
      const offloadDraftHook = React.useState(null);
      const offloadDraft = offloadDraftHook[0];
      const setOffloadDraft = offloadDraftHook[1];
      const expandedHook = React.useState({});
      const expanded = expandedHook[0];
      const setExpanded = expandedHook[1];
      const routesHook = React.useState([]);
      const routes = routesHook[0];
      const setRoutes = routesHook[1];
      // Outcome text from the last "Compact now" press, shown on the button.
      const compactMsgHook = React.useState(null);
      const compactMsg = compactMsgHook[0];
      const setCompactMsg = compactMsgHook[1];

      React.useEffect(() => {
        function onKey(event) {
          if (event.key === "Escape") props.onClose();
        }
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
      }, [props]);

      const load = React.useCallback(() => {
        const remote = governorRemote(ctx);
        if (remote === undefined || typeof remote.status !== "function") {
          setErr("context-governor is not mounted.");
          return;
        }
        Promise.resolve(remote.status(sessionId))
          .then(unwrap)
          .then((value) => {
            setState(value || {});
            setErr("");
          })
          .catch((error) => setErr(error && error.message ? error.message : String(error)));
      }, [ctx, sessionId]);

      React.useEffect(load, [load]);

      // The route catalog is asked for once per open. It is a host-side walk of
      // every provider's model list, so it is not something to poll.
      React.useEffect(() => {
        const remote = governorRemote(ctx);
        if (remote === undefined || typeof remote.listRoutes !== "function") return;
        let live = true;
        Promise.resolve(remote.listRoutes())
          .then(unwrap)
          .then((value) => {
            if (live && value && Array.isArray(value.routes)) setRoutes(value.routes);
          })
          .catch(() => {});
        return () => {
          live = false;
        };
      }, [ctx]);

      function commitDefaults(patch) {
        const remote = governorRemote(ctx);
        if (remote === undefined || typeof remote.setDefaults !== "function") return;
        Promise.resolve(remote.setDefaults(patch))
          .then(unwrap)
          .then(load)
          .catch((error) => setErr(error && error.message ? error.message : String(error)));
      }

      /**
       * Compact this chat now, with the host's own compactor.
       *
       * The host answers whether it RAN or only armed (a chat with no live
       * agent cannot compact until its next message), and what it did — so the
       * button reports the real outcome instead of a fixed "done". A press that
       * finds nothing to compact says so; claiming success there would read as
       * a button that silently does nothing.
       */
      function compactNow() {
        const remote = governorRemote(ctx);
        if (remote === undefined || typeof remote.compactNow !== "function") {
          setErr("context-governor is not mounted.");
          return;
        }
        setCompactMsg("Compacting…");
        Promise.resolve(remote.compactNow(sessionId))
          .then(unwrap)
          .then((result) => {
            setErr(null);
            setCompactMsg((result && result.message) || "Done.");
            load();
          })
          .catch((error) => {
            setCompactMsg(null);
            setErr(error && error.message ? error.message : String(error));
          });
      }

      function commit(patch) {
        const remote = governorRemote(ctx);
        if (remote === undefined || typeof remote.setSettings !== "function") return;
        Promise.resolve(remote.setSettings(sessionId, patch))
          .then(unwrap)
          .then(() => {
            setDraft(null);
            setOffloadDraft(null);
            load();
          })
          .catch((error) => setErr(error && error.message ? error.message : String(error)));
      }

      const settings = (state && state.settings) || {};
      const defaults = (state && state.defaults) || {};
      const usable = state && typeof state.usable === "number" ? state.usable : undefined;
      const used = state && typeof state.used === "number" ? state.used : undefined;
      const breakdown = (state && state.breakdown) || undefined;
      const enabled = settings.enabled !== false;
      const effectivePct =
        draft !== null
          ? draft
          : typeof settings.nudgePct === "number"
            ? settings.nudgePct
            : typeof defaults.nudgePct === "number"
              ? defaults.nudgePct
              : 0.7;
      const emergencyPct = typeof defaults.emergencyPct === "number" ? defaults.emergencyPct : 0.85;
      const custom = typeof settings.nudgePct === "number";
      const ratio = usable !== undefined && used !== undefined && usable > 0 ? used / usable : undefined;
      const pctUsed = ratio === undefined ? undefined : Math.round(ratio * 100);
      const level = levelOf(ratio, effectivePct);
      const remaining = usable !== undefined && used !== undefined ? Math.max(0, usable - used) : undefined;
      const inventory = (state && state.inventory) || { groups: [], tokens: 0, count: 0 };
      const offloadOn = state ? state.offload === true : false;
      const offloadPct =
        offloadDraft !== null
          ? offloadDraft
          : state && typeof state.offloadThresholdPct === "number"
            ? state.offloadThresholdPct
            : 0.85;
      const routeValue = state && state.route ? state.route.provider + "|" + state.route.model : "";
      // A chosen local model that the picker did not mark resident. Only ever
      // true once the catalog has loaded, so it cannot flash a false warning.
      const routeIsCold = (() => {
        if (!state || !state.route || routes.length === 0) return false;
        const group = routes.find((entry) => entry.provider === state.route.provider);
        if (group === undefined) return false;
        const anyLoaded = group.models.some((model) => model.loaded === true);
        if (!anyLoaded) return false;
        const chosen = group.models.find((model) => model.id === state.route.model);
        return chosen !== undefined && chosen.loaded !== true;
      })();
      const windowPct =
        typeof state?.contextWindow === "number" && state.contextWindow > 0 && used !== undefined
          ? Math.round((used / state.contextWindow) * 100)
          : undefined;

      const parts = breakdown
        ? [
            { key: "system", name: "System prompt", tokens: breakdown.systemTokens, color: "var(--dsw-cg-system)" },
            { key: "tools", name: "Tools", tokens: breakdown.toolsTokens, color: "var(--dsw-cg-tools)" },
            { key: "messages", name: "Messages", tokens: breakdown.messageTokens, color: "var(--dsw-cg-messages)" },
          ].filter((part) => typeof part.tokens === "number" && part.tokens > 0)
        : [];
      const partsTotal = parts.reduce((sum, part) => sum + part.tokens, 0);
      const overallPct = ratio === undefined ? 0 : Math.max(0, Math.min(100, ratio * 100));

      /**
       * Share of the bar for one part.
       *
       * The parts give PROPORTION only; the provider-reported total gives
       * magnitude. They are different measurements and do not reconcile: the
       * breakdown is a running heuristic estimate (4 chars per token) while the
       * total comes from the provider's own tokenizer, so on this machine the
       * three parts sum to ~92K while the real occupancy is 46K.
       *
       * Drawing each part as `tokens / budget` — which is what this did — makes
       * Messages alone 118% of the budget and floods the bar. Scaling the parts
       * into the real percentage is what the composer's own meter does, so this
       * now agrees with it by construction.
       */
      function segShare(tokens) {
        if (partsTotal <= 0 || typeof tokens !== "number") return 0;
        return (overallPct * tokens) / partsTotal;
      }

      return h(
        "div",
        {
          className: "dshvm-modal",
          role: "presentation",
          onClick: (event) => {
            if (event.target === event.currentTarget) props.onClose();
          },
        },
        h(
          "div",
          { className: "dshvm-dialog", role: "dialog", "aria-modal": "true", "aria-label": "Compact settings" },
          h("p", { className: "dshvm-dtitle" }, "Context"),
          h(
            "p",
            { className: "dshvm-dhint" },
            "How full this chat is, and when it gets compacted. At the threshold below, the turn pauses, the built-in compactor runs — the same one /compact uses — and the turn continues.",
          ),

          h(
            "div",
            { className: "dshvm-dbody" },
            state === null
            ? h("p", { className: "dshvm-dhint" }, err === "" ? "Reading the session budget…" : err)
            : h(
                React.Fragment,
                null,

                /* -- headline ------------------------------------------- */
                h(
                  "div",
                  { className: "dshvm-headline" },
                  h(
                    "span",
                    { className: "dshvm-big" },
                    pctUsed === undefined ? "—" : pctUsed + "%",
                    h("span", { className: "dshvm-sub" }, " of usable budget"),
                  ),
                  h("span", { className: "dshvm-sub" }, compact(used) + " / " + compact(usable)),
                ),
                // The composer's meter divides by the WINDOW, this panel divides
                // by the usable budget, and the two readings therefore differ for
                // the same session. Showing both makes that a stated difference
                // in denominator rather than an apparent contradiction.
                windowPct === undefined
                  ? null
                  : h(
                      "p",
                      { className: "dshvm-sub", style: { margin: "2px 0 0" } },
                      "same as " + windowPct + "% of the " + compact(state.contextWindow) + " window",
                    ),

                /* -- segmented meter with threshold ticks ---------------- */
                h(
                  "div",
                  { className: "dshvm-meter" },
                  parts.length > 0
                    ? parts.map((part) =>
                        h("div", {
                          key: part.key,
                          className: "dshvm-seg",
                          "data-part": part.key,
                          style: { width: segShare(part.tokens) + "%" },
                          title: part.name + ": " + commas(part.tokens),
                        }),
                      )
                    : h("div", {
                        className: "dshvm-seg",
                        "data-part": "used",
                        style: { width: overallPct + "%" },
                      }),
                  h("span", {
                    className: "dshvm-tick",
                    "data-kind": "nudge",
                    style: { left: Math.min(99.5, effectivePct * 100) + "%" },
                    title: "Compact at " + Math.round(effectivePct * 100) + "%",
                  }),
                  h("span", {
                    className: "dshvm-tick",
                    "data-kind": "emergency",
                    style: { left: Math.min(99.5, emergencyPct * 100) + "%" },
                    title: "Emergency compaction at " + Math.round(emergencyPct * 100) + "%",
                  }),
                ),

                /* -- legend --------------------------------------------- */
                parts.length > 0
                  ? h(
                      "div",
                      { className: "dshvm-legend" },
                      parts.map((part) =>
                        h(
                          "span",
                          { className: "dshvm-lg", key: part.key },
                          h("span", { className: "dshvm-sw", style: { background: part.color } }),
                          part.name,
                          h(
                            "span",
                            { className: "dshvm-lgval" },
                            compact(part.tokens) + "  " + Math.round(segShare(part.tokens)) + "%",
                          ),
                        ),
                      ),
                      remaining === undefined
                        ? null
                        : h(
                            "span",
                            { className: "dshvm-lg" },
                            h("span", { className: "dshvm-sw", style: { background: "var(--dsw-alias-bg-module-platform)" } }),
                            "Free",
                            h("span", { className: "dshvm-lgval" }, compact(remaining)),
                          ),
                    )
                  : null,

                /* -- the numbers ---------------------------------------- */
                h(
                  "div",
                  { className: "dshvm-facts" },
                  h("span", { className: "dshvm-fkey" }, "Model"),
                  h("span", { className: "dshvm-fval" }, state.model || "—"),
                  h("span", { className: "dshvm-fkey" }, "Context window"),
                  h(
                    "span",
                    { className: "dshvm-fval" },
                    commas(state.contextWindow),
                    state.source === "observed"
                      ? h("span", { className: "dshvm-badge" }, " in force")
                      : state.source === "auto"
                        ? h("span", { className: "dshvm-badge" }, " configured")
                        : null,
                  ),
                  h("span", { className: "dshvm-fkey" }, "Reply reserve"),
                  h("span", { className: "dshvm-fval" }, commas(state.reserve)),
                  h("span", { className: "dshvm-fkey" }, "Usable budget"),
                  h("span", { className: "dshvm-fval" }, commas(usable)),
                  h("span", { className: "dshvm-fkey" }, "Remaining"),
                  h(
                    "span",
                    { className: "dshvm-fval" },
                    commas(remaining),
                    level === "none"
                      ? null
                      : h("span", { className: "dshvm-badge", "data-level": level }, level === "over" ? " over budget" : level === "tight" ? " past the line" : " healthy"),
                  ),
                ),

                state.at === undefined
                  ? h(
                      "p",
                      { className: "dshvm-dhint" },
                      "No reading yet — the meter fills in after this chat's next message.",
                    )
                  : null,

                /* -- what the tools cost, itemised ---------------------- */
                inventory.groups.length === 0
                  ? null
                  : h(
                      "div",
                      { className: "dshvm-tree" },
                      inventory.groups.map((group) => {
                        const isOpen = expanded[group.key] === true;
                        return h(
                          React.Fragment,
                          { key: group.key },
                          h(
                            "button",
                            {
                              type: "button",
                              className: "dshvm-trow",
                              "data-clickable": "true",
                              "aria-expanded": isOpen,
                              onClick: () =>
                                setExpanded(Object.assign({}, expanded, { [group.key]: !isOpen })),
                            },
                            h("span", { className: "dshvm-tchev", "data-open": String(isOpen) }, h(IconChevronRight)),
                            h("span", { className: "dshvm-tname" }, group.name),
                            h("span", { className: "dshvm-tcount" }, String(group.items.length)),
                            h("span", { className: "dshvm-tnum" }, compact(group.tokens)),
                            h(
                              "span",
                              { className: "dshvm-tpct" },
                              inventory.tokens > 0
                                ? Math.round((group.tokens / inventory.tokens) * 100) + "%"
                                : "—",
                            ),
                          ),
                          isOpen
                            ? h(
                                "div",
                                { className: "dshvm-titems" },
                                group.items.map((item) =>
                                  h(
                                    "div",
                                    { className: "dshvm-trow dshvm-titem", key: item.name, title: item.name },
                                    h("span", { className: "dshvm-tname" }, item.label),
                                    h("span", { className: "dshvm-tnum" }, commas(item.tokens)),
                                    h("span", { className: "dshvm-tpct" }),
                                  ),
                                ),
                              )
                            : null,
                        );
                      }),
                    ),

                /* -- the control ---------------------------------------- */
                h(
                  "div",
                  { className: "dshvm-sliderRow" },
                  h(
                    "span",
                    { className: "dshvm-rtext" },
                    h("span", { className: "dshvm-rname" }, "Compact at"),
                    h(
                      "span",
                      { className: "dshvm-rdesc" },
                      usable === undefined
                        ? "share of the usable budget"
                        : commas(Math.floor(usable * effectivePct)) + " tokens of " + commas(usable),
                    ),
                  ),
                  h("span", { className: "dshvm-sliderVal" }, Math.round(effectivePct * 100) + "%"),
                ),
                h("input", {
                  type: "range",
                  className: "dshvm-slider",
                  min: 5,
                  max: 95,
                  step: 5,
                  value: Math.round(effectivePct * 100),
                  disabled: !enabled,
                  "aria-label": "Compaction threshold, percent of usable budget",
                  onChange: (event) => setDraft(Number(event.target.value) / 100),
                  // Commit on release, not on every drag frame: each commit is a
                  // remote round trip and a settings-file write.
                  onMouseUp: (event) => commit({ nudgePct: Number(event.target.value) / 100 }),
                  onTouchEnd: (event) => commit({ nudgePct: Number(event.target.value) / 100 }),
                  onKeyUp: (event) => commit({ nudgePct: Number(event.target.value) / 100 }),
                }),
                h(
                  "div",
                  { className: "dshvm-row" },
                  h(
                    "span",
                    { className: "dshvm-rtext" },
                    h("span", { className: "dshvm-rname" }, "Auto-compact this chat"),
                    h(
                      "span",
                      { className: "dshvm-rdesc" },
                      custom
                        ? "Using this chat's own threshold."
                        : "Using the default (" +
                          Math.round((defaults.nudgePct ?? 0.7) * 100) +
                          "%) for every chat.",
                    ),
                  ),
                  h(
                    "button",
                    {
                      type: "button",
                      role: "switch",
                      "aria-checked": enabled,
                      "aria-label": enabled ? "Disable auto-compaction for this chat" : "Enable auto-compaction for this chat",
                      className: "dshvm-switch" + (enabled ? " dshvm-switchOn" : ""),
                      onClick: () => commit({ enabled: !enabled }),
                    },
                    h("span", { className: "dshvm-knob" + (enabled ? " dshvm-knobOn" : "") }),
                  ),
                ),
                /* -- compression route ---------------------------------- */
                h(
                  "div",
                  { className: "dshvm-row" },
                  h(
                    "span",
                    { className: "dshvm-rtext" },
                    h("span", { className: "dshvm-rname" }, "Compress on another model"),
                    h(
                      "span",
                      { className: "dshvm-rdesc" },
                      offloadOn
                        ? enabled
                          ? "A backstop that summarizes on another model instead, spending none of this chat's turn or context."
                          : "Another model compresses this chat, spending none of its turn or context."
                        : enabled
                          ? "Off — this chat compacts itself with the built-in compactor."
                          : "Off — and auto-compaction is off too, so nothing shrinks this chat until the host's own compaction line is reached.",
                    ),
                  ),
                  h(
                    "button",
                    {
                      type: "button",
                      role: "switch",
                      "aria-checked": offloadOn,
                      "aria-label": offloadOn ? "Disable offloaded compression" : "Enable offloaded compression",
                      className: "dshvm-switch" + (offloadOn ? " dshvm-switchOn" : ""),
                      onClick: () => commit({ offload: !offloadOn }),
                    },
                    h("span", { className: "dshvm-knob" + (offloadOn ? " dshvm-knobOn" : "") }),
                  ),
                ),
                offloadOn
                  ? h(
                      React.Fragment,
                      null,
                      h(
                        "div",
                        { className: "dshvm-sliderRow" },
                        h(
                          "span",
                          { className: "dshvm-rtext" },
                          h("span", { className: "dshvm-rname" }, "…once this chat passes"),
                          h(
                            "span",
                            { className: "dshvm-rdesc" },
                            // Order-aware: the slider can sit either side of the
                            // compaction line, and saying "after" while showing a
                            // smaller number was simply false.
                            usable === undefined
                              ? "share of the usable budget"
                              : !enabled
                                ? commas(Math.floor(usable * offloadPct)) +
                                  " tokens — auto-compaction is off for this chat, so this is the only compression it gets"
                                : offloadPct < effectivePct
                                  ? commas(Math.floor(usable * offloadPct)) +
                                    " tokens — before the compaction at " +
                                    commas(Math.floor(usable * effectivePct)) +
                                    ", so another model compresses first"
                                  : commas(Math.floor(usable * offloadPct)) +
                                    " tokens — after the compaction at " +
                                    commas(Math.floor(usable * effectivePct)) +
                                    ", before the built-in compaction",
                          ),
                        ),
                        h("span", { className: "dshvm-sliderVal" }, Math.round(offloadPct * 100) + "%"),
                      ),
                      h("input", {
                        type: "range",
                        className: "dshvm-slider",
                        min: 5,
                        max: 95,
                        step: 5,
                        value: Math.round(offloadPct * 100),
                        "aria-label": "Offloaded compression threshold, percent of usable budget",
                        onChange: (event) => setOffloadDraft(Number(event.target.value) / 100),
                        onMouseUp: (event) => commit({ offloadPct: Number(event.target.value) / 100 }),
                        onTouchEnd: (event) => commit({ offloadPct: Number(event.target.value) / 100 }),
                        onKeyUp: (event) => commit({ offloadPct: Number(event.target.value) / 100 }),
                      }),
                      h(
                        "select",
                        {
                          className: "dshvm-select",
                          "aria-label": "Model used for compression",
                          value: routeValue,
                          onChange: (event) => {
                            const picked = String(event.target.value);
                            if (picked === "") {
                              commit({ compressProvider: null, compressModel: null });
                              return;
                            }
                            const split = picked.indexOf("|");
                            commit({
                              compressProvider: picked.slice(0, split),
                              compressModel: picked.slice(split + 1),
                            });
                          },
                        },
                        h("option", { value: "" }, "This chat's own model"),
                        routes.map((group) =>
                          h(
                            "optgroup",
                            { key: group.provider, label: group.providerName },
                            group.models.map((model) =>
                              h(
                                "option",
                                { key: model.id, value: group.provider + "|" + model.id },
                                // A local model that is not resident has to be
                                // loaded before it can answer, and on one GPU
                                // that evicts whatever is serving the chat.
                                model.loaded === true ? model.name + "  ● loaded" : model.name,
                              ),
                            ),
                          ),
                        ),
                      ),
                      routeIsCold
                        ? h(
                            "p",
                            { className: "dshvm-err", style: { margin: "6px 0 0" } },
                            "That model is not loaded in LM Studio. Compressing with it makes the server load it first, which on one GPU can evict the model this chat is using. Prefer one marked loaded, or a cloud route.",
                          )
                        : null,
                      h(
                        "p",
                        { className: "dshvm-dhint", style: { margin: "6px 0 0" } },
                        state.route
                          ? state.route.origin === "session"
                            ? "This chat compresses on " + state.route.provider + "/" + state.route.model + "."
                            : "Inherited default: " + state.route.provider + "/" + state.route.model + "."
                          : "No route chosen, so compression runs on this chat's own model — which spends its context.",
                      ),
                    )
                  : null,

                /* -- compaction: which model, its reasoning, how it went --- */
                //
                // The governor points every compaction at the model this chat is
                // set to now — a pick in the chat bar counts straight away.
                h(
                  "div",
                  { className: "dshvm-sliderRow" },
                  h(
                    "span",
                    { className: "dshvm-rtext" },
                    h("span", { className: "dshvm-rname" }, "Compaction model"),
                    h(
                      "span",
                      { className: "dshvm-rdesc", "data-compact-model": "" },
                      state.compactModel
                        ? state.compactModel.provider + "/" + state.compactModel.model +
                            (state.compactModelFollowsChat === false
                              ? " — dsh's own choice may differ (following the chat is off)."
                              : state.compactModel.origin === "picked"
                                ? " — just picked in the chat bar; /compact uses it now."
                                : " — follows this chat's model; switch it in the chat bar.")
                        : "Follows this chat's model — shown once the chat has been opened this session.",
                    ),
                  ),
                ),

                //
                // dsh compacts on its own (compaction-basic); the governor only
                // picks the reasoning effort of that summary request and logs
                // every attempt. "Provider default" leaves the effort to the
                // provider's `reasoning` setting in cordis.patch.yml.
                h(
                  "div",
                  { className: "dshvm-sliderRow" },
                  h(
                    "span",
                    { className: "dshvm-rtext" },
                    h("span", { className: "dshvm-rname" }, "Compaction reasoning"),
                    h(
                      "span",
                      { className: "dshvm-rdesc" },
                      state.compactReasoning
                        ? state.compactReasoning.level === "chat"
                          ? "Same as the chat" +
                              (state.compactModel && state.compactModel.reasoningEffort ? " (" + state.compactModel.reasoningEffort + ")." : ".") +
                              (state.compactReasoning.origin === "session" ? "" : " Inherited default.")
                          : state.compactReasoning.origin === "session"
                            ? "This chat's summaries think at " + state.compactReasoning.level + "."
                            : "Inherited default: " + state.compactReasoning.level + "."
                        : "Provider default — how hard the model thinks while writing the compaction summary.",
                    ),
                  ),
                ),
                h(
                  "select",
                  {
                    className: "dshvm-select",
                    "aria-label": "Reasoning effort for compaction",
                    value: state.compactReasoning ? state.compactReasoning.level : "",
                    onChange: (event) => {
                      const picked = String(event.target.value);
                      commit({ compactReasoning: picked === "" ? null : picked });
                    },
                  },
                  h("option", { value: "" }, "Provider default"),
                  h("option", { value: "chat" }, "Same as chat"),
                  ["off", "low", "medium", "high", "xhigh"].map((level) =>
                    h("option", { key: level, value: level }, level === "xhigh" ? "XHigh" : level.charAt(0).toUpperCase() + level.slice(1)),
                  ),
                ),
                Array.isArray(state.compactions) && state.compactions.length > 0
                  ? h(
                      "div",
                      { className: "dshvm-compactLog", "data-compaction-log": "" },
                      h("span", { className: "dshvm-rname" }, "Recent compactions"),
                      state.compactions.map((entry, index) =>
                        h(
                          "div",
                          {
                            key: String(entry.at) + ":" + index,
                            className: "dshvm-compactEntry" + (entry.ok ? "" : " dshvm-compactFail"),
                            title: entry.ok ? undefined : "Full details: " + (state.compactionLogPath || "the compaction log"),
                          },
                          entry.text + (entry.manual ? " (/compact)" : ""),
                        ),
                      ),
                      state.compactions.some((entry) => !entry.ok)
                        ? h(
                            "p",
                            { className: "dshvm-dhint", style: { margin: "4px 0 0" } },
                            "Full details of each failure: " + (state.compactionLogPath || "the compaction log"),
                          )
                        : null,
                    )
                  : null,

                /* -- ask this chat to compress now ---------------------- */
                //
                // The thresholds above decide WHEN the governor asks on its
                // own. This asks immediately, ignoring every one of them —
                // useful before pasting something large, or when the automatic
                // line sits higher than you want just this once.
                h(
                  "div",
                  { className: "dshvm-actions" },
                  h(
                    "button",
                    {
                      type: "button",
                      className: "dshvm-reset",
                      title:
                        "Compact this chat now with the built-in compactor — the same one /compact uses — ignoring the threshold",
                      onClick: compactNow,
                    },
                    compactMsg || "Compact now",
                  ),
                ),

                /* -- make any of this the default ----------------------- */
                h(
                  "div",
                  { className: "dshvm-actions" },
                  h(
                    "button",
                    {
                      type: "button",
                      className: "dshvm-reset",
                      title: "Apply this chat's threshold, route, offload switch and compaction reasoning to every chat that has not set its own",
                      onClick: () =>
                        commitDefaults({
                          nudgePct: effectivePct,
                          offloadPct,
                          offload: offloadOn,
                          compressProvider: state.route ? state.route.provider : null,
                          compressModel: state.route ? state.route.model : null,
                          compactReasoning: state.compactReasoning ? state.compactReasoning.level : null,
                        }),
                    },
                    "Set as default for all chats",
                  ),
                  custom
                    ? h(
                        "button",
                        {
                          type: "button",
                          className: "dshvm-reset",
                          // null clears the override, so the chat follows the
                          // global default from then on rather than being pinned
                          // to whatever the default happened to be today.
                          onClick: () => commit({ nudgePct: null }),
                        },
                        "Use the default threshold",
                      )
                    : null,
                ),
                err === "" ? null : h("p", { className: "dshvm-err" }, err),
              ),
          ),

          h(
            "div",
            { className: "dshvm-dactions" },
            h("button", { type: "button", className: "dshvm-done", onClick: props.onClose }, "Done"),
          ),
        ),
      );
    }

    const inject = ["slots", "remote", "configForms"];

    /* ================================================================== *
     * Adding to the SHIPPED session menu instead of replacing it
     *
     * dsh-session-log-export renders that menu as one closed component (id
     * `session-log-download`) with no child slots, so a plugin cannot append a
     * row through the slot API. Registering under its id with a lower priority
     * *shadows* it — which is what an earlier version of this plugin did, and
     * the cost was the shipped "Feedback" item disappearing.
     *
     * So: leave the registration alone, let the shipped menu render untouched,
     * and append two rows to it when it opens. The rows wear a native row's
     * class, so hover/focus/typography come from dsh rather than a look-alike
     * stylesheet, and the guard only ever touches a menu whose own rows mention
     * session log or feedback.
     * ================================================================== */
    const MENU_ATTR = "data-dshvm-menu";
    const ROW_ATTR = "data-dshvm-row";

    /**
     * The open session, captured from the slot props of the dialog host.
     *
     * The host is registered in `conversation.session.header.utilities`, which
     * is session-scoped and hands every entry the open session id — the same
     * id the shipped button used. That is the only reason this plugin can stay
     * per-chat without reading a service.
     */
    let openSessionId;

    /** @param {Element} menu - candidate menu. @returns {string[]} its own row labels. */
    function menuLabels(menu) {
      return [...menu.querySelectorAll('[role="menuitem"]')].map((row) => (row.textContent ?? "").trim());
    }

    /** @param {Element} menu - a role=menu element. @returns {boolean} the shipped session menu. */
    function isSessionMenu(menu) {
      const labels = menuLabels(menu).join(" | ").toLowerCase();
      return labels.includes("session log") || labels.includes("feedback");
    }

    /** The check mark a native selected row would show. */
    function checkGlyph(on) {
      const span = document.createElement("span");
      span.className = "dshvm-check";
      span.textContent = on ? "✓" : "";
      return span;
    }

    /**
     * One appended row.
     *
     * @param {string} sampleClass - className of a shipped row.
     * @param {string} label - row text.
     * @param {() => void} onPick - what the row does.
     * @param {object} options - `chevron` adds the submenu caret, `checked` ticks it.
     */
    function menuRow(sampleClass, label, onPick, options = {}) {
      const row = document.createElement("button");
      row.type = "button";
      row.setAttribute("role", "menuitem");
      row.className = sampleClass;
      row.setAttribute(ROW_ATTR, options.id ?? label);
      row.dataset.dshvmRow = options.id ?? label;
      const text = document.createElement("span");
      text.textContent = label;
      row.append(text);
      if (options.chevron === true) {
        const caret = document.createElement("span");
        caret.className = "dshvm-caret";
        caret.textContent = "›";
        row.append(caret);
      }
      if (options.checked !== undefined) row.append(checkGlyph(options.checked));
      row.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
        onPick();
      });
      return row;
    }

    /** Close the menu the way a native selection does. */
    function closeMenu() {
      document.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true }));
      window.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
    }

    /** @returns {{mode: string, collapseTiming: string} & object} current preferences. */
    function prefsNow() {
      return readPrefs();
    }

    /** Set one preference and announce it, so every footer follows. */
    function setPref(patch) {
      const updated = { ...prefsNow(), ...patch };
      writeJson(PREFS_KEY, updated);
      return updated;
    }

    /** @param {string} sessionId - open chat. @param {boolean} on - Verbose or Normal. */
    function setChatVerbose(sessionId, on) {
      setVerbose(sessionId, on);
      engine.sync(on, prefsNow());
      try {
        window.dispatchEvent(new CustomEvent("dshvm:mode", { detail: { sessionId, verbose: on } }));
      } catch (error) {
        /* no CustomEvent in a test shim */
      }
    }

    /**
     * The Normal/Verbose submenu, positioned beside its row.
     *
     * @param {Element} row - the "Transcript view" row it belongs to.
     * @returns {Element} the submenu panel.
     */
    function submenuFor(row) {
      const panel = document.createElement("div");
      panel.className = "dshvm-sub";
      panel.setAttribute("role", "menu");

      const prefs = prefsNow();
      const verbose = isVerbose(openSessionId);
      for (const [label, on] of [["Normal", false], ["Verbose", true]]) {
        const item = document.createElement("button");
        item.type = "button";
        item.className = "dshvm-subItem";
        item.setAttribute("role", "menuitem");
        const text = document.createElement("span");
        text.textContent = label;
        item.append(text, checkGlyph(verbose === on));
        item.addEventListener("click", (event) => {
          event.preventDefault();
          event.stopPropagation();
          setChatVerbose(openSessionId, on);
          closeMenu();
        });
        panel.append(item);
      }

      const rect = row.getBoundingClientRect();
      panel.style.position = "fixed";
      panel.style.top = Math.round(rect.top) + "px";
      panel.style.left = Math.round(rect.left) - 6 + "px";
      panel.style.transform = "translateX(-100%)";
      panel.style.zIndex = "90";
      return panel;
    }

    /**
     * Append the two rows to one open session menu, once.
     *
     * @param {Element} menu - the shipped session menu.
     * @returns {boolean} whether this call added anything.
     */
    function augmentMenu(menu) {
      if (menu.hasAttribute(MENU_ATTR)) return false;
      if (!isSessionMenu(menu)) return false;
      const sample = menu.querySelector('[role="menuitem"]');
      if (sample === null) return false;

      const separator = document.createElement("div");
      separator.className = "dshvm-menuSep";

      const transcriptRow = menuRow(sample.className, "Transcript view", () => {
        const existing = menu.querySelector(".dshvm-sub");
        if (existing !== null) {
          existing.remove();
          return;
        }
        menu.append(submenuFor(transcriptRow));
      }, { id: "transcript", chevron: true });
      transcriptRow.setAttribute("aria-haspopup", "menu");
      transcriptRow.setAttribute("aria-expanded", "false");

      const settingsRow = menuRow(sample.className, "Verbose settings…", () => {
        try {
          window.dispatchEvent(new CustomEvent("dshvm:open-dialog"));
        } catch (error) {
          /* nothing to open in a test shim */
        }
        closeMenu();
      }, { id: "settings" });

      menu.append(separator, transcriptRow, settingsRow);
      menu.setAttribute(MENU_ATTR, "1");
      return true;
    }

    /** Watch for the shipped session menu opening. @returns {() => void} disposer. */
    function watchSessionMenu() {
      if (typeof document === "undefined" || typeof MutationObserver === "undefined") return () => {};
      const scan = () => {
        for (const menu of document.querySelectorAll('[role="menu"]')) augmentMenu(menu);
      };
      const observer = new MutationObserver(scan);
      observer.observe(document.body, { childList: true, subtree: true });
      scan();
      return () => observer.disconnect();
    }

    /* ================================================================== *
     * The dialog host
     *
     * Registered in the same session-scoped slot as the shipped button, but
     * under its own id — so it does NOT shadow anything — and it renders null
     * until a menu row asks for the dialog. That keeps the dialog in React
     * while the two menu rows stay plain DOM.
     * ================================================================== */
    function DialogHost(props) {
      openSessionId = props?.sessionId ?? openSessionId;

      const openHook = React.useState(false);
      const open = openHook[0];
      const setOpen = openHook[1];
      const prefsHook = React.useState(prefsNow);
      const prefs = prefsHook[0];
      const setPrefs = prefsHook[1];

      React.useEffect(() => {
        function onOpen() {
          openSessionId = props?.sessionId ?? openSessionId;
          setPrefs(readPrefs());
          setOpen(true);
        }
        window.addEventListener("dshvm:open-dialog", onOpen);
        return () => window.removeEventListener("dshvm:open-dialog", onOpen);
      }, [props?.sessionId]);

      if (!open) return null;

      function toggleCategory(key, next) {
        const updated = { ...prefs, [key]: next };
        setPrefs(updated);
        writeJson(PREFS_KEY, updated);
        const verbose = isVerbose(openSessionId);
        if (!verbose) {
          engine.prefs = updated;
          return;
        }
        if (next) engine.sync(true, updated);
        else {
          engine.collapse(Object.fromEntries(CATEGORIES.map((category) => [category.key, category.key === key])));
          engine.prefs = updated;
        }
      }

      function toggleExtra(key, next) {
        const updated = { ...prefs, [key]: next };
        setPrefs(updated);
        writeJson(PREFS_KEY, updated);
        if (key !== "visibleOnly") return;
        engine.prefs = updated;
        if (isVerbose(openSessionId)) engine.pass();
      }

      function chooseFold(next) {
        const updated = { ...prefs, foldAfter: next };
        setPrefs(updated);
        writeJson(PREFS_KEY, updated);
        if (next === "never") {
          setChatVerbose(openSessionId, true);
          return;
        }
        void writeCollapseTiming(ctxRef, next);
      }

      return h(VerboseSettings, {
        prefs,
        onToggle: toggleCategory,
        onToggleExtra: toggleExtra,
        onFold: chooseFold,
        onClose: () => setOpen(false),
      });
    }

    async function apply(ctx) {
      // The menu is injected as plain DOM, so the stylesheet has no React
      // component left to install it — apply() owns it now.
      injectStyles();

      // Mounted before the slot registers so the first menu open can already
      // reach the governor. A composition without the bridge loses only the
      // Compact settings panel: every other item is local to the browser.
      try {
        const disposeRemote = await ctx.remote.$mount(CG_CONTRIBUTION);
        ctx.effect(() => disposeRemote, "dsh-verbose: contextGovernor remote");
      } catch (error) {
        /* the panel reports it when opened */
      }

      // Registered under our OWN id, so the shipped button keeps its seat and
      // its own menu keeps its own rows. This entry renders null until a menu
      // row asks for the dialog; it is here for the session id and for a place
      // to keep the dialog in React.
      ctx.slots.inject("conversation.session.header.utilities", () =>
        ctx.slots.register(
          {
            name: "conversation.session.header.utilities",
            id: "verbose-dialog-host",
            order: 100,
          },
          DialogHost,
        ),
      );

      // Two rows appended to the shipped menu whenever it opens.
      ctx.effect(() => watchSessionMenu(), "dsh-verbose: session menu rows");
      ctx.slots.inject("conversation.chat.turnTail", () =>
        ctx.slots.register(
          {
            name: "conversation.chat.turnTail",
            id: "verbose-turn-footer",
            order: 20,
          },
          TurnFooter,
        ),
      );
    }

    exports.apply = apply;
    exports.inject = inject;
    return module.exports;
  },
});
