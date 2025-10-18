import type { TileMap } from './tile-map'

export class PermutationList<T> implements Iterable<T> {
  data: Map<number, T> = new Map()
  order: number[] = []

  length() {
    return this.order.length
  }

  insert(value: T) {
    const id = Math.max(-1, ...this.data.keys()) + 1
    this.data.set(id, value)
    this.order.push(id)
  }

  write(index: number, value: T) {
    if (index >= this.order.length) return
    const id = this.order[index]
    this.data.set(id, value)
  }

  replace(index: number, f: (value: T) => T) {
    if (index >= this.order.length) return
    const id = this.order[index]
    const value = this.data.get(id)!
    this.data.set(id, f(value))
  }

  delete(index: number) {
    if (index >= this.order.length) return
    const [id] = this.order.splice(index, 1)
    this.data.delete(id)
  }

  raise(index: number) {
    if (index <= 0) return
    [this.order[index - 1], this.order[index]] = [
      this.order[index],
      this.order[index - 1],
    ]
  }

  lower(index: number) {
    if (index >= this.order.length - 1) return
    [this.order[index + 1], this.order[index]] = [
      this.order[index],
      this.order[index + 1],
    ]
  }

  map<U>(f: (item: T) => U): PermutationList<U> {
    const copy: PermutationList<U> = new PermutationList()
    copy.data = new Map([...this.data].map(([i, v]) => [i, f(v)]))
    copy.order = Array.from(this.order)
    return copy
  }

  toList<U>(f: (id: number, value: T, index: number) => U): U[] {
    return this.order.map((k, i) => f(k, this.data.get(k)!, i))
  }

  *[Symbol.iterator](): Iterator<T, any, any> {
    for (const k of this.order) {
      yield this.data.get(k)!
    }
  }
}

export type RuleClickEvent =
  | { label: 'raise', index: number }
  | { label: 'lower', index: number }
  | { label: 'delete', index: number }
  | { label: 'left-grid', index: number, position: [number, number] }
  | { label: 'right-grid', index: number, position: [number, number] }

export type RuleEntry = {
  leftGrid: TileMap<string | null>,
  rightGrid: TileMap<string | null>,
}

export class Rules {
  root: HTMLDivElement
  savedElements: Map<number, [RuleEntry, HTMLDivElement]>
  onEvent: ((event: RuleClickEvent) => void) | null

  constructor(
    root: HTMLDivElement,
    onEvent?: (event: RuleClickEvent) => void,
  ) {
    this.root = root
    this.savedElements = new Map()
    this.onEvent = onEvent ?? null

    this.root.classList.add('rules')
  }

  rerender(
    list: PermutationList<RuleEntry>,
    disabled: boolean,
    selected?: number,
  ) {
    console.log('INFO: rules were rerendered')

    if (disabled) {
      this.root.classList.add('disabled')
    } else {
      this.root.classList.remove('disabled')
    }

    const elements: [number, [RuleEntry, HTMLDivElement]][] = list.toList(
      (id, value, i) => [id, [value, this.getElement(id, value, i)]]
    )

    const es = elements.map(([, [, e]]) => e)
    if (es.length === this.root.children.length) {
      for (let i = 0; i < es.length; i++) {
        if (es[i] != this.root.children[i]) {
          this.root.replaceChildren(...es)
          break
        }
      }
    } else {
      this.root.replaceChildren(...es)
    }

    for (let i = 0; i < es.length; i++) {
      if (i === selected) {
        es[i].classList.add('selected')
      } else {
        es[i].classList.remove('selected')
      }
    }

    this.savedElements = new Map(elements)
  }

  getElement(id: number, value: RuleEntry, index: number): HTMLDivElement {
    const saved = this.savedElements.get(id)

    let element
    let previous = null
    if (!saved) {
      element = document.createElement('div')
      element.classList.add('rule')
      element.innerHTML = `
        <div class="controls">
          <button class="up">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="8"
              height="8"
              viewBox="0 0 8 8"
              fill="none"
              stroke="currentColor"
              stroke-width="1"
              stroke-linecap="round"
              stroke-linejoin="round">
              <path d="
                M 2, 5
                l 2, -2
                l 2, 2
              " />
            </svg>
          </button>
          <button class="delete">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="8"
              height="8"
              viewBox="0 0 8 8"
              fill="none"
              stroke="currentColor"
              stroke-width="1"
              stroke-linecap="round"
              stroke-linejoin="round">
              <path d="
                M 5.5, 2.5
                l -3, 3
              " />
              <path d="
                M 2.5, 2.5
                l 3, 3
              " />
            </svg>
          </button>
          <button class="down">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="8"
              height="8"
              viewBox="0 0 8 8"
              fill="none"
              stroke="currentColor"
              stroke-width="1"
              stroke-linecap="round"
              stroke-linejoin="round">
              <path d="
                M 2, 3
                l 2, 2
                l 2, -2
              " />
            </svg>
          </button>
        </div>
        <div class="rule-grid left-grid"></div>
        <div class="rule-grid right-grid"></div>
      `
    } else {
      [previous, element] = saved
    }

    this.renderGrid(
      element.querySelector<HTMLDivElement>('.left-grid')!,
      previous?.leftGrid ?? null,
      value.leftGrid,
      (i, j) => this.onEvent?.({
        label: 'left-grid',
        index,
        position: [i, j],
      }),
    )

    this.renderGrid(
      element.querySelector<HTMLDivElement>('.right-grid')!,
      previous?.rightGrid ?? null,
      value.rightGrid,
      (i, j) => this.onEvent?.({
        label: 'right-grid',
        index,
        position: [i, j],
      }),
    )

    const up = element.querySelector<HTMLDivElement>('.up')!
    const del = element.querySelector<HTMLDivElement>('.delete')!
    const down = element.querySelector<HTMLDivElement>('.down')!

    up.onclick = () => this.onEvent?.({
      label: 'raise',
      index,
    })

    del.onclick = () => this.onEvent?.({
      label: 'delete',
      index,
    })

    down.onclick = () => this.onEvent?.({
      label: 'lower',
      index,
    })

    return element
  }

  renderGrid(
    element: HTMLDivElement,
    oldData: TileMap<string | null> | null,
    newData: TileMap<string | null>,
    onClick?: (i: number, j: number) => void,
  ) {
    const newShape = newData.shape()
    const oldShape = oldData?.shape()
    if (
      !oldShape
      || newShape.width != oldShape.width
      || newShape.height != oldShape.height
    ) {
      const children = []
      for (let j = 0; j < newShape.height; j++) {
        for (let i = 0; i < newShape.width; i++) {
          const tile = document.createElement('div')
          children.push(tile)
          tile.classList.add('tile')
          tile.style.gridArea = `${j + 1} / ${i + 1}`
        }
      }
      element.replaceChildren(...children)
    }

    ([...element.children] as HTMLElement[]).forEach((e, k) => {
      const i = k % newShape.width
      const j = Math.floor(k / newShape.width)
      const tileData = newData.get(newShape.x + i, newShape.y + j)

      // We use the event handler property instead of adding a listener so it
      // cleans up the last one. Maybe not ideal
      e.onclick = () => {
        onClick?.(newShape.x + i, newShape.y + j)
        e.animate(
          [ { transform: 'scale(1)' } ],
          {
            duration: 0.1 * 1000,
            iterations: 1,
          }
        )
      }

      if (tileData === undefined || tileData === null) {
        e.replaceChildren()
      } else {
        if (e.children.length === 0) {
          console.log('drawing image')
          const image = document.createElement('img')
          image.draggable = false
          e.replaceChildren(image)
        }
        const image = e.querySelector<HTMLImageElement>('img')!
        if (!oldData || oldData != newData) {
          image.src = tileData
        }
      }
    })
  }
}
