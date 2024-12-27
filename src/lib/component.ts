import { attributeBinders, Bind, BindRead, DimensionBinder, dimensionBinders, HTMLElementBindMap, HTMLElementDimensionBinds } from "./bind";
import { Actions, Attributes, Binds, Handlers, Props, Reactive, Styles, Tag } from "./props";
import { ReactiveString } from "./reactive_string";
import { Child, Renderable } from "./renderable";
import { Store, ValueCallback } from "./store";

export function createComponent<Type extends Tag>(
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
        for (const child of children) {
            if (child instanceof Renderable) {
                child.mount(root);
                disposables.push(child.unmount.bind(child));
            } else if (child instanceof ReactiveString) {
                const reactiveText = child.toRenderable();
                reactiveText.mount(root);
                disposables.push(reactiveText.unmount.bind(reactiveText));
            } else if (child instanceof Store) {
                disposables.push(child.watch((next) => {
                    root.textContent = next.toString();
                }));
            } else {
                root.textContent = child.toString();
            }
        }

        const { style, on, use, bind, ...attributes } = this.props;
        this.attachStyles(style);
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
