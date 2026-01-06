import type { Observable } from "./observable";

export type Emitter<T> = (emit: (event: T) => void) => void;
export type Observer<T> = (event: T) => void;
export type Transformer<T, R> = (source: Observable<T>) => Observable<R>;

export type ChangeEvent<T> = {
    prev?: T;
    curr: T;
};
