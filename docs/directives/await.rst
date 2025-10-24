$await
======

With the :code:`$await` directive you can choose what to render based on the current state of a Promise.

.. code:: typescript

    const query = fetch("https://example.org/products.json").then((res) => res.json());

    $await(query, $element("span", {}, "Loading...")).
    $then((result: object) => $element("pre", {}, JSON.stringify(result, null, 8))).
    $catch(() => $element("span", {}, "ohno"))
    .mount(document.body);

Every renderable is optional, so you can omit any states you don't care about.

.. code:: typescript

    const query = fetch("https://example.org/products.json").then((res) => res.json());

    $await(query).
    $catch(() => $element("span", {}, "I knew it wouldn't work"))
    .mount(document.body);

The promise can be a store which makes it really easy to retry a failed promise.

.. code:: typescript

    const makeQuery = () => fetch("https://example.org/products.json").then((res) => res.json());
    const query = $store(makeQuery());

    $await(query, $element("span", {}, "Loading...")).
    $then((result: object) => $element("pre", {}, JSON.stringify(result, null, 8))).
    $catch(() => $element("button", { on: { click: () => query.value = makeQuery() } }, "Retry"))
    .mount(document.body);
