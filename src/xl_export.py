import openpyxl, re, json, sys, zipfile, base64, colorsys, os, posixpath
from openpyxl.utils import get_column_letter, column_index_from_string
from openpyxl.worksheet.formula import ArrayFormula

KO_FMT = {27:'yyyy"년" mm"월"',28:'mm-dd',29:'mm-dd',30:'mm-dd-yy',31:'yyyy"년" mm"월" dd"일"',32:'h"시" mm"분"',33:'h"시" mm"분" ss"초"',34:'yyyy-mm-dd',35:'yyyy-mm-dd',36:'yyyy"년" mm"월"',50:'yyyy"년" mm"월"',51:'mm-dd',52:'yyyy-mm-dd',53:'yyyy-mm-dd',54:'mm-dd',55:'yyyy"년" mm"월"',56:'mm-dd',57:'yyyy"년" mm"월"',58:'mm-dd'}
QUOTE_KEYS = ('견적서', '(On-Premise)', 'D-Cloud')
LAYOUT_EXTRA = ('표지', 'A10_체크리스트')
SKIP = ('관제서비스', 'CMS신청서', '개인정보 수집', '참조1', '유상유지보수', '장비별 상세스펙')

def theme_colors(z):
    t = z.read('xl/theme/theme1.xml').decode('utf8')
    order = ['lt1', 'dk1', 'lt2', 'dk2', 'accent1', 'accent2', 'accent3', 'accent4', 'accent5', 'accent6', 'hlink', 'folHlink']
    out = []
    for k in order:
        m = re.search(r'<a:%s>(.*?)</a:%s>' % (k, k), t, re.S)
        v = re.search(r'(?:lastClr|val)="([0-9A-Fa-f]{6})"', m.group(1)) if m else None
        out.append(v.group(1).upper() if v else '000000')
    return out

def tint(hexc, t):
    r, g, b = [int(hexc[i:i+2], 16) / 255 for i in (0, 2, 4)]
    h, l, s = colorsys.rgb_to_hls(r, g, b)
    l = l * (1 + t) if t < 0 else l * (1 - t) + t
    r, g, b = colorsys.hls_to_rgb(h, l, s)
    return '%02X%02X%02X' % tuple(round(x * 255) for x in (r, g, b))

def color(c, theme):
    if c is None: return None
    try:
        if c.type == 'rgb' and isinstance(c.rgb, str):
            v = c.rgb[-6:]
            if c.rgb[:2] == '00' and len(c.rgb) == 8 and c.rgb != '00000000': pass
            return v
        if c.type == 'theme':
            base = theme[c.theme] if c.theme < len(theme) else '000000'
            return tint(base, c.tint or 0) if c.tint else base
        if c.type == 'indexed':
            from openpyxl.styles.colors import COLOR_INDEX
            if c.indexed < len(COLOR_INDEX):
                return COLOR_INDEX[c.indexed][-6:]
    except Exception:
        return None
    return None

def addr(r, c): return f'{get_column_letter(c)}{r}'

def sheet_xml_paths(z):
    wb = z.read('xl/workbook.xml').decode('utf8')
    rels = z.read('xl/_rels/workbook.xml.rels').decode('utf8')
    rmap = dict(re.findall(r'Id="(rId\d+)"[^>]*Target="([^"]+)"', rels))
    rmap.update({b: a for a, b in re.findall(r'Target="([^"]+)"[^>]*Id="(rId\d+)"', rels)})
    out = {}
    for name, rid in re.findall(r'<sheet name="([^"]+)"[^>]*r:id="(rId\d+)"', wb):
        name = name.replace('&amp;', '&')
        t = rmap[rid]
        out[name] = 'xl/' + t.lstrip('/').replace('xl/', '') if not t.startswith('/') else t.lstrip('/')
    return out

def rel_targets(z, path):
    d, f = posixpath.split(path)
    rp = posixpath.join(d, '_rels', f + '.rels')
    if rp not in z.namelist(): return {}
    x = z.read(rp).decode('utf8')
    res = {}
    for m in re.finditer(r'<Relationship ([^>]*)/?>', x):
        a = m.group(1)
        i = re.search(r'Id="([^"]+)"', a).group(1); t = re.search(r'Target="([^"]+)"', a).group(1)
        res[i] = posixpath.normpath(posixpath.join(d, t)) if not t.startswith('/') else t.lstrip('/')
    return res

SCHEME = {'bg1': 0, 'lt1': 0, 'tx1': 1, 'dk1': 1, 'bg2': 2, 'lt2': 2, 'tx2': 3, 'dk2': 3, 'accent1': 4, 'accent2': 5, 'accent3': 6, 'accent4': 7, 'accent5': 8, 'accent6': 9}
def clr(xml, theme):
    m = re.search(r'<a:srgbClr val="([0-9A-Fa-f]{6})"', xml)
    if m: return m.group(1).upper()
    m = re.search(r'<a:schemeClr val="(\w+)"', xml)
    if m and m.group(1) in SCHEME: return theme[SCHEME[m.group(1)]]
    return None
def images_for(z, sheet_path, media, theme):
    out = []
    for rid, tgt in rel_targets(z, sheet_path).items():
        if 'drawings/drawing' not in tgt or not tgt.endswith('.xml'): continue
        x = z.read(tgt).decode('utf8'); rr = rel_targets(z, tgt)
        for a in re.finditer(r'<xdr:(twoCellAnchor|oneCellAnchor)[^>]*>(.*?)</xdr:\1>', x, re.S):
            body = a.group(2)
            def pos(tag):
                m = re.search(r'<xdr:%s><xdr:col>(\d+)</xdr:col><xdr:colOff>(-?\d+)</xdr:colOff><xdr:row>(\d+)</xdr:row><xdr:rowOff>(-?\d+)</xdr:rowOff></xdr:%s>' % (tag, tag), body)
                return [int(m.group(3)), int(m.group(1)), int(m.group(4)), int(m.group(2))] if m else None
            fr = pos('from'); to = pos('to')
            ext = re.search(r'<xdr:ext cx="(\d+)" cy="(\d+)"', body)
            hid = re.search(r'<xdr:cNvPr[^>]*hidden="1"', body)
            if hid: continue
            emb = re.search(r'r:embed="([^"]+)"', body)
            if emb and '<xdr:pic' in body:
                img = rr.get(emb.group(1))
                if not img or not img.lower().endswith(('.png', '.jpg', '.jpeg', '.gif')): continue
                key = posixpath.basename(img)
                if key not in media:
                    data = z.read(img); mime = 'image/png' if key.lower().endswith('png') else 'image/jpeg'
                    media[key] = f'data:{mime};base64,' + base64.b64encode(data).decode()
                out.append({'src': key, 'from': fr, 'to': to, 'ext': [int(ext.group(1)), int(ext.group(2))] if ext else None})
            elif '<xdr:sp>' in body or '<xdr:sp ' in body:
                tb = re.search(r'<xdr:txBody>(.*?)</xdr:txBody>', body, re.S)
                sppr = re.search(r'<xdr:spPr[^>]*>(.*?)</xdr:spPr>', body, re.S)
                sppr = sppr.group(1) if sppr else ''
                fill = None
                if '<a:noFill/>' not in sppr.split('<a:ln')[0]:
                    fm = re.search(r'<a:solidFill>(.*?)</a:solidFill>', sppr.split('<a:ln')[0], re.S)
                    if fm: fill = clr(fm.group(1), theme)
                    else:
                        st = re.search(r'<a:fillRef idx="[1-9]"[^>]*>(.*?)</a:fillRef>', body, re.S)
                        if st: fill = clr(st.group(1), theme)
                paras = []
                if tb:
                    anc = re.search(r'<a:bodyPr[^>]*anchor="(\w+)"', tb.group(1))
                    for p in re.findall(r'<a:p>(.*?)</a:p>', tb.group(1), re.S):
                        al = re.search(r'algn="(\w+)"', p)
                        runs = []
                        for r in re.finditer(r'<a:r>(.*?)</a:r>', p, re.S):
                            rp = r.group(1); t = re.search(r'<a:t>(.*?)</a:t>', rp, re.S)
                            if not t: continue
                            sz = re.search(r'<a:rPr[^>]* sz="(\d+)"', rp)
                            fc = re.search(r'<a:rPr[^>]*>(.*?)</a:rPr>', rp, re.S)
                            runs.append({'t': t.group(1).replace('&amp;', '&').replace('&lt;', '<').replace('&gt;', '>'), 'sz': int(sz.group(1)) / 100 if sz else 11, 'b': 1 if re.search(r'<a:rPr[^>]* b="1"', rp) else 0, 'c': clr(fc.group(1), theme) if fc else None})
                        paras.append({'al': al.group(1) if al else 'l', 'runs': runs})
                if not fill and not any(p['runs'] for p in paras): continue
                out.append({'sp': 1, 'from': fr, 'to': to, 'ext': [int(ext.group(1)), int(ext.group(2))] if ext else None, 'fill': fill, 'paras': paras, 'anchor': (anc.group(1) if tb and anc else 't')})
    return out

def dvs(z, sheet_path):
    x = z.read(sheet_path).decode('utf8'); out = []
    for m in re.finditer(r'<x14:dataValidation [^>]*type="list"[^>]*>(.*?)</x14:dataValidation>', x, re.S):
        f = re.search(r'<xm:f>(.*?)</xm:f>', m.group(1), re.S); s = re.search(r'<xm:sqref>(.*?)</xm:sqref>', m.group(1))
        if f and s: out.append({'sqref': s.group(1), 'f': f.group(1).replace('&amp;', '&').replace('&quot;', '"')})
    for m in re.finditer(r'<dataValidation [^>]*type="list"[^>]*sqref="([^"]+)"[^>]*>\s*<formula1>(.*?)</formula1>', x, re.S):
        out.append({'sqref': m.group(1), 'f': m.group(2).replace('&amp;', '&').replace('&quot;', '"')})
    return out

def breaks(z, sheet_path):
    x = z.read(sheet_path).decode('utf8')
    m = re.search(r'<rowBreaks.*?</rowBreaks>', x, re.S)
    return [int(b) for b in re.findall(r'<brk id="(\d+)"', m.group(0))] if m else []

def export(path, out_path, tid, title):
    z = zipfile.ZipFile(path)
    theme = theme_colors(z)
    wb = openpyxl.load_workbook(path)
    wbv = openpyxl.load_workbook(path, data_only=True)
    paths = sheet_xml_paths(z)
    styles = []; skey = {}
    media = {}
    def style_id(c):
        f = c.font; fl = c.fill; b = c.border; al = c.alignment
        fill = None
        if fl is not None and fl.fill_type == 'solid':
            fill = color(fl.fgColor, theme)
        def side(s):
            if s is None or s.style is None: return None
            return [s.style, color(s.color, theme) or '000000']
        st = {
            'b': 1 if f.b else 0, 'i': 1 if f.i else 0, 'u': 1 if f.u else 0, 'sz': float(f.sz or 11),
            'fc': color(f.color, theme), 'fn': f.name, 'fill': fill,
            'bd': [side(b.left), side(b.right), side(b.top), side(b.bottom)],
            'h': al.horizontal, 'v': al.vertical, 'w': 1 if al.wrap_text else 0, 'ind': al.indent or 0,
            'nf': KO_FMT.get(c._style.numFmtId) or (c.number_format if c.number_format != 'General' else None),
            'st': 1 if (f.strike) else 0,
        }
        k = json.dumps(st, sort_keys=True, ensure_ascii=False)
        if k not in skey:
            skey[k] = len(styles); styles.append(st)
        return skey[k]
    sheets = {}
    names = [ws.title for ws in wb.worksheets]
    quote_sheets = [n for n in names if any(k in n for k in QUOTE_KEYS) and not any(s in n for s in SKIP) and n != 'A10_체크리스트']
    for ws in wb.worksheets:
        n = ws.title
        if any(s in n for s in SKIP): continue
        layout = n in quote_sheets or n in LAYOUT_EXTRA
        wv = wbv[n]
        cells = {}
        maxr = ws.max_row; maxc = ws.max_column
        for row in ws.iter_rows(min_row=1, max_row=maxr, max_col=maxc):
            for c in row:
                v = c.value
                rec = {}
                if isinstance(v, ArrayFormula): v = v.text
                if isinstance(v, str) and v.startswith('=') and len(v) > 1:
                    rec['f'] = v[1:]
                    cv = wv[c.coordinate].value
                    if cv is not None and not hasattr(cv, 'isoformat'): rec['c'] = cv
                elif v is not None and v != '':
                    if hasattr(v, 'isoformat'): v = v.isoformat()[:10]
                    rec['v'] = v
                if layout and c.has_style:
                    sid = style_id(c)
                    if sid or rec: rec['s'] = sid
                if rec: cells[c.coordinate] = rec
        sh = {'cells': cells, 'maxr': maxr, 'maxc': maxc, 'state': ws.sheet_state}
        if layout:
            cols = {}
            for k, d in ws.column_dimensions.items():
                if d.min and d.max:
                    for ci in range(d.min, min(d.max, maxc + 2) + 1):
                        cols[ci] = [d.width or ws.sheet_format.defaultColWidth or 8.43, 1 if d.hidden else 0]
            sh['cols'] = cols
            sh['dcw'] = ws.sheet_format.defaultColWidth or 8.43
            sh['drh'] = ws.sheet_format.defaultRowHeight or 15
            sh['rows'] = {r: [d.height, 1 if d.hidden else 0] for r, d in ws.row_dimensions.items() if d.height or d.hidden}
            sh['merges'] = [[m.min_row, m.min_col, m.max_row, m.max_col] for m in ws.merged_cells.ranges]
            pa = ws.print_area
            if pa:
                pa = pa if isinstance(pa, str) else pa[0]
                m = re.search(r'\$?([A-Z]+)\$?(\d+):\$?([A-Z]+)\$?(\d+)', pa)
                sh['pa'] = [int(m.group(2)), column_index_from_string(m.group(1)), int(m.group(4)), column_index_from_string(m.group(3))]
            p = paths.get(n)
            if p:
                sh['images'] = images_for(z, p, media, theme)
                sh['dv'] = dvs(z, p)
                sh['brk'] = breaks(z, p)
        sheets[n] = sh
    data = {'id': tid, 'title': title, 'quoteSheets': quote_sheets, 'sheets': sheets, 'styles': styles, 'media': media}
    with open(out_path, 'w') as f: json.dump(data, f, ensure_ascii=False, separators=(',', ':'))
    return data

if __name__ == '__main__':
    d = export(sys.argv[1], sys.argv[2], sys.argv[3], sys.argv[4])
    print(sys.argv[3], 'sheets', list(d['sheets'].keys()), 'quote', d['quoteSheets'], 'styles', len(d['styles']), 'media', list(d['media'].keys()), os.path.getsize(sys.argv[2]))
