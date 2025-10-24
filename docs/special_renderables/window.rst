$window
=======

The :code:`$window` element lets you add event listeners or binds to the window.

.. code:: typescript

    const online = $store(window.navigator.onLine);
    online.subscribe((next) => {
        console.log(next ? "Phew! Back online." : "Oh no! Connection lost...");
    });

    $window({
        on: { keydown: ({ key }) => key === "f" && console.log(":(") },
        bind: { online }
    })
    .mount(document.body);

The available binds are:
- :code:`innerWidth`
- :code:`innerHeight`
- :code:`scrollX`
- :code:`scrollY`
- :code:`online`
- :code:`devicePixelRatio`

All are readonly, except for :code:`scrollX` and :code:`scrollY`.
