// SVG drawings for the desktop surface, in a Tokyo Night neon palette.
// Palette values follow the Tokyo Night theme as shipped in claude-skins (MIT, hellosverre).
import { CRAB_STYLE, crabGroup } from './crabs'

// ---------------------------------------------------------------- palette

/** Tokyo Night (dark) for Ink `Text` colours, which cannot follow a light theme. */
export const NEON = {
  fg: '#c0caf5',
  muted: '#737aa2',
  blue: '#7aa2f7',
  cyan: '#7dcfff',
  purple: '#bb9af7',
  magenta: '#ff007c',
  teal: '#73daca',
  green: '#9ece6a',
  yellow: '#e0af68',
  orange: '#ff9e64',
  red: '#f7768e',
} as const

const DARK = {
  fg: '#c0caf5', muted: '#737aa2', track: '#292e42', tick: '#545c7e', tile: '#1f2335', border: '#3b4261',
  blue: '#7aa2f7', cyan: '#7dcfff', purple: '#bb9af7', teal: '#73daca', green: '#9ece6a', yellow: '#e0af68', orange: '#ff9e64', red: '#f7768e',
}
const LIGHT = {
  fg: '#3760bf', muted: '#848cb5', track: '#c4c8da', tick: '#a1a6c5', tile: '#d0d5e3', border: '#b4b9cf',
  blue: '#2e7de9', cyan: '#007197', purple: '#7847bd', teal: '#118c74', green: '#587539', yellow: '#8c6c3e', orange: '#b15c00', red: '#f52a65',
}
type Tone = keyof typeof DARK
const TONES = Object.keys(DARK) as Tone[]

const toneRules = (p: Record<Tone, string>) =>
  TONES.map(t => `.f-${t}{fill:${p[t]}}.s-${t}{stop-color:${p[t]}}.k-${t}{stroke:${p[t]}}`).join('')

/** One style block per SVG: colours for both themes, twinkle, pulse and the crab walk. */
const STYLE = [
  `text{font-family:'Segoe UI Variable','Segoe UI',system-ui,sans-serif;font-variant-numeric:tabular-nums}`,
  toneRules(LIGHT),
  `@media (prefers-color-scheme: dark){${toneRules(DARK)}}`,
  '.t0{animation:tw 2.2s ease-in-out infinite}.t1{animation:tw 2.8s ease-in-out infinite}',
  '.t2{animation:tw 1.9s ease-in-out infinite}.t3{animation:tw 3.3s ease-in-out infinite}',
  '.idle .t0,.idle .t1,.idle .t2,.idle .t3{animation-duration:4.4s}',
  '@keyframes tw{0%,100%{opacity:1}50%{opacity:.35}}',
  '.pulse{animation:pulse 1.6s ease-in-out infinite}',
  '@keyframes pulse{0%,100%{opacity:1}50%{opacity:.3}}',
  CRAB_STYLE,
].join('')

const GLOW = `<filter id="glow" x="-30%" y="-80%" width="160%" height="260%"><feGaussianBlur stdDeviation="1.6" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>`

const gradient = (id: string, from: Tone, to: Tone) =>
  `<linearGradient id="${id}" x1="0" x2="1" y1="0" y2="0"><stop offset="0" class="s-${from}"/><stop offset="1" class="s-${to}"/></linearGradient>`

const open = (width: number, height: number, extra = '') =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"><style>${STYLE}</style><defs>${GLOW}${extra}</defs>`

// ---------------------------------------------------------------- text

export const esc = (text: string) =>
  text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;')

const glyphWidth = (ch: string) =>
  /[ilIjtf.,:;|!'’]/.test(ch) ? 0.3 : /[mwMW@%]/.test(ch) ? 0.86 : /[A-ZÄÖÜ]/.test(ch) ? 0.66 : ch === ' ' ? 0.28 : 0.54

/** Rough rendered width of `text` at `fontPx`, enough to place and truncate labels. */
export const textWidth = (text: string, fontPx: number) => [...text].reduce((sum, ch) => sum + glyphWidth(ch), 0) * fontPx

/** `text` cut with an ellipsis so it fits `maxPx` at `fontPx`. */
export const fit = (text: string, maxPx: number, fontPx: number) => {
  if (textWidth(text, fontPx) <= maxPx) return text
  const chars = [...text]
  while (chars.length > 1 && textWidth(`${chars.join('')}…`, fontPx) > maxPx) chars.pop()
  return `${chars.join('').trimEnd()}…`
}

// ---------------------------------------------------------------- usage bars

export type Level = 'ok' | 'warn' | 'high' | 'none'
const LEVEL_TONES: Record<Level, [Tone, Tone]> = {
  ok: ['cyan', 'purple'],
  warn: ['yellow', 'orange'],
  high: ['orange', 'red'],
  none: ['muted', 'muted'],
}

export type MeterItem = { label: string; percent: number | null; level: Level; text: string }

/** Height of the meter row under the milestone bar. */
export const METER_ROW_H = 16

/**
 * Left space for the label ("M0", "5h:") shared by the milestone bar and the meter row, so all
 * bars start at the same x and end at the drawing's right edge.
 */
export const BAND_GUTTER = 34

/**
 * Meters side by side in exactly `width` pixels (the milestone bar's width): the first label sits
 * in the gutter, the first bar starts where the milestone track starts, the last bar ends where it
 * ends; each value is centred inside its bar.
 */
export const meterRowSvg = (width: number, items: readonly MeterItem[]) => {
  const gap = 8
  const barY = 2
  const barH = 12
  const innerLabels = items.slice(1).reduce((sum, it) => sum + gap + textWidth(it.label, 11) + 5, 0)
  const barW = Math.max(20, (width - BAND_GUTTER - innerLabels) / items.length)
  const defs = items.map((it, i) => gradient(`m${i}`, LEVEL_TONES[it.level][0], LEVEL_TONES[it.level][1])).join('')
  let cursor = 0
  const parts = items.map((it, i) => {
    const x = cursor
    const barX = i === 0 ? BAND_GUTTER : x + textWidth(it.label, 11) + 5
    cursor = barX + barW + gap
    const fill = it.percent === null ? 0 : Math.max(barH, (barW * Math.max(0, Math.min(100, it.percent))) / 100)
    return [
      `<text x="${x.toFixed(1)}" y="12.4" font-size="11" font-weight="600" class="f-muted">${esc(it.label)}</text>`,
      `<rect x="${barX.toFixed(1)}" y="${barY}" width="${barW.toFixed(1)}" height="${barH}" rx="6" class="f-track"/>`,
      fill > 0 ? `<rect x="${barX.toFixed(1)}" y="${barY}" width="${fill.toFixed(1)}" height="${barH}" rx="6" fill="url(#m${i})" filter="url(#glow)"/>` : '',
      `<text x="${(barX + barW / 2).toFixed(1)}" y="11.6" font-size="9.5" font-weight="500" letter-spacing="0.2" text-anchor="middle" fill="#ffffff" stroke="#1a1b26" stroke-width="0.9" stroke-opacity="0.45" paint-order="stroke">${esc(it.text)}</text>`,
    ].join('')
  })
  return [open(width, METER_ROW_H, defs), ...parts, `</svg>`].join('')
}

// ---------------------------------------------------------------- flow bar

export type FlowArgs = {
  width: number
  title: string
  done: number
  doing: number
  total: number
  label: string
  isFinished: boolean
  isWorking: boolean
}

const noise = (c: number, r: number) => {
  const v = Math.sin(c * 12.9898 + r * 78.233) * 43758.5453
  return v - Math.floor(v)
}

/** Height of the band's milestone bar; pass it to the Svg element together with the width. */
export const FLOW_H = 20

/** The milestone bar above the prompt: dot, short title, then the twinkling track with its pill. */
export const flowSvg = (a: FlowArgs) => {
  const H = FLOW_H
  const trackY = 4
  const trackH = 12
  const rows = 4
  // "M0 — Workspace & setup" reads as "M0" here; the full title is in the alt text.
  const code = /^(M\d+)\b/.exec(a.title)?.[1]
  const title = code ?? fit(a.title, BAND_GUTTER - 14, 12)
  const x0 = BAND_GUTTER
  const trackW = Math.max(40, a.width - x0)
  const fillW = a.total === 0 ? 0 : (trackW * a.done) / a.total
  const faintW = a.total === 0 ? 0 : (trackW * Math.min(a.total, a.done + a.doing)) / a.total

  const squares: string[] = []
  const cols = Math.floor(fillW / 3)
  for (let c = 0; c < cols; c += 1) {
    const density = 0.35 + 0.6 * Math.pow(c / Math.max(1, cols), 1.2)
    for (let r = 0; r < rows; r += 1) {
      if (noise(c, r) < density) {
        const tone = (['cyan', 'purple', 'blue'] as const)[Math.floor(noise(r, c) * 3)]
        squares.push(`<rect x="${(x0 + c * 3 + 0.5).toFixed(1)}" y="${trackY + 0.5 + r * 3}" width="2" height="2" class="f-${a.isFinished ? 'green' : tone} t${(c + r) % 4}"/>`)
      }
    }
  }
  const faint: string[] = []
  for (let c = cols; c < Math.floor(faintW / 3); c += 1) {
    for (let r = 0; r < rows; r += 1) {
      if (noise(c + 7, r + 3) < 0.22) {
        faint.push(`<rect x="${(x0 + c * 3 + 0.6).toFixed(1)}" y="${trackY + 0.6 + r * 3}" width="1.7" height="1.7" class="f-purple" opacity="0.5"/>`)
      }
    }
  }
  const ticks: string[] = []
  if (a.total > 1 && a.total <= 30) {
    for (let i = 1; i < a.total; i += 1) {
      const x = x0 + (trackW * i) / a.total
      if (x > x0 + fillW + 2) ticks.push(`<rect x="${(x - 0.6).toFixed(1)}" y="${trackY + 3}" width="1.2" height="6" rx="0.6" class="f-tick"/>`)
    }
  }
  const pillW = Math.round(12 + textWidth(a.label, 10))
  const pillX = Math.max(x0, Math.min(x0 + fillW - pillW, x0 + trackW - pillW))

  return [
    open(a.width, H, `${gradient('glowfill', 'purple', 'cyan')}${gradient('pill', a.isFinished ? 'green' : 'purple', a.isFinished ? 'teal' : 'blue')}<clipPath id="trk"><rect x="${x0}" y="${trackY}" width="${trackW}" height="${trackH}" rx="6"/></clipPath>`),
    `<g class="${a.isWorking ? '' : 'idle'}">`,
    `<circle cx="5" cy="10" r="3.5" class="${a.isFinished ? 'f-green' : 'f-cyan pulse'}" filter="url(#glow)"/>`,
    `<text x="13" y="14.2" font-size="12" font-weight="600" class="f-fg">${esc(title)}</text>`,
    `<rect x="${x0}" y="${trackY}" width="${trackW}" height="${trackH}" rx="6" class="f-track"/>`,
    `<g clip-path="url(#trk)">`,
    fillW > 0 ? `<rect x="${x0}" y="${trackY}" width="${fillW.toFixed(1)}" height="${trackH}" fill="url(#glowfill)" opacity="0.3" filter="url(#glow)"/>` : '',
    faint.join(''),
    squares.join(''),
    ticks.join(''),
    `</g>`,
    `<rect x="${pillX.toFixed(1)}" y="${trackY}" width="${pillW}" height="${trackH}" rx="6" fill="url(#pill)" filter="url(#glow)"/>`,
    `<text x="${(pillX + pillW / 2).toFixed(1)}" y="13.6" font-size="10" font-weight="500" letter-spacing="0.2" fill="#fff" text-anchor="middle">${esc(a.label)}</text>`,
    `</g></svg>`,
  ].join('')
}

// ---------------------------------------------------------------- crew pane

export type Tile = { label: string; value: string }

/** Rounded stat tiles (cost, tokens, time) side by side. */
export const tilesSvg = (width: number, tiles: readonly Tile[]) => {
  const gap = 8
  const tw = (width - gap * (tiles.length - 1)) / tiles.length
  return [
    open(width, 48),
    ...tiles.map((t, i) => {
      const x = i * (tw + gap)
      return [
        `<rect x="${(x + 0.5).toFixed(1)}" y="1.5" width="${(tw - 1).toFixed(1)}" height="45" rx="9" class="f-tile k-border" stroke-width="1"/>`,
        `<text x="${(x + 11).toFixed(1)}" y="18" font-size="11" class="f-muted">${esc(t.label)}</text>`,
        `<text x="${(x + 11).toFixed(1)}" y="37" font-size="15.5" font-weight="600" class="f-fg">${esc(t.value)}</text>`,
      ].join('')
    }),
    `</svg>`,
  ].join('')
}

export type RowStatus = 'working' | 'waiting' | 'done' | 'failed'

export type CrewRowArgs = {
  width: number
  design: number
  accent: string
  title: string
  name: string
  sub: string
  statusWord: string
  stats: string
  status: RowStatus
  /** 0-1 shown as the bar; the context share while the real progress is unknown. */
  barShare: number
}

const STATUS_TONE: Record<RowStatus, Tone> = { working: 'cyan', waiting: 'muted', done: 'green', failed: 'red' }

const statusMark = (status: RowStatus, x: number, y: number) => {
  if (status === 'working') {
    return `<circle cx="${x}" cy="${y}" r="4" class="f-cyan pulse" filter="url(#glow)"/>`
  }
  if (status === 'done') {
    return `<circle cx="${x}" cy="${y}" r="6" class="f-green" filter="url(#glow)"/><path d="M${x - 2.6} ${y} l1.8 1.8 l3.4 -3.6" stroke="#1a1b26" stroke-width="1.6" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`
  }
  if (status === 'failed') {
    return `<circle cx="${x}" cy="${y}" r="6" class="f-red" filter="url(#glow)"/><path d="M${x - 2.2} ${y - 2.2} l4.4 4.4 M${x + 2.2} ${y - 2.2} l-4.4 4.4" stroke="#1a1b26" stroke-width="1.6" stroke-linecap="round"/>`
  }
  return `<circle cx="${x}" cy="${y}" r="6" class="f-muted"/><path d="M${x} ${y - 3} v3 l2 1.5" stroke="#1a1b26" stroke-width="1.4" fill="none" stroke-linecap="round"/>`
}

/** One builder: crab, task, name · model · effort, status and stats, a glowing bar, a status mark. */
export const crewRowSvg = (a: CrewRowArgs) => {
  const H = 66
  const textX = 54
  const barW = a.width - textX - 8
  const share = Math.max(0, Math.min(1, a.barShare))
  const barFill = a.status === 'done' ? barW : Math.max(share > 0 ? 4 : 0, barW * share)
  const tone = STATUS_TONE[a.status]
  return [
    open(a.width, H, `<linearGradient id="bar" x1="0" x2="1" y1="0" y2="0"><stop offset="0" stop-color="${a.accent}"/><stop offset="1" class="s-${a.status === 'done' ? 'green' : 'cyan'}"/></linearGradient>`),
    crabGroup(a.design, 2, 14, 1.8, a.status === 'working', a.status === 'waiting'),
    `<text x="${textX}" y="18" font-size="13" font-weight="600" class="f-fg">${esc(fit(a.title, a.width - textX - 28, 13))}</text>`,
    `<text x="${textX}" y="35" font-size="12"><tspan font-weight="600" fill="${a.accent}">${esc(a.name)}</tspan><tspan class="f-muted">${esc(`  ${a.sub}`)}</tspan></text>`,
    `<text x="${textX}" y="51" font-size="11.5" class="f-${tone}">${esc(a.statusWord)}</text>`,
    `<text x="${a.width - 8}" y="51" font-size="12" text-anchor="end" class="f-muted">${esc(a.stats)}</text>`,
    `<rect x="${textX}" y="57" width="${barW}" height="4" rx="2" class="f-track"/>`,
    barFill > 0 ? `<rect x="${textX}" y="57" width="${barFill.toFixed(1)}" height="4" rx="2" fill="url(#bar)" filter="url(#glow)"/>` : '',
    statusMark(a.status, a.width - 12, 14),
    `</svg>`,
  ].join('')
}
