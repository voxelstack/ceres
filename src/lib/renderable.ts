import { Props, Reactive, StringLike, Tag } from "./props";
import { DerivedStore, Store, ValueCallback } from "./store";

type Child = StringLike | Renderable;
type Disposable = () => void;
export type FragmentBuilder = (parent: Node, anchor?: Node) => Disposable[];

export class ReactiveString {
    constructor(
        public strings: TemplateStringsArray, 
        public values: StringLike[]

    ) { }
}
export function format(strings: TemplateStringsArray, ...values: StringLike[]) {
    return new ReactiveString(strings, values);
}

export class Renderable {
    protected disposables?: Disposable[];

    constructor(
        protected buildFragment: FragmentBuilder
    ) { }

    attach(parent: Node, anchor?: Node) {
        const disposables = this.buildFragment(parent, anchor);
        this.disposables = disposables;
    }
    detach() {
        this.disposables?.forEach((dispose) => dispose());
        this.disposables = undefined;
    }
}

export function createRenderable<Type extends Tag>(
    type: Type,
    props: Props<Type> = {},
    ...children: Child[]
): Renderable {
    const buildFragment: FragmentBuilder = (parent, anchor) => {
        const disposables: Disposable[] = [];
        const root = document.createElement(type);

        for (const [k, v] of Object.entries(props)) {
            if (k === "style") { 
                const style = props[k as keyof Props<Type>] ?? {};
                for (const [sk, sv] of Object.entries(style)) {
                    const dispose = watchProp(sv, (value) => {
                        root.style.setProperty(sk, value.toString());
                    });
                    if(dispose) {
                        disposables.push(dispose);
                    }
                }
            } else if (k.startsWith("on")) {
                const type = k.substring(2);
                const { listener, options } = v;
                root.addEventListener(type, listener, options);
                disposables.push(() => {
                    root.removeEventListener(type, listener, options);
                });
            } else {
                const dispose = watchProp(v, (value) => {
                    root.setAttribute(k, value);
                })
                if (dispose) {
                    disposables.push(dispose);
                }
            }
        }

        for (const child of children) {
            if (child instanceof Renderable) {
                child.attach(root);
                disposables.push(child.detach.bind(child));
            } else if (child instanceof ReactiveString) {
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
                    root.textContent = next.toString();
                }));
            } else {
                root.textContent = child.toString();
            }
        }

        parent.insertBefore(root, anchor ?? null);
        disposables.push(() => parent.removeChild(root));

        return disposables;
    };

    return new Renderable(buildFragment);
}

function watchProp(value: Reactive<any>, onValue: ValueCallback<any>) {
    if (value instanceof ReactiveString) {
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
