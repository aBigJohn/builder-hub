// Clawd, the Claude Code mascot, as pixel art with a costume per builder.
import type { CrewStatus } from '../types'

/*
 * Clawd's block drawing
 *    ▐▛███▜▌
 *   ▝▜█████▛▘
 *     ▘▘ ▝▝
 * decoded to quadrant pixels and placed on a 26 x 11 canvas: rows 0-3 hold hats and raised
 * props, rows 4-8 Clawd (feet on row 8), rows 9-10 ground he may stand on; columns 0-4 and
 * 21-25 leave room for props beside him. o = body, e = eye, '.' = empty.
 */
export const CANVAS_W = 26
const CANVAS_ROWS = 11
const BODY_LEFT = 3
const BODY_TOP = 4
const BODY_ROWS = [
  '....oooooooooooo....',
  '....ooeooooooeoo....',
  '..oooooooooooooooo..',
  '....oooooooooooo....',
  '.....o.o....o.o.....',
]
const PIXEL_H = 1.25 // terminal quadrant pixels are taller than wide
export const CANVAS_H = CANVAS_ROWS * PIXEL_H
export const CLAWD_ORANGE = '#D77757'
const CLAWD_EYE = '#1F1A17'
const BLANK = '..........................'

export type Design = {
  name: string
  /** Colour of the name, the status dot and the row's bar. */
  accent: string
  /** Worn and held things over Clawd: rows of 26 chars from row 0; '.' keeps Clawd (or nothing). */
  sprite: readonly string[]
  /** Things on or beside the ground, behind Clawd; they stay put while he works. */
  scene?: readonly string[]
  palette: Readonly<Record<string, string>>
  /** Palette keys of held things: their pixels move with the nearest claw. */
  held?: string
  /** Text written on a prop, in canvas cells (x, y = top-left cell). */
  label?: { text: string; x: number; y: number; w: number; h: number; color: string }
}

export const DESIGNS: readonly Design[] = [
  // <designs: generated from the design-kit specs>
  {
    name: 'Carlos', // purple headband with flying ends, a black pistol held out sideways
    accent: '#A855F7',
    sprite: [
      BLANK,
      BLANK,
      BLANK,
      '....p.....................',
      '.....ppPPwPPPwPPPwP..KKKKK',
      '.....p..............KkkkkK',
      '.....................Kk...',
      '.....................Kk...',
    ],
    palette: { P: '#9333EA', p: '#6B21A8', w: '#F9FAFB', k: '#18181B', K: '#8A8A93' },
    held: 'kK',
  },
  {
    name: 'Herby', // green cap, the flag of Bulgaria on a pole
    accent: '#16A34A',
    sprite: [
      BLANK,
      'OOOOOP....................',
      'OWWWWP....gggggg..........',
      'ONNNNP...ggggggggGGG......',
      'ORRRRP....................',
      '.....P....................',
      BLANK,
      '.....P....................',
    ],
    palette: { P: '#6B7280', O: '#9CA3AF', W: '#FFFFFF', N: '#00966E', R: '#D62612', g: '#16A34A', G: '#15803D' },
    held: 'POWNR',
  },
  {
    name: 'Maurice', // captain's cap and pipe, a grey-brown cat sitting beside him
    accent: '#3B82F6',
    sprite: [
      BLANK,
      '..........ssssss..........',
      '.........swwwwwws....s....',
      '........bbbbbbbbbbkk..s...',
      '.....................n....',
      '...................kkn....',
    ],
    scene: [
      BLANK,
      BLANK,
      BLANK,
      '..c.c.....................',
      '..ccc.....................',
      'd.ece.....................',
      'c.cc......................',
      'ccccc.....................',
      '.cccc.....................',
    ],
    palette: { w: '#F9FAFB', b: '#2563EB', k: '#4B5563', n: '#7C4A2D', s: '#9CA3AF', c: '#8B7D6B', d: '#5C5145', e: '#84CC16' },
  },
  {
    name: 'Diddy', // hard hat and pickaxe, a black oil barrel beside him
    accent: '#CA8A04',
    sprite: [
      BLANK,
      BLANK,
      '...SSS....yyyyyy..........',
      '..S.n.S.YYYYYYYYYY........',
      '....n.....................',
      '....n.....................',
      '....n.....................',
    ],
    scene: [
      BLANK,
      BLANK,
      BLANK,
      '.....................llll.',
      '....................gKKKKg',
      '....................gggggg',
      '....................gKKKKg',
      '....................gKKKKg',
      '.....................gggg.',
    ],
    palette: { S: '#9CA3AF', n: '#8B5A2B', y: '#FACC15', Y: '#CA8A04', K: '#18181B', g: '#71717A', l: '#A1A1AA' },
    held: 'Sn',
    label: { text: 'OIL', x: 21, y: 6, w: 4, h: 2, color: '#FACC15' },
  },
  {
    name: 'Jeffrey', // white hair, standing on a small island with a palm tree
    accent: '#14B8A6',
    sprite: [
      BLANK,
      BLANK,
      '.........ww.ww.ww.........',
      '........wWWwWWwWWw........',
      '.......wWw......wWw.......',
    ],
    scene: [
      '.....................GG.GG',
      '...................GGGGgGG',
      '...................G...T.G',
      '.......................T..',
      '.......................T..',
      '......................T...',
      '......................T...',
      '.....................T....',
      '....................TT....',
      '......SSSSSSSSSSSSSSSS....',
      'BBBBsssssssssssssssssssBBB',
    ],
    palette: { W: '#F8FAFC', w: '#AEB7C4', S: '#F4C95D', s: '#D9A441', B: '#38BDF8', T: '#8B5A2B', G: '#22C55E', g: '#15803D' },
  },
  {
    name: 'Bibi', // pirate: red bandana, eye patch, cutlass, a pile of gold coins beside him
    accent: '#E11D48',
    sprite: [
      BLANK,
      '..BS......................',
      '...BS....rrrrrrrr.........',
      '...BS...rrwrrwrrwrRR......',
      '...BS..............RR.....',
      '..yyyy...kkk..............',
      '....y.....................',
    ],
    scene: [
      BLANK,
      BLANK,
      BLANK,
      BLANK,
      '.......................cc.',
      '......................clc.',
      '......................cdcd',
      '.....................clccd',
      '....................ccdcdd',
    ],
    palette: { r: '#DC2626', w: '#E2E8F0', R: '#B91C1C', k: '#111827', S: '#E2E8F0', B: '#94A3B8', y: '#FACC15', c: '#FACC15', d: '#CA8A04', l: '#FEF9C3' },
    held: 'SBy',
  },
  // </designs>
]

/** The crew's lead: shown beside the crew button while nobody works. */
export const LEAD = DESIGNS.length - 1

export const designOf = (index: number) => DESIGNS[((index % DESIGNS.length) + DESIGNS.length) % DESIGNS.length]

type Part = 'body' | 'arm-l' | 'arm-r' | 'leg-a' | 'leg-b'
type Pixel = { x: number; y: number; color: string; part: Part }

/** Clawd's own pixel at a canvas cell, if any. */
const clawdAt = (x: number, y: number) => {
  const cell = BODY_ROWS[y - BODY_TOP]?.[x - BODY_LEFT]
  return cell === 'o' || cell === 'e' ? cell : undefined
}

/** Which part of Clawd a cell moves with: claws wave, legs shuffle, the rest bobs. */
const partOf = (y: number, x: number): Part => {
  const bx = x - BODY_LEFT
  return y === BODY_TOP + 2 && bx <= 3 ? 'arm-l'
    : y === BODY_TOP + 2 && bx >= 16 ? 'arm-r'
      : y === BODY_TOP + 4 ? (bx === 5 || bx === 12 ? 'leg-a' : 'leg-b')
        : 'body'
}

const pixelsOf = (design: Design) => {
  const scene: Pixel[] = []
  const crab: Pixel[] = []
  const held = design.held ?? ''
  for (let y = 0; y < CANVAS_ROWS; y += 1) {
    const back = design.scene?.[y] ?? BLANK
    const over = design.sprite[y] ?? BLANK
    for (let x = 0; x < CANVAS_W; x += 1) {
      const bg = back[x]
      if (bg && bg !== '.') {
        scene.push({ x, y, color: design.palette[bg] ?? CLAWD_ORANGE, part: 'body' })
      }
      const top = over[x]
      const own = clawdAt(x, y)
      if (top && top !== '.') {
        const part = held.includes(top) ? (x < CANVAS_W / 2 ? 'arm-l' : 'arm-r') : own ? partOf(y, x) : 'body'
        crab.push({ x, y, color: design.palette[top] ?? CLAWD_ORANGE, part })
      } else if (own) {
        crab.push({ x, y, color: own === 'e' ? CLAWD_EYE : CLAWD_ORANGE, part: own === 'e' ? 'body' : partOf(y, x) })
      }
    }
  }
  return { scene, crab }
}

const rects = (pixels: readonly Pixel[]) =>
  pixels
    .map(p => `<rect x="${p.x}" y="${(p.y * PIXEL_H).toFixed(2)}" width="1.03" height="${(PIXEL_H + 0.03).toFixed(2)}" fill="${p.color}"/>`)
    .join('')

/** The label as real text, squeezed to the width of its box. */
const labelSvg = (label: NonNullable<Design['label']>) => {
  const size = label.h * PIXEL_H * 0.9
  const baseline = (label.y + label.h / 2) * PIXEL_H + size * 0.36
  const text = label.text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  return `<text x="${label.x + 0.2}" y="${baseline.toFixed(2)}" font-size="${size.toFixed(2)}" font-family="Arial, sans-serif" font-weight="900" fill="${label.color}" textLength="${(label.w - 0.4).toFixed(2)}" lengthAdjust="spacingAndGlyphs">${text}</text>`
}

/** CSS for the crab's walk cycle; include once in any SVG that holds a working crab. */
export const CRAB_STYLE = [
  '.cw .whole{animation:bob .9s ease-in-out infinite}',
  '.cw .arm-l{animation:wave .5s steps(2) infinite}',
  '.cw .arm-r{animation:wave .5s steps(2) infinite .25s}',
  '.cw .leg-a{animation:shuffle .4s steps(2) infinite}',
  '.cw .leg-b{animation:shuffle .4s steps(2) infinite .2s}',
  '@keyframes bob{0%,100%{transform:translateY(0)}50%{transform:translateY(-0.3px)}}',
  '@keyframes wave{0%{transform:translateY(0)}100%{transform:translateY(-2px)}}',
  '@keyframes shuffle{0%{transform:translateY(0)}100%{transform:translateY(-1px)}}',
  '@media (prefers-reduced-motion: reduce){*{animation:none!important}}',
].join('')

/**
 * The crab and its scene as a group placed at (x, y) and scaled; `isWorking` makes him walk
 * (needs CRAB_STYLE in the surrounding SVG), `isFaded` draws it at half strength.
 */
export const crabGroup = (designIndex: number, x: number, y: number, scale: number, isWorking: boolean, isFaded = false) => {
  const design = designOf(designIndex)
  const { scene, crab } = pixelsOf(design)
  const part = (name: Part) => rects(crab.filter(p => p.part === name))
  return [
    `<g transform="translate(${x} ${y}) scale(${scale})" class="${isWorking ? 'cw' : ''}" opacity="${isFaded ? 0.5 : 1}" shape-rendering="crispEdges">`,
    `<g>${rects(scene)}${design.label ? labelSvg(design.label) : ''}</g>`,
    `<g class="whole">`,
    `<g>${part('body')}</g>`,
    `<g class="arm-l">${part('arm-l')}</g>`,
    `<g class="arm-r">${part('arm-r')}</g>`,
    `<g class="leg-a">${part('leg-a')}</g>`,
    `<g class="leg-b">${part('leg-b')}</g>`,
    `</g></g>`,
  ].join('')
}

const badge = (status: CrewStatus) => {
  // beside Clawd's right foot
  const cx = BODY_LEFT + 18.4
  const cy = (BODY_TOP + BODY_ROWS.length) * PIXEL_H - 1.4
  if (status === 'done') {
    return `<circle cx="${cx}" cy="${cy}" r="1.6" fill="#22c55e"/><path d="M${cx - 0.8} ${cy} l0.6 0.6 l1.2 -1.3" stroke="#fff" stroke-width="0.5" fill="none" stroke-linecap="round"/>`
  }
  if (status === 'failed') {
    return `<circle cx="${cx}" cy="${cy}" r="1.6" fill="#ef4444"/><path d="M${cx - 0.7} ${cy - 0.7} l1.4 1.4 M${cx + 0.7} ${cy - 0.7} l-1.4 1.4" stroke="#fff" stroke-width="0.5" stroke-linecap="round"/>`
  }
  return ''
}

/** A standalone crab SVG of the given width, with a done/failed badge if asked. */
export const crabSvg = (designIndex: number, status: CrewStatus, width: number, hasBadge: boolean) => {
  const height = Math.round((width * CANVAS_H) / CANVAS_W)
  return [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${CANVAS_W} ${CANVAS_H.toFixed(2)}">`,
    `<style>${CRAB_STYLE}</style>`,
    crabGroup(designIndex, 0, 0, 1, status === 'working', status === 'waiting'),
    hasBadge ? badge(status) : '',
    `</svg>`,
  ].join('')
}

/** Clawd as the terminal draws him in the welcome box. */
export const CLAWD_TEXT = [' ▐▛███▜▌', '▝▜█████▛▘', '  ▘▘ ▝▝']
