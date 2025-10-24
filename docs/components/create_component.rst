$createComponent
================

Pieces of your app can be extracted into reusable components created with the :code:`$createComponent` function. To help differentiate components from normal functions name them using pascal case.

.. code:: typescript

    const Component = $createComponent(() => {
        return $element(
            "div", { style: {
                fontSize: "48px",
                fontWeight: "bolder",
                color: "DarkOliveGreen"
            }},
            "セレス・ファウナ・"
        );
    });

    Component({})
    .mount(document.body);

Props
-----

Components accept custom props that can be accessed using :code:`$props`.

.. code:: typescript

    const Component = $createComponent<{ text: string }>(($props) => {
        return $element("div", { style: {
            fontSize: "48px",
            fontWeight: "bolder",
            color: "DarkOliveGreen"
        }}, $props.text);
    });

    Component({ text: "セレス・ファウナ・" })
    .mount(document.body);

Dynamic props
_____________

By default, *component props are literals* and *not reactive*. If you want a component to react to outside changes to its props you have to wrap the prop type in :code:`$dyn` which turns it into a reactive store. When accessing :code:`$dyn` props from inside a component, they get turned into a readonly store and *cannot be changed*.

.. code:: typescript

    const name = $store("セレス・ファウナ・");
    setTimeout(() => name.value = "LemonLeaf", 1000);

    const Component = $createComponent<{ text: $dyn<string> }>(($props) => {
        // Error: A component cannot change a $dyn prop.
        // $props.text.value = "Ceres Fauna";

        return $element("div", { style: {
            fontSize: "48px",
            fontWeight: "bolder",
            color: "DarkOliveGreen"
        }}, $props.text);
    });

    Component({ text: name })
    .mount(document.body);

Bound props
___________

If your component must be able to update the value of the store, replace :code:`$dyn` with :code:`$bind`. Use this carefully.

.. code:: typescript

    const name = $store("セレス・ファウナ・");
    name.subscribe(console.log);

    const FancyInput = $createComponent<{ text: $bind<string> }>(($props) => {
        return $element("input", {
                bind: { value: $props.text },
                style: {
                    fontSize: "48px",
                    fontWeight: "bolder",
                    color: "DarkOliveGreen"
                }
            }, $props.text
        );
    });

    FancyInput({ text: name })
    .mount(document.body);

Effects
-------

Effects let you attach reactive logic to your components. They are created using :code:`$effect` and will run a callback when the component is mounted. If you return a cleanup function from an effect, it will be ran when the component unmounts.

.. code:: typescript

    const Scroller = $createComponent<{ text: string }>(($props, $effect) => {
        const text = $store($props.text);

        function scroll(str: string) {
            return `${str.slice(1)}${str.slice(0, 1)}`;
        }

        $effect(() => {
            const handle = setInterval(() => text.value = scroll(text.value), 500);
            return () => clearInterval(handle);
        });

        return $element("div", { style: {
            fontSize: "48px",
            fontWeight: "bolder",
            color: "DarkOliveGreen"
        }}, text);
    });

    Scroller({ text: "セレス・ファウナ・" })
    .mount(document.body);

If you pass a list of stores to an effect, it will run the callback whenever one of the stored values change. The new and previous values are passed as parameters to the callback. When an effect is watching a list of stores, the cleanup function will run *every time before the effect reruns*.

.. code:: typescript

    const Scroller = $createComponent<{ text: string, speed: $dyn<number>}>(($props, $effect) => {
        const { speed } = $props;
        const text = $store($props.text);

        function scroll(str: string) {
            return `${str.slice(1)}${str.slice(0, 1)}`;
        }

        $effect(([speed]) => {
            const handle = setInterval(() => text.value = scroll(text.value), speed);
            return () => clearInterval(handle);
        }, [speed]);

        return $element("div", { style: { fontSize: "48px", fontWeight: "bolder" } }, text);
    });

    const speed = $store(100);
    $fragment(
        $element("input", { type: "number", bind: { value: $transform("integer", speed) }}),
        Scroller({ text: "セレス・ファウナ・", speed })
    )
    .mount(document.body);

