import { Handlers, Tag } from "./props";
import { Disposable } from "./renderable";
import { AtomStore } from "./store";

type BindTransformer<DomType, BindType> = (fromDom: DomType, prevBind: BindType, node: Node) => BindType;
type DomTransformer<DomType, BindType> = (fromBind: BindType, node: Node) => DomType | void;
type Transformer<DomType, BindType> = {
    toBind: BindTransformer<DomType, BindType>;
    toDom: DomTransformer<DomType, BindType>;
};

export function createBind<
    T extends keyof Transformers,
    DomType = Transformers[T] extends Transformer<infer DomType,  infer _> ? DomType : never,
    BindType = Transformers[T] extends Transformer<infer _,  infer BindType> ? BindType : never,
>(
    store: AtomStore<BindType>,
    transform: T
) {
    const transformer = transformers[transform];
    return { store, ...transformer } as unknown as Bind<DomType, BindType>;
}
export type Bind<DomType, BindType = DomType> = AtomStore<DomType> | {
    store: AtomStore<BindType>;
    toBind: BindTransformer<DomType, BindType>;
    toDom: DomTransformer<DomType, BindType>;
};
interface Transformers {
    integer: Transformer<string, number>;
    float: Transformer<string, number>;
    multiselect: Transformer<string, string[]>;
    checkGroup: Transformer<boolean, string[]>;
    radioGroup: Transformer<boolean, string>;
}
const transformers: Transformers = {
    integer: {
        toBind: (fromDom) => parseInt(fromDom),
        toDom: (fromBind) => fromBind.toString()
    },
    float: {
        toBind: (fromDom) => parseFloat(fromDom),
        toDom: (fromBind) => fromBind.toString()
    },
    multiselect: {
        toBind: (_fromDom, _prevBind, node) => {
            const selected = [];
            for (const option of (node as HTMLSelectElement).selectedOptions) {
                selected.push(option.value);
            }
            return selected;
        },
        toDom: (fromBind, node) => {
            for (const option of (node as HTMLSelectElement).options) {
                option.selected = fromBind.includes(option.value);
            }
        }
    },
    checkGroup: {
        toBind: (_fromDom, prevBind, node) => {
            const el = node as HTMLInputElement;
            if (el.checked) {
                return [...prevBind, el.value];
            }
            return prevBind.filter((value) => value !== el.value);
        },
        toDom: (fromBind, node) => {
            return fromBind.includes((node as HTMLInputElement).value);
        }
    },
    radioGroup: {
        toBind: (_fromDom, prevBind, node) => {
            const el = node as HTMLInputElement;
            if (el.checked) {
                return el.value;
            }
            return prevBind;
        },
        toDom: (fromBind, node) => {
            return fromBind === (node as HTMLInputElement).value;
        }
    }
};

export interface HTMLElementBindMap {
    input: {
        checked: boolean,
        value: string,
    },
    select: {
        value: string
    }
}
type Binder<
    Type extends Tag,
    DomType,
    BindType = DomType
> = (
    node: HTMLElementTagNameMap[Type],
    bind: Bind<DomType, BindType>
) => Disposable[] | void;
type Binders = {
    [Key in keyof HTMLElementBindMap]: {
        [BindName in keyof HTMLElementBindMap[Key]]:
            Binder<Key, HTMLElementTagNameMap[Key][BindName], HTMLElementBindMap[Key][BindName]>;
    }
};
export const binders: Binders = {
    input: {
        checked: createDomBinder("checked", "change"),
        value: createDomBinder("value", "input"),
    },
    select: {
        value: createDomBinder("value", "change")
    }
};
function createDomBinder<
    Type extends Tag,
    Attribute extends keyof HTMLElementTagNameMap[Type],
    BindType
>(
    attribute: Attribute,
    event: keyof Handlers<Type>
): Binder<Type, HTMLElementTagNameMap[Type][Attribute], BindType> {
    return function (node, bind) {
        const disposables: Disposable[] = [];

        const type = event as string;
        if (bind instanceof AtomStore) {
            const store = bind as AtomStore<HTMLElementTagNameMap[Type][Attribute]>;

            function listener(ev: Event) {
                const target = ev.target as HTMLElementTagNameMap[Type];
                store.value = target[attribute];
            }
            node.addEventListener(type, listener);
            disposables.push(() => node.removeEventListener(type, listener));
            disposables.push(store.watch((next) => {
                node[attribute] = next;
            }));
        } else {
            const { store, toBind, toDom } = bind;

            function listener(ev: Event) {
                const target = ev.target as HTMLElementTagNameMap[Type];
                store.value = toBind(target[attribute], store.value, node);
            }
            node.addEventListener(type, listener);
            disposables.push(() => node.removeEventListener(type, listener));
            disposables.push(store.watch((next) => {
                queueMicrotask(() => {
                    const dom = toDom(next, node);
                    if (dom !== undefined) {
                        node[attribute] = dom;
                    }
                });
            }));
        }

        return disposables;
    }
}

export type GlobalBinds = { todo?: undefined };
