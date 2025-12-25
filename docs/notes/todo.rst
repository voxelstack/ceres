TODO
====

.. todo:: The elephant in the room

    Take this example:

    .. code:: typescript

        const stores = [$store(0), $store(0), $store(0), $store(0), $store(0), $store(0)];
        const val = $derive(stores, ([a, b, c, d, e, f]) => a + b + c + d + e + f);

        stores.forEach((store) => ++store.value);

        $element("span", {}, val)
        .mount(document.body);

    It renders a 6, which is correct. But every time the loop runs it changes the DOM, just to overwrite that change immediately in the next iteration. We only care about the result at the end of the loop, so this wastes 5 DOM updates. *That is bad, and I am aware*.

    The fix is to not update the DOM immediately when a store changes. Instead we schedule a DOM change to run on the next microtask, and if that change gets overwitten before the current task finishes, update the scheduled change instead of scheduling a new one.

    This is coming soon.
