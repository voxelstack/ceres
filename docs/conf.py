# Configuration file for the Sphinx documentation builder.
#
# For the full list of built-in configuration values, see the documentation:
# https://www.sphinx-doc.org/en/master/usage/configuration.html

import os
import pathlib
import shutil
import sys

# -- Environment  ------------------------------------------------------------
read_the_docs_build = os.environ.get('READTHEDOCS', None) == 'True'

# -- Extensions --------------------------------------------------------------

sys.path.append(str(pathlib.Path('_ext').resolve()))

extensions = ['sphinx.ext.todo', 'ceres']

todo_include_todos = True

# -- Project information -----------------------------------------------------
# https://www.sphinx-doc.org/en/master/usage/configuration.html#project-information

project = 'ceres'
copyright = '2025, voxelstack'
author = 'voxelstack'
release = '0.2.0'

# -- General configuration ---------------------------------------------------
# https://www.sphinx-doc.org/en/master/usage/configuration.html#general-configuration

templates_path = ['_templates']
exclude_patterns = ['_build', 'Thumbs.db', '.DS_Store']

# -- Scripts -----------------------------------------------------------------

# -- Duplicated at _ext/ceres.py ---------------------------------------------
# -- TODO Deduplicate --------------------------------------------------------

ceres_js = 'https://unpkg.com/@voxelstack/ceres@latest/dist/index.js'
if not read_the_docs_build:
    shutil.copyfile("../dist/web/ceres.js", "./_static/js/ceres.js")
    ceres_js = '/_static/js/ceres.js'

# -- Options for HTML output -------------------------------------------------
# https://www.sphinx-doc.org/en/master/usage/configuration.html#options-for-html-output

html_theme = 'sphinx_rtd_theme'
html_static_path = ['_static']
html_js_files = [(ceres_js, { 'type': 'module', 'defer': 'defer' })]
html_css_files = ['css/ceres.css']
html_favicon = "favicon.ico"
