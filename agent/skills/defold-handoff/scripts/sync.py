"""
Two step export from Figma: compares a Handoff export with the repository and reports what is
new, changed or exists only in the repository, then mirrors the export into the repository.
Usage: sync.py diff <export dir> | sync.py apply <export dir> [drop]
"""

import os
import shutil
import sys
from typing import Any, Callable, Dict, List, Set, Tuple

import guiparse
import project

# ==============================================================================  CONSTANTS  ==============================================================================

HEADER_SKIP = ("nodes",)
IDENTITY_KEYS = ("id", "parent")
ADDED, CHANGED, REMOVED = "+", "~", "-"
CLEAN = "CLEAN: the export equals the repository"
FORMATTING = f"    {CHANGED} nothing but renames and formatting"
BLOCKED_MARK = "BLOCKED"
BLOCKED = BLOCKED_MARK + ": {count} item(s) exist only in the repository and would be lost. Carry them over to Figma, or push with drop when the loss is agreed."
REFUSED = "REFUSED: nothing was applied."
EMPTY = "REFUSED: the export is empty."
DROP = "drop"

Report = List[str]

# ==============================================================================  PARSING  ==============================================================================


def parse_owned(root: str) -> Set[str]:
    """Lists the files Figma owns under a root: .gui files, sprites and atlases."""
    atlases = {path for path in project.ATLASES.values() if os.path.exists(os.path.join(root, path))}
    return {*project.parse_files(root, project.GUI_DIRS, ".gui"), *project.parse_files(root, [project.TEXTURES], ".png"), *atlases}


def parse_bytes(path: str) -> bytes:
    """Reads a file."""
    with open(path, "rb") as file:
        return file.read()


def parse_value(value: Any) -> str:
    """Formats a field value for the report."""
    if isinstance(value, dict):
        return "(" + ", ".join(f"{item:g}" if isinstance(item, float) else str(item) for item in value.values()) + ")"
    if isinstance(value, float):
        return f"{value:g}"
    return "none" if value is None else str(value)


# ==============================================================================  DATA PROCESSING  ==============================================================================


def process_renames(removed: Dict[str, Any], added: Dict[str, Any]) -> Dict[str, str]:
    """Pairs every removed item with the only added item that has the same content."""
    renames: Dict[str, str] = {}
    for old_key, content in removed.items():
        matches = [new_key for new_key, other in added.items() if other == content and new_key not in renames.values()]
        if len(matches) == 1:
            renames[old_key] = matches[0]
    return renames


def process_order(old: List[str], new: List[str], name: str) -> Report:
    """Reports the items both sides have when they come in a different order."""
    return [f"    {CHANGED} {name} order"] if [item for item in old if item in new] != [item for item in new if item in old] else []


def process_fields(old: Dict[str, Any], new: Dict[str, Any], skip: Tuple[str, ...] = ()) -> Report:
    """Lists the fields that differ between two blocks; a repeated block is compared item by item."""
    lines: Report = []
    for key in list(old) + [key for key in new if key not in old]:
        if key in skip or old.get(key) == new.get(key):
            continue
        if key not in guiparse.LIST_KEYS:
            lines.append(f"    {CHANGED} {key}: {parse_value(old.get(key))} -> {parse_value(new.get(key))}")
            continue
        old_items = [parse_value(item) for item in old.get(key, [])]
        new_items = [parse_value(item) for item in new.get(key, [])]
        lines += [f"    {REMOVED} {key} {item}" for item in old_items if item not in new_items]
        lines += [f"    {ADDED} {key} {item}" for item in new_items if item not in old_items]
        lines += process_order(old_items, new_items, key)
    return lines


def process_gui(repository: str, export: str, renames: Dict[str, str]) -> Report:
    """Lists the header fields and nodes that differ between two versions of a .gui file."""
    old, new = guiparse.load(repository), guiparse.load(export)
    lines = process_fields(old, new, HEADER_SKIP)
    old_nodes = {node["id"]: node for node in old.get("nodes", [])}
    new_nodes = {node["id"]: node for node in new.get("nodes", [])}
    removed = {node_id: {key: value for key, value in node.items() if key not in IDENTITY_KEYS} for node_id, node in old_nodes.items() if node_id not in new_nodes}
    added = {node_id: {key: value for key, value in node.items() if key not in IDENTITY_KEYS} for node_id, node in new_nodes.items() if node_id not in old_nodes}
    renames = process_renames(removed, added)
    lines += [f"    {CHANGED} node {old_id} -> {new_id} (renamed)" for old_id, new_id in renames.items()]
    lines += [f"    {REMOVED} node {node_id}" for node_id in removed if node_id not in renames]
    lines += [f"    {ADDED} node {node_id}" for node_id in added if node_id not in renames.values()]
    for node_id, node in old_nodes.items():
        other = new_nodes.get(node_id)
        if other is None or other == node:
            continue
        fields = [f"{key}: {parse_value(node.get(key))} -> {parse_value(other.get(key))}" for key in list(node) + [key for key in other if key not in node] if node.get(key) != other.get(key)]
        lines.append(f"    {CHANGED} node {node_id}: " + "; ".join(fields))
    return lines + process_order(list(old_nodes), list(new_nodes), "node") or [FORMATTING]


def process_atlas(repository: str, export: str, renames: Dict[str, str]) -> Report:
    """Lists the settings and images that differ between two versions of an atlas; a renamed sprite is not a difference."""
    old = guiparse.load(repository)
    old["images"] = [{"image": "/" + renames.get(image["image"][1:], image["image"][1:])} for image in old.get("images", [])]
    return process_fields(old, guiparse.load(export)) or [FORMATTING]


def process_png(repository: str, export: str, renames: Dict[str, str]) -> Report:
    """Describes how a sprite changed."""
    old, new = ("{}x{}".format(*project.parse_png_size(path)) for path in (repository, export))
    return [f"    {CHANGED} size {old} -> {new}" if old != new else f"    {CHANGED} pixels"]


DETAILS: Dict[str, Callable[[str, str, Dict[str, str]], Report]] = {".gui": process_gui, ".atlas": process_atlas, ".png": process_png}


def process_diff(export_root: str) -> Report:
    """Builds the report of an export against the repository."""
    exported, owned = parse_owned(export_root), parse_owned(project.ROOT)
    lines: Report = []
    removed = {path: parse_bytes(os.path.join(project.ROOT, path)) for path in sorted(owned - exported)}
    added = {path: parse_bytes(os.path.join(export_root, path)) for path in sorted(exported - owned)}
    renames = process_renames(removed, added)
    lines += [f"{CHANGED} {old_path} -> {new_path} (renamed)" for old_path, new_path in renames.items()]
    lines += [f"{ADDED} {path}" for path in added if path not in renames.values()]
    for path in sorted(exported & owned):
        repository, export = os.path.join(project.ROOT, path), os.path.join(export_root, path)
        if parse_bytes(repository) == parse_bytes(export):
            continue
        lines += [f"{CHANGED} {path}"] + DETAILS[os.path.splitext(path)[1]](repository, export, renames)
    lines += [f"{REMOVED} {path}" for path in removed if path not in renames]
    blocked = sum(1 for line in lines if line.strip().startswith(REMOVED + " "))
    if not lines:
        return [CLEAN]
    return lines + ([BLOCKED.format(count=blocked)] if blocked else [])


def process_apply(export_root: str, drop: bool) -> Report:
    """Mirrors the export into the repository; refuses to lose what only the repository has unless told to drop it."""
    exported, owned = parse_owned(export_root), parse_owned(project.ROOT)
    if not exported:
        sys.exit(EMPTY)
    report = process_diff(export_root)
    if report[-1].startswith(BLOCKED_MARK) and not drop:
        sys.exit("\n".join(report + [REFUSED]))
    for path in exported:
        target = os.path.join(project.ROOT, path)
        os.makedirs(os.path.dirname(target), exist_ok=True)
        shutil.copyfile(os.path.join(export_root, path), target)
    for path in owned - exported:
        directory = os.path.dirname(os.path.join(project.ROOT, path))
        os.remove(os.path.join(project.ROOT, path))
        if not os.listdir(directory):
            os.rmdir(directory)
    return [f"applied {len(exported)} files, dropped {len(owned - exported)}"]


# ==============================================================================  COMMANDS  ==============================================================================


def command_diff(arguments: List[str]) -> Report:
    """Prints the report of an export against the repository."""
    return process_diff(os.path.abspath(arguments[0]))


def command_apply(arguments: List[str]) -> Report:
    """Mirrors an export into the repository."""
    return process_apply(os.path.abspath(arguments[0]), DROP in arguments[1:])


COMMANDS: Dict[str, Callable[[List[str]], Report]] = {"diff": command_diff, "apply": command_apply}

# ==============================================================================  MAIN  ==============================================================================


def main() -> None:
    """Runs a command against an export directory."""
    print("\n".join(COMMANDS[sys.argv[1]](sys.argv[2:])))


if __name__ == "__main__":
    sys.exit(main())
