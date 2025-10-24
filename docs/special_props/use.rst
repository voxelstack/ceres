use:
====

To execute some code when a renderable gets mounted to the DOM, attach a function with the :code:`use` prop. If you return a function, it will get called when the element unmounts.

.. code:: typescript

    const age = $store(0);
    age.subscribe(console.log);

    $element("span", { use: { age: () => {
        const handle = setInterval(() => ++age.value, 1000);

        return () => clearInterval(handle);
    }}}, "oh hi")
    .mount(document.body);
