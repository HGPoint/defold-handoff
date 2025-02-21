type Vector4 = {
  x: number,
  y: number,
  z: number,
  w: number,
}

type GUINodeType = "TYPE_TEXT" | "TYPE_BOX" | "TYPE_TEMPLATE" | "TYPE_CUSTOM";

type AdjustReference = "ADJUST_REFERENCE_PARENT";

type GameObjectType = "TYPE_EMPTY" | "TYPE_SPRITE" | "TYPE_LABEL";

type SizeMode = "SIZE_MODE_AUTO" | "SIZE_MODE_MANUAL";

type XAnchor = "XANCHOR_NONE" | "XANCHOR_LEFT" | "XANCHOR_RIGHT";

type YAnchor = "YANCHOR_NONE" | "YANCHOR_TOP" | "YANCHOR_BOTTOM";

type Pivot = "PIVOT_CENTER" | "PIVOT_N" | "PIVOT_NE" | "PIVOT_E" | "PIVOT_SE" | "PIVOT_S" | "PIVOT_SW" | "PIVOT_W" | "PIVOT_NW";

type AdjustMode = "ADJUST_MODE_FIT" | "ADJUST_MODE_ZOOM" | "ADJUST_MODE_STRETCH";

type ClippingMode = "CLIPPING_MODE_NONE" | "CLIPPING_MODE_STENCIL";

type BlendingMode = "BLEND_MODE_ALPHA" | "BLEND_MODE_ADD" | "BLEND_MODE_MULTIPLY" | "BLEND_MODE_SCREEN";

type SpriteTrimMode = "SPRITE_TRIM_MODE_OFF";