"""
Turns a repository .gui file into the spec figma_build builds in Figma. Used to carry over
a file or a node that exists in the repository but is missing in Figma.
Usage: gui2spec.py <path from the project root> <spec file to write> [node id]
"""

import json
import math
import os
import sys
from typing import Any, Callable, Dict, List, Optional, Tuple

import guiparse
import project

# ==============================================================================  CONSTANTS  ==============================================================================

SPINE_PLACEHOLDER_SIZE: Tuple[float, float] = (120.0, 120.0)
TEXT_SIZE_EPSILON = 0.001
PIVOT_OFFSETS: Dict[str, Tuple[int, int]] = {
    "PIVOT_CENTER": (0, 0), "PIVOT_N": (0, 1), "PIVOT_NE": (1, 1), "PIVOT_E": (1, 0), "PIVOT_SE": (1, -1),
    "PIVOT_S": (0, -1), "PIVOT_SW": (-1, -1), "PIVOT_W": (-1, 0), "PIVOT_NW": (-1, 1),
}
ALIGN_HORIZONTAL: Dict[int, str] = {-1: "LEFT", 0: "CENTER", 1: "RIGHT"}
ALIGN_VERTICAL: Dict[int, str] = {1: "TOP", 0: "CENTER", -1: "BOTTOM"}
DATA_KEYS: Tuple[str, ...] = ("xanchor", "yanchor", "adjust_mode", "clipping_mode", "blend_mode", "layer", "material")
BOOL_KEYS: Tuple[str, ...] = ("enabled", "clipping_inverted")
SPRITE_DATA_KEYS: Tuple[str, ...] = ("adjust_mode", "blend_mode", "material")

Node = Dict[str, Any]
Context = Dict[str, Any]

# ==============================================================================  PARSING  ==============================================================================


def parse_vector(node: Node, key: str, default: float = 0.0) -> Tuple[float, ...]:
    """Reads the four components of a vector field."""
    value = node.get(key) or {}
    return tuple(value.get(axis, default) for axis in "xyzw")


def parse_flag(node: Node, key: str, default: bool) -> bool:
    """Reads a boolean field."""
    value = node.get(key)
    return default if value is None else value == "true"


def parse_sprites() -> Dict[str, Tuple[int, int]]:
    """Maps every 'atlas/sprite' of the project atlases to its size."""
    sprites: Dict[str, Tuple[int, int]] = {}
    for atlas, path in project.ATLASES.items():
        for image in guiparse.load(os.path.join(project.ROOT, path)).get("images", []):
            name = os.path.splitext(os.path.basename(image["image"]))[0]
            sprites[f"{atlas}/{name}"] = project.parse_png_size(project.ROOT + image["image"])
    return sprites


def parse_guis() -> Dict[str, Node]:
    """Loads every .gui file of the project by its resource path."""
    paths = project.parse_files(project.ROOT, project.GUI_DIRS, ".gui")
    return {"/" + path: guiparse.load(os.path.join(project.ROOT, path)) for path in paths}


SPRITES: Dict[str, Tuple[int, int]] = parse_sprites()
GUIS: Dict[str, Node] = parse_guis()
TEMPLATE_PATHS = {node["template"] for gui in GUIS.values() for node in gui.get("nodes", []) if node.get("template")}


def parse_own_nodes(gui: Node) -> List[Node]:
    """Returns the nodes a .gui file declares itself, without the template overrides."""
    return [node for node in gui.get("nodes", []) if node.get("template_node_child") != "true"]


def parse_children(gui: Node, parent_id: Optional[str]) -> List[Node]:
    """Returns the own nodes with a given parent, the roots when the parent is None."""
    return [node for node in parse_own_nodes(gui) if node.get("parent") == parent_id]


def parse_size(node: Node) -> Tuple[float, float]:
    """Returns the size of a node, taken from the sprite when the node sizes itself."""
    texture = node.get("texture")
    if texture and node.get("size_mode") == "SIZE_MODE_AUTO":
        return tuple(float(side) for side in SPRITES[texture])
    return parse_vector(node, "size")[:2]


def parse_pivot_point(size: Tuple[float, float], pivot: str) -> Tuple[float, float]:
    """Returns the pivot of a box in Figma coordinates, from its left top corner."""
    offset_x, offset_y = PIVOT_OFFSETS[pivot]
    return (size[0] / 2 * (1 + offset_x), size[1] / 2 * (1 - offset_y))


def parse_center(node: Node, visual_size: Tuple[float, float], context: Context, pivot: str) -> List[float]:
    """Returns the center of a node inside its parent in Figma coordinates."""
    position = parse_vector(node, "position")
    origin_x, origin_y = parse_pivot_point(context["size"], context["pivot"])
    point_x = origin_x + position[0] * context["scale"]
    point_y = origin_y - position[1] * context["scale"]
    angle = math.radians(parse_vector(node, "rotation")[2])
    offset_x = PIVOT_OFFSETS[pivot][0] * visual_size[0] / 2
    offset_y = PIVOT_OFFSETS[pivot][1] * visual_size[1] / 2
    rotated_x = offset_x * math.cos(angle) - offset_y * math.sin(angle)
    rotated_y = offset_x * math.sin(angle) + offset_y * math.cos(angle)
    return [point_x - rotated_x, point_y + rotated_y]


def parse_common_data(node: Node) -> Node:
    """Collects the Handoff node data every node kind shares."""
    data = {key: node[key] for key in DATA_KEYS if node.get(key)}
    for key in BOOL_KEYS:
        if node.get(key) is not None:
            data[key] = node[key] == "true"
    data["inherit_alpha"] = parse_flag(node, "inherit_alpha", False)
    return data


def parse_script_data(gui: Node) -> Node:
    """Collects the Handoff data of the script a .gui file runs."""
    script = gui.get("script")
    if not script:
        return {}
    return {"script": True, "script_path": os.path.dirname(script), "script_name": os.path.splitext(os.path.basename(script))[0]}


def parse_spec(spec: Node, name: str) -> Optional[Node]:
    """Finds the spec of a node by its name inside a spec tree."""
    if spec["name"] == name:
        return spec
    for child in spec.get("children", []):
        found = parse_spec(child, name)
        if found:
            return found
    return None


# ==============================================================================  DATA PROCESSING  ==============================================================================


def process_sprite(node: Node, name: str, visual_size: Tuple[float, float], scale: float) -> Node:
    """Builds the spec of a sprite instance."""
    texture = node["texture"]
    slice9 = parse_vector(node, "slice9")
    spec: Node = {"kind": "sprite", "name": name, "sprite": texture, "size": list(visual_size)}
    data = {key: node[key] for key in SPRITE_DATA_KEYS if node.get(key)}
    data["size_mode"] = node.get("size_mode", "SIZE_MODE_MANUAL")
    if any(slice9):
        spec["scale"] = scale
        data["slice9"] = dict(zip("xyzw", (side * scale for side in slice9)))
    spec["data"] = data
    return spec


def process_box(gui: Node, node: Node, context: Context) -> Node:
    """Builds the spec of a box node: a sprite when it is a textured leaf, a frame otherwise."""
    scale = parse_vector(node, "scale", 1.0)[0]
    visual_scale = context["scale"] * scale
    size = parse_size(node)
    visual_size = (size[0] * visual_scale, size[1] * visual_scale)
    pivot = node.get("pivot", "PIVOT_CENTER")
    texture = node.get("texture")
    children = parse_children(gui, node["id"])
    visible = parse_flag(node, "visible", True)
    stencil = node.get("clipping_mode") == "CLIPPING_MODE_STENCIL"
    clipping_visible = parse_flag(node, "clipping_visible", True)
    data = parse_common_data(node)
    data.update(pivot=pivot, visible=visible, size_mode=node.get("size_mode", "SIZE_MODE_MANUAL"))
    if scale != 1.0:
        data["scale_factor"] = scale
    child_context = {**context, "size": visual_size, "pivot": pivot, "scale": visual_scale, "top": False}
    if texture and not children:
        spec = process_sprite(node, node["id"], visual_size, visual_scale)
        spec["data"] = {**data, **spec["data"]}
    else:
        spec = {"kind": "frame", "name": node["id"], "size": list(visual_size), "data": data, "clips": stencil and clipping_visible, "children": []}
        if texture:
            inner = process_sprite(node, texture.split("/")[1], visual_size, visual_scale)
            inner["center"] = [visual_size[0] / 2, visual_size[1] / 2]
            spec["children"].append(inner)
        elif visible and not (stencil and not clipping_visible):
            spec["fill"] = [*parse_vector(node, "color", 1.0)[:3], node.get("alpha", 1.0)]
        for child in children:
            child_spec = process_node(gui, child, child_context)
            is_box = child_spec["kind"] in ("sprite", "frame", "template") and child.get("type") in ("TYPE_BOX", "TYPE_TEMPLATE")
            if not texture and child_spec["size"] == spec["size"] and is_box:
                child_spec["data"]["fixed"] = True
            spec["children"].append(child_spec)
    spec["rotation"] = parse_vector(node, "rotation")[2]
    spec["center"] = parse_center(node, visual_size, context, pivot)
    return spec


def process_text(gui: Node, node: Node, context: Context) -> Node:
    """Builds the spec of a text node."""
    scale = parse_vector(node, "scale", 1.0)[0]
    visual_scale = context["scale"] * scale
    size = parse_vector(node, "size")[:2]
    visual_size = ((size[0] - TEXT_SIZE_EPSILON) * visual_scale, (size[1] - TEXT_SIZE_EPSILON) * visual_scale)
    pivot = node.get("pivot", "PIVOT_CENTER")
    font_size = project.FONTS[node["font"]]["size"] * visual_scale
    outline_alpha = node.get("outline_alpha", 1.0)
    text = {
        "characters": node.get("text", ""),
        "font": node["font"],
        "fontSize": font_size,
        "alignHorizontal": ALIGN_HORIZONTAL[PIVOT_OFFSETS[pivot][0]],
        "alignVertical": ALIGN_VERTICAL[PIVOT_OFFSETS[pivot][1]],
        "autoResize": "NONE" if parse_flag(node, "line_break", False) else "TRUNCATE",
        "color": [*parse_vector(node, "color", 1.0)[:3], node.get("alpha", 1.0)],
        "outline": [*parse_vector(node, "outline", 0.0)[:3], outline_alpha] if outline_alpha else None,
        "lineHeight": node["text_leading"] * font_size if node.get("text_leading") else None,
    }
    data = parse_common_data(node)
    data.update(visible=parse_flag(node, "visible", True), size_mode="SIZE_MODE_MANUAL")
    spec = {"kind": "text", "name": node["id"], "size": list(visual_size), "text": text, "data": data}
    spec["rotation"] = parse_vector(node, "rotation")[2]
    spec["center"] = parse_center(node, visual_size, context, pivot)
    return spec


def process_template(gui: Node, node: Node, context: Context) -> Node:
    """Builds the spec of a template instance, placed by the root of the template it includes."""
    roots = parse_children(GUIS[node["template"]], None)
    if len(roots) != 1:
        raise NotImplementedError(f"multi-root template {node['template']}")
    root = roots[0]
    node_scale = parse_vector(node, "scale", 1.0)[0]
    scale = node_scale * parse_vector(root, "scale", 1.0)[0]
    root_size = parse_size(root)
    visual_size = (root_size[0] * scale * context["scale"], root_size[1] * scale * context["scale"])
    root_position = parse_vector(root, "position")
    position = parse_vector(node, "position")
    merged = {"position": {"x": position[0] + root_position[0] * node_scale, "y": position[1] + root_position[1] * node_scale}}
    center = parse_center(merged, visual_size, context, root.get("pivot", "PIVOT_CENTER"))
    data: Node = {"id": node["id"], "inherit_alpha": parse_flag(node, "inherit_alpha", False)}
    if node.get("enabled") is not None:
        data["enabled"] = node["enabled"] == "true"
    key = os.path.splitext(node["template"])[0]
    directory, name = os.path.split(key)
    data.update(template=False, replace_template=True, replace_template_path=directory, replace_template_name=name, pivot="PIVOT_CENTER")
    if scale != 1.0:
        data["scale_factor"] = scale
    if context.get("top"):
        data["screen"] = True
    return {"kind": "template", "name": node["id"], "template": key, "size": list(visual_size), "data": data, "center": center}


def process_spine(gui: Node, node: Node, context: Context) -> Node:
    """Builds the placeholder spec of a spine node."""
    resources = {resource["name"]: resource["path"] for resource in gui.get("resources", [])}
    scene = node["spine_scene"]
    directory = os.path.dirname(resources[scene])
    data = parse_common_data(node)
    data.update(replace_spine=True, replace_spine_name=scene, replace_spine_path=os.path.basename(directory), visible=False, size_mode="SIZE_MODE_MANUAL")
    spec = {"kind": "frame", "name": node["id"], "size": list(SPINE_PLACEHOLDER_SIZE), "data": data, "clips": False, "spine": resources[scene]}
    spec["center"] = parse_center(node, SPINE_PLACEHOLDER_SIZE, context, "PIVOT_CENTER")
    return spec


NODE_PROCESSORS: Dict[str, Callable[[Node, Node, Context], Node]] = {
    "TYPE_BOX": process_box, "TYPE_TEXT": process_text, "TYPE_TEMPLATE": process_template, "TYPE_CUSTOM": process_spine,
}


def process_node(gui: Node, node: Node, context: Context) -> Node:
    """Builds the spec of a node of any type."""
    return NODE_PROCESSORS[node["type"]](gui, node, context)


def process_gui(path: str) -> Node:
    """Builds the spec of a whole .gui file: a component for a template, a screen frame otherwise."""
    gui = GUIS[path]
    stem = os.path.splitext(os.path.basename(path))[0]
    directory = os.path.dirname(path)
    roots = parse_children(gui, None)
    if path in TEMPLATE_PATHS:
        if len(roots) != 1:
            raise NotImplementedError(f"multi-root template {path}")
        spec = process_box(gui, roots[0], {"size": parse_size(roots[0]), "pivot": "PIVOT_CENTER", "scale": 1.0})
        if spec["kind"] != "frame":
            raise NotImplementedError(f"leaf root in template {path}")
        spec["kind"] = "component"
        spec["data"].update(template=True, template_path=directory, template_name=stem)
        del spec["center"]
        return spec
    screen: Context = {"size": project.SCREEN, "pivot": "PIVOT_SW", "scale": 1.0}
    if len(roots) == 1 and roots[0]["id"] == stem and roots[0]["type"] == "TYPE_BOX":
        spec = process_box(gui, roots[0], screen)
        spec["data"].update(screen=True, path=directory, **parse_script_data(gui))
        del spec["center"]
        return spec
    children: List[Node] = []
    for root in roots:
        child = process_node(gui, root, {**screen, "top": True})
        child["data"]["screen"] = True
        children.append(child)
    data = {"skip": True, "visible": False, "path": directory, "size_mode": "SIZE_MODE_MANUAL", **parse_script_data(gui)}
    return {"kind": "frame", "name": stem, "size": list(project.SCREEN), "data": data, "clips": False, "children": children}


# ==============================================================================  MAIN  ==============================================================================


def main() -> None:
    """Writes the spec of a .gui file or of one of its nodes and prints where it belongs: the root and the parent node."""
    path = "/" + sys.argv[1].lstrip("/")
    spec = process_gui(path)
    item: Node = {"spec": os.path.abspath(sys.argv[2]), "root": spec["name"], "templates": sorted({node["template"] for node in GUIS[path].get("nodes", []) if node.get("template")})}
    if len(sys.argv) > 3:
        node = next((node for node in parse_own_nodes(GUIS[path]) if node["id"] == sys.argv[3]), None)
        if not node:
            sys.exit(f"no node {sys.argv[3]} in {path}")
        item["parent"] = node.get("parent", "")
        spec = parse_spec(spec, sys.argv[3])
    os.makedirs(os.path.dirname(item["spec"]), exist_ok=True)
    with open(item["spec"], "w", encoding="utf-8") as file:
        json.dump(spec, file)
    print(json.dumps(item))


if __name__ == "__main__":
    sys.exit(main())
