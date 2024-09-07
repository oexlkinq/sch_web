export class State<structure extends object> {
    data: structure

    constructor(localStorageKey = 'state', initialStorage: structure) {
        const rawState = localStorage.getItem(localStorageKey)
        let state = (rawState) ? JSON.parse(rawState) as structure : initialStorage

        this.data = new Proxy(state, {
            set(target, p, newValue) {
                target[p as keyof structure] = newValue
                localStorage.setItem(localStorageKey, JSON.stringify(target))

                return true
            },
        })
    }
}
