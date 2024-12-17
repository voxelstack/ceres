import { Store } from "./store";

type Build = () => void;
type Attach = (parent: HTMLElement, anchor?: HTMLElement) => void;
type Detach = () => void;

interface Renderable {
    build: Build;
    attach: Attach;
    detach: Detach;

    __brand: "renderable";
}

function isRenderable(object: unknown): object is Renderable {
    return (object as Renderable).__brand === "renderable";
}

type Tag = keyof HTMLElementTagNameMap;
type Props = undefined;
type Stringifiable = { toString: () => string };
type Child = Stringifiable | Store<Stringifiable> | Renderable;

export function createRenderable(
    type: Tag,
    props: Props,
    ...children: Child[]
): Renderable {
    let disposables: Array<() => void>;
    let root: HTMLElement | null;

    const build: Build = () => {
        disposables = [];
        root = document.createElement(type);

        for (const child of children) {
            if (isRenderable(child)) {
                child.build();
                child.attach(root);
                disposables.push(child.detach);
            } else if (child instanceof Store) {
                disposables.push(child.watch((value) => {
                    root!.textContent = value.toString();
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

export function render(renderable: Renderable, parent: HTMLElement, anchor?: HTMLElement) {
    renderable.build();
    renderable.attach(parent, anchor);
}
