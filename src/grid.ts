import type { TileMap } from './tile-map'

export type GridTile = {
  image: string
  focused: boolean
}

export class Grid {
  root: HTMLDivElement
  data: TileMap<GridTile> | null
  onHover: ((x: number, y: number) => void) | null

  constructor(
    root: HTMLDivElement,
    onHover?: (x: number, y: number) => void,
  ) {
    this.root = root
    this.data = null
    this.onHover = onHover ?? null
  }

  rerender(data: TileMap<GridTile>) {
    console.log('INFO: grid was rerendered')

    // If the shape changes, we'll completely rerender the grid
    const newShape = data.shape()
    const oldShape = this.data?.shape()
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
          tile.addEventListener('hover', () => {
            this.onHover?.(i, j)
          })
        }
      }
      this.root.replaceChildren(...children)
    }

    // Now it's known the shape is the same
    // Simply update the DOM to match our new state
    const updates = [...this.root.children].flatMap((e, k) => {
      const i = k % newShape.width
      const j = Math.floor(k / newShape.width)
      const tileData = data.get(newShape.x + i, newShape.y + j)
      const oldData = oldShape && this.data && this.data.get(
        oldShape.x + i,
        oldShape.y + j,
      )

      if (tileData?.focused) {
        e.classList.add('focused')
      } else {
        e.classList.remove('focused')
      }

      if (tileData === undefined) {
        e.replaceChildren()
      } else {
        // Avoid recreating the image element unless we have to
        // Not sure if this matters
        if (e.children.length === 0) {
          const image = document.createElement('img')
          image.draggable = false
          e.replaceChildren(image)
        }
        const image = e.querySelector<HTMLImageElement>('img')!
        if (!oldData || oldData.image != tileData.image) {
          image.src = tileData.image
          return [[newShape.x + i, newShape.y + j, e]] as const
        }
      }
      return []
    })

    // Animate them diagonally
    updates.sort(([x, y]) => x + y)
    const grouped = Map.groupBy(updates, ([x, y]) => x + y)
    const sorted = [...grouped]
    sorted.sort(([a], [b]) => a - b)
    sorted.forEach(([_k, v], i) => v.forEach(([_x, _y, e]) => {
      e.animate(
        [ { transform: 'scale(1.1)' } ],
        {
          duration: 0.1 * 1000,
          iterations: 1,
          delay: i * 0.03 * 1000,
        }
      )
    }))

    this.data = data
  }
}
