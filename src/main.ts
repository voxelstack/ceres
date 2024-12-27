import { createBind } from "./lib/bind";
import { createComponent, createFragment } from "./lib/component";
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

const options = [
    { value: "watson_amelia", label: "Watson Amelia" },
    { value: "gawr_gura", label: "Gawr Gura" },
    { value: "ceres_fauna", label: "Ceres Fauna" },
    { value: "grimmy", label: "Grimmy" },
    { value: "koseki_bijou", label: "Koseki Bijou" },
];
const selected = new AtomStore(options[2].value);
selected.watch(console.log);
const multiple = new AtomStore([options[2].value, options[3].value])
multiple.watch(console.log);

const groups = ["a", "b", "c", "d", "e", "f", "g"];
const radio = new AtomStore("a");
radio.watch(console.log);
const checkboxes = new AtomStore(["b", "c"]);
checkboxes.watch(console.log);

const w = new AtomStore(32);
w.watch(console.log);

function makeQuery() {
    return fetch("https://imissfauna.com/api/v2/past_stream").then((res) => res.json());
}
const query = new AtomStore(makeQuery());

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

    createComponent("select", { bind: { value: selected }}, createEach(
        options,
        ({ label, value }) => createComponent("option", { value }, label)
    )),
    createComponent("select", { multiple: true, bind: { value: createBind(multiple, "multiselect") }},
        createEach(
            options,
            ({ label, value }) => createComponent("option", { value }, label)
        )
    ),

    createComponent("fieldset", undefined, createEach(
        groups,
        (entry) => createFragment(
            createComponent("label", { htmlFor: entry }, entry),
            createComponent("input", { id: entry, value: entry, type: "checkbox", bind: { checked: createBind(checkboxes, "checkGroup") } }),
        )
    )),
    createComponent("fieldset", undefined, createEach(
        groups,
        (entry) => createFragment(
            createComponent("label", { htmlFor: entry }, entry),
            createComponent("input", { id: entry, value: entry, type: "radio", bind: { checked: createBind(radio, "radioGroup") } }),
        )
    )),

    createComponent("span", {
        style: { display: "block", width: `${w.value}px`, height: "32px", background: "red" },
        bind: { contentWidth: w },
        use: {
            grow: (node) => {
                setTimeout(() => {
                    (node as HTMLElement).style.width = "64px";
                }, 2000);
            }
        }
    }),

    createComponent("h1", {
        className: format`${color}`,
    }, en),
    createComponent("h1", {
        className: multiple,
    }, upper),
    createComponent("h1", {
        className: derive([multiple], ([m]) => {
            return Object.fromEntries(options.map(({ value })=> [
                value, m.includes(value)
            ]))
        })
    }, jp),

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
        createAwait(query, createComponent("span", undefined, "Loading...")).
        createThen((result: object) => createComponent("div", undefined,
            createComponent("pre", undefined, JSON.stringify(result, null, 8)),
            createComponent("button", {
                on: { click: createEventHandler(() => query.value = makeQuery()) }
            },
            "retry"
        ))).
        createCatch(() => createComponent("div", undefined,
            createComponent("span", undefined, "ohno"),
            createComponent("button", {
                on: { click: createEventHandler(() => query.value = makeQuery()) }
            },
            "retry"
        ))),
    ),
);
app.mount(document.body);
