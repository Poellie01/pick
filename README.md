# Pick ![logo](icon32.png)

**Change a website by clicking the thing you want changed.**

Instead of typing *"the subtitle under the heading in the third pricing card"*,
you hover it in your own browser, press a button, and your coding agent makes
the change in the source.

```
hover an element  →  ✎ Edit / 🗑 Delete / ✥ Move  →  Done  →  /pick
```

| Command | |
|---|---|
| `/pick init` | Add the picker to this project. Once, per project. |
| `/pick` | Apply the changes you just made in the browser. |

The page updates instantly as a preview. Nothing is written to disk until you
run `/pick` and the agent applies the batch to your actual source files.

![The Pick toolbar over a hovered element, with one change already logged](demo.png)

## Install

**1. The skill**

```
npx skills add Poellie01/pick -g
```

**2. Add it to your project**

```
/pick init
```

Your agent drops `pick.js` into the project and adds a dev-only script tag,
gated so it never reaches production. Reload the page, press **Alt+Shift+K**.

Nothing to install in the browser. Works with whatever dev server you already
run — no build step, no dependency, no extension.

## The three buttons

| | |
|---|---|
| **✎ Edit** | Text becomes editable in place. Existing text is selected, so typing replaces it; click once to place a caret instead. Only appears on elements that actually hold text. |
| **🗑 Delete** | Removes the element. |
| **✥ Move** | Press and hold, drag to the destination, release. A glowing line shows exactly where it will land — above or below the element you are over. |

Esc cancels. **Done** copies the batch to your clipboard.

## What gets sent

A markdown list — one line per change, each naming a CSS selector and the
element's visible text, plus the page URL. Nothing else leaves the page. No
server, no telemetry, no network calls at all.

## Options

The accent colour is cyan by default.

- **In a project** — change `DEFAULT` at the top of your `pick.js`.

## Updating

`npx skills update` refreshes the skill. A project's `pick.js` is a copy, so
it stays on the version you installed it with — ask your agent to refresh it
when you want the newer picker.

## Requires

An agent that supports skills, e.g. Claude Code. Any modern browser: the
project setup is plain JavaScript. 

## License

GPL-3.0 — see [LICENSE](LICENSE).
