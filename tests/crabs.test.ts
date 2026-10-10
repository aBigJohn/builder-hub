import { expect, test } from 'claude-code/testing'
import { CANVAS_W, DESIGNS, crabGroup } from '../hooks/crabs'

test('every costume fits the canvas and uses only its palette', () => {
  for (const d of DESIGNS) {
    for (const rows of [d.sprite, d.scene ?? []]) {
      expect(rows.length <= 11, `${d.name}: at most 11 rows`).toBe(true)
      for (const row of rows) {
        expect(row.length, `${d.name}: ${row}`).toBe(CANVAS_W)
        for (const key of row.replace(/\./g, '')) {
          expect(d.palette[key], `${d.name}: key ${key}`).toBeDefined()
        }
      }
    }
  }
})

test('held props move with a claw, the scene stays outside the bobbing body', () => {
  DESIGNS.forEach((d, i) => {
    const svg = crabGroup(i, 0, 0, 1, true)
    const cut = svg.indexOf('<g class="whole">')
    const scene = svg.slice(0, cut)
    const arms = [...svg.slice(cut).matchAll(/<g class="arm-[lr]">(.*?)<\/g>/g)].map(m => m[1]).join('')
    for (const key of d.held ?? '') {
      expect(arms, `${d.name} holds ${key}`).toContain(`fill="${d.palette[key]}"`)
    }
    if (d.scene?.some(row => /[^.]/.test(row))) {
      expect(scene, `${d.name}: scene drawn behind`).toContain('<rect')
    }
    if (d.label) {
      expect(scene, `${d.name}: label written`).toContain(`>${d.label.text}</text>`)
    }
  })
})
