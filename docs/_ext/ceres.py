from __future__ import annotations

from ctypes import c_uint64

from docutils import nodes

from sphinx.application import Sphinx
from sphinx.directives.code import CodeBlock
from sphinx.util.typing import ExtensionMetadata

import os
import subprocess

class CeresDirective(CodeBlock):
    def run(self) -> list[nodes.Node]:
        raw_content = list(self.content)

        # Imports are not relevant to examples and can be omitted.
        self.content = [
            l 
            for l in self.content
            if not l.lstrip().startswith("import")
        ]
        while self.content[0] == "":
            self.content = self.content[1:]

        emphasize_lines = self.options.get('emphasize-lines', None)
        if emphasize_lines is not None:
            removed_lines = len(raw_content) - len(self.content)
            self.options.update({ 'emphasize-lines': ",".join([
                str(l - removed_lines)
                for l in map(int, self.options['emphasize-lines'].split(","))
            ])})

        [highlight] = super().run()
        highlight['classes'] += ['ceres-snippet']

        print("why")
        print('\n'.join(raw_content))
        source_ts = '\n'.join(raw_content).replace("{{ceres_js}}", ceres_js)
        source_id = uid(source_ts)

        try:
            # Type erasing *should* be enough.
            # But I'm sure I won't resist having a full blown TS project.
            source_js = ts_blank_space(source_ts)
        except Exception as e:
            self.reporter.error(
                f'Error in {self.name} directive: ts_blank_space failed: {e}'
            )
        

        tag = f'''
<script type="module">
const root = document.getElementById("{source_id}");

{source_js}
</script>
'''
        script = nodes.raw('', tag, format='html')

        viewer = nodes.container('', classes=["ceres-viewer"], ids=[source_id])

        return [highlight, viewer, script]


def setup(app: Sphinx) -> ExtensionMetadata:
    app.add_directive('ceres', CeresDirective)

    return {
        'version': '0.1',
        'parallel_read_safe': True,
        'parallel_write_safe': True,
    }

def uid(source: str):
    id = hash(source)
    unsigned_id = c_uint64(id).value
    hex_id = unsigned_id.to_bytes(8).hex()
    
    return hex_id

def ts_blank_space(source: str):
    run = subprocess.run(
        ["node", "./tsBlankSpace.js"],
        input=source,
        capture_output=True,
        text=True
    )

    if run.returncode != 0:
        raise Exception(run.stderr)
        
    return run.stdout

# Duplicated from conf.py
# TODO Deduplicate.

read_the_docs_build = os.environ.get('READTHEDOCS', None) == 'True'
ceres_js = 'https://unpkg.com/@voxelstack/ceres@latest/dist/index.js'
if not read_the_docs_build:
    ceres_js = '/_static/js/ceres.js'
