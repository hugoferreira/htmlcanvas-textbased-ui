import { Sheet } from './sheet'
import { Cursor } from './cursor'
import { Scratchboard } from './scratchboard'
import { KeyHandler } from './keyhandler'

interface Theme {
    background: string
    f_high: string, f_med: string, f_low: string, f_inv: string
    b_high: string, b_med: string, b_low: string, b_inv: string
}

export class Terminal {
    fontSize = { width: 10, height: 18 }
    padding = { left: 60, top: 20, right: 60, bottom: 60 }
    width!: number
    height!: number
    cursor: Cursor
    clipboard: Scratchboard
    keyHandler: KeyHandler
    protected scrWidth!: number
    protected scrHeight!: number

    constructor(protected readonly sheet: Sheet, protected readonly ctx: CanvasRenderingContext2D, protected readonly theme: Theme) {
        this.cursor = new Cursor()
        this.clipboard = new Scratchboard(sheet)
        this.keyHandler = new KeyHandler()
        this.registerKeys()
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
        this.ctx.save()
        this.ctx.fillStyle = this.theme.background
        this.ctx.fillRect(0, 0, this.scrWidth, this.scrHeight)

        this.drawCursor()
        this.drawSheet()
        this.draw()
        
        this.ctx.restore()
    }

    protected draw() { }

    private drawSheet() {
        for (let i = 0; i < this.height; i += 1) {
            for (let j = 0; j < this.width; j += 1) {
                let c = this.sheet.get(j, i)

                if (c === undefined) {
                    this.ctx.fillStyle = this.theme.b_low
                    c = ((j % 5) === 0 && (i % 5 === 0)) ? '+' : '·'
                } else this.ctx.fillStyle = this.stylize(c)

                if (this.cursor.contains(j, i)) this.ctx.fillStyle = this.theme.f_inv

                this.drawChar(c, j, i)
            }
        }
    }

    protected stylize(c: string): string {
        return this.theme.f_high
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

        for (const c of s) {
            this.drawChar(c, x, y)
            x += 1
        }
    }
    
    registerKeys() {
        this.keyHandler.registerKeys(
            { meta: true, key: 'c', action: () => { this.clipboard.copy(this.cursor) } },
            { meta: true, key: 'x', action: () => { console.warn('Cut not implemented') } },
            { meta: true, key: 'v', action: () => { this.clipboard.paste(this.cursor) } },

            { shift: true, alt: true, key: 'ArrowRight',   action: () => { this.cursor.enlarge(5, 0) } },
            { shift: true, alt: true, key: 'ArrowLeft',    action: () => { this.cursor.shrink(5, 0) } },
            { shift: true, alt: true, key: 'ArrowUp',      action: () => { this.cursor.shrink(0, 5) } },
            { shift: true, alt: true, key: 'ArrowDown',    action: () => { this.cursor.enlarge(0, 5) } },

            { shift: true, alt: false, key: 'ArrowRight',  action: () => { this.cursor.enlarge(1, 0) } },
            { shift: true, alt: false, key: 'ArrowLeft',   action: () => { this.cursor.shrink(1, 0) } },
            { shift: true, alt: false, key: 'ArrowUp',     action: () => { this.cursor.shrink(0, 1) } },
            { shift: true, alt: false, key: 'ArrowDown',   action: () => { this.cursor.enlarge(0, 1) } },

            { shift: false, alt: true, key: 'ArrowRight',  action: () => { this.cursor.moveRight(5) } },
            { shift: false, alt: true, key: 'ArrowLeft',   action: () => { this.cursor.moveLeft(5) } },
            { shift: false, alt: true, key: 'ArrowUp',     action: () => { this.cursor.moveUp(5) } },
            { shift: false, alt: true, key: 'ArrowDown',   action: () => { this.cursor.moveDown(5) } },

            { shift: false, alt: false, key: 'ArrowRight', action: () => { this.cursor.moveRight(1) } },
            { shift: false, alt: false, key: 'ArrowLeft',  action: () => { this.cursor.moveLeft(1) } },
            { shift: false, alt: false, key: 'ArrowUp',    action: () => { this.cursor.moveUp(1) } },
            { shift: false, alt: false, key: 'ArrowDown',  action: () => { this.cursor.moveDown(1) } },

            { key: 'Backspace', action: () => {
                for (const [x, y] of this.cursor.selection())
                    this.sheet.unset(x, y)
            }}
        )
    }

    onKeyDown(e: KeyboardEvent) {
        this.keyHandler.onKeyDown(e)
    }
}

export class CanvasTerminal extends Terminal {
    constructor(sheet: Sheet, w: number, h: number, private canvas: HTMLCanvasElement, theme: Theme) {
        super(sheet, canvas.getContext('2d')!, theme)
        this.resize(w, h)
    }

    resize(width: number, height: number) {
        this.canvas.width = width * 2
        this.canvas.height = height * 2

        this.canvas.style.width = `${width}px`
        this.canvas.style.height = `${height}px`

        this.ctx.scale(2, 2)
        this.ctx.textBaseline = 'bottom'
        this.ctx.textAlign = 'center'
        this.ctx.font = `${this.fontSize.height * 0.75}px menlo`

        super.resize(width, height)
    }
}