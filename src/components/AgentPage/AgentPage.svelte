<script lang="ts">
  import agentState from "state/agent";
  import { AGENT_SERVER_URL } from "utilities/agent";

  const titles: Record<AgentStatus, string> = {
    waiting: "Waiting for agent",
    connected: "Agent connected",
    working: "Agent is working",
  };

  $: hints = {
    waiting: AGENT_SERVER_URL,
    connected: "Keep this window open",
    working: $agentState.action,
  };
</script>

<main class="agent agent-is-{$agentState.status}" role="status">
  <span class="agentIndicator"></span>
  <span class="agentTitle">{titles[$agentState.status]}</span>
  <span class="agentHint">{hints[$agentState.status]}</span>
</main>
