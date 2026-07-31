// Hover any element -> Edit / Delete / Move buttons. Changes preview live in
// the page and stack up in a log; Done copies the log for Claude to apply to
// the source. Runs as an extension content script, or pasted into the console.
(async () => {
  if (window.__picker) return window.__picker.stop();

  // Accent colour from the extension's options page; the catch covers running
  // pasted into a plain console, where there is no chrome.storage.
  const DEFAULT = '#00f0ff';
  const c = await new Promise((res) => {
    try { chrome.storage.sync.get({ color: DEFAULT }, (v) => res(v.color || DEFAULT)); }
    catch { res(DEFAULT); }
  });

  const sel = (el) => {
    // ponytail: nth-of-type path, no :nth-child math or shortest-selector search.
    // Round-trip check below catches the cases it gets wrong.
    const parts = [];
    for (let n = el; n && n.nodeType === 1 && n !== document.body; n = n.parentElement) {
      if (n.id) { parts.unshift('#' + CSS.escape(n.id)); break; }
      const tag = n.tagName.toLowerCase();
      const sibs = [...n.parentElement.children].filter((c) => c.tagName === n.tagName);
      parts.unshift(sibs.length > 1 ? `${tag}:nth-of-type(${sibs.indexOf(n) + 1})` : tag);
    }
    const s = parts.join(' > ');
    return document.querySelector(s) === el ? s : null; // null => unreliable, say so in the log
  };
  const desc = (el) => `\`${sel(el) || el.tagName.toLowerCase() + ' (no stable selector)'}\`` +
    ` — ${(el.innerText || '').trim().slice(0, 60).replace(/\s+/g, ' ') || '(no text)'}`;

  const log = [];
  const ui = document.createElement('div');
  ui.id = '__pk';
  ui.style.setProperty('--c', c); // one knob: everything below reads from it
  ui.innerHTML = `<style>
    #__pk{position:fixed;inset:0;pointer-events:none;z-index:2147483647;font:13px system-ui}
    #__pk *{pointer-events:auto;box-sizing:border-box}
    #__pk .box{position:fixed;border:1.5px solid var(--c);border-radius:3px;pointer-events:none;display:none;
      animation:pkpulse 1.6s ease-in-out infinite}
    @keyframes pkpulse{
      0%,100%{box-shadow:0 0 6px var(--c),0 0 16px var(--c),inset 0 0 8px var(--c);opacity:.8}
      50%{box-shadow:0 0 12px var(--c),0 0 34px var(--c),inset 0 0 14px var(--c);opacity:1}}
    #__pk .tb{position:fixed;display:none;gap:2px;background:#080b10;border:1px solid var(--c);border-radius:6px;
      padding:3px;box-shadow:0 0 14px var(--c)}
    #__pk .tb button{background:none;border:0;color:var(--c);font:13px system-ui;padding:3px 8px;cursor:pointer;
      border-radius:4px;text-shadow:0 0 6px var(--c)}
    #__pk .tb button:hover{background:var(--c);color:#000;text-shadow:none}
    #__pk .bar{position:fixed;inset:auto 0 0 0;background:#080b10;color:var(--c);padding:8px 14px;text-align:center;
      border-top:1px solid var(--c);box-shadow:0 0 20px var(--c)}
    #__pk .bar button{margin-left:10px;background:var(--c);border:0;color:#000;padding:4px 12px;border-radius:4px;
      cursor:pointer;font:13px system-ui;box-shadow:0 0 10px var(--c)}
  </style>
  <div class="box"></div>
  <div class="tb"><button data-a="edit">✎ Edit</button><button data-a="del">🗑 Delete</button><button data-a="move">✥ Move</button></div>
  <div class="bar"><span class="n">Hover an element</span><button data-a="done">Done</button></div>`;
  document.body.append(ui);
  const box = ui.querySelector('.box'), tb = ui.querySelector('.tb'), n = ui.querySelector('.n');
  const editBtn = ui.querySelector('[data-a="edit"]');
  // Direct text nodes only: a wrapper whose text all lives in children is not
  // a text element, and making it editable would put the whole subtree in play.
  const hasText = (el) => [...el.childNodes].some((c) => c.nodeType === 3 && c.textContent.trim());

  let cur, moving;
  const say = (m) => (n.textContent = m || `${log.length} change${log.length === 1 ? '' : 's'}`);

  const show = (el) => {
    cur = el;
    const r = el.getBoundingClientRect();
    Object.assign(box.style, { display: 'block', top: `${r.top}px`, left: `${r.left}px`, width: `${r.width}px`, height: `${r.height}px` });
    // Overlaps the element's edge by 2px: no dead gap to cross on the way to
    // the buttons. Below the element when there is no room above it.
    Object.assign(tb.style, { display: 'flex', top: `${r.top > 32 ? r.top - 26 : r.bottom - 2}px`, left: `${Math.max(2, r.left)}px` });
    editBtn.style.display = hasText(el) ? '' : 'none';
  };
  const hide = () => { clearTimeout(t); box.style.display = 'none'; tb.style.display = 'none'; cur = null; };

  let t;
  const over = (e) => {
    // On the toolbar (or mid-edit) the current target must stick, including
    // cancelling a switch already queued by the elements crossed to get here.
    if (ui.contains(e.target) || e.target.isContentEditable || e.target === cur) return clearTimeout(t);
    clearTimeout(t);
    // First hover is instant; replacing a target waits, so passing over
    // something on the way to the buttons does not steal the selection.
    if (!cur) return show(e.target);
    const el = e.target;
    t = setTimeout(() => show(el), 300);
  };

  const click = (e) => {
    const act = e.target.closest?.('#__pk [data-a]')?.dataset.a;
    if (act) return e.preventDefault(), e.stopPropagation(), run(act);
    if (moving) { // second click picks the destination
      e.preventDefault(); e.stopPropagation();
      if (ui.contains(e.target) || moving.contains(e.target)) return;
      const before = desc(e.target);
      e.target.before(moving);
      log.push(`- **Move** ${desc(moving)} → to just before ${before}`);
      moving.style.outline = ''; moving = null; say();
      addEventListener('mouseover', over, true);
    }
  };

  const run = (a) => {
    const el = cur;
    if (!el) return;
    if (a === 'done') return done();
    if (a === 'del') { log.push(`- **Delete** ${desc(el)}`); el.remove(); hide(); return say(); }
    if (a === 'move') {
      moving = el; el.style.outline = `2px dashed ${c}`; hide();
      removeEventListener('mouseover', over, true); // freeze highlight while aiming
      return say('Now click where it should go');
    }
    // edit: contentEditable is the native editor — no custom input, no dialog.
    const was = (el.innerText || '').trim();
    const prevOutline = el.style.outline;
    hide();
    el.contentEditable = 'true';
    el.style.outline = `2px solid ${c}`; // on the element itself, so it tracks reflow as text grows
    el.focus();
    getSelection().selectAllChildren(el); // typing replaces the old text; click once to place a caret instead
    el.addEventListener('blur', () => {
      el.contentEditable = 'false';
      el.style.outline = prevOutline;
      const now = (el.innerText || '').trim();
      if (now !== was) log.push(`- **Edit** ${desc(el)}\n  - from: \`${was.slice(0, 200)}\`\n  - to: \`${now.slice(0, 200)}\``);
      say();
    }, { once: true });
    say('Type to replace, then click away');
  };

  const done = async () => {
    stop();
    if (!log.length) return alert('No changes to copy.');
    const out = ['## Change request', `**Page:** ${location.href}`, '', ...log].join('\n');
    await navigator.clipboard.writeText(out).then(
      () => alert(`Copied ${log.length} change(s). Run /pick in Claude Code.`),
      () => (console.log(out), alert('Clipboard blocked (insecure page) — copy it from the console.')));
  };

  const key = (e) => e.key === 'Escape' && (moving ? (moving.style.outline = '', moving = null, say(), addEventListener('mouseover', over, true)) : stop());
  const stop = () => {
    clearTimeout(t);
    ui.remove();
    removeEventListener('mouseover', over, true);
    removeEventListener('click', click, true);
    removeEventListener('keydown', key, true);
    delete window.__picker;
  };

  addEventListener('mouseover', over, true);
  addEventListener('click', click, true);
  addEventListener('keydown', key, true);
  window.__picker = { stop, sel, log };
})();

// Check: sel() round-trips on tricky DOM. Paste in the console after loading.
// const d=document.createElement('div');d.innerHTML='<ul><li>a<li>b<li><b id="x y">c';document.body.append(d);
// console.assert(document.querySelector(__picker.sel(d.querySelector('li:nth-of-type(2)')))===d.querySelector('li:nth-of-type(2)'));
// console.assert(__picker.sel(d.querySelector('b'))==='#x\\ y'); d.remove();
