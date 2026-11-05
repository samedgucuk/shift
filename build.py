#!/usr/bin/env python3
"""Build the standalone game using the Python standard library only."""
from pathlib import Path
import shutil
ROOT=Path(__file__).resolve().parent
SRC=ROOT/'src'
html=(SRC/'index.template.html').read_text(encoding='utf-8')
for marker,filename in [('STYLE','style.css'),('ENGINE','engine.js'),('WORLD','world.js'),('AUDIO','audio.js'),('GAME','game.js')]:
    text=(SRC/filename).read_text(encoding='utf-8')
    if '</script' in text.lower() and filename.endswith('.js'):
        raise ValueError(f'Unsafe closing script tag in {filename}')
    html=html.replace(f'/*__{marker}__*/',text)
(ROOT/'dist').mkdir(exist_ok=True)
(ROOT/'dist'/'index.html').write_text(html,encoding='utf-8')
(ROOT/'index.html').write_text(html,encoding='utf-8')
print(f'Built standalone HTML: {len(html.encode("utf-8")):,} bytes')
