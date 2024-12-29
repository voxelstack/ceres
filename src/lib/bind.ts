import { CeresElement, ElementProxy } from "./component";
import { EventMap, EventType } from "./event";
import { Tag } from "./props";
import { Disposable } from "./renderable";
import { AtomStore } from "./store";

export type BindRead<ReadType, StoreType = ReadType, Context = any> = {
    store: AtomStore<StoreType>;
    toBind: BindTransformer<ReadType, StoreType, StoreType, Context>;
};
export type Bind<
    ReadType,
    WriteType = ReadType,
    StoreType = ReadType,
    Context = any
> = BindRead<ReadType, StoreType, Context> & {
    fromBind: BindTransformer<StoreType, StoreType, WriteType, Context>;
};
export type BoundOrRaw<T> = T | AtomStore<BoundType<T>>;
const identity = <T>(val: T) => val;
export function rawBind<T>(store: AtomStore<T>): BindRead<T> | Bind<T>  {
    return {
        store,
        toBind: identity,
        fromBind: identity
    };
}
type BindTransformer<
    Next,
    Previous,
    Result,
    Context
> = (
    next: Next,
    previous: Previous,
    context: Context
) => Result;
type StoredType<B> = B extends Bind<any, any, infer StoreType, any> ?
      StoreType
    : B extends BindRead<any, infer StoreType, any> ?
          StoreType
        : never
;
type BoundType<B> = B extends Bind<infer BoundType, any, any, any> ?
      BoundType
    : B extends BindRead<infer BoundType, any, any> ?
          BoundType
        : never
;

type SpecialElementBinders<Element, BindMap> = {
    [Key in keyof BindMap]: (target: ElementProxy<Element>, bind: BindMap[Key]) => Disposable;
};
type SpecialElementBinds<BindMap> = {
    [Attribute in keyof BindMap]?: BoundOrRaw<BindMap[Attribute]>;
};

export type WindowBindMap = {
    innerWidth: BindRead<number, any, Window>;
    innerHeight: BindRead<number, any, Window>;
    scrollX: Bind<number, number, any, Window>;
    scrollY: Bind<number, number, any, Window>;
    online: BindRead<boolean, any, Window>;
    devicePixelRatio: BindRead<number, any, Window>;
};
export const windowBinders: SpecialElementBinders<Window, WindowBindMap> = {
    innerWidth: createAttributeReader(watchEvent("resize", () => window.innerWidth)),
    innerHeight: createAttributeReader(watchEvent("resize", () => window.innerHeight)),
    scrollX: createAttributeBinder("scrollX", watchEvent("scroll", () => window.scrollX)),
    scrollY: createAttributeBinder("scrollY", watchEvent("scroll", () => window.scrollY)),
    online: (target, bind) => {
        const disposables: Disposable[] = [];
        const { element } = target;
        const { store, toBind } = bind;

        const onlineWatcher = watchEvent("online", () => true);
        const offlineWatcher = watchEvent("offline", () => false);

        disposables.push(
            onlineWatcher(element, (next) => store.value = toBind(next, store.value, element))
        );
        disposables.push(
            offlineWatcher(element, (next) => store.value = toBind(next, store.value, element))
        );
        
        return () => disposables.forEach((dispose) => dispose());
    },
    devicePixelRatio: (target, bind) => {
        const { element } = target;
        const { store, toBind } = bind;

        const mqString = `(resolution: ${window.devicePixelRatio}dppx)`;
        const media = matchMedia(mqString);

        const watcher = watchEvent("change", () => element.devicePixelRatio);
        return watcher(media, (next) => store.value = toBind(next, store.value, element));
    }
};
export type WindowBinds = SpecialElementBinds<WindowBindMap>;

export type DocumentBindMap = {
    activeElement: BindRead<Element | null, any, Document>;
    fullscreenElement: BindRead<Element | null, any, Document>;
    pointerLockElement: BindRead<Element | null, any, Document>;
    visibilityState: BindRead<DocumentVisibilityState, any, Document>;
};
export const documentBinders: SpecialElementBinders<Document, DocumentBindMap> = {
    activeElement: (target, bind) => {
        const disposables: Disposable[] = [];
        const { element } = target;
        const { store, toBind } = bind;

        const focusWatcher = watchEvent("focus", () => document.activeElement);
        const blurWatcher = watchEvent("blur", () => null);

        disposables.push(
            focusWatcher(element, (next) => store.value = toBind(next, store.value, element))
        );
        disposables.push(
            blurWatcher(element, (next) => store.value = toBind(next, store.value, element))
        );

        return () => disposables.forEach((dispose) => dispose());
    },
    fullscreenElement: createAttributeReader<Document, "fullscreenElement">(
        watchEvent("fullscreenchange", () => document.fullscreenElement)
    ),
    pointerLockElement: createAttributeReader<Document, "pointerLockElement">(
        watchEvent("pointerlockchange", () => document.pointerLockElement)
    ),
    visibilityState: createAttributeReader<Document, "visibilityState">(
        watchEvent("visibilitychange", () => document.visibilityState)
    )
};
export type DocumentBinds = SpecialElementBinds<DocumentBindMap>;

type ComponentBindMap<ElementType extends Tag> = {
    this: BindRead<HTMLElementTagNameMap[ElementType] | null, any, CeresElement<ElementType>>;
    clientWidth: BindRead<number, any, CeresElement<ElementType>>;
    clientHeight: BindRead<number, any, CeresElement<ElementType>>;
    contentWidth: BindRead<number, any, CeresElement<ElementType>>;
    contentHeight: BindRead<number, any, CeresElement<ElementType>>;
};
type ComponentBinder<ElementType extends Tag, BindType> =
    (target: CeresElement<ElementType>, bind: BindType) => Disposable;
type ComponentBinders = {
    [Key in keyof ComponentBindMap<any>]: ComponentBinder<any, ComponentBindMap<any>[Key]>;
};
const globalComponentBinders: ComponentBinders = {
    this: (target, bind) => {
        function listener(element: HTMLElement | null) {
            const { store, toBind } = bind;
            store.value = toBind(element, store.value, target);
        }
        return target.subscribe("mount", listener);
    },
    clientWidth: createDimensionReader((entry) => entry.borderBoxSize[0].inlineSize),
    clientHeight: createDimensionReader((entry) => entry.borderBoxSize[0].blockSize),
    contentWidth: createDimensionReader((entry) => entry.contentBoxSize[0].inlineSize),
    contentHeight: createDimensionReader((entry) => entry.contentBoxSize[0].blockSize),
};

type HTMLElementBindMap = {
    input: {
        checked: Bind<boolean, boolean, any, HTMLInputElement>;
        value: Bind<string, string, any, HTMLInputElement>;
    };
    select: {
        value: Bind<string, undefined, any, HTMLSelectElement>;
    };
};
type HTMLElementBinders = {
    [ElementType in keyof HTMLElementBindMap as ElementType extends Tag ? ElementType : never]: {
        [Attribute in keyof HTMLElementBindMap[ElementType]]:
            ComponentBinder<ElementType, HTMLElementBindMap[ElementType][Attribute]>;
    };
};
const htmlElementBinders: HTMLElementBinders = {
    input: {
        ...globalComponentBinders,
        
        checked: createAttributeBinder(
            "checked",
            watchEvent("change", (event) => (event.target as HTMLInputElement).checked),
            queueMicrotask
        ),
        value: createAttributeBinder(
            "value",
            watchEvent("input", (event) => (event.target as HTMLInputElement).value),
            queueMicrotask
        )
    },
    select: {
        ...globalComponentBinders,

        value: createAttributeBinder(
            "value",
            watchEvent("change", (event) => (event.target as HTMLSelectElement).value),
            queueMicrotask
        )
    }
};

export function getComponentBinders<ElementType extends Tag>(type: ElementType) {
    return htmlElementBinders[type as keyof HTMLElementBinders] ?? globalComponentBinders;
}

type GlobalComponentBinds<ElementType extends Tag> = {
    [Attribute in keyof ComponentBindMap<ElementType>]?:
        BoundOrRaw<ComponentBindMap<ElementType>[Attribute]>;
};
export type ComponentBinds<ElementTag extends Tag> =
    ElementTag extends keyof HTMLElementBindMap ? {
              [Attribute in keyof HTMLElementBindMap[ElementTag]]?:
                  BoundOrRaw<HTMLElementBindMap[ElementTag][Attribute]>
          } & GlobalComponentBinds<ElementTag>
        : GlobalComponentBinds<ElementTag>
;

export function $transform<T extends keyof Transformations>(
    to: T,
    store: AtomStore<StoredType<Transformations[T]>>,
): Transformations[T] {
    const transformer = transformers[to];
    return transformer(store);
}
type Transformations = {
    integer: Bind<string, string, number>;
    multiselect: Bind<string, undefined, string[], HTMLSelectElement>;
    checkGroup: Bind<boolean, boolean, string[], HTMLInputElement>;
    radioGroup: Bind<boolean, boolean, string, HTMLInputElement>;
};
type Transformer<From, To> = (store: AtomStore<From>) => To;
type Transformers = {
    [Key in keyof Transformations]:
        Transformer<StoredType<Transformations[Key]>, Transformations[Key]>
};
const transformers: Transformers = {
    integer: (store) => ({
        store,
        toBind: (nextSource) => parseInt(nextSource),
        fromBind: (nextBind) => nextBind.toString()
    }),
    multiselect: (store) => ({
        store,
        toBind: (_nextSource, _previousBind, node) => {
            const selected = [];
            for (const option of node.selectedOptions) {
                selected.push(option.value);
            }
            return selected; 
        },
        fromBind: (nextBind, _previousBind, node) => {
            for (const option of node.options) {
                option.selected = nextBind.includes(option.value);
            }
        }
    }),
    checkGroup: (store) => ({
        store,
        toBind: (_nextSource, previousBind, node) => {
            if (node.checked) {
                return [...previousBind, node.value];
            }
            return previousBind.filter((value) => value !== node.value);
        },
        fromBind: (nextBind, _previousBind, node) => {
            return nextBind.includes(node.value);
        }
    }),
    radioGroup: (store) => ({
        store,
        toBind: (_nextSource, previousBind, node) => {
            if (node.checked) {
                return node.value;
            }
            return previousBind;
        },
        fromBind: (nextBind, _previousBind, node) => {
            return nextBind === node.value;
        }
    })
};

type Watcher<Target, Value> = (target: Target, onValue: (value: Value) => void) => Disposable;
type Extractor<Whole, Part> = (whole: Whole) => Part;
function watchEvent<Target extends EventTarget, Type extends EventType, Value>(
    type: Type,
    extractor: Extractor<EventMap[Type], Value>
): Watcher<Target, Value> {
    return function (target, onValue) {
        function listener(event: EventMap[Type]) {
            onValue(extractor(event));
        }
        
        // https://github.com/axios/axios/issues/3219#issuecomment-678233460
        target.addEventListener(type, listener as EventListener);
        return () => {
            target.removeEventListener(type, listener as EventListener);
        };
    }
}

type AttributeReader<
    Target,
    Attribute extends keyof Target,
    StoreType
> = (
    target: ElementProxy<Target>,
    bind: BindRead<Target[Attribute], StoreType, Target>
) => Disposable;
function  createAttributeReader<
    Target,
    Attribute extends keyof Target,
    StoreType = Target[Attribute]
>(
    watch: Watcher<Target, Target[Attribute]>
): AttributeReader<Target, Attribute, StoreType> {
    return function (target, bind) {
        const { element } = target;
        const { store, toBind } = bind;
        return watch(element, (next) => {
            store.value = toBind(next, store.value, element);
        });
    };
}

type AttributeBinder<
    Target,
    Attribute extends keyof Target,
    StoreType
> = (
    target: ElementProxy<Target>,
    bind: Bind<Target[Attribute], Target[Attribute] | undefined, StoreType, Target>
) => Disposable;
type Scheduler = (task: () => void) => void;
function createAttributeBinder<
    Target,
    Attribute extends keyof Target,
    StoreType
>(
    attribute: Attribute,
    watch: Watcher<Target, Target[Attribute]>,
    scheduler: Scheduler = (task) => task()
): AttributeBinder<Target, Attribute, StoreType> {
    return function (target, bind) {
        const disposables: Disposable[] = [];
        const { element } = target;
        const { store, toBind, fromBind } = bind;
        
        disposables.push(watch(element, (next) => {
            store.value = toBind(next, store.value, element);
        }));
        disposables.push(store.watch((next, previous) => {
            scheduler(() => {
                // Binds must be initialized with a value, previous is never undefined.
                const writeBack = fromBind(next, previous!, element);
                if (writeBack !== undefined) {
                    element[attribute] = writeBack;
                }
            });
        }));

        return () => disposables.forEach((dispose) => dispose());
    };
}

type DimensionReader = (
    target: CeresElement<Tag>,
    bind: BindRead<number, number, CeresElement<Tag>>
) => Disposable;
function createDimensionReader(
    extractor: Extractor<ResizeObserverEntry, number>
): DimensionReader {
    return function (target, bind) {
        const { store, toBind } = bind;

        function listener(entry: ResizeObserverEntry) {
            store.value = toBind(extractor(entry), store.value, target);
        }
        return target.subscribe("resize", listener);
    }
}
