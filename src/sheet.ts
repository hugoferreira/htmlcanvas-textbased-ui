export class Sheet {
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
        for (const p of this.objects)
            yield [this.fromKey(p[0]), p[1]]
    }
}