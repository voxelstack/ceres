$key
====

Renderables inside a :code:`$key` directive will be destroyed and rerendered when the key changes.

.. code:: typescript

    const timer = $store(0);
    setInterval(() => ++timer.value, 1000);

    $key(
        timer,
        $element("span", {}, timer)
    )
    .mount(document.body);
