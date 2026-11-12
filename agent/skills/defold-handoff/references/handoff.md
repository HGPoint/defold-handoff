# How Figma maps to Defold

Handoff reads plugin data, not looks. The library (`L` inside `figma_run`) and `figma_build` write that data for you.

| Figma | Plugin data | Defold |
| --- | --- | --- |
| atlas section | `defoldSection` with `jumbo` | one `.atlas` for all its groups |
| component set in it | `defoldAtlas` | folder `<textures>/<set>/` |
| component `Sprite=<name>` with a rectangle `<name>` | none | `<name>.png`, image of the atlas |
| root component in a GUI section | `defoldGUINode` with `template: true` | template `.gui` |
| root frame in a GUI section | `defoldGUINode` with `screen` or `skip` | scene `.gui` |
| layer inside a root | `defoldGUINode`, `id` equal to the layer name | node |
| instance of a sprite | same | box node with the texture |
| frame `<id>-slice9Placeholder` holding the hidden sprite instance and `slice9Frame-*` cells | `defoldSlice9` on the instance | box node with slice9 |
| instance of a root component | `replace_template` | template node |

`figma_export` takes every child of the GUI sections and every component set of the atlas sections. A section without `defoldSection` data is never exported.

## Spec

`figma_build` and `L.build(spec, parent)` build a node and its children. Coordinates are Figma ones: `center` is the center of the node inside its parent, measured from the parent's left top corner, y down. `gui2spec.py <gui> <spec file>` writes the spec of any existing file; use it as a sample.

```json
{"kind": "component", "name": "hard_currency_panel", "size": [126, 35], "clips": false,
 "data": {"template": true, "template_path": "/main/gui/hud", "template_name": "hard_currency_panel",
          "xanchor": "XANCHOR_RIGHT", "yanchor": "YANCHOR_TOP", "pivot": "PIVOT_CENTER", "visible": false, "inherit_alpha": true, "size_mode": "SIZE_MODE_MANUAL"},
 "children": [
  {"kind": "sprite", "name": "plate", "sprite": "gui/plate_pill", "size": [124, 40], "center": [63.16, 19.58],
   "data": {"size_mode": "SIZE_MODE_MANUAL", "slice9": {"x": 18, "y": 0, "z": 18, "w": 0}, "pivot": "PIVOT_CENTER", "visible": true, "inherit_alpha": false}},
  {"kind": "sprite", "name": "icon", "sprite": "gui/icon_gem", "size": [36, 42], "center": [11.16, 19.58],
   "data": {"size_mode": "SIZE_MODE_MANUAL", "pivot": "PIVOT_CENTER", "visible": true, "inherit_alpha": true}},
  {"kind": "text", "name": "label", "size": [62.3, 32.2], "center": [65.16, 16.58],
   "text": {"characters": "1613", "font": "main_font", "fontSize": 28, "alignHorizontal": "CENTER", "alignVertical": "CENTER", "autoResize": "NONE",
            "color": [0.64, 0.34, 0.19, 1], "outline": null, "lineHeight": null},
   "data": {"size_mode": "SIZE_MODE_MANUAL", "visible": true, "inherit_alpha": false}}]}
```

| Field | Meaning |
| --- | --- |
| `kind` | `component` (template root), `frame` (box with children, or a scene root), `sprite`, `text`, `template` |
| `size` | visual size in Figma, scale already applied |
| `data` | goes to `defoldGUINode` over the defaults of the plugin; `scale_factor` holds the scale of the node |
| `sprite` | `<atlas>/<name>`; `size_mode: SIZE_MODE_AUTO` means size is the sprite size times `scale_factor` |
| `slice9` in `data` | `{x, y, z, w}`: left, top, right, bottom on the node, the slices of the sprite times `scale`; makes the sprite a slice9 one |
| `scale` | of a slice9 sprite under a scale: `scale_factor` of the node times the ones of its ancestors |
| `text.font` | a font of `handoff.json`: the Defold font name |
| `text.fontSize` | the `size` of that font times the scale of the node |
| `text.outline` | `null` for no outline. A missing outline exports as alpha 0, never as a white one |
| `template` | `<path without .gui>`; add `data.replace_template`, `replace_template_path`, `replace_template_name`. The instance is scaled to `size` |
| `hidden` | names of the children of a template instance to hide in Figma; the export does not see it |
| `fill` | color of a box without a texture; `visible: false` boxes have none |
| `fixed` in `data` | a child as big as its untextured parent, kept as a separate node |

A box that has both a texture and children is a `frame` whose first child is the sprite, named after the sprite.

## Gotchas

- Use `figma.getNodeByIdAsync`. The synchronous `getNodeById` throws.
- A plugin call that timed out may have been applied. Rebuilding after a timeout once left 39 orphan roots on the page: look before repeating. `L.build` refuses a name its parent already has.
- Rename a node in both places, the layer name and `defoldGUINode.id`. `L.renameNodes` does it, including the `-slice9Placeholder` frame and the copies inside instances.
- Adding a child to the root of a template by hand gives it to every existing instance without the `exclude` flag, and Handoff writes an extra node into the parent `.gui`. Add children with `L.build`, then pull and read the diff of the parents.
- Never delete a sprite component or a root component that has instances. Replace the picture with `figma_update_sprite`; change a root in place.
- `figma.combineAsVariants` on components from different sets names them `Property 1=...`. `L.moveSprites` renames them right after.
- After `L.moveSprites` check the textures in the diff of the pull. The sprite layer inside a textured frame keeps its old layer name; rename it too.
- The image order inside an `.atlas` follows the order of the groups in their section. `L.sortAtlases`, which `figma_import_sprites` and `L.moveSprites` call, keeps it alphabetical: `~ images order` means a group was added by hand, sort the section. `~ node order` of a `.gui` file is the draw order.
- `figma_update_sprite` resizes the instances of nodes with `SIZE_MODE_AUTO` around their center and rebuilds the cells of slice9 ones. Instances with a manual size keep it: the picture stretches to the old box, look at them.
- The slices in `data.slice9` are in node pixels. The export divides them by the scale of the node.
- When the slices of a sprite cover its whole width or height, the placeholder has no cells for the middle band: it shows empty there once the node is larger than the sprite. The export is not affected.
- Rotated instances are not re-centered by `figma_update_sprite`.
- Outline and shadow default to 0 in Defold. A text without an outline must stay without one in the export.
