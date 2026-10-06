import {
  Activity, Aperture, ArrowDownUp, Box, CloudFog, Cpu, Crosshair, Eye, Flame, FlaskConical, Gauge, Gem, Grid3x3, Hand, HandMetal, Hash,
  Keyboard, Lightbulb, ListOrdered, MapPin, MessageSquare, Moon, MousePointerClick, MoveVertical, Palette, PersonStanding, Repeat, RotateCcw,
  Ruler, Scaling, Scan, Shield, Skull, Sparkle, Sparkles, SquareDashed, SunMoon, Swords, Tag, Target, Users, Wifi, Wind, ZoomIn,
  type LucideIcon
} from 'lucide-react'

const ICONS: Record<string, LucideIcon> = {
  gauge: Gauge,
  'flask-conical': FlaskConical,
  ruler: Ruler,
  wifi: Wifi,
  'arrow-down-up': ArrowDownUp,
  'person-standing': PersonStanding,
  'list-ordered': ListOrdered,
  'message-square': MessageSquare,
  skull: Skull,
  keyboard: Keyboard,
  users: Users,
  hash: Hash,
  activity: Activity,
  'mouse-pointer-click': MousePointerClick,
  shield: Shield,
  'map-pin': MapPin,
  cpu: Cpu,
  'zoom-in': ZoomIn,
  hand: Hand,
  sparkles: Sparkles,
  'sun-moon': SunMoon,
  repeat: Repeat,
  aperture: Aperture,
  wind: Wind,
  'rotate-ccw': RotateCcw,
  target: Target,
  'move-vertical': MoveVertical,
  flame: Flame,
  box: Box,
  'hand-metal': HandMetal,
  sparkle: Sparkle,
  palette: Palette,
  lightbulb: Lightbulb,
  scaling: Scaling,
  eye: Eye,
  scan: Scan,
  moon: Moon,
  'cloud-fog': CloudFog,
  crosshair: Crosshair,
  gem: Gem,
  'grid-3x3': Grid3x3,
  swords: Swords,
  'square-dashed': SquareDashed,
  tag: Tag
}

export function ModuleIcon({ name, size = 18, className }: { name: string; size?: number; className?: string }) {
  const Icon = ICONS[name] ?? Box
  return <Icon size={size} className={className} strokeWidth={1.8} />
}
