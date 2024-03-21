import JSZip from "jszip";
import config from "../config/config.json";
import { generateImageAssetsPath, generateAtlasPath, generateGUIFileName, generateSpritePath } from "./path";

type AtlasesResourceBundleData<ArchiveType> = {
  atlasData: string,
  bundleFileName: string,
  hasGuiNode: boolean,
  zip: ArchiveType,
}

type AtlasResourceBundleData<ArchiveType> = {
  atlasData: string,
  atlasImageAssetsPath: string,
  zip: ArchiveType,
}

const ATLAS_TEMPLATE = `{{images}}margin: 0\nextrude_borders: 2\ninner_padding: 0\nmax_page_width: 0\nmax_page_height: 0\n`;
const ATLAS_SPRITE_IMAGE_TEMPLATE = `images {\n  image: "{{image}}"\n  sprite_trim_mode: SPRITE_TRIM_MODE_OFF\n}\n`;

function spriteReducer(atlasResourceBundleData: AtlasResourceBundleData<JSZip>, sprite: SpriteData) {
  const { atlasImageAssetsPath, zip } = atlasResourceBundleData;
  const spritePath = generateSpritePath(atlasImageAssetsPath, sprite.name);
  const blob = new Blob([sprite.data], { type: "image/png" });
  zip.file(spritePath, blob);
  atlasResourceBundleData.atlasData += ATLAS_SPRITE_IMAGE_TEMPLATE.replace("{{image}}", spritePath);
  return atlasResourceBundleData;
}

function atlasesReducer(atlasesResourceBundleData: AtlasesResourceBundleData<JSZip>, { sprites, name }: AtlasData, index: number, atlases: AtlasData[]) {
  const { bundleFileName, hasGuiNode, zip } = atlasesResourceBundleData
  const folder = zip.folder(config.paths.atlasAssetsPath) || zip;
  const atlasImageAssetsPath = generateImageAssetsPath(name);
  const atlasPath = generateAtlasPath(name);
  if (!hasGuiNode && atlases.length > 1) {
    atlasesResourceBundleData.bundleFileName += !bundleFileName ? name : `-${name}`;
  }
  const atlasResourceBundleData: AtlasResourceBundleData<JSZip> = {
    atlasData: atlasesResourceBundleData.atlasData,
    atlasImageAssetsPath,
    zip: folder,
  }
  sprites.reduce(spriteReducer, atlasResourceBundleData);
  const atlasContent = ATLAS_TEMPLATE.replace("{{images}}", atlasesResourceBundleData.atlasData);
  folder.file(atlasPath, atlasContent);
  return atlasesResourceBundleData;
}

export function bundleResources({ gui, atlases }: BundleData) {
  const zip = new JSZip();
  const [ guiNode ] = gui;
  let fileName = ""
  if (guiNode) {
    fileName = generateGUIFileName(guiNode.name);
    zip.file(fileName, guiNode.data);
  } else if (atlases?.length == 1){
    const [{ name: atlasName }] = atlases;
    fileName = atlasName;
  }
  const atlasesResourceBundleData: AtlasesResourceBundleData<JSZip> = {
    atlasData: "",
    bundleFileName: fileName,
    hasGuiNode: !!guiNode,
    zip,
  } 
  atlases.reduce(atlasesReducer, atlasesResourceBundleData)
  return zip.generateAsync({ type: "blob" })
}
