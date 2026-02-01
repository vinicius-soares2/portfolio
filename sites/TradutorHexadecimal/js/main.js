/* utilitários */
const el = id => document.getElementById(id);
const status = el('status');
const input = el('input');
const output = el('output');
const modeSel = el('mode');
const encSel = el('encoding');

function cleanHexString(s){
  // remove 0x, não-hex, e normaliza espaços
  return String(s || '')
    .replace(/0x/ig,' ')
    .replace(/[^0-9a-fA-F]/g,' ')
    .trim()
    .replace(/\s+/g,' ');
}

function hexToBytes(hexStr){
  const clean = cleanHexString(hexStr);
  if (!clean) return [];
  const parts = clean.split(/\s+/);
  // se o usuário deu uma string contínua como "48656c6c6f"
  if (parts.length === 1 && parts[0].length % 2 === 0) {
    const p = parts[0];
    const res = [];
    for (let i=0;i<p.length;i+=2) res.push(parseInt(p.substr(i,2),16));
    return res;
  }
  // caso contrário, cada parte é um byte (pode ser 1 ou 2 hex digits)
  const bytes = [];
  for (let part of parts) {
    if (part.length === 0) continue;
    if (part.length > 2) {
      // tentar quebrar em pares
      if (part.length % 2 === 0) {
        for (let i=0;i<part.length;i+=2) bytes.push(parseInt(part.substr(i,2),16));
        continue;
      } else {
        throw new Error('Formato hex inválido: dígito inválido em "'+part+'"');
      }
    }
    bytes.push(parseInt(part,16));
  }
  return bytes;
}

function bytesToHex(bytes, spaced=true){
  return bytes.map(b => b.toString(16).toUpperCase().padStart(2,'0')).join(spaced ? ' ' : '');
}

function decodeBytes(bytes, encoding='utf-8'){
  try {
    if (encoding.toLowerCase() === 'utf-8') {
      return new TextDecoder('utf-8', {fatal:false}).decode(new Uint8Array(bytes));
    } else {
      // fallback manual para ISO-8859-1
      return String.fromCharCode(...bytes.map(b => b & 0xFF));
    }
  } catch(e){
    throw new Error('Erro ao decodificar bytes: ' + e.message);
  }
}

function encodeTextToBytes(str, encoding='utf-8'){
  if (encoding.toLowerCase() === 'utf-8') {
    return Array.from(new TextEncoder().encode(str));
  } else {
    // ISO-8859-1: pega cada char e pega o código (mod 256)
    return Array.from(str).map(ch => ch.charCodeAt(0) & 0xFF);
  }
}

/* ações */
function convert(){
  status.textContent = '';
  const mode = modeSel.value;
  const encoding = encSel.value;
  try {
    if (mode === 'hex2text') {
      const hex = input.value;
      const bytes = hexToBytes(hex);
      if (bytes.length === 0) {
        output.textContent = '(nenhum byte detectado)';
        return;
      }
      const text = decodeBytes(bytes, encoding);
      let out = '';
      out += `Texto (decodificado, ${encoding}):\n${text}\n\n`;
      if (el('showBytes').checked) {
        out += `Bytes (${bytes.length}):\n` + bytesToHex(bytes, true) + '\n';
      }
      output.textContent = out.trim();
    } else {
      const txt = input.value;
      const bytes = encodeTextToBytes(txt, encoding);
      const spaced = el('spacedHex').checked;
      let out = '';
      out += `Hex (${encoding}):\n` + bytesToHex(bytes, spaced) + '\n\n';
      if (el('showBytes').checked) {
        out += `Bytes (dec):\n` + bytes.join(' ') + '\n';
      }
      output.textContent = out.trim();
    }
  } catch (err) {
    output.textContent = 'Erro: ' + err.message;
  }
}

function clearAll(){
  input.value = '';
  output.textContent = '—';
  status.textContent = '';
}

async function copyOutput(){
  try {
    await navigator.clipboard.writeText(output.textContent);
    status.textContent = 'Copiado ✅';
    setTimeout(()=> status.textContent = '', 2000);
  } catch(e){
    status.textContent = 'Não foi possível copiar automaticamente.';
    console.error(e);
  }
}

function downloadOutput(){
  const blob = new Blob([output.textContent], {type:'text/plain;charset=utf-8'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = (modeSel.value === 'hex2text' ? 'texto_decodificado.txt' : 'hex.txt');
  a.click();
  URL.revokeObjectURL(url);
}

function explain(){
  const mode = modeSel.value;
  if (mode === 'hex2text') {
    alert('Formato válido para hex:\n- bytes separados: 48 65 6C 6C 6F\n- sem espaços: 48656C6C6F\n- com 0x: 0x48 0x65 0x6C\n\nDepois clique em Converter para ver o texto decodificado (UTF-8 ou ISO-8859-1).');
  } else {
    alert('Digite o texto normal no campo da esquerda e clique em Converter. Opções:\n- UTF-8 codifica acentos e emojis em múltiplos bytes\n- ISO-8859-1 (Latin-1) mapeia bytes 0x00..0xFF diretamente para caracteres.');
  }
}

/* eventos UI */
el('convert').addEventListener('click', convert);
el('clear').addEventListener('click', clearAll);
el('copyOutput').addEventListener('click', copyOutput);
el('downloadOutput').addEventListener('click', downloadOutput);
el('explain').addEventListener('click', explain);
el('paste').addEventListener('click', async ()=>{
  try {
    const txt = await navigator.clipboard.readText();
    input.value = (input.value ? input.value + '\\n' : '') + txt;
    status.textContent = 'Colado';
    setTimeout(()=> status.textContent = '', 1500);
  } catch(e){
    status.textContent = 'Falha ao colar (permissão negada?)';
  }
});

modeSel.addEventListener('change', ()=>{
  if (modeSel.value === 'hex2text') {
    el('labelInput').textContent = 'Entrada (hex)';
    input.placeholder = 'Ex: 48 65 6c 6c 6f 2c 20 57 6f 72 6c 64';
  } else {
    el('labelInput').textContent = 'Entrada (texto)';
    input.placeholder = 'Ex: Olá, mundo!';
  }
  clearAll();
});

/* atalhos */
input.addEventListener('keydown', (ev)=>{
  if ((ev.ctrlKey || ev.metaKey) && ev.key.toLowerCase() === 'enter') {
    convert();
  }
});

/* init */
document.addEventListener('DOMContentLoaded', ()=>{
  modeSel.value = 'hex2text';
  el('showBytes').checked = true;
  el('spacedHex').checked = true;
  el('encoding').value = 'utf-8';
  output.textContent = '—';
});