# Pick

**Change a website by clicking the thing you want changed.**

Instead of typing *"the subtitle under the heading in the third pricing card"*,
you hover it in your own browser, press a button, and your coding agent makes
the change in the source.

```
hover an element  →  ✎ Edit / 🗑 Delete / ✥ Move  →  Done  →  /pick
```

The page updates instantly as a preview. Nothing is written to disk until you
run `/pick` and the agent applies the batch to your actual source files.

## Install

Two parts: the skill (so your agent knows what to do with a pick) and the
extension (so you can pick).

**1. The skill**

```
npx skills add <owner>/<repo>@pick -g
```

**2. The extension** — one click, once. The skill folder *is* the extension.

- **Chrome / Edge / Brave / Arc** — `chrome://extensions` → enable
  **Developer mode** → **Load unpacked** → select the skill's folder.
  Stays installed across restarts.
- **Firefox** — `about:debugging#/runtime/this-firefox` → **Load Temporary
  Add-on** → select `manifest.json` in that folder. Firefox 121+.
  Heads up: Firefox drops temporary add-ons on restart, so this is a
  per-session load unless the extension is signed through addons.mozilla.org.

Ask your agent for the folder path — it differs between a global and a
project install.

Then press the toolbar button or **Alt+Shift+K** on any page. If that shortcut
is taken, `chrome://extensions/shortcuts` lets you pick another; the toolbar
button always works.

## The three buttons

| | |
|---|---|
| **✎ Edit** | Text becomes editable in place. Existing text is selected, so typing replaces it; click once to place a caret instead. Only appears on elements that actually hold text. |
| **🗑 Delete** | Removes the element. |
| **✥ Move** | Click the element, then click where it should go. |

Esc cancels. **Done** copies the batch to your clipboard.

## What gets sent

A markdown list — one line per change, each naming a CSS selector and the
element's visible text, plus the page URL. Nothing else leaves the page. No
server, no telemetry, no network calls at all.

## Options

Extension **Details → Extension options** sets the accent colour, with a
native colour picker and six presets. Saves on change; the next launch uses it.

## Limitations

Worth knowing before you install, not after:

- **It reads the DOM, not your source.** That is why it works on any stack
  with zero project config — and also why it hands the agent text and
  selectors to grep rather than an exact `file:line`. Tools like LocatorJS or
  react-dev-inspector give you the exact file, at the cost of a build plugin
  and framework lock-in.
- **Rendered output, not origin.** If an element's text comes from a loop or
  a CMS field, the agent has to trace it back to the data. It is told to do
  that, but a distinctive string helps it land in the right place.
- **Page edits vanish on reload.** They are a preview. The clipboard log is
  the record.
- **One batch at a time** — the clipboard holds the most recent Done.

## Requires

An agent that supports skills, e.g. Claude Code. A Chromium browser or
Firefox 121+.

## License

MIT
