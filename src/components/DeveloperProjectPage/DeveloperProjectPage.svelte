<script lang="ts">
  import selectionState from "state/selection";
  import { postMessageToPlugin } from "utilities/pluginUI";
  import Page from "components/Page";
  import DimensionsProperty from "components/DimensionsProperty";
  import Properties from "components/Properties";
  import TextProperty from "components/TextProperty";
  import TextSetProperty from "components/TextSetProperty";

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
      <TextSetProperty label="Font Families" bind:value={project.fontFamilies} />
    </Properties>
  </Page>
{/if}