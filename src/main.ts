import { render, createRenderable } from "./lib/render";
import { Store } from "./lib/store";

const en = new Store("Ceres・Fauna・");
const jp = new Store("セレス・ファウナ・");

function scroll(str: string) {
    return `${str.slice(-1)}${str.slice(0, -1)}`;
}

setInterval(() => en.value = scroll(en.value), 500)
setInterval(() => jp.value = scroll(jp.value), 500)

render(
    createRenderable("div", undefined,
        createRenderable("h1", undefined, en),
        createRenderable("h1", undefined, jp),
    ),
    document.body
);
