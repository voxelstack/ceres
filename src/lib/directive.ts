import { Renderable } from "./renderable";
import { Store } from "./store";

abstract class Directive extends Renderable {}

interface ConditionalRenderable {
    condition: Store<boolean>;
    renderable: Renderable;
}
class DirectiveIf extends Directive {
    constructor(
        protected chain: ConditionalRenderable[] = [],
        protected orElse?: Renderable,
    ) {
        super((parent, anchor) => {
            const { chain, orElse } = this;
            const disposables = [];
            let visible: Renderable | undefined;
            
            const marker = document.createTextNode("");
            parent.insertBefore(marker, anchor ?? null);

            function onChange() {
                const previous = visible;
                visible = undefined;
                // TODO Track which condition is true and don't check them all on change.
                for (const { condition, renderable } of chain) {
                    if (condition.value) {
                        visible = renderable;
                        break;
                    }
                }
                if (!visible) {
                    visible = orElse;
                }

                if (previous !== visible) {
                    previous?.detach();
                    visible?.attach(parent, marker);
                }
            }
            disposables.push(...chain.map(({ condition }) => condition.subscribe(onChange)));
            onChange();

            return disposables;
        });
    }

    $elseif(condition: Store<boolean>, renderable: Renderable) {
        this.chain.push({ condition, renderable });
        return this;
    }
    $else(orElse: Renderable): Omit<DirectiveIf, "elseif" | "else"> {
        this.orElse = orElse;
        return this;
    }
}
export function $if(condition: Store<boolean>, renderable: Renderable): Pick<DirectiveIf, "$elseif" | "$else"> {
    return new DirectiveIf([{ condition, renderable }]);
}
