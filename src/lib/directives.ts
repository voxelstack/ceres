import { Attach, Build, Detach, Renderable } from "./render";
import { Store } from "./store";

interface Directive { 
    directive: "if" | "each";

    build: Build;
    attach: Attach;
    detach: Detach;

    __brand: "directive";
}

interface ConditionalRenderable {
    condition: Store<boolean>;
    renderable: Renderable;
}
export interface DirectiveIf extends Directive {
    directive: "if";

    chain: Array<ConditionalRenderable>;
    else?: Renderable;

    $elseif: (condition: Store<boolean>, renderable: Renderable) => DirectiveElseIf;
    $else: (renderable: Renderable) => DirectiveElse;
}
type DirectiveElseIf = DirectiveIf;
type DirectiveElse = Omit<DirectiveIf, "$elseif" | "$else">;
export function isDirective(object: unknown): object is Directive {
    return (object as Directive).__brand === "directive";
}
export function $if(condition: Store<boolean>, renderable: Renderable) {
    const directive: DirectiveIf = {
        directive: "if",

        chain: [{
            condition,
            renderable
        }],

        build,
        attach,
        detach,

        $else,
        $elseif,

        __brand: "directive"
    };
    
    let visible: Renderable | undefined;
    const disposables: Array<()=>void> = [];
    let marker: Node;

    function build() {
        // TODO Separating creation from updates will get rid of this duplication.
        for (let i = 0; i < directive.chain.length; ++i) {
            if (directive.chain[i].condition.value) {
                visible = directive.chain[i].renderable;
                break;
            }
        }
        if (!visible)
            visible = directive.else;
        visible?.build();

        disposables.push(...directive.chain.map(({ condition }) => condition.subscribe(() => {
            const prev = visible;
            visible = undefined;

            for (let i = 0; i < directive.chain.length; ++i) {
                if (directive.chain[i].condition.value) {
                    visible = directive.chain[i].renderable;
                    break;
                }
            }
            if (!visible)
                visible = directive.else;

            if (visible !== prev) {
                if (prev)
                    prev.detach();
                visible?.build();
                visible?.attach(marker.parentElement!, marker);
            }            
        })));
    }
    function attach(parent: Node, anchor?: Node) {
        // TODO Svelte is smart enough to only create this marker if there's not already an element it can reuse.
        //      Might be able to do the same even at runtime.
        if (!marker) {
            marker = document.createTextNode("");
            parent.insertBefore(marker, anchor ?? null);
        }
        visible?.attach(parent, marker);
    }
    function detach() {
        visible?.detach();
        disposables.forEach((dispose) => dispose());
    }

    function $elseif(condition: Store<boolean>, renderable: Renderable) {
        directive.chain.push({ condition, renderable });
        return directive;
    }
    function $else(renderable: Renderable) {
        directive.else = renderable;
        return directive;
    }

    return directive;
}
