"""
Project settings of the defold-handoff skill: finds handoff.json upward from the working
directory, exposes where the exported GUI, sprites and atlases live in the repository
and reads the files found there.
"""

import json
import os
import struct
import sys
from typing import Any, Dict, Iterable, List, Optional, Tuple

# ==============================================================================  CONSTANTS  ==============================================================================

FILE = "handoff.json"
MISSING = f"{FILE} not found: run from a directory of the project, see SKILL.md of defold-handoff for its fields"
NO_FIELD = FILE + ": no {field}, see SKILL.md of defold-handoff for its fields"

# ==============================================================================  PARSING  ==============================================================================


def parse_root(directory: str) -> Optional[str]:
    """Finds the closest directory that holds handoff.json, going up from a directory."""
    while not os.path.exists(os.path.join(directory, FILE)):
        parent = os.path.dirname(directory)
        if parent == directory:
            return None
        directory = parent
    return directory


def parse_config(root: str) -> Dict[str, Any]:
    """Loads handoff.json of a project root."""
    with open(os.path.join(root, FILE), encoding="utf-8") as file:
        return json.load(file)


def parse_files(root: str, directories: Iterable[str], extension: str) -> List[str]:
    """Lists the files with an extension under the directories of a root, relative to the root."""
    found: List[str] = []
    for directory in directories:
        for base, _, files in os.walk(os.path.join(root, directory)):
            found.extend(os.path.relpath(os.path.join(base, file), root) for file in sorted(files) if file.endswith(extension))
    return found


def parse_png_size(path: str) -> Tuple[int, int]:
    """Reads the size of a PNG from its header."""
    with open(path, "rb") as file:
        header = file.read(24)
    return struct.unpack(">II", header[16:24])


# ==============================================================================  SETTINGS  ==============================================================================

ROOT: str = parse_root(os.getcwd()) or sys.exit(MISSING)
CONFIG: Dict[str, Any] = parse_config(ROOT)
GUI_DIRS: Tuple[str, ...] = tuple(CONFIG.get("gui") or sys.exit(NO_FIELD.format(field="gui")))
TEXTURES: str = CONFIG.get("textures") or sys.exit(NO_FIELD.format(field="textures"))
ATLASES: Dict[str, str] = CONFIG.get("atlases") or sys.exit(NO_FIELD.format(field="atlases"))
SCREEN: Tuple[float, ...] = tuple(float(side) for side in CONFIG.get("screen", []))
FONTS: Dict[str, Dict[str, Any]] = CONFIG.get("fonts", {})
REFERENCES: List[Dict[str, Any]] = CONFIG.get("references", [])
GROUPS: Dict[str, Dict[str, Any]] = CONFIG.get("groups", {})
