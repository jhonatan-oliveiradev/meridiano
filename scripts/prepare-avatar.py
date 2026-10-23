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
