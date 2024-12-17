import { render, createRenderable, format } from "./lib/render";
import { AtomStore as AtomicStore, DerivedStore, MapStore } from "./lib/store";

const en = new AtomicStore("Ceres・Fauna・");
const jp = new AtomicStore("セレス・ファウナ・");
const count = new AtomicStore(0);
const upper = new DerivedStore([en], ([e]) => e.toUpperCase());
const double = new DerivedStore([count], ([c]) => 2 * c);
const tubers = new MapStore<{ gen: { promise: {
    name: string,
    mark: string
}}}>({ gen: { promise: {
    name: "Ceres Fauna",
    mark: "🌿"
}}});

tubers.subscribeKey("gen.promise.name", console.log);
tubers.subscribeKey("gen", console.log);

setTimeout(() =>
    tubers.setKey("gen.promise.name", "Ceres Fauna (graduated)"),
    1000
);
setTimeout(() =>
    tubers.setKey("gen", { promise: { name: "LemonLeaf", mark: "🌙" }}),
    2000
);

function scroll(str: string) {
    return `${str.slice(-1)}${str.slice(0, -1)}`;
}

setInterval(() => en.value = scroll(en.value), 500);
setInterval(() => jp.value = scroll(jp.value), 500);
setInterval(() => ++count.value, 500);

render(
    createRenderable("div", undefined,
        createRenderable("h1", undefined, en),
        createRenderable("h1", undefined, upper),
        createRenderable("h1", undefined, jp),

        createRenderable("div", undefined, format`ticks: ${count}`),
        createRenderable("div", undefined, format`double: ${double}`),

        createRenderable("span", undefined, double),
    ),
    document.body
);
