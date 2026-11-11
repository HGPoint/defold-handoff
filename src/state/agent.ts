import type { Writable } from "svelte/store";
import { writable } from "svelte/store";

const agentState: Writable<AgentData> = writable({ status: "waiting", action: null });

export default agentState;
