<script lang="ts">
  import config from "config/config.json";
  import selectionState from "state/selection";
  import { postMessageToPlugin } from "utilities/pluginUI";
  import { isSpriteGameObjectType, isLabelGameObjectType} from "utilities/gameObject";
  import { isFigmaComponentInstanceType, isFigmaComponentType, isFigmaFrameType } from "utilities/figma";
  import { isZeroVector } from "utilities/math";
  import Page from "components/Page";
  import Properties from "components/Properties";
  import Actions from "components/Actions";
  import ActionButton from "components/ActionButton";
  import LayerPositionProperty from "components/LayerPositionProperty";
  import OptionsProperty from "components/OptionsProperty";
  import TextProperty from "components/TextProperty";
  import ToggleProperty from "components/ToggleProperty";
  import TransformationProperty from "components/TransformationProperty";
  import SidesProperty from "components/SidesProperty";

  let { gameObjects: [ gameObject ] } = $selectionState;
  let materials: Record<string, string>;
  let lastSentUpdate = JSON.stringify(gameObject);

  function shouldSendUpdate() {
    const gameObjectString = JSON.stringify(gameObject);
    if (gameObjectString !== lastSentUpdate) {
      lastSentUpdate = gameObjectString;
      return true;
    }
    return false;
  }

  function updatePlugin(updatedProperties: PluginGameObjectData | null) {
    if (shouldSendUpdate()) {
      postMessageToPlugin("updateGameObject", { gameObject });
    }
  }

  function updateData(selection: SelectionUIData) {
    ({ gameObjects: [ gameObject ] } = $selectionState);
    materials = $selectionState.context ? $selectionState.context.materials.reduce((materialOptions, material) => ({ ...materialOptions, [material.name]: material.id }), {}) : {};
  }

  $: updateData($selectionState);
  $: updatePlugin(gameObject);
</script>

{#if gameObject}
  <Page>
    <Properties collapseKey="guiNodePropertiesCollapsed">
      <TextProperty label="Id" bind:value={gameObject.id} />
      <LayerPositionProperty label="Position" bind:value={gameObject.position} />
      <TransformationProperty label="Scale" bind:value={gameObject.scale} disabled={true} />
      {#if isSpriteGameObjectType(gameObject.type)}
        <OptionsProperty label="Material" bind:value={gameObject.material} options={materials} disabled={true} />
      {/if}
      {#if isSpriteGameObjectType(gameObject.type) || isLabelGameObjectType(gameObject.type)}
        <OptionsProperty label="Blend Mode" bind:value={gameObject.blend_mode} options={config.blendModes} />
      {/if}
      {#if isSpriteGameObjectType(gameObject.type)}
        <OptionsProperty label="Size Mode" bind:value={gameObject.size_mode} options={config.sizeModes} />
        <SidesProperty label="Slice 9" bind:value={gameObject.slice9} />
      {/if}
    </Properties>
    <Properties title="Special Properties" collapseKey="guiNodeSpecialPropertiesCollapsed">
      <ToggleProperty label="Don't Export" bind:value={gameObject.exclude} />
      <ToggleProperty label="Skip" bind:value={gameObject.skip} disabled={gameObject.exclude} />
      <ToggleProperty label="Implied Game Object" bind:value={gameObject.implied_game_object} disabled={gameObject.exclude} />
      <ToggleProperty label="Arrange Depth" bind:value={gameObject.arrange_depth} disabled={gameObject.exclude} />
      {#if gameObject.arrange_depth && !gameObject.exclude}
        <TextProperty label="Depth Axis" bind:value={gameObject.depth_axis} disabled={gameObject.exclude} />
      {/if}
      {#if !gameObject.exclude}
        <TextProperty label="Path" bind:value={gameObject.path} />
      {/if}
    </Properties>
    <Actions title="Tools" collapseKey="guiNodeToolsCollapsed">
      <ActionButton label="Infer Properties" action="fixGameObjects" />
      {#if isLabelGameObjectType(gameObject.type)}
        <ActionButton label="Fix Text" action="fixTextNode" />
      {/if}
      {#if isSpriteGameObjectType(gameObject.type) && !isZeroVector(gameObject.slice9)}
        <ActionButton label="Refresh Slice 9" action="restoreSlice9Node" />
      {/if}
      {#if isFigmaComponentInstanceType(gameObject.figma_node_type)}
        <ActionButton label="Pull Game Object Data from Main Component" action="pullFromMainComponent" />
      {/if}
      <ActionButton label="Reset Collection" action="resetGameObjects" />
    </Actions>
    <Actions collapseKey="guiNodeActionsCollapsed">
      <ActionButton label="Export Collection" action="exportGameObjects" />
      <ActionButton label="Export Bundle" action="exportBundle" />
      <ActionButton label="Copy Collection" action="copyGameObjects" />
    </Actions>
    {#if $selectionState.layers.length > 1}
      <Actions title="Atlas Actions" collapseKey="layersActionsCollapsed">
        <ActionButton label="Create Atlas" action="createAtlas" />
      </Actions>
    {/if}
  </Page>
{/if}
