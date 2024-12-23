import { $if } from "./lib/directives";
import { createEventHandler } from "./lib/event";
import { createRenderable, format } from "./lib/render";
import { AtomStore, derive, DerivedStore, MapStore } from "./lib/store";

const en = new AtomStore("Ceres・Fauna・");
const jp = new AtomStore("セレス・ファウナ・");
const count = new AtomStore(0);
const upper = new DerivedStore([en], ([e]) => e.toUpperCase());
const double = new DerivedStore([count], ([c]) => 2 * c);
const color = new DerivedStore([count], ([c]) => ["darkgreen", "darkolivegreen", "darkkhaki"][c % 3]);
const tubers = new MapStore<{ gen: { promise: {
    name: string,
    mark: string
}}}>({ gen: { promise: {
    name: "Ceres Fauna",
    mark: "🌿"
}}});
const dir = new AtomStore(1);

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
    return `${str.slice(dir.value)}${str.slice(0, dir.value)}`;
}

setInterval(() => en.value = scroll(en.value), 500);
setInterval(() => jp.value = scroll(jp.value), 500);
setInterval(() => ++count.value, 500);

const gen = new AtomStore(3);
setInterval(() => gen.value = ++gen.value % 5, 2000);

const app = createRenderable("div", { id: format`colored-${color}`, style: { color } },
    createRenderable("h1", undefined, en),
    createRenderable("h1", undefined, upper),
    createRenderable("h1", undefined, jp),

    createRenderable("div", undefined, format`ticks: ${count}`),
    createRenderable("div", undefined, format`double: ${double}`),

    createRenderable("span", undefined, double),

    createRenderable("div", undefined,
        createRenderable("span", undefined, derive(
            [dir], ([d]) => d > 0 ? "left" : "right"
        )),
        createRenderable("button", {
            onclick: createEventHandler(() => dir.value *= -1)
        }, "flip"),
    ),

    createRenderable("div", undefined,
        $if(derive([gen], ([g]) => g === 1), createRenderable("span", undefined, "ame")).
        $elseif(derive([gen], ([g]) => g === 2), createRenderable("span", undefined, "sana")).
        $elseif(derive([gen], ([g]) => g === 3), createRenderable("span", undefined, "fuwamoco")).
        $elseif(derive([gen], ([g]) => g === 4), createRenderable("span", undefined, "cc")).
        $else(createRenderable("span", undefined, "soon"))            
    ),
);
app.build();
app.attach(document.body);
