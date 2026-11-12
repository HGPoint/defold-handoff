"""
Reader of Defold text resources (.gui, .atlas): turns the protobuf text format into ordered
dictionaries, with the repeated blocks collected into lists.
"""

import collections
import re
from typing import Any, Dict, List, Tuple

# ==============================================================================  CONSTANTS  ==============================================================================

LIST_KEYS: Tuple[str, ...] = ("nodes", "textures", "fonts", "layers", "layouts", "particlefxs", "resources", "images", "animations", "materials")
TOKEN_KEY = re.compile(r"[A-Za-z_0-9]+")
TOKEN_STRING = re.compile(r'"((?:[^"\\]|\\.)*)"')
TOKEN_VALUE = re.compile(r"[^\s}]+")
ESCAPE = re.compile(r"\\([0-7]{1,3}|.)")
ESCAPE_CHARS: Dict[str, int] = {"n": 10, "r": 13, "t": 9}
SPACES = " \t\r\n"

# ==============================================================================  PARSING  ==============================================================================


def parse_escape(match: "re.Match[str]") -> str:
    """Decodes one escape sequence of a quoted string."""
    code = match.group(1)
    if code[0] in "01234567":
        return chr(int(code, 8))
    return chr(ESCAPE_CHARS.get(code, ord(code)))


def parse_string(value: str) -> str:
    """Decodes the escapes of a quoted string read as latin-1 into utf-8 text."""
    return ESCAPE.sub(parse_escape, value).encode("latin-1").decode("utf-8")


def parse_spaces(text: str, position: int) -> int:
    """Returns the position of the next non-space character."""
    while position < len(text) and text[position] in SPACES:
        position += 1
    return position


def parse_scalar(text: str, position: int) -> Tuple[Any, int]:
    """Reads a string, a number or an enum value and returns it with the position after it."""
    if text[position] == '"':
        value = ""
        while position < len(text) and text[position] == '"':
            match = TOKEN_STRING.match(text, position)
            value += match.group(1)
            position = parse_spaces(text, match.end())
        return (parse_string(value), position)
    match = TOKEN_VALUE.match(text, position)
    raw = match.group(0)
    try:
        return (float(raw), match.end())
    except ValueError:
        return (raw, match.end())


def parse_block(text: str, position: int) -> Tuple[List[Tuple[str, Any]], int]:
    """Reads the fields of a block up to its closing brace as ordered key and value pairs."""
    items: List[Tuple[str, Any]] = []
    while True:
        position = parse_spaces(text, position)
        if position >= len(text) or text[position] == "}":
            return (items, position)
        match = TOKEN_KEY.match(text, position)
        key = match.group(0)
        position = parse_spaces(text, match.end())
        if text[position] == ":":
            value, position = parse_scalar(text, parse_spaces(text, position + 1))
        else:
            value, position = parse_block(text, position + 1)
            position = parse_spaces(text, position) + 1
        items.append((key, value))


def parse_blocks(text: str) -> List[Tuple[str, Any]]:
    """Reads a whole resource as ordered key and value pairs."""
    return parse_block(text, 0)[0]


# ==============================================================================  DATA PROCESSING  ==============================================================================


def to_dict(items: List[Tuple[str, Any]]) -> "collections.OrderedDict[str, Any]":
    """Turns parsed pairs into a dictionary, collecting the repeated blocks into lists."""
    result: "collections.OrderedDict[str, Any]" = collections.OrderedDict()
    for key, value in items:
        if isinstance(value, list):
            value = to_dict(value)
        if key in LIST_KEYS:
            result.setdefault(key, []).append(value)
        else:
            result[key] = value
    return result


def load(path: str) -> "collections.OrderedDict[str, Any]":
    """Loads a resource file."""
    with open(path, encoding="latin-1") as file:
        return to_dict(parse_blocks(file.read()))
