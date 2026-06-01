# VLM Enum to GLB Asset Mapping

This is the current strict mapping from tutorial VLM enum outputs to actual assets in `model/`.

Policy: exact enum-to-asset mapping is preferred, but hair fallback is currently enabled so the avatar does not appear bald when the exact hair asset is missing. Non-hair slots still map to `null` when no current asset exists.

Machine-readable map: `docs/vlm-enum-to-glb-asset-map.json`.

## Always-On Assets

| Slot | Asset |
| --- | --- |
| base body | `model/basic/basic.glb` |

## Skin

`skin_texture` must choose exactly one of these texture assets.

| VLM enum | Texture asset | Selection rule |
| --- | --- | --- |
| `soft_peach_skin` | `model/skin/soft_peach_skin.png` | Default peach skin when no visible cheek blush style is present. |
| `light_warm_skin` | `model/skin/light_warm_skin.png` | Light warm skin when no visible cheek blush style is present. |

## Hair

Rule: assets containing `_with_bangs` are valid only when `bangs_type` is `see_through` or `full_bang`. If `bangs_type` is `none` or `unknown`, those assets must not be selected.

### When Bangs Are Present

| VLM enum | GLB asset |
| --- | --- |
| `short_cut` | fallback `model/hair/bobbed_hair_with_bangs.glb` |
| `crew_cut` | fallback `model/hair/bobbed_hair_with_bangs.glb` |
| `two_block` | fallback `model/hair/bobbed_hair_with_bangs.glb` |
| `dandy_cut` | fallback `model/hair/bobbed_hair_with_bangs.glb` |
| `pomade` | fallback `model/hair/bobbed_hair_with_bangs.glb` |
| `bob_straight` | `model/hair/bobbed_hair_with_bangs.glb` |
| `bob_c_curl` | `model/hair/bobbed_hair_with_bangs.glb` |
| `long_straight` | `model/hair/middle_long_hair_with_bangs.glb` |
| `long_wave` | `model/hair/permed_hair_with_permed_bangs.glb` |
| `ponytail_high` | `model/hair/tied_up_hair_with_bangs.glb` |
| `ponytail_low` | fallback `model/hair/bobbed_hair_with_bangs.glb` |
| `pigtails` | fallback `model/hair/bobbed_hair_with_bangs.glb` |
| `half_up` | `model/hair/half_up_top_knot_with_bangs.glb` |
| `bun` | `model/hair/bun_hair_with_bangs.glb` |
| `hime_cut` | fallback `model/hair/bobbed_hair_with_bangs.glb` |
| `unknown` | fallback `model/hair/bobbed_hair_with_bangs.glb` |

### When Bangs Are Absent Or Unknown

| VLM enum | GLB asset |
| --- | --- |
| `short_cut` | fallback `model/hair/tied_down_hair_without_bangs.glb` |
| `crew_cut` | fallback `model/hair/tied_down_hair_without_bangs.glb` |
| `two_block` | fallback `model/hair/tied_down_hair_without_bangs.glb` |
| `dandy_cut` | fallback `model/hair/tied_down_hair_without_bangs.glb` |
| `pomade` | fallback `model/hair/tied_down_hair_without_bangs.glb` |
| `bob_straight` | fallback `model/hair/tied_down_hair_without_bangs.glb` |
| `bob_c_curl` | fallback `model/hair/tied_down_hair_without_bangs.glb` |
| `long_straight` | fallback `model/hair/tied_down_hair_without_bangs.glb` |
| `long_wave` | fallback `model/hair/tied_down_hair_without_bangs.glb` |
| `ponytail_high` | fallback `model/hair/tied_down_hair_without_bangs.glb` |
| `ponytail_low` | `model/hair/tied_down_hair_without_bangs.glb` |
| `pigtails` | fallback `model/hair/tied_down_hair_without_bangs.glb` |
| `half_up` | fallback `model/hair/tied_down_hair_without_bangs.glb` |
| `bun` | fallback `model/hair/tied_down_hair_without_bangs.glb` |
| `hime_cut` | fallback `model/hair/tied_down_hair_without_bangs.glb` |
| `unknown` | fallback `model/hair/tied_down_hair_without_bangs.glb` |

`bangs_type` has no independent GLB asset. Bangs are baked into some hair GLBs, so all `bangs_type` values currently map to `null` as a separate slot.

## Eyes

| VLM enum | Texture asset |
| --- | --- |
| `round_open_eyes` | `model/eyes/round_open_eyes.png` |
| `almond_upturned_eyes` | `model/eyes/almond_upturned_eyes.png` |
| `hooded_shadow_eyes` | `model/eyes/hooded_shadow_eyes.png` |
| `sleepy_drooping_eyes` | `model/eyes/sleepy_drooping_eyes.png` |
| `simple_block_eyes` | `model/eyes/simple_block_eyes.png` |
| `unknown` | `null` |

## Mouth

| VLM enum | Texture asset |
| --- | --- |
| `bored` | `model/mouth/bored_mouth.png` |
| `closed_smile` | `model/mouth/closed_smile_mouth.png` |
| `big_smile` | `model/mouth/broad_smile_mouth.png` |
| `smirk` | `model/mouth/smirk_mouth.png` |
| `w_shape` | `model/mouth/w_shape_mouth.png` |
| `toothy_smile` | `model/mouth/toothy_smile_mouth.png` |
| `unknown` | `null` |

## Top

| VLM enum | GLB asset |
| --- | --- |
| `short_sleeve_tshirt` | `model/top/Short_Sleeve.glb` |
| `long_sleeve_tshirt` | `null` |
| `shirt` | `null` |
| `hoodie` | `null` |
| `casual_zip_jacket` | `null` |
| `unknown` | `null` |

## Bottom

| VLM enum | GLB asset |
| --- | --- |
| `wide_long_pants` | `null` |
| `shorts` | `model/bottom/short_pants.glb` |
| `long_skirt` | `null` |
| `short_skirt` | `model/bottom/short_skirt.glb` |
| `unknown` | `null` |

## Shoes and Accessories

| VLM enum | Asset |
| --- | --- |
| `shoe_type.sneakers` | `null` |
| `shoe_type.unknown` | `null` |
| `accessories.glasses_type.none` | `null` |
| `accessories.glasses_type.round` | `round_glasses` source node |
| `accessories.glasses_type.square` | `square_glasses` source node |
| `accessories.glasses_type.unknown` | `null` |
| `accessories.has_necklace.true` | `pearl_necklace` source node |
| `accessories.has_necklace.false` | `null` |
| `accessories.has_earrings.true` | `simple_earring_L`, `simple_earring_R` source nodes |
| `accessories.has_earrings.false` | `null` |

## Color Fields

| VLM field | Handling |
| --- | --- |
| `hair_color` | Material tint on selected hair GLB. Ignored when hair asset is `null`. |
| `top_color` | Material tint on selected top GLB. Ignored when top asset is `null`. |
| `bottom_color` | Material tint on selected bottom GLB. Ignored when bottom asset is `null`. |
| `eye_color` | Not currently mapped to an asset or material. |
