declare module "config/config.json" {
  const value: {
    ui: Required<UIData>,
    screenSize: Vector4,
    paths: ProjectPathData
    constKeys: string[]
    guiDefaultValues: {
      script: string,
      material: string,
      adjust_reference: AdjustReference,
      max_nodes: number
    }
    guiNodeDefaultValues: {
      scale: Vector4,
      enabled: boolean,
      visible: boolean,
      slice9: Vector4,
      layer: string,
      material: string,
      inherit_alpha: boolean,
      xanchor: XAnchor,
      yanchor: YAnchor,
      pivot: Pivot,
      size_mode: SizeMode,
      adjust_mode: AdjustMode,
      clipping_mode: ClippingMode,
      clipping_visible: boolean,
      clipping_inverted: boolean,
      blend_mode: GUINodeBlendMode,
      custom_type: 0,
      template_node_child: boolean
    }
    guiNodeDefaultSpecialValues: {
      screen: boolean,
      skip: boolean,
      fixed: boolean,
      cloneable: boolean,
      path: string,
      template: boolean,
      template_path: string,
      template_name: string,
      wrapper: boolean,
      wrapper_padding: Vector4,
      exclude: boolean
    }
    atlasMaxSize: number,
    atlasDefaultValues: {
      margin: number,
      extrude_borders: number,
      inner_padding: number,
      max_page_width: number,
      max_page_height: number
    }
    atlasImageDefaultValues: {
      sprite_trim_mode: SpriteTrimMode
    }
    sectionDefaultValues: {
      bundled: boolean,
      jumbo: string,
      layers: ProjectLayerData[],
      materials: ProjectMaterialData[]
      ignorePrefixes: boolean
    }
    defaultFontSize: number,
    defaultFontFamilies: ProjectFontData[],
    fontStrokeRatio: number,
    sizeModes: Record<string, SizeMode | "PARSED">,
    blendModes: Record<string, GUINodeBlendMode>,
    pivots: Record<string, Pivot>,
    xAnchors: Record<string, XAnchor>,
    yAnchors: Record<string, YAnchor>,
    adjustModes: Record<string, AdjustMode>,
    clippingModes: Record<string, ClippingMode>
  };

  export default value;
}
