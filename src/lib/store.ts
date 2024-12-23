export type ChangeCallback<T> = (next: T, previous: T) => void;
export type ValueCallback<T> = (next: T, previous?: T) => void;
export type Dispose = () => void;

export abstract class Store<T> {
    protected subscribers: ChangeCallback<T>[];

    constructor() {
        this.subscribers = [];
    }

    abstract get value(): T;

    subscribe(onChange: ChangeCallback<T>) {
        this.subscribers.push(onChange);
        return () => {
            this.subscribers = this.subscribers.filter((it) => it !== onChange);
        };
    }
    watch(onValue: ValueCallback<T>) {
        onValue(this.value);
        return this.subscribe(onValue);
    }

    protected notify(previous: T) {
        this.subscribers.forEach((onChange) => onChange(this.value, previous));
    }
}

export class AtomStore<T> extends Store<T> {
    protected stored: T;

    constructor(value: T) {
        super();
        this.stored = value;
    }

    get value() {
        return this.stored;
    }
    set value(next: T) {
        if (next === this.stored) {
            return;
        }

        const previous = this.stored;
        this.stored = next;
        this.notify(previous);
    }
}

type StoredType<S extends Store<any>> = S extends AtomStore<infer T> ? T : never;
type StoredTypes<
    Stores extends Array<Store<any>>,
    Values extends Array<any> = []
> = Stores extends [infer Head extends Store<any>, ...infer Tail extends Array<Store<any>>] ?
      StoredTypes<Tail, [...Values, StoredType<Head>]>
    : Values
;
type Aggregator<Stores extends Array<Store<any>>, T> = (values: StoredTypes<Stores>) => T;
export class DerivedStore<const Stores extends Array<Store<any>>, T> extends Store<T> {
    private stores: Store<any>[];
    private aggregator: Aggregator<Stores, T>;
    private disposables: Dispose[];
    private connected: boolean;
    private cache!: T;

    constructor(stores: Stores, aggregator: Aggregator<Stores, T>) {
        super();

        this.stores = stores;
        this.aggregator = aggregator;
        this.disposables = [];
        this.connected = false;
    }

    override get value() {
        return this.connected ? this.cache : this.aggregate();
    }

    override subscribe(onChange: ChangeCallback<T>) {
        if (!this.connected)
            this.connect();

        const unsubscribe = super.subscribe(onChange);
        return () => {
            unsubscribe();
            if (this.subscribers.length === 0) {
                this.disconnect();
            }
        };
    }

    private aggregate() {
        return this.aggregator(this.stores.map((store) => store.value) as StoredTypes<Stores>);
    }
    private connect() {
        this.cache = this.aggregate();
        this.disposables = this.stores.map((store) => {
            return store.subscribe(() => {
                const previous = this.cache;
                this.cache = this.aggregate();
                if (this.cache !== previous)
                    this.notify(previous);
            });
        });
        this.connected = true;
    }
    private disconnect() {
        this.disposables.map((dispose) => dispose());
        this.disposables = [];
        this.connected = false;
    }
}
export function derive<
    const Stores extends Array<Store<any>>, T
>(stores: Stores, aggregator: Aggregator<Stores, T>) {
    return new DerivedStore(stores, aggregator);
}
