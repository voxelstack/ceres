import { LiteralOrStore } from "./props";
import { ConditionalRenderable, Renderable } from "./renderable";
import { Store } from "./store";

abstract class Directive extends Renderable { }

export function createIf(
    condition: LiteralOrStore<boolean>,
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

            for (const { condition, renderable } of chain) {
                if (condition instanceof Store ? condition.value : condition) {
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
        const firstLiteralTrue = chain.findIndex(({ condition }) => !(condition instanceof Store) && condition);
        disposables.push(...chain
            // Renderables that come after a literal true will never be rendered,
            // so don't watch them.
            .slice(0, firstLiteralTrue === -1 ? undefined : firstLiteralTrue)
            .filter(({ condition }) => condition instanceof Store)
            .map(({ condition }) => (condition as Store<unknown>).subscribe(onChange))
        );
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
        condition: LiteralOrStore<boolean>,
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

export function createEach<T>(
    entries: LiteralOrStore<Array<T>>,
    render: (entry: T) => Renderable
) {
    return new DirectiveEach(entries, render);
}
class DirectiveEach<T> extends Directive {
    private marker!: Node;
    private registry!: Map<T, Renderable>;

    constructor(
        private entries: LiteralOrStore<Array<T>>,
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

        function createRenderables(next: Array<T>, previous?: Array<T>) {
            const prev: Array<T> = previous ?? [];
            next.forEach((value) => {
                const prevIndex = prev.findIndex((it) => it === value);
                if (prevIndex === -1) {
                    const fragment = render(value);
                    fragment.mount(parent, marker);
                    registry.set(value, fragment);
                } else {
                    prev.splice(prevIndex, 1);
                }
                prev.forEach((value) => {
                    registry.get(value)?.unmount();
                    registry.delete(value);
                });
            });
        }

        if (entries instanceof Store) {
            entries.watch((next, previous) => {
                createRenderables(next, previous);
                
                let last: Node = marker;
                next.toReversed().forEach((value) => {
                    last = registry.get(value)!.move(marker.parentElement!, last) ?? last;
                });
            });
        } else {
            createRenderables(entries);
        }
    }
    override move(parent: Node, anchor?: Node) {
        const { marker, registry } = this;

        parent.insertBefore(this.marker, anchor ?? null);

        let last = marker;
        this.entries.value.toReversed().forEach((value) => {
            last = registry.get(value)!.move(marker.parentElement!, last) ?? last;
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

export function createAwait<T>(promise: LiteralOrStore<Promise<T>>, pending?: Renderable) {
    return new DirectiveAwait(promise, pending);
}
class DirectiveAwait<T> extends Renderable {
    private marker!: Node;
    private onSettled?: (value: T) => Renderable;
    private onError?: (error: unknown) => Renderable;
    private visible?: Renderable;

    constructor(
        private promise: LiteralOrStore<Promise<T>>,
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

        function onValue(next: Promise<T>) {
            if (pending) {
                visible?.unmount();
                
                visible = pending;
                visible.mount(parent, marker);
            }
    
            if (onSettled) {
                next.then((value) => {
                    visible?.unmount();
                    
                    const settled = onSettled(value);
                    visible = settled;
                    visible.mount(parent, marker);
                });
            }
            if (onError) {
                next.catch((reason) => {
                    visible?.unmount();
    
                    const error = onError(reason);
                    visible = error;
                    visible.mount(parent, marker);
                });
            }
        }
        if (promise instanceof Store) {
            this.disposables.push(promise.watch(onValue));
        } else {
            onValue(promise);
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
