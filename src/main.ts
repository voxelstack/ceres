import { render, createRenderable, format } from "./lib/render";
import { Store } from "./lib/store";

const en = new Store("Ceres・Fauna・");
const jp = new Store("セレス・ファウナ・");
const count = new Store(0);

function scroll(str: string) {
    return `${str.slice(-1)}${str.slice(0, -1)}`;
}

setInterval(() => en.value = scroll(en.value), 500);
setInterval(() => jp.value = scroll(jp.value), 500);
setInterval(() => ++count.value, 500);

render(
    createRenderable("div", undefined,
        createRenderable("h1", undefined, en),
        createRenderable("h1", undefined, jp),
        createRenderable("span", undefined, format`ticks: ${count}`)
    ),
    document.body
);
