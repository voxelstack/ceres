interface MountEvent {
    node: Node
}
interface EventMap extends HTMLElementEventMap {
    "mount": MountEvent;
}
interface HandlerReturn {
    "mount": (() => void) | void;
}
export type EventType = keyof EventMap;

export interface EventHandler<T extends EventType> {
    listener: (ev: EventMap[T]) => T extends keyof HandlerReturn ? HandlerReturn[T] : any;
    options?: boolean | AddEventListenerOptions;
}
export function createEventHandler<T extends EventType>(
    listener: (ev: EventMap[T]) => any,
    options?: boolean | AddEventListenerOptions
): EventHandler<T> {
    return { listener, options };
}
