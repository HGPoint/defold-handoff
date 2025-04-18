<script lang="ts">
  import ActionButton from "components/ActionButton";
  import Actions from "components/Actions";
  import LayerPositionProperty from "components/LayerPositionProperty";
  import NumberProperty from "components/NumberProperty";
  import OptionsProperty from "components/OptionsProperty";
  import Page from "components/Page";
  import Properties from "components/Properties";
  import PropertyTip from "components/PropertyTip";
  import SidesProperty from "components/SidesProperty";
  import TextProperty from "components/TextProperty";
  import ToggleProperty from "components/ToggleProperty";
  import TransformationProperty from "components/TransformationProperty";
  import config from "config/config.json";
  import selectionState from "state/selection";
  import { isGameObjectLabelType, isGameObjectSpriteType } from "utilities/gameCollection";
  import { isZeroVector } from "utilities/math";
  import { postMessageToPlugin } from "utilities/ui";

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

  function updatePlugin(updatedProperties: WithNull<PluginGameObjectData>) {
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
      {#if isGameObjectSpriteType(gameObject.type)}
        <OptionsProperty label="Material" bind:value={gameObject.material} options={materials} disabled={true} />
      {/if}
      {#if isGameObjectSpriteType(gameObject.type) || isGameObjectLabelType(gameObject.type)}
        <OptionsProperty label="Blend Mode" bind:value={gameObject.blend_mode} options={config.blendModes} />
      {/if}
      {#if isGameObjectSpriteType(gameObject.type)}
        <OptionsProperty label="Size Mode" bind:value={gameObject.size_mode} options={config.sizeModes} />
        <SidesProperty label="Slice 9" bind:value={gameObject.slice9} />
      {/if}
    </Properties>
    <Properties title="Special Properties" collapseKey="guiNodeSpecialPropertiesCollapsed">
      <ToggleProperty label="Don't Export" bind:value={gameObject.exclude} />
      <ToggleProperty label="Skip" bind:value={gameObject.skip} disabled={gameObject.exclude} />
      <ToggleProperty label="Implied Game Object" bind:value={gameObject.implied_game_object} disabled={gameObject.exclude} />
      <NumberProperty label="Depth Layer" bind:value={gameObject.depth_layer} min={Number.MIN_SAFE_INTEGER} disabled={gameObject.exclude} />
      <ToggleProperty label="Arrange Depth" bind:value={gameObject.arrange_depth} disabled={gameObject.exclude} />
      {#if gameObject.arrange_depth && !gameObject.exclude}
        <TextProperty label="Depth Axis" bind:value={gameObject.depth_axis} disabled={gameObject.exclude}>
          <PropertyTip>
            Mathematical expression to determine the depth position of the object. The expression can use the following placeholders: x, y  and z for the position of the object, layer for the depth layer of the object, and index for the index of the Figma layer inside it's parent.  For example <code>layer*10+y*0.001</code>
          </PropertyTip>
        </TextProperty>
      {/if}
      {#if !gameObject.exclude}
        <TextProperty label="Path" bind:value={gameObject.path} />
      {/if}
    </Properties>
    <Actions title="Tools" collapseKey="guiNodeToolsCollapsed">
      <ActionButton label="Infer Properties" action="fixGameObjects" />
      {#if isGameObjectLabelType(gameObject.type)}
        <ActionButton label="Fix Text" action="fixGUIText" />
      {/if}
      {#if isGameObjectSpriteType(gameObject.type) && !isZeroVector(gameObject.slice9)}
        <ActionButton label="Refresh Slice 9" action="restoreSlice9" />
      {/if}
      <ActionButton label="Reset Collection" action="removeGameObjects" />
    </Actions>
    <Actions collapseKey="guiNodeActionsCollapsed">
      <ActionButton label="Export Collection" action="exportGameCollections" />
      <ActionButton label="Export Used Atlases" action="exportGameCollectionAtlases" />
      <ActionButton label="Export Bundle" action="exportBundle" />
      <ActionButton label="Copy Collection" action="copyGameCollection" />
    </Actions>
    {#if $selectionState.layers.length > 1}
      <Actions title="Atlas Actions" collapseKey="layersActionsCollapsed">
        <ActionButton label="Create Atlas" action="createAtlas" />
      </Actions>
    {/if}
  </Page>
{/if}
