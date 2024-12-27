import { StringLike } from "./props";
import { Renderable } from "./renderable";
import { DerivedStore, Store } from "./store";

export function $format(strings: TemplateStringsArray, ...values: StringLike[]) {
    return new ReactiveString(strings, values);
}
export class ReactiveString {
    constructor(
        public strings: TemplateStringsArray,
        public values: StringLike[]

    ) { }

    toStore() {
        const { strings, values } = this;
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
        return new DerivedStore(observables, (reactiveValues) => {
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
    }
    toRenderable() {
        return new ReactiveText(this);
    }
}

export function $text(reactiveString: ReactiveString) {
    return new ReactiveText(reactiveString);
}
class ReactiveText extends Renderable {
    protected nodes!: Node[];

    constructor(
        private reactiveString: ReactiveString
    ) {
        super();
    }

    override mount(parent: Node, anchor?: Node) {
        super.mount(parent, anchor);

        this.nodes = [];

        const { nodes, reactiveString: { strings, values }, disposables } = this;
        const fragment = document.createDocumentFragment();

        for (const index in values) {
            let node = document.createTextNode(strings[index]);
            fragment.insertBefore(node, null);
            nodes.push(node);

            const value = values[index];
            if (value instanceof Store) {
                node = document.createTextNode(value.value.toString());
                disposables.push(value.watch((next) => {
                    node.textContent = next.toString();
                }));
                fragment.insertBefore(node, null);
                nodes.push(node);
            } else {
                node = document.createTextNode(value.toString())
                fragment.insertBefore(node, null);
                nodes.push(node);
            }
        }
        parent.insertBefore(fragment, anchor ?? null);
        this.nodes.reverse();
    }
    override move(parent: Node, anchor?: Node) {
        const { nodes } = this;

        let last = anchor;
        nodes.slice(0).forEach((node) => {
            parent.insertBefore(node, last ?? null);
            last = node;
        });
        return last;
    }
}
