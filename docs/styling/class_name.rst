Classes
=======

To assign classes to an element, pass a literal or a store to :code:`className:`.

.. code:: typescript

    const colors = ["red", "green", "blue"];
    const timer = $store(0);
    const className = timer.derive((t) => colors[t % colors.length]);
    setInterval(() => ++timer.value, 500);

    $element("span", { className })
    .mount(document.body);

You can use an array of classes to apply all classes that are on the array.

.. code:: typescript

    const colors = ["red", "green", "blue"];
    const timer = $store(0);
    const className = timer.derive((t) => (["circle", colors[t % colors.length]]));
    setInterval(() => ++timer.value, 500);

    $element("span", { className })
    .mount(document.body);

Or an object to apply all classes that are truthy.

.. code:: typescript

    const colors = ["red", "green", "blue"];
    const timer = $store(0);
    const className = timer.derive((t) => ({
        "square": t % 2 !== 0,
        "circle": t % 2 === 0,
    }));
    setInterval(() => ++timer.value, 500);

    $element("span", { className })
    .mount(document.body);
