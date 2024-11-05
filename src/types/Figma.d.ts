type DataLayer = BoxLayer | TextLayer | ComponentSetNode | SectionNode | DocumentNode;

type ExportableLayer = BoxLayer | TextLayer | SliceLayer;

type ContextLayer = ExportableLayer | ComponentSetNode;

type BoxLayer = FrameNode | ComponentNode | InstanceNode;

type TextLayer = TextNode;

type AtlasLayer = ComponentSetNode | DynamicAtlas

type SliceLayer = SliceNode;

type NodeChangePropertyExtended = NodeChangeProperty | "variant";