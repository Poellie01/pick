---
name: pick
description: >
  Change a website by clicking the element instead of describing it. The user
  hovers any element in their own browser for Edit / Delete / Move buttons;
  this skill applies those changes to the source. Use when the user says
  /pick, "I picked an element", "picked it", "check the clipboard", or points
  at a change they made by clicking in the UI. Two commands — "/pick init"
  adds the picker to the current project with no browser install, and "/pick"
  applies the changes they just made. Also covers the optional browser
  extension for pages they do not control.
---

# Pick

The user edits the page directly in their own browser — hover any element,
press Edit / Delete / Move — then Done copies the list of changes. The page
edits are only a preview; this skill applies them to the source.

## Commands

Branch on the argument before doing anything else:

| Invocation | Do |
|---|---|
| `/pick init` | **Init** — add the picker to this project. |
| `/pick`, or anything else | **Apply** — read the clipboard and make the changes. |

Treat "set it up here" or "add pick to this project" as `init` even without
the word. If `/pick` runs in a project that was never initialised and the
clipboard holds no pick, offer `init` rather than only reporting an empty
clipboard.

## Apply

1. Read the clipboard — Windows `Get-Clipboard -Raw`, macOS `pbpaste`, Linux
   `wl-paste` or `xclip -o -selection clipboard`.
2. If it does not start with `## Change request`, nothing has been picked yet
   or something else was copied since. Say so, offer `init`, and stop.
3. The payload is a list of `**Edit**` / `**Delete**` / `**Move**` lines, each
   naming a selector and the element's text. Apply every one. Locate each in
   the codebase, in order of what actually works:
   - grep the quoted text — most direct hit, works in any framework
   - grep distinctive class names or the `id` from the selector
   - the **Page** URL maps to a route/file only for static sites; do not
     assume it for React/Vue/Next.
4. Apply to source, not to rendered output: text that came from a variable,
   loop, or CMS field must change at its origin. If an Edit hits one iteration
   of a list, change that data item — never unroll the loop.
5. Report file:line per change. Do not re-verify in the browser unless asked —
   their preview already shows it, and a reload discards it.

The whole batch is one clipboard payload, so all changes arrive together.

## Init

`/pick init` — add the picker to a site the user controls and runs locally.
Installs nothing in the browser. Do this yourself:

1. Copy this skill's `picker.js` into wherever the project serves static files
   from — `public/`, `static/`, `assets/`, or beside `index.html` — as
   `pick.js`. Read the project to find it; do not guess.
2. Add this to the dev HTML entry (the root `index.html`, the app template,
   the layout component — again, read the project):

       <!-- pick: dev only -->
       <script>addEventListener('keydown',e=>{if(e.altKey&&e.shiftKey&&e.code==='KeyK'){const s=document.createElement('script');s.src='/pick.js';document.body.append(s);s.onload=()=>s.remove()}})</script>

   Fix the `src` to match where step 1 actually put the file.
3. **Gate it to development.** Whatever the framework's idiom is — a
   `NODE_ENV`/`import.meta.env.DEV` conditional, a dev-only template block,
   a partial that production does not include. Never ship it to production;
   it lets any visitor rewrite the page. Say which gate was used.
4. Tell them to reload and press **Alt+Shift+K**.

Each press re-fetches `pick.js`, which re-runs the picker and toggles it —
which is why `picker.js` stays a bare IIFE with no top-level bindings. Do not
"tidy" that into a named export.

Re-running `init` must be harmless. If the project already has `pick.js` and
the loader, do not add a second copy — instead diff the project's `pick.js`
against this skill's `picker.js`. Identical: say it is already set up and
stop. Different: the project is on an older picker, so offer to overwrite
that one file. The loader tag never needs changing.

The accent colour in an initialised project comes from `DEFAULT` at the top
of its `pick.js` — there is no options page without the extension. Editing
that constant is the whole mechanism; do not build a settings file for it.

## The extension — for pages the user does not control

This skill directory *is* an unpacked Chrome/Edge extension (`manifest.json`,
`sw.js`, `picker.js`). One click to load, then the picker is on every tab
forever via the toolbar button or **Alt+Shift+K**. Suggest it for production
pages, other people's sites, or anything with no local dev server.

Give them the absolute path of *this skill's own directory* — it differs per
install (global vs project, Windows vs macOS vs Linux), so resolve it rather
than quoting a path from this file.

**Chrome / Edge / Brave / Arc** — permanent, survives restarts:

1. `chrome://extensions` (or `edge://extensions`) → **Developer mode** on.
2. **Load unpacked** → select this skill's directory.

**Firefox** — `about:debugging#/runtime/this-firefox` → **Load Temporary
Add-on** → select `manifest.json` in that directory. Tell them the catch up
front: Firefox drops temporary add-ons on restart, so this is a per-session
load unless the extension is signed through addons.mozilla.org.

The manifest carries both `service_worker` (Chrome) and `scripts` (Firefox)
background keys. Chrome warns `'background.scripts' requires manifest version
of 2 or lower` and loads fine. **This warning is correct and expected** —
specifying both is Mozilla's documented cross-browser recipe, and Firefox has
never shipped background service workers. Do not "fix" it by dropping a key;
that silently breaks one of the two browsers. `strict_min_version` is 121.0
because earlier Firefox refused to start the background page at all when
`service_worker` was present.

Chrome wins any shortcut conflict and silently leaves the command unbound —
`chrome://extensions/shortcuts` is where the user reassigns it. The toolbar
button always works, so never debug a shortcut; point them there.

Edits to `picker.js` are live on next press. Edits to `manifest.json` or
`sw.js` need the reload arrow on the card at `chrome://extensions`.

The accent colour lives in the extension's options (**Details → Extension
options**, or the ⋮ menu on the toolbar icon). It is one `chrome.storage.sync`
key, `color`, read by `picker.js` at launch — no reload needed, just press the
picker again.

ponytail: the "Load unpacked" click cannot be automated, by design. Snippets
live in a leveldb store, Bookmarks is checksum-guarded, and force-install
needs admin registry policy plus a hosted extension. Do not build a
profile-poking installer — it breaks on Chrome updates and risks their real
bookmarks. One click, once, is the answer.

If the extension itself misbehaves, pasting `picker.js` into the page's
DevTools console runs the same code with the extension out of the picture —
useful for telling a picker bug apart from an extension bug.

No server, no build step, no dev-dependency. Works on any stack because it
reads the rendered DOM.

## Notes

- The picker reads the DOM, so it reports rendered output, not source. For
  component frameworks the selector is a hint, not a path — grep the text.
- `(no stable selector)` in a line means the DOM shifted under it — identify
  that element by its text instead.
- Page edits vanish on reload. That is fine: the clipboard log is the record,
  and this skill is what makes them permanent.
