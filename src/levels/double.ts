import { Level } from '../level'
import { TileMap } from '../tile-map'
import * as emoji from '../emoji'

const createGrid = (width: number, numbers: string[]): DoubleSet[][] => {
  const rows = []
  for (const number of numbers) {
    rows.push(Array(width).fill(3))

    const digits = number.toString()
    const right = []
    for (const digit of digits) {
      right.push(+digit)
    }
    const left = Array(width - right.length - 1).fill(3)
    rows.push([...left, ...right, 3])
  }
  rows.push(Array(width).fill(3))
  return rows
}

type DoubleSet = 0 | 1 | 2 | 3 | 4 | 5
export class DoubleLevel extends Level<DoubleSet> {
  constructor(root: HTMLDivElement) {
    const width = 17
    const numbers = [
      '2111',
      '2112',
      '11002222',
      '22112110',
      '212011110101',
      '222120212020',
      '10112212010201',
      '22111201010001',
    ]

    super({
      start: TileMap.fromArray<DoubleSet>(createGrid(width, numbers)),
      goal: TileMap.fromArray<DoubleSet>(createGrid(
        width,
        numbers.map((x) => (parseInt(x, 3) * 2).toString(3)),
      )),
      ruleSize: [2, 2],
      root,
    })
  }

  imageFor(symbol: DoubleSet): string {
    if (symbol === 0) return emoji.ZERO
    if (symbol === 1) return emoji.ONE
    if (symbol === 2) return emoji.TWO
    if (symbol === 3) return emoji.BLUE
    if (symbol === 4) return emoji.RED
    else return emoji.YELLOW
  }

  advance(symbol: DoubleSet | null): DoubleSet | null {
    const n = ((symbol ?? -1) + 1) % 7
    if (n === 6) return null
    return n as DoubleSet
  }
}
