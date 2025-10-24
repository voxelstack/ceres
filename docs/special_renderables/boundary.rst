$boundary
=========

A :code:`$boundary` tries to render all of its children but if an error happens it will render a fallback instead. Boundaries keep errors contained and prevent them from breaking the entire app.

.. code:: typescript

    $fragment(
        $element("span", {}, "Still working... Still working... Mmm..."),
        $boundary(
            $element("span", {}, "Oh noes, something went wrong >.<"),

            $element("span", { use: {
                explode: () => { throw new Error("kaboom!"); }
            }}),
            $element("span", {}, "This wasn't my fault ;-;")
        )
    )
    .mount(document.body);
