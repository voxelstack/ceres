import { ConditionalRenderable, Renderable } from "./renderable";
import { derive, Store } from "./store";

// TODO Make directives accept LiteralOrStore<T> instead of Store<T>
abstract class Directive extends Renderable { }

export function createIf(
    condition: Store<boolean>,
    renderable: Renderable
): Pick<DirectiveIf, "createElseIf" | "createElse"> {
    return new DirectiveIf([{ condition, renderable }]);
}
class DirectiveIf extends Directive {
    private marker!: Node;
    private visible?: Renderable;

    constructor(
        private chain: ConditionalRenderable[] = [],
        private orElse?: Renderable
    ) {
        super();
    }
    override mount(parent: Node, anchor?: Node) {
        super.mount(parent, anchor);

        this.marker = document.createTextNode("");
        parent.insertBefore(this.marker, anchor ?? null);

        const { marker, chain, orElse, disposables } = this;
        let { visible } = this;

        function onChange() {
            const previous = visible;
            visible = undefined;

            // TODO Track which condition is currently true and don't check them all on change.
            for (const { condition, renderable } of chain) {
                if (condition.value) {
                    visible = renderable;
                    break;
                }
            }
            if (visible === undefined) {
                visible = orElse;
            }

            if (previous !== visible) {
                previous?.unmount();
                visible?.mount(marker.parentElement!, marker);
            }
        }
        disposables.push(...chain.map(({ condition }) => condition.subscribe(onChange)));
        onChange();
    }
    override move(parent: Node, anchor?: Node) {
        parent.insertBefore(this.marker, anchor ?? null);
        return this.visible?.move(parent, this.marker);
    }
    override unmount() {
        super.unmount();
        
        const { marker, visible } = this;
        marker.parentElement?.removeChild(marker)
        visible?.unmount();
    }

    createElseIf(
        condition: Store<boolean>,
        renderable: Renderable
    ): Pick<DirectiveIf, "createElseIf" | "createElse"> {
        this.chain.push({ condition, renderable });
        return this;
    }
    createElse(orElse: Renderable): Omit<DirectiveIf, "createElseIf" | "createElse"> {
        this.orElse = orElse;
        return this;
    }
}

export function createEach<T>(entries: Store<Array<T>>, render: (entry: T) => Renderable) {
    return new DirectiveEach(derive([entries], ([e]) => new Set<T>(e)), render);
}
class DirectiveEach<T> extends Directive {
    private marker!: Node;
    private registry!: Map<T, Renderable>;
    private order!: Array<T>;

    constructor(
        private entries: Store<Set<T>>,
        private render: (entry: T) => Renderable
    ) {
        super();
    }

    override mount(parent: Node, anchor?: Node): void {
        super.mount(parent, anchor);

        this.registry = new Map();
        this.marker = document.createTextNode("");
        parent.insertBefore(this.marker, anchor ?? null);

        const { marker, registry, entries, render } =  this;
        
        entries.watch((next, previous) => {
            const added = previous ? next.difference(previous) : next;
            const removed = previous?.difference(next);

            added.forEach((value) => {
                if (!registry.has(value)) {
                    const fragment = render(value);
                    fragment.mount(parent, anchor);
                    registry.set(value, fragment);
                }
            });
            removed?.forEach((value) => {
                registry.get(value)!.unmount();
                registry.delete(value);
            });

            this.order = Array.from(next).reverse();
            let last: Node = marker;
            this.order.forEach((value) => {
                last = registry.get(value)!.move(marker.parentElement!, last)!;
            });
        });
    }
    override move(parent: Node, anchor?: Node) {
        const { marker, order, registry } = this;

        parent.insertBefore(this.marker, anchor ?? null);

        let last = marker;
        order.forEach((value) => {
            last = registry.get(value)!.move(marker.parentElement!, last)!;
        });
        return last;
    }
    override unmount() {
        super.unmount();

        const { marker, registry } = this;
        marker.parentElement?.removeChild(marker);
        registry.forEach((renderable) => renderable.unmount());
    }
}

export function createKey<T>(key: Store<T>, renderable: Renderable) {
    return new DirectiveKey(key, renderable);
}
class DirectiveKey<T> extends Directive {
    private marker!: Node;

    constructor(
        private key: Store<T>,
        private renderable: Renderable
    ) {
        super();
    }

    override mount(parent: Node, anchor?: Node) {
        super.mount(parent, anchor);

        this.marker = document.createTextNode("");
        parent.insertBefore(this.marker, anchor ?? null);

        const { marker, key, renderable, disposables } = this;

        disposables.push(key.subscribe(() => {
            renderable.unmount();
            renderable.mount(parent, marker);
        }));
        renderable.mount(parent, marker);
    }
    override move(parent: Node, anchor?: Node) {
        parent.insertBefore(this.marker, anchor ?? null);
        return this.renderable?.move(parent, this.marker);
    }
    override unmount() {
        super.unmount();

        const { marker, renderable } = this;
        marker.parentElement?.removeChild(marker);
        renderable.unmount();
    }
}

// TODO Maybe change to Store<Promise<T>> | Promise<T>.
export function createAwait<T>(promise: Promise<T>, pending?: Renderable) {
    return new DirectiveAwait(promise, pending);
}
class DirectiveAwait<T> extends Renderable {
    private marker!: Node;
    private onSettled?: (value: T) => Renderable;
    private onError?: (error: unknown) => Renderable;
    private visible?: Renderable;

    constructor(
        private promise: Promise<T>,
        private pending?: Renderable
    ) {
        super();
    }

    override mount(parent: Node, anchor?: Node): void {
        super.mount(parent, anchor);

        this.marker = document.createTextNode("");
        parent.insertBefore(this.marker, anchor ?? null);

        const { marker, onSettled, onError, promise, pending } = this;
        let { visible } = this;

        if (pending) {
            visible = pending;
            visible.mount(parent, marker);
        }

        if (onSettled) {
            promise.then((value) => {
                visible?.unmount();
                
                const settled = onSettled(value);
                visible = settled;
                visible.mount(parent, marker);
            });
        }
        if (onError) {
            promise.catch((reason) => {
                visible?.unmount();

                const error = onError(reason);
                visible = error;
                visible.mount(parent, marker);
            });
        }
    }
    override move(parent: Node, anchor?: Node) {
        parent.insertBefore(this.marker, anchor ?? null);
        return this.visible?.move(parent, this.marker);
    }
    override unmount() {
        super.unmount();

        const { marker, visible } = this;
        marker.parentElement?.removeChild(marker);
        visible?.unmount();
    }

    createThen(
        onSettled: (value: T) => Renderable
    ): Pick<DirectiveAwait<T>, "createCatch"> {
        this.onSettled = onSettled;
        return this;
    }
    createCatch(
        onError: (error: unknown) => Renderable
    ): Omit<DirectiveAwait<T>, "createThen" | "createCatch"> {
        this.onError = onError;
        return this;
    }
}
