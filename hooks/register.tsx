import { atom, read, update } from 'claude-code'
import type {
  AgentInfo,
  EngineInterface,
  Register,
  SessionContextUsage,
  SessionRateLimit,
  TurnUsage,
} from 'claude-code'

import type { CrewMember, CrewStats, CrewStatus, Task, TaskFile, TaskGroup, TaskState, UsageSnapshot } from '../types'
import { CANVAS_H, CANVAS_W, CLAWD_TEXT, DESIGNS, FRAME_MS, LEAD, crabSvg, designOf } from './crabs'
import { FLOW_H, METER_ROW_H, NEON, WEEK_H, crewRowSvg, flowSvg, meterRowSvg, tilesSvg, weekSvg } from './svg'
import type { Level } from './svg'

// ---------------------------------------------------------------- state

const snapshot = atom({ plugin: 'builder-hud', key: 'snapshot' } as const, null)
const tick = atom({ plugin: 'builder-hud', key: 'tick' } as const, 0)
const beat = atom({ plugin: 'builder-hud', key: 'beat' } as const, 0)
const frame = atom({ plugin: 'builder-hud', key: 'frame' } as const, 0)
const files = atom({ plugin: 'builder-hud', key: 'files' } as const, [])
const showDone = atom({ plugin: 'builder-hud', key: 'showDone' } as const, false)
const isTasksOpen = atom({ plugin: 'builder-hud', key: 'isTasksOpen' } as const, false)
const crew = atom({ plugin: 'builder-hud', key: 'crew' } as const, [])
const crewStats = atom({ plugin: 'builder-hud', key: 'crewStats' } as const, {})
const isCrewOpen = atom({ plugin: 'builder-hud', key: 'isCrewOpen' } as const, false)
const isCrewCollapsed = atom({ plugin: 'builder-hud', key: 'isCrewCollapsed' } as const, false)
const isDynamic = atom({ plugin: 'builder-hud', key: 'isDynamic' } as const, false)

const TASKS_PANE = 'tasks'
const CREW_PANE = 'crew'
const POLL_MS = 2_000
const TICKS_PER_MINUTE = 30
const CREW_KEEP = 12
const PX_PER_COLUMN = 7 // rough CSS pixels per cell on the desktop surface
const FLOW_W = 300
const MINI_CRAB_W = 31 // 1.2 px per canvas column, as before the canvas grew for props
const IDLE_CREW = [LEAD, DESIGNS.findIndex(d => d.name === 'Diddy')]
// A transparent 1 x 4 px drawing: the smallest vertical gap the desktop surface can be given.
const SPACER_SVG = '<svg xmlns="http://www.w3.org/2000/svg" width="1" height="4"/>'

// ---------------------------------------------------------------- usage meters

type MeterRow = { key: string; label: string; short: string; percent: number | null; detail: string; shortDetail: string }

const WARN_AT = 60
const HIGH_AT = 85
const LEVEL_COLOR: Record<Level, string> = { ok: NEON.cyan, warn: NEON.yellow, high: NEON.red, none: NEON.muted }

const clamp = (n: number) => Math.max(0, Math.min(100, n))
const levelOf = (percent: number | null): Level =>
  percent === null ? 'none' : percent >= HIGH_AT ? 'high' : percent >= WARN_AT ? 'warn' : 'ok'
const trimOneDecimal = (n: number) => (Math.round(n * 10) / 10).toString()
const formatTokens = (n: number) =>
  n >= 1_000_000 ? `${trimOneDecimal(n / 1_000_000)}M` : n >= 1_000 ? `${Math.round(n / 1_000)}k` : String(n)

const formatReset = (resetsAt: string | null, now: number) => {
  const at = resetsAt ? Date.parse(resetsAt) : Number.NaN
  if (Number.isNaN(at)) return 'Reset unbekannt'
  const minutes = Math.max(0, Math.ceil((at - now) / 60_000))
  if (minutes === 0) return 'Reset gleich'
  const hours = Math.floor(minutes / 60)
  const rest = minutes % 60
  return hours > 0 ? `Reset in ${hours} h ${String(rest).padStart(2, '0')} min` : `Reset in ${rest} min`
}

const toSnapshot = (context: SessionContextUsage, rateLimits: readonly SessionRateLimit[]): UsageSnapshot => {
  const fiveHour = rateLimits.find(limit => limit.kind === 'five_hour')
  const week = rateLimits.find(limit => limit.kind === 'seven_day')
  return {
    contextPercent: context.percent ?? null,
    contextTokens: context.tokens ?? null,
    contextWindow: context.window,
    fivePercent: fiveHour?.percentUsed ?? null,
    fiveResetsAt: fiveHour?.resetsAt ?? null,
    weekPercent: week?.percentUsed ?? null,
    weekResetsAt: week?.resetsAt ?? null,
  }
}

const toMeterRows = (snap: UsageSnapshot | null, now: number): MeterRow[] => {
  const contextPercent = snap?.contextPercent ?? null
  const fivePercent = snap?.fivePercent ?? null
  const contextDetail =
    contextPercent === null || snap === null
      ? 'noch keine Messung'
      : `${Math.round(contextPercent)} %  ·  ${formatTokens(snap.contextTokens ?? 0)} / ${formatTokens(snap.contextWindow)}`
  const fiveDetail =
    fivePercent === null || snap === null
      ? 'keine Daten (nur mit Abo)'
      : `${Math.round(fivePercent)} %  ·  ${formatReset(snap.fiveResetsAt, now)}`
  const contextShort = contextPercent === null ? '–' : `${Math.round(contextPercent)} %`
  const fiveShort =
    fivePercent === null || snap === null
      ? '–'
      : /^Reset in /.test(formatReset(snap.fiveResetsAt, now))
        ? `${Math.round(fivePercent)} % · ${formatReset(snap.fiveResetsAt, now).replace(/^Reset in /, '')}`
        : `${Math.round(fivePercent)} %`
  return [
    { key: 'context', label: 'Kontext', short: 'C:', percent: contextPercent, detail: contextDetail, shortDetail: contextShort },
    { key: 'five-hour', label: '5h-Limit', short: '5h:', percent: fivePercent, detail: fiveDetail, shortDetail: fiveShort },
  ]
}

// ---------------------------------------------------------------- week pace

const WEEK_MS = 7 * 24 * 60 * 60 * 1000
const WEEK_MAX_W = 640
const WEEK_MIN_W = 160
// Measured on the desktop: a band of 94 columns is about 765 CSS pixels wide.
const BAND_PX_PER_COLUMN = 8
// Space between the band's columns, and a margin so a rough estimate never pushes into a wrap.
const COLUMN_GAP_W = 18
const WEEK_SAFETY = 0.92

type WeekView = { percent: number | null; pace: number | null; caption: string; label: string; short: string }

const resetText = (minutes: number) => {
  const days = Math.floor(minutes / 1440)
  const hours = Math.floor((minutes % 1440) / 60)
  return days > 0 ? `Reset in ${days} T ${hours} h` : `Reset in ${hours} h ${String(minutes % 60).padStart(2, '0')} min`
}

/**
 * The 7-day window against an even pace: since the last reset every day adds 1/7 (about 14.3 %)
 * to what could have been used by now.
 */
const weekView = (snap: UsageSnapshot | null, now: number): WeekView => {
  const percent = snap?.weekPercent ?? null
  const resetAt = snap?.weekResetsAt ? Date.parse(snap.weekResetsAt) : Number.NaN
  if (percent === null) return { percent, pace: null, caption: 'keine Daten (nur mit Abo)', label: '', short: '–' }
  if (Number.isNaN(resetAt)) return { percent, pace: null, caption: 'Reset unbekannt', label: '', short: `${Math.round(percent)} %` }
  const pace = clamp(((now - (resetAt - WEEK_MS)) / WEEK_MS) * 100)
  const day = ((pace / 100) * 7).toFixed(1).replace('.', ',')
  const caption = `Tag ${day} von 7 · ${resetText(Math.max(0, Math.ceil((resetAt - now) / 60_000)))}`
  const label = `Tag ${day} von 7`
  return { percent, pace, caption, label, short: `${Math.round(percent)} % · Soll ${Math.round(pace)} %` }
}

const textBar = (percent: number | null, cells: number) => {
  const filled = percent === null ? 0 : Math.round((cells * clamp(percent)) / 100)
  return { filled: '█'.repeat(filled), empty: '░'.repeat(cells - filled) }
}

// ---------------------------------------------------------------- tasks

const TASK_LINE = /^(\s*[-*] \[)( |x|X|~)(\]\s+)(.*)$/
const GROUP_LINE = /^#{2,3}\s+(.+?)\s*$/
const TITLE_LINE = /^#\s+(.+?)\s*$/
const TASK_GLYPH: Record<TaskState, string> = { open: '○', doing: '◐', done: '✓' }
const TASK_COLOR: Record<TaskState, string> = { open: NEON.fg, doing: NEON.yellow, done: NEON.green }

const stateOf = (mark: string): TaskState => (mark === '~' ? 'doing' : mark === ' ' ? 'open' : 'done')

const parseTasks = (text: string, path: string, fallbackName: string, mtimeMs: number): TaskFile => {
  const groups: TaskGroup[] = []
  let project = fallbackName
  let current: TaskGroup | null = null

  text.split(/\r?\n/).forEach((raw, line) => {
    const title = TITLE_LINE.exec(raw)
    if (title && groups.length === 0 && current === null) {
      project = title[1].replace(/^Tasks\s*[—–-]\s*/i, '') || fallbackName
      return
    }
    const group = GROUP_LINE.exec(raw)
    if (group) {
      current = { title: group[1], tasks: [] }
      groups.push(current)
      return
    }
    const task = TASK_LINE.exec(raw)
    if (task) {
      if (current === null) {
        current = { title: 'Allgemein', tasks: [] }
        groups.push(current)
      }
      const entry: Task = { line, text: task[4].trim(), state: stateOf(task[2]) }
      current.tasks.push(entry)
    }
  })

  return { path, project, groups: groups.filter(g => g.tasks.length > 0), mtimeMs }
}

type Candidate = { path: string; name: string }

const findCandidates = async ($: EngineInterface): Promise<Candidate[]> => {
  const found: Candidate[] = []
  if (await $.fs.exists('notes/TASKS.md')) {
    found.push({ path: 'notes/TASKS.md', name: 'Projekt' })
  }
  if (await $.fs.exists('projects')) {
    for (const entry of await $.fs.list('projects')) {
      const path = `projects/${entry.name}/notes/TASKS.md`
      if (entry.kind === 'dir' && (await $.fs.exists(path))) {
        found.push({ path, name: entry.name })
      }
    }
  }
  return found
}

let lastTaskSignature = ''

const rescanTasks = async ($: EngineInterface, isForced = false) => {
  const candidates = await findCandidates($)
  const stats = await Promise.all(
    candidates.map(async c => ({ ...c, mtimeMs: (await $.fs.stat(c.path)).mtimeMs })),
  )
  const signature = stats.map(s => `${s.path}@${s.mtimeMs}`).join('|')
  if (!isForced && signature === lastTaskSignature) {
    return
  }
  lastTaskSignature = signature
  const parsed = await Promise.all(
    stats.map(async s => parseTasks(await $.fs.read(s.path), s.path, s.name, s.mtimeMs)),
  )
  await update($, files, () => parsed)
}

const toggleTask = async ($: EngineInterface, file: TaskFile, task: Task) => {
  const text = await $.fs.read(file.path)
  const newline = text.includes('\r\n') ? '\r\n' : '\n'
  const lines = text.split(/\r?\n/)
  const match = TASK_LINE.exec(lines[task.line] ?? '')
  if (!match || match[4].trim() !== task.text) {
    $.ui.toast('TASKS.md hat sich geändert, Liste neu geladen')
    await rescanTasks($, true)
    return
  }
  const nextMark = stateOf(match[2]) === 'done' ? ' ' : 'x'
  lines[task.line] = `${match[1]}${nextMark}${match[3]}${match[4]}`
  await $.fs.write(file.path, lines.join(newline))
  await rescanTasks($, true)
}

const countTasks = (list: readonly TaskFile[]) => {
  const all = list.flatMap(f => f.groups.flatMap(g => g.tasks))
  return {
    total: all.length,
    done: all.filter(t => t.state === 'done').length,
    doing: all.filter(t => t.state === 'doing').length,
  }
}

/** The milestone the bar shows: the first group of the first file with work left (else the last). */
const activeMilestone = (list: readonly TaskFile[]) => {
  const groups = list[0]?.groups ?? []
  if (groups.length === 0) return null
  const group = groups.find(g => g.tasks.some(t => t.state !== 'done')) ?? groups[groups.length - 1]
  return {
    title: group.title,
    total: group.tasks.length,
    done: group.tasks.filter(t => t.state === 'done').length,
    doing: group.tasks.filter(t => t.state === 'doing').length,
    isFinished: group.tasks.every(t => t.state === 'done'),
  }
}

// ---------------------------------------------------------------- crew

const BUILDER_TYPE = /(^|:)builder(-medium|-light)?$/
const isBuilderType = (type: string) => BUILDER_TYPE.test(type)
// Offered only in the dynamic agents mode; plain `builder` (Opus, high) always is.
const DYNAMIC_TYPE = /(^|:)builder-(medium|light)$/
const DYNAMIC_KEY = 'dynamicAgents'

/** Switches the dynamic agents mode and keeps the choice across sessions. */
const toggleDynamic = async ($: EngineInterface) => {
  const isOn = !(await read($, isDynamic))
  await update($, isDynamic, () => isOn)
  await $.store.set(DYNAMIC_KEY, isOn).catch(() => undefined)
  $.ui.toast(isOn ? 'Dynamische Agents an: Opus, Sonnet oder Haiku je nach Aufgabe' : 'Dynamische Agents aus: immer Opus High')
  return isOn
}

// Who gets a crab: every agent ('alle', the default) or only those of type builder.
// Set from the plugin's options each time register runs.
let isBuildersOnly = false
const isCrewType = (type: string) => !isBuildersOnly || isBuilderType(type)
const isCrewAgent = (agent: AgentInfo) => isCrewType(agent.type)

const crewStatusOf = (status: AgentInfo['status']): CrewStatus =>
  status === 'completed' ? 'done'
    : status === 'failed' || status === 'killed' ? 'failed'
      : status === 'running' || status === 'pending' ? 'working'
        : 'waiting'

const hasBackground = (member: CrewMember | undefined) => (member?.backgroundIds?.length ?? 0) > 0

/**
 * An agent whose turn ended while its own background task still runs keeps working: the
 * engine lists it as `waiting` (held on background work it owns), or as `completed`.
 */
const statusOf = (agent: AgentInfo, member: CrewMember | undefined): CrewStatus => {
  const status = crewStatusOf(agent.status)
  return (status === 'done' || status === 'waiting') && hasBackground(member) ? 'working' : status
}

const isEnded = (status: CrewStatus) => status === 'done' || status === 'failed'

const NAME_PREFIX = /^\s*([A-Za-zÄÖÜäöüß]+)\s*[:\-–]\s*(.+)$/

/** "Diddy: fix field names" picks Diddy's costume; otherwise the next one nobody active wears. */
const identify = (description: string, members: readonly CrewMember[]) => {
  const match = NAME_PREFIX.exec(description)
  const named = match ? DESIGNS.findIndex(d => d.name.toLowerCase() === match[1].toLowerCase()) : -1
  if (match && named >= 0) {
    return { design: named, name: DESIGNS[named].name, task: match[2].trim() }
  }
  const busy = new Set(members.filter(m => !isEnded(m.status)).map(m => m.design))
  const free = DESIGNS.findIndex((_, i) => !busy.has(i))
  const design = free >= 0 ? free : members.length % DESIGNS.length
  return { design, name: DESIGNS[design].name, task: description.trim() || 'Aufgabe' }
}

const toastFinished = ($: EngineInterface, member: CrewMember) =>
  $.ui.toast(member.status === 'done' ? `🦀 ${member.name} ist fertig: ${member.task}` : `🦀 ${member.name} ist abgebrochen: ${member.task}`)

/** Adds a builder the moment it spawns, so its first steps already count. */
const addMember = async ($: EngineInterface, id: string, description: string) => {
  const now = await $.clock.now()
  await update($, crew, list =>
    list.some(m => m.id === id)
      ? list
      : [...list, { id, ...identify(description, list), status: 'working' as CrewStatus, startedAt: now, endedAt: null, isNotified: false }].slice(-CREW_KEEP),
  )
}

/** Marks a builder ended once, and toasts once. */
const endMember = async ($: EngineInterface, id: string, status: CrewStatus) => {
  const now = await $.clock.now()
  const before = (await read($, crew)).find(m => m.id === id)
  if (!before || isEnded(before.status)) return
  await update($, crew, list => list.map(m => (m.id === id ? { ...m, status, endedAt: now, isNotified: true } : m)))
  if (!before.isNotified) toastFinished($, { ...before, status })
}

const syncCrew = async ($: EngineInterface) => {
  const agents = (await $.agent.list()).filter(isCrewAgent)
  const now = await $.clock.now()
  const members = (await read($, crew)).map(m => ({ ...m }))
  const toToast: CrewMember[] = []
  let isChanged = false

  for (const agent of agents) {
    const known = members.find(m => m.id === agent.id)
    const status = statusOf(agent, known)
    if (!known) {
      members.push({ id: agent.id, ...identify(agent.description, members), status, startedAt: now, endedAt: isEnded(status) ? now : null, isNotified: isEnded(status) })
      isChanged = true
    } else if (known.status !== status) {
      known.status = status
      known.endedAt = isEnded(status) ? (known.endedAt ?? now) : null
      if (isEnded(status) && !known.isNotified) {
        known.isNotified = true
        toToast.push({ ...known })
      }
      isChanged = true
    }
  }

  // A builder the engine already dropped while we still saw it working has finished.
  for (const member of members) {
    if (!isEnded(member.status) && !agents.some(a => a.id === member.id)) {
      member.status = 'done'
      member.endedAt = now
      if (!member.isNotified) {
        member.isNotified = true
        toToast.push({ ...member })
      }
      isChanged = true
    }
  }

  if (isChanged) {
    await update($, crew, () => members.slice(-CREW_KEEP))
  }
  if (members.some(m => !isEnded(m.status))) {
    await update($, beat, n => n + 1)
  }
  for (const member of toToast) toastFinished($, member)
}

// ---------------------------------------------------------------- background tasks

const BACKGROUND_TOOLS = new Set(['Bash', 'PowerShell', 'Monitor'])

/** The task id a backgrounded Bash/PowerShell (`backgroundTaskId`) or a Monitor (`taskId`) answers. */
const backgroundIdOf = (result: unknown): string | undefined => {
  if (typeof result !== 'object' || result === null) return undefined
  const { backgroundTaskId, taskId } = result as { backgroundTaskId?: unknown; taskId?: unknown }
  const id = backgroundTaskId ?? taskId
  return typeof id === 'string' && id !== '' ? id : undefined
}

const trackBackground = async ($: EngineInterface, agentId: string, taskId: string) => {
  await update($, crew, list =>
    list.map(m => (m.id === agentId && !(m.backgroundIds ?? []).includes(taskId) ? { ...m, backgroundIds: [...(m.backgroundIds ?? []), taskId] } : m)),
  )
}

/** Drops every tracked task the engine no longer lists as in flight, then settles the crew. */
const pruneBackground = async ($: EngineInterface, inFlight: readonly { id: string }[] | undefined) => {
  if (!inFlight) return
  const live = new Set(inFlight.map(t => t.id))
  await update($, crew, list =>
    list.some(m => (m.backgroundIds ?? []).some(id => !live.has(id)))
      ? list.map(m => ({ ...m, backgroundIds: (m.backgroundIds ?? []).filter(id => live.has(id)) }))
      : list,
  )
  await syncCrew($)
}

// List prices in USD per million tokens [input, output, cache read, cache write]; an estimate.
const PRICES: ReadonlyArray<[RegExp, readonly [number, number, number, number]]> = [
  [/fable|mythos/i, [10, 50, 0.25, 12.5]],
  [/opus/i, [4, 20, 0.2, 5]],
  [/sonnet/i, [2, 10, 0.1, 2.5]],
  [/haiku/i, [0.1, 0.5, 0.01, 0.125]],
]
const CONTEXT_WINDOW = 1_000_000

const modelLabel = (model: string) => {
  const m = /claude-([a-z]+)-(\d+)-(\d+)/i.exec(model)
  return m ? `${m[1][0].toUpperCase()}${m[1].slice(1)} ${m[2]}.${m[3]}` : model
}

const EMPTY_STATS: CrewStats = { tokens: 0, usd: 0, ctxPercent: 0, model: '', effort: '', steps: 0 }

const recordStep = async ($: EngineInterface, agentId: string, usage: TurnUsage, model: string, effort: string) => {
  const price = PRICES.find(([pattern]) => pattern.test(usage.model || model))?.[1] ?? [0, 0, 0, 0]
  const input = usage.input_tokens + usage.cache_read_input_tokens + usage.cache_creation_input_tokens
  const usd =
    (usage.input_tokens * price[0] +
      usage.output_tokens * price[1] +
      usage.cache_read_input_tokens * price[2] +
      usage.cache_creation_input_tokens * price[3]) /
    1_000_000
  await update($, crewStats, all => {
    const before = all[agentId] ?? EMPTY_STATS
    return {
      ...all,
      [agentId]: {
        tokens: before.tokens + input + usage.output_tokens,
        usd: before.usd + usd,
        ctxPercent: clamp(((input + usage.output_tokens) / CONTEXT_WINDOW) * 100),
        model: modelLabel(usage.model || model),
        effort,
        steps: before.steps + 1,
      },
    }
  })
}

const clockText = (ms: number) => {
  const seconds = Math.max(0, Math.floor(ms / 1000))
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  return h > 0 ? `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}` : `${m}:${String(s).padStart(2, '0')}`
}
const usdText = (usd: number) => `≈$${usd < 10 ? usd.toFixed(2) : usd.toFixed(1)}`
const STATUS_WORD: Record<CrewStatus, string> = { working: 'arbeitet', waiting: 'wartet', done: 'fertig', failed: 'abgebrochen' }
const STATUS_COLOR: Record<CrewStatus, string> = { working: NEON.cyan, waiting: NEON.muted, done: NEON.green, failed: NEON.red }

// ---------------------------------------------------------------- panes

type PaneId = typeof TASKS_PANE | typeof CREW_PANE

const PANE_OPTIONS: Record<PaneId, { title: string; columns: number }> = {
  tasks: { title: 'Aufgaben', columns: 52 },
  crew: { title: 'Crew', columns: 60 },
}

const setPaneFlag = ($: EngineInterface, id: PaneId, isOpen: boolean) =>
  id === TASKS_PANE ? update($, isTasksOpen, () => isOpen) : update($, isCrewOpen, () => isOpen)

const openPane = async ($: EngineInterface, id: PaneId) => {
  const opened = await $.ui.open({ id, ...PANE_OPTIONS[id], closeOnEscape: true })
  await setPaneFlag($, id, opened.isPlaced)
}

const isPaneShown = async ($: EngineInterface, id: PaneId) =>
  (await $.ui.panes()).some(pane => pane.id === id && pane.isPlaced && pane.isShown)

// The tabs are toggles: shown -> close; closed or behind another pane's tab -> show.
const togglePane = async ($: EngineInterface, id: PaneId) => {
  if (await isPaneShown($, id)) {
    await $.ui.close({ id })
    await setPaneFlag($, id, false)
    return
  }
  await openPane($, id)
}

// ---------------------------------------------------------------- register

export const register: Register = (on, options) => {
  isBuildersOnly = options.crew === 'builder'

  on('session.start', async ($, e, next) => {
    const result = await next(e)

    try {
      const usage = await $.session.usage()
      await update($, snapshot, () => toSnapshot(usage.context, usage.rateLimits))
    } catch {
      // The first session.measure fills the meters instead.
    }
    await $.command.register({ name: 'tasks', description: 'Aufgabenliste (TASKS.md) im Seitenpanel öffnen' }).catch(() => undefined)
    await $.command.register({ name: 'crew', description: 'Agent-Crew im Seitenpanel öffnen' }).catch(() => undefined)
    await $.command.register({ name: 'dynamisch', description: 'Dynamische Agents an/aus (Opus, Sonnet oder Haiku je nach Aufgabe)' }).catch(() => undefined)
    const storedDynamic = await $.store.get(DYNAMIC_KEY).catch(() => undefined)
    await update($, isDynamic, () => storedDynamic === true)
    await rescanTasks($, true).catch(() => undefined)
    await syncCrew($).catch(() => undefined)
    // A reload keeps the engine's panes open while the module starts over: re-read them.
    const isTasksShown = await isPaneShown($, TASKS_PANE).catch(() => false)
    const isCrewShown = await isPaneShown($, CREW_PANE).catch(() => false)
    await update($, isTasksOpen, () => isTasksShown)
    await update($, isCrewOpen, () => isCrewShown)

    let beats = 0
    $.clock.every(POLL_MS, () => {
      beats += 1
      void syncCrew($).catch(() => undefined)
      void rescanTasks($).catch(() => undefined)
      if (beats % TICKS_PER_MINUTE === 0) void update($, tick, n => n + 1)
    })
    // The animations are drawn as pictures, one per frame, and only while someone works.
    $.clock.every(FRAME_MS, () => {
      void read($, crew)
        .then(members => (members.some(m => m.status === 'working') ? update($, frame, n => n + 1) : undefined))
        .catch(() => undefined)
    })

    return result
  })

  on('session.measure', async ($, e, next) => {
    await update($, snapshot, () => toSnapshot(e.context, e.rateLimits))
    return next(e)
  })

  // The Sonnet and Haiku builders are offered only while the dynamic agents mode is on.
  on('agent.offer', async ($, e, next) => {
    if (DYNAMIC_TYPE.test(e.agent) && !(await read($, isDynamic))) return { isOffered: false }
    return next(e)
  }).catch(($, e, next) => next(e))

  // An agent joins the crew as it spawns; observing only, never refusing a spawn.
  on('agent.spawn', async ($, e, next) => {
    const result = await next(e)
    if (result.agentId && isCrewType(e.subagentType)) {
      await addMember($, result.agentId, e.description).catch(() => undefined)
    }
    return result
  }).catch(($, e, next) => next(e))

  // A crew member that backgrounds a command keeps working until that command ends,
  // even after its own turn is over. Observing only: the result passes untouched.
  on('tool.call', async ($, e, next) => {
    const result = await next(e)
    if (e.agentId && BACKGROUND_TOOLS.has(e.tool) && 'result' in result && !result.isError) {
      const taskId = backgroundIdOf(result.result)
      if (taskId && (await read($, crew)).some(m => m.id === e.agentId)) {
        await trackBackground($, e.agentId, taskId).catch(() => undefined)
      }
    }
    return result
  })

  // Each stop lists the session's background work still in flight: what is missing has ended.
  on('classic.SubagentStop', async ($, e, next) => {
    const result = await next(e)
    await pruneBackground($, e.background_tasks).catch(() => undefined)
    return result
  })

  on('classic.Stop', async ($, e, next) => {
    const result = await next(e)
    await pruneBackground($, e.background_tasks).catch(() => undefined)
    return result
  })

  // Builder figures come from their own model requests; the main loop passes untouched.
  on('turn.step', async function* ($, e, next) {
    const result = yield* next(e)
    if (e.agentId && result.usage) {
      const effort = e.effort === undefined ? '—' : String(e.effort)
      await recordStep($, e.agentId, result.usage, e.model, effort).catch(() => undefined)
    }
    return result
  })

  on('turn.complete', async ($, e, next) => {
    if (e.agentId) {
      const member = (await read($, crew)).find(m => m.id === e.agentId)
      // An answer while its background task runs is a pause, not the end.
      if (member && !(e.reason === 'answer' && hasBackground(member))) {
        await endMember($, e.agentId, e.reason === 'answer' ? 'done' : 'failed').catch(() => undefined)
      }
    } else {
      await rescanTasks($).catch(() => undefined)
    }
    await syncCrew($).catch(() => undefined)
    return next(e)
  })

  // However a pane closes (its tab, its X, Escape), the tab's state follows.
  on('ui.close', { id: TASKS_PANE }, async ($, e, next) => {
    const result = await next(e)
    await update($, isTasksOpen, () => false)
    return result
  }).catch(($, e, next) => next(e))

  on('ui.close', { id: CREW_PANE }, async ($, e, next) => {
    const result = await next(e)
    await update($, isCrewOpen, () => false)
    return result
  }).catch(($, e, next) => next(e))

  on('command.run', { command: 'tasks' }, async $ => {
    await rescanTasks($, true).catch(() => undefined)
    await openPane($, TASKS_PANE)
    return { text: 'Aufgabenliste geöffnet.' }
  }).catch(() => ({ text: 'Aufgabenliste konnte nicht geöffnet werden.' }))

  on('command.run', { command: 'dynamisch' }, async $ => {
    const isOn = await toggleDynamic($)
    return { text: isOn ? 'Dynamische Agents sind an.' : 'Dynamische Agents sind aus: immer Opus High.' }
  }).catch(() => ({ text: 'Modus konnte nicht umgeschaltet werden.' }))

  on('command.run', { command: 'crew' }, async $ => {
    await syncCrew($).catch(() => undefined)
    await openPane($, CREW_PANE)
    return { text: 'Crew geöffnet.' }
  }).catch(() => ({ text: 'Crew konnte nicht geöffnet werden.' }))

  // ------------------------------------------------------------ the band

  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => {
    if (e.props.hasSurvey) {
      return next(e)
    }

    const below = await next(e)
    const snap = await read($, snapshot)
    await read($, tick)
    const taskList = await read($, files)
    const members = await read($, crew)
    const isTasksPaneOpen = await read($, isTasksOpen)
    const isCrewPaneOpen = await read($, isCrewOpen)
    const frameNo = await read($, frame)
    const now = await $.clock.now()

    const meters = toMeterRows(snap, now)
    const week = weekView(snap, now)
    const { total, done, doing } = countTasks(taskList)
    const milestone = activeMilestone(taskList)
    const working = members.filter(m => !isEnded(m.status))
    const recent = members.filter(m => isEnded(m.status)).slice(-2)
    const table = $.ui.resolve(e)
    const { Box, Button, Text } = table

    const crewButton = (
      <Button key="open-crew" dimColor={members.length === 0} onPress={() => togglePane($, CREW_PANE)}>
        {'Crew'}
        {working.length > 0 ? <Text color={NEON.cyan}>{` ×${working.length}`}</Text> : ''}
        {isCrewPaneOpen ? <Text color={NEON.muted}>{'  ✕'}</Text> : ''}
      </Button>
    )

    const tasksButton = (
      <Button key="open-tasks" onPress={() => togglePane($, TASKS_PANE)}>
        {'☰ Aufgaben '}
        <Text color={total === 0 ? NEON.muted : total === done ? NEON.green : NEON.fg}>
          {total === 0 ? '–' : `${done}/${total}`}
        </Text>
        {doing > 0 ? <Text color={NEON.yellow}>{` ◐${doing}`}</Text> : ''}
        {isTasksPaneOpen ? <Text color={NEON.muted}>{'  ✕'}</Text> : ''}
      </Button>
    )

    // The crew count lives on the crab button; the pill stays short so it never hides the fill.
    const flowLabel = (m: NonNullable<typeof milestone>) => (m.isFinished ? 'Fertig' : `${m.done}/${m.total}`)
    // The crabs sit beside the crew button: who is working, else the last ones who finished.
    const crewCrabs = [...working, ...recent].slice(0, 4)
    // Never fewer than two crabs: Bibi (the lead) and Diddy keep the crew company.
    const idleCrabs = IDLE_CREW.filter(d => !crewCrabs.some(m => m.design === d)).slice(0, Math.max(0, 2 - crewCrabs.length))
    // Below the milestone: the 5-hour window first, then the context.
    const meterRows = [...meters].reverse()

    // Two columns: milestone over the meters on the left, crew over tasks on the right.
    // Every Svg gets an explicit size: an interactive (animated) Svg is drawn in a frame that
    // would otherwise take a default height and leave empty space above the prompt.
    // No interactive Svg in the band: an interactive one is a frame, and the band is redrawn
    // every second or two while a builder works, which made the frames flash. The twinkle and
    // the walk are drawn as pictures instead, one per animation frame (FRAME_MS).
    if (e.surface !== 'terminal' && 'Svg' in table) {
      const { Svg } = table
      const crabH = Math.round((MINI_CRAB_W * CANVAS_H) / CANVAS_W)
      // The week bar fills the space between the two columns; on a narrow window it steps aside.
      // The right column is as wide as its crab row or its tasks button, whichever is wider.
      const crabRowW =
        (crewCrabs.length + idleCrabs.length) * (MINI_CRAB_W + 8) + 60 + (working.length > 0 ? 24 : 0) + (isCrewPaneOpen ? 20 : 0)
      const tasksW = 110 + (doing > 0 ? 24 : 0) + (isTasksPaneOpen ? 20 : 0)
      const roomW = Math.floor(
        (e.props.bodyColumns * BAND_PX_PER_COLUMN - FLOW_W - Math.max(crabRowW, tasksW) - 2 * COLUMN_GAP_W) * WEEK_SAFETY,
      )
      const weekW = roomW < WEEK_MIN_W ? 0 : Math.min(WEEK_MAX_W, roomW)
      return (
        <Box flexDirection="row" justifyContent="space-between" alignItems="flex-start">
          <Box flexDirection="column" flexShrink={1}>
            <Box flexDirection="row" alignItems="center" gap={1}>
              {milestone ? (
                <Svg
                  key="flow"
                  source={flowSvg({
                    width: FLOW_W,
                    title: milestone.title,
                    done: milestone.done,
                    doing: milestone.doing,
                    total: milestone.total,
                    label: flowLabel(milestone),
                    isFinished: milestone.isFinished,
                    isWorking: working.length > 0,
                    frame: frameNo,
                  })}
                  width={FLOW_W}
                  height={FLOW_H}
                  alt={`${milestone.title}: ${flowLabel(milestone)}`}
                />
              ) : (
                <Text color={NEON.muted}>Keine Aufgabenliste</Text>
              )}
            </Box>
            {/* One drawing as wide as the milestone bar above it, values inside the bars. */}
            <Svg
              key="meters"
              source={meterRowSvg(
                FLOW_W,
                meterRows.map(row => ({ label: row.short, percent: row.percent, level: levelOf(row.percent), text: row.shortDetail })),
              )}
              width={FLOW_W}
              height={METER_ROW_H}
              alt={meterRows.map(row => `${row.label}: ${row.detail}`).join(' · ')}
            />
            {below}
          </Box>
          {weekW > 0 ? (
            <Box flexDirection="column" flexShrink={1} marginLeft={2}>
              <Svg
                key="week"
                source={weekSvg({ width: weekW, percent: week.percent, pace: week.pace, caption: week.label || week.caption })}
                width={weekW}
                height={WEEK_H}
                alt={`Woche: ${week.short} · ${week.caption}`}
              />
            </Box>
          ) : null}
          <Box flexDirection="column" alignItems="flex-end" flexShrink={0} marginLeft={2}>
            <Box flexDirection="row" alignItems="center" gap={1}>
              {crewCrabs.map(member => (
                <Svg
                  key={`crab-${member.id}`}
                  source={crabSvg(member.design, member.status, MINI_CRAB_W, true, frameNo)}
                  width={MINI_CRAB_W}
                  height={crabH}
                  alt={`${member.name} ${STATUS_WORD[member.status]}: ${member.task}`}
                />
              ))}
              {idleCrabs.map(design => (
                <Svg
                  key={`crab-idle-${design}`}
                  source={crabSvg(design, 'done', MINI_CRAB_W, false)}
                  width={MINI_CRAB_W}
                  height={crabH}
                  alt={`${designOf(design).name} wartet auf Arbeit`}
                />
              ))}
              {crewButton}
            </Box>
            <Svg key="gap" source={SPACER_SVG} width={1} height={4} alt="Abstand" />
            {tasksButton}
          </Box>
        </Box>
      )
    }

    const flowCells = Math.max(8, Math.min(16, e.props.bodyColumns - 60))
    const flowBar = milestone ? textBar(milestone.total === 0 ? 0 : (milestone.done / milestone.total) * 100, flowCells) : null
    return (
      <Box flexDirection="row" justifyContent="space-between">
        <Box flexDirection="column" flexShrink={1}>
          <Box flexDirection="row" gap={1}>
            {milestone && flowBar ? (
              <Box flexDirection="row" gap={1}>
                <Text color={milestone.isFinished ? NEON.green : NEON.cyan}>●</Text>
                <Text color={NEON.fg}>{/^(M\d+)\b/.exec(milestone.title)?.[1] ?? milestone.title}</Text>
                <Box flexDirection="row">
                  <Text color={NEON.purple}>{flowBar.filled}</Text>
                  <Text color={NEON.muted}>{flowBar.empty}</Text>
                </Box>
                <Text bold color={NEON.purple}>{flowLabel(milestone)}</Text>
              </Box>
            ) : (
              <Text color={NEON.muted}>Keine Aufgabenliste</Text>
            )}
          </Box>
          <Box flexDirection="row" columnGap={3} flexWrap="wrap">
            {meterRows.map(row => {
              const level = levelOf(row.percent)
              const bar = textBar(row.percent, 8)
              return (
                <Box key={row.key} flexDirection="row" gap={1}>
                  <Text color={NEON.muted}>{row.short}</Text>
                  <Box flexDirection="row">
                    <Text color={LEVEL_COLOR[level]}>{bar.filled}</Text>
                    <Text color={NEON.muted}>{bar.empty}</Text>
                  </Box>
                  <Text color={LEVEL_COLOR[level]}>{row.shortDetail}</Text>
                </Box>
              )
            })}
            <Box key="week" flexDirection="row" gap={1}>
              <Text color={NEON.muted}>Wo:</Text>
              <Box flexDirection="row">
                <Text color={NEON.teal}>{textBar(week.percent, 8).filled}</Text>
                <Text color={NEON.muted}>{textBar(week.percent, 8).empty}</Text>
              </Box>
              <Text color={NEON.teal}>{week.short}</Text>
            </Box>
            {below}
          </Box>
        </Box>
        <Box flexDirection="column" alignItems="flex-end" flexShrink={0} marginLeft={2}>
          <Box flexDirection="row" gap={1}>
            {crewCrabs.map(member => (
              <Text key={`crab-${member.id}`} color={isEnded(member.status) ? NEON.muted : designOf(member.design).accent}>
                ▝▜█▛▘
              </Text>
            ))}
            {idleCrabs.map(design => (
              <Text key={`crab-idle-${design}`} color={designOf(design).accent}>
                ▝▜█▛▘
              </Text>
            ))}
            {crewButton}
          </Box>
          {tasksButton}
        </Box>
      </Box>
    )
  })

  // ------------------------------------------------------------ tasks pane

  on('ui.render', { component: 'Pane', requestId: TASKS_PANE }, async ($, e) => {
    const list = await read($, files)
    const isShowingDone = await read($, showDone)
    const { total, done } = countTasks(list)
    const { Box, Button, Text } = $.ui.resolve(e)
    const barCells = Math.max(8, Math.min(30, e.props.bodyColumns - 22))
    const filled = total === 0 ? 0 : Math.round((barCells * done) / total)

    return (
      <Box flexDirection="column">
        <Box flexDirection="row" justifyContent="space-between">
          <Box flexDirection="row" gap={1}>
            <Text color={NEON.green}>{'█'.repeat(filled)}</Text>
            <Text color={NEON.muted}>{'░'.repeat(barCells - filled)}</Text>
            <Text bold color={NEON.fg}>{`${done}/${total}`}</Text>
          </Box>
          <Box flexDirection="row" gap={1}>
            <Button key="toggle-done" plain dimColor onPress={() => update($, showDone, v => !v)}>
              {isShowingDone ? 'Erledigte ausblenden' : 'Erledigte zeigen'}
            </Button>
            <Button key="refresh" plain dimColor onPress={() => rescanTasks($, true)}>
              ↻
            </Button>
          </Box>
        </Box>

        {list.length === 0 && (
          <Box flexDirection="column" marginTop={1}>
            <Text color={NEON.muted}>Keine TASKS.md gefunden.</Text>
            <Text color={NEON.muted}>Erwartet: notes/TASKS.md oder projects/&lt;name&gt;/notes/TASKS.md</Text>
          </Box>
        )}

        {list.map(file => (
          <Box key={file.path} flexDirection="column" marginTop={1}>
            {list.length > 1 && <Text bold underline color={NEON.blue}>{file.project}</Text>}
            {file.groups.map(group => {
              const visible = group.tasks.filter(t => isShowingDone || t.state !== 'done')
              const groupDone = group.tasks.filter(t => t.state === 'done').length
              const isComplete = groupDone === group.tasks.length
              return (
                <Box key={`${file.path}#${group.title}`} flexDirection="column" marginTop={1}>
                  <Text bold color={isComplete ? NEON.green : NEON.purple}>
                    {`${group.title}  `}
                    <Text color={NEON.muted}>{`${groupDone}/${group.tasks.length}`}</Text>
                  </Text>
                  {visible.map(task => (
                    <Button
                      key={`${file.path}:${task.line}`}
                      plain
                      dimColor={task.state === 'done'}
                      onPress={() => toggleTask($, file, task)}
                    >
                      <Text color={TASK_COLOR[task.state]}>{`${TASK_GLYPH[task.state]} `}</Text>
                      <Text strikethrough={task.state === 'done'}>{task.text}</Text>
                    </Button>
                  ))}
                </Box>
              )
            })}
          </Box>
        ))}
      </Box>
    )
  })

  // ------------------------------------------------------------ crew pane

  on('ui.render', { component: 'Pane', requestId: CREW_PANE }, async ($, e) => {
    const members = await read($, crew)
    const stats = await read($, crewStats)
    const isCollapsed = await read($, isCrewCollapsed)
    const isDynamicOn = await read($, isDynamic)
    await read($, beat)
    const frameNo = await read($, frame)
    const now = await $.clock.now()
    const table = $.ui.resolve(e)
    const { Box, Button, Text } = table

    const statOf = (member: CrewMember): CrewStats => stats[member.id] ?? EMPTY_STATS
    const working = members.filter(m => !isEnded(m.status)).reverse()
    const finished = members.filter(m => isEnded(m.status)).reverse()
    const totalTokens = members.reduce((sum, m) => sum + statOf(m).tokens, 0)
    const totalUsd = members.reduce((sum, m) => sum + statOf(m).usd, 0)
    const firstStart = members.length === 0 ? now : Math.min(...members.map(m => m.startedAt))
    const lastEnd = working.length > 0 ? now : Math.max(firstStart, ...members.map(m => m.endedAt ?? now))
    const elapsed = (member: CrewMember) => (member.endedAt ?? now) - member.startedAt

    const statsLine = (member: CrewMember) => {
      const s = statOf(member)
      return `ctx ${Math.round(s.ctxPercent)}% · ${formatTokens(s.tokens)} ${usdText(s.usd)} ${clockText(elapsed(member))}`
    }
    const subLine = (member: CrewMember) => {
      const s = statOf(member)
      return `${s.model || 'startet …'}${s.effort ? ` · ${s.effort}` : ''}${member.status === 'failed' ? ' · Fehler' : ''}`
    }

    // The mode switch: always Opus High, or Opus / Sonnet / Haiku by how hard the task is.
    const modeRow = (
      <Box flexDirection="row" justifyContent="space-between" marginTop={1}>
        <Text color={NEON.muted}>Agents</Text>
        <Button key="toggle-dynamic" plain dimColor={!isDynamicOn} onPress={() => toggleDynamic($)}>
          {isDynamicOn ? '◉ dynamisch (Opus/Sonnet/Haiku)' : '○ immer Opus High'}
        </Button>
      </Box>
    )
    const header = (
      <Box flexDirection="row" justifyContent="space-between" marginTop={1}>
        <Text color={working.length > 0 ? NEON.cyan : NEON.muted}>{`Läuft · ${working.length}`}</Text>
        {finished.length > 0 && (
          <Button
            key="clear-crew"
            plain
            dimColor
            onPress={() => update($, crew, list => list.filter(m => !isEnded(m.status)))}
          >
            Fertige entfernen
          </Button>
        )}
      </Box>
    )
    const finishedToggle = finished.length > 0 && (
      <Button key="collapse-crew" plain dimColor onPress={() => update($, isCrewCollapsed, v => !v)}>
        {`${isCollapsed ? '▸' : '▾'} Fertig · ${finished.length}`}
      </Button>
    )
    const empty = members.length === 0 && (
      <Box flexDirection="column" marginTop={1}>
        <Text color={NEON.muted}>Noch keine Agents in dieser Sitzung.</Text>
        <Text color={NEON.muted}>Sag im Chat z. B.: „Gib die nächste Aufgabe an einen Builder.“</Text>
      </Box>
    )

    if (e.surface !== 'terminal' && 'Svg' in table) {
      const { Svg } = table
      const width = Math.max(240, Math.min(460, e.props.bodyColumns * PX_PER_COLUMN - 8))
      // Rows stay images: their figures change every beat, and an interactive frame would
      // reload (flash) on each change. The crab walks by the animation frame instead.
      const row = (member: CrewMember) => (
        <Svg
          key={`row-${member.id}`}
          source={crewRowSvg({
            width,
            design: member.design,
            accent: designOf(member.design).accent,
            title: member.task,
            name: member.name,
            sub: subLine(member),
            statusWord: STATUS_WORD[member.status],
            stats: statsLine(member),
            status: member.status,
            barShare: member.status === 'done' ? 1 : statOf(member).ctxPercent / 100,
            frame: frameNo,
          })}
          width={width}
          height={66}
          alt={`${member.name}: ${member.task}, ${STATUS_WORD[member.status]}, ${statsLine(member)}`}
        />
      )
      return (
        <Box flexDirection="column">
          <Svg
            key="tiles"
            source={tilesSvg(width, [
              { label: 'Kosten', value: usdText(totalUsd) },
              { label: 'Tokens', value: formatTokens(totalTokens) },
              { label: 'Zeit', value: clockText(lastEnd - firstStart) },
            ])}
            width={width}
            height={48}
            alt={`Kosten ${usdText(totalUsd)}, Tokens ${formatTokens(totalTokens)}, Zeit ${clockText(lastEnd - firstStart)}`}
          />
          {modeRow}
          {header}
          {working.map(row)}
          {finishedToggle}
          {!isCollapsed && finished.map(row)}
          {empty}
        </Box>
      )
    }

    const textRow = (member: CrewMember) => (
      <Box key={`row-${member.id}`} flexDirection="row" gap={2} marginTop={1}>
        <Box flexDirection="column">
          {CLAWD_TEXT.map((line, i) => (
            <Text key={`clawd-${member.id}-${i}`} color={isEnded(member.status) ? NEON.muted : designOf(member.design).accent}>
              {line}
            </Text>
          ))}
        </Box>
        <Box flexDirection="column" flexShrink={1}>
          <Text bold color={NEON.fg}>{member.task}</Text>
          <Text>
            <Text color={designOf(member.design).accent}>{member.name}</Text>
            <Text color={NEON.muted}>{`  ${subLine(member)}`}</Text>
          </Text>
          <Text color={STATUS_COLOR[member.status]}>{`${STATUS_WORD[member.status]} · ${statsLine(member)}`}</Text>
        </Box>
      </Box>
    )
    return (
      <Box flexDirection="column">
        <Text color={NEON.fg}>{`Kosten ${usdText(totalUsd)} · Tokens ${formatTokens(totalTokens)} · Zeit ${clockText(lastEnd - firstStart)}`}</Text>
        {modeRow}
        {header}
        {working.map(textRow)}
        {finishedToggle}
        {!isCollapsed && finished.map(textRow)}
        {empty}
      </Box>
    )
  })
}
