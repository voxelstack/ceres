import { StringLike } from "./props";
import { Store } from "./store";

export type Child = StringLike | Renderable;
export type Disposable = () => void;

export abstract class Renderable {
    protected disposables: Disposable[];
    
    constructor() {
        this.disposables = [];
    }

    abstract mount(parent: Node, anchor?: Node): void;
    abstract move(parent: Node, anchor?: Node): Node | undefined;
    unmount(): void {
        // TODO Override on derived classes to release members.
        this.disposables.forEach((dispose) => dispose());
    }
}
export interface ConditionalRenderable {
    // TODO boolean | Store<boolean>
    condition: Store<boolean>;
    renderable: Renderable;
}
