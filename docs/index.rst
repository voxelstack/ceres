.. ceres documentation master file, created by
   sphinx-quickstart on Thu Oct 23 22:12:18 2025.
   You can adapt this file completely to your liking, but it should at least
   contain the root `toctree` directive.

ceres
=====
.. epigraph::

   Web development for me.

ceres is a UI framework for the web built around observables.

It works by making small changes to the DOM whenever your data changes, and it feels like writing svelte with hyperscript.

.. raw:: html

   <p class="codepen" data-height="300" data-theme-id="light" data-default-tab="js" data-slug-hash="Ggodmgd" data-pen-title="Hey you!" data-editable="true" data-user="voxelstack" style="height: 300px; box-sizing: border-box; display: flex; align-items: center; justify-content: center; border: 2px solid; margin: 1em 0; padding: 1em;">
      <span>See the Pen <a href="https://codepen.io/voxelstack/pen/Ggodmgd">
  Hey you!</a> by voxelstack (<a href="https://codepen.io/voxelstack">@voxelstack</a>)
  on <a href="https://codepen.io">CodePen</a>.</span>
      </p>
      <script async src="https://public.codepenassets.com/embed/index.js"></script>

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
