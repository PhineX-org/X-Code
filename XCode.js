/*!
 * XCode Editor — Embeddable Code Editor Widget
 * PhineX Group — v3.0.0
 *
 * ── USAGE ────────────────────────────────────────────────
 *
 *   <!-- 1. Add the container div -->
 *   <div id="my-editor"></div>
 *
 *   <!-- 2. Load the script -->
 *   <script src="https://phinex-org.github.io/XCode/XCode.js"></script>
 *
 *   <!-- 3. Initialise -->
 *   <script>
 *     const editor = new XCodeEditor({
 *       container: '#my-editor',   // required — CSS selector or DOM element
 *       language:  'javascript',   // initial language
 *       viewer:    'console',      // 'console' | 'page' | 'none'
 *       ai:        true,           // enable AI inline suggestions (Tab to accept)
 *     });
 *   </script>
 *
 * ── CSS CUSTOMISATION ────────────────────────────────────
 *
 *   #my-editor {
 *     width:  100%;
 *     height: 500px;
 *     --xce-accent:    #39ff14;
 *     --xce-bg:        #1e1e1e;
 *     --xce-font-size: 13px;
 *   }
 *   #my-editor .xce-viewer { height: 200px; }
 *
 * ── THAT'S IT. The AI is handled internally. ─────────────
 */

(function (global) {
  'use strict';

  /* ══════════════════════════════════════════════════════
     AI WORKER  (Gemini — internal, do not change)
  ══════════════════════════════════════════════════════ */
  const AI_WORKER = 'https://xcode.ahmedelgoharymessi.workers.dev/';

  /* ══════════════════════════════════════════════════════
     CSS — injected once into <head>
  ══════════════════════════════════════════════════════ */
  const STYLE_ID = 'xce-v3-styles';

  const CSS = `
@import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:ital,wght@0,300;0,400;0,500;0,700;1,400&display=swap');

/* ── Root / CSS tokens ── */
.xce-root {
  --xce-bg:         #1e1e1e;
  --xce-bg2:        #252526;
  --xce-bg3:        #2d2d30;
  --xce-border:     #3c3c3c;
  --xce-text:       #d4d4d4;
  --xce-muted:      #858585;
  --xce-accent:     #39ff14;
  --xce-accent-dim: rgba(57,255,20,.12);
  --xce-accent-bd:  rgba(57,255,20,.35);
  --xce-ghost:      rgba(145,160,180,.52);
  --xce-font:       'JetBrains Mono','Fira Code','Cascadia Code',monospace;
  --xce-font-size:  13px;
  --xce-line-h:     20px;
  /* syntax */
  --xce-kw:   #569cd6;
  --xce-str:  #ce9178;
  --xce-cmt:  #6a9955;
  --xce-fn:   #dcdcaa;
  --xce-num:  #b5cea8;
  --xce-type: #4ec9b0;
  --xce-prop: #9cdcfe;
  --xce-regex:#d16969;
  --xce-op:   #d4d4d4;

  display: flex;
  flex-direction: column;
  background: var(--xce-bg);
  color: var(--xce-text);
  font-family: var(--xce-font);
  font-size: var(--xce-font-size);
  overflow: hidden;
  position: relative;
  min-height: 100px;
}

/* ── Control bar ── */
.xce-bar {
  height: 34px;
  min-height: 34px;
  flex-shrink: 0;
  background: var(--xce-bg2);
  border-bottom: 1px solid var(--xce-border);
  display: flex;
  align-items: center;
  padding: 0 10px;
  gap: 6px;
  user-select: none;
}

/* language picker */
.xce-lang-wrap  { position: relative; }
.xce-lang-badge {
  font: 700 10px/1 var(--xce-font);
  letter-spacing: .8px;
  text-transform: uppercase;
  color: var(--xce-accent);
  border: 1px solid var(--xce-accent-bd);
  border-radius: 3px;
  padding: 3px 9px;
  cursor: pointer;
  white-space: nowrap;
  transition: background .15s;
}
.xce-lang-badge:hover { background: var(--xce-accent-dim); }
.xce-lang-menu {
  position: absolute;
  top: calc(100% + 5px);
  left: 0;
  background: var(--xce-bg3);
  border: 1px solid var(--xce-border);
  border-radius: 5px;
  min-width: 140px;
  z-index: 9999;
  display: none;
  box-shadow: 0 10px 30px rgba(0,0,0,.55);
  overflow: hidden;
}
.xce-lang-menu.open { display: block; }
.xce-lang-opt {
  padding: 6px 13px;
  font: 400 11px var(--xce-font);
  color: var(--xce-text);
  cursor: pointer;
  white-space: nowrap;
  transition: background .1s;
}
.xce-lang-opt:hover    { background: rgba(255,255,255,.07); }
.xce-lang-opt.selected { color: var(--xce-accent); }

.xce-spacer { flex: 1; }

/* buttons */
.xce-btn {
  height: 22px;
  padding: 0 11px;
  background: transparent;
  border: 1px solid var(--xce-border);
  border-radius: 3px;
  color: var(--xce-muted);
  font: 700 10px/22px var(--xce-font);
  letter-spacing: .5px;
  text-transform: uppercase;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 5px;
  white-space: nowrap;
  transition: border-color .15s, color .15s, background .15s;
}
.xce-btn:hover        { border-color: var(--xce-accent); color: var(--xce-accent); }
.xce-btn.xce-btn--on  { border-color: var(--xce-accent); color: var(--xce-accent); background: var(--xce-accent-dim); }
.xce-run {
  border-color: var(--xce-accent);
  background: var(--xce-accent);
  color: #000;
  font-weight: 900;
}
.xce-run:hover { opacity: .82; color: #000; border-color: var(--xce-accent); }

/* AI pulse dot */
.xce-ai-dot {
  width: 7px; height: 7px;
  border-radius: 50%;
  background: var(--xce-accent);
  opacity: 0;
  flex-shrink: 0;
  transition: opacity .2s;
}
.xce-ai-dot.on { opacity: 1; animation: xce-blink 1.5s ease-in-out infinite; }
@keyframes xce-blink { 0%,100%{opacity:1} 50%{opacity:.2} }

/* ── Editor area ── */
.xce-editor-wrap {
  display: flex;
  flex: 1;
  min-height: 0;
  overflow: hidden;
}

/* gutter */
.xce-gutter {
  width: 44px;
  flex-shrink: 0;
  background: var(--xce-bg2);
  border-right: 1px solid var(--xce-border);
  overflow: hidden;
  padding: 8px 8px 8px 0;
  text-align: right;
  pointer-events: none;
  user-select: none;
}
.xce-gutter-n {
  height: var(--xce-line-h);
  line-height: var(--xce-line-h);
  font-size: calc(var(--xce-font-size) - 1px);
  color: var(--xce-muted);
  padding-right: 5px;
  transition: color .1s;
}
.xce-gutter-n.cur { color: var(--xce-text); }

/* scrollable code area */
.xce-scroll {
  flex: 1;
  position: relative;
  overflow: auto;
}
.xce-scroll::-webkit-scrollbar { width: 8px; height: 8px; }
.xce-scroll::-webkit-scrollbar-track { background: transparent; }
.xce-scroll::-webkit-scrollbar-thumb { background: var(--xce-border); border-radius: 4px; }
.xce-scroll::-webkit-scrollbar-thumb:hover { background: #555; }

/* shared layer base */
.xce-hl, .xce-ghost, .xce-ta {
  position: absolute;
  top: 0; left: 0;
  padding: 8px 14px;
  font: var(--xce-font-size)/var(--xce-line-h) var(--xce-font);
  tab-size: 2;
  white-space: pre;
  word-break: normal;
  overflow-wrap: normal;
}

/* highlight layer */
.xce-hl {
  pointer-events: none;
  color: var(--xce-text);
  min-width: 100%;
  min-height: 100%;
  z-index: 1;
  overflow: visible;
}

/* ghost / suggestion layer */
.xce-ghost {
  pointer-events: none;
  color: transparent;
  min-width: 100%;
  z-index: 2;
  overflow: hidden;
}
.xce-ghost-text {
  color: var(--xce-ghost);
  font-style: italic;
  border-bottom: 1px dashed rgba(145,160,180,.28);
}
.xce-ghost-tab {
  display: inline-block;
  font: 700 8px/1 var(--xce-font);
  font-style: normal;
  letter-spacing: .6px;
  text-transform: uppercase;
  color: rgba(145,160,180,.55);
  background: rgba(255,255,255,.05);
  border: 1px solid rgba(255,255,255,.1);
  border-radius: 2px;
  padding: 1px 4px;
  margin-left: 6px;
  vertical-align: middle;
}

/* textarea */
.xce-ta {
  width: 100%; height: 100%;
  min-width: 100%; min-height: 100%;
  background: transparent;
  caret-color: var(--xce-accent);
  color: transparent;
  border: none;
  outline: none;
  resize: none;
  overflow: hidden;
  z-index: 3;
}
.xce-ta::selection { background: rgba(57,255,20,.16); }

/* AI thinking badge */
.xce-thinking {
  position: absolute;
  bottom: 10px; right: 14px;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font: 700 9px var(--xce-font);
  letter-spacing: .5px;
  text-transform: uppercase;
  color: var(--xce-muted);
  background: var(--xce-bg2);
  border: 1px solid var(--xce-border);
  border-radius: 4px;
  padding: 3px 10px;
  opacity: 0;
  pointer-events: none;
  transition: opacity .2s;
  z-index: 20;
}
.xce-thinking.on { opacity: 1; }
.xce-thinking-dot {
  width: 5px; height: 5px;
  border-radius: 50%;
  background: var(--xce-accent);
  animation: xce-blink .9s infinite;
}

/* ── Resize handle ── */
.xce-resize {
  height: 5px;
  min-height: 5px;
  flex-shrink: 0;
  background: var(--xce-border);
  cursor: ns-resize;
  position: relative;
  transition: background .15s;
}
.xce-resize::after {
  content: '';
  position: absolute;
  top: 50%; left: 50%;
  transform: translate(-50%,-50%);
  width: 36px; height: 2px;
  background: #555; border-radius: 2px;
}
.xce-resize:hover          { background: var(--xce-accent); }
.xce-resize:hover::after   { background: rgba(0,0,0,.4); }

/* ── Viewer ── */
.xce-viewer {
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
  overflow: hidden;
  background: var(--xce-bg3);
}

.xce-viewer-bar {
  height: 28px;
  min-height: 28px;
  flex-shrink: 0;
  background: var(--xce-bg2);
  border-bottom: 1px solid var(--xce-border);
  display: flex;
  align-items: stretch;
}
.xce-vtab {
  padding: 0 14px;
  font: 700 9px var(--xce-font);
  letter-spacing: .9px;
  text-transform: uppercase;
  color: var(--xce-muted);
  cursor: pointer;
  border-bottom: 2px solid transparent;
  display: flex; align-items: center;
  transition: color .12s;
  user-select: none;
}
.xce-vtab:hover      { color: var(--xce-text); }
.xce-vtab.on         { color: var(--xce-accent); border-bottom-color: var(--xce-accent); }
.xce-vtab-gap        { flex: 1; }
.xce-vclear {
  padding: 0 11px;
  background: transparent;
  border: none;
  border-left: 1px solid var(--xce-border);
  font: 9px var(--xce-font);
  letter-spacing: .5px;
  text-transform: uppercase;
  color: var(--xce-muted);
  cursor: pointer;
  transition: color .12s, background .12s;
}
.xce-vclear:hover { color: var(--xce-text); background: rgba(255,255,255,.04); }

.xce-viewer-body { flex: 1; overflow: hidden; position: relative; }

/* page viewer */
.xce-iframe {
  width: 100%; height: 100%;
  border: none; background: #fff;
  display: block;
}

/* console viewer */
.xce-console {
  width: 100%; height: 100%;
  overflow-y: auto; overflow-x: auto;
  padding: 6px 12px;
  font: 12px/18px var(--xce-font);
}
.xce-console::-webkit-scrollbar { width: 5px; height: 5px; }
.xce-console::-webkit-scrollbar-thumb { background: var(--xce-border); border-radius: 3px; }

.xce-con-line {
  display: flex; gap: 7px;
  padding: 1px 0;
  border-bottom: 1px solid rgba(255,255,255,.03);
  white-space: pre-wrap;
  word-break: break-all;
}
.xce-con-line.log   { color: var(--xce-text); }
.xce-con-line.warn  { color: #cca700; }
.xce-con-line.error { color: #f44747; }
.xce-con-line.info  { color: #3794ff; }
.xce-con-prompt     { color: var(--xce-muted); flex-shrink: 0; user-select: none; }
.xce-con-empty      {
  color: var(--xce-muted); font-size: 11px;
  padding: 14px; text-align: center; opacity: .6;
}

/* ── Syntax token colours ── */
.xce-root .tk-kw    { color: var(--xce-kw); }
.xce-root .tk-str   { color: var(--xce-str); }
.xce-root .tk-cmt   { color: var(--xce-cmt); font-style: italic; }
.xce-root .tk-fn    { color: var(--xce-fn); }
.xce-root .tk-num   { color: var(--xce-num); }
.xce-root .tk-type  { color: var(--xce-type); }
.xce-root .tk-prop  { color: var(--xce-prop); }
.xce-root .tk-plain { color: var(--xce-text); }
.xce-root .tk-op    { color: var(--xce-op); }
.xce-root .tk-regex { color: var(--xce-regex); }
.xce-root .tk-sel   { color: #d7ba7d; }
.xce-root .tk-attr  { color: var(--xce-prop); }
.xce-root .tk-val   { color: var(--xce-str); }
`;

  /* ══════════════════════════════════════════════════════
     HELPERS
  ══════════════════════════════════════════════════════ */
  function esc(s) {
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }
  function sp(cls, txt) {
    return '<span class="tk-' + cls + '">' + txt + '</span>';
  }

  /* ══════════════════════════════════════════════════════
     SYNTAX HIGHLIGHTERS
  ══════════════════════════════════════════════════════ */

  /* ── JavaScript / TypeScript ── */
  function hlJS(h) {
    const P = [];
    const stash = s => { P.push(s); return '\x00' + (P.length - 1) + '\x00'; };

    h = h.replace(/`(?:[^`\\]|\\.|\n)*`/g,  m => stash(sp('str', m)));
    h = h.replace(/\/\*[\s\S]*?\*\//g,       m => stash(sp('cmt', m)));
    h = h.replace(/\/\/.*/g,                 m => stash(sp('cmt', m)));
    h = h.replace(/("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*')/g, m => stash(sp('str', m)));

    // regex literals (simplified — after =/( only)
    h = h.replace(/(?<=[=(:,!&|?[\s])\/(?![/*])(?:[^/\\\n]|\\.)+\/[gimsuy]*/g,
      m => stash(sp('regex', m)));

    h = h.replace(
      /\b(const|let|var|function|class|if|else|for|while|do|switch|case|break|continue|return|import|export|default|from|as|new|this|super|extends|typeof|instanceof|in|of|async|await|try|catch|finally|throw|delete|void|null|undefined|true|false|static|get|set|yield|interface|type|enum|implements|abstract|declare|readonly|namespace|module|keyof|infer|satisfies)\b/g,
      m => sp('kw', m)
    );

    h = h.replace(
      /\b(string|number|boolean|object|any|void|never|unknown|symbol|bigint|Array|Promise|Map|Set|WeakMap|WeakSet|Object|Function|Date|RegExp|Error|Symbol|BigInt|console|window|document|Math|JSON|parseInt|parseFloat|isNaN|isFinite|NaN|Infinity|fetch|setTimeout|setInterval|clearTimeout|clearInterval|queueMicrotask|globalThis|process|Buffer|URL|URLSearchParams|FormData|Headers|Request|Response|Event|EventTarget)\b/g,
      m => sp('type', m)
    );

    h = h.replace(/\b(0x[\da-fA-F_]+|0b[01_]+|0o[0-7_]+|\d[\d_]*\.?[\d_]*(?:[eE][+-]?\d+)?n?)\b/g,
      m => sp('num', m));

    h = h.replace(/@[\w.]+/g, m => sp('fn', m));
    h = h.replace(/\b([A-Za-z_$][\w$]*)(?=\s*\()/g, m => sp('fn', m));
    h = h.replace(/(?<=\.)([A-Za-z_$][\w$]*)(?!\s*\()/g, m => sp('prop', m));

    return h.replace(/\x00(\d+)\x00/g, (_, i) => P[+i]);
  }

  /* ── CSS / SCSS ── */
  function hlCSS(raw) {
    // Rewritten as a single left-to-right scan that tracks whether we're inside a
    // declaration block ({ ... }) or in selector/at-rule position, instead of five
    // chained global regexes each re-scanning the HTML the previous one produced.
    // The old chain broke on any selector containing a colon (:hover, :focus,
    // ::before, @media (max-width:) — i.e. most real CSS): the "grab everything
    // after this colon up to the next delimiter" value-regex would run straight
    // through markup left by the earlier keyword/selector steps and emit
    // mismatched <span> tags. Tracking block-depth explicitly makes that
    // structurally impossible instead of patching symptoms.
    let out = '', i = 0;
    const N = raw.length;
    let blockDepth = 0;

    while (i < N) {
      const c = raw[i];
      if (/\s/.test(c)) { out += c; i++; continue; }
      if (c === '/' && raw[i + 1] === '*') {
        let j = raw.indexOf('*/', i + 2);
        j = j < 0 ? N : j + 2;
        out += sp('cmt', esc(raw.slice(i, j)));
        i = j; continue;
      }
      if (c === '"' || c === "'") {
        const q = c; let j = i + 1;
        while (j < N && raw[j] !== q) { if (raw[j] === '\\') j += 2; else j++; }
        j = Math.min(j + 1, N);
        out += sp('str', esc(raw.slice(i, j)));
        i = j; continue;
      }
      if (c === '{') { out += c; blockDepth++; i++; continue; }
      if (c === '}') { out += c; blockDepth = Math.max(0, blockDepth - 1); i++; continue; }
      if (c === ';') { out += ';'; i++; continue; } // stray/separator semicolon -- never re-enter chunk scanning on it

      if (blockDepth === 0) {
        let j = i;
        while (j < N && raw[j] !== '{' && raw[j] !== '}' && raw[j] !== ';' && raw[j] !== '"' && raw[j] !== "'" && !(raw[j] === '/' && raw[j + 1] === '*')) j++;
        out += highlightSelectorChunk(raw.slice(i, j));
        i = j;
        continue;
      } else {
        let j = i;
        while (j < N && raw[j] !== ':' && raw[j] !== ';' && raw[j] !== '}' && raw[j] !== '{' && raw[j] !== '"' && raw[j] !== "'" && !(raw[j] === '/' && raw[j + 1] === '*')) j++;
        if (j < N && raw[j] === ':') {
          // Tentatively "property:value" -- but a colon also introduces pseudo-classes/
          // elements in a nested (SCSS-style) selector, e.g. "&:hover { ... }". Look
          // ahead: if a "{" appears before a proper ";"/"}" terminator, this was really
          // a selector, not a declaration -- rewind and highlight the whole span as one.
          let v = j + 1;
          while (v < N && raw[v] !== ';' && raw[v] !== '}' && raw[v] !== '{' && raw[v] !== '"' && raw[v] !== "'" && !(raw[v] === '/' && raw[v + 1] === '*')) v++;
          if (v < N && raw[v] === '{') {
            out += highlightSelectorChunk(raw.slice(i, v));
            i = v;
            continue;
          }
          const propText = raw.slice(i, j);
          out += propText.trim() ? sp('prop', esc(propText)) : esc(propText);
          out += ':';
          out += highlightValueChunk(raw.slice(j + 1, v));
          i = v;
          continue;
        } else {
          out += highlightSelectorChunk(raw.slice(i, j));
          i = j;
          continue;
        }
      }
    }
    return out;

    function highlightSelectorChunk(chunk) {
      if (!chunk.trim()) return esc(chunk);
      const lead = chunk.match(/^\s*/)[0];
      const trail = chunk.match(/\s*$/)[0];
      const body = chunk.slice(lead.length, chunk.length - trail.length);
      if (!body) return esc(chunk);
      if (body.startsWith('@')) {
        const m = body.match(/^(@[\w-]+)([\s\S]*)$/);
        if (m) return esc(lead) + sp('kw', esc(m[1])) + esc(m[2]) + esc(trail);
      }
      return esc(lead) + sp('sel', esc(body)) + esc(trail);
    }
    function highlightValueChunk(text) {
      let r = esc(text);
      r = r.replace(/\b(\d+(?:\.\d+)?)(px|em|rem|vh|vw|%|s|ms|deg|fr|ch|dvh|svh|cqw)?\b/g,
        (_, n, u) => sp('num', n) + (u ? sp('type', u) : ''));
      return sp('val', r);
    }
  }

  /* ── HTML ── */
  function _tagEnd(src, from) {
    let i = from + 1, q = '', inQ = false;
    while (i < src.length) {
      const c = src[i];
      if (inQ)      { if (c === q) inQ = false; }
      else if (c === '"' || c === "'") { inQ = true; q = c; }
      else if (c === '>') return i;
      i++;
    }
    return src.length - 1;
  }

  function _tokenTag(raw) {
    if (!raw.startsWith('<')) return esc(raw);
    let out = '&lt;', i = 1;
    if (raw[i] === '/') { out += '/'; i++; }
    let j = i;
    while (j < raw.length && /[\w:-]/.test(raw[j])) j++;
    if (j > i) out += sp('kw', esc(raw.slice(i, j)));
    i = j;
    while (i < raw.length) {
      const c = raw[i];
      if (c === '>' || (c === '/' && raw[i + 1] === '>')) {
        out += c === '>' ? '&gt;' : '/&gt;'; break;
      }
      if (/\s/.test(c)) { out += c; i++; continue; }
      let k = i;
      while (k < raw.length && raw[k] !== '=' && raw[k] !== '>' && !/\s/.test(raw[k])) k++;
      if (k > i) out += sp('attr', esc(raw.slice(i, k)));
      i = k;
      if (raw[i] === '=') {
        out += '='; i++;
        if (raw[i] === '"' || raw[i] === "'") {
          const q = raw[i];
          const e = raw.indexOf(q, i + 1);
          const end = e < 0 ? raw.length - 1 : e;
          out += sp('val', esc(raw.slice(i, end + 1)));
          i = end + 1;
        } else {
          let k = i;
          while (k < raw.length && raw[k] !== '>' && !/\s/.test(raw[k])) k++;
          out += sp('val', esc(raw.slice(i, k)));
          i = k;
        }
      }
    }
    return out;
  }

  function _embedBlock(src, start, tag, lang) {
    const close = '</' + tag;
    const te = _tagEnd(src, start);
    const cs = te + 1;
    const ci = src.toLowerCase().indexOf(close.toLowerCase(), cs);
    if (ci < 0) return { html: esc(src.slice(start)), end: src.length };
    const cnt = src.slice(cs, ci);
    const ctr = src.slice(ci, ci + close.length + 1);
    const inner = lang === 'js' ? hlJS(esc(cnt)) : hlCSS(cnt);
    return {
      html: _tokenTag(src.slice(start, te + 1)) + inner + _tokenTag(ctr),
      end: ci + ctr.length
    };
  }

  function hlHTML(raw) {
    if (!raw) return '';
    let out = '', i = 0;
    while (i < raw.length) {
      if (/^<script[\s>\/]/i.test(raw.slice(i))) {
        const r = _embedBlock(raw, i, 'script', 'js');
        out += r.html; i = r.end; continue;
      }
      if (/^<style[\s>\/]/i.test(raw.slice(i))) {
        const r = _embedBlock(raw, i, 'style', 'css');
        out += r.html; i = r.end; continue;
      }
      if (raw.slice(i, i + 4) === '<!--') {
        const e = raw.indexOf('-->', i + 4);
        const chunk = e < 0 ? raw.slice(i) : raw.slice(i, e + 3);
        out += sp('cmt', esc(chunk)); i += chunk.length; continue;
      }
      if (raw[i] === '<' && raw[i + 1] === '!') {
        const e = raw.indexOf('>', i);
        const chunk = e < 0 ? raw.slice(i) : raw.slice(i, e + 1);
        out += sp('kw', esc(chunk)); i += chunk.length; continue;
      }
      if (raw[i] === '<') {
        const e = _tagEnd(raw, i);
        out += _tokenTag(raw.slice(i, e + 1));
        i = e + 1; continue;
      }
      const nx = raw.indexOf('<', i);
      const txt = nx < 0 ? raw.slice(i) : raw.slice(i, nx);
      out += esc(txt); i += txt.length;
    }
    return out;
  }

  /* ── Python ── */
  function hlPY(h) {
    const P = [];
    const stash = s => { P.push(s); return '\x00' + (P.length - 1) + '\x00'; };

    h = h.replace(/("""[\s\S]*?"""|'''[\s\S]*?''')/g, m => stash(sp('str', m)));
    h = h.replace(/#.*/g,                              m => stash(sp('cmt', m)));
    h = h.replace(/(?:r|b|f|rb|br)?("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*')/gi,
      m => stash(sp('str', m)));

    h = h.replace(
      /\b(def|class|if|elif|else|for|while|with|as|return|import|from|try|except|finally|raise|pass|break|continue|global|nonlocal|lambda|yield|del|assert|and|or|not|in|is|async|await|None|True|False|match|case)\b/g,
      m => sp('kw', m)
    );
    h = h.replace(
      /\b(print|len|range|list|dict|set|tuple|int|float|str|bool|type|isinstance|input|open|super|enumerate|zip|map|filter|sorted|sum|min|max|abs|round|repr|vars|dir|hasattr|getattr|setattr|callable|property|staticmethod|classmethod|object)\b/g,
      m => sp('type', m)
    );
    h = h.replace(/@[\w.]+/g, m => sp('fn', m));
    h = h.replace(/\b(\d+\.?\d*(?:[eE][+-]?\d+)?|0x[\da-fA-F]+|0b[01]+|0o[0-7]+)\b/g,
      m => sp('num', m));
    h = h.replace(/\bdef\s+([A-Za-z_]\w*)/g,   (_, n) => sp('kw','def') + ' ' + sp('fn', n));
    h = h.replace(/\bclass\s+([A-Za-z_]\w*)/g, (_, n) => sp('kw','class') + ' ' + sp('type', n));
    h = h.replace(/\b([A-Za-z_]\w*)(?=\s*\()/g, m => sp('fn', m));

    return h.replace(/\x00(\d+)\x00/g, (_, i) => P[+i]);
  }

  /* ── JSON ── */
  function hlJSON(h) {
    const P = [];
    const stash = s => { P.push(s); return '\x00' + (P.length - 1) + '\x00'; };

    h = h.replace(/("(?:[^"\\]|\\.)*")\s*(?=:)/g, m => stash(sp('prop', m)));
    h = h.replace(/("(?:[^"\\]|\\.)*")/g,          m => stash(sp('str', m)));
    h = h.replace(/\b(-?\d+\.?\d*(?:[eE][+-]?\d+)?)\b/g, m => stash(sp('num', m)));
    h = h.replace(/\b(true|false|null)\b/g,         m => stash(sp('kw', m)));

    return h.replace(/\x00(\d+)\x00/g, (_, i) => P[+i]);
  }

  /* ── Markdown ── */
  function hlMD(raw) {
    let h = esc(raw);
    h = h.replace(/^(#{1,6})(.+)$/gm, (_, hsh, rest) => sp('fn', hsh) + sp('kw', rest));
    h = h.replace(/`([^`\n]+)`/g,     (_, c)  => sp('str', '`' + c + '`'));
    h = h.replace(/\*\*([^*]+)\*\*/g, (_, t)  => sp('type', '**' + t + '**'));
    h = h.replace(/\*([^*\n]+)\*/g,   (_, t)  => sp('cmt', '*' + t + '*'));
    h = h.replace(/^(\s*[-*+]|\d+\.) /gm, m  => sp('num', m));
    h = h.replace(/\[([^\]]+)\]\(([^)]+)\)/g,
      (_, t, u) => '[' + sp('prop', t) + '](' + sp('str', u) + ')');
    return h;
  }

  /* ── Shell ── */
  function hlSH(h) {
    const P = [];
    const stash = s => { P.push(s); return '\x00' + (P.length - 1) + '\x00'; };

    h = h.replace(/#.*/g, m => stash(sp('cmt', m)));
    h = h.replace(/("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*')/g, m => stash(sp('str', m)));
    h = h.replace(
      /\b(if|then|else|elif|fi|for|do|done|while|until|case|esac|function|return|in|select|time|coproc|echo|exit|export|source|cd|ls|grep|sed|awk|cat|chmod|mkdir|rm|cp|mv|find|curl|wget|git|npm|node|python|pip|docker|make|sudo)\b/g,
      m => sp('kw', m)
    );
    h = h.replace(/\$\{?[\w@#?*!\-0-9]+\}?/g, m => stash(sp('prop', esc(m))));
    h = h.replace(/\b(\d+)\b/g, m => sp('num', m));

    return h.replace(/\x00(\d+)\x00/g, (_, i) => P[+i]);
  }

  /* ── Dispatcher ── */
  function highlight(code, lang) {
    if (!code) return '';
    try {
      switch ((lang || '').toLowerCase()) {
        case 'javascript': case 'typescript': case 'jsx': case 'tsx': case 'js': case 'ts':
          return hlJS(esc(code));
        case 'html': case 'htm': case 'xml': case 'svg':
          return hlHTML(code);
        case 'css': case 'scss': case 'sass': case 'less':
          return hlCSS(code);
        case 'python': case 'py':
          return hlPY(esc(code));
        case 'json': case 'jsonc':
          return hlJSON(esc(code));
        case 'markdown': case 'md': case 'mdx':
          return hlMD(code);
        case 'shell': case 'bash': case 'sh': case 'zsh':
          return hlSH(esc(code));
        default:
          return esc(code);
      }
    } catch (_) {
      return esc(code);
    }
  }

  /* ── Ghost overlay builder ── */
  function buildGhostLayer(code, lang, suggestion, cursorPos) {
    if (!suggestion) return highlight(code, lang);

    const before = code.slice(0, cursorPos);
    const after  = code.slice(cursorPos);

    // Only render ghost if cursor is at line end
    const lines  = before.split('\n');
    const curLine = lines[lines.length - 1];
    const fullLines = code.split('\n');
    if (curLine !== fullLines[lines.length - 1]) return highlight(code, lang);

    const suggLines = suggestion.split('\n').slice(0, 5);
    const ghostHTML =
      '<span class="xce-ghost-text">' + esc(suggLines[0]) + '</span>' +
      (suggLines.length > 1
        ? '<span class="xce-ghost-text">' + esc('\n' + suggLines.slice(1).join('\n')) + '</span>'
        : '') +
      '<span class="xce-ghost-tab">Tab</span>';

    return highlight(before, lang) + ghostHTML + highlight(after, lang);
  }

  /* ══════════════════════════════════════════════════════
     LANGUAGE LIST
  ══════════════════════════════════════════════════════ */
  const LANGS = [
    'javascript', 'typescript', 'html', 'css',
    'python', 'json', 'markdown', 'shell', 'plaintext'
  ];

  /* ══════════════════════════════════════════════════════
     XCodeEditor CLASS
  ══════════════════════════════════════════════════════ */
  class XCodeEditor {

    /**
     * @param {Object} opts
     * @param {string|HTMLElement} opts.container   — CSS selector or element (required)
     * @param {string}  [opts.language]             — initial language
     * @param {string}  [opts.initialCode]          — starter code
     * @param {string}  [opts.viewer]               — 'console' | 'page' | 'none'
     * @param {string}  [opts.viewerHeight]         — CSS string, e.g. '180px'
     * @param {boolean} [opts.ai]                   — enable AI suggestions (default true)
     * @param {Function}[opts.onChange]             — callback(code: string)
     * @param {Function}[opts.onRun]                — callback(code: string)
     */
    constructor(opts = {}) {
      this._cfg = Object.assign({
        language:     'javascript',
        initialCode:  '',
        viewer:       'console',
        viewerHeight: '180px',
        ai:           true,
        onChange:     null,
        onRun:        null
      }, opts);

      // normalise ai option (accept ai / aiEnabled)
      this._aiEnabled = this._cfg.ai !== false && this._cfg.aiEnabled !== false;

      this._lang        = this._cfg.language;
      this._code        = this._cfg.initialCode;
      this._viewerMode  = this._cfg.viewer;
      this._aiOn        = this._aiEnabled;
      this._suggestion  = '';
      this._suggestPos  = 0;
      this._cursorLine  = 0;
      this._consoleLogs = [];
      this._events      = {};
      this._aiTimer     = null;
      this._aiAbort     = null;

      this._injectCSS();
      this._mount();
    }

    /* ── Inject styles once ── */
    _injectCSS() {
      if (!document.getElementById(STYLE_ID)) {
        const s = document.createElement('style');
        s.id = STYLE_ID;
        s.textContent = CSS;
        document.head.appendChild(s);
      }
    }

    /* ── Find container and build ── */
    _mount() {
      const el = typeof this._cfg.container === 'string'
        ? document.querySelector(this._cfg.container)
        : this._cfg.container;

      if (!el) throw new Error('[XCodeEditor] container not found: ' + this._cfg.container);
      this._root = el;
      this._root.classList.add('xce-root');
      this._build();
    }

    /* ══════════════════════════════════════════════════════
       BUILD DOM
    ══════════════════════════════════════════════════════ */
    _build() {
      const hasViewer = this._viewerMode !== 'none';

      this._root.innerHTML = `
        <!-- bar -->
        <div class="xce-bar" id="xce-bar">
          <div class="xce-lang-wrap">
            <div class="xce-lang-badge" id="xce-lb">${this._lang}</div>
            <div class="xce-lang-menu"  id="xce-lm">
              ${LANGS.map(l =>
                `<div class="xce-lang-opt${l === this._lang ? ' selected' : ''}"
                      data-lang="${l}">${l}</div>`
              ).join('')}
            </div>
          </div>
          <div class="xce-spacer"></div>
          ${this._aiEnabled ? `
            <div class="xce-ai-dot${this._aiOn ? '' : ''}" id="xce-ad"></div>
            <button class="xce-btn${this._aiOn ? ' xce-btn--on' : ''}" id="xce-aib" title="Toggle AI (Tab=accept, Esc=dismiss)">
              ✦ AI
            </button>` : ''}
          ${hasViewer ? `
            <button class="xce-run xce-btn" id="xce-run" title="Run (Ctrl+Enter)">
              ▶ Run
            </button>` : ''}
        </div>

        <!-- editor -->
        <div class="xce-editor-wrap">
          <div class="xce-gutter" id="xce-gt"></div>
          <div class="xce-scroll" id="xce-sc">
            <div class="xce-hl"    id="xce-hl"></div>
            <div class="xce-ghost" id="xce-gh"></div>
            <textarea class="xce-ta" id="xce-ta"
              spellcheck="false"
              autocorrect="off"
              autocapitalize="off"
              autocomplete="off"
              data-gramm="false"
            ></textarea>
          </div>
        </div>

        ${hasViewer ? `
        <!-- resize -->
        <div class="xce-resize" id="xce-rh"></div>

        <!-- viewer -->
        <div class="xce-viewer" id="xce-vw" style="height:${this._cfg.viewerHeight}">
          <div class="xce-viewer-bar">
            <div class="xce-vtab${this._viewerMode === 'console' ? ' on' : ''}" data-mode="console">Console</div>
            <div class="xce-vtab${this._viewerMode === 'page'    ? ' on' : ''}" data-mode="page">Page</div>
            <div class="xce-vtab-gap"></div>
            <button class="xce-vclear" id="xce-cl">Clear</button>
          </div>
          <div class="xce-viewer-body" id="xce-vb">
            ${this._buildViewerContent()}
          </div>
        </div>` : ''}

        <!-- AI thinking badge -->
        <div class="xce-thinking" id="xce-tk">
          <div class="xce-thinking-dot"></div> AI thinking…
        </div>
      `;

      // Set textarea value safely (no HTML encoding)
      this._q('#xce-ta').value = this._code;

      this._bindEvents();
      this._refreshHL();
      this._refreshGutter();
    }

    /* ── Query helper ── */
    _q(sel) { return this._root.querySelector(sel); }

    /* ── Viewer inner content ── */
    _buildViewerContent() {
      if (this._viewerMode === 'page') {
        return `<iframe class="xce-iframe" id="xce-if"
          sandbox="allow-scripts allow-same-origin allow-forms allow-modals"
        ></iframe>`;
      }
      const lines = this._consoleLogs.map(l =>
        `<div class="xce-con-line ${l.t}">
          <span class="xce-con-prompt">›</span>${esc(String(l.v))}
         </div>`
      ).join('');
      return `<div class="xce-console" id="xce-con">
        ${lines || '<div class="xce-con-empty">Press ▶ Run · Ctrl+Enter</div>'}
      </div>`;
    }

    /* ══════════════════════════════════════════════════════
       EVENT BINDING
    ══════════════════════════════════════════════════════ */
    _bindEvents() {
      const ta = this._q('#xce-ta');
      const sc = this._q('#xce-sc');

      /* ── textarea ── */
      if (ta) {
        ta.addEventListener('input', () => {
          this._code = ta.value;
          this._clearSuggestion();
          this._refreshHL();
          this._refreshGutter();
          if (this._aiOn) this._scheduleAI();
          this._emit('change', this._code);
          if (this._cfg.onChange) this._cfg.onChange(this._code);
        });

        ta.addEventListener('keydown', e => {

          // Tab — accept suggestion OR indent
          if (e.key === 'Tab') {
            e.preventDefault();
            if (this._suggestion) {
              this._acceptSuggestion();
            } else {
              const s = ta.selectionStart, en = ta.selectionEnd;
              if (s !== en) {
                // multi-line indent
                const v = ta.value;
                const sel = v.slice(s, en);
                const indented = sel.replace(/^/gm, '  ');
                ta.value = v.slice(0, s) + indented + v.slice(en);
                ta.selectionStart = s;
                ta.selectionEnd   = s + indented.length;
              } else {
                ta.value = ta.value.slice(0, s) + '  ' + ta.value.slice(en);
                ta.selectionStart = ta.selectionEnd = s + 2;
              }
              this._code = ta.value;
              this._refreshHL();
              this._refreshGutter();
            }
          }

          // Esc — dismiss suggestion
          if (e.key === 'Escape') this._clearSuggestion();

          // Ctrl/Cmd+Enter — run
          if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
            e.preventDefault();
            this._run();
          }

          // Auto-pair
          const pairs = { '(':')', '[':']', '{':'}', '"':'"', "'":"'" };
          if (pairs[e.key] && !e.ctrlKey && !e.metaKey && !e.altKey) {
            const s = ta.selectionStart, en = ta.selectionEnd;
            if (s === en) {
              e.preventDefault();
              const close = pairs[e.key];
              ta.value = ta.value.slice(0, s) + e.key + close + ta.value.slice(en);
              ta.selectionStart = ta.selectionEnd = s + 1;
              this._code = ta.value;
              this._refreshHL();
              this._refreshGutter();
            }
          }

          // Auto-close multi-line braces on Enter
          if (e.key === 'Enter') {
            const s = ta.selectionStart;
            const lineBefore = ta.value.slice(0, s).split('\n').pop();
            const indent = lineBefore.match(/^(\s*)/)[1];
            const lastChar = lineBefore.trimEnd().slice(-1);
            if (['{', '[', '('].includes(lastChar)) {
              e.preventDefault();
              const ins = '\n' + indent + '  \n' + indent;
              ta.value = ta.value.slice(0, s) + ins + ta.value.slice(s);
              ta.selectionStart = ta.selectionEnd = s + indent.length + 3;
              this._code = ta.value;
              this._refreshHL();
              this._refreshGutter();
            }
          }

          setTimeout(() => this._refreshCursorLine(), 0);
        });

        ta.addEventListener('click', () => {
          this._clearSuggestion();
          this._refreshCursorLine();
        });
        ta.addEventListener('keyup', () => this._refreshCursorLine());

        // Sync scroll between textarea and layers
        sc && sc.addEventListener('scroll', () => {
          const hl = this._q('#xce-hl');
          const gh = this._q('#xce-gh');
          const gt = this._q('#xce-gt');
          if (hl) hl.style.transform = `translate(-${sc.scrollLeft}px,-${sc.scrollTop}px)`;
          if (gh) gh.style.transform = `translate(-${sc.scrollLeft}px,-${sc.scrollTop}px)`;
          if (gt) gt.scrollTop = sc.scrollTop;
        });
      }

      /* ── Run button ── */
      const runBtn = this._q('#xce-run');
      if (runBtn) runBtn.addEventListener('click', () => this._run());

      /* ── AI toggle ── */
      const aiBtn = this._q('#xce-aib');
      if (aiBtn) {
        aiBtn.addEventListener('click', () => {
          this._aiOn = !this._aiOn;
          aiBtn.classList.toggle('xce-btn--on', this._aiOn);
          if (!this._aiOn) this._clearSuggestion();
        });
      }

      /* ── Language picker ── */
      const lb = this._q('#xce-lb');
      const lm = this._q('#xce-lm');
      if (lb && lm) {
        lb.addEventListener('click', e => {
          e.stopPropagation();
          lm.classList.toggle('open');
        });
        lm.querySelectorAll('.xce-lang-opt').forEach(opt => {
          opt.addEventListener('click', e => {
            e.stopPropagation();
            this._lang = opt.dataset.lang;
            lb.textContent = this._lang;
            lm.querySelectorAll('.xce-lang-opt').forEach(o =>
              o.classList.toggle('selected', o === opt));
            lm.classList.remove('open');
            this._clearSuggestion();
            this._refreshHL();
          });
        });
        document.addEventListener('click', () => lm.classList.remove('open'));
      }

      /* ── Viewer tabs ── */
      const vw = this._q('#xce-vw');
      if (vw) {
        vw.querySelectorAll('.xce-vtab').forEach(tab => {
          tab.addEventListener('click', () => {
            this._viewerMode = tab.dataset.mode;
            vw.querySelectorAll('.xce-vtab').forEach(t => t.classList.toggle('on', t === tab));
            const vb = this._q('#xce-vb');
            if (vb) vb.innerHTML = this._buildViewerContent();
          });
        });
      }

      /* ── Clear button ── */
      const cl = this._q('#xce-cl');
      if (cl) {
        cl.addEventListener('click', () => {
          this._consoleLogs = [];
          if (this._viewerMode === 'page') {
            const f = this._q('#xce-if');
            if (f) f.srcdoc = '';
          } else {
            const con = this._q('#xce-con');
            if (con) con.innerHTML = '<div class="xce-con-empty">Cleared.</div>';
          }
        });
      }

      /* ── Resize handle ── */
      const rh = this._q('#xce-rh');
      if (rh && vw) {
        let drag = false, y0 = 0, h0 = 0;

        const startDrag = (clientY) => {
          drag = true; y0 = clientY; h0 = vw.offsetHeight;
          document.body.style.userSelect = 'none';
          document.body.style.cursor = 'ns-resize';
        };
        const moveDrag = (clientY) => {
          if (!drag) return;
          vw.style.height = Math.max(40, Math.min(800, h0 + (y0 - clientY))) + 'px';
        };
        const endDrag = () => {
          drag = false;
          document.body.style.userSelect = '';
          document.body.style.cursor = '';
        };

        rh.addEventListener('mousedown', e => { startDrag(e.clientY); e.preventDefault(); });
        document.addEventListener('mousemove', e => moveDrag(e.clientY));
        document.addEventListener('mouseup', endDrag);

        rh.addEventListener('touchstart', e => { startDrag(e.touches[0].clientY); e.preventDefault(); }, { passive: false });
        document.addEventListener('touchmove', e => moveDrag(e.touches[0].clientY));
        document.addEventListener('touchend', endDrag);
      }
    }

    /* ══════════════════════════════════════════════════════
       HIGHLIGHT & GUTTER
    ══════════════════════════════════════════════════════ */
    _refreshHL() {
      const hl = this._q('#xce-hl');
      const gh = this._q('#xce-gh');
      if (!hl) return;

      const rendered = this._suggestion
        ? buildGhostLayer(this._code, this._lang, this._suggestion, this._suggestPos)
        : highlight(this._code, this._lang);

      hl.innerHTML = rendered;
      if (gh) gh.innerHTML = ''; // ghost is baked into hl when active

      // Expand virtual scroll area
      const sc = this._q('#xce-sc');
      const ta = this._q('#xce-ta');
      if (sc && ta && hl) {
        const h = Math.max(hl.scrollHeight + 40, sc.clientHeight);
        const w = Math.max(hl.scrollWidth  + 60, sc.clientWidth);
        ta.style.height   = h + 'px';
        ta.style.minHeight = '100%';
        ta.style.width    = w + 'px';
        ta.style.minWidth = '100%';
      }
    }

    _refreshGutter() {
      const gt = this._q('#xce-gt');
      if (!gt) return;
      const n = this._code.split('\n').length;
      let html = '';
      for (let i = 0; i < n; i++) {
        html += `<div class="xce-gutter-n${i === this._cursorLine ? ' cur' : ''}">${i + 1}</div>`;
      }
      gt.innerHTML = html;
    }

    _refreshCursorLine() {
      const ta = this._q('#xce-ta');
      if (!ta) return;
      const line = ta.value.slice(0, ta.selectionStart).split('\n').length - 1;
      if (line !== this._cursorLine) {
        this._cursorLine = line;
        this._refreshGutter();
      }
    }

    /* ══════════════════════════════════════════════════════
       AI SUGGESTIONS  (powered by Gemini via worker)
    ══════════════════════════════════════════════════════ */
    _scheduleAI() {
      clearTimeout(this._aiTimer);
      if (this._aiAbort) this._aiAbort.abort();
      this._aiTimer = setTimeout(() => this._fetchSuggestion(), 680);
    }

    async _fetchSuggestion() {
      if (!this._aiOn) return;

      const ta = this._q('#xce-ta');
      if (!ta) return;

      const pos    = ta.selectionStart;
      const before = this._code.slice(Math.max(0, pos - 1500), pos);
      const after  = this._code.slice(pos, pos + 300);

      // Skip if cursor is mid-word
      if (after && /^\w/.test(after)) return;
      if (before.trim().length < 2)   return;

      this._aiAbort = new AbortController();
      this._setThinking(true);

      try {
        const prompt = [
          `You are an expert ${this._lang} code completion engine.`,
          `Complete the code exactly where the cursor marker <|> appears.`,
          `Rules:`,
          `- Return ONLY the raw completion text. No markdown. No code fences. No explanation.`,
          `- Keep it 1–4 lines maximum.`,
          `- Be syntactically correct and continue naturally.`,
          `- Do NOT repeat anything already written before the cursor.`,
          `- If the current statement is complete, start a new logical line with correct indentation.`,
          `\nCode (${this._lang}):\n${before}<|>${after}`
        ].join('\n');

        const res = await fetch(AI_WORKER, {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          signal:  this._aiAbort.signal,
          body:    JSON.stringify({
            contents: [{
              parts: [{ text: prompt }]
            }]
          })
        });

        if (!res.ok) return;

        const data = await res.json();

        // Parse Gemini response format
        const text = (
          data?.candidates?.[0]?.content?.parts?.[0]?.text ||
          data?.candidates?.[0]?.output ||
          data?.text ||
          data?.response ||
          ''
        ).trim();

        // Strip accidental code fences
        const clean = text
          .replace(/^```[\w]*\n?/, '')
          .replace(/\n?```$/, '')
          .trim();

        if (clean && clean.length > 0 && clean.length < 400) {
          this._suggestion = clean.split('\n').slice(0, 5).join('\n');
          this._suggestPos = pos;
          this._refreshHL();
          const ad = this._q('#xce-ad');
          if (ad) ad.classList.add('on');
        }
      } catch (e) {
        // AbortError or network — silent
      } finally {
        this._setThinking(false);
      }
    }

    _clearSuggestion() {
      if (!this._suggestion) return;
      this._suggestion = '';
      this._suggestPos  = 0;
      clearTimeout(this._aiTimer);
      this._refreshHL();
      const ad = this._q('#xce-ad');
      if (ad) ad.classList.remove('on');
    }

    _acceptSuggestion() {
      if (!this._suggestion) return;
      const ta = this._q('#xce-ta');
      if (!ta) return;
      const pos     = ta.selectionStart;
      const newCode = ta.value.slice(0, pos) + this._suggestion + ta.value.slice(pos);
      const newPos  = pos + this._suggestion.length;
      this._code = newCode;
      ta.value   = newCode;
      ta.selectionStart = ta.selectionEnd = newPos;
      this._clearSuggestion();
      this._refreshHL();
      this._refreshGutter();
      this._emit('change', this._code);
      if (this._cfg.onChange) this._cfg.onChange(this._code);
    }

    _setThinking(on) {
      const tk = this._q('#xce-tk');
      if (tk) tk.classList.toggle('on', on);
    }

    /* ══════════════════════════════════════════════════════
       RUN CODE
    ══════════════════════════════════════════════════════ */
    _run() {
      this._emit('run', this._code);
      if (this._cfg.onRun) this._cfg.onRun(this._code);
      if (this._viewerMode === 'page')    this._runPage();
      if (this._viewerMode === 'console') this._runConsole();
    }

    _runPage() {
      const iframe = this._q('#xce-if');
      if (!iframe) return;

      let src = this._code;
      const lang = this._lang.toLowerCase();

      if (lang === 'javascript' || lang === 'typescript') {
        src = `<!DOCTYPE html><html><head><meta charset="UTF-8">
<style>body{margin:0;padding:10px;font-family:system-ui,sans-serif;font-size:14px;}</style>
</head><body>
<script>
window.onerror=function(m,s,l){
  document.body.innerHTML='<pre style="color:#f44;padding:8px;white-space:pre-wrap">'+m+' (line '+l+')</pre>';
  return true;
};
${this._code}
<\/script></body></html>`;
      } else if (lang === 'css' || lang === 'scss') {
        src = `<!DOCTYPE html><html><head><meta charset="UTF-8">
<style>${this._code}</style></head>
<body>
  <h1>Heading</h1><p>Paragraph</p>
  <button>Button</button>
  <div class="box" style="width:100px;height:60px;margin:8px 0;background:#ccc">Box</div>
  <ul><li>Item one</li><li>Item two</li></ul>
</body></html>`;
      }

      iframe.srcdoc = src;
    }

    _runConsole() {
      this._consoleLogs = [];
      const vb = this._q('#xce-vb');
      if (vb) vb.innerHTML = this._buildViewerContent();
      const con = this._q('#xce-con');
      if (!con) return;
      con.innerHTML = '';

      const addLine = (text, type) => {
        const v = typeof text === 'object'
          ? (() => { try { return JSON.stringify(text, null, 2); } catch { return String(text); } })()
          : String(text);
        this._consoleLogs.push({ v, t: type });
        const d = document.createElement('div');
        d.className = 'xce-con-line ' + type;
        d.innerHTML = '<span class="xce-con-prompt">›</span>' + esc(v);
        con.appendChild(d);
        con.scrollTop = con.scrollHeight;
      };

      // Intercept console
      const origLog   = console.log;
      const origWarn  = console.warn;
      const origError = console.error;
      const origInfo  = console.info;

      console.log   = (...a) => { addLine(a.map(x=>typeof x==='object'?JSON.stringify(x,null,2):String(x)).join(' '),'log');   origLog(...a);   };
      console.warn  = (...a) => { addLine(a.map(String).join(' '),'warn');  origWarn(...a);  };
      console.error = (...a) => { addLine(a.map(String).join(' '),'error'); origError(...a); };
      console.info  = (...a) => { addLine(a.map(String).join(' '),'info');  origInfo(...a);  };

      try {
        const result = new Function(this._code)(); // eslint-disable-line no-new-func
        if (result !== undefined) addLine('← ' + JSON.stringify(result), 'info');
      } catch (err) {
        addLine(err.message, 'error');
      } finally {
        console.log   = origLog;
        console.warn  = origWarn;
        console.error = origError;
        console.info  = origInfo;
      }

      if (this._consoleLogs.length === 0) {
        const d = document.createElement('div');
        d.className = 'xce-con-empty';
        d.textContent = 'No output.';
        con.appendChild(d);
      }
    }

    /* ══════════════════════════════════════════════════════
       PUBLIC API
    ══════════════════════════════════════════════════════ */

    /** @returns {string} current code */
    getValue()  { return this._code; }

    /** @param {string} code */
    setValue(code) {
      this._code = String(code);
      const ta = this._q('#xce-ta');
      if (ta) ta.value = this._code;
      this._clearSuggestion();
      this._refreshHL();
      this._refreshGutter();
    }

    /** @returns {string} */
    getLanguage() { return this._lang; }

    /** @param {string} lang */
    setLanguage(lang) {
      this._lang = lang;
      const lb = this._q('#xce-lb');
      if (lb) lb.textContent = lang;
      this._q('#xce-lm') && this._q('#xce-lm').querySelectorAll('.xce-lang-opt').forEach(o =>
        o.classList.toggle('selected', o.dataset.lang === lang));
      this._clearSuggestion();
      this._refreshHL();
    }

    /** @returns {string} 'console' | 'page' | 'none' */
    getViewerMode() { return this._viewerMode; }

    /** @param {string} mode */
    setViewerMode(mode) {
      this._viewerMode = mode;
      this._build();
    }

    /** Trigger run programmatically */
    run() { this._run(); }

    /** Focus the editor */
    focus() {
      const ta = this._q('#xce-ta');
      if (ta) ta.focus();
    }

    /**
     * Append a line to the console viewer
     * @param {*}      text
     * @param {string} type  'log'|'warn'|'error'|'info'
     */
    log(text, type = 'log') {
      if (this._viewerMode !== 'console') return;
      const con = this._q('#xce-con');
      if (!con) return;
      const v = String(text);
      this._consoleLogs.push({ v, t: type });
      const d = document.createElement('div');
      d.className = 'xce-con-line ' + type;
      d.innerHTML = '<span class="xce-con-prompt">›</span>' + esc(v);
      const empty = con.querySelector('.xce-con-empty');
      if (empty) empty.remove();
      con.appendChild(d);
      con.scrollTop = con.scrollHeight;
    }

    /**
     * Override CSS tokens at runtime
     * @param {Object} tokens  e.g. { 'accent': '#f00', 'bg': '#111' }
     */
    setTheme(tokens = {}) {
      for (const [k, v] of Object.entries(tokens)) {
        this._root.style.setProperty('--xce-' + k, v);
      }
    }

    /**
     * Subscribe to events
     * @param {'change'|'run'} event
     * @param {Function} cb
     */
    on(event, cb) {
      if (!this._events[event]) this._events[event] = [];
      this._events[event].push(cb);
      return this;
    }

    /** Unsubscribe */
    off(event, cb) {
      if (this._events[event])
        this._events[event] = this._events[event].filter(f => f !== cb);
      return this;
    }

    _emit(event, data) {
      (this._events[event] || []).forEach(cb => { try { cb(data); } catch (_) {} });
    }

    /** Destroy the editor instance */
    destroy() {
      clearTimeout(this._aiTimer);
      if (this._aiAbort) this._aiAbort.abort();
      this._root.innerHTML = '';
      this._root.classList.remove('xce-root');
    }
  }

  /* ── Expose globally ── */
  global.XCodeEditor = XCodeEditor;

})(typeof window !== 'undefined' ? window : this);