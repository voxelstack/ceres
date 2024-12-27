import { createBind } from "./lib/bind";
import { createComponent } from "./lib/component";
import { createAwait, createEach, createIf } from "./lib/directive";
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

const checked = new AtomStore(true);
checked.watch(console.log);
const mapped = new AtomStore("enabled");
mapped.watch(console.log);
const text = new AtomStore("hehehe");
text.watch(console.log);
const numeric = new AtomStore(20);
numeric.watch(console.log);

const app = createComponent("div", { id: format`colored-${color}`, style: { color } },
    createComponent("input", {
        type: "checkbox",
        bind: { checked }
    }),
    createComponent("input", {
        type: "checkbox",
        bind: {
            checked: {
                store: mapped, 
                toBind: (dom) => dom ? "enabled" : "disabled",
                toDom: (bind) => bind === "enabled"
            }
        }
    }),
    createComponent("input", {
        type: "text",
        bind: { value: text }
    }),
    createComponent("input", {
        type: "number",
        bind: { value: createBind(numeric, "integer") }
    }),
    createComponent("input", {
        type: "range",
        min: 0,
        max: 100,
        step: 20,
        bind: { value: createBind(numeric, "integer") }
    }),

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
            on: {click: createEventHandler(() => dir.value *= -1)}
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
                use: {
                    mount: (node) => {
                        console.log("mount", node);
                        return () => console.log("unmount", node);
                    }
                },
                style: { display: "block", color: "red" }
            }, name)
        ),
        createComponent("button", { on: { click: createEventHandler(() => us.value = us.value.toSorted())}}, "???"),
        createComponent("button", { on: { click: createEventHandler(() => {
            const victim = us.value[Math.floor(Math.random() * us.value.length)];
            us.value = us.value.filter((value) => value !== victim);
        })}}, "---"),
    ),

    createText(format`${color}`),

    createComponent("div", undefined,
        createAwait(
            fetch("https://imissfauna.com/api/v2/past_stream").then((res) => res.json()),
            createComponent("span", undefined, "Loading...")
        ).
        createThen((result: object) => createComponent("pre", undefined, JSON.stringify(result, null, 8))).
        createCatch(() => createComponent("span", undefined, "ohno"))
    ),
);
app.mount(document.body);
