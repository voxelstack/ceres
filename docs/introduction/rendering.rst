Rendering
=========

Rendering elements with ceres is very similar to hyperscript.

Elements
--------
Calling :code:`$element` describes a renderable that can be mounted onto the DOM.
The simplest renderable only takes the name of the tag that will be created:

.. code:: typescript

    $element("div")
    .mount(document.body);

Props
-----

Attributes can be set by passing an object as the second argument of :code:`$element`.

.. code:: typescript

    $element("input", { type: "text" })
    .mount(document.body);

Children
--------

Any arguments passed after the props will be rendered as children of the created element.

.. code:: typescript

    $element("div", {},
        $element("ul", {},
            $element("li", {}, "ceres"),
            $element("li", {}, "watson"),
            $element("li", {}, "ouro")
        )
    )
    .mount(document.body);

Fragments
_________

To render multiple children as siblings, use a :code:`$fragment`.

.. code:: typescript

    $fragment(
        $element("span", {}, "ceres"),
        $element("span", {}, "watson"),
        $element("span", {}, "ouro")
    )
    .mount(document.body);

Events
------

The :code:`on` prop lets you attach event listeners. Just pass the handler to the corresponding property.

.. code:: typescript

    const time = $store(0);

    $element(
        "button", {
            on: {
                mousedown: () => time.value = Date.now(),
                mouseup: () => {
                    if (Date.now() - time.value === 35) {
                        alert("Stanley was happy");
                    }
                }
            }
        }, "Press me for 35ms"
    )
    .mount(document.body);

Configured listeners
____________________

To customize the event listener, wrap it in a :code:`$handler`.

.. code:: typescript

    $element(
        "button", {
            on: {
                click: $handler(() => alert("Congratulations, you destroyed everything."), { once: true })
            }
        }, "SCP-001-J"
    )
    .mount(document.body);
