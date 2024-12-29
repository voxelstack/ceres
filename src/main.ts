import { $transform } from "./lib/bind";
import { $body, $boundary, $element, $document, $fragment, $head, $window, $createComponent, $dyn } from "./lib/component";
import { $await, $each, $if } from "./lib/directive";
import { $handler } from "./lib/event";
import { $text, $format } from "./lib/reactive_string";
import { $derive, $store } from "./lib/store";

const en = $store("Ceres・Fauna・");
const jp = $store("セレス・ファウナ・");
const count = $store(0);
const upper = $derive([en], ([e]) => e.toUpperCase());
const double = $derive([count], ([c]) => 2 * c);
const color = $derive([count], ([c]) => ["darkgreen", "darkolivegreen", "darkkhaki"][c % 3]);
const dir = $store(1);

function scroll(str: string) {
    return `${str.slice(dir.value)}${str.slice(0, dir.value)}`;
}

setInterval(() => en.value = scroll(en.value), 500);
setInterval(() => jp.value = scroll(jp.value), 500);
setInterval(() => ++count.value, 500);

const gen = $store(1);
setInterval(() => gen.value = ++gen.value % 5, 2000);

const us = $store(["saplings", "takos", "sanalites", "otomos"]);

const checked = $store(true);
checked.watch(console.log);
const mapped = $store("enabled");
mapped.watch(console.log);
const text = $store("hehehe");
text.watch(console.log);
const numeric = $store(20);
numeric.watch(console.log);

const options = [
    { value: "watson_amelia", label: "Watson Amelia" },
    { value: "gawr_gura", label: "Gawr Gura" },
    { value: "ceres_fauna", label: "Ceres Fauna" },
    { value: "grimmy", label: "Grimmy" },
    { value: "koseki_bijou", label: "Koseki Bijou" },
];
const selected = $store(options[2].value);
selected.watch(console.log);
const multiple = $store([options[2].value, options[3].value])
multiple.watch(console.log);

const groups = ["a", "b", "c", "d", "e", "f", "g"];
const radio = $store("a");
radio.watch(console.log);
const checkboxes = $store(["b", "c"]);
checkboxes.watch(console.log);

const w = $store(32);
w.watch(console.log);

const online = $store(window.navigator.onLine);
online.subscribe((online) => console.log(online ?
      "Phew! Back online."
    : "OHNO! Connection lost."
));

const devicePixelRatio = $store(window.devicePixelRatio);
devicePixelRatio.watch(console.log);

function makeQuery() {
    return fetch("https://imissfauna.com/api/v2/past_stream").then((res) => res.json());
}
const query = $store(makeQuery());

const v = $store<HTMLVideoElement | null>(null);
const title = $derive([selected], ([s]) => options.find(({ value }) => value === s)?.label);

const fullscreenElement = $store<Element | null>(null);
fullscreenElement.watch(console.log);

interface ScrollerProps {
    text: string;
    speed: $dyn<number>;
}
const Scroller = $createComponent<ScrollerProps>(($props, $effect) => {
    const { speed } = $props;
    const text = $store($props.text);

    $effect(() => {
        const handle = setInterval(() => text.value = scroll(text.value), speed.value);
        return () => clearInterval(handle);
    }, [speed]);

    return $element("div", { style: { fontSize: "48px", fontWeight: "bolder" } }, text);
});

const EditableScroller = $createComponent<ScrollerProps>(($props) => {
    const { text, speed } = $props;

    return $fragment(
        $element("input", { type: "number", bind: { value: $transform("integer", speed) }}),
        Scroller({ text, speed })
    );
});

const app = $element("div", { id: $format`colored-${color}`, style: { color } },
    $window({
        on: { keydown: $handler(({ key }) => key === "f" && console.log("hehehe"))},
        bind: { online, devicePixelRatio }
    }),
    $document({
        bind: { fullscreenElement }
    }),
    $body({
        on: { mouseleave: $handler(() => console.log("Nooooo don't leave me!!!")) }
    }),
    $head($element("title", undefined, title)),

    EditableScroller({ text: "セレス・ファウナ・", speed: $store(100) }),

    $element("video", { bind: { this: v } }),
    $element("button", { on: { click: $handler(() => v.value?.requestFullscreen())}}, "fullscreen"),

    $element("input", {
        type: "checkbox",
        bind: { checked },
        use: { mount: console.log }
    }),
    $element("input", {
        type: "checkbox",
        bind: {
            checked: {
                store: mapped, 
                toBind: (dom) => dom ? "enabled" : "disabled",
                fromBind: (bind) => bind === "enabled"
            }
        }
    }),
    $element("input", {
        type: "text",
        bind: { value: text }
    }),
    $element("input", {
        type: "number",
        bind: { value: $transform("integer", numeric) }
    }),
    $element("input", {
        type: "range",
        min: 0,
        max: 100,
        step: 20,
        bind: { value: $transform("integer", numeric) }
    }),

    $element("select", { bind: { value: selected }}, $each(
        options,
        ({ label, value }) => $element("option", { value }, label)
    )),
    $element("select", { multiple: true, bind: { value: $transform("multiselect", multiple) }},
        $each(
            options,
            ({ label, value }) => $element("option", { value }, label)
        )
    ),

    $element("fieldset", undefined, $each(
        groups,
        (entry) => $fragment(
            $element("label", { htmlFor: entry }, entry),
            $element("input", { id: entry, value: entry, type: "checkbox", bind: { checked: $transform("checkGroup", checkboxes) } }),
        )
    )),
    $element("fieldset", undefined, $each(
        groups,
        (entry) => $fragment(
            $element("label", { htmlFor: entry }, entry),
            $element("input", { id: entry, value: entry, type: "radio", bind: { checked: $transform("radioGroup", radio) }}),
        )
    )),

    $boundary(
        $element("span", undefined, "oh noes, something blew up"),

        $element("span", { use: { explode: () => { throw new Error("kaboom"); }}})
    ),

    $element("span", {
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

    $element("h1", {
        className: $format`${color}`,
    }, en),
    $element("h1", {
        className: multiple,
    }, upper),
    $element("h1", {
        className: $derive([multiple], ([m]) => {
            return Object.fromEntries(options.map(({ value })=> [
                value, m.includes(value)
            ]))
        }),
    }, jp),

    $element("div", undefined, $format`ticks: ${count}`),
    $element("div", undefined, $format`double: ${double}`),

    $element("span", undefined, double),

    $element("div", undefined,
        $element("span", undefined, $derive(
            [dir], ([d]) => d > 0 ? "left" : "right"
        )),
        $element("button", {
            on: {click: $handler(() => dir.value *= -1)}
        }, "flip"),
    ),

    $if($derive([gen], ([g]) => g === 1), $element("span", undefined, "ame")).
    $elseif($derive([gen], ([g]) => g === 2), $element("span", undefined, "sana")).
    $elseif($derive([gen], ([g]) => g === 3), $element("span", undefined, "fwmc")).
    $elseif($derive([gen], ([g]) => g === 4), $element("span", undefined, "cc")).
    $else($element("span", undefined, "soon")),

    $element("div", undefined,
        $each(
            us,
            (name) => $element("span", {
                use: {
                    mount: (node) => {
                        console.log("mount", node);
                        return () => console.log("unmount", node);
                    }
                },
                style: { display: "block", color: "red" }
            }, name)
        ),
        $element("button", { on: { click: $handler(() => us.value = us.value.toSorted())}}, "???"),
        $element("button", { on: { click: $handler(() => {
            const victim = us.value[Math.floor(Math.random() * us.value.length)];
            us.value = us.value.filter((value) => value !== victim);
        })}}, "---"),
    ),

    $text($format`${color}`),

    $element("div", undefined,
        $await(query, $element("span", undefined, "Loading...")).
        $then((result: object) => $element("div", undefined,
            $element("pre", undefined, JSON.stringify(result, null, 8)),
            $element("button", {
                on: { click: $handler(() => query.value = makeQuery()) }
            },
            "retry"
        ))).
        $catch(() => $element("div", undefined,
            $element("span", undefined, "ohno"),
            $element("button", {
                on: { click: $handler(() => query.value = makeQuery()) }
            },
            "retry"
        ))),
    ),
);
app.mount(document.body);
