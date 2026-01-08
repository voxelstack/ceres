[![npm](https://github.com/voxelstack/ceres/actions/workflows/npm.yml/badge.svg)](https://www.npmjs.com/package/@voxelstack/ceres)
[![Documentation Status](https://readthedocs.org/projects/voxelstackceres/badge/?version=latest)](https://voxelstackceres.readthedocs.io/en/latest/)
[![Coverage Status](https://coveralls.io/repos/github/voxelstack/ceres/badge.svg?branch=rewrite)](https://coveralls.io/github/voxelstack/ceres?branch=rewrite)

# ceres

> The only difference between ceres and svelte is press coverage[^1][^2][^3][^4][^5][^6][^7].
>
> &mdash; Panic! At The Disco[^8][^9]

ceres is a UI framework for the web built around observables.
It works by making small changes to the DOM whenever your data changes, and it feels like writing svelte with hyperscript.

```typescript
const Greeter = $createComponent<{ greeting: string }>(($props) => {
    const name = $store("there");

    return $element(
        "div",
        {},
        $element("input", { type: "text", bind: { value: name } }),
        $element(
            "button",
            { on: { click: () => (name.value = "ceres") } },
            "Greet myself",
        ),
        $element("span", {}, $format`${$props.greeting} ${name}!`),
    );
});

const app = Greeter({ greeting: "Hey" });
app.mount(document.body);
```

[Read the docs](https://voxelstackceres.readthedocs.io/en/latest/) and try it out.

[^1]: And that svelte is nicer to use<sup>[citation needed]</sup>.

[^2]: And production ready<sup>[citation needed]</sup>.

[^3]: And wasn't thrown together in a couple of days just for fun<sup>[citation needed]</sup>.

[^4]: And is faster<sup>[citation needed]</sup>.

[^5]: And has a compiler.

[^6]: And has an active community (at the time of writing, you know how it goes with JS).

[^7]: Both have the huge advantage of not being React though.

[^8]: Paraphrased. Maybe.

[^9]: https://music.youtube.com/watch?v=vtEvxD0ZiWs&si=nrr_u9OJUunImGdM
