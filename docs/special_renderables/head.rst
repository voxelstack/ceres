$head
=====

The :code:`$head` element lets you add children to the head.

.. code:: typescript

    $head(
        $element("title", {}, "ceres")
    )
    .mount(document.body);
