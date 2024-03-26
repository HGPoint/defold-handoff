type ExportableLayer = BoxLayer | TextLayer;

type BoxLayer = FrameNode | InstanceNode;

type TextLayer = TextNode;

type NodeChangePropertyExtended = NodeChangeProperty | "variant";