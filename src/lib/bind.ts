import { Handlers, Tag } from "./props";
import { Disposable } from "./renderable";
import { AtomStore } from "./store";

type BindTransformer<DomType, BindType> = (fromDom: DomType) => BindType;
type DomTransformer<DomType, BindType> = (fromBind: BindType) => DomType;
type Transformer<DomType, BindType> = {
    toBind: BindTransformer<DomType, BindType>;
    toDom: DomTransformer<DomType, BindType>;
};

export function createBind<DomType, BindType = DomType>(
    store: AtomStore<BindType>,
    transform: keyof Transformers
) {
    const transformer = transformers[transform];
    return { store, ...transformer };
}
export type Bind<DomType, BindType = DomType> = AtomStore<DomType> | {
    store: AtomStore<BindType>;
    toBind: BindTransformer<DomType, BindType>;
    toDom: DomTransformer<DomType, BindType>;
};
interface Transformers {
    integer: Transformer<string, number>;
    float: Transformer<string, number>;
}
const transformers: Transformers = {
    integer: {
        toBind: (fromDom) => parseInt(fromDom),
        toDom: (fromBind) => fromBind.toString()
    },
    float: {
        toBind: (fromDom) => parseFloat(fromDom),
        toDom: (fromBind) => fromBind.toFixed(2)
    },
};

export interface HTMLElementBindMap {
    "input": {
        "checked": boolean,
        "value": string
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
        value: createDomBinder("value", "input")
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
                store.value = toBind(target[attribute]);
            }
            node.addEventListener(type, listener);
            disposables.push(() => node.removeEventListener(type, listener));
            disposables.push(store.watch((next) => {
                node[attribute] = toDom(next);
            }));
        }

        return disposables;
    }
}

export type GlobalBinds = { todo?: undefined };
