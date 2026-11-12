type AgentStatus = "waiting" | "connected" | "working"

type AgentData = {
  status: AgentStatus,
  action: WithNull<PluginMessageAction>,
}

type AgentColor = [number, number, number, number]

type AgentPoint = [number, number]

type AgentFontData = {
  family: string,
  style: string,
  size: number,
}

type AgentProjectData = {
  page: string,
  fonts?: Record<string, AgentFontData>,
  [key: string]: unknown,
}

type AgentIndexData = {
  sprites: Record<string, ComponentNode>,
  spriteKeys: Record<string, string>,
  spriteHashes: Record<string, string>,
  templates: Record<string, ComponentNode>,
  templateKeys: Record<string, string>,
  fonts: Record<string, AgentFontData>,
}

type AgentTextData = {
  characters: string,
  font: FontName | "mixed",
  fontSize: number | "mixed",
  color: WithNull<AgentColor>,
  outline: WithNull<AgentColor>,
  outlineWeight: number | "mixed",
  alignHorizontal: TextNode["textAlignHorizontal"],
  alignVertical: TextNode["textAlignVertical"],
}

type AgentNodeData = {
  id: string,
  name: string,
  type: NodeType,
  x?: number,
  y?: number,
  w?: number,
  h?: number,
  rotation?: number,
  hidden?: boolean,
  opacity?: number,
  sprite?: string,
  template?: string,
  foreign?: string,
  image?: string,
  imageSize?: AgentPoint,
  fill?: AgentColor,
  effects?: Effect["type"][],
  text?: AgentTextData,
  data?: Partial<PluginGUINodeData>,
  children?: AgentNodeData[],
}

type AgentSpecBaseData = {
  name: string,
  size: AgentPoint,
  center?: AgentPoint,
  rotation?: number,
  data: Partial<PluginGUINodeData>,
}

type AgentBoxSpecData = AgentSpecBaseData & {
  fill?: AgentColor,
  clips?: boolean,
  children?: AgentSpecData[],
}

type AgentComponentSpecData = AgentBoxSpecData & {
  kind: "component",
}

type AgentFrameSpecData = AgentBoxSpecData & {
  kind: "frame",
}

type AgentSpriteSpecData = AgentSpecBaseData & {
  kind: "sprite",
  sprite: string,
  scale?: number,
}

type AgentTextSpecData = AgentSpecBaseData & {
  kind: "text",
  text: {
    characters: string,
    font: string,
    fontSize: number,
    alignHorizontal: TextNode["textAlignHorizontal"],
    alignVertical: TextNode["textAlignVertical"],
    autoResize: TextNode["textAutoResize"],
    color: AgentColor,
    outline: WithNull<AgentColor>,
    lineHeight: WithNull<number>,
  },
}

type AgentTemplateSpecData = AgentSpecBaseData & {
  kind: "template",
  template: string,
  hidden?: string[],
}

type AgentSpecData = AgentComponentSpecData | AgentFrameSpecData | AgentSpriteSpecData | AgentTextSpecData | AgentTemplateSpecData

type AgentSpecBuilder<TSpec extends AgentSpecData> = (spec: TSpec, parent: BaseNode & ChildrenMixin, index: AgentIndexData) => Promise<Exclude<ExportableLayer, SliceLayer>>

type AgentSpecBuilders = {
  [TKind in AgentSpecData["kind"]]: AgentSpecBuilder<Extract<AgentSpecData, { kind: TKind }>>
}

type AgentSpriteInstanceData = {
  id: string,
  root: string,
  node: string,
  kind: "slice9" | "auto" | "manual",
  slice9?: Vector4,
}

type AgentPageData = {
  id: string,
  name: string,
}

type AgentDocumentData = {
  name: string,
  currentPageId: string,
  pages: AgentPageData[],
}

type AgentSelectRequest = {
  ids: string[],
}

type AgentFindRequest = {
  query: string,
  rootId?: string,
}

type AgentInspectRequest = {
  ids?: string[],
  depth?: number,
}

type AgentCaptureRequest = {
  id: string,
  scale?: number,
}

type AgentRunRequest = {
  code: string,
  args?: Record<string, unknown>,
  project: AgentProjectData,
}

type AgentExportRequest = {
  project: AgentProjectData,
}
