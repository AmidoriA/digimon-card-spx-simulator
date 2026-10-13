# TS-003: Let `art.new` take a card-list or Reference Book picture

| | |
|---|---|
| Trello | https://trello.com/c/gCoH4rVv |
| Phase | 0 Groundwork |
| Depends on | none |

## Goal

A custom card's "New card art" can come from the card list or the Reference Book, not only from a file the owner put in `tools/custom/`.

## Context

- `tools/build_custom.py` `do_art`: today reads `art.new.file` + `crop`.
- `tools/build_new_art.py` `fetch` and `source`: download once, verify, crop.
- `tools/custom.py` docstring: the field list.

## Steps

1. In `do_art`, when `art.new` has `card` (+ `crop`) or `ref`, take the picture through `build_new_art.source(entry, os.path.join(ext, 'newart'))`; keep `file` as it is.
2. Document the two new forms in the `custom.py` docstring.
3. Add "Pictures from the internet" to `.claude/skills/create-card/SKILL.md`.
4. Rebuild BlackWarGreymon's art and compare.

## Acceptance criteria

- [ ] BlackWarGreymon's `art/301.webp`, `art2/301.webp` and `mini2/301.webp` are unchanged (byte for byte, or the same pixels if WebP encoding differs).
- [ ] A test entry with `card` and one with `ref` build (try it on a scratch card, do not commit it).
- [ ] README "Custom cards" says where custom pictures can come from.
- [ ] `python tools/check_paths.py` passes.

## Out of scope

- Choosing the pictures (TS-002).

## Questions for the owner

- None.

## Log

<!-- Date, what was done, what was found and where (addresses, URLs, commits). -->
