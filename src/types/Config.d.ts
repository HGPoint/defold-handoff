declare module "config/config.json" {
  const value: {
    ui: Required<UIData>,
    uiSize: {
      expanded: {
        width: number,
        height: number,
      },
      collapsed: {
        width: number,
        height: number,
      }
    }
    screenSize: Vector4,
    paths: ProjectPathData
    constKeys: string[]
    guiDefaultValues: {
      script: string,
      material: string,
      adjust_reference: AdjustReference,
      max_nodes: number,
    }
    guiNodeDefaultValues: {
      scale: Vector4,
      enabled: boolean,
      visible: boolean,
      slice9: Vector4,
      layer: string,
      material: string,
      color: Vector4,
      alpha: number,
      inherit_alpha: boolean,
      xanchor: XAnchor,
      yanchor: YAnchor,
      pivot: Pivot,
      size_mode: SizeMode,
      adjust_mode: AdjustMode,
      clipping_mode: ClippingMode,
      clipping_visible: boolean,
      clipping_inverted: boolean,
      blend_mode: BlendingMode,
      custom_type: 0,
      template_node_child: boolean,
    }
    guiNodeDefaultSpecialValues: {
      exclude: boolean
      screen: boolean,
      skip: boolean,
      fixed: boolean,
      cloneable: boolean,
      inferred: boolean,
      export_variants: string,
      path: string,
      template: boolean,
      template_path: string,
      template_name: string,
      script: boolean,
      script_path: string,
      script_name: string,
      wrapper: boolean,
      wrapper_padding: Vector4,
      replace_template: boolean,
      replace_template_name: string,
      replace_template_path: string,
      replace_spine: boolean,
      replace_spine_name: string,
      replace_spine_path: string,
    }
    gameCollectionDefaultValues: {
      name: string,
      scale_along_z: number,
    }
    gameObjectDefaultValues: {
      position: Vector4,
      scale: Vector4,
      slice9: Vector4,
      material: string,
      pivot: Pivot,
      size_mode: SizeMode,
      blend_mode: BlendingMode,
    },
    gameObjectDefaultSpecialValues: {
      skip: boolean,
      implied_game_object: boolean,
      arrange_depth: boolean,
      depth_axis: string,
      path: string,
      exclude: boolean,
      inferred: boolean,
    },
    atlasMaxSize: number,
    atlasPadding: number,
    atlasSpritePadding: number,
    atlasDefaultValues: {
      margin: number,
      extrude_borders: number,
      inner_padding: number,
      max_page_width: number,
      max_page_height: number,
    }
    atlasDefaultSpecialValues: {
      extension: string,
      ignore: boolean,
    }
    atlasImageDefaultValues: {
      sprite_trim_mode: SpriteTrimMode
    }
    sectionDefaultValues: {
      bundled: boolean,
      jumbo: string,
      extension: string,
      ignore: boolean,
      layers: ProjectLayerData[],
      materials: ProjectMaterialData[],
      ignorePrefixes: boolean,
    }
    defaultFontSize: number,
    defaultFontStrokeRatio: number,
    defaultFontFamilies: ProjectFontData[],
    fontStrokeRatio: number,
    autoskip: string,
    omitDefaultValues: boolean,
    sizeModes: Record<string, SizeMode>,
    blendModes: Record<string, BlendingMode>,
    pivots: Record<string, Pivot>,
    xAnchors: Record<string, XAnchor>,
    yAnchors: Record<string, YAnchor>,
    adjustModes: Record<string, AdjustMode>,
    clippingModes: Record<string, ClippingMode>,
    psdPadding: number,
  };

  export default value;
}
