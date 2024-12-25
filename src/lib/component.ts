import { EventHandler, EventType } from "./event";
import { Props, Reactive, Tag } from "./props";
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
class Component<Type extends Tag> extends Renderable {
    protected root!: HTMLElement;
    protected handlers!: Partial<Record<EventType, EventHandler<any>>>;

    constructor(
        private type: Type,
        private props: Props<Type>,
        private children: Child[]
    ) {
        super();
    }

    override mount(parent: Node, anchor?: Node) {
        super.mount(parent, anchor);

        this.root = document.createElement(this.type);
        this.handlers = {};

        const { root, handlers, props, children, disposables } = this;

        for (const [k, v] of Object.entries(props)) {
            if (k === "style") {
                const style = props[k as keyof Props<Type>] ?? {};
                for (const [sk, sv] of Object.entries(style)) {
                    const dispose = watchProp(sv, (value) => {
                        root.style.setProperty(sk, value.toString());
                    });
                    if (dispose) {
                        disposables.push(dispose);
                    }
                }
            } else if (k.startsWith("on")) {
                const type = k.substring(2) as EventType;

                switch (type) {
                    case "mount": {
                        handlers["mount"] = v;
                        break;
                    }
                    default: {
                        const { listener, options } = v;
    
                        root.addEventListener(type, listener, options);
                        disposables.push(() => {
                            root.removeEventListener(type, listener, options);
                        });
                    }
                }
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

        parent.insertBefore(root, anchor ?? null);
        const onunmount = handlers["mount"]?.listener(root);
        if (onunmount) {
            disposables.push(onunmount);
        }
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