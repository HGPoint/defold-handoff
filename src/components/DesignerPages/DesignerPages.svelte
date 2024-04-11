<script lang="ts">
  import selectionState from "state/selection";
  import { isGUINodeSelected } from "utilities/selection";
  import Slice9Editor from "components/Slice9Editor";
</script>

{#if isGUINodeSelected($selectionState)}
  <Slice9Editor label={$selectionState.gui[0].id} size={$selectionState.gui[0].size} value={$selectionState.gui[0].slice9} />
{/if}