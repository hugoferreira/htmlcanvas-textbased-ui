import { CanvasTerminal } from './terminal'
import { Sheet } from './sheet'

class WireWorldTerminal extends CanvasTerminal {
    tick: number = 0

    draw() {
        this.print(`LEN`, 0, this.height + 1, this.theme.f_med)
        this.print(`POS`, 0, this.height + 2, this.theme.f_med)
        this.print(`CLK`, 12, this.height + 1, this.theme.f_med)

        this.print(`${this.width}×${this.height}`, 4, this.height + 1)
        this.print(`${this.cursor.x},${this.cursor.y}`, 4, this.height + 2)
        this.print(`${this.tick}`, 16, this.height + 1)    
    }

    protected stylize(cc: string | undefined, x: number, y: number): { c: string | undefined, fillStyle: string } {
        let { c, fillStyle } = super.stylize(cc, x, y)

        switch (c) {
            case '1': fillStyle = this.theme.b_med; break
            case '2': fillStyle = this.theme.f_med; break
            case '3': fillStyle = this.theme.f_low; break
        }

        return { c, fillStyle } 
    }

    onKeyDown(e: KeyboardEvent) {
        if ('123'.includes(e.key)) {
            for (const [x, y] of this.cursor.selection())
                this.sheet.set(x, y, e.key)
        } else super.onKeyDown(e) 
    }
}

class WireWorldSheet extends Sheet {
    load(prog: string, x: number, y: number) {
        for (const l of prog.split('\n').filter(l => l !== '')) {
            let cx = x
            for (const c of l) {
                if (c !== undefined && c !== '.' && c !== ' ') sheet.set(cx, y, c)
                cx += 1
            }
            y += 1
        }
    }

    countNear2s(x: number, y: number): number {
        return [this.get(x - 1, y    ),
                this.get(x + 1, y    ),
                this.get(x - 1, y - 1),
                this.get(x    , y - 1),
                this.get(x + 1, y - 1),
                this.get(x - 1, y + 1),
                this.get(x    , y + 1),
                this.get(x + 1, y + 1)].filter(m => m === '2').length
    }

    tick() {
        const newObjects = new Map()
        for(const [[x, y], c] of this.entries()) {
            switch(c) {
                case '3': newObjects.set(this.toKey(x, y), '1'); break
                case '2': newObjects.set(this.toKey(x, y), '3'); break
                case '1': 
                    let c = this.countNear2s(x, y)
                    if (c === 1 || c === 2) newObjects.set(this.toKey(x, y), '2')
                    else newObjects.set(this.toKey(x, y), '1')
                    break
            }
        }

        this.objects = newObjects
    }
}

const defaultTheme = {
    background: '#29272b',
    f_high: '#ffffff', f_med: '#e47464', f_low: '#6f6363', f_inv: '#000000',
    b_high: '#eeeeee', b_med: '#5f5353', b_low: '#47424a', b_inv: '#e47464' }

const p1 = `
.113211.
1......1
.112311.`

const canvas = document.getElementById('canvas') as HTMLCanvasElement
const sheet = new WireWorldSheet()
sheet.load(p1, 5, 5)
const terminal = new WireWorldTerminal(sheet, window.innerWidth, window.innerHeight, canvas, defaultTheme) 

window.addEventListener("keydown", (e) => { 
    terminal.onKeyDown(e)
    terminal.update()
}, false)

window.onresize = (event) => { terminal.resize(window.innerWidth, window.innerHeight) }

setInterval(() => { sheet.tick(); terminal.tick += 1; terminal.update() }, 200)