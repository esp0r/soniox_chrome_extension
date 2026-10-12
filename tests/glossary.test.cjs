const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const read = name => fs.readFileSync(path.join(__dirname, '../extension', name), 'utf8');
function harness() {
  const ctx = vm.createContext({TextEncoder, chrome:{runtime:{onMessage:{addListener(){}}}}});
  vm.runInContext(read('glossary.js') + '\n' + read('offscreen.js'), ctx);
  return ctx;
}
const plain = value => JSON.parse(JSON.stringify(value));
test('TSV supports BOM, CRLF, recognition-only terms, exact translations and duplicates', () => {
  const g = harness().SonioxGlossary;
  assert.deepEqual(plain(g.parse('\uFEFFVALORANT\t无畏契约\r\nnecömi\nVALORANT\t无畏契约\n', true)), {
    terms:['VALORANT','necömi'], translation_terms:[{source:'VALORANT',target:'无畏契约'}]
  });
  assert.equal(g.parse(' \n', true), undefined);
});
test('rejects conflicts, malformed rows and excessive context before connection', () => {
  const g = harness().SonioxGlossary;
  for (const text of ['x\ta\nx\tb', '\ttranslation', 'x\ty\tz', 'あ'.repeat(3000), Array.from({length:201},(_,i)=>`term${i}`).join('\n')]) {
    assert.throws(() => g.parse(text, true));
  }
});
test('wire config omits disabled glossary and guards translations by target language', () => {
  const ctx = harness();
  ctx.input = {targetLang:'zh',glossaryEnabled:true,glossaryText:'VALORANT\t无畏契约',glossaryTargetLang:'zh'};
  const config = () => plain(vm.runInContext('getWebSocketConfig(input)', ctx));
  assert.equal(config().context.translation_terms[0].target, '无畏契约');
  ctx.input.targetLang='en';
  assert.deepEqual(config().context,{terms:['VALORANT']});
  ctx.input.glossaryEnabled=false;
  assert.equal('context' in config(),false);
});
test('bundled glossary fits budget and is connected to both document entry points', () => {
  const g = harness().SonioxGlossary;
  const context = g.parse(read('glossaries/tsuzuri-zh.tsv'),true);
  assert.ok(context.terms.length >= 40);
  assert.ok(context.translation_terms.some(t=>t.source==='鈴鳴つづり'));
  for (const file of ['popup.html','offscreen.html']) {
    const html=read(file);
    assert.ok(html.indexOf('src="glossary.js"') < html.indexOf(`src="${file.replace('.html','.js')}"`));
  }
});

async function popup(saved = {}) {
  const elements = new Map(), messages = [], storage = {...saved};
  const document = {getElementById(id) {
    if (!elements.has(id)) elements.set(id, {value:'',checked:false,style:{},handlers:{},
      addEventListener(event, fn) {this.handlers[event]=fn;}});
    return elements.get(id);
  }};
  const ctx = vm.createContext({TextEncoder, document,console:{log(){},error(){}},
    chrome:{storage:{local:{get:async()=>storage,set:async values=>Object.assign(storage,values)},onChanged:{addListener(){}}},
      tabs:{query:async()=>[{id:7}]},runtime:{sendMessage:async message=>{
        messages.push(message);return message.type==='START_CAPTURE'?{success:true}:{state:'idle'};
      }}}});
  vm.runInContext(read('glossary.js')+'\n'+read('popup.js'),ctx);
  await new Promise(setImmediate);
  return {elements,messages,storage,ctx,click: id=>elements.get(id).handlers.click()};
}
test('popup restores saved glossary and sends it on capture; invalid edits block capture', async () => {
  const p = await popup({apiKey:'dummy',targetLang:'zh',glossaryText:'VALORANT\t无畏契约',glossaryEnabled:true,glossaryTargetLang:'zh'});
  assert.equal(p.elements.get('glossaryEnabled').checked,true);
  assert.equal(p.elements.get('glossaryText').value,'VALORANT\t无畏契约');
  await p.click('startBtn');
  const sent=p.messages.find(m=>m.type==='START_CAPTURE');
  assert.equal(sent.config.glossaryText,p.storage.glossaryText);
  assert.equal(sent.config.glossaryTargetLang,'zh');
  p.elements.get('glossaryText').value='x\ta\nx\tb';
  await p.click('startBtn');
  assert.equal(p.messages.filter(m=>m.type==='START_CAPTURE').length,1);
  assert.match(p.elements.get('status').textContent,/fix the glossary/);
});
test('popup imports valid files and rejects invalid files without replacing saved text', async () => {
  const p=await popup({targetLang:'zh'});
  const input=p.elements.get('glossaryFile');
  const upload=async text=>{
    const target={files:[{size:text.length,text:async()=>text}],value:'selected.tsv'};
    await input.handlers.change({target});assert.equal(target.value,'');
  };
  await upload('necömi\nVALORANT\t无畏契约');
  assert.equal(p.storage.glossaryEnabled,true);
  const before=p.storage.glossaryText;
  await upload('x\ty\tz');
  assert.equal(p.storage.glossaryText,before);
  assert.equal(p.elements.get('glossaryText').value,before);
  p.elements.get('glossaryEnabled').checked=false;
  await p.elements.get('glossaryEnabled').handlers.change();
  assert.equal(p.storage.glossaryEnabled,false);
});
test('offscreen rejects invalid glossary without requesting audio or opening a socket', async () => {
  const ctx=harness();
  const result=await vm.runInContext("startCapture('s',{glossaryEnabled:true,glossaryText:'x\\ty\\tz'},7)",ctx);
  assert.equal(result.success,false);
  assert.match(result.error,/Glossary line/);
});
