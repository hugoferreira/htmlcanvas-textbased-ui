export class Cursor {
    x = 0; y = 0; xLength = 0; yLength = 0

    constructor(public width: number = 0, public height: number = 0, public movableSelection = false) { }

    setSize(width: number, height: number) {
        this.width = width
        this.height = height

        this.clampLocation()
    }

    clampLocation() {
        if (!this.movableSelection) { this.xLength = 0; this.yLength = 0 }
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
    moveLeft(i: number = 1) { this.x -= i; this.clampLocation() }
    moveUp(i: number = 1) { this.y -= i; this.clampLocation() }
    moveDown(i: number = 1) { this.y += i; this.clampLocation() }

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
