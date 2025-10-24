import './style.css'
import { AllLevel } from './levels/all'
import { FallLevel } from './levels/fall'
import { JayLevel } from './levels/jay'
import { TriangleLevel } from './levels/triangle'
import { SquareLevel } from './levels/square'
import { FrameLevel } from './levels/frame'
import { PathLevel } from './levels/path'
import { MazeLevel } from './levels/maze'
import { HoleLevel } from './levels/hole'
import { SpiralLevel } from './levels/spiral'
import { DoubleLevel } from './levels/double'
import { HalfLevel } from './levels/half'
import { QuarterLevel } from './levels/quarter'
import { CornerLevel } from './levels/corner'

const app = document.querySelector<HTMLDivElement>('#app')!
app.innerHTML = '<div class="level"></div>'

const number = new URLSearchParams(window.location.search).get('level')
const Level = number && [
  null,
  AllLevel,
  FallLevel,
  JayLevel,
  TriangleLevel,
  PathLevel,
  SquareLevel,
  CornerLevel,
  HalfLevel,
  QuarterLevel,
  FrameLevel,
  MazeLevel,
  HoleLevel,
  SpiralLevel,
  DoubleLevel,
][+number]
if (!Level) {
  window.location.href = '/?level=1'
  throw void 0;
}

const level = new Level(app.querySelector<HTMLDivElement>('.level')!)

const loop = () => {
  level.tick()
  requestAnimationFrame(loop)
}
loop()
