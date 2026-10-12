---
name: check-in-browser
description: Look at a change to the site in the browser, including single frames of the 3D battle and a whole turn of the card game driven from script. Use before calling any change to web/ done.
---

# Checking the site in the browser

## Serving it

The site must come over HTTP; opened as a file it has no sound and no 3D battle.

```bash
python -m http.server 8765 --bind 127.0.0.1 --directory web
```

`serve.bat` does the same for the owner and moves to the next free port. `.claude/launch.json`
names the server `card-battle` for the preview tool. The owner often has it running already
on 8765; open that page instead of starting a second one.

## Old scripts

This server sends no cache headers and the browser keeps scripts, styles and assets. After
an edit a plain reload can run a new `ui.js` against an old `engine.js`. Before you believe
an error, fetch the changed files again and reload:

```js
for (const s of document.scripts) if (s.src) await fetch(s.src, { cache: 'reload' });
await fetch('css/style.css', { cache: 'reload' });
location.reload();
```

A changed asset (a model, a texture) needs the same for its own address.

## Driving a match from script

- `DDCB_UI.state` is the page's state: `.G` the match (`.players[p]` with `hand`, `deck`,
  `offline`, `dp`, `active`), `.step` what the page is waiting for, `.resolve` set while it
  waits, `.arena`.
- `DDCB_UI.act(x)` answers the wait: `{ t: 'card', i }` a hand card, `{ t: 'ok' }` at the
  end of preparation, `{ t: 'skip' }`, `{ t: 'attack', k }`, `{ t: 'changeAll' }`.
- The yes/no question is `#ask` with `#askYes` and `#askNo`.
- `DDCB` is the rules engine (`DDCB.card(id)`, `DDCB.top(player)`, `DDCB.evoMoves(G, 0)`).
  To reach a situation, set the hand or the DP Slot on `state.G` while the page waits, then
  act. Say in your report that the position was set up by hand.
- To time what happens, sample the state on an interval and note each change with its time.
  That is how "the card changes only after the effect" was shown.

## The 3D battle

- `DDCB_B3D.attack(opts)` plays one strike without a match (the options are listed above it
  in `web/js/battle3d.js`). With `dry: true` it runs to its end at once without drawing and
  gives back counts: use that to run every Digimon's attacks and catch scripts that hang.
- `DDCB_B3D.paused = true` freezes the picture. A screenshot is taken some time after you
  ask for it, so pause on the frame you want first; `DDCB_B3D._debug()` gives the running
  scene with its frame number and overlays.
- `DDCB_B3D.arenaShot(arena, yaw, pitch, focal)` draws an arena alone and gives the
  picture back; `tools/arena_previews.py` uses it.
- `DDCB_FX.busy()` tells whether a board effect is still playing.

## What to report

What you looked at and saw, with the numbers, and what you did not get to see (a screenshot
that failed, a case you could not reach). Run the node tests as well; the browser does not
replace them.
