export type EventType = keyof HTMLElementEventMap;
export interface EventHandler<T extends EventType> {
    listener: (ev: HTMLElementEventMap[T]) => any;
    options?: boolean | AddEventListenerOptions;
}
export function $handler<T extends EventType>(
    listener: (ev: HTMLElementEventMap[T]) => any,
    options?: boolean | AddEventListenerOptions
): EventHandler<T> {
    return { listener, options };
}
