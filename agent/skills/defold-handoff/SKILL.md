---
name: defold-handoff
description: Figma as the source of truth for Defold GUI, driven through the Defold Handoff plugin and its MCP server (tools figma_*). Inspects frames, builds GUI nodes and templates, manages atlas sprites, exports .gui, .atlas and sprite PNG files and syncs them with the repository. Use for any change to the exported GUI files of a project that has handoff.json, or when the repository and Figma have to be compared.
---

# Defold Handoff

Figma holds the GUI, the repository holds its export.

```
change in Figma  ->  figma_export  ->  sync.py diff  ->  sync.py apply  ->  repository
```

## Hard rules

1. Never edit the exported files by hand: `.gui` under `gui`, sprites under `textures`, the `atlases` of `handoff.json`. Change Figma, then export.
2. Start and finish every session with a pull that reports `CLEAN`.
3. Never rebuild what already exists. Change the nodes that need changing.
4. A call that timed out may have been applied. Inspect before repeating it.
5. The project comes first: when it has its own skill or rules for the page, names and sprite groups, follow them. This skill is the mechanics.

Read `references/handoff.md` before building or editing nodes.

## Requirements

- The MCP server `defold-handoff-agent` gives the tools `figma_*`. The user keeps Figma open with the plugin Defold Handoff in Agent Mode. `figma_status` tells what is wrong: not connected, the plugin and the server from different releases, a port held by another agent session.
- `handoff.json` at the project root. The scripts and the server find it going up from the working directory.
- `python3`; `sprites.py` needs `pillow` and `numpy`.

`handoff.json`:

| Field | Meaning |
| --- | --- |
| `page` | the only Figma page `figma_run`, `figma_build`, the sprite tools and `figma_export` work on |
| `gui` | directories with exported `.gui` files |
| `textures` | directory with the sprite groups, one folder per group |
| `atlases` | `{name: path}` of the exported atlases |

`page`, `gui`, `textures` and `atlases` are required: the tools and the scripts refuse to work without them. The rest:

| Field | Meaning |
| --- | --- |
| `screen` | `[width, height]` of the screen, the size of a scene root; read by `gui2spec.py` |
| `fonts` | `{font: {family, style, size}}`: the Defold font name as registered in the Handoff project settings, its Figma face and the size the font is authored at; read by `figma_build` and `gui2spec.py` |
| `references` | `[{dirs, extensions, skip}]`: files where a sprite may be named by a quoted literal, read by `sprites.py usage` |
| `groups` | optional registry `{group: {prefix, canvas, dynamic, repeats, about}}` checked by `sprites.py check`; a project may keep its own keys there |

`dynamic` lists the prefixes a name gets from data: the rest of the name counts as a reference. `repeats` lists the groups whose pictures the group may repeat.

## Tools

| Tool | Does |
| --- | --- |
| `figma_status` | connection, versions, which `handoff.json` is in use |
| `figma_document` | pages, the current page, the Handoff project settings |
| `figma_find {query, root_id?}` | layers by a name substring |
| `figma_inspect {ids?, depth?}` | tree of a frame: geometry, text styles, matched `sprite` and `template`, `foreign` components, `imageSize` of an unmatched image, non-default node `data` |
| `figma_select {ids}` | selects layers and switches to their page |
| `figma_screenshot {id, scale?, path?}` | an image to look at; with `path` a PNG file, used to take a sprite out of a frame |
| `figma_run {code \| file, args?}` | code inside the plugin with `figma`, `L`, `PROJECT`, `ARGS`; return JSON, never a node |
| `figma_build {spec_file, parent_id}` | builds a node from a spec file |
| `figma_import_sprites {atlas, group, files}` | adds PNG files as sprites, creating the group when it is new |
| `figma_update_sprite {sprite, path}` | replaces the picture of `<atlas>/<name>` and keeps its instances in place |
| `figma_export {out_dir}` | exports every GUI root and atlas of the page into an empty directory |

What is exported is decided by plugin data, not by names: an atlas section is a section with `jumbo` in its `defoldSection` data, a GUI section is any other section that has `defoldSection` data, a root is a child of a GUI section. A section without that data is never exported: use one for drafts and artist input.

`L` inside `figma_run`:

| Call | Does |
| --- | --- |
| `L.roots()`, `L.atlases()`, `L.sections(isAtlas)`, `L.atlasSection(name)` | what the page exports |
| `L.getData(node, key)` | plugin data: `defoldGUINode`, `defoldSection`, `defoldAtlas` |
| `L.updateGUINode(node, data)`, `L.updateSection(section, data)`, `L.updateAtlas(atlas, data)` | the updates behind the fields of the plugin UI: the given fields change, the rest stays. The layer of a node follows: `id` renames it, `slice9` builds, rebuilds or removes its cells, `scale_factor` rescales it from its left top corner |
| `L.build(spec, parent)` | what `figma_build` calls; use it for a child written inline |
| `L.find(root, name)` | a node by its id, the slice9 placeholder when it has one |
| `L.center(node, x, y)`, `L.setFontSize(node, fontSize, [width, height])` | move, restyle a text |
| `L.renameNodes(root, renames, names)` | renames layers and node ids together |
| `L.moveSprites(section, {old: [group, name]})`, `L.sortAtlases(section)` | moves and renames sprites between groups |
| `L.importSprites(atlas, group, files)`, `L.updateSprite(sprite, image)` | what the sprite tools call, PNG as base64; use the tools |
| `L.section(parent, name, data?)` | finds or creates a section, with `defoldSection` data when given |

Scripts, run from the project with `python3 <this skill>/scripts/<script>`:

| Script | Does |
| --- | --- |
| `sync.py diff <dir>` | compares an export with the repository |
| `sync.py apply <dir> [drop]` | mirrors the export into the repository; refuses while the diff has `-` lines, `drop` after the user agreed to the loss |
| `gui2spec.py <gui> <spec file> [node]` | writes the spec of a repository `.gui` file or of one node, prints the root, the parent node and the templates it needs |
| `sprites.py groups` | groups with their atlas, count, prefix, canvas and typical content size |
| `sprites.py check` | atlas lists, textures of `.gui` nodes, duplicates, unused sprites; names, numbers and canvases of registered groups |
| `sprites.py dupes [png ...]` | atlas sprites that repeat each other; with paths the nearest atlas sprite of every PNG, regardless of scale and canvas, with a verdict |
| `sprites.py usage [sprite]` | where a sprite is referenced |
| `sprites.py crop <png> [sibling ...]` | cuts the stretchable band of a slice9 sprite to 4 lines, prints the new slice9 |
| `sprites.py pad <png> <w> <h>` | centers the content on a canvas |
| `sprites.py resize <png> <w> <h>` | scales a sprite |

`crop`, `pad` and `resize` change the file in place. Work on copies in a temporary directory.

## Pull and push

Pull: `figma_export {out_dir}` into a new directory, then `sync.py diff <dir>`.

| Line | Meaning |
| --- | --- |
| `CLEAN` | the export equals the repository |
| `+ path`, `+ node`, `+ images` | exists only in Figma |
| `~ ...` | differs; `~ images order` of an atlas is the order of its groups in the section, `~ node order` of a `.gui` file is the draw order |
| `- path`, `- node` | exists only in the repository and will be lost by a push |
| `BLOCKED` | the diff has `-` lines |

Push: `sync.py apply <dir>`. With `-` lines it refuses: carry them over to Figma, or `sync.py apply <dir> drop` when the user agreed to every loss. Then `sprites.py check`, which reads the repository, and a second pull that must be `CLEAN`.

### Preflight

1. `git status --short` over the exported paths. An uncommitted file there is not protected by git: tell the user before any push.
2. Pull.

A line at preflight has no known side: `~ position: 10 -> 20` reads both "moved in Figma" and "moved in the repository by hand". Stop, show the list and ask which side is right, item by item. Figma is right: push. The repository is right: carry it over. After a `CLEAN` preflight every line of a later pull is your own change.

`- node <template>/<child>` is a template override made in Defold. The export cannot hold one: the variation moves to the code or to a node of the parent.

## Sprites

1. Take it out of a frame: `figma_screenshot {id, scale, path}`. Use the source resolution, not the size on the frame: for an image `scale = imageSize / size` from `figma_inspect`.
2. `sprites.py dupes <png ...>`. `same picture`: the sprite exists, reuse it and scale the node. `look at both`: compare by eye.
3. `crop` when it will be stretched, `pad` and `resize` to the standard of its group.
4. `figma_import_sprites {atlas, group, files: {name: path}}`.

Replace a picture with `figma_update_sprite`. The returned `slice9` instances have their cells rebuilt with the old slices: when the picture needs other ones, `L.updateGUINode(node, {slice9: {x, y, z, w}})`. Look at the `manual` ones: the picture stretches to the old box.

## Nodes

- New: write the spec (`references/handoff.md`) to a file, `figma_build` into its section.
- From the repository: `gui2spec.py <gui> <spec file> [node]`, then `figma_build` into the section, or into the printed `parent` inside the printed `root` for a single node. Templates it lists must exist in Figma first. A carried node lands last in its parent: `parent.insertChild(index, node)` until the pull stops reporting `node order`.
- Existing: edit in place with `figma_run`.

| Task | How |
| --- | --- |
| Move, scale, restyle | `const node = L.find(root, name)`; `L.center`, `L.updateGUINode(node, {scale_factor})` and `L.center` again, `L.setFontSize` |
| Rename nodes | `renames = { component: { old: new } }`; `await L.renameNodes(root, renames, renames[root.name])` for every root, templates before the roots that use them; then fix the code that names the nodes |
| Add a child | `L.build(childSpec, parentNode)` |
| Move or rename sprites | `L.moveSprites(section, { old: [group, name] })`; update the registry, code and data that name the sprite |
| Delete a sprite, a node or a root | agree it with the user, remove it in Figma, the pull shows it as `-`, push with `drop` |

After a change pull and read the diff: it must contain exactly the intended changes.

## Troubleshooting

- `Current page is not ...`: the user switched pages. `figma_select` any node of the project page.
- `Attempted to invoke callback with invalid id` on an export: the plugin session is worn out, it shows up after about a hundred exports. Ask the user to restart the plugin; nothing is lost.
- `Plugin is ..., the agent is ...`: the plugin and the server are from different releases. Update both.
- `Port 3055 is taken`: another agent session holds the plugin; only one works at a time.
