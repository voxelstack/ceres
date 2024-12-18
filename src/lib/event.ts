export type EventType = keyof HTMLElementEventMap;
export interface EventHandler<T extends EventType> {
    listener: (ev: HTMLElementEventMap[T]) => any;
    options?: boolean | AddEventListenerOptions;

    __brand: "event_handler"
}
export function createEventHandler<T extends EventType>(
    listener: (ev: HTMLElementEventMap[T]) => any,
    options?: boolean | AddEventListenerOptions
): EventHandler<T> {
    return {
        listener,
        options,

        __brand: "event_handler"
    };
}
