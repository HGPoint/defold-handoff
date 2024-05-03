# [Defold Handoff](https://www.figma.com/community/plugin/1359029081454325668/defold-handoff)

With this plugin, you can easily manage GUI template designs and atlases, streamlining the resource handoff process for the Defold game engine. It features a robust customization system for GUI nodes, a Slice 9 generator/editor, and various support utilities and export tools.

**Atlases:**

- Create and manage sprite atlases directly within your Figma project.
- Bundle or combine atlases for streamlined export.
- Export atlases and image resources for your Defold project with a single click.

**GUI Nodes:**

- Design Defold GUI templates as simple frames in Figma.
- Fully leverage Figma's design tools without any limitations from Defold's side.
- Edit additional GUI node properties using the custom editor.
- Export GUI templates as they are, or bundled with atlases and other resources.
- Includes additional support utilities for developers.

## Code Structure

### Entry Points

- `src/app.ts` – Serves as the entry point for the UI application. It contains code responsible for creating the editor UI and handling interactions with browser API.
- `src/plugin.ts`– Serves as the entry point for the Figma plugin application. It contains the business logic of the application, handling everything that pertains to management of atlases, GUI nodes and the project itself.

### Pseudo-API

- `src/handoff/atlas.ts` – Contains endpoints responsible for managing atlas-related functionalities within the application. It handles tasks such as creating, updating, exporting, and deleting atlases.
- `src/handoff/bundle.ts` – Contains endpoints responsible for managing resource bundles within the application. It handles the bundling of resources for export.
- `src/handoff/gui.ts` – Contains endpoints responsible for managing GUI-related tasks within the application. It handles tasks such as updating, exporting, and copying GUI components.
- `src/handoff/project.ts` – Contains endpoints responsible for managing project-related functionalities. It handles project configuration, including screen size, paths, and fonts.
- `src/handoff/section.ts` – Contains endpoints responsible for managing resource organization functionalities using sections. It handles tasks such as bundling and combining atlases, etc.

### Utilities

- `src/utilities/archive.ts` – Module for handling archives. It utilizes JSZip library for creating zip archives.
- `src/utilities/atlas.ts` – Module for handling Defold atlases.
- `src/utilities/atlasDataConverters.ts` – Module for handling atlas data conversion.
- `src/utilities/atlasDataGenerators.ts` – Module for generating atlas data.
- `src/utilities/atlasDataSerializers.ts` – Module for handling atlas data serialization.
- `src/utilities/clipboard.ts` – Module for handling the clipboard operations.
- `src/utilities/color.ts` – Module for handling color operations.
- `src/utilities/dataSerializers.ts` – Module for handling Defold property serialization.
- `src/utilities/download.ts` – Module for handling file downloading.
- `src/utilities/evaluation.ts` – Module for evaluating expressions.
- `src/utilities/figma.ts` – Module for handling the work with Figma layers and properties.
- `src/utilities/font.ts` – Module for handling fonts.
- `src/utilities/gui.ts` – Module for handling Defold GUI nodes.
- `src/utilities/guiDataConverters.ts` – Module for handling GUI node data conversion.
- `src/utilities/guiDataGenerators.ts` – Module for generating GUI data.
- `src/utilities/guiDataSerializers.ts` – Module for handling GUI node data serialization.
- `src/utilities/inference.ts` – Module for inferring GUINode properties from Figma layers.
- `src/utilities/math.ts` – Module for handling math.
- `src/utilities/path.ts` – Module handling file paths based on project configuration.
- `src/utilities/pivot.ts` – Module for handling calculating positions and shifts based on pivot points and parent sizes.
- `src/utilities/pluginUI.ts` – Utility moule for handling plugin UI.
- `src/utilities/resources.ts` – Module for handling resource exports.
- `src/utilities/scale.ts` – Module for handling scale placeholders in Figma.
- `src/utilities/scheme.ts` – Module for handling scheme boilerplate code.
- `src/utilities/selection.ts` – Module for handling selection data.
- `src/utilities/slice9.ts` – Module for handling slice9 placeholders in Figma.

### Types

`src/types/*.*` – Contains type definitions.
