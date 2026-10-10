export type UsageSnapshot = {
  contextPercent: number | null
  contextTokens: number | null
  contextWindow: number
  fivePercent: number | null
  fiveResetsAt: string | null
}

export type TaskState = 'open' | 'doing' | 'done'

export type Task = {
  /** Line index in the file, so a press can flip exactly this line. */
  line: number
  text: string
  state: TaskState
}

export type TaskGroup = {
  title: string
  tasks: Task[]
}

export type TaskFile = {
  path: string
  project: string
  groups: TaskGroup[]
  mtimeMs: number
}

export type CrewStatus = 'working' | 'done' | 'failed' | 'waiting'

export type CrewMember = {
  /** The subagent's id from $.agent.list(). */
  id: string
  /** Index into the crab designs. */
  design: number
  /** The crab's name ("Diddy"). */
  name: string
  /** What it works on, without the "Name: " prefix. */
  task: string
  status: CrewStatus
  startedAt: number
  endedAt: number | null
  /** True once the "finished" toast was shown, so a flicker never toasts twice. */
  isNotified: boolean
}

/** Live figures of one builder, summed over its model requests. */
export type CrewStats = {
  /** Tokens processed: input + cache + output, summed over every request. */
  tokens: number
  /** Estimated US dollars at list price. */
  usd: number
  /** Input side of the latest request against the window, 0-100. */
  ctxPercent: number
  model: string
  effort: string
  /** Model requests so far. */
  steps: number
}

declare module 'claude-code' {
  interface PluginState {
    'builder-hud': {
      snapshot: UsageSnapshot | null
      tick: number
      beat: number
      files: TaskFile[]
      showDone: boolean
      isTasksOpen: boolean
      crew: CrewMember[]
      crewStats: Record<string, CrewStats>
      isCrewOpen: boolean
      isCrewCollapsed: boolean
    }
  }
}
