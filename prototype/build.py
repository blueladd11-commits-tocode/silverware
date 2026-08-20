#!/usr/bin/env python3
"""Assemble the core plus every feature module into one self-contained page."""
import pathlib, sys, re
here = pathlib.Path(__file__).parent
core = (here/'index.html').read_text()
mods = sorted((here/'modules').glob('*.js'))
blocks, loaded = [], []
for m in mods:
    src = m.read_text()
    if 'SW.register' not in src:
        print(f'  !! {m.name} never calls SW.register — skipped'); continue
    blocks.append(f'<script>\n/* ==== module: {m.name} ==== */\n{src}\n</script>')
    loaded.append(m.name)
out = core.replace('<!--MODULES-->', '\n'.join(blocks))
(here/'silverware.html').write_text(out)
print(f'built silverware.html  ({len(out):,} bytes)  modules: {len(loaded)}')
for n in loaded: print('   +', n)
if not loaded: print('   (no modules yet — core only)')
