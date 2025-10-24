$document
=========

The :code:`$document` element lets you add styles, event listeners or binds to the document.

.. code:: typescript

    const video = $store<HTMLIFrameElement | null>(null);
    const fullscreenElement = $store<Element | null>(null);
    fullscreenElement.subscribe(console.log);

    $fragment(
        $document({
            bind: { fullscreenElement }
        }),
        
        $element("iframe", {
            width: 1128,
            height: 635,
            src: "https://www.youtube.com/embed/4NYsqm2E41k",
            title: "oh",
            frameBorder: 0,
            allow: "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share",
            referrerPolicy: "strict-origin-when-cross-origin",
            allowFullscreen: true,

            bind: { this: video }
        }),
        $element("button", { on: { click: () => video.value?.requestFullscreen()}}, "Fullscreen"),
    )
    .mount(document.body);

You can bind to:
- :code:`activeElement`
- :code:`fullscreenElement`
- :code:`pointerLockElement`
- :code:`visibilityState`

They are all readonly.
