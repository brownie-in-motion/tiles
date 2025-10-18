import { Level } from '../level'
import { TileMap } from '../tile-map'
import * as emoji from '../emoji'

type MazeSet = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7
export class MazeLevel extends Level<MazeSet> {
  constructor(root: HTMLDivElement) {
    super({
      start: TileMap.fromArray<MazeSet>([
        [1, 1, 3, 1, 1, 1, 1, 1, 1, 0, 1],
        [1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 1],
        [1, 0, 1, 1, 1, 1, 1, 1, 1, 0, 0],
        [1, 0, 1, 0, 0, 0, 1, 0, 1, 0, 1],
        [1, 0, 0, 0, 1, 0, 1, 0, 0, 1, 1],
        [1, 1, 1, 1, 0, 0, 1, 1, 0, 1, 1],
        [1, 0, 0, 0, 0, 1, 1, 0, 0, 0, 1],
        [1, 1, 0, 1, 0, 1, 1, 0, 1, 0, 0],
        [0, 0, 1, 0, 0, 0, 1, 0, 1, 1, 1],
        [1, 0, 1, 0, 1, 0, 0, 0, 1, 0, 0],
        [1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1],
      ]),
      goal: TileMap.fromArray<MazeSet>([
        [1, 1, 0, 1, 1, 1, 1, 1, 1, 0, 1],
        [1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 1],
        [1, 0, 1, 1, 1, 1, 1, 1, 1, 0, 0],
        [1, 0, 1, 0, 0, 0, 1, 0, 1, 0, 1],
        [1, 0, 0, 0, 1, 0, 1, 0, 0, 1, 1],
        [1, 1, 1, 1, 0, 0, 1, 1, 0, 1, 1],
        [1, 0, 0, 0, 0, 1, 1, 0, 0, 0, 1],
        [1, 1, 0, 1, 0, 1, 1, 0, 1, 0, 3],
        [0, 0, 1, 0, 0, 0, 1, 0, 1, 1, 1],
        [1, 0, 1, 0, 1, 0, 0, 0, 1, 0, 0],
        [1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1],
      ]),
      ruleSize: [2, 2],
      root,
    })
  }

  imageFor(symbol: MazeSet): string {
    if (symbol === 0) return emoji.BLUE
    if (symbol === 1) return emoji.RED
    if (symbol === 2) return emoji.YELLOW
    if (symbol === 3) return emoji.FACE
    if (symbol === 4) return emoji.LEFT
    if (symbol === 5) return emoji.UP
    if (symbol === 6) return emoji.RIGHT
    return emoji.DOWN
  }

  advance(symbol: MazeSet | null): MazeSet | null {
    const n = ((symbol ?? -1) + 1) % 9
    if (n === 8) return null
    return n as MazeSet
  }
}
