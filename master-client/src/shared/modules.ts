import { ALL_STYLE, BG_ONLY, NO_STYLE, TEXT_ONLY } from './hud'
import type { ModuleDef, OptionDef } from './types'

// The single source of truth for every HUD and Visuals module: which engine
// delivers it, whether it can exist on Bedrock at all, and what it can be set to.
// The launcher UI, the overlay menu, the HUD editor and the pack engine all read this.

const fogDimension = (dim: string, label: string, start: number, end: number, color: string, unit: string, max: number): OptionDef[] => [
  { key: `${dim}Heading`, label, type: 'heading' },
  { key: `${dim}Enabled`, label: `Override ${label.toLowerCase()} fog`, type: 'toggle', default: dim !== 'nether' },
  { key: `${dim}Start`, label: 'Fog starts at', type: 'slider', min: 0, max, step: max > 1 ? 1 : 0.01, default: start, unit, showIf: { key: `${dim}Enabled`, equals: true } },
  { key: `${dim}End`, label: 'Fully fogged at', type: 'slider', min: 0, max, step: max > 1 ? 1 : 0.01, default: end, unit, showIf: { key: `${dim}Enabled`, equals: true } },
  { key: `${dim}Color`, label: 'Fog colour', type: 'color', default: color, showIf: { key: `${dim}Enabled`, equals: true } }
]

// 15x15 crosshair, '#' = filled. A plain plus sign to start.
const PLUS_CROSSHAIR = [
  '...............',
  '...............',
  '...............',
  '.......#.......',
  '.......#.......',
  '.......#.......',
  '.......#.......',
  '...####.####...',
  '.......#.......',
  '.......#.......',
  '.......#.......',
  '.......#.......',
  '...............',
  '...............',
  '...............'
]

export const MODULES: ModuleDef[] = [
  // ---------------------------------------------------------------- HUD
  {
    id: 'speed',
    name: 'Speed display',
    category: 'hud',
    engines: ['none'],
    available: 'no',
    reason: 'Needs your position every tick, which only exists in game memory.',
    description: 'Blocks per second while moving.',
    icon: 'gauge',
    options: []
  },
  {
    id: 'potion',
    name: 'Potion HUD',
    category: 'hud',
    engines: ['pack'],
    available: 'yes',
    description: 'Moves the vanilla status effect icons wherever you want them.',
    note: 'The icons themselves are drawn by the game, so the style panel only changes the box behind them.',
    icon: 'flask-conical',
    options: [],
    hud: {
      onHud: true,
      movable: true,
      resizable: false,
      base: { w: 180, h: 110 },
      defaultPos: { x: 0.885, y: 0.03, scale: 1 },
      minScale: 1,
      maxScale: 1,
      style: BG_ONLY,
      sizeNote: 'Icon size is fixed by the game.'
    }
  },
  {
    id: 'reach',
    name: 'Reach display',
    category: 'hud',
    engines: ['none'],
    available: 'no',
    reason: 'Reads combat data from the game. Not built.',
    description: 'Distance of your last hit.',
    icon: 'ruler',
    options: []
  },
  {
    id: 'ping',
    name: 'Ping',
    category: 'hud',
    engines: ['overlay'],
    available: 'yes',
    badge: 'Server ping (external)',
    description: 'Round trip to the server address you enter, measured by Master Client itself with the same status ping the server list uses.',
    note: 'This is not your in-game connection latency. It is a separate ping from your PC to the server.',
    icon: 'wifi',
    options: [
      { key: 'interval', label: 'Ping every', type: 'slider', min: 1, max: 10, step: 1, default: 2, unit: 's' },
      { key: 'showLabel', label: 'Show "Server ping (external)" label', type: 'toggle', default: true },
      { key: 'colorCode', label: 'Colour by latency', type: 'toggle', default: true }
    ],
    hud: {
      onHud: true,
      movable: true,
      resizable: true,
      base: { w: 200, h: 36 },
      defaultPos: { x: 0.006, y: 0.205, scale: 1 },
      minScale: 0.5,
      maxScale: 3,
      style: ALL_STYLE
    }
  },
  {
    id: 'packets',
    name: 'Packet display',
    category: 'hud',
    engines: ['none'],
    available: 'no',
    reason: 'Needs to intercept game network traffic. Not built.',
    description: 'Packets sent and received per second.',
    icon: 'arrow-down-up',
    options: []
  },
  {
    id: 'paperdoll',
    name: 'Paper doll',
    category: 'hud',
    engines: ['pack'],
    available: 'yes',
    description: 'Moves and resizes the little player model.',
    vanilla: { setting: 'Show Paper Doll', steps: 'Settings > Video > turn on "Show Paper Doll".' },
    icon: 'person-standing',
    options: [],
    hud: {
      onHud: true,
      movable: true,
      resizable: true,
      base: { w: 70, h: 100 },
      defaultPos: { x: 0.01, y: 0.02, scale: 1 },
      minScale: 0.5,
      maxScale: 3,
      style: BG_ONLY
    }
  },
  {
    id: 'scoreboard',
    name: 'Scoreboard',
    category: 'hud',
    engines: ['pack'],
    available: 'yes',
    description: 'Moves the sidebar scoreboard and recolours its text.',
    icon: 'list-ordered',
    options: [
      { key: 'hideNumbers', label: 'Hide score numbers', type: 'toggle', default: false },
      { key: 'nameColor', label: 'Name colour', type: 'color', default: '#ffffff' },
      { key: 'scoreColor', label: 'Score colour', type: 'color', default: '#ff5555' }
    ],
    hud: {
      onHud: true,
      movable: true,
      resizable: false,
      base: { w: 190, h: 230 },
      defaultPos: { x: 0.895, y: 0.36, scale: 1 },
      minScale: 1,
      maxScale: 1,
      style: { ...TEXT_ONLY, textColor: false },
      sizeNote: 'Text size follows your GUI scale.'
    }
  },
  {
    id: 'chat',
    name: 'Chat',
    category: 'hud',
    engines: ['pack'],
    available: 'yes',
    description: 'Moves chat and sets its width, background and how many lines it keeps.',
    note: 'Font size stays in Minecraft: Settings > Chat.',
    icon: 'message-square',
    options: [
      { key: 'width', label: 'Width', type: 'slider', min: 20, max: 80, step: 1, default: 40, unit: '%' },
      { key: 'lines', label: 'Lines kept', type: 'slider', min: 3, max: 50, step: 1, default: 20 },
      { key: 'bgOpacity', label: 'Background opacity', type: 'slider', min: 0, max: 1, step: 0.05, default: 0.5, format: 'percent' }
    ],
    hud: {
      onHud: true,
      movable: true,
      resizable: false,
      base: { w: 768, h: 240 },
      defaultPos: { x: 0.004, y: 0.42, scale: 1 },
      minScale: 1,
      maxScale: 1,
      style: { ...ALL_STYLE, background: false, border: false, radius: false },
      sizeNote: 'Use the Width slider in the gear panel.'
    }
  },
  {
    id: 'bossbar',
    name: 'Boss bar',
    category: 'hud',
    engines: ['pack'],
    available: 'yes',
    description: 'Moves the boss health bars.',
    icon: 'skull',
    options: [],
    hud: {
      onHud: true,
      movable: true,
      resizable: false,
      base: { w: 364, h: 44 },
      defaultPos: { x: 0.405, y: 0.01, scale: 1 },
      minScale: 1,
      maxScale: 1,
      style: BG_ONLY,
      sizeNote: 'Bar size is fixed by the game.'
    }
  },
  {
    id: 'keystrokes',
    name: 'Keystrokes',
    category: 'hud',
    engines: ['overlay'],
    available: 'yes',
    description: 'Shows your movement keys and mouse buttons as you press them.',
    note: 'Reads only the keys you bind here, from your own keyboard and mouse. Nothing is logged or sent anywhere.',
    icon: 'keyboard',
    options: [
      { key: 'forward', label: 'Forward', type: 'key', default: 'W' },
      { key: 'left', label: 'Left', type: 'key', default: 'A' },
      { key: 'back', label: 'Back', type: 'key', default: 'S' },
      { key: 'right', label: 'Right', type: 'key', default: 'D' },
      { key: 'jump', label: 'Jump', type: 'key', default: 'Space' },
      { key: 'sneak', label: 'Sneak', type: 'key', default: 'Shift' },
      { key: 'showMouse', label: 'Show LMB / RMB', type: 'toggle', default: true },
      { key: 'showSpace', label: 'Show Space and Shift', type: 'toggle', default: true },
      { key: 'showCps', label: 'CPS inside mouse buttons', type: 'toggle', default: true },
      { key: 'pressColor', label: 'Pressed colour', type: 'color', default: '#ffffff' },
      { key: 'fade', label: 'Release fade', type: 'slider', min: 0, max: 400, step: 10, default: 120, unit: 'ms' }
    ],
    hud: {
      onHud: true,
      movable: true,
      resizable: true,
      base: { w: 186, h: 222 },
      defaultPos: { x: 0.006, y: 0.6, scale: 1 },
      minScale: 0.5,
      maxScale: 3,
      style: ALL_STYLE
    }
  },
  {
    id: 'playerlist',
    name: 'Player list',
    category: 'hud',
    engines: ['pack'],
    available: 'yes',
    description: 'Restyles the player list on the pause screen.',
    note: 'Bedrock shows players on the pause screen, so this one has no HUD position.',
    icon: 'users',
    options: [
      { key: 'rowColor', label: 'Row tint', type: 'color', default: '#7c5cff' },
      { key: 'rowOpacity', label: 'Row tint opacity', type: 'slider', min: 0, max: 1, step: 0.05, default: 0.25, format: 'percent' },
      { key: 'titleColor', label: '"Players" title colour', type: 'color', default: '#ffffff' }
    ],
    hud: {
      onHud: false,
      movable: false,
      resizable: false,
      base: { w: 0, h: 0 },
      defaultPos: { x: 0, y: 0, scale: 1 },
      minScale: 1,
      maxScale: 1,
      style: NO_STYLE
    }
  },
  {
    id: 'itemcounter',
    name: 'Item counter',
    category: 'hud',
    engines: ['pack'],
    available: 'partial',
    reason: 'Inventory-wide totals (arrows, pearls, totems) aren\'t exposed to JSON UI, so only stack counts can be restyled.',
    description: 'Restyles the stack count numbers on your hotbar and in inventories.',
    icon: 'hash',
    options: [
      { key: 'color', label: 'Count colour', type: 'color', default: '#ffffff' },
      { key: 'shadow', label: 'Text shadow', type: 'toggle', default: true },
      { key: 'scale', label: 'Text size', type: 'slider', min: 0.6, max: 1.6, step: 0.05, default: 1, unit: 'x' }
    ],
    hud: {
      onHud: false,
      movable: false,
      resizable: false,
      base: { w: 0, h: 0 },
      defaultPos: { x: 0, y: 0, scale: 1 },
      minScale: 1,
      maxScale: 1,
      style: NO_STYLE
    }
  },
  {
    id: 'fps',
    name: 'FPS',
    category: 'hud',
    engines: ['overlay'],
    available: 'yes',
    description: 'Frames per second for Minecraft, measured by PresentMon from Windows frame events.',
    note: 'Windows only lets admins or the Performance Log Users group read frame events. Master Client can add you to that group once.',
    icon: 'activity',
    options: [
      { key: 'showFrameTime', label: 'Show frame time', type: 'toggle', default: false },
      { key: 'smoothing', label: 'Averaging window', type: 'slider', min: 0.25, max: 2, step: 0.25, default: 1, unit: 's' }
    ],
    hud: {
      onHud: true,
      movable: true,
      resizable: true,
      base: { w: 130, h: 36 },
      defaultPos: { x: 0.006, y: 0.125, scale: 1 },
      minScale: 0.5,
      maxScale: 3,
      style: ALL_STYLE
    }
  },
  {
    id: 'cps',
    name: 'CPS',
    category: 'hud',
    engines: ['overlay'],
    available: 'yes',
    description: 'Clicks per second from your own mouse.',
    icon: 'mouse-pointer-click',
    options: [
      {
        key: 'mode',
        label: 'Show',
        type: 'select',
        default: 'both',
        choices: [
          { value: 'both', label: 'Left | Right' },
          { value: 'left', label: 'Left only' },
          { value: 'right', label: 'Right only' }
        ]
      }
    ],
    hud: {
      onHud: true,
      movable: true,
      resizable: true,
      base: { w: 150, h: 36 },
      defaultPos: { x: 0.006, y: 0.165, scale: 1 },
      minScale: 0.5,
      maxScale: 3,
      style: ALL_STYLE
    }
  },
  {
    id: 'armor',
    name: 'Armor HUD',
    category: 'hud',
    engines: ['pack'],
    available: 'partial',
    reason: 'The HUD has no binding for equipped armour, so per-slot items and durability can\'t be shown. The armour bar can be moved.',
    description: 'Moves the vanilla armour points bar.',
    icon: 'shield',
    options: [],
    hud: {
      onHud: true,
      movable: true,
      resizable: false,
      base: { w: 164, h: 20 },
      defaultPos: { x: 0.31, y: 0.86, scale: 1 },
      minScale: 1,
      maxScale: 1,
      style: BG_ONLY,
      sizeNote: 'Armour icons are drawn at a fixed size.'
    }
  },
  {
    id: 'coords',
    name: 'Coordinates',
    category: 'hud',
    engines: ['vanilla', 'pack'],
    available: 'yes',
    description: 'Moves and restyles the vanilla coordinates readout.',
    vanilla: {
      setting: 'Show Coordinates',
      steps: 'Pause > Settings > Game > World > turn on "Show Coordinates". On servers, the server decides.'
    },
    icon: 'map-pin',
    options: [],
    hud: {
      onHud: true,
      movable: true,
      resizable: true,
      base: { w: 300, h: 34 },
      defaultPos: { x: 0.006, y: 0.085, scale: 1 },
      minScale: 0.5,
      maxScale: 2.5,
      style: ALL_STYLE
    }
  },
  {
    id: 'debug',
    name: 'Debug menu',
    category: 'hud',
    engines: ['overlay'],
    available: 'yes',
    description: 'One panel with FPS, frame time, server ping, CPS and your PC\'s CPU, GPU and RAM use.',
    note: 'Everything here comes from Windows and your own input. Nothing is read from the game.',
    icon: 'cpu',
    options: [
      { key: 'fps', label: 'FPS', type: 'toggle', default: true },
      { key: 'frametime', label: 'Frame time', type: 'toggle', default: true },
      { key: 'ping', label: 'Server ping', type: 'toggle', default: true },
      { key: 'cps', label: 'CPS', type: 'toggle', default: true },
      { key: 'cpu', label: 'CPU', type: 'toggle', default: true },
      { key: 'gpu', label: 'GPU', type: 'toggle', default: true },
      { key: 'ram', label: 'RAM', type: 'toggle', default: true }
    ],
    hud: {
      onHud: true,
      movable: true,
      resizable: true,
      base: { w: 270, h: 200 },
      defaultPos: { x: 0.85, y: 0.62, scale: 1 },
      minScale: 0.5,
      maxScale: 2.5,
      style: ALL_STYLE
    }
  },

  // ---------------------------------------------------------------- VISUALS
  {
    id: 'zoom',
    name: 'Zoom',
    category: 'visuals',
    engines: ['overlay'],
    available: 'yes',
    description: 'Magnifies the middle of your screen while you hold (or toggle) a key.',
    note: 'Works from a screen capture, so the zoomed image is a frame behind. Scrolling to zoom also reaches the game, which changes your hotbar slot.',
    icon: 'zoom-in',
    options: [
      { key: 'key', label: 'Zoom key', type: 'key', default: 'C' },
      {
        key: 'mode',
        label: 'Mode',
        type: 'select',
        default: 'hold',
        choices: [
          { value: 'hold', label: 'Hold' },
          { value: 'toggle', label: 'Toggle' }
        ]
      },
      { key: 'level', label: 'Zoom level', type: 'slider', min: 1.5, max: 10, step: 0.5, default: 4, unit: 'x' },
      { key: 'scroll', label: 'Scroll to adjust while zoomed', type: 'toggle', default: true },
      { key: 'smooth', label: 'Smooth zoom', type: 'toggle', default: true },
      {
        key: 'shape',
        label: 'Shape',
        type: 'select',
        default: 'full',
        choices: [
          { value: 'full', label: 'Full screen' },
          { value: 'lens', label: 'Round lens' }
        ]
      },
      { key: 'lensSize', label: 'Lens size', type: 'slider', min: 20, max: 90, step: 5, default: 50, unit: '%', showIf: { key: 'shape', equals: 'lens' } }
    ]
  },
  {
    id: 'viewmodel',
    name: 'View model',
    category: 'visuals',
    engines: ['pack'],
    available: 'yes',
    description: 'Moves, rotates and scales the item in your hand in first person.',
    icon: 'hand',
    options: [
      { key: 'x', label: 'Left / right', type: 'slider', min: -12, max: 12, step: 0.5, default: 0 },
      { key: 'y', label: 'Up / down', type: 'slider', min: -12, max: 12, step: 0.5, default: 0 },
      { key: 'z', label: 'Near / far', type: 'slider', min: -12, max: 12, step: 0.5, default: 0 },
      { key: 'rx', label: 'Pitch', type: 'slider', min: -90, max: 90, step: 1, default: 0, unit: '°' },
      { key: 'ry', label: 'Yaw', type: 'slider', min: -90, max: 90, step: 1, default: 0, unit: '°' },
      { key: 'rz', label: 'Roll', type: 'slider', min: -90, max: 90, step: 1, default: 0, unit: '°' },
      { key: 'scale', label: 'Scale', type: 'slider', min: 0.3, max: 1.6, step: 0.05, default: 1, unit: 'x' }
    ]
  },
  {
    id: 'xpinfo',
    name: 'XP info',
    category: 'visuals',
    engines: ['pack'],
    available: 'yes',
    description: 'Shows your level and progress to the next level next to the XP bar.',
    icon: 'sparkles',
    options: [
      { key: 'showPercent', label: 'Show progress %', type: 'toggle', default: true },
      {
        key: 'side',
        label: 'Position',
        type: 'select',
        default: 'right',
        choices: [
          { value: 'right', label: 'Right of the bar' },
          { value: 'left', label: 'Left of the bar' },
          { value: 'above', label: 'Above the bar' }
        ]
      },
      { key: 'color', label: 'Text colour', type: 'color', default: '#80ff20' }
    ]
  },
  {
    id: 'timechanger',
    name: 'Time changer',
    category: 'visuals',
    engines: ['behavior'],
    available: 'yes',
    ownWorldsOnly: true,
    description: 'Locks the time of day in your own worlds.',
    note: 'Turn on "Master Client World Tweaks" in a world\'s Behavior Packs. Adding a behaviour pack turns off achievements for that world.',
    icon: 'sun-moon',
    options: [
      { key: 'time', label: 'Time of day', type: 'slider', min: 0, max: 23999, step: 100, default: 6000, format: 'time' },
      { key: 'lock', label: 'Keep it there', type: 'toggle', default: true }
    ]
  },
  {
    id: 'snaplook',
    name: 'Snap look',
    category: 'visuals',
    engines: ['vanilla'],
    available: 'yes',
    description: 'Flip to the front or back camera.',
    vanilla: {
      setting: 'Toggle Perspective',
      steps: 'Press F5 in game, or rebind it in Settings > Keyboard & Mouse > Toggle Perspective. Master Client never presses keys for you.'
    },
    icon: 'repeat',
    options: []
  },
  {
    id: 'postprocessing',
    name: 'Post processing',
    category: 'visuals',
    engines: ['vanilla'],
    available: 'yes',
    description: 'Graphics mode and Vibrant Visuals.',
    vanilla: { setting: 'Graphics Mode', steps: 'Settings > Video > Graphics Mode: Simple, Fancy or Vibrant Visuals.' },
    icon: 'aperture',
    options: []
  },
  {
    id: 'motionblur',
    name: 'Motion blur',
    category: 'visuals',
    engines: ['none'],
    available: 'no',
    reason: 'No supported hook. Bedrock packs can\'t add screen effects under RenderDragon.',
    description: 'Blurs fast camera movement.',
    icon: 'wind',
    options: []
  },
  {
    id: 'nodeathrot',
    name: 'No death rotation',
    category: 'visuals',
    engines: ['none'],
    available: 'no',
    reason: 'The death tilt is applied by the engine, not by an animation a pack can override.',
    description: 'Stops dying mobs from tipping over.',
    icon: 'rotate-ccw',
    options: []
  },
  {
    id: 'projectiles',
    name: 'Projectile scalar',
    category: 'visuals',
    engines: ['pack'],
    available: 'yes',
    description: 'Visual size of thrown and shot projectiles. Hitboxes don\'t change.',
    icon: 'target',
    options: [
      { key: 'arrow', label: 'Arrows', type: 'slider', min: 0.25, max: 3, step: 0.05, default: 1, unit: 'x' },
      { key: 'trident', label: 'Tridents', type: 'slider', min: 0.25, max: 3, step: 0.05, default: 1, unit: 'x' },
      { key: 'pearl', label: 'Ender pearls', type: 'slider', min: 0.25, max: 3, step: 0.05, default: 1, unit: 'x' },
      { key: 'snowball', label: 'Snowballs', type: 'slider', min: 0.25, max: 3, step: 0.05, default: 1, unit: 'x' },
      { key: 'egg', label: 'Eggs', type: 'slider', min: 0.25, max: 3, step: 0.05, default: 1, unit: 'x' }
    ]
  },
  {
    id: 'viewbobbing',
    name: 'Minimal view bobbing',
    category: 'visuals',
    engines: ['vanilla'],
    available: 'yes',
    description: 'Less camera sway while walking and when hit.',
    vanilla: { setting: 'View Bobbing, Camera Shake', steps: 'Settings > Video > turn off "View Bobbing" and "Camera Shake".' },
    icon: 'move-vertical',
    options: []
  },
  {
    id: 'lowfire',
    name: 'Low fire',
    category: 'visuals',
    engines: ['pack'],
    available: 'yes',
    description: 'Shorter, fainter fire on your screen when you\'re burning.',
    note: 'Also changes the flames on burning mobs, since Bedrock uses one texture for both.',
    icon: 'flame',
    options: [
      { key: 'height', label: 'Flame height', type: 'slider', min: 10, max: 100, step: 5, default: 40, unit: '%' },
      { key: 'opacity', label: 'Flame opacity', type: 'slider', min: 10, max: 100, step: 5, default: 70, unit: '%' }
    ]
  },
  {
    id: 'hitboxes',
    name: 'Hitboxes',
    category: 'visuals',
    engines: ['none'],
    available: 'no',
    reason: 'Needs entity positions and sizes from game memory.',
    description: 'Outlines entity hitboxes.',
    icon: 'box',
    options: []
  },
  {
    id: 'lefthand',
    name: 'Left hand',
    category: 'visuals',
    engines: ['none'],
    available: 'no',
    reason: 'Packs can move the first-person arm but can\'t mirror the model or its swing, so it would look broken.',
    description: 'Holds items in your left hand in first person.',
    icon: 'hand-metal',
    options: []
  },
  {
    id: 'hitparticles',
    name: 'Hit particles',
    category: 'visuals',
    engines: ['pack'],
    available: 'yes',
    description: 'Recolours and resizes critical hit particles.',
    icon: 'sparkle',
    options: [
      { key: 'color', label: 'Crit colour', type: 'color', default: '#ffd84d' },
      { key: 'magicColor', label: 'Enchanted crit colour', type: 'color', default: '#7cf2ff' },
      { key: 'size', label: 'Size', type: 'slider', min: 0.5, max: 3, step: 0.1, default: 1, unit: 'x' },
      { key: 'amount', label: 'Amount', type: 'slider', min: 0.25, max: 2, step: 0.25, default: 1, unit: 'x' }
    ]
  },
  {
    id: 'hitcolor',
    name: 'Hit color',
    category: 'visuals',
    engines: ['pack'],
    available: 'yes',
    description: 'Changes the red flash when a player or mob is hurt.',
    note: 'Overrides vanilla render controllers. If a Bedrock update changes them, turn this off until Master Client updates.',
    icon: 'palette',
    options: [
      { key: 'color', label: 'Hurt colour', type: 'color', default: '#3d7bff' },
      { key: 'opacity', label: 'Strength', type: 'slider', min: 0.1, max: 1, step: 0.05, default: 0.5, format: 'percent' },
      {
        key: 'targets',
        label: 'Apply to',
        type: 'select',
        default: 'players',
        choices: [
          { value: 'players', label: 'Players' },
          { value: 'all', label: 'Players and common mobs' }
        ]
      }
    ]
  },
  {
    id: 'fullbright',
    name: 'Full bright',
    category: 'visuals',
    engines: ['vanilla', 'pack', 'behavior'],
    available: 'yes',
    description: 'See in the dark. Brightness slider everywhere, brighter ambient light with Vibrant Visuals, and real night vision in your own worlds.',
    note: 'On servers in Simple or Fancy graphics, the brightness slider is as far as an Add-On can go.',
    vanilla: { setting: 'Brightness', steps: 'Settings > Video > Brightness to 100%.' },
    icon: 'lightbulb',
    options: [
      { key: 'ambientBoost', label: 'Brighter ambient light (Vibrant Visuals)', type: 'toggle', default: true, help: 'Only applies with Graphics Mode set to Vibrant Visuals. Servers that force their own packs can override it.' },
      { key: 'ambientLevel', label: 'Ambient light', type: 'slider', min: 0.05, max: 1, step: 0.05, default: 0.6, format: 'percent', showIf: { key: 'ambientBoost', equals: true } },
      { key: 'nightVision', label: 'Night vision in my own worlds', type: 'toggle', default: false, help: 'Own worlds only. Uses the Master Client World Tweaks behaviour pack.' }
    ]
  },
  {
    id: 'guiscale',
    name: 'GUI scale',
    category: 'visuals',
    engines: ['vanilla'],
    available: 'yes',
    description: 'Size of the HUD and menus.',
    vanilla: { setting: 'GUI Scale Modifier', steps: 'Settings > Video > GUI Scale Modifier.' },
    icon: 'scaling',
    options: []
  },
  {
    id: 'freelook',
    name: 'Free look',
    category: 'visuals',
    engines: ['none'],
    available: 'no',
    reason: 'Needs to control the camera through game memory.',
    description: 'Look around without turning.',
    icon: 'eye',
    options: []
  },
  {
    id: 'fov',
    name: 'FOV changer',
    category: 'visuals',
    engines: ['vanilla'],
    available: 'yes',
    description: 'Field of view.',
    vanilla: { setting: 'Field of View', steps: 'Settings > Video > Field of View. Turn off "FOV Can Be Altered by Gameplay" to stop sprint zoom.' },
    icon: 'scan',
    options: []
  },
  {
    id: 'darkmode',
    name: 'Dark mode',
    category: 'visuals',
    engines: ['pack'],
    available: 'yes',
    description: 'Dark menus, inventories and buttons, edged with your accent colour.',
    icon: 'moon',
    options: [
      { key: 'useAccent', label: 'Use launcher accent', type: 'toggle', default: true },
      { key: 'accent', label: 'Accent', type: 'color', default: '#7c5cff', showIf: { key: 'useAccent', equals: false } },
      { key: 'shade', label: 'Panel darkness', type: 'slider', min: 0.5, max: 1, step: 0.05, default: 0.85, format: 'percent' }
    ]
  },
  {
    id: 'fog',
    name: 'Fog',
    category: 'visuals',
    engines: ['pack'],
    available: 'yes',
    description: 'Fog distance and colour for each dimension.',
    icon: 'cloud-fog',
    options: [
      ...fogDimension('overworld', 'Overworld', 0.92, 1, '#abd2ff', '× render', 1),
      ...fogDimension('nether', 'Nether', 10, 96, '#330808', ' blocks', 256),
      ...fogDimension('end', 'End', 30, 160, '#0b080c', ' blocks', 256)
    ]
  },
  {
    id: 'crosshair',
    name: 'Crosshair',
    category: 'visuals',
    engines: ['pack', 'overlay'],
    available: 'yes',
    description: 'Draw your own crosshair texture, or add an overlay crosshair on top.',
    icon: 'crosshair',
    options: [
      { key: 'texture', label: 'Crosshair texture', type: 'heading' },
      { key: 'customTexture', label: 'Use my texture in game', type: 'toggle', default: true },
      { key: 'pixels', label: 'Pixels', type: 'pixels', default: PLUS_CROSSHAIR, showIf: { key: 'customTexture', equals: true } },
      { key: 'textureColor', label: 'Texture colour', type: 'color', default: '#ffffff', showIf: { key: 'customTexture', equals: true } },
      { key: 'overlayHeading', label: 'Overlay crosshair', type: 'heading' },
      { key: 'overlay', label: 'Show overlay crosshair', type: 'toggle', default: false },
      { key: 'color', label: 'Colour', type: 'color', default: '#00ff88', showIf: { key: 'overlay', equals: true } },
      { key: 'size', label: 'Arm length', type: 'slider', min: 2, max: 40, step: 1, default: 8, unit: 'px', showIf: { key: 'overlay', equals: true } },
      { key: 'gap', label: 'Gap', type: 'slider', min: 0, max: 20, step: 1, default: 3, unit: 'px', showIf: { key: 'overlay', equals: true } },
      { key: 'thickness', label: 'Thickness', type: 'slider', min: 1, max: 8, step: 1, default: 2, unit: 'px', showIf: { key: 'overlay', equals: true } },
      { key: 'outline', label: 'Outline', type: 'toggle', default: true, showIf: { key: 'overlay', equals: true } },
      { key: 'dot', label: 'Centre dot', type: 'toggle', default: false, showIf: { key: 'overlay', equals: true } }
    ]
  },
  {
    id: 'crystal',
    name: 'Crystal optimizer',
    category: 'visuals',
    engines: ['none'],
    available: 'no',
    reason: 'Changes how entity removal and hits are processed. Not built.',
    description: 'Removes end crystals client side on hit.',
    icon: 'gem',
    options: []
  },
  {
    id: 'chunkborders',
    name: 'Chunk borders',
    category: 'visuals',
    engines: ['none'],
    available: 'no',
    reason: 'No supported hook. Packs can\'t draw world-space lines.',
    description: 'Shows the edges of the chunk you\'re in.',
    icon: 'grid-3x3',
    options: []
  },
  {
    id: 'hitreg',
    name: 'Client-side hit register',
    category: 'visuals',
    engines: ['none'],
    available: 'no',
    reason: 'Changes hit registration. Not built.',
    description: 'Registers hits on your side first.',
    icon: 'swords',
    options: []
  },
  {
    id: 'blockoutline',
    name: 'Block outline',
    category: 'visuals',
    engines: ['vanilla'],
    available: 'yes',
    description: 'How the block you\'re looking at is highlighted.',
    note: 'Packs can\'t change the outline colour or thickness under RenderDragon, so this links to the setting Minecraft has.',
    vanilla: { setting: 'Outline Selection', steps: 'Settings > Video > "Outline Selection" switches between an outline and a filled highlight.' },
    icon: 'square-dashed',
    options: []
  },
  {
    id: 'nametags',
    name: 'Better name tags',
    category: 'visuals',
    engines: ['none'],
    available: 'no',
    reason: 'Name tags are drawn by the engine. Packs can\'t change their background or text shadow.',
    description: 'Name tag background and shadow.',
    icon: 'tag',
    options: []
  }
]

export const MODULE_BY_ID: Record<string, ModuleDef> = Object.fromEntries(MODULES.map((m) => [m.id, m]))

export function moduleDefaults(def: ModuleDef): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  for (const o of def.options) {
    if (o.type === 'heading') continue
    out[o.key] = Array.isArray(o.default) ? [...o.default] : o.default
  }
  return out
}

export function isAvailable(def: ModuleDef): boolean {
  return def.available !== 'no'
}

export const PACK_MODULE_IDS = MODULES.filter((m) => m.engines.includes('pack') && isAvailable(m)).map((m) => m.id)
export const OVERLAY_MODULE_IDS = MODULES.filter((m) => m.engines.includes('overlay') && isAvailable(m)).map((m) => m.id)
export const HUD_PLACEABLE_IDS = MODULES.filter((m) => m.hud?.onHud && isAvailable(m)).map((m) => m.id)

/** Does turning this module on/off or changing its options require regenerating packs? */
export function affectsPacks(id: string): boolean {
  const def = MODULE_BY_ID[id]
  return !!def && (def.engines.includes('pack') || def.engines.includes('behavior'))
}

export function formatTime(ticks: number): string {
  // Tick 0 is 06:00 in Minecraft.
  const minutes = Math.round(((ticks / 1000 + 6) % 24) * 60)
  const h = Math.floor(minutes / 60) % 24
  const m = minutes % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}
