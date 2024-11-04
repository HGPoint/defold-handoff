type ExportableLayer = BoxLayer | TextLayer | SliceLayer;

type BoxLayer = FrameNode | ComponentNode | InstanceNode;

type TextLayer = TextNode;

type SliceLayer = SliceNode;

type NodeChangePropertyExtended = NodeChangeProperty | "variant";