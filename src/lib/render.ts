import { isDirective } from "./directives";
import { EventType } from "./event";
import { Props, Reactive, Tag } from "./props";
import { DerivedStore, Store, ValueCallback } from "./store";

type Stringifiable = { toString: () => string };
export type StringLike = Stringifiable | Store<Stringifiable>;

export type Build = () => void;
export type Attach = (parent: Node, anchor?: Node) => void;
export type Detach = () => void;

export interface Renderable {
    build: Build;
    attach: Attach;
    detach: Detach;

    __brand: "renderable";
}
function isRenderable(object: unknown): object is Renderable {
    return (object as Renderable).__brand === "renderable";
}

export interface ReactiveString {
    strings: TemplateStringsArray;
    values: StringLike[];

    __brand: "reactive_string";
}
function isReactiveString(object: unknown): object is ReactiveString {
    return (object as ReactiveString).__brand === "reactive_string";
}
export function format(strings: TemplateStringsArray, ...values: Array<StringLike>) {
    return {
        strings,
        values,

        __brand: "reactive_string"
    } as ReactiveString;
}

type Child = StringLike | Renderable;

function watchProp(value: Reactive<any>, onValue: ValueCallback<any>) {
    if (isReactiveString(value)) {
        const { strings, values } = value;
        const { observables, unfilteredIndices } = values
            .reduce<{
                observables: Store<any>[],
                unfilteredIndices: number[]
            }>((acc, value, index) => {
                if (value instanceof Store) {
                    acc.observables.push(value);
                } else {
                    acc.unfilteredIndices.push(index);
                }
                return acc;
            }, { observables: [], unfilteredIndices: [] });
        const reactiveString = new DerivedStore(observables, (reactiveValues) => {
            let result = strings[0];
            let unfilteredIndex = 0;
            for (let index = 0; index < values.length; ++index) {
                if (unfilteredIndices[unfilteredIndex] === index) {
                    result += values[index];
                    ++unfilteredIndex;
                } else {
                    result += reactiveValues.shift();
                }
                result += strings[index + 1];
            }
            return result;
        });
        return reactiveString.watch(onValue);
    } else if (value instanceof Store) {
        return value.watch(onValue);
    } else {
        onValue(value);
    }
}
export function createRenderable(
    type: Tag,
    props: Props<Tag> = {},
    ...children: Child[]
): Renderable {
    let disposables: Array<() => void>;
    let root: HTMLElement | null;

    const build: Build = () => {
        disposables = [];
        root = document.createElement(type);

        for (const [k, v] of Object.entries(props)) {
            if (k === "style") {
                const styles = props?.[k as keyof Props<Tag>] ?? {};
                for (const [sk, sv] of Object.entries(styles)) {
                    const dispose = watchProp(sv, (value) => {
                        root!.style.setProperty(sk, value);
                    });
                    if (dispose)
                        disposables.push(dispose);
                }                
            } else if (k.startsWith("on")) {
                const type = k.slice(2) as EventType;
                const dispose = watchProp(v, (value, previous) => {
                    if (previous) {
                        const { listener: pl, options: po } = previous;
                        root!.removeEventListener(type, pl, po);
                    }

                    const { listener, options } = value;
                    root!.addEventListener(type, listener, options);
                    disposables.push(() => {
                        root!.removeEventListener(type, listener, options);
                    });
                });
                if (dispose)
                    disposables.push(dispose);
            } else {
                const dispose = watchProp(v, (value) => {
                    root!.setAttribute(k, value);
                });
                if (dispose)
                    disposables.push(dispose);
            }
        }

        for (const child of children) {
            if (isRenderable(child) || isDirective(child)) {
                child.build();
                child.attach(root);
                disposables.push(child.detach);
            } else if (isReactiveString(child)) {
                const { strings, values } = child;

                root.insertBefore(document.createTextNode(strings[0]), null);
                for (const index in values) {
                    const value = values[index];
                    if (value instanceof Store) {
                        const node = document.createTextNode(value.value.toString());
                        disposables.push(value.watch((next) => {
                            node.textContent = next.toString();
                        }));
                        root.insertBefore(node, null);
                    } else {
                        root.insertBefore(document.createTextNode(value.toString()), null);
                    }
                    root.insertBefore(document.createTextNode(strings[+index + 1]), null);
                }
            } else if (child instanceof Store) {
                disposables.push(child.watch((next) => {
                    root!.textContent = next.toString();
                }));
            } else {
                root.textContent = child.toString();
            }
        }
    }
    const attach: Attach = (parent, anchor) => {
        parent.insertBefore(root!, anchor ?? null);
    };
    const detach: Detach = () => {
        disposables.forEach((dispose) => dispose());
        root!.parentNode!.removeChild(root!);

        disposables = [];
        root = null;
    };

    return {
        build,
        attach,
        detach,

        __brand: "renderable"
    };
}
