import { Props, Tag } from "./props";
import { Store } from "./store";

type Stringifiable = { toString: () => string };
type StringLike = Stringifiable | Store<Stringifiable>;

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

interface ReactiveString {
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

export function createRenderable(
    type: Tag,
    props?: Props<Tag>,
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
export function render(renderable: Renderable, parent: HTMLElement, anchor?: HTMLElement) {
    renderable.build();
    renderable.attach(parent, anchor);
}
