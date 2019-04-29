import { Sheet } from './sheet'
import { Cursor } from './cursor'

export class Scratchboard {
    private state = Array<string | undefined>()
    private stateWidth = 0 

    constructor(private readonly sheet: Sheet) {}

    copy(cursor: Cursor) {
        this.state.length = 0
        this.stateWidth = cursor.xLength
        for (const [x, y] of cursor.selection()) 
            this.state.push(this.sheet.get(x, y))
    }

    paste(cursor: Cursor) {
        let x = cursor.x
        let y = cursor.y

        for (const c of this.state) {
            if (c !== undefined) this.sheet.set(x, y, c)
            x += 1; if (x > cursor.x + this.stateWidth) { y += 1; x = cursor.x }
        }
    }
}