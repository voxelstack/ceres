export type ElementEventType = keyof HTMLElementEventMap;
export type WindowEventType = keyof WindowEventMap;
export type DocumentEventType = keyof DocumentEventMap;
export type EventType = ElementEventType | WindowEventType | DocumentEventType;
export type EventMap = HTMLElementEventMap & WindowEventMap & DocumentEventMap;
export type Listener<E> = (ev: E) => any;
export type ConfiguredListener<E> = {
    listener: Listener<E>;
    options?: boolean | AddEventListenerOptions;
}
export type EventHandler<E> = Listener<E> | ConfiguredListener<E>
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
): ConfiguredListener<Event> {
    return { listener, options };
}
function isConfiguredListener<E>(listener: EventHandler<E>): listener is ConfiguredListener<E> {
    return (listener as ConfiguredListener<E>).listener !== undefined;
}
export function toConfiguredListener<E>(
    listener: EventHandler<E>
): ConfiguredListener<E> {
    if (isConfiguredListener(listener)) {
        return listener;
    } else {
        return { listener };
    }
}
