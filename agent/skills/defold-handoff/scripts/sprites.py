"""
Sprite tools of the defold-handoff skill: validates the sprite groups against the atlases and the
registry of handoff.json, finds where a sprite is used, spots duplicates and prepares PNGs
(slice9 crop, canvas, resize) before import.
Usage: sprites.py groups | check | usage [sprite] | dupes [png ...] | crop <png> [sibling png ...] | pad <png> <width> <height> | resize <png> <width> <height>
"""

import collections
import json
import os
import re
import statistics
import sys
from typing import Any, Callable, Dict, List, Optional, Set, Tuple

import numpy as np
from PIL import Image

import guiparse
import project

# ==============================================================================  CONSTANTS  ==============================================================================

KEPT_LINES = 4
BAND_DEVIATION = 2
BAND_TOLERANCES: Tuple[int, ...] = (2, 1, 0)
SOFT_ALPHA = 8
SIGNATURE_SIDE = 24
DUPLICATE_DISTANCE = 0.02
LOOKALIKE_DISTANCE = 0.05
VERDICTS: List[Tuple[float, str]] = [(DUPLICATE_DISTANCE, "same picture"), (LOOKALIKE_DISTANCE, "look at both"), (float("inf"), "nearest, another picture")]
NUMBER = re.compile(r"^(.*)_(\d+)$")
LITERAL = re.compile(r'"([A-Za-z0-9_]+)"')
INLINE_IMAGE = re.compile(r"img=[a-z0-9_]+:([a-z0-9_]+)")
EVIDENCE_LIMIT = 3

Registry = Dict[str, Dict[str, Any]]
Report = List[str]

# ==============================================================================  PARSING  ==============================================================================


def parse_sprites() -> Dict[str, List[str]]:
    """Lists the sprite names of every group folder on disk."""
    textures = os.path.join(project.ROOT, project.TEXTURES)
    groups = sorted(group for group in os.listdir(textures) if os.path.isdir(os.path.join(textures, group)))
    return {group: sorted(file[:-4] for file in os.listdir(os.path.join(textures, group)) if file.endswith(".png")) for group in groups}


def parse_path(group: str, name: str) -> str:
    """Returns the path of a sprite on disk."""
    return os.path.join(project.ROOT, project.TEXTURES, group, name + ".png")


def parse_atlas_images(atlas: str) -> Set[str]:
    """Lists the image paths of an atlas."""
    return {image["image"] for image in guiparse.load(os.path.join(project.ROOT, project.ATLASES[atlas])).get("images", [])}


def parse_group_atlases() -> Dict[str, List[str]]:
    """Maps every group folder to the atlases that list its sprites."""
    prefix = f"/{project.TEXTURES}/"
    atlases: Dict[str, List[str]] = {}
    for atlas in project.ATLASES:
        for group in sorted({image[len(prefix) :].split("/")[0] for image in parse_atlas_images(atlas) if image.startswith(prefix)}):
            atlases.setdefault(group, []).append(atlas)
    return atlases


def parse_gui_textures() -> Dict[str, List[str]]:
    """Maps every 'atlas/sprite' used by a .gui node to the files that use it."""
    usage: Dict[str, List[str]] = {}
    for path in project.parse_files(project.ROOT, project.GUI_DIRS, ".gui"):
        for node in guiparse.load(os.path.join(project.ROOT, path)).get("nodes", []):
            if node.get("texture"):
                usage.setdefault(node["texture"], []).append(path)
    return usage


def parse_literals(source: Dict[str, Any]) -> Dict[str, List[str]]:
    """Maps every quoted identifier and inline image name in the files of a reference source to the places it appears."""
    found: Dict[str, List[str]] = {}
    for directory in source["dirs"]:
        for base, _, files in os.walk(os.path.join(project.ROOT, directory)):
            for file in sorted(files):
                path = os.path.join(base, file)
                if not file.endswith(tuple(source["extensions"])) or any(part in path for part in source.get("skip", [])):
                    continue
                with open(path, encoding="utf-8") as file_text:
                    for number, line in enumerate(file_text, 1):
                        for literal in LITERAL.findall(line) + INLINE_IMAGE.findall(line):
                            found.setdefault(literal, []).append(f"{os.path.relpath(path, project.ROOT)}:{number}")
    return found


def parse_is_repeat(registry: Registry, left: str, right: str) -> bool:
    """Tells whether two groups may hold the same picture: both are named by data, or one is registered as repeating the other."""
    first, second = registry.get(left, {}), registry.get(right, {})
    return bool(first.get("dynamic") and second.get("dynamic")) or right in first.get("repeats", []) or left in second.get("repeats", [])


def parse_bounds(image: Image.Image) -> Optional[Tuple[int, int, int, int]]:
    """Returns the bounding box of the visible pixels."""
    return image.getchannel("A").point(lambda value: 255 if value > SOFT_ALPHA else 0).getbbox()


def parse_signature(path: str) -> Optional[np.ndarray]:
    """Reduces a sprite to its visible content at a small fixed size, so scale and canvas do not matter."""
    image = Image.open(path).convert("RGBA")
    bounds = parse_bounds(image)
    if not bounds:
        return None
    return np.asarray(image.crop(bounds).convert("RGBa").resize((SIGNATURE_SIDE, SIGNATURE_SIDE), Image.BOX), dtype=np.float32) / 255.0


def parse_content(group: str, names: List[str]) -> Optional[Tuple[int, int]]:
    """Returns the typical size of the visible content of the sprites of a group."""
    bounds = [parse_bounds(Image.open(parse_path(group, name)).convert("RGBA")) for name in names]
    sizes = [(right - left, bottom - top) for left, top, right, bottom in filter(None, bounds)]
    return (round(statistics.median(width for width, _ in sizes)), round(statistics.median(height for _, height in sizes))) if sizes else None


def parse_premultiplied(pixels: np.ndarray) -> np.ndarray:
    """Weighs the color of every pixel by its alpha, so the color noise of nearly transparent pixels does not count."""
    data = pixels.astype(np.int32)
    data[..., :3] = data[..., :3] * data[..., 3:] // 255
    return data


def parse_bands(pixels: np.ndarray, axis: int, tolerance: int) -> List[Tuple[int, int]]:
    """Finds runs of adjacent equal visible lines along an axis as (start, length), longest first."""
    data = parse_premultiplied(pixels)
    visible = data[..., 3].max(axis=1 - axis) > 0
    equal = (np.abs(np.diff(data, axis=axis)).max(axis=(1 - axis, 2)) <= tolerance) & visible[:-1] & visible[1:]
    bands: List[Tuple[int, int]] = []
    start: Optional[int] = None
    for index, value in enumerate(list(equal) + [False]):
        if value and start is None:
            start = index
        if not value and start is not None:
            bands.append((start, index - start + 1))
            start = None
    return sorted(bands, key=lambda band: -band[1])


def parse_band(images: List[np.ndarray], axis: int) -> Optional[Tuple[int, int]]:
    """Picks the widest band of equal lines shared by all images, None when it is too short to cut."""
    for tolerance in BAND_TOLERANCES:
        shared: Optional[Tuple[int, int]] = None
        for pixels in images:
            bands = parse_bands(pixels, axis, tolerance)
            if not bands:
                return None
            start, length = bands[0]
            lines = np.moveaxis(parse_premultiplied(pixels), axis, 0)[start : start + length]
            if np.abs(lines - lines[:1]).max() > BAND_DEVIATION:
                shared = None
                break
            shared = (start, start + length) if shared is None else (max(shared[0], start), min(shared[1], start + length))
        if shared and shared[1] - shared[0] > KEPT_LINES * 2:
            return (shared[0], shared[1] - shared[0])
    return None


# ==============================================================================  CHECKS  ==============================================================================


def process_check_groups(registry: Registry, sprites: Dict[str, List[str]]) -> Report:
    """Every folder is a registered group and every registered group has a folder, when the project keeps a registry."""
    if not registry:
        return []
    return [f"group folder is not in the registry: {group}" for group in sprites if group not in registry] + [f"registered group has no folder: {group}" for group in registry if group not in sprites]


def process_check_names(registry: Registry, sprites: Dict[str, List[str]]) -> Report:
    """Every sprite starts with the prefix of its registered group and is unique inside its atlas."""
    problems: Report = []
    seen: Dict[Tuple[str, str], str] = {}
    atlases = parse_group_atlases()
    for group, names in sprites.items():
        prefix = registry.get(group, {}).get("prefix")
        for name in names:
            if prefix and name != prefix and not name.startswith(prefix + "_"):
                problems.append(f"{group}/{name}: name must start with '{prefix}_'")
            for atlas in atlases.get(group, []):
                if (atlas, name) in seen:
                    problems.append(f"{group}/{name}: the same name is in {seen[(atlas, name)]}")
                seen[(atlas, name)] = group
    return problems


def process_check_numbers(registry: Registry, sprites: Dict[str, List[str]]) -> Report:
    """Numbered families use two digits and count from 01 without gaps; data driven groups are exempt."""
    problems: Report = []
    for group, names in sprites.items():
        if group not in registry or registry[group].get("dynamic"):
            continue
        families: Dict[str, List[str]] = collections.defaultdict(list)
        for name in names:
            match = NUMBER.match(name)
            if match:
                families[match.group(1)].append(match.group(2))
        for family, numbers in families.items():
            expected = [f"{index:02d}" for index in range(1, len(numbers) + 1)]
            if sorted(numbers) != expected:
                problems.append(f"{group}/{family}_*: numbers {sorted(numbers)} must be {expected}")
    return problems


def process_check_canvases(registry: Registry, sprites: Dict[str, List[str]]) -> Report:
    """Every sprite of a group with a canvas has exactly that size."""
    problems: Report = []
    for group, names in sprites.items():
        canvas = registry.get(group, {}).get("canvas")
        for name in names if canvas else []:
            size = list(Image.open(parse_path(group, name)).size)
            if size != canvas:
                problems.append(f"{group}/{name}: size {size[0]}x{size[1]}, the group canvas is {canvas[0]}x{canvas[1]}")
    return problems


def process_check_atlases(registry: Registry, sprites: Dict[str, List[str]]) -> Report:
    """Every sprite on disk is listed by one atlas, every listed image exists and a group belongs to one atlas."""
    on_disk = {f"/{project.TEXTURES}/{group}/{name}.png" for group, names in sprites.items() for name in names}
    listed = {image: atlas for atlas in project.ATLASES for image in parse_atlas_images(atlas)}
    problems = [f"no atlas lists {path}" for path in sorted(on_disk - set(listed))]
    problems += [f"{atlas}.atlas lists a missing file {path}" for path, atlas in sorted(listed.items()) if path not in on_disk]
    return problems + [f"group {group} is split between the atlases {', '.join(atlases)}" for group, atlases in parse_group_atlases().items() if len(atlases) > 1]


def process_check_textures(registry: Registry, sprites: Dict[str, List[str]]) -> Report:
    """Every texture of a .gui node exists in its atlas."""
    atlases = parse_group_atlases()
    existing = {f"{atlas}/{name}" for group, names in sprites.items() for atlas in atlases.get(group, []) for name in names}
    return [f"{files[0]}: texture {texture} does not exist" for texture, files in sorted(parse_gui_textures().items()) if texture.split("/")[0] in project.ATLASES and texture not in existing]


def process_check_duplicates(registry: Registry, sprites: Dict[str, List[str]]) -> Report:
    """No two sprites have the same pixels, unless their groups may repeat each other."""
    seen: Dict[bytes, str] = {}
    problems: Report = []
    for group, names in sprites.items():
        for name in names:
            image = Image.open(parse_path(group, name)).convert("RGBA")
            key = repr(image.size).encode() + image.tobytes()
            if key in seen and not parse_is_repeat(registry, group, seen[key].split("/")[0]):
                problems.append(f"{group}/{name}: same pixels as {seen[key]}")
            seen.setdefault(key, f"{group}/{name}")
    return problems


def process_check_usage(registry: Registry, sprites: Dict[str, List[str]]) -> Report:
    """Every sprite is used by a .gui node, by code or by data."""
    usage = process_usage(registry, sprites)
    return [f"{sprite}: not used anywhere" for sprite, evidence in sorted(usage.items()) if not evidence]


CHECKS: List[Callable[[Registry, Dict[str, List[str]]], Report]] = [
    process_check_groups, process_check_names, process_check_numbers, process_check_canvases, process_check_atlases,
    process_check_textures, process_check_duplicates, process_check_usage,
]

# ==============================================================================  DATA PROCESSING  ==============================================================================


def process_usage(registry: Registry, sprites: Dict[str, List[str]]) -> Dict[str, List[str]]:
    """Collects for every 'group/sprite' the places that reference it: .gui files and the reference sources of the project."""
    textures = parse_gui_textures()
    sources = [parse_literals(source) for source in project.REFERENCES]
    atlases = parse_group_atlases()
    usage: Dict[str, List[str]] = {}
    for group, names in sprites.items():
        for name in names:
            prefixes = [prefix for prefix in registry.get(group, {}).get("dynamic", []) if name.startswith(prefix)]
            literals = [name] + [name[len(prefix) :] for prefix in prefixes]
            evidence = sorted({file for atlas in atlases.get(group, []) for file in textures.get(f"{atlas}/{name}", [])})[:EVIDENCE_LIMIT]
            usage[f"{group}/{name}"] = evidence + [place for literal in literals for source in sources for place in source.get(literal, [])[:EVIDENCE_LIMIT]]
    return usage


def process_distances(left: Dict[str, np.ndarray], right: Dict[str, np.ndarray], limit: float) -> List[Tuple[float, str, str]]:
    """Returns the pairs of different sprites whose content differs no more than the limit, closest first."""
    pairs: List[Tuple[float, str, str]] = []
    for left_path, left_signature in left.items():
        for right_path, right_signature in right.items():
            if left_path == right_path or (left_path in right and right_path in left and left_path > right_path):
                continue
            distance = float(np.abs(left_signature - right_signature).mean())
            if distance <= limit:
                pairs.append((distance, left_path, right_path))
    return sorted(pairs)


def process_crop(path: str, siblings: List[str]) -> Dict[str, Any]:
    """Cuts the stretchable band of a slice9 sprite down to KEPT_LINES in place and returns the new slice9."""
    pixels = np.array(Image.open(path).convert("RGBA"))
    family = [pixels] + [np.array(Image.open(sibling).convert("RGBA")) for sibling in siblings]
    height, width = pixels.shape[:2]
    slice9 = [0, 0, 0, 0]
    for axis, (low, high) in ((1, (0, 2)), (0, (1, 3))):
        band = parse_band(family, axis)
        if not band:
            continue
        start, length = band
        pixels = np.delete(pixels, range(start + KEPT_LINES, start + length), axis=axis)
        slice9[low] = start + 1
        slice9[high] = pixels.shape[axis] - (start + KEPT_LINES - 1)
    Image.fromarray(pixels).save(path)
    return {"old_size": [width, height], "size": [pixels.shape[1], pixels.shape[0]], "slice9": slice9}


def process_pad(path: str, width: int, height: int) -> Dict[str, Any]:
    """Centers the visible content of a sprite on a canvas in place; fails when the content does not fit."""
    image = Image.open(path).convert("RGBA")
    left, top, right, bottom = parse_bounds(image)
    if right - left > width or bottom - top > height:
        raise ValueError(f"content {right - left}x{bottom - top} does not fit the canvas {width}x{height}")
    offset = ((width - (right - left)) // 2 - left, (height - (bottom - top)) // 2 - top)
    canvas = Image.new("RGBA", (width, height), (0, 0, 0, 0))
    canvas.paste(image, offset)
    canvas.save(path)
    return {"old_size": list(image.size), "size": [width, height], "offset": list(offset)}


def process_resize(path: str, width: int, height: int) -> Dict[str, Any]:
    """Scales a sprite to a size in place."""
    image = Image.open(path).convert("RGBA")
    image.convert("RGBa").resize((width, height), Image.LANCZOS).convert("RGBA").save(path)
    return {"old_size": list(image.size), "size": [width, height]}


# ==============================================================================  COMMANDS  ==============================================================================


def command_groups(arguments: List[str]) -> Report:
    """Prints every group with its atlas, sprite count and, from the registry, its prefix, canvas, typical content size and purpose."""
    registry, sprites, atlases = project.GROUPS, parse_sprites(), parse_group_atlases()
    lines = [f"{'group':22} {'atlas':12} {'n':>3}  {'prefix':20} {'canvas':9} {'content':9} about"]
    for group in list(registry) + [group for group in sprites if group not in registry]:
        entry = registry.get(group, {})
        canvas = "x".join(str(side) for side in entry["canvas"]) if entry.get("canvas") else "-"
        content = parse_content(group, sprites.get(group, [])) if entry.get("canvas") else None
        size = "x".join(str(side) for side in content) if content else "-"
        prefix = entry["prefix"] + "_" if entry.get("prefix") else "-"
        lines.append(f"{group:22} {', '.join(atlases.get(group, [])) or '-':12} {len(sprites.get(group, [])):>3}  {prefix:20} {canvas:9} {size:9} {entry.get('about', '')}")
    return lines


def command_check(arguments: List[str]) -> Report:
    """Runs every check and prints the problems."""
    registry, sprites = project.GROUPS, parse_sprites()
    problems = [problem for check in CHECKS for problem in check(registry, sprites)]
    return problems + [f"{sum(len(names) for names in sprites.values())} sprites in {len(sprites)} groups, {len(problems)} problem(s)"]


def command_usage(arguments: List[str]) -> Report:
    """Prints where a sprite is used, or every sprite without usage."""
    usage = process_usage(project.GROUPS, parse_sprites())
    if not arguments:
        return [sprite for sprite, evidence in sorted(usage.items()) if not evidence] or ["every sprite is used"]
    return [f"{sprite}: " + (", ".join(evidence) or "not used") for sprite, evidence in sorted(usage.items()) if sprite.split("/")[1] == arguments[0]]


def command_dupes(arguments: List[str]) -> Report:
    """Prints the nearest atlas sprite of every given PNG, or the atlas sprites that repeat each other against the rules."""
    registry, sprites = project.GROUPS, parse_sprites()
    atlas = {f"{group}/{name}": parse_signature(parse_path(group, name)) for group, names in sprites.items() for name in names}
    atlas = {path: signature for path, signature in atlas.items() if signature is not None}
    if not arguments:
        pairs = [pair for pair in process_distances(atlas, atlas, DUPLICATE_DISTANCE) if not parse_is_repeat(registry, pair[1].split("/")[0], pair[2].split("/")[0])]
        return [f"{distance:.3f}  {left}  ~  {right}" for distance, left, right in pairs] or ["no look-alikes"]
    candidates = {path: parse_signature(path) for path in arguments}
    nearest: Dict[str, Tuple[float, str]] = {}
    for distance, left, right in process_distances({path: signature for path, signature in candidates.items() if signature is not None}, atlas, float("inf")):
        nearest.setdefault(left, (distance, right))
    return [f"{distance:.3f}  {path}  ~  {sprite}  ({next(verdict for limit, verdict in VERDICTS if distance <= limit)})" for path, (distance, sprite) in nearest.items()]


def command_crop(arguments: List[str]) -> Report:
    """Crops the stretchable band of a slice9 PNG; the siblings share its geometry and limit the band."""
    return [json.dumps(process_crop(arguments[0], arguments[1:]))]


def command_pad(arguments: List[str]) -> Report:
    """Centers the content of a PNG on a canvas."""
    return [json.dumps(process_pad(arguments[0], int(arguments[1]), int(arguments[2])))]


def command_resize(arguments: List[str]) -> Report:
    """Scales a PNG to a size."""
    return [json.dumps(process_resize(arguments[0], int(arguments[1]), int(arguments[2])))]


COMMANDS: Dict[str, Callable[[List[str]], Report]] = {
    "groups": command_groups, "check": command_check, "usage": command_usage, "dupes": command_dupes,
    "crop": command_crop, "pad": command_pad, "resize": command_resize,
}

# ==============================================================================  MAIN  ==============================================================================


def main() -> None:
    """Runs the command named on the command line."""
    print("\n".join(COMMANDS[sys.argv[1]](sys.argv[2:])))


if __name__ == "__main__":
    sys.exit(main())
