<script lang="ts">
  import selectionState from "state/selection";
  import { postMessageToPlugin } from "utilities/pluginUI";
  import Page from "components/Page";
  import Properties from "components/Properties";
  import TextProperty from "components/TextProperty";
  import TextSetProperty from "components/TextSetProperty";

  let projectConfig: ProjectData;
  let lastSentProjectConfig: ProjectData;

  function shouldSendProperties(updateProperties: ProjectData) {
    return JSON.stringify(lastSentProjectConfig) !== JSON.stringify(updateProperties);
  } 

  function tryUpdatePlugin(updateProjectConfig: ProjectData) {
    if (shouldSendProperties(updateProjectConfig)) {
      postMessageToPlugin("updateProject", { project: { ...updateProjectConfig } });
      lastSentProjectConfig = JSON.parse(JSON.stringify(updateProjectConfig));
    }
  }

  selectionState.subscribe((selection) => {
    if (selection) {
      const { project } = selection;
      const newProjectConfig = { paths: { ...project.paths }, fontFamilies: [ ...project.fontFamilies ] };
      lastSentProjectConfig = JSON.parse(JSON.stringify(newProjectConfig));
      projectConfig = newProjectConfig;
    }
  })

  $: tryUpdatePlugin(projectConfig);
</script>

{#if projectConfig}
  <Page>
    <Properties title="Project Path Properties">
      <TextProperty label="Assets Path" bind:value={projectConfig.paths.assetsPath} />
      <TextProperty label="Atlases Path" bind:value={projectConfig.paths.atlasAssetsPath} />
      <TextProperty label="Images Path" bind:value={projectConfig.paths.imageAssetsPath} />
      <TextProperty label="Fonts Path" bind:value={projectConfig.paths.fontAssetsPath} />
      <TextProperty label="Spines Path" bind:value={projectConfig.paths.spineAssetsPath} />
    </Properties>
    <Properties title="Project Font Properties">
      <TextSetProperty label="Font Families" bind:value={projectConfig.fontFamilies} />
    </Properties>
  </Page>
{/if}