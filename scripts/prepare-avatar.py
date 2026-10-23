"""Adapt Photo Mode SVG exports; does not bundle the Avatar Lab runtime."""
from pathlib import Path
import xml.etree.ElementTree as E
ROOT=Path(__file__).resolve().parent.parent
NS='{http://www.w3.org/2000/svg}'
E.register_namespace('',NS[1:-1])
for state in ['neutral','happy','thinking']:
    tree=E.parse(ROOT/f'docs/avatar-source/nilo-{state}.svg')
    root=tree.getroot()
    root.attrib.update({'viewBox':'-185 -185 370 370','width':'120','height':'120','aria-hidden':'true'})
    root.attrib.pop('role',None);root.attrib.pop('aria-label',None)
    for el in root.iter():
        if el.get('clip-path')=='url(#snapshot-frame-clip)':el.attrib.pop('clip-path')
        if el.get('clip-path')=='url(#snapshot-head-clip)':
            el.set('class','avatar-eyes')
            for eye in el.findall(NS+'path'):eye.set('class','avatar-eye')
    defs=root.find(NS+'defs')
    gradient=E.SubElement(defs,NS+'linearGradient',{'id':'niloBody','x1':'0','y1':'0','x2':'.85','y2':'1'})
    for offset,color in [('0','#dcff88'),('.45','#c7ff3d'),('1','#82b71b')]:
        E.SubElement(gradient,NS+'stop',{'offset':offset,'stop-color':color})
    for el in root.iter(NS+'path'):
        if el.get('fill')=='#c7ff3d':el.set('fill','url(#niloBody)')
    tree.write(ROOT/f'dist/assets/nilo-{state}.svg',encoding='unicode')

# New cabinet members: original Photo Mode poses, with Meridiano tonal shading.
PALETTES = {
    'lia': ('#ff8a58', ['#ffcaac', '#ff8a58', '#c95832']),
    'caio': ('#79d8cb', ['#c3f4e8', '#79d8cb', '#369b95']),
    'iara': ('#b6a0ef', ['#e1d5ff', '#b6a0ef', '#7b62b4']),
}
for character, (base, colors) in PALETTES.items():
    for state in ['neutral', 'happy', 'thinking']:
        tree = E.parse(ROOT / f'docs/avatar-source/{character}-{state}.svg')
        root = tree.getroot()
        root.attrib.update({'viewBox': '-175 -175 350 350', 'width': '120', 'height': '120', 'aria-hidden': 'true'})
        root.attrib.pop('role', None)
        root.attrib.pop('aria-label', None)
        for el in root.iter():
            if el.get('clip-path') == 'url(#snapshot-frame-clip)':
                el.attrib.pop('clip-path')
            if el.get('clip-path') == 'url(#snapshot-head-clip)':
                el.set('class', 'avatar-eyes')
                for eye in el.findall(NS + 'path'):
                    eye.set('class', 'avatar-eye')
        gradient_id = character + 'Body'
        gradient = E.SubElement(root.find(NS + 'defs'), NS + 'linearGradient', {'id': gradient_id, 'x1': '0', 'y1': '0', 'x2': '.85', 'y2': '1'})
        for offset, color in zip(['0', '.45', '1'], colors):
            E.SubElement(gradient, NS + 'stop', {'offset': offset, 'stop-color': color})
        for el in root.iter(NS + 'path'):
            if el.get('fill', '').lower() == base:
                el.set('fill', f'url(#{gradient_id})')
        tree.write(ROOT / f'dist/assets/{character}-{state}.svg', encoding='unicode')
