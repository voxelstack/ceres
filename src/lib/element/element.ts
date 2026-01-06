import { Observable } from "@observable";
import type { Children, Tag, TagElement } from "./types";

export class CeresElement<const ElementTag extends Tag = "p"> {
    protected tag: ElementTag;
    protected props: unknown;
    protected children: Children;

    protected root?: TagElement<ElementTag>;

    readonly didMount: Observable<void>;
    readonly didUnmount: Observable<void>;

    constructor(tag: ElementTag, props: unknown, children: Children) {
        this.tag = tag;
        this.props = props;
        this.children = children;

        this.didMount = new Observable();
        this.didUnmount = new Observable();
    }

    mount(parent: Element, anchor?: Element) {
        this.root = document.createElement(this.tag) as TagElement<ElementTag>;

        const { root, children } = this;

        if (Array.isArray(children)) {
            throw new Error("Not implemented.");
        } else if (children instanceof Observable) {
            children.subscribe((textContent) => {
                root.textContent = textContent.toString();
            });
        } else {
            root.textContent = children.toString();
        }

        parent.insertBefore(this.root, anchor ?? null);
        this.didMount.emit();
    }

    unmount() {
        this.didUnmount.emit();
    }
}
