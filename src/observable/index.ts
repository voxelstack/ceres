import { Observable } from "./observable";
import { Store } from "./store";
import type { Emitter } from "./types";

export { Observable };

/**
 * Creates an observable and allows access to its emitter.
 * @see {@link Observable}
 *
 * @param emitter A function for emitting events on the created observable.
 * @returns A new Observable.
 */
export function $observable<T>(emitter: Emitter<T>) {
    const observable = new Observable<T>();

    emitter(observable.emit.bind(observable));

    return observable;
}

export { Store };
export function $store<T>(value: T) {
    return new Store(value);
}
