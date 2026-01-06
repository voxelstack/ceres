import { Observable } from "./observable";
import type { ChangeEvent, Observer } from "./types";

export class Store<T> extends Observable<ChangeEvent<T>> {
    protected _value: T;

    constructor(value: T) {
        super();

        this._value = value;
    }

    get value() {
        return this._value;
    }

    set value(next: T) {
        const event: ChangeEvent<T> = {
            prev: this.value,
            curr: next,
        };

        this._value = next;

        this.emit(event);
    }

    override subscribe(
        observer: Observer<ChangeEvent<T>>,
        immediate = false
    ): () => boolean {
        const unsubscribe = super.subscribe(observer);

        if (immediate) {
            this.emit({
                prev: undefined,
                curr: this.value,
            });
        }

        return unsubscribe;
    }
}
