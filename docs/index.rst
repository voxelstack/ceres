.. ceres documentation master file, created by
   sphinx-quickstart on Thu Oct 23 22:12:18 2025.
   You can adapt this file completely to your liking, but it should at least
   contain the root `toctree` directive.

ceres
=====
.. epigraph::

   Web development for me.

ceres is a UI framework for the web built around observables.

.. ceres:: typescript

   import { $createComponent, $element, $fragment, $format, $store } from "{{ceres_js}}";

   const Greeter = $createComponent<{ greeting: string }>(($props) => {
      const name = $store("you");

      return $fragment(
         $element(
            "div",
            {},
            $element("input", { type: "text", bind: { value: name } }),
            $element(
               "button",
               { on: { click: () => (name.value = "ceres") } },
               "Greet myself"
            )
         ),
         $element("span", {}, $format`${$props.greeting} ${name}!`)
      );
   });

   const app = Greeter({ greeting: "Hey" });
   app.mount(root);

It works by making small changes to the DOM whenever your data changes, and it feels like writing svelte with hyperscript.

.. toctree::
   :caption: Introduction
   :maxdepth: 2

   introduction/rendering
   introduction/literals_and_stores

.. toctree::
   :caption: Directives
   :maxdepth: 2

   directives/if
   directives/each
   directives/key
   directives/await

.. toctree::
   :caption: Special props
   :maxdepth: 2

   special_props/bind
   special_props/use

.. toctree::
   :caption: Styling
   :maxdepth: 2

   styling/inline_styles
   styling/class_name

.. toctree::
   :caption: Special renderables
   :maxdepth: 2

   special_renderables/boundary
   special_renderables/window
   special_renderables/document
   special_renderables/body
   special_renderables/head

.. toctree::
   :caption: Components
   :maxdepth: 2

   components/create_component

.. toctree::
   :caption: App state
   :maxdepth: 2

   app_state/registry

.. toctree::
   :caption: Notes
   :maxdepth: 2

   notes/faq
   notes/todo

.. note:: ceres is a WIP framework I'm writing for fun using some of my free time.
   
   I'm gonna use it. You shouldn't.

Indices and tables
==================

* :ref:`genindex`
