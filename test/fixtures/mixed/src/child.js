import { helper } from './b.js'
import { Base } from './b.js'

export class Child extends Base {
  run() {
    return helper(2)
  }
}
