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
  import OptionsProperty from "components/OptionsProperty";
  import ToggleProperty from "components/ToggleProperty";
  import TransformationProperty from "components/TransformationProperty";
  import SidesProperty from "components/SidesProperty";
  import TextProperty from "components/TextProperty";

  let { gameObjects: [ gameObject ] } = $selectionState;
  let fontFamilies: Record<string, string>;
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
    fontFamilies = $selectionState.project.fontFamilies.reduce((fonts, font) => ({ ...fonts, [font.name]: font.id }), {});
    materials = $selectionState.context ? $selectionState.context.materials.reduce((materialOptions, material) => ({ ...materialOptions, [material.name]: material.id }), {}) : {};
  }

  $: updateData($selectionState);
  $: updatePlugin(gameObject);
</script>

{#if gameObject}
  <Page>
    <Properties collapseKey="guiNodePropertiesCollapsed">
      <TextProperty label="Id" bind:value={gameObject.id} />
      <TransformationProperty label="Position" bind:value={gameObject.position} disabled={true} />
      <TransformationProperty label="Scale" bind:value={gameObject.scale} disabled={true} />
      {#if isSpriteGameObjectType(gameObject.type)}
        <OptionsProperty label="Material" bind:value={gameObject.material} options={materials} disabled={true} />
      {/if}
      {#if isLabelGameObjectType(gameObject.type)}
        <OptionsProperty label="Pivot" bind:value={gameObject.pivot} options={config.pivots} />
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
      <ActionButton label="Reset Game Object" action="resetGameObjects" />
    </Actions>
    <Actions collapseKey="guiNodeActionsCollapsed">
      <ActionButton label="Export Game Object" action="exportGameObjects" />
      <ActionButton label="Export Bundle" action="exportBundle" />
      <ActionButton label="Copy Game Object" action="copyGameObjects" />
    </Actions>
    {#if $selectionState.layers.length > 1}
      <Actions title="Atlas Actions" collapseKey="layersActionsCollapsed">
        <ActionButton label="Create Atlas" action="createAtlas" />
      </Actions>
    {/if}
  </Page>
{/if}
