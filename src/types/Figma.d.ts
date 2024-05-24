type ExportableLayer = BoxLayer | TextLayer;

type BoxLayer = FrameNode | ComponentNode | InstanceNode;

type TextLayer = TextNode;

type NodeChangePropertyExtended = NodeChangeProperty | "variant";