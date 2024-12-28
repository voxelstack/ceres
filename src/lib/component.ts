import { BoundOrRaw, ComponentBinds, documentBinders, getComponentBinders, rawBind, windowBinders } from "./bind";
import { EventHandler } from "./event";
import { Actions, Attributes, BodyProxyProps, Classes, DocumentProxyProps, Handlers, Props, Reactive, Stringifiable, Styles, Tag, WindowProxyProps } from "./props";
import { ReactiveString } from "./reactive_string";
import { Child, Disposable, Renderable } from "./renderable";
import { AtomStore, Store, ValueCallback } from "./store";

export interface ElementProxy<Element> {
    get element(): Element;
}
type MountListener<Element> = (element: Element | null) => void;
type ResizeListener = (entry: ResizeObserverEntry) => void;
type ComponentEventMap<Type extends Tag> = {
    mount: MountListener<HTMLElementTagNameMap[Type]>;
    resize: ResizeListener;
};
type Listeners<Type extends Tag> = {
    [Key in keyof ComponentEventMap<Type>]: Set<ComponentEventMap<Type>[Key]>
};

export function $component<Type extends Tag>(
    type: Type,
    props: Props<Type> = {},
    ...children: Child[]
) {
    return new Component(type, props, children);
}
export class Component<const ElementTag extends Tag>
    extends Renderable
    implements ElementProxy<HTMLElementTagNameMap[ElementTag]>
{
    private resizeObserver?: ResizeObserver;
    private listeners!: Listeners<ElementTag>;
    protected root!: HTMLElementTagNameMap[ElementTag];

    constructor(
        private type: ElementTag,
        private props: Props<ElementTag>,
        private children: Child[]
    ) {
        super();
    }

    public get element() {
        return this.root;
    }

    override mount(parent: Node, anchor?: Node) {
        super.mount(parent, anchor);

        this.listeners = { mount: new Set(), resize: new Set() };
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

        const { on, use, bind, style, className, ...attributes } = this.props;
        this.attachStyles(style);
        this.attachClass(className);
        this.attachEventHandlers(on);
        this.attachBinds(bind);
        this.attachAttributes(attributes as Attributes<ElementTag>);

        parent.insertBefore(root, anchor ?? null);
        this.listeners.mount.forEach((listener) => listener(root));
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
        this.listeners.mount.forEach((listener) => listener(null));
    }

    subscribe<
        Type extends keyof Listeners<ElementTag>
    >(type: Type, listener: ComponentEventMap<ElementTag>[Type]) {
        this.addEventListener(type, listener);
        return () => this.removeEventListener(type, listener);
    }

    private addEventListener<
        Type extends keyof Listeners<ElementTag>
    >(type: Type, listener: ComponentEventMap<ElementTag>[Type]) {
        if (type === "resize") {
            if (this.resizeObserver === undefined) {
                this.resizeObserver = new ResizeObserver((entries) => {
                    entries.forEach((entry) => {
                        this.listeners.resize.forEach((listener) => listener(entry));
                    });
                });
                this.resizeObserver.observe(this.root);
            }
        }

        this.listeners[type].add(listener);
    }
    private removeEventListener<
        Type extends keyof Listeners<ElementTag>
    >(type: Type, listener: ComponentEventMap<ElementTag>[Type]) {
        this.listeners[type].delete(listener);

        if (type === "resize") {
            if (this.listeners.resize.size === 0) {
                this.resizeObserver?.unobserve(this.root);
                this.resizeObserver = undefined;
            }
        }
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
    private attachBinds(bind?: ComponentBinds<ElementTag>) {
        for (const [key, value] of Object.entries(bind ?? {})) {
            const binders = getComponentBinders(this.type);
            const binder: (...args: any) => Disposable | void =
                binders[key as keyof typeof binders];

            const dispose = value instanceof AtomStore ?
                  binder(this, rawBind(value))
                : binder(this, value);
            if (dispose) {
                this.disposables.push(dispose);
            }
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

export function $boundary(error: Renderable, ...children: Child[]) {
    return new Boundary(error, children);
}
class Boundary extends Fragment {
    constructor(
        private error: Renderable,
        children: Child[]
    ) {
        super(children);
    }

    override mount(parent: Node, anchor?: Node) {
        try {
            super.mount(parent, anchor);
        } catch (err: unknown) {
            console.error(err);
            super.unmount();
            
            const { error } = this;
            error.mount(parent, anchor);
            this.disposables = [() => error.unmount.bind(error)];
        }
    }
}

export function $head(...children: Child[]) {
    return new Head(children);
}
class Head extends Fragment {
    override mount() {
        super.mount(document.head);
    }
}

type SpecialElementProxyProps = {
    on?: Record<string, EventHandler<any> | undefined>;
    bind?: Record<string, BoundOrRaw<any>>;
};
abstract class SpecialElementProxy<
    Element extends EventTarget,
    Props extends SpecialElementProxyProps
> extends Renderable implements ElementProxy<Element> {
    constructor(
        private props: Props
    ) {
        super();
    }

    abstract get element(): Element;
    abstract get binders(): Record<string, (...args: any) => Disposable | void>;
    
    override mount(parent: Node, anchor?: Node) {
        super.mount(parent, anchor);

        const { on, bind } = this.props;
        this.attachEventHandlers(on);
        this.attachBinds(bind);
    }
    override move() {
        return undefined;
    }

    private attachEventHandlers(on?: Record<string, EventHandler<any> | undefined>) {
        for (const [key, value] of Object.entries(on ?? {})) {
            if (value === undefined) {
                continue;
            }

            const { listener, options } = value;

            this.element.addEventListener(key, listener, options);
            this.disposables.push(() => {
                this.element.removeEventListener(key, listener, options);
            });
        }
    }
    private attachBinds(bind?: Record<string, BoundOrRaw<unknown>>) {
        for (const [key, value] of Object.entries(bind ?? {})) {
            const binder = this.binders[key];

            const dispose = value instanceof AtomStore ?
                binder(this, rawBind(value))
              : binder(this, value);
            if (dispose) {
                this.disposables.push(dispose);
            }
        }
    }
}

export function $window(props: WindowProxyProps) {
    return new WindowProxy(props);
}
class WindowProxy extends SpecialElementProxy<Window, WindowProxyProps> {
    override get element() { return window; }
    override get binders() { return windowBinders; }
}

export function $document(props: DocumentProxyProps) {
    return new DocumentProxy(props);
}
class DocumentProxy extends SpecialElementProxy<Document, DocumentProxyProps> {
    override get element() { return document; }
    override get binders() { return documentBinders; }
}

export function $body(props: BodyProxyProps) {
    return new BodyProxy(props);
}
class BodyProxy extends SpecialElementProxy<HTMLBodyElement, BodyProxyProps> {
    override get element() { return document.body as HTMLBodyElement; }
    override get binders() { return {}; }
}
