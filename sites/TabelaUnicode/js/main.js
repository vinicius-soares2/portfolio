/* Utilitários */
const el = id => document.getElementById(id);
const parseNum = s => {
  if (typeof s === 'number') return s;
  if (!s) return NaN;
  s = String(s).trim();
  if (/^0x/i.test(s)) return parseInt(s,16);
  if (/^u\+/i.test(s)) return parseInt(s.slice(2),16);
  if (/^u/i.test(s)) return parseInt(s.slice(1));
  return parseInt(s,10);
};

function padHex(n, width=4){
  return n.toString(16).toUpperCase().padStart(width,'0');
}

function toUTF8Hex(codepoint){
  // converte codepoint para string e depois para bytes UTF-8
  const ch = String.fromCodePoint(codepoint);
  const encoder = new TextEncoder();
  const bytes = encoder.encode(ch);
  return Array.from(bytes).map(b => b.toString(16).padStart(2,'0').toUpperCase()).join(' ');
}

function isControlOrUnprintable(ch){
  // usa regex Unicode property escapes para categorias C (Other) ou Cf, Cc etc
  try {
    return /\p{C}/u.test(ch);
  } catch(e){
    // se não suportar, fallback: test whitespaces or control
    return /\s/.test(ch) && ch !== ' ';
  }
}

function safeNamePlaceholder(cp){
  // nomes completos exigiriam a tabela Unicode; aqui mostramos placeholders simples
  if (cp <= 0x1F || (cp >= 0x7F && cp <= 0x9F)) return '<control>';
  return '<unprintable/unknown>';
}

/* UI e lógica principal */
const tbody = document.querySelector('#chart tbody');
const rangeInfo = el('rangeInfo');
const pageInfo = el('pageInfo');

function renderRange(start, end, perPage=128, page=0){
  tbody.innerHTML = '';
  start = Math.max(0, Math.min(0x10FFFF, start));
  end = Math.max(0, Math.min(0x10FFFF, end));
  if (end < start) [start,end] = [end,start];
  const total = end - start + 1;
  const totalPages = Math.max(1, Math.ceil(total / perPage));
  page = Math.max(0, Math.min(totalPages-1, page));
  const pageStart = start + page*perPage;
  const pageEnd = Math.min(end, pageStart + perPage - 1);

  for (let cp = pageStart; cp <= pageEnd; cp++){
    const tr = document.createElement('tr');

    const hexCell = document.createElement('td');
    hexCell.textContent = 'U+' + padHex(cp, cp>0xFFFF?6:4);
    tr.appendChild(hexCell);

    const decCell = document.createElement('td');
    decCell.textContent = String(cp);
    tr.appendChild(decCell);

    const glyphCell = document.createElement('td');
    glyphCell.className = 'glyph';
    let ch = String.fromCodePoint(cp);
    if (isControlOrUnprintable(ch) || ch === '\uFFFD') {
      glyphCell.textContent = safeNamePlaceholder(cp);
      glyphCell.style.opacity = 0.7;
      glyphCell.style.fontSize = '0.95rem';
    } else {
      glyphCell.textContent = ch;
    }
    tr.appendChild(glyphCell);

    const nameCell = document.createElement('td');
    nameCell.textContent = (isControlOrUnprintable(ch) ? safeNamePlaceholder(cp) : '') ;
    nameCell.className = 'muted';
    tr.appendChild(nameCell);

    const utf8Cell = document.createElement('td');
    try {
      utf8Cell.textContent = toUTF8Hex(cp);
    } catch(e){
      utf8Cell.textContent = '<error>';
    }
    tr.appendChild(utf8Cell);

    tbody.appendChild(tr);
  }

  rangeInfo.textContent = `Mostrando U+${padHex(pageStart)} — U+${padHex(pageEnd)} (${pageEnd - pageStart + 1} caracteres)`;
  pageInfo.textContent = `Página ${page+1} / ${totalPages} — total ${total} caracteres`;
  // save current state
  el('load').dataset.start = start;
  el('load').dataset.end = end;
  el('load').dataset.perPage = perPage;
  el('load').dataset.page = page;
}

function loadFromInputs(page=0){
  const start = parseNum(el('start').value);
  const end = parseNum(el('end').value);
  const perPage = parseInt(el('perPage').value) || 128;
  if (isNaN(start) || isNaN(end)) {
    alert('Início e fim inválidos. Use hex (0xHH) ou decimal.');
    return;
  }
  renderRange(start, end, perPage, page);
}

/* Eventos */
el('load').addEventListener('click', ()=> loadFromInputs(0));
el('preset').addEventListener('change', ()=>{
  const v = el('preset').value;
  const [s,e] = v.split('-');
  el('start').value = s;
  el('end').value = e;
});
el('next').addEventListener('click', ()=>{
  const page = parseInt(el('load').dataset.page || 0) + 1;
  loadFromInputs(page);
});
el('prev').addEventListener('click', ()=>{
  const page = parseInt(el('load').dataset.page || 0) - 1;
  loadFromInputs(page);
});

el('search').addEventListener('keyup', (ev)=>{
  if (ev.key === 'Enter') {
    const q = el('search').value.trim();
    if (!q) return;
    let cp = parseNum(q.replace(/^U\+/i,''));
    if (isNaN(cp)) {
      alert('Formato inválido: use U+XXXX, 0xHEX ou decimal.');
      return;
    }
    // set start..end to include cp and show page 0
    const perPage = parseInt(el('perPage').value) || 128;
    const start = Math.max(0, cp - Math.floor(perPage/2));
    const end = start + perPage - 1;
    el('start').value = '0x' + padHex(start);
    el('end').value = '0x' + padHex(end);
    renderRange(start, end, perPage, 0);
  }
});

el('copyRow').addEventListener('click', async ()=>{
  // copia a linha selecionada — aqui copiamos todas as linhas visíveis como CSV
  const rows = Array.from(tbody.querySelectorAll('tr')).map(tr=>{
    const tds = Array.from(tr.children).map(td=>td.textContent.replace(/\s+/g,' '));
    return tds.join(', ');
  }).join('\n');
  try {
    await navigator.clipboard.writeText(rows);
    alert('Linhas visíveis copiadas para a área de transferência.');
  } catch(e){
    alert('Não foi possível copiar automaticamente. Selecione e copie manualmente.');
  }
});

el('exportCSV').addEventListener('click', ()=>{
  const lines = [['U+HEX','DEC','GLYPH','NAME','UTF8']];
  Array.from(tbody.querySelectorAll('tr')).forEach(tr=>{
    const cols = Array.from(tr.children).map(td => td.textContent);
    lines.push(cols);
  });
  const csv = lines.map(r => r.map(c => `"${String(c).replace(/"/g,'""')}"`).join(',')).join('\n');
  const blob = new Blob([csv], {type:'text/csv;charset=utf-8;'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'unicode_page.csv';
  a.click();
  URL.revokeObjectURL(url);
});

/* Inicialização: carregar preset default */
document.addEventListener('DOMContentLoaded', ()=> {
  // set default preset to Basic Latin
  el('preset').value = '0-127';
  el('start').value = '0x0000';
  el('end').value = '0x007F';
  renderRange(0,127, parseInt(el('perPage').value,10) || 128, 0);
});