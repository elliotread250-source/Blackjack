import type { CSSProperties } from 'react'
import { FONTS, STYLE_PRESETS, fontCss, rgba } from '@shared/hud'
import type { HudStyle } from '@shared/types'

export { FONTS, STYLE_PRESETS }

export function panelPreviewStyle(s: Omit<HudStyle, 'preset'>): CSSProperties {
  return {
    fontFamily: fontCss(s.font),
    color: s.textColor,
    background: s.bgOpacity > 0 ? rgba(s.bgColor, Math.max(s.bgOpacity, 0.15)) : 'transparent',
    border: s.borderWidth > 0 ? `1px solid ${s.borderColor}` : '1px solid transparent',
    borderRadius: Math.min(s.radius, 6),
    textShadow: s.shadow ? '1px 1px 0 rgba(0,0,0,0.6)' : 'none'
  }
}
