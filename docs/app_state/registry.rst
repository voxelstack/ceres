$registry
=========

To share state between components you can create a global registry with :code:`$registry`. A registry is a special store that can be manipulated by updating individual keys. From a registry you can get smaller stores that only react to the specified keys.

.. code:: typescript

    const registry = $registry<{ app: { title: string, theme: "light" | "dark" }}>({
        app: {
            title: "home",
            theme: "dark"
        }    
    });

    const theme = registry.derive("app.theme");
    $element("div", {},

        $head($element("title", {}, registry.derive("app.title", (title) => `ceres · ${title}`))),
        $body({
                style: {
                    position: "fixed",
                    top: 0,
                    left: 0,
                    width: "100vw",
                    height: "100vh",
                    backgroundColor: $derive([theme], ([theme]) => theme === "dark" ? "black" : "white"),
                    color: $derive([theme], ([theme]) => theme === "dark" ? "white" : "black"),
                }
            }
        ),
        $element("button", {
            on: {
                click: () => registry.setKey("app.theme", theme.value === "dark" ? "light" : "dark")}
            },
            "Change theme"
        ),
        $element("span", {}, "ceres")
    )
    .mount(document.body);
