import { expect, mock, test } from 'claude-code/testing'
import type { Engine } from 'claude-code/testing'
import type { AgentInfo, On, SessionRateLimit } from 'claude-code'

const PATH = 'projects/demo/notes/TASKS.md'
const NOW = Date.parse('2026-10-10T12:00:00Z')
const SURFACES = ['terminal', 'desktop'] as const

const TASKS = [
  '# Tasks — demo',
  '',
  '## M0 Setup',
  '- [x] Repo anlegen',
  '- [x] Workspace einrichten',
  '',
  '## M1 Prototyp',
  '- [x] Fixture-Lauf',
  '- [~] Feldnamen korrigieren',
  '- [ ] Tests grün',
  'Freitext wird ignoriert.',
].join('\r\n')

// The engine hands fs hooks absolute paths resolved against the plugin folder, whatever that folder
// is called: map each back to the longest known relative path it ends with.
const PROBES = ['notes/TASKS.md', 'projects']
const relTo = (files: Record<string, string>) => (path: string) => {
  const p = path.replace(/\\/g, '/')
  const known = [...PROBES, ...Object.keys(files).flatMap(f => f.split('/').map((_, i, parts) => parts.slice(0, i + 1).join('/')))]
  return known.filter(k => p === k || p.endsWith(`/${k}`)).sort((a, b) => b.length - a.length)[0] ?? p
}

type World = {
  files: Record<string, string>
  agents: AgentInfo[]
  toasts: string[]
  openPanes: Set<string>
  clock: ReturnType<typeof mock.clock>
}

const world = (on: On, files: Record<string, string>): World => {
  const w: World = { files, agents: [], toasts: [], openPanes: new Set(), clock: mock.clock(on, { now: NOW }) }
  const rel = relTo(w.files)
  let mtime = 1
  const isDirPrefix = (path: string) => Object.keys(w.files).some(p => p.startsWith(`${path}/`))
  on('fs.exists', (_$, e) => ({ value: rel(e.path) in w.files || isDirPrefix(rel(e.path)) }))
  on('fs.list', (_$, e) => {
    const prefix = `${rel(e.path)}/`
    const names = new Set(Object.keys(w.files).filter(p => p.startsWith(prefix)).map(p => p.slice(prefix.length).split('/')[0]))
    return { value: [...names].map(name => ({ name, kind: 'dir' as const, size: 0, mtimeMs: 0, isLink: false })) }
  })
  on('fs.stat', (_$, e) => ({ value: { kind: 'file' as const, size: w.files[rel(e.path)].length, mtimeMs: mtime, isLink: false } }))
  on('fs.read', (_$, e) => ({ value: w.files[rel(e.path)] }))
  on('fs.write', (_$, e) => {
    w.files[rel(e.path)] = e.text
    mtime += 1
    return { value: undefined }
  })
  on('agent.list', () => ({ value: w.agents }))
  on('ui.toast', (_$, e) => {
    w.toasts.push(e.text)
    return { value: undefined }
  })
  on('ui.open', (_$, e) => {
    w.openPanes.add(e.id)
    return { value: { isPlaced: true as const } }
  })
  on('ui.panes', () => ({
    value: [...w.openPanes].map(id => ({ id, title: id, isShown: true, isFocused: false, isPlaced: true })),
  }))
  on('ui.close', (_$, e) => {
    w.openPanes.delete(e.id)
    return { value: undefined }
  })
  on('session.start', (_$, e) => ({ cwd: e.cwd }))
  on('session.measure', (_$, e) => ({ changed: e.changed }))
  on('turn.complete', () => ({ text: '' }))
  on('ui.render', (engine, e) => {
    const { Text } = engine.ui.resolve(e)
    return h(Text, null, 'below')
  })
  return w
}

const start = ($: Engine) => $.session.start({ cwd: 'C:/ws', surface: 'desktop', isInteractive: true })

const bandProps = (bodyColumns = 150) => ({
  hasSurvey: false,
  isWorking: false,
  maxRows: 10,
  bodyColumns,
  scroll: { offset: 0, bodyRows: 10 },
  view: {},
})

const paneProps = {
  title: 'x',
  isFocused: false,
  bodyColumns: 60,
  placement: 'dock' as const,
  scroll: { offset: 0, bodyRows: 40 },
  view: {},
}

const measure = (rateLimits: SessionRateLimit[]) => ({
  context: { tokens: 420_000, window: 1_000_000, percent: 42 },
  rateLimits,
  changed: ['context', 'rateLimits'] as ('context' | 'rateLimits')[],
})

const builder = (id: string, description: string, status: AgentInfo['status']): AgentInfo => ({
  id,
  description,
  type: 'builder',
  status,
})

for (const surface of SURFACES) {
  test(`band shows meters, tabs and what lies beneath on ${surface}`, async ($, on) => {
    world(on, { [PATH]: TASKS })
    await start($)
    await $.session.measure(measure([{ kind: 'five_hour', percentUsed: 23.5, resetsAt: '2026-10-10T14:15:00Z' }]))

    const ui = await $.ui.mount({ plugin: 'builder-hud', surface, component: 'AbovePrompt', props: bandProps() })

    const drawn = JSON.stringify(await ui.drawn())
    expect(drawn).toContain('42 %')
    expect(drawn).toContain('24 % · 2 h 15 min')
    expect(drawn).toContain('C:')
    expect(await ui.find({ key: 'open-tasks', text: /3\/5/ })).toBeDefined()
    expect(await ui.find({ key: 'open-crew', text: /Crew/ })).toBeDefined()
    expect(await ui.find({ text: 'below' })).toBeDefined()
  })

  test(`tabs open and close their panes on ${surface}`, async ($, on) => {
    const w = world(on, { [PATH]: TASKS })
    await start($)
    const ui = await $.ui.mount({ plugin: 'builder-hud', surface, component: 'AbovePrompt', props: bandProps() })

    await ui.press({ key: 'open-tasks' })
    expect(w.openPanes.has('tasks')).toBe(true)
    await ui.press({ key: 'open-tasks' })
    expect(w.openPanes.has('tasks')).toBe(false)

    await ui.press({ key: 'open-crew' })
    expect(w.openPanes.has('crew')).toBe(true)
    expect(await ui.find({ key: 'open-crew', text: /✕/ })).toBeDefined()
  })

  test(`task pane ticks a task in the file on ${surface}`, async ($, on) => {
    const w = world(on, { [PATH]: TASKS })
    await start($)
    const ui = await $.ui.mount({ plugin: 'builder-hud', surface, component: 'Pane', requestId: 'tasks', props: paneProps })

    expect(await ui.find({ text: /Tests grün/ })).toBeDefined()
    await ui.press({ key: `${PATH}:9` })

    expect(w.files[PATH]).toContain('- [x] Tests grün')
    expect(w.files[PATH]).toContain('\r\n')
  })

  test(`crew pane follows a builder from start to finish on ${surface}`, async ($, on) => {
    const w = world(on, { [PATH]: TASKS })
    w.agents = [builder('a1', 'Diddy: Feldnamen korrigieren', 'running')]
    await start($)
    const ui = await $.ui.mount({ plugin: 'builder-hud', surface, component: 'Pane', requestId: 'crew', props: paneProps })

    expect(await ui.find({ text: /Läuft · 1/ })).toBeDefined()
    expect(JSON.stringify(await ui.drawn()), 'row drawn').toContain('Feldnamen korrigieren')
    expect(JSON.stringify(await ui.drawn()), 'name drawn').toContain('Diddy')

    w.agents = [builder('a1', 'Diddy: Feldnamen korrigieren', 'completed')]
    await w.clock.advance(2_000)
    await $.turn.complete({ answer: 'done', durationMs: 1, isAborted: false, turnId: 't', agentId: 'a1', reason: 'answer' })

    expect(await ui.find({ text: /Läuft · 0/ })).toBeDefined()
    expect(w.toasts.filter(t => t.includes('Diddy ist fertig'))).toHaveLength(1)
  })
}

test('the band animates by redrawn pictures, never by flashing frames', async ($, on) => {
  const w = world(on, { [PATH]: TASKS })
  w.agents = [builder('a1', 'Diddy: Feldnamen korrigieren', 'running')]
  await start($)
  const ui = await $.ui.mount({ plugin: 'builder-hud', surface: 'desktop', component: 'AbovePrompt', props: bandProps() })
  // What the person sees: the tree without its press handles, which change on every redraw.
  const picture = async () => JSON.stringify(await ui.drawn(), (key, value) => (key === 'press' ? undefined : value))

  const first = await picture()
  expect(first, 'no interactive Svg').not.toContain('isInteractive')
  await w.clock.advance(250)
  const second = await picture()
  expect(second, 'the next frame is a new picture').not.toBe(first)
  expect(second, 'still no interactive Svg').not.toContain('isInteractive')

  w.agents = [builder('a1', 'Diddy: Feldnamen korrigieren', 'completed')]
  await $.turn.complete({ answer: 'done', durationMs: 1, isAborted: false, turnId: 't', agentId: 'a1', reason: 'answer' })
  const idle = await picture()
  await w.clock.advance(1_000)
  expect(await picture(), 'still while nobody works').toBe(idle)
})

const subagentStop = (agentId: string, inFlight: string[]) => ({
  hook_event_name: 'SubagentStop' as const,
  session_id: 's',
  transcript_path: 't',
  cwd: 'C:/ws',
  stop_hook_active: false,
  agent_id: agentId,
  agent_transcript_path: 't',
  agent_type: 'builder',
  background_tasks: inFlight.map(id => ({ id, type: 'shell', status: 'running', description: 'sleep' })),
})

test('a builder keeps working while its own background command runs', async ($, on) => {
  const w = world(on, { [PATH]: TASKS })
  on('tool.call', () => ({ result: { stdout: '', stderr: '', interrupted: false, backgroundTaskId: 'b1' } }))
  on('classic.SubagentStop', () => ({}))
  w.agents = [builder('a1', 'Maurice: 2 Minuten warten', 'running')]
  await start($)
  const ui = await $.ui.mount({ plugin: 'builder-hud', surface: 'desktop', component: 'Pane', requestId: 'crew', props: paneProps })

  await $.tool.call({ tool: 'Bash', command: 'sleep 120', run_in_background: true, agentId: 'a1' })
  // Its turn ends while the sleep runs: the engine already calls it completed.
  w.agents = [builder('a1', 'Maurice: 2 Minuten warten', 'completed')]
  await $.turn.complete({ answer: 'wartet', durationMs: 1, isAborted: false, turnId: 't', agentId: 'a1', reason: 'answer' })
  await $.classic.SubagentStop(subagentStop('a1', ['b1']))
  await w.clock.advance(2_000)
  expect(await ui.find({ text: /Läuft · 1/ }), 'still working').toBeDefined()
  expect(w.toasts).toHaveLength(0)

  // What the engine really lists while it waits on that sleep: waiting, held on its own work.
  w.agents = [builder('a1', 'Maurice: 2 Minuten warten', 'waiting')]
  await w.clock.advance(2_000)
  expect(await ui.find({ text: /Läuft · 1/ }), 'waiting on its own sleep still works').toBeDefined()
  expect(JSON.stringify(await ui.drawn()), 'drawn as working').toContain('arbeitet')

  // The sleep ends, the agent is woken, reports and stops with nothing left in flight.
  w.agents = [builder('a1', 'Maurice: 2 Minuten warten', 'completed')]
  await $.classic.SubagentStop(subagentStop('a1', []))
  await w.clock.advance(2_000)
  expect(await ui.find({ text: /Läuft · 0/ }), 'done').toBeDefined()
  expect(w.toasts.filter(t => t.includes('Maurice ist fertig'))).toHaveLength(1)
})

test('any agent type gets a crab by default', async ($, on) => {
  const w = world(on, { [PATH]: TASKS })
  w.agents = [{ ...builder('a1', 'Code durchsuchen', 'running'), type: 'Explore' }]
  await start($)
  const ui = await $.ui.mount({ plugin: 'builder-hud', surface: 'desktop', component: 'Pane', requestId: 'crew', props: paneProps })

  expect(await ui.find({ text: /Läuft · 1/ })).toBeDefined()
  expect(JSON.stringify(await ui.drawn())).toContain('Code durchsuchen')
})

test('crew = builder leaves other agent types out', { options: { crew: 'builder' } }, async ($, on) => {
  const w = world(on, { [PATH]: TASKS })
  w.agents = [{ ...builder('a1', 'Code durchsuchen', 'running'), type: 'Explore' }, builder('a2', 'Diddy: bauen', 'running')]
  await start($)
  const ui = await $.ui.mount({ plugin: 'builder-hud', surface: 'desktop', component: 'Pane', requestId: 'crew', props: paneProps })

  expect(await ui.find({ text: /Läuft · 1/ })).toBeDefined()
  expect(JSON.stringify(await ui.drawn())).not.toContain('Code durchsuchen')
})

test('the band yields to a survey', async ($, on) => {
  world(on, { [PATH]: TASKS })
  await start($)
  const ui = await $.ui.mount({ plugin: 'builder-hud', surface: 'terminal', component: 'AbovePrompt', props: { ...bandProps(), hasSurvey: true } })

  expect(await ui.find({ text: 'below' })).toBeDefined()
  expect(await ui.find({ key: 'open-tasks' })).toBeUndefined()
})

test('the task pane explains where TASKS.md is expected', async ($, on) => {
  world(on, { 'README.md': 'x' })
  await start($)
  const ui = await $.ui.mount({ plugin: 'builder-hud', surface: 'desktop', component: 'Pane', requestId: 'tasks', props: paneProps })

  expect(await ui.find({ text: /Keine TASKS.md gefunden/ })).toBeDefined()
})
