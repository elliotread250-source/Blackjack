import { loadPixelFont, buildFontBinary, textWidth } from '../../src/ui/font';
(window as unknown as Record<string, unknown>).bfFont = { loadPixelFont, buildFontBinary, textWidth };
