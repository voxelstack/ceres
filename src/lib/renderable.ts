import { LiteralOrStore, StringLike } from "./props";

export type Child = StringLike | Renderable;
export type Disposable = () => void;

export abstract class Renderable {
    protected disposables!: Disposable[];
    public didMount?: () => void;
    public didUnmount?: () => void;
    
    constructor() { }

    mount(parent: Node, anchor?: Node): void {
        this.disposables = [];
    };
    abstract move(parent: Node, anchor?: Node): Node | undefined;
    unmount(): void {
        // TODO Override on derived classes to release members.
        this.disposables.forEach((dispose) => dispose());
    }
}
export interface ConditionalRenderable {
    condition: LiteralOrStore<boolean>;
    renderable: Renderable;
}
