import { Grid } from './grid'
import { PermutationList, Rules, type RuleClickEvent } from './rules'
import { TileMap } from './tile-map'

type LevelState<LevelSymbol> =
  | {
    label: 'default'
  }
  | {
    label: 'running'
    nextBoard: TileMap<LevelSymbol>
    activeRule: number
    iteration: number
    startTime: number
  }
  | {
    label: 'finished'
    result: TileMap<LevelSymbol>
  }

const replace = <T>(
  from: TileMap<T | null>,
  to: TileMap<T | null>,
  grid: TileMap<T>,
): TileMap<T> | null => {
  const fromShape = from.shape()
  const gridShape = grid.shape()

  // Search for a match. We begin where the bottom right corner of "from" can
  // touch the top left corner of "grid"
  let fromRight = fromShape.x + fromShape.width - 1
  let fromBottom = fromShape.y + fromShape.height - 1

  let startX = gridShape.x - fromRight
  let startY = gridShape.y - fromBottom
  let endX = startX + gridShape.width + fromShape.width - 1
  let endY = startY + gridShape.height + fromShape.height - 1

  let match
  found: {
    for (let offsetY = startY; offsetY < endY; offsetY++) {
      for (let offsetX = startX; offsetX < endX; offsetX++) {
        search: {
          let matchesSomething = false
          for (const [[i, j], value] of from) {
            // Null values in a pattern are not considered when matching
            if (value === null) continue

            const lookup = grid.get(offsetX + i, offsetY + j)
            if (
              // Non-null values that land on a missing square count as misses
              // (as well as non-matches, obviously)
              lookup === undefined
              || lookup !== value
            ) break search

            matchesSomething = true
          }

          // We don't consider blank grids to be a match
          if (matchesSomething) {
            match = [offsetX, offsetY]
            break found
          }
        }
      }
    }
  }

  if (match === undefined) return null
  const [matchX, matchY] = match

  // Now, perform the replacement in the grid
  const copy = new TileMap(grid)
  for (const [[i, j], value] of to) {
    if (value !== null && copy.get(matchX + i, matchY + j) !== undefined) {
      copy.set(matchX + i, matchY + j, value)
    }
  }
  return copy
}

const inState = <S, T extends LevelState<S>['label']>(
  label: T,
  state: LevelState<S>,
): state is LevelState<S> & { label: T } => {
  return state.label === label
}

export abstract class Level<LevelSymbol> {
  abstract advance(symbol: LevelSymbol | null): LevelSymbol | null
  abstract imageFor(symbol: LevelSymbol): string

  below: HTMLDivElement
  grid: Grid
  rules: Rules

  start: TileMap<LevelSymbol>
  goal: TileMap<LevelSymbol>
  ruleSize: [number, number]

  state: LevelState<LevelSymbol> | null
  showGoal: boolean
  ruleState: PermutationList<{
    from: TileMap<LevelSymbol | null>
    to: TileMap<LevelSymbol | null>
  }>

  reduce<I>(
    f: (
      state: LevelState<LevelSymbol>,
      input: I,
    ) => LevelState<LevelSymbol> | null
  ): (input: I) => void {
    return (input) => {
      if (this.state) {
        const result = f(this.state, input)
        if (result !== null) this.rerender(result)
      }
    }
  }

  reduceIf<T extends LevelState<LevelSymbol>['label'], I>(
    label: T,
    f: (
      state: LevelState<LevelSymbol> & { label: T },
      input: I,
    ) => LevelState<LevelSymbol>
  ): (input: I) => void {
    return (input) => {
      if (this.state && inState(label, this.state)) {
        const result = f(this.state, input)
        if (result !== null) this.rerender(result)
      }
    }
  }

  actions = {
    startExecution: this.reduce((state) => {
      return this.executeStep(state)
    }),
    cancelExecution: this.reduce((state) => {
      if (state.label === 'default') return null
      return {
        label: 'default',
        preview: 'start',
      }
    }),
  }

  constructor({ start, goal, ruleSize, root }: {
    start: TileMap<LevelSymbol>
    goal: TileMap<LevelSymbol>
    ruleSize: [number, number]
    root: HTMLDivElement
  }) {
    this.state = null
    this.showGoal = false
    this.ruleState = new PermutationList()

    root.innerHTML = `
      <div class="grid-wrapper"><div class="grid"></div></div>
      <div class="below"></diV>
      <div class="rules"></diV>
    `
    this.below = root.querySelector<HTMLDivElement>('.below')!
    this.grid = new Grid(root.querySelector<HTMLDivElement>('.grid')!)
    this.rules = new Rules(
      root.querySelector<HTMLDivElement>('.rules')!,
      this.rulesHandler.bind(this),
    )

    this.start = start
    this.goal = goal
    this.ruleSize = ruleSize

    this.rerender({ label: 'default' })
  }

  executeStep(state: LevelState<LevelSymbol>): LevelState<LevelSymbol> {
    const current = state.label !== 'running' ? this.start : state.nextBoard

    // Search for rules that match and yield a new board
    let result: [number, TileMap<LevelSymbol>] | null = null
    for (const [index, rule] of [...this.ruleState].entries()) {
      const nextBoard = replace(rule.from, rule.to, current)
      if (nextBoard !== null) {
        result = [index, nextBoard]
        break
      }
    }

    // If no rules match, the execution is over
    if (result === null) {
      return {
        label: 'finished',
        result: current,
      }
    }

    // Otherwise, update state with it
    const [rule, nextBoard] = result
    if (state.label !== 'running') {
      return {
        label: 'running',
        nextBoard: nextBoard,
        activeRule: rule,
        iteration: 1,
        startTime: Date.now(),
      }
    }

    return {
      label: 'running',
      nextBoard: nextBoard,
      activeRule: rule,
      iteration: state.iteration + 1,
      startTime: state.startTime,
    }
  }

  tick() {
    // We only tick during execution
    if (!this.state || this.state.label !== 'running') return

    // Advance current until the rate is just under one iteration a second
    let updated = null
    let current: LevelState<LevelSymbol> = this.state
    while (
      current.label === 'running'
      && (Date.now() - current.startTime) > current.iteration * 100
    ) {
      current = this.executeStep(current)
      updated = current
    }

    if (updated !== null) this.rerender(current)
  }

  rerender(state: LevelState<LevelSymbol>) {
    let runButton
    let showButton
    let cancelButton
    let selectedRule

    if (state.label === 'default') {
      if (this.state?.label !== 'default') {
        this.below.innerHTML = `
          <button class="show">Show target grid</button>
          <button class="run">Run</button>
        `
        showButton = this.below.querySelector('.show')
        runButton = this.below.querySelector('.run')
      }

      if (this.showGoal) {
        this.rerenderGrid(this.goal)
      } else {
        this.rerenderGrid(this.start)
      }
    } else if (state.label === 'running') {
      selectedRule = state.activeRule

      if (this.state?.label !== 'running') {
        this.below.innerHTML = `
          <button class="show">Show target grid</button>
          <button class="cancel">Cancel</button>
        `
        showButton = this.below.querySelector('.show')
        cancelButton = this.below.querySelector('.cancel')
      }

      if (this.showGoal) {
        this.rerenderGrid(this.goal)
      } else {
        this.rerenderGrid(state.nextBoard)
      }
    } else if (state.label === 'finished') {
      if (this.state?.label !== 'finished') {
        this.below.innerHTML = `
          <button class="show">Show target grid</button>
          <button class="cancel">Reset</button>
        `
        showButton = this.below.querySelector('.show')
        cancelButton = this.below.querySelector('.cancel')
      }

      if (this.showGoal) {
        this.rerenderGrid(this.goal)
      } else {
        this.rerenderGrid(state.result)
      }
    }

    showButton?.addEventListener('mousedown', () => {
      this.setPreview(true)
    })

    showButton?.addEventListener('mouseup', () => {
      this.setPreview(false)
    })

    runButton?.addEventListener('click', () => {
      this.actions.startExecution(null)
    })

    cancelButton?.addEventListener('click', () => {
      this.actions.cancelExecution(null)
    })

    const display = this.ruleState.map(({ from, to }) => ({
      leftGrid: from.map((v) => v === null ? null : this.imageFor(v)),
      rightGrid: to.map((v) => v === null ? null : this.imageFor(v)),
    }))

    // We always add a blank grid that users can interact with
    display.insert({
      leftGrid: new TileMap([[[1, 1], null], [this.ruleSize, null]]),
      rightGrid: new TileMap([[[1, 1], null], [this.ruleSize, null]]),
    })

    this.rules.rerender(display, false, selectedRule)
    this.state = state
  }

  rerenderGrid(map: TileMap<LevelSymbol>, focused?: TileMap<true>) {
    this.grid.rerender(map.map((v, x, y) => ({
      image: this.imageFor(v),
      focused: focused?.get(x, y) ?? false,
    })))
  }

  setPreview(showGoal: boolean) {
    this.showGoal = showGoal
    if (this.state) this.rerender(this.state)
  }

  rulesHandler(event: RuleClickEvent) {
    if (
      event.index >= this.ruleState.length()
      || event.label === 'lower' && event.index == this.ruleState.length() - 1
    ) {
      this.ruleState.insert({
        from: new TileMap([[[1, 1], null], [this.ruleSize, null]]),
        to: new TileMap([[[1, 1], null], [this.ruleSize, null]]),
      })
    }

    if (event.label === 'raise') {
      this.ruleState.raise(event.index)
    } else if (event.label === 'lower') {
      this.ruleState.lower(event.index)
    } else if (event.label === 'delete') {
      this.ruleState.delete(event.index)
    } else if (event.label === 'left-grid') {
      this.ruleState.replace(event.index, (v) => {
        const from = v.from
        const [x, y] = event.position
        from.set(x, y, this.advance(from.get(x, y) ?? null))
        return {
          ...v,
          from,
        }
      })
    } else if (event.label === 'right-grid') {
      this.ruleState.replace(event.index, (v) => {
        const to = v.to
        const [x, y] = event.position
        to.set(x, y, this.advance(to.get(x, y) ?? null))
        return {
          ...v,
          to,
        }
      })
    }

    if (this.state) {
      this.actions.cancelExecution(null)
      this.rerender(this.state)
    }
  }
}
