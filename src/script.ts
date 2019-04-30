import { Theme, Gridable, CanvasTerminal } from './terminal'
import { Sheet } from './sheet'

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
        return [this.get(x - 1, y),
                this.get(x + 1, y),
                this.get(x - 1, y - 1),
                this.get(x, y - 1),
                this.get(x + 1, y - 1),
                this.get(x - 1, y + 1),
                this.get(x, y + 1),
                this.get(x + 1, y + 1)].filter(m => m === '2').length
    }

    tick() {
        const newObjects = new Map()
        for (const [[x, y], c] of this.entries()) {
            switch (c) {
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

class WireWorldTerminal extends Gridable(CanvasTerminal) {
    tick: number = 0
    running = true 

    constructor(sheet: WireWorldSheet, w: number, h: number, canvas: HTMLCanvasElement, theme: Theme) {
        super(sheet, w, h, canvas, theme)

        window.addEventListener("keydown", (e) => {
            this.onKeyDown(e)
            this.update()
        }, false)

        window.onresize = (event) => { 
            this.resize(window.innerWidth, window.innerHeight) 
        }

        window.setInterval(() => {
            if (this.running) {
                sheet.tick()
                this.tick += 1
                this.update()
            }
        }, 200)
    }

    draw() {
        this.print(`LEN`, 0, this.height + 1, this.theme.f_med)
        this.print(`POS`, 0, this.height + 2, this.theme.f_med)
        this.print(`CLK`, 12, this.height + 1, this.theme.f_med)
        this.print(`  S`, 24, this.height + 1, this.theme.f_med)
        this.print(`  G`, 24, this.height + 2, this.theme.f_med)

        this.print(`${this.width}×${this.height}`, 4, this.height + 1)
        this.print(`${this.cursor.x},${this.cursor.y}`, 4, this.height + 2)
        this.print(`${this.tick}`, 16, this.height + 1)
        this.print(`${this.running ? 'RUN' : 'STOP' }`, 28, this.height + 1)
        this.print(`${this.showGrid.toUpperCase()}`, 28, this.height + 2)
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

    registerKeys() {
        super.registerKeys()

        this.keyHandler.registerKeys(
            { key: 's', action: () => { this.running = !this.running } }
        )
    }

    onKeyDown(e: KeyboardEvent) {
        if ('123'.includes(e.key)) {
            for (const [x, y] of this.cursor.selection())
                this.sheet.set(x, y, e.key)
        } else super.onKeyDown(e) 
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

new WireWorldTerminal(sheet, window.innerWidth, window.innerHeight, canvas, defaultTheme)