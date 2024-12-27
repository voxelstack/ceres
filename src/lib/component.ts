import { attributeBinders, Bind, BindRead, DimensionBinder, dimensionBinders, HTMLElementBindMap, HTMLElementDimensionBinds } from "./bind";
import { Actions, Attributes, Binds, Classes, Handlers, Props, Reactive, Stringifiable, Styles, Tag } from "./props";
import { ReactiveString } from "./reactive_string";
import { Child, Renderable } from "./renderable";
import { Store, ValueCallback } from "./store";

export function $component<Type extends Tag>(
    type: Type,
    props: Props<Type> = {},
    ...children: Child[]
) {
    return new Component(type, props, children);
}
class Component<const ElementTag extends Tag> extends Renderable {
    private resizeObserver?: ResizeObserver;
    private resizeWatchers?: DimensionBinder[];
    protected root!: HTMLElement;

    constructor(
        private type: ElementTag,
        private props: Props<ElementTag>,
        private children: Child[]
    ) {
        super();
    }

    override mount(parent: Node, anchor?: Node) {
        super.mount(parent, anchor);
        this.root = document.createElement(this.type);

        const { root, children, disposables } = this;
        function createText(next: Stringifiable) {
            root.textContent = next.toString();
        }
        for (const child of children) {
            if (child instanceof Renderable) {
                child.mount(root);
                disposables.push(child.unmount.bind(child));
            } else if (child instanceof ReactiveString) {
                const reactiveText = child.toRenderable();
                reactiveText.mount(root);
                disposables.push(reactiveText.unmount.bind(reactiveText));
            } else if (child instanceof Store) {
                disposables.push(child.watch(createText));
            } else {
                createText(child.toString());
            }
        }

        const { style, className, on, use, bind, ...attributes } = this.props;
        this.attachStyles(style);
        this.attachClass(className);
        this.attachEventHandlers(on);
        this.attachBinds(bind);
        this.attachAttributes(attributes as Attributes<ElementTag>);

        parent.insertBefore(root, anchor ?? null);
        this.runActions(use);
    }
    override move(parent: Node, anchor?: Node) {
        parent.insertBefore(this.root, anchor ?? null);
        return this.root;
    }
    // TODO Ensure idempotency.
    override unmount(): void {
        super.unmount();
        this.root.parentElement?.removeChild(this.root);
    }

    private attachStyles(style?: Styles) {
        for (const [key, value] of Object.entries(style ?? {})) {
            const dispose = watchProp(value, (next) => {
                this.root.style.setProperty(key, next.toString());
            });
            if (dispose) {
                this.disposables.push(dispose);
            }
        }
    }
    private attachClass(className?: Classes) {
        if (className === undefined) {
            return;
        }

        const dispose = watchProp(className, (next, previous) => {
            if (typeof next === "string") {
                this.root.className = next;
            } else if (Array.isArray(next)) {
                const prev: string[] = previous ?? [];
                next.forEach((clazz) => {
                    const prevIndex = prev.findIndex((it) => it === clazz);
                    if (prevIndex === -1) {
                        this.root.classList.add(clazz);
                    } else {
                        prev.splice(prevIndex, 1);
                    }
                });
                prev.forEach((c) => {
                    this.root.classList.remove(c);
                });
            } else {
                const prev: Record<string, boolean> = previous ?? {};
                Object.entries(next).forEach(([clazz, enabled]) => {
                    if (enabled) {
                        if (!prev[clazz]) {
                            this.root.classList.add(clazz);
                        } else {
                            delete prev[clazz];
                        }
                    } else {
                        if (prev[clazz]) {
                            this.root.classList.remove(clazz);
                        } else {
                            delete prev[clazz];
                        }
                    }
                });
                Object.entries(prev).forEach(([clazz, enabled]) => {
                    if (enabled) {
                        this.root.classList.remove(clazz);
                    }
                });
            }
        });
        if (dispose) {
            this.disposables.push(dispose);
        }
    }
    private attachEventHandlers(on?: Handlers<ElementTag>) {
        for (const [key, value] of Object.entries(on ?? {})) {
            const { listener, options } = value;

            this.root.addEventListener(key, listener, options);
            this.disposables.push(() => {
                this.root.removeEventListener(key, listener, options);
            });
        }
    }
    private attachBinds(bind?: Binds<ElementTag>) {
        for (const [key, value] of Object.entries(bind ?? {})) {
            switch (key) {
                case "clientWidth":
                case "clientHeight":
                case "contentWidth":
                case "contentHeight":
                    this.attachDimensionBind(key, value);
                    break;
                default:
                    this.attachAttributeBind(key, value);
            }
        }
    }
    private attachDimensionBind(key: keyof HTMLElementDimensionBinds, value: BindRead<number>) {
        if (this.resizeObserver === undefined) {
            this.resizeObserver = new ResizeObserver((entries) => {
                entries.forEach((entry) => this.resizeWatchers?.forEach((watcher) => watcher(entry, value)));
            });
            this.resizeObserver.observe(this.root);
        }        

        this.resizeWatchers = this.resizeWatchers ?? [];
        this.resizeWatchers.push((entry) => {
            dimensionBinders[key](entry, value);
        });

        this.disposables.push(() => {
            this.resizeObserver?.unobserve(this.root);
            this.resizeObserver = undefined;
            this.resizeWatchers = undefined;
        });
    }
    private attachAttributeBind(key: any, value: Bind<any>) {
        const elementBinders = attributeBinders[this.type as keyof HTMLElementBindMap];
        const binder = elementBinders[key as keyof typeof elementBinders];
        
        const dispose = binder(this.root as any, value);
        if (dispose) {
            this.disposables.push(...dispose);
        }
    }
    private attachAttributes(attributes?: Attributes<ElementTag>) {
        for (const [key, value] of Object.entries(attributes ?? {})){
            const dispose = watchProp(value, (next) => {
                this.root.setAttribute(key, next);
            });
            if (dispose) {
                this.disposables.push(dispose);
            }
        }
    }
    private runActions(actions?: Actions) {
        for (const [_, value] of Object.entries(actions ?? {})) {
            const dispose = value(this.root);
            if (dispose) {
                this.disposables.push(dispose);
            }
        }
    }
}
function watchProp(value: Reactive<any>, onValue: ValueCallback<any>) {
    if (value instanceof ReactiveString) {
        const reactiveString = value.toStore();
        return reactiveString.watch(onValue);
    } else if (value instanceof Store) {
        return value.watch(onValue);
    } else {
        onValue(value);
    }
}

export function $fragment(...children: Child[]) {
    return new Fragment(children);
}
type Mover = (parent: Node, anchor?: Node) => Node | undefined;
class Fragment extends Renderable {
    private marker!: Node;
    private movers!: Array<Mover>;

    constructor(
        private children: Child[]
    ) {
        super();
    }

    override mount(parent: Node, anchor?: Node) {
        super.mount(parent, anchor);

        const fragment = document.createDocumentFragment();
        this.movers = [];
        this.marker = document.createTextNode("");
        parent.insertBefore(this.marker, anchor ?? null);

        const { movers, children, disposables } = this;
        function createText(next: Stringifiable) {
            const text = document.createTextNode(next.toString());
            fragment.insertBefore(text, null);
            disposables.push(() => parent.removeChild(text));
            movers.unshift((parent, anchor) => parent.insertBefore(text, anchor ?? null));
        }
        for (const child of children) {
            if (child instanceof Renderable) {
                child.mount(fragment);
                disposables.push(child.unmount.bind(child));
                movers.unshift(child.move.bind(child));
            } else if (child instanceof ReactiveString) {
                const reactiveText = child.toRenderable();
                reactiveText.mount(fragment);
                disposables.push(reactiveText.unmount.bind(reactiveText));
                movers.unshift(reactiveText.move.bind(reactiveText));
            } else if (child instanceof Store) {
                disposables.push(child.watch(createText));
            } else {
                createText(child.toString());
            }
        }

        parent.insertBefore(fragment, anchor ?? null);
    }
    override move(parent: Node, anchor?: Node) {
        const { marker } = this;

        parent.insertBefore(this.marker, anchor ?? null);

        let last = marker;
        this.movers.forEach((mover) => {
            last = mover(parent, last) ?? last;
        });
        return last;
    }
    override unmount() {
        super.unmount();

        const { marker } = this;
        marker.parentElement?.removeChild(marker);
    }
}
