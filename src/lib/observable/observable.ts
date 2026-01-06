import type { Observer, Transformer } from "./types";

export class Observable<T> {
    private observers: Set<Observer<T>>;

    constructor() {
        this.observers = new Set();
    }

    emit(event: T) {
        this.observers.forEach((observer) => observer(event));
    }

    subscribe(observer: Observer<T>) {
        this.observers.add(observer);

        return () => this.observers.delete(observer);
    }

    pipe<R = T>(transformer: Transformer<T, R>) {
        return transformer(this);
    }
}
