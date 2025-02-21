import { PROJECT_CONFIG } from "handoff/project";
import { generateAtlasFileName, generateAtlasPath, generateAtlasesFileName, generateBundleFileName, generateFontFileName, generateFontPath, generateGUIFileName, generateGUINodesFileName, generateGUIPath, generateGameCollectionFileName, generateGameCollectionPath, generateGameCollectionsFileName, generateImageAssetsPath, generateScriptFileName, generateScriptPath, generateSpriteFileName, generateSpritePath, generateSpritesFileName, generateTemplatePath, sanitizeGUIFileName } from "utilities/path";
import { beforeEach, describe, expect, it } from "vitest";

describe("path", () => {
  beforeEach(() => {
    PROJECT_CONFIG.paths = {
      assetsPath: "assets",
      imageAssetsPath: "images",
      atlasAssetsPath: "atlases",
      fontAssetsPath: "fonts",
      spineAssetsPath: "spines",
    };
  });

  it("should generate the correct image assets path", () => {
    const path = generateImageAssetsPath("avatars");
    expect(path).toBe("/assets/images/avatars");
  });

  it("should generate the correct atlas path", () => {
    const path = generateAtlasPath("avatars");
    expect(path).toBe("/assets/atlases/avatars.atlas");
  });

  it("should generate the correct font path", () => {
    const path = generateFontPath({ name: "franxurter", id: "franxurter" });
    expect(path).toBe("/assets/fonts/franxurter.font");
  });

  it("should generate the correct sprite path", () => {
    const path = generateSpritePath("/atlases/avatars", "player_icon");
    expect(path).toBe("/atlases/avatars/player_icon.png");
  });

  it("should generate the correct template path", () => {
    const path = generateTemplatePath("/templates", "template1");
    expect(path).toBe("/templates/template1.gui");
  });

  it("should generate the correct script path", () => {
    const path = generateScriptPath("/scripts", "settings_window");
    expect(path).toBe("/scripts/settings_window.gui_script");
  });

  it("should generate the correct GUI path", () => {
    const path = generateGUIPath("window", "/game/view/window");
    expect(path).toBe("/game/view/window/window.gui");
  });

  it("should generate the correct game collection path", () => {
    const path = generateGameCollectionPath("level", "/game/view/world");
    expect(path).toBe("/game/view/world/level.collection");
  });

  it("should generate the correct bundle file name", () => {
    const gui = [{ name: "window" }] as SerializedGUIData[];
    const fileName = generateBundleFileName({ gui, gameObjects: [] });
    expect(fileName).toBe("window.resources.zip");
  });

  it("should generate the correct script file name", () => {
    const fileName = generateScriptFileName("settings_window");
    expect(fileName).toBe("settings_window.gui_script");
  });

  it("should generate the correct GUI file name", () => {
    const fileName = generateGUIFileName("window");
    expect(fileName).toBe("window.gui");
  });

  it("should generate the correct GUI nodes file name", () => {
    const gui = [{ name: "window" }] as SerializedGUIData[];
    const fileName = generateGUINodesFileName(gui);
    expect(fileName).toBe("window.node.zip");
  });

  it("should generate the correct game collection file name", () => {
    const fileName = generateGameCollectionFileName("level");
    expect(fileName).toBe("level.collection");
  });

  it("should generate the correct game collections file name", () => {
    const collections = [{ name: "level" }] as SerializedGameCollectionData[];
    const fileName = generateGameCollectionsFileName(collections);
    expect(fileName).toBe("level.collection.zip");
  });

  it("should generate the correct atlas file name", () => {
    const fileName = generateAtlasFileName("avatars");
    expect(fileName).toBe("avatars.atlas");
  });

  it("should generate the correct atlases file name", () => {
    const atlases = [{ name: "avatars" }] as SerializedAtlasData[];
    const fileName = generateAtlasesFileName(atlases);
    expect(fileName).toBe("avatars.atlas.zip");
  });

  it("should generate the correct sprite file name", () => {
    const fileName = generateSpriteFileName("player_icon");
    expect(fileName).toBe("player_icon.png");
  });

  it("should generate the correct sprites file name", () => {
    const atlases = [{ name: "avatars" }] as SerializedAtlasData[];
    const fileName = generateSpritesFileName(atlases);
    expect(fileName).toBe("avatars.sprites.zip");
  });

  it("should generate the correct font file name", () => {
    const fileName = generateFontFileName("franxurter");
    expect(fileName).toBe("franxurter.font");
  });

  it("should remove the autoskip prefix from the file name", () => {
    PROJECT_CONFIG.autoskip = "autoskip_";
    const fileName = "autoskip_layerName";
    const sanitizedFileName = sanitizeGUIFileName(fileName);
    expect(sanitizedFileName).toBe("layerName");
  });

  it("should return the same file name if it does not start with the autoskip prefix", () => {
    PROJECT_CONFIG.autoskip = "autoskip_";
    const fileName = "layerName";
    const sanitizedFileName = sanitizeGUIFileName(fileName);
    expect(sanitizedFileName).toBe(fileName);
  });

  it("should return the same file name if the autoskip prefix is empty", () => {
    PROJECT_CONFIG.autoskip = "";
    const fileName = "layerName";
    const sanitizedFileName = sanitizeGUIFileName(fileName);
    expect(sanitizedFileName).toBe(fileName);
  });
});
