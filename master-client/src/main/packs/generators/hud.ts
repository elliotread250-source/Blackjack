import { fontJsonUi, jsonUiColor } from '@shared/hud'
import type { HudStyle, Settings } from '@shared/types'
import { type PackFiles, backgroundImage, boxSize, hasBackground, json, on, opt, pct, placement } from './common'

// JSON UI for the pack-engine HUD modules. Element names come from Mojang's
// vanilla resource_pack/ui (bedrock-samples). Vanilla files are never replaced:
// everything is a property override or a "modifications" entry, which Bedrock
// merges on top of the vanilla definitions (and on top of other packs).

type Control = Record<string, unknown>

const remove = (name: string) => ({ array_name: 'controls', operation: 'remove', control_name: name })
const insertBack = (value: Control[]) => ({ array_name: 'controls', operation: 'insert_back', value })

function anchored(x: number, y: number): Control {
  return { anchor_from: 'top_left', anchor_to: 'top_left', offset: [pct(x), pct(y)] }
}

function textProps(style: HudStyle, keepVanillaFont = false): Control {
  const out: Control = { color: jsonUiColor(style.textColor), shadow: style.shadow }
  if (!keepVanillaFont) out.font_type = fontJsonUi(style.font)
  return out
}

/**
 * A positioned panel holding a module's content, with its generated background
 * texture behind it when the style has one.
 */
function wrapper(files: PackFiles, s: Settings, id: string, content: Control[], opts: { bg?: boolean; size?: [string | number, string | number] } = {}): Control {
  const p = placement(s, id)
  const controls: Control[] = []
  if (opts.bg !== false && hasBackground(p.style)) controls.push(backgroundImage(files, id, p.style))
  controls.push(...content)
  return {
    [`mc_${id}`]: {
      type: 'panel',
      ...anchored(p.x, p.y),
      size: opts.size ?? boxSize(id, p.scale),
      layer: 2,
      controls
    }
  }
}

/** Vanilla's chat_stack, minus whatever Master Client has moved out of it. */
function chatStack(withCoords: boolean, withChat: boolean): Control {
  const controls: Control[] = [
    {
      paper_doll_padding: {
        type: 'panel',
        size: ['100%', 50],
        bindings: [{ binding_name: '#paper_doll_visible', binding_name_override: '#visible' }]
      }
    },
    {
      non_centered_gui_padding: {
        type: 'panel',
        size: ['100%', 32],
        bindings: [{ binding_name: '#hud_visible_not_centered', binding_name_override: '#visible', binding_type: 'global' }]
      }
    }
  ]
  if (withCoords) controls.push({ 'player_position@hud.player_position': {} })
  controls.push({ 'number_of_days_played@hud.number_of_days_played': {} })
  controls.push({ 'game_tip@game_tip.game_tip_chat_stack_factory': { size: ['100%', '100%c'] } })
  if (withChat) controls.push({ 'chat_panel@hud.chat_panel': {} })
  return {
    chat_stack: {
      type: 'stack_panel',
      orientation: 'vertical',
      size: ['40%', '100%'],
      anchor_from: 'top_left',
      anchor_to: 'top_left',
      controls
    }
  }
}

export function buildHudUi(s: Settings, files: PackFiles): void {
  const hud: Record<string, unknown> = { namespace: 'hud' }
  const rootMods: unknown[] = []
  const mine: Control[] = []

  // ---- Chat and coordinates both live in vanilla's chat_stack.
  const chat = on(s, 'chat')
  const coords = on(s, 'coords')
  if (chat || coords) {
    rootMods.push(remove('chat_stack'), insertBack([chatStack(!coords, !chat)]))
  }

  if (coords) {
    const p = placement(s, 'coords')
    hud.mc_coords_label = {
      type: 'label',
      anchor_from: 'center',
      anchor_to: 'center',
      layer: 1,
      text: '#text',
      localize: false,
      font_scale_factor: p.scale,
      ...textProps(p.style),
      bindings: [
        { binding_name: '#player_position_text', binding_name_override: '#text', binding_condition: 'always_when_visible', binding_type: 'global' }
      ]
    }
    const content: Control[] = []
    if (hasBackground(p.style)) content.push(backgroundImage(files, 'coords', p.style))
    content.push({ 'label@hud.mc_coords_label': {} })
    mine.push({
      mc_coords: {
        type: 'panel',
        ...anchored(p.x, p.y),
        size: ['100%c + 8px', '100%c + 4px'],
        layer: 2,
        controls: content,
        bindings: [
          { binding_name: '#player_position_visible', binding_name_override: '#visible', binding_condition: 'always', binding_type: 'global' }
        ]
      }
    })
  }

  if (chat) {
    const p = placement(s, 'chat')
    const width = opt<number>(s, 'chat', 'width') ?? 40
    const lines = Math.round(opt<number>(s, 'chat', 'lines') ?? 20)
    const bgOpacity = opt<number>(s, 'chat', 'bgOpacity') ?? 0.5
    // "Minecraft" keeps whatever chat font you picked in Minecraft's own chat settings.
    const keepFont = p.style.font === 'minecraft'

    hud.anim_chat_bg_alpha = { anim_type: 'alpha', easing: 'in_quart', destroy_at_end: 'chat_grid_item', duration: 1, from: bgOpacity, to: 0 }
    hud.chat_label = {
      type: 'label',
      layer: 31,
      text: '#text',
      size: ['100%', 'default'],
      localize: false,
      enable_profanity_filter: true,
      font_scale_factor: '$chat_font_scale_factor',
      line_padding: '$chat_line_spacing',
      ...(keepFont ? { font_type: '$chat_font_type' } : {}),
      ...textProps(p.style, keepFont),
      anims: ['@hud.anim_chat_txt_wait'],
      bindings: [
        { binding_name: '#chat_text', binding_name_override: '#text', binding_type: 'collection', binding_collection_name: 'chat_text_grid', binding_condition: 'once' }
      ]
    }
    hud.chat_grid_item = {
      type: 'panel',
      layer: 1,
      size: ['100%-2px', '100%c'],
      anchor_from: 'top_left',
      anchor_to: 'top_left',
      bindings: [{ binding_name: '(not #on_new_death_screen)', binding_name_override: '#visible' }],
      controls: [
        {
          chat_background: {
            type: 'image',
            texture: 'textures/master_client/white',
            color: [0, 0, 0],
            alpha: bgOpacity,
            size: ['100%', '100%c'],
            anims: ['@hud.anim_chat_bg_wait'],
            controls: [
              {
                'chat_text@chat_label': {
                  anchor_from: 'top_left',
                  anchor_to: 'top_left',
                  offset: [2, 0],
                  size: ['100% - 5px', 'default']
                }
              }
            ]
          }
        }
      ]
    }
    hud.chat_panel = {
      type: 'panel',
      anchor_from: 'top_left',
      anchor_to: 'top_left',
      size: ['100%', '100%c'],
      max_size: ['100%', '100%'],
      controls: [
        {
          stack_panel: {
            type: 'stack_panel',
            anchor_from: 'bottom_left',
            anchor_to: 'bottom_left',
            factory: { name: 'chat_item_factory', max_children_size: lines, control_ids: { chat_item: 'chat_item@hud.chat_grid_item' } }
          }
        }
      ]
    }
    mine.push({
      mc_chat: {
        type: 'panel',
        ...anchored(p.x, p.y),
        size: [`${width}%`, '50%'],
        layer: 2,
        controls: [{ 'chat_panel@hud.chat_panel': {} }]
      }
    })
  }

  // ---- Status effects
  if (on(s, 'potion')) {
    rootMods.push(remove('mob_effects_renderer'))
    mine.push(
      wrapper(files, s, 'potion', [
        {
          'mob_effects_renderer@hud.mob_effects_renderer': {
            size: ['100%', '100%'],
            anchor_from: 'top_left',
            anchor_to: 'top_left',
            bindings: [{ binding_name: '#status_effects_visible', binding_name_override: '#visible' }]
          }
        }
      ])
    )
  }

  // ---- Boss bars
  if (on(s, 'bossbar')) {
    rootMods.push(remove('boss_health_panel'))
    const p = placement(s, 'bossbar')
    const controls: Control[] = []
    if (hasBackground(p.style)) controls.push(backgroundImage(files, 'bossbar', p.style, ['100%', 22]))
    controls.push({
      'boss_health_grid@hud.boss_health_grid': {
        anchor_from: 'top_left',
        anchor_to: 'top_left',
        size: ['100%', '100%'],
        offset: [0, 2]
      }
    })
    mine.push({ mc_bossbar: { type: 'panel', ...anchored(p.x, p.y), size: [182, '30%'], layer: 2, controls } })
  }

  // ---- Scoreboard sidebar
  if (on(s, 'scoreboard')) {
    rootMods.push(remove('sidebar'))
    const p = placement(s, 'scoreboard')
    mine.push({
      'mc_sidebar@scoreboard.scoreboard_sidebar': {
        ...anchored(p.x, p.y),
        layer: 2,
        bindings: [{ binding_name: '#scoreboard_sidebar_visible', binding_name_override: '#visible' }]
      }
    })
    const font = fontJsonUi(p.style.font)
    const scoreboard: Record<string, unknown> = {
      namespace: 'scoreboard',
      scoreboard_sidebar_player: { color: jsonUiColor(opt<string>(s, 'scoreboard', 'nameColor') ?? '#ffffff'), font_type: font, shadow: p.style.shadow },
      scoreboard_sidebar_score: {
        color: jsonUiColor(opt<string>(s, 'scoreboard', 'scoreColor') ?? '#ff5555'),
        font_type: font,
        shadow: p.style.shadow,
        ...(opt<boolean>(s, 'scoreboard', 'hideNumbers') ? { visible: false } : {})
      }
    }
    files.set('ui/scoreboards.json', json(scoreboard))
  }

  // ---- Paper doll (desktop and touch layouts)
  if (on(s, 'paperdoll')) {
    const p = placement(s, 'paperdoll')
    const size = Math.round(15 * p.scale)
    const doll = (name: string) => ({
      [`${name}@hud.hud_player_renderer`]: { ...anchored(p.x, p.y), size: [size, size] }
    })
    hud.centered_gui_elements = { modifications: [remove('hud_player_rend_desktop'), insertBack([doll('hud_player_rend_desktop')])] }
    hud.not_centered_gui_elements = { modifications: [remove('hud_player_rend_pocket'), insertBack([doll('hud_player_rend_pocket')])] }
    if (hasBackground(p.style)) mine.push(wrapper(files, s, 'paperdoll', []))
  }

  // ---- Armour bar
  if (on(s, 'armor')) {
    const bottom = (hud.centered_gui_elements_at_bottom_middle ??= { modifications: [] }) as { modifications: unknown[] }
    bottom.modifications.push(remove('armor_rend'))
    const notCentered = (hud.not_centered_gui_elements ??= { modifications: [] }) as { modifications: unknown[] }
    notCentered.modifications.push(remove('armor_rend'))
    mine.push(
      wrapper(files, s, 'armor', [
        { 'armor_rend@hud.armor_renderer': { anchor_from: 'top_left', anchor_to: 'top_left', offset: [1, 1] } }
      ])
    )
  }

  // ---- XP info, next to the XP bar
  if (on(s, 'xpinfo')) {
    const side = opt<string>(s, 'xpinfo', 'side') ?? 'right'
    const showPercent = opt<boolean>(s, 'xpinfo', 'showPercent') !== false
    const color = jsonUiColor(opt<string>(s, 'xpinfo', 'color') ?? '#80ff20')
    const place =
      side === 'left'
        ? { anchor_from: 'top_left', anchor_to: 'top_right', offset: [-4, -1] }
        : side === 'above'
          ? { anchor_from: 'top_middle', anchor_to: 'bottom_middle', offset: [0, -10] }
          : { anchor_from: 'top_right', anchor_to: 'top_left', offset: [4, -1] }
    // Level and progress come from the same global bindings the vanilla bar uses.
    // The percentage is worked out in JSON UI: progress * 100 minus its fractional part.
    const textExpr = showPercent
      ? "('Lv ' + #level_number + '  ' + ((#exp_progress * 100) - ((#exp_progress * 100) % 1)) + '%')"
      : "('Lv ' + #level_number)"
    hud.mc_xp_info = {
      type: 'label',
      ...place,
      layer: 8,
      localize: false,
      shadow: true,
      color,
      text: '#mc_xp_text',
      bindings: [
        { binding_name: '#level_number', binding_type: 'global' },
        { binding_name: '#exp_progress', binding_type: 'global' },
        { binding_type: 'view', source_property_name: textExpr, target_property_name: '#mc_xp_text' },
        { binding_name: '#hotbar_with_xp_bar', binding_name_override: '#visible' }
      ]
    }
    hud.exp_progress_bar_and_hotbar = { modifications: [insertBack([{ 'mc_xp_info@hud.mc_xp_info': {} }])] }
  }

  if (mine.length > 0) {
    hud.master_client_hud = { type: 'panel', size: ['100%', '100%'], layer: 1, controls: mine }
    rootMods.push(insertBack([{ 'master_client_hud@hud.master_client_hud': {} }]))
  }
  if (rootMods.length > 0) hud.root_panel = { modifications: rootMods }

  if (Object.keys(hud).length > 1) files.set('ui/hud_screen.json', json(hud))

  // ---- Stack counts (Item counter)
  if (on(s, 'itemcounter')) {
    files.set(
      'ui/ui_common.json',
      json({
        namespace: 'common',
        stack_count_label: {
          color: jsonUiColor(opt<string>(s, 'itemcounter', 'color') ?? '#ffffff'),
          shadow: opt<boolean>(s, 'itemcounter', 'shadow') !== false,
          font_scale_factor: opt<number>(s, 'itemcounter', 'scale') ?? 1
        }
      })
    )
  }

  // ---- Pause-screen player list
  if (on(s, 'playerlist')) {
    files.set(
      'ui/pause_screen.json',
      json({
        namespace: 'pause',
        players_label: { color: jsonUiColor(opt<string>(s, 'playerlist', 'titleColor') ?? '#ffffff') },
        player_grid_item: {
          modifications: [
            {
              array_name: 'controls',
              operation: 'insert_front',
              value: [
                {
                  mc_row_tint: {
                    type: 'image',
                    texture: 'textures/master_client/white',
                    color: jsonUiColor(opt<string>(s, 'playerlist', 'rowColor') ?? '#7c5cff'),
                    alpha: opt<number>(s, 'playerlist', 'rowOpacity') ?? 0.25,
                    size: ['100%', '100% - 2px'],
                    layer: 0
                  }
                }
              ]
            }
          ]
        }
      })
    )
  }
}
