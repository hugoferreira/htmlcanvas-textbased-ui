interface Theme {
    background: string

    f_high: string
    f_med: string
    f_low: string
    f_inv: string

    b_high: string
    b_med: string
    b_low: string
    b_inv: string
}

class Cursor {
    x = 0
    y = 0

    xLength = 0
    yLength = 0

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

    coords(): Array<[number, number]> {
        return [[0, 1]]
    }

    moveRight(i: number = 1) { this.x += i; this.clampLocation() }
    moveLeft(i: number = 1)  { this.x -= i; this.clampLocation() }
    moveUp(i: number = 1)    { this.y -= i; this.clampLocation() }
    moveDown(i: number = 1)  { this.y += i; this.clampLocation() }

    *selection(): IterableIterator<[number, number]> {
        for (let x = this.x; x <= this.x + this.xLength; x += 1)
            for (let y = this.y; y <= this.y + this.yLength; y += 1)
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

    get(x: number, y: number): string {
        const o = this.objects.get(`${x},${y}`)
        if (o === undefined) return ((x % 5) === 0 && (y % 5 === 0)) ? '+' : '·'
        return o
    }

    set(x: number, y: number, o: string) {
        this.objects.set(`${x},${y}`, o)
    }

    unset(x: number, y: number) {
        this.objects.delete(`${x},${y}`)
    }
}

class Terminal {
    fontSize = { width: 10, height: 18 }
    padding = { left: 60, top: 20, right: 60, bottom: 42 }    
    width: number
    height: number
    cursor: Cursor
    tick: number = 0

    constructor(private readonly sheet: Sheet, private readonly ctx: CanvasRenderingContext2D, private scrWidth: number, private scrHeight: number, private readonly theme: Theme) {
        this.width = Math.floor((scrWidth - this.padding.left - this.padding.right) / this.fontSize.width) - 1
        this.height = Math.floor((scrHeight - this.padding.top - this.padding.bottom) / this.fontSize.height) - 1

        this.ctx.textBaseline = 'bottom'
        this.ctx.textAlign = 'center'
        this.ctx.font = `${this.fontSize.height * 0.75}px menlo`

        this.cursor = new Cursor(this.width - 1, this.height - 1)
        this.update()

        setInterval(() => { this.tick += 1; this.update() }, 200)
    }

    update() {
        this.ctx.fillStyle = this.theme.background
        this.ctx.fillRect(0, 0, this.scrWidth, this.scrHeight)

        this.drawCursor()

        for (let i = 0; i < this.height; i += 1) {
            for (let j = 0; j < this.width; j += 1) {
                this.ctx.fillStyle = this.cursor.contains(j, i) ? this.theme.f_inv : this.theme.f_low
                this.drawChar(this.sheet.get(j, i), j, i)
            }
        }

        this.print(`LEN`, 0, this.height + 1, this.theme.f_med)
        this.print(`POS`, 0, this.height + 2, this.theme.f_med)
        this.print(`CLK`, 12, this.height + 1, this.theme.f_med)    

        this.print(`${this.width}×${this.height}`, 4, this.height + 1)
        this.print(`${this.cursor.x},${this.cursor.y}`, 4, this.height + 2)    
        this.print(`${this.tick}`, 16, this.height + 1)    
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
                case 'c': console.log('Copy'); break
                case 'x': console.log('Cut'); break
                case 'v': console.log('Paste'); break
            }
        } else if (e.shiftKey) {
            switch (e.key) {
                case 'ArrowRight': this.cursor.enlarge(e.altKey ? 5 : 1, 0); break
                case 'ArrowLeft': this.cursor.shrink(e.altKey ? 5 : 1, 0); break
                case 'ArrowUp': this.cursor.shrink(0, e.altKey ? 5 : 1); break
                case 'ArrowDown': this.cursor.enlarge(0, e.altKey ? 5 : 1); break
            }
        } else if ('abcdefghijklmnopqrstuvwxyz'.includes(e.key)) {
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
    constructor(sheet: Sheet, canvas: HTMLCanvasElement, theme: Theme) {
        const ctx = canvas.getContext('2d')!
        const width = canvas.width / 2
        const height = canvas.height / 2

        canvas.style.width = `${width}px`
        canvas.style.height = `${height}px`
        ctx.scale(2, 2)

        super(sheet, ctx, width, height, theme)
    }
}

const canvas = document.getElementById('canvas') as HTMLCanvasElement

/* const ecosystemTheme = { f_high: '#ffffff', f_med: '#999999', f_low: '#555555', f_inv: '#000000', 
                            b_high: '#fc533e', b_med: '#666666', b_low: '#333333', b_inv: '#fc533e'} */

const defaultTheme = {
    background: '29272b',
    f_high: '#ffffff', f_med: '#e47464', f_low: '#66606b', f_inv: '#000000',
    b_high: '#eeeeee', b_med: '#5f5353', b_low: '#47424a', b_inv: '#e47464' }

const sheet = new Sheet()
const terminal = new CanvasTerminal(sheet, canvas, defaultTheme)

window.addEventListener("keydown", (e) => { terminal.onMoveCursor(e); e.preventDefault() }, false)
