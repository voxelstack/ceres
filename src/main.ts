import { createComponent } from "./lib/component";
import { createEach, createIf } from "./lib/directive";
import { createEventHandler } from "./lib/event";
import { createText, format } from "./lib/reactive_string";
import { AtomStore, derive, DerivedStore } from "./lib/store";

const en = new AtomStore("Ceres・Fauna・");
const jp = new AtomStore("セレス・ファウナ・");
const count = new AtomStore(0);
const upper = new DerivedStore([en], ([e]) => e.toUpperCase());
const double = new DerivedStore([count], ([c]) => 2 * c);
const color = new DerivedStore([count], ([c]) => ["darkgreen", "darkolivegreen", "darkkhaki"][c % 3]);
const dir = new AtomStore(1);

function scroll(str: string) {
    return `${str.slice(dir.value)}${str.slice(0, dir.value)}`;
}

setInterval(() => en.value = scroll(en.value), 500);
setInterval(() => jp.value = scroll(jp.value), 500);
setInterval(() => ++count.value, 500);

const gen = new AtomStore(1);
setInterval(() => gen.value = ++gen.value % 5, 2000);

const us = new AtomStore(["saplings", "takos", "sanalites", "otomos"]);

const app = createComponent("div", { id: format`colored-${color}`, style: { color } },
    createComponent("h1", undefined, en),
    createComponent("h1", undefined, upper),
    createComponent("h1", undefined, jp),

    createComponent("div", undefined, format`ticks: ${count}`),
    createComponent("div", undefined, format`double: ${double}`),

    createComponent("span", undefined, double),

    createComponent("div", undefined,
        createComponent("span", undefined, derive(
            [dir], ([d]) => d > 0 ? "left" : "right"
        )),
        createComponent("button", {
            onclick: createEventHandler(() => dir.value *= -1)
        }, "flip"),
    ),

    createIf(derive([gen], ([g]) => g === 1), createComponent("span", undefined, "ame")).
    createElseIf(derive([gen], ([g]) => g === 2), createComponent("span", undefined, "sana")).
    createElseIf(derive([gen], ([g]) => g === 3), createComponent("span", undefined, "fwmc")).
    createElseIf(derive([gen], ([g]) => g === 4), createComponent("span", undefined, "cc")).
    createElse(createComponent("span", undefined, "soon")),

    createComponent("div", undefined,
        createEach(
            us,
            (name) => createComponent("span", {
                onmount: createEventHandler((node) => {
                    console.log("mount", node);
                    return () => console.log("unmount", node);
                }),
                style: { display: "block", color: "red" }
            }, name)
        ),
        createComponent("button", { onclick: createEventHandler(() => us.value = us.value.toSorted())}, "???"),
        createComponent("button", { onclick: createEventHandler(() => {
            const victim = us.value[Math.floor(Math.random() * us.value.length)];
            us.value = us.value.filter((value) => value !== victim);
        })}, "---"),
    ),

    // createKey(gen, createComponent("br", { onmount: createEventHandler((node) => {
    //     console.log("mount", node);
    //     return () => console.log("unmount", node);
    // })})),
    createText(format`${color}`),
);
app.mount(document.body);
