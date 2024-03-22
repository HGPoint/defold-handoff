declare module "config/config.json" {
  const value: {
    paths: Record<string, string>
    constKeys: string[]
    guiDefaultValues: {
      script: string,
      material: string,
      adjust_reference: AdjustReference,
      max_nodes: number
    }
    guiNodeDefaultValues: {
      enabled: boolean,
      visible: boolean,
      layer: string,
      inherit_alpha: boolean,
      xanchor: XAnchor,
      yanchor: YAnchor,
      pivot: Pivot,
      adjust_mode: AdjustMode,
      clipping_mode: ClippingMode,
      clipping_visible: boolean,
      clipping_inverted: boolean,
      blend_mode: GUINodeBlendMode,
      custom_type: 0,
      template_node_child: boolean
    }
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
    fontFamily: string
    fontSize: number,
    blendModes: Record<GUINodeBlendMode, string>
  };

  export default value;
}

