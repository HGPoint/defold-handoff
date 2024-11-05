<script lang="ts">
  import ActionButton from "components/ActionButton";
  import Actions from "components/Actions";
  import Page from "components/Page";
  import Properties from "components/Properties";
  import ToggleProperty from "components/ToggleProperty";
  import selectionState from "state/selection";
  import { postMessageToPlugin } from "utilities/ui";

  let { gui } = $selectionState;
  let massProperties = generateMassProperties(gui)
  let lastSentUpdate = JSON.stringify(massProperties);

  function resolveProperty(gui: PluginGUINodeData[], key: keyof PluginGUINodesData) {
    let values = gui.map(node => node[key]);
    let [ firstValue ] = values;
    if (values.every(value => value === firstValue)) {
      return firstValue;
    }
    return null;
  }

  function generateMassProperties(gui: PluginGUINodeData[]) {
    return {
      exclude: resolveProperty(gui, "exclude"),
      screen: resolveProperty(gui, "screen"),
      skip: resolveProperty(gui, "skip"),
      fixed: resolveProperty(gui, "fixed"),
      cloneable: resolveProperty(gui, "cloneable"),
    }         
  }

  function shouldSendUpdate() {
    const massPropertiesString = JSON.stringify(massProperties);
    if (massPropertiesString !== lastSentUpdate) {
      lastSentUpdate = massPropertiesString;
      return true;
    }
    return false;
  }

  function updateData(selection: SelectionUIData) {
    ({ gui } = $selectionState);
    massProperties = generateMassProperties(gui)
  }

  function updatePlugin(updatedProperties: PluginGUINodesData) {
    if (shouldSendUpdate()) {
      gui.forEach(guiNode => { Object.assign(guiNode, updatedProperties); });
      postMessageToPlugin("updateGUI", { gui });
    }
  }

  $: updateData($selectionState);
  $: updatePlugin(massProperties);
</script>

<Page>
  <Properties title="Special Properties" collapseKey="guiNodeSpecialPropertiesCollapsed">
    <ToggleProperty label="Don't Export" bind:value={massProperties.exclude} />
    <ToggleProperty label="On Screen" bind:value={massProperties.screen} disabled={massProperties.exclude} />
    <ToggleProperty label="Skip" bind:value={massProperties.skip} disabled={massProperties.exclude} />
    <ToggleProperty label="Don't Collapse" bind:value={massProperties.fixed} disabled={massProperties.exclude} />
    <ToggleProperty label="Extract" bind:value={massProperties.cloneable} disabled={massProperties.exclude} />
  </Properties>
  <Actions title="Tools" collapseKey="guiNodesToolsCollapsed">
    <ActionButton label="Infer Properties" action="fixGUI" />
    <ActionButton label="Validate GUI" action="validateGUI" disabled={true} />
    <ActionButton label="Reset GUI Nodes" action="removeGUI" />
  </Actions>
  <Actions collapseKey="guiNodesActionsCollapsed">
    <ActionButton label="Export GUI" action="exportGUI" />
    <ActionButton label="Export Bundle" action="exportBundle" />
  </Actions>
  {#if $selectionState.layers.length > 1}
    <Actions title="Atlas Actions" collapseKey="layersActionsCollapsed">
      <ActionButton label="Create Atlas" action="createAtlas" />
    </Actions>
  {/if}
</Page>
