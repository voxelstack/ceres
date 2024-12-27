import { $transform } from "./lib/bind";
import { $component, $fragment } from "./lib/component";
import { $await, $each, $if } from "./lib/directive";
import { $handler } from "./lib/event";
import { $text, $format } from "./lib/reactive_string";
import { $derived, $state } from "./lib/store";

const en = $state("Ceres・Fauna・");
const jp = $state("セレス・ファウナ・");
const count = $state(0);
const upper = $derived([en], ([e]) => e.toUpperCase());
const double = $derived([count], ([c]) => 2 * c);
const color = $derived([count], ([c]) => ["darkgreen", "darkolivegreen", "darkkhaki"][c % 3]);
const dir = $state(1);

function scroll(str: string) {
    return `${str.slice(dir.value)}${str.slice(0, dir.value)}`;
}

setInterval(() => en.value = scroll(en.value), 500);
setInterval(() => jp.value = scroll(jp.value), 500);
setInterval(() => ++count.value, 500);

const gen = $state(1);
setInterval(() => gen.value = ++gen.value % 5, 2000);

const us = $state(["saplings", "takos", "sanalites", "otomos"]);

const checked = $state(true);
checked.watch(console.log);
const mapped = $state("enabled");
mapped.watch(console.log);
const text = $state("hehehe");
text.watch(console.log);
const numeric = $state(20);
numeric.watch(console.log);

const options = [
    { value: "watson_amelia", label: "Watson Amelia" },
    { value: "gawr_gura", label: "Gawr Gura" },
    { value: "ceres_fauna", label: "Ceres Fauna" },
    { value: "grimmy", label: "Grimmy" },
    { value: "koseki_bijou", label: "Koseki Bijou" },
];
const selected = $state(options[2].value);
selected.watch(console.log);
const multiple = $state([options[2].value, options[3].value])
multiple.watch(console.log);

const groups = ["a", "b", "c", "d", "e", "f", "g"];
const radio = $state("a");
radio.watch(console.log);
const checkboxes = $state(["b", "c"]);
checkboxes.watch(console.log);

const w = $state(32);
w.watch(console.log);

function makeQuery() {
    return fetch("https://imissfauna.com/api/v2/past_stream").then((res) => res.json());
}
const query = $state(makeQuery());

const app = $component("div", { id: $format`colored-${color}`, style: { color } },
    $component("input", {
        type: "checkbox",
        bind: { checked }
    }),
    $component("input", {
        type: "checkbox",
        bind: {
            checked: {
                store: mapped, 
                toBind: (dom) => dom ? "enabled" : "disabled",
                toDom: (bind) => bind === "enabled"
            }
        }
    }),
    $component("input", {
        type: "text",
        bind: { value: text }
    }),
    $component("input", {
        type: "number",
        bind: { value: $transform(numeric, "integer") }
    }),
    $component("input", {
        type: "range",
        min: 0,
        max: 100,
        step: 20,
        bind: { value: $transform(numeric, "integer") }
    }),

    $component("select", { bind: { value: selected }}, $each(
        options,
        ({ label, value }) => $component("option", { value }, label)
    )),
    $component("select", { multiple: true, bind: { value: $transform(multiple, "multiselect") }},
        $each(
            options,
            ({ label, value }) => $component("option", { value }, label)
        )
    ),

    $component("fieldset", undefined, $each(
        groups,
        (entry) => $fragment(
            $component("label", { htmlFor: entry }, entry),
            $component("input", { id: entry, value: entry, type: "checkbox", bind: { checked: $transform(checkboxes, "checkGroup") } }),
        )
    )),
    $component("fieldset", undefined, $each(
        groups,
        (entry) => $fragment(
            $component("label", { htmlFor: entry }, entry),
            $component("input", { id: entry, value: entry, type: "radio", bind: { checked: $transform(radio, "radioGroup") } }),
        )
    )),

    $component("span", {
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

    $component("h1", {
        className: $format`${color}`,
    }, en),
    $component("h1", {
        className: multiple,
    }, upper),
    $component("h1", {
        className: $derived([multiple], ([m]) => {
            return Object.fromEntries(options.map(({ value })=> [
                value, m.includes(value)
            ]))
        })
    }, jp),

    $component("div", undefined, $format`ticks: ${count}`),
    $component("div", undefined, $format`double: ${double}`),

    $component("span", undefined, double),

    $component("div", undefined,
        $component("span", undefined, $derived(
            [dir], ([d]) => d > 0 ? "left" : "right"
        )),
        $component("button", {
            on: {click: $handler(() => dir.value *= -1)}
        }, "flip"),
    ),

    $if($derived([gen], ([g]) => g === 1), $component("span", undefined, "ame")).
    $elseif($derived([gen], ([g]) => g === 2), $component("span", undefined, "sana")).
    $elseif($derived([gen], ([g]) => g === 3), $component("span", undefined, "fwmc")).
    $elseif($derived([gen], ([g]) => g === 4), $component("span", undefined, "cc")).
    $else($component("span", undefined, "soon")),

    $component("div", undefined,
        $each(
            us,
            (name) => $component("span", {
                use: {
                    mount: (node) => {
                        console.log("mount", node);
                        return () => console.log("unmount", node);
                    }
                },
                style: { display: "block", color: "red" }
            }, name)
        ),
        $component("button", { on: { click: $handler(() => us.value = us.value.toSorted())}}, "???"),
        $component("button", { on: { click: $handler(() => {
            const victim = us.value[Math.floor(Math.random() * us.value.length)];
            us.value = us.value.filter((value) => value !== victim);
        })}}, "---"),
    ),

    $text($format`${color}`),

    $component("div", undefined,
        $await(query, $component("span", undefined, "Loading...")).
        $then((result: object) => $component("div", undefined,
            $component("pre", undefined, JSON.stringify(result, null, 8)),
            $component("button", {
                on: { click: $handler(() => query.value = makeQuery()) }
            },
            "retry"
        ))).
        $catch(() => $component("div", undefined,
            $component("span", undefined, "ohno"),
            $component("button", {
                on: { click: $handler(() => query.value = makeQuery()) }
            },
            "retry"
        ))),
    ),
);
app.mount(document.body);
