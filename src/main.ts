import './style.css'
import { BeginLevel } from './levels/begin'
import { TriangleLevel } from './levels/triangle'
import { SquareLevel } from './levels/square'
import { MazeLevel } from './levels/maze'
import { DoubleLevel } from './levels/double'

const app = document.querySelector<HTMLDivElement>('#app')!
app.innerHTML = '<div class="level"></div>'

const number = new URLSearchParams(window.location.search).get('level')
const Level = number && [
  null,
  BeginLevel,
  TriangleLevel,
  SquareLevel,
  MazeLevel,
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
