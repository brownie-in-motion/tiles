export type TileMapShape = {
  x: number
  y: number
  width: number
  height: number
}

export class TileMap<T> implements Iterable<[[number, number], T]> {
  data: Map<number, Map<number, T>>

  static fromArray<T>(array: T[][]): TileMap<T> {
    return new TileMap(array.flatMap(
      (row, j): [[number, number], T][] => row.map((v, i) => [[i, j], v])
    ))
  }

  constructor(data?: Iterable<[[number, number], T]>) {
    this.data = new Map()
    for (const [[x, y], v] of data ?? []) {
      this.set(x, y, v)
    }
  }

  get(x: number, y: number): T | undefined {
    return this.data.get(x)?.get(y)
  }

  set(x: number, y: number, v: T) {
    const column = this.data.get(x) ?? new Map()
    column.set(y, v)
    this.data.set(x, column)
  }

  map<U>(f: (item: T, x: number, y: number) => U): TileMap<U> {
    return new TileMap([...this].map(([[x, y], v]) => [[x, y], f(v, x, y)]))
  }

  shape(): TileMapShape {
    let minX = Infinity
    let maxX = -1
    let minY = Infinity
    let maxY = -1
    for (const [[x, y]] of this) {
      minX = Math.min(x, minX)
      maxX = Math.max(x, maxX)
      minY = Math.min(y, minY)
      maxY = Math.max(y, maxY)
    }

    return {
      x: minX,
      y: minY,
      width: (maxX + 1) - minX,
      height: (maxY + 1) - minY,
    }
  }

  *[Symbol.iterator](): Iterator<[[number, number], T], any, any> {
    for (const [x, m] of this.data) {
      for (const [y, v] of m) {
        yield [[x, y], v]
      }
    }
  }
}

