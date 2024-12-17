type ChangeCallback<T> = (next: T, previous: T) => void;
type ValueCallback<T> = (next: T, previous?: T) => void;
type Dispose = () => void;

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
        const previous = this.stored;
        this.stored = next;
        this.notify(previous);
    }
}


type MapStorage = Record<string, unknown>;
type Join<Path extends string, Base extends string = ""> =
    Base extends "" ?
      `${Path}`
    : `${Base}.${Path}`
;
type FlatKeys<
    Model extends MapStorage,
    BasePath extends string = "",
    FlattenedKeys extends "" = never
> = Model extends MapStorage ? {
    [Key in keyof Model]: Key extends string ?
          Model[Key] extends MapStorage ?
              FlatKeys<Model[Key], Join<Key, BasePath>, FlattenedKeys>
            : Join<Key, BasePath>
        : never
    }[keyof Model] | FlattenedKeys | BasePath
    : FlattenedKeys
;
type PathType<
    Model,
    Path
> = Path extends keyof Model ?
      Model[Path]
    : Path extends `${infer Head}.${infer Tail}` ?
          Head extends keyof Model ?
              PathType<Required<Model[Head]>, Tail>
            : never
        : never
;

export class MapStore<T extends MapStorage> extends Store<T> {
    private storage: T;
    private keySubscribers: {
        [Key in FlatKeys<T>]?: Array<ChangeCallback<PathType<T, Key>>>
    };

    constructor(value: T) {
        super();
        this.storage = value;
        this.keySubscribers = {};
    }

    get value(): T {
        return this.storage;
    }

    getKey<Key extends FlatKeys<T>>(key: Key) {
        const { container, propKey } = this.findKey(key);
        return container[propKey] as PathType<T, Key>;
    }
    setKey<Key extends FlatKeys<T>>(key: Key, value: PathType<T, Key>) {
        const { container, propKey } = this.findKey(key);
        const previous = container[propKey] as PathType<T, Key>;
        container[propKey] = value;
        this.notifyKey(key, value, previous);
    }

    subscribeKey<Key extends FlatKeys<T>>(key: Key, onChange: ChangeCallback<PathType<T, Key>>) {
        this.keySubscribers[key] = this.keySubscribers[key] ?? [];
        this.keySubscribers[key].push(onChange);
        return () => {
            this.keySubscribers[key] = this.keySubscribers[key]?.filter((it) => it !== onChange);
        };
    }
    watchKey<Key extends FlatKeys<T>>(key: Key, onValue: ValueCallback<PathType<T, Key>>) {
        onValue(this.getKey(key));
        return this.subscribeKey(key, onValue);
    }

    private findKey<Key extends FlatKeys<T>>(key: Key) {
        const segments = key.split(".");
        const [propKey] = segments.splice(-1);
        let container: MapStorage = this.storage;
        for (const segment of segments) {
            container = container[segment] as MapStorage;
        }
        return { container, propKey };
    }
    private notifyKey<Key extends FlatKeys<T>>(key: Key, next: PathType<T, Key> , previous: PathType<T, Key>) {
        this.keySubscribers[key]?.forEach((onChange) => onChange(next, previous));
    }
}

type StoredType<Store extends AtomStore<any>> = Store extends AtomStore<infer T> ? T : never;
type StoredTypes<
    Stores extends Array<AtomStore<any>>,
    Values extends Array<any> = []
> = Stores extends [infer Head extends AtomStore<any>, ...infer Tail extends Array<AtomStore<any>>] ?
      StoredTypes<Tail, [...Values, StoredType<Head>]>
    : Values
;
type Aggregator<Stores extends Array<AtomStore<any>>, T> = (values: StoredTypes<Stores>) => T;

export class DerivedStore<const Stores extends Array<AtomStore<any>>, T> extends Store<T> {
    private stores: AtomStore<any>[];
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
            if (this.subscribers.length === 0)
                this.disconnect();
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
