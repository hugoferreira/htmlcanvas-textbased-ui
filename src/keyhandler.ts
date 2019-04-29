type KeyAction = { meta?: boolean, shift?: boolean, alt?: boolean, key: string, action: (e: KeyboardEvent) => void }

export class KeyHandler {
    keys = new Array<KeyAction>()

    registerKeys(...handler: Array<KeyAction>): void {
        this.keys.push(...handler)
    }

    onKeyDown(e: KeyboardEvent) {
        for (const { meta, shift, alt, key, action } of this.keys) {
            if ((meta === undefined || e.metaKey === meta) &&
                (shift === undefined || e.shiftKey === shift) &&
                (alt === undefined || e.altKey === alt) &&
                (key === undefined || e.key === key)) {
                    action(e)
                    e.preventDefault()
                    return
            }
        }
    }
}