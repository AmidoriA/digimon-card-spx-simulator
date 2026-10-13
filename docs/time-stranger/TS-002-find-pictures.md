# TS-002: Find each card's picture

| | |
|---|---|
| Trello | https://trello.com/c/k5VoEA4W |
| Phase | 0 Groundwork |
| Feature branch | `time-stranger` (all 45 new cards complete before merging to `main`) |
| Depends on | TS-001, TS-004 |

## Goal

Give every Time Stranger card a "New card art" picture from the internet, from the same two sources the game's cards already use.

## Context

- `tools/build_new_art.py`: `CARD_URL` (Digimon Card Game official card list, `https://world.digimoncard.com/images/cardlist/card/<NO>.png`, 430x600) and `REF_URL` (Digimon Reference Book, `https://digimon.net/cimages/digimon/<slug>.jpg`).
- `tools/new_art.json`: how a card and its square crop are written; crops are centred on the Digimon and keep the "SAMPLE" mark out.
- README "Not from the game code" → "New card art": the rules used for the game's cards.

## Steps

1. For each row of roster.md, look up the Digimon on the official card list and pick one card whose illustration shows it whole and clearly (prefer the plain version of the Digimon over alternate-art or partner-form cards).
2. Download it and choose a square `[x, y, size]` as `new_art.json` does; check by eye.
3. Where the card game has no such card, use the Reference Book picture and its slug.
4. Where the square takes in part of the card's own print (cost circle, rules text, the SAMPLE mark) or cuts the Digimon off, clean or extend it through the owner's ComfyUI (TS-004) instead of moving the Digimon off centre. Write each edit in the row: what was removed or added, and the workflow.
5. Write the card number and crop, or the slug, into roster.md.

## Acceptance criteria

- [x] Every row has `card` + `crop`, or `ref`.
- [x] Every crop was looked at: Digimon centred, no SAMPLE mark inside.
- [x] Every picture edited through ComfyUI is marked in roster.md with what was changed; the edited pictures are kept beside the downloads so a rebuild repeats them.
- [x] Pictures are cached under `extracted/newart` like the game cards' (not in git).

## Out of scope

- The tool change that builds them (TS-003).

## Questions for the owner

- None.

## Log

<!-- Date, what was done, what was found and where (addresses, URLs, commits). -->

- 2026-10-13: Selected and inspected all 45 pictures after TS-001: 44 regular official card illustrations and `ref crescemon`, recorded in roster.md and `tools/time_stranger_art.json`. The Crescemon fallback reflects source suitability: rules hide the legs, and attempted inpainting was rejected for changing anatomy.
- 2026-10-13: Prepared 44 ComfyUI restorations using the installed `512-inpainting-ema.safetensors` checkpoint and stored `ts002-inpaint.json` graph. Every recipe (source, crop, mask geometry, prompt, seed, model/settings and output path) is in `tools/new_art_edits.json`. `tools/prepare_time_stranger_art.py` downloads, caches/replays and makes review sheets without building game assets.
- 2026-10-13: Downloaded/edited files remain ignored under `extracted/newart`; 45 sources and 44 edit hashes validated, and all unmasked pixels compared identical. Corrected incomplete multiline text masks and a generated mark on Lunamon, then inspected the final selections. Coronamon repeated with separate uploads gave identical decoded pixels (hash in roster.md); the owner accepted its before/after. Original game cards and custom card records were not rebuilt by this ticket.

### 2026-10-13 — owner correction: Keramon replaces Agumon (Black)

Current slot 329 is Keramon, Darkness/R, base Tsukaimon (135), placeholder model 428.
All its numbers/effects are copied from Tsukaimon. Local char_KERAMON → chr626 is
present in both model tables; Phase 2 converts all nine Darkness models. The old
black Agumon exception is superseded. Official EX1-044 crop [80,105,320] needs no
restoration and is shared by both art modes. Offset 20000 is retired; the four other
published offsets remain stable. [Full evidence and current roster](roster.md).
