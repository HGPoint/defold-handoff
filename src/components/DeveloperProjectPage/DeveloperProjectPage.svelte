<script lang="ts">
  import Actions from "components/Actions";
  import ActionButton from "components/ActionButton";
  import DimensionsProperty from "components/DimensionsProperty";
  import NumberProperty from "components/NumberProperty";
  import Page from "components/Page";
  import Properties from "components/Properties";
  import PropertyTip from "components/PropertyTip";
  import TextProperty from "components/TextProperty";
  import TextSetProperty from "components/TextSetProperty";
  import ToggleProperty from "components/ToggleProperty";
  import selectionState from "state/selection";
  import { postMessageToPlugin } from "utilities/ui";

  let { project } = $selectionState
  let lastSentUpdate = JSON.stringify(project);

  function shouldSendUpdate() {
    const projectString = JSON.stringify(project);
    if (projectString !== lastSentUpdate) {
      lastSentUpdate = projectString;
      return true;
    }
    return false;
  }

  function updatePlugin(updatedProject: ProjectData) {
    if (shouldSendUpdate()) {
      postMessageToPlugin("updateProject", { project });
    }
  }

  function updateData(selection: SelectionUIData) {
    ({ project } = $selectionState);
  }

  $: updateData($selectionState);
  $: updatePlugin(project);  
</script>

{#if project}
  <Page>  
    <Properties title="Project Screen Properties">
      <DimensionsProperty label="Screen Size" bind:value={project.screenSize} />
    </Properties>
    <Properties title="Project Path Properties">
      <TextProperty label="Assets Path" bind:value={project.paths.assetsPath} />
      <TextProperty label="Atlases Path" bind:value={project.paths.atlasAssetsPath} />
      <TextProperty label="Images Path" bind:value={project.paths.imageAssetsPath} />
      <TextProperty label="Fonts Path" bind:value={project.paths.fontAssetsPath} />
      <TextProperty label="Spines Path" bind:value={project.paths.spineAssetsPath} />
    </Properties>
    <Properties title="Project Font Properties">
      <NumberProperty label="Font Size" bind:value={project.fontSize} />
      <NumberProperty label="Outline Ratio" bind:value={project.fontStrokeRatio} />
      <TextSetProperty label="Font Families" action="Add Font" bind:value={project.fontFamilies} />
    </Properties>
    <Properties title="Project Options">
      <TextProperty label="Skip Layers" bind:value={project.autoskip}>
        <PropertyTip>
          Layers with names starting with this string will be skipped.
        </PropertyTip>
      </TextProperty>
      <ToggleProperty label="Omit Default Values" bind:value={project.omitDefaultValues} />
    </Properties>
    <Actions title="Project Tools">
      <ActionButton label="Purge Unused Plugin Data" action="purgeUnusedData" />
    </Actions>
  </Page>
{/if}