# [Defold Handoff](https://www.figma.com/community/plugin/1359029081454325668/defold-handoff)

This plugin streamlines the resource handoff process for the Defold game engine, enabling you to manage GUI and game-related designs, as well as sprite atlases, directly from Figma. It includes a powerful editor and additional tools, such as a Slice9 generator/editor.

The plugin offers three modes, each tailored to specific needs:

1. GUI Developer Mode – for handing off GUI resources.
2. GUI Designer Mode – for managing and refining GUI designs.
3. Game Designer Mode – for handing off game-related resources.

**Atlases:**

- Create and manage sprite atlases directly within your Figma project.
- Bundle or combine atlases for streamlined export.
- Export atlases and other image resources for your Defold project with a single click.

**GUI and Game Objects:**

- Design and manage Defold's GUI components, game objects and collections as frames in Figma.
- Fully leverage Figma's design tools without limitations.
- Edit native Defold properties using a custom editor inside Figma.
- Export components as-is or bundled with atlases and other resources.
- Use a variety of additional tools to speed up or fully automate handoff process.

## Code Structure

### Plugin Entry Points

- `src/app.ts` – The entry point for the UI application. It handles the editor UI and interactions with browser APIs. [Svelte 5](https://github.com/sveltejs/svelte) is used as the framework for UI and state management.
- `src/plugin.ts`– The entry point for the Figma plugin application. It manages business logic, including atlases, GUI nodes, game objects, and the overall project.

### Pseudo-API

- `src/handoff/atlas.ts` – Provides endpoints for managing atlas-related features, including creating, updating, and exporting atlases.
- `src/handoff/bundle.ts` – Provides endpoints for managing resource bundles, primarily focusing on export features.
- `src/handoff/gameCollection.ts` – Provides endpoints for managing game object-related features, including editing, updating, and exporting game objects.
- `src/handoff/gui.ts` – Provides endpoints for managing GUI-related features, including editing, updating, and exporting GUI nodes.
- `src/handoff/project.ts` – Provides endpoints for managing project-related features, primarily focusing on configuration (e.g., screen size, paths, fonts).
- `src/handoff/section.ts` – Provides endpoints for managing contextual resource organization features using Figma sections, primarily focusing on configuration (e.g., bundling and combining atlases, managing layers and materials).

### Utilities

- `src/utilities/archive.ts` – Handles file archiving using [JSZip](https://github.com/Stuk/jszip).
- `src/utilities/array.ts` – Handles array operations.
- `src/utilities/atlas.ts` – Handles operations with atlases.
- `src/utilities/atlasConversion.ts` – Handles atlas data conversion from Figma into Defold-like properties.
- `src/utilities/atlasExport.ts` – Handles atlas data export.
- `src/utilities/atlasProcessing.ts` – Handles atlas data processing and transformation.
- `src/utilities/atlasSerialization.ts` – Handles atlas data serialization.
- `src/utilities/blob.ts` – Handles operations with blob data.
- `src/utilities/clipboard.ts` – Handles clipboard interactions.
- `src/utilities/color.ts` – Handles color operations.
- `src/utilities/context.ts` – Handles contextual resource organization (e.g., bundling and combining atlases, managing layers and materials).
- `src/utilities/data.ts` – Handles basic data processing.
- `src/utilities/dataSerialization.ts` – Handles Defold property serialization.
- `src/utilities/defaults.ts` – Handles operations with default values for the Defold and special properties.
- `src/utilities/defold.ts` – Handles operations with Defold's component text format.
- `src/utilities/delay.ts` – Handles time delay operations.
- `src/utilities/document.ts` – Handles changes to the Figma document.
- `src/utilities/download.ts` – Handles downloads.
- `src/utilities/error.ts` – Handles error management.
- `src/utilities/evaluation.ts` – Handles evaluating math expressions using [math-expression-evaluator](https://github.com/bugwheels94/math-expression-evaluator).
- `src/utilities/figma.ts` – Handles operations with Figma layers, properties and plugin data storage.
- `src/utilities/font.ts` – Handles fonts, including extraction and processing of font data.
- `src/utilities/gameCollection.ts` – Handles operations with game objects and collections.
- `src/utilities/gameCollectionConversion.ts` – Handles game-related data conversion from Figma into Defold-like properties.
- `src/utilities/gameCollectionExport.ts` – Handles game-related data export.
- `src/utilities/gameCollectionProcessing.ts` – Handles game-related data processing and transformation.
- `src/utilities/gameCollectionSerialization.ts` – Handles game-related data serialization.
- `src/utilities/gameCollectionUpdate.ts` – Handles editing of game objects in Figma.
- `src/utilities/gui.ts` – Handles operations with GUI nodes.
- `src/utilities/guiConversion.ts` – Handles GUI-related data conversion from Figma into Defold-like properties.
- `src/utilities/guiExport.ts` – Handles GUI-related data export.
- `src/utilities/guiProcessing.ts` – Handles GUI-related data processing and transformation.
- `src/utilities/guiSerialization.ts` – Handles GUI-related data serialization.
- `src/utilities/guiUpdate.ts` – Handles editing of GUI nodes in Figma.
- `src/utilities/inference.ts` – Handles Defold-like property inference from Figma layer properties.
- `src/utilities/layer.ts` – Handles GUI layer data, including extraction and processing of it.
- `src/utilities/math.ts` – Handles math.
- `src/utilities/path.ts` – Handles operations with paths based on the project configuration.
- `src/utilities/pivot.ts` – Handles calculating positions relative to different pivots and environments.
- `src/utilities/resources.ts` – Handles resource handoff.
- `src/utilities/scheme.ts` – Handles GUI scheme boilerplate code.
- `src/utilities/selection.ts` – Handles operations with selection in Figma.
- `src/utilities/slice9.ts` – Handles Slice9 placeholders in Figma.
- `src/utilities/text.ts` – Handles operations with text.
- `src/utilities/texture.ts` – Handles texture data, including extraction and processing of it.
- `src/utilities/transformPipeline.ts` – Provides pipeline for data transformation.
- `src/utilities/ui.ts` – Handles operations within UI application.
- `src/utilities/updatePipeline.ts` – Provides pipeline for data editing.
- `src/utilities/validation.ts` – Handles data and resource validation.

### Types

`src/types/*.d.ts` – Type definitions.

### UI

`src/components/**/*.*` – Svelte components for the UI application.
