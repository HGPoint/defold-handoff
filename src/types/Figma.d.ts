type DataLayer = BoxLayer | TextLayer | RectangleNode | ComponentSetNode | SectionNode | DocumentNode

type ExportableLayer = BoxLayer | TextLayer | RectangleNode | SliceLayer

type ContextLayer = ExportableLayer | ComponentSetNode

type BoxLayer = FrameNode | ComponentNode | InstanceNode

type TextLayer = TextNode

type AtlasLayer = ComponentSetNode | DynamicAtlas

type SliceLayer = SliceNode

type NodeChangePropertyExtended = NodeChangeProperty | "variant"