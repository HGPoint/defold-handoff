type AgentStatus = "waiting" | "connected" | "working"

type AgentData = {
  status: AgentStatus,
  action: WithNull<PluginMessageAction>,
}

type AgentNodeData = {
  id: string,
  name: string,
  type: NodeType,
  x?: number,
  y?: number,
  width?: number,
  height?: number,
  visible?: boolean,
  guiNode: WithNull<PluginGUINodeData>,
  children?: AgentNodeData[],
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

type AgentInspectRequest = {
  ids?: string[],
  depth?: number,
}

type AgentFindRequest = {
  query: string,
  rootId?: string,
}

type AgentCaptureRequest = {
  id: string,
  scale?: number,
}

type AgentRunRequest = {
  code: string,
}
