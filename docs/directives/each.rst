$each
=====

The :code:`$each` directive takes an array of and renders a something for each of its elements.

.. code:: typescript

    const tubers = [
        { label: "Ceres Fauna", value: "ceres_fauna" },
        { label: "Gawr Gura", value: "gawr_gura" },
        { label: "Mori Calliope", value: "mori_calliope" },
        { label: "Ouro Kronii", value: "ouro_kronii" },
    ];

    $element("select", {},
        $each(tubers, ({ label, value }) => $element("option", { value }, label))
    )
    .mount(document.body);

You can use the returned value to chain a call to :code:`$else`. The else directive gets rendered if the array is empty.

.. code:: typescript

    const tubers = [];

    $element("select", {},
        $each(tubers, ({ label, value }) => $element("option", { value }, label)).
        $else($element("option", {}, "Touch grass"))
    )
    .mount(document.body);

