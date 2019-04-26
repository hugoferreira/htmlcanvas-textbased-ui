interface Theme {
    background: string
    f_high: string, f_med: string, f_low: string, f_inv: string
    b_high: string, b_med: string, b_low: string, b_inv: string
}

class Cursor {
    x = 0; y = 0; xLength = 0; yLength = 0

    constructor(public width: number = 0, public height: number = 0) { } 

    setSize(width: number, height: number) {
        this.width = width
        this.height = height

        this.clampLocation()
    }

    clampLocation() { 
        this.x = Math.min(this.x, this.width - this.xLength)
        this.y = Math.min(this.y, this.height - this.yLength)
        if (this.x < 0) this.x = 0
        if (this.y < 0) this.y = 0
    }

    isAt(x: number, y: number) { return this.x === x && this.y === y }

    contains(x: number, y: number) { 
        return x >= this.x && x <= (this.x + this.xLength) && 
               y >= this.y && y <= (this.y + this.yLength)
    }

    moveRight(i: number = 1) { this.x += i; this.clampLocation() }
    moveLeft(i: number = 1)  { this.x -= i; this.clampLocation() }
    moveUp(i: number = 1)    { this.y -= i; this.clampLocation() }
    moveDown(i: number = 1)  { this.y += i; this.clampLocation() }

    *selection(): IterableIterator<[number, number]> {
        for (let y = this.y; y <= this.y + this.yLength; y += 1)
            for (let x = this.x; x <= this.x + this.xLength; x += 1)
                yield [x, y]
    }

    enlarge(w: number = 0, h: number = 0) { 
        this.xLength = Math.min(this.xLength + w, this.width - this.x)
        this.yLength = Math.min(this.yLength + h, this.height - this.y)
    }

    shrink(w: number = 0, h: number = 0) { 
        this.xLength = Math.max(0, this.xLength - w) 
        this.yLength = Math.max(0, this.yLength - h) 
    }
}

class Sheet {
    objects = new Map<string, string>()

    protected toKey = (x: number, y: number) => `${x},${y}`
    protected fromKey = (s: string) => s.split(',').map(m => parseInt(m, 10)) as [number, number]

    get(x: number, y: number): string | undefined {
        return this.objects.get(this.toKey(x, y))
    }

    set(x: number, y: number, o: string) {
        this.objects.set(this.toKey(x, y), o)
    }

    unset(x: number, y: number) {
        this.objects.delete(this.toKey(x, y))
    }

    *entries(): IterableIterator<[[number, number], string]> {
        for(const p of this.objects)
            yield [this.fromKey(p[0]), p[1]]
    }
}

class Scratchboard {
    private state = Array<string | undefined>()
    private stateWidth = 0 

    constructor(private readonly sheet: Sheet) {}

    copy(cursor: Cursor) {
        this.state.length = 0
        this.stateWidth = cursor.xLength
        for (const [x, y] of cursor.selection()) 
            this.state.push(sheet.get(x, y))
    }

    paste(cursor: Cursor) {
        let x = cursor.x
        let y = cursor.y

        for (const c of this.state) {
            if (c !== undefined) sheet.set(x, y, c)
            x += 1; if (x > cursor.x + this.stateWidth) { y += 1; x = cursor.x }
        }
    }
}

class Terminal {
    fontSize = { width: 10, height: 18 }
    padding = { left: 60, top: 20, right: 60, bottom: 60 }    
    width!: number
    height!: number
    cursor: Cursor
    clipboard: Scratchboard
    tick: number = 0
    protected scrWidth!: number 
    protected scrHeight!: number

    constructor(private readonly sheet: Sheet, protected readonly ctx: CanvasRenderingContext2D, private readonly theme: Theme) {
        this.cursor = new Cursor()
        this.clipboard = new Scratchboard(sheet)
        this.update()
    }

    resize(scrWidth: number, scrHeight: number) {
        this.scrHeight = scrHeight
        this.scrWidth = scrWidth

        this.width = Math.floor((scrWidth - this.padding.left - this.padding.right) / this.fontSize.width) - 1
        this.height = Math.floor((scrHeight - this.padding.top - this.padding.bottom) / this.fontSize.height) - 1

        this.cursor.setSize(this.width - 1, this.height - 1)
    }

    update() {
        this.ctx.fillStyle = this.theme.background
        this.ctx.fillRect(0, 0, this.scrWidth, this.scrHeight)

        this.drawCursor()

        for (let i = 0; i < this.height; i += 1) {
            for (let j = 0; j < this.width; j += 1) {
                let c = this.sheet.get(j, i) 
                
                if (c === undefined) {
                    this.ctx.fillStyle = this.theme.b_low
                    c = ((j % 5) === 0 && (i % 5 === 0)) ? '+' : '·'
                } else {
                    this.ctx.fillStyle = this.stylize(c)
                }
                
                if (this.cursor.contains(j, i)) this.ctx.fillStyle = this.theme.f_inv 
                this.drawChar(c, j, i)
            }
        }

        this.print(`LEN`, 0, this.height + 1, this.theme.f_med)
        this.print(`POS`, 0, this.height + 2, this.theme.f_med)
        this.print(`CLK`, 12, this.height + 1, this.theme.f_med)    

        this.print(`${this.width}×${this.height}`, 4, this.height + 1)
        this.print(`${this.cursor.x},${this.cursor.y}`, 4, this.height + 2)    
        this.print(`${this.tick}`, 16, this.height + 1)    
    }

    stylize(c: string): string {
        switch (c) {
            case '2': return this.theme.f_med
            case '3': return this.theme.f_low
        }

        return this.theme.b_low
    }

    drawCursor() {
        this.ctx.fillStyle = this.theme.b_inv
        for (const [x, y] of this.cursor.selection())
            this.drawCharBackground(x, y)
    }

    drawCharBackground(x: number, y: number) {
        this.ctx.fillRect(x * this.fontSize.width + this.padding.left,
                          y * this.fontSize.height + this.padding.top,
                          this.fontSize.width, this.fontSize.height)
    }

    drawChar(c: string, x: number, y: number) {
        this.ctx.fillText(c, (x + 0.5) * this.fontSize.width + this.padding.left,
                             (y + 1.0) * this.fontSize.height + this.padding.top)
    }

    print(s: string, x: number, y: number, style = this.theme.f_high) {
        this.ctx.fillStyle = style

        for(const c of s) {
            this.drawChar(c, x, y)
            x += 1
        }
    }

    onMoveCursor(e: KeyboardEvent) {
        if (e.metaKey) {
            switch(e.key) {
                case 'c': this.clipboard.copy(this.cursor); break
                case 'x': console.log('Cut'); break
                case 'v': this.clipboard.paste(this.cursor); break
            }
        } else if (e.shiftKey) {
            switch (e.key) {
                case 'ArrowRight': this.cursor.enlarge(e.altKey ? 5 : 1, 0); break
                case 'ArrowLeft': this.cursor.shrink(e.altKey ? 5 : 1, 0); break
                case 'ArrowUp': this.cursor.shrink(0, e.altKey ? 5 : 1); break
                case 'ArrowDown': this.cursor.enlarge(0, e.altKey ? 5 : 1); break
            }
        } else if ('1234567890abcdefghijklmnopqrstuvwxyz'.includes(e.key)) {
            this.sheet.set(this.cursor.x, this.cursor.y, e.key)
        } else {
            switch (e.key) {
                case 'Backspace':
                    for (const [x, y] of this.cursor.selection())
                        this.sheet.unset(x, y)
                    break

                case 'ArrowLeft': this.cursor.moveLeft(e.altKey ? 5 : 1); break
                case 'ArrowUp': this.cursor.moveUp(e.altKey ? 5 : 1); break
                case 'ArrowRight': this.cursor.moveRight(e.altKey ? 5 : 1); break
                case 'ArrowDown': this.cursor.moveDown(e.altKey ? 5 : 1); break
            }
        } 

        this.update()
    }       
}

class CanvasTerminal extends Terminal {
    constructor(sheet: Sheet, w: number, h: number, canvas: HTMLCanvasElement, theme: Theme) {
        const ctx = canvas.getContext('2d')!
        super(sheet, ctx, theme)
        this.resize(w, h)
    }

    resize(width: number, height: number) {
        canvas.width = width * 2
        canvas.height = height * 2

        canvas.style.width = `${width}px`
        canvas.style.height = `${height}px` 

        this.ctx.scale(2, 2)
        this.ctx.textBaseline = 'bottom'
        this.ctx.textAlign = 'center'
        this.ctx.font = `${this.fontSize.height * 0.75}px menlo`

        super.resize(width, height)
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
        return [this.get(x - 1, y    ) === '2',
                this.get(x + 1, y    ) === '2',
                this.get(x - 1, y - 1) === '2',
                this.get(x    , y - 1) === '2',
                this.get(x + 1, y - 1) === '2',
                this.get(x - 1, y + 1) === '2',
                this.get(x    , y + 1) === '2',
                this.get(x + 1, y + 1) === '2'].filter(m => m === true).length
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
    f_high: '#ffffff', f_med: '#e47464', f_low: '#66606b', f_inv: '#000000',
    b_high: '#eeeeee', b_med: '#5f5353', b_low: '#47424a', b_inv: '#e47464' }

const p1 = `
.113211.
1......1
.112311.`

const canvas = document.getElementById('canvas') as HTMLCanvasElement
const sheet = new WireWorldSheet()
sheet.load(p1, 5, 5)
const terminal = new CanvasTerminal(sheet, window.innerWidth, window.innerHeight, canvas, defaultTheme) 

window.addEventListener("keydown", (e) => { terminal.onMoveCursor(e); e.preventDefault() }, false)
window.onresize = (event) => { terminal.resize(window.innerWidth, window.innerHeight) }

setInterval(() => { sheet.tick(); terminal.tick += 1; terminal.update() }, 200)