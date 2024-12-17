type ChangeCallback<T> = (next: T, previous: T) => void;
type ValueCallback<T> = (next: T, previous?: T) => void;

export class Store<T> {
    protected stored: T;
    protected subscribers: ChangeCallback<T>[];

    constructor(value: T) {
        this.stored = value;
        this.subscribers = [];
    }

    get value() {
        return this.stored;
    }
    set value(next: T) {
        const previous = this.stored;
        this.stored = next;
        this.subscribers.forEach((onChange) => onChange(next, previous));
    }

    subscribe(onChange: ChangeCallback<T>) {
        this.subscribers.push(onChange);
        return () => {
            this.subscribers.filter((it) => it !== onChange);
        };
    }
    watch(onValue: ValueCallback<T>) {
        onValue(this.value);
        return this.subscribe(onValue);
    }
}
