Rendering
=========

Rendering elements with ceres is very similar to hyperscript.

Elements
--------
Calling :code:`$element` describes a renderable that can be mounted onto the DOM.
The simplest renderable only takes the name of the tag that will be created:

.. ceres:: typescript

    import { $element } from "{{ceres_js}}";

    $element("div")
    .mount(root);

Props
-----

Attributes can be set by passing an object as the second argument of :code:`$element`.

.. ceres:: typescript

    import { $element } from "{{ceres_js}}";

    $element("input", { type: "text" })
    .mount(root);

Children
--------

The children of an element can be either a single string:

.. code:: ceres

    import { $element } from "{{ceres_js}}";

    $element("div", {}, "ceres")
    .mount(root)

Or multiple elements:

.. ceres:: typescript

    import { $element } from "{{ceres_js}}";

    $element("div", {}, [
        $element("ul", {}, [
            $element("li", {}, "ceres"),
            $element("li", {}, "watson"),
            $element("li", {}, "ouro")
        ])
    ])
    .mount(root);

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
