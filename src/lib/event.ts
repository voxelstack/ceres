export type ElementEventType = keyof HTMLElementEventMap;
export type WindowEventType = keyof WindowEventMap
export type EventType = ElementEventType | WindowEventType;
export type EventMap = HTMLElementEventMap & WindowEventMap;
export interface EventHandler<E> {
    listener: (ev: E) => any;
    options?: boolean | AddEventListenerOptions;
}
export function $handler<
    T extends EventType,
    Event = T extends ElementEventType ?
          HTMLElementEventMap[T]
        : T extends WindowEventType ?
              WindowEventMap[T]
            : never
>(
    listener: (ev: Event) => any,
    options?: boolean | AddEventListenerOptions
): EventHandler<Event> {
    return { listener, options };
}
