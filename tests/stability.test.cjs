const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const source = name => fs.readFileSync(path.join(__dirname, '../extension', name), 'utf8');
const flush = () => new Promise(setImmediate);

function harness() {
  const messages = [], sockets = [], timers = new Map(), tracks = [], contexts = [];
  let timerId = 0;
  class Socket {
    static OPEN = 1; static CLOSING = 2;
    constructor(url, protocols) { this.url = url; this.protocols = protocols; this.readyState = 0; this.bufferedAmount = 0; this.sent = []; sockets.push(this); }
    send(data) { assert.equal(this.readyState, 1); this.sent.push(data); }
    close() { this.readyState = 3; this.closed = true; this.onclose?.({ code: 1000 }); }
    open() { this.readyState = 1; this.onopen?.(); }
    message(data) { this.onmessage?.({ data: JSON.stringify(data) }); }
    drop() { this.readyState = 3; this.onclose?.({ code: 1006 }); }
  }
  class AudioContext {
    constructor() { this.sampleRate = 48000; this.state = 'running'; contexts.push(this); }
    createMediaStreamSource() { return { connect() {} }; }
    createScriptProcessor() { this.processor = { connect() {}, disconnect() {} }; return this.processor; }
    async close() { this.closed = true; }
  }
  const sandbox = {
    console, WebSocket: Socket, AudioContext,
    setTimeout(fn, ms) { const id = ++timerId; timers.set(id, { fn, ms }); return id; },
    clearTimeout(id) { timers.delete(id); },
    setInterval(fn, ms) { const id = ++timerId; timers.set(id, { fn, ms, interval: true }); return id; },
    clearInterval(id) { timers.delete(id); },
    document: { body: { appendChild() {} }, createElement() { return { async play() {}, pause() {}, remove() {} }; } },
    navigator: { mediaDevices: { async getUserMedia() { const track = { stop() { this.stopped = true; } }; tracks.push(track); return { getTracks: () => [track] }; } } },
    chrome: { runtime: { onMessage: { addListener() {} }, async sendMessage(message) { messages.push(message); return { success: true }; } } }
  };
  const ctx = vm.createContext(sandbox);
  vm.runInContext(source('offscreen.js'), ctx);
  const run = script => vm.runInContext(script, ctx);
  const start = () => run("startCapture('stream', {apiKey:'test-key-not-real',sourceLang:'ja',targetLang:'zh'}, 7)");
  const fire = async ms => {
    const entry = [...timers].find(([, t]) => t.ms === ms && !t.interval);
    assert.ok(entry, `timer ${ms} exists`);
    timers.delete(entry[0]); entry[1].fn(); await flush();
  };
  return { sandbox, ctx, run, start, sockets, messages, timers, tracks, contexts, fire };
}

async function running() {
  const h = harness(); const started = h.start(); await flush();
  h.sockets[0].open(); h.sockets[0].message({ tokens: [], total_audio_proc_ms: 0 });
  assert.equal((await started).success, true); await flush();
  return h;
}

 test('v5 authenticates in protocols and does not report running at onopen', async () => {
  const h = harness(); let resolved = false;
  const started = h.start().then(value => { resolved = true; return value; }); await flush();
  const ws = h.sockets[0];
  assert.deepEqual(Array.from(ws.protocols), ['soniox-api-key', 'test-key-not-real']);
  ws.open(); await flush();
  assert.equal(resolved, false);
  const config = JSON.parse(ws.sent[0]);
  assert.equal(config.model, 'stt-rt-v5'); assert.equal('api_key' in config, false);
  ws.message({ tokens: [], total_audio_proc_ms: 0 });
  assert.equal((await started).success, true);
  assert.equal(JSON.stringify(h.messages).includes('test-key-not-real'), false);
});

test('bad authentication fails after open without retries or leaked capture', async () => {
  const h = harness(); const started = h.start(); await flush();
  h.sockets[0].open(); h.sockets[0].message({ error_code: 401, error_type: 'unauthenticated', error_message: 'secret test-key-not-real' });
  assert.equal((await started).success, false); await flush();
  assert.equal(h.run('lastStatus.state'), 'error');
  assert.equal(h.sockets.length, 1); assert.equal(h.timers.size, 0);
  assert.ok(h.tracks[0].stopped); assert.ok(h.contexts[0].closed);
  assert.equal(JSON.stringify(h.messages).includes('test-key-not-real'), false);
});

test('preserves spaces, partial words and literal angle brackets across batches', () => {
  const h = harness();
  const first = h.run('processTokens([{text:"Hello",is_final:true}])');
  const next = h.run('processTokens([{text:" world",is_final:true},{text:"<3",is_final:true},{text:"<end>",is_final:true},{text:" bon",is_final:false,translation_status:"translation"}])');
  assert.equal(first.newFinalOriginal + next.newFinalOriginal, 'Hello world<3');
  assert.equal(next.interimTranslation, ' bon');
  assert.equal(h.run('processTokens([]).interimTranslation'), '');
});

test('stop drains final subtitles before resolving and leaves final text available', async () => {
  const h = await running(); const ws = h.sockets[0]; let stopped = false;
  const stop = h.run('stopCapture()').then(value => { stopped = true; return value; });
  await flush(); assert.equal(stopped, false); assert.equal(ws.closed, undefined);
  assert.equal(ws.sent.at(-1), ''); assert.ok(h.tracks[0].stopped);
  ws.message({ tokens: [{ text: ' last sentence', is_final: true }], finished: true });
  assert.equal((await stop).success, true); assert.ok(ws.closed);
  const tailIndex = h.messages.findIndex(m => m.subtitles?.newFinalOriginal === ' last sentence');
  const idleIndex = h.messages.findIndex(m => m.status?.state === 'idle');
  assert.ok(tailIndex >= 0 && tailIndex < idleIndex);
  assert.equal(h.timers.size, 0);
});

test('stop timeout reports possible lost tail and frees all resources', async () => {
  const h = await running(); const stop = h.run('stopCapture()');
  await h.fire(5000); const result = await stop;
  assert.equal(result.success, false); assert.match(result.error, /last sentence/);
  assert.ok(h.sockets[0].closed); assert.equal(h.timers.size, 0);
});

test('unexpected close retries twice, then reports error instead of running', async () => {
  const h = await running(); h.sockets[0].drop(); await flush();
  assert.equal(h.run('lastStatus.state'), 'reconnecting');
  await h.fire(1000); h.sockets[1].drop(); await h.fire(2000);
  h.sockets[2].drop(); await flush();
  assert.equal(h.run('lastStatus.state'), 'error');
  assert.equal(h.sockets.length, 3); assert.ok(h.tracks[0].stopped);
  assert.equal(h.timers.size, 0);
});

test('connection timeout retries with bounds and settles initial start', async () => {
  const h = harness(); const start = h.start(); await flush();
  await h.fire(20000); await h.fire(1000); await h.fire(20000); await h.fire(2000); await h.fire(20000);
  assert.equal((await start).success, false); await flush();
  assert.equal(h.run('lastStatus.state'), 'error'); assert.equal(h.timers.size, 0);
});

test('stop during retry cancels pending reconnect', async () => {
  const h = await running(); h.sockets[0].drop(); await flush();
  assert.equal((await h.run('stopCapture()')).success, true);
  assert.equal(h.timers.size, 0); assert.equal(h.sockets.length, 1);
});

test('late getUserMedia completion after cancellation cannot leak tracks', async () => {
  const h = harness(); let finish;
  h.sandbox.navigator.mediaDevices.getUserMedia = () => new Promise(resolve => { finish = resolve; });
  const start = h.start(); await flush();
  await h.run('stopCapture()');
  const track = { stop() { this.stopped = true; } };
  finish({ getTracks: () => [track] });
  assert.equal((await start).success, false); assert.equal(track.stopped, true);
  assert.equal(h.sockets.length, 0);
});

test('audio upload backlog triggers bounded recovery', async () => {
  const h = await running(); h.sockets[0].bufferedAmount = 200000;
  h.contexts[0].processor.onaudioprocess({}); await flush();
  assert.equal(h.run('lastStatus.state'), 'reconnecting');
  await h.run('stopCapture()'); assert.equal(h.timers.size, 0);
});

test('resampling carries remainder instead of losing a sample each callback', () => {
  const h = harness();
  const length = h.run(`(() => {
    const state = {phase:0,sum:0,count:0}; let total = 0;
    for(let i=0;i<3;i++) total += downsampleBuffer(new Float32Array(4096),48000,16000,state).length;
    return total;
  })()`);
  assert.equal(length, 4096);
});

test('content script is safe to inject repeatedly and exposes a readiness probe', async () => {
  const listeners = [];
  const ctx = vm.createContext({ console: { log() {} }, chrome: {
    runtime: { onMessage: { addListener(fn) { listeners.push(fn); } } },
    storage: { local: { async get() { return {}; } }, onChanged: { addListener() {} } }
  } });
  const script = new vm.Script(source('content.js'));
  script.runInContext(ctx); script.runInContext(ctx); await flush();
  assert.equal(listeners.length, 1);
  let response; listeners[0]({ type: 'SONIOX_PING' }, {}, value => { response = value; });
  assert.equal(response.ready, true);
});

function backgroundHarness() {
  const h = harness();
  const store = {}, tabMessages = [], injected = [];
  let listener, removedListener, exists = false;
  const chrome = {
    storage: { local: {
      async get(key) { return { [key]: store[key] }; },
      async set(values) { Object.assign(store, values); }
    } },
    runtime: {
      getURL: name => 'chrome-extension://test/' + name,
      async getContexts() { return exists ? [{}] : []; },
      onMessage: { addListener(fn) { listener = fn; } },
      async sendMessage(message) {
        h.ctx.inputMessage = message;
        if (message.type === 'OFFSCREEN_GET_STATUS') return h.run('({...lastStatus})');
        if (message.type === 'OFFSCREEN_START_CAPTURE') return h.run('startCapture(inputMessage.streamId,inputMessage.config,inputMessage.tabId)');
        if (message.type === 'OFFSCREEN_STOP_CAPTURE') return h.run('stopCapture()');
      }
    },
    offscreen: { async createDocument() { exists = true; } },
    tabs: {
      async sendMessage(tabId, message) { tabMessages.push({tabId, ...message}); return message.type === 'SONIOX_PING' ? {ready:true} : {success:true}; },
      onRemoved: { addListener(fn) { removedListener = fn; } }
    },
    scripting: {
      async insertCSS() { injected.push('css'); },
      async executeScript() { injected.push('js'); }
    },
    tabCapture: { async getMediaStreamId() { return 'stream'; } }
  };
  const dispatch = (message, sender = {}) => new Promise(resolve => {
    if (!listener(message, sender, resolve)) resolve(undefined);
  });
  h.sandbox.chrome.runtime.sendMessage = async message => {
    h.messages.push(message);
    return dispatch(message, { url: chrome.runtime.getURL('offscreen.html') });
  };
  const restart = () => vm.runInNewContext(source('background.js'), {chrome, console});
  restart();
  const start = () => dispatch({type:'START_CAPTURE',tabId:7,config:{apiKey:'fake-key',sourceLang:'ja',targetLang:'zh'}});
  return {...h, chrome, store, tabMessages, injected, dispatch, restart, start, removeTab: id => removedListener(id)};
}

test('background and offscreen coordinate start, live status, final delivery and repeated capture', async () => {
  const h = backgroundHarness(); const start = h.start(); await flush();
  assert.equal(h.store.captureStatus.state, 'connecting');
  h.sockets[0].open(); h.sockets[0].message({tokens:[]});
  assert.equal((await start).success, true); await flush();
  assert.equal(h.store.isCapturing, true); assert.equal(h.injected.length, 0);
  const stop = h.dispatch({type:'STOP_CAPTURE'}); await flush();
  assert.equal(h.store.captureStatus.state, 'stopping');
  h.sockets[0].message({tokens:[{text:'tail',is_final:true}],finished:true});
  assert.equal((await stop).success, true);
  assert.equal(h.store.isCapturing, false);
  assert.ok(h.tabMessages.some(m => m.subtitles?.newFinalOriginal === 'tail'));
  assert.equal(h.tabMessages.at(-1).type, 'SUBTITLE_UPDATE');
  const next = h.start(); await flush(); h.sockets[1].open(); h.sockets[1].message({tokens:[]});
  assert.equal((await next).success, true);
});

test('worker restart restores status and routes subtitles using offscreen tab ID', async () => {
  const h = backgroundHarness(); const start = h.start(); await flush();
  h.sockets[0].open(); h.sockets[0].message({tokens:[]}); await start; await flush();
  h.restart();
  assert.equal((await h.dispatch({type:'GET_CAPTURE_STATUS'})).state, 'running');
  h.sockets[0].message({tokens:[{text:'after restart',is_final:true}]}); await flush();
  assert.equal(h.tabMessages.at(-1).tabId, 7);
  assert.equal(h.tabMessages.at(-1).subtitles.newFinalOriginal, 'after restart');
  h.removeTab(7); await flush();
  assert.equal(h.run('lastStatus.state'), 'stopping');
  h.sockets[0].message({tokens:[],finished:true}); await flush();
  assert.equal(h.store.isCapturing, false);
});

test('background rejects overlapping starts and persists preparation failures', async () => {
  const h = backgroundHarness();
  h.chrome.scripting.executeScript = async () => { throw new Error('Restricted page'); };
  h.chrome.tabs.sendMessage = async () => { throw new Error('No receiver'); };
  const first = h.start(); const second = await h.start();
  assert.equal(second.success, false); assert.equal((await first).success, false);
  const status = await h.dispatch({type:'GET_CAPTURE_STATUS'});
  assert.equal(status.state, 'error'); assert.match(status.error, /Restricted page/);
  assert.equal(h.sockets.length, 0);
});

test('stop during tab setup cancels start before opening any socket', async () => {
  const h = backgroundHarness(); let release;
  h.chrome.tabCapture.getMediaStreamId = () => new Promise(resolve => {release=resolve;});
  const start = h.start(); await flush();
  const stop = h.dispatch({type:'STOP_CAPTURE'}); await flush();
  release('stream');
  assert.equal((await start).success, false); assert.equal((await stop).success, true);
  assert.equal(h.sockets.length, 0); assert.equal(h.store.isCapturing, false);
});

test('audio setup timeout settles start even if browser media acquisition never returns', async () => {
  const h = harness();
  h.sandbox.navigator.mediaDevices.getUserMedia = () => new Promise(() => {});
  const start = h.start(); await flush(); await h.fire(20000);
  assert.equal((await start).success, false); await flush();
  assert.equal(h.run('lastStatus.state'), 'error'); assert.equal(h.timers.size, 0);
});

test('popup follows background changes and never writes its own capture flag', async () => {
  const elements = new Map(); let changed;
  const writes = [];
  const document = { getElementById(id) {
    if (!elements.has(id)) elements.set(id,{style:{},value:'',addEventListener(){}});
    return elements.get(id);
  } };
  vm.runInNewContext(source('popup.js'), {document,console:{log(){}},chrome:{
    storage:{local:{async get(){return {};},async set(value){writes.push(value);}},onChanged:{addListener(fn){changed=fn;}}},
    runtime:{async sendMessage(){return {state:'running'};}}
  }});
  await flush();
  assert.equal(elements.get('stopBtn').style.display,'block');
  changed({captureStatus:{newValue:{state:'error',error:'Soniox 401: unauthenticated'}}},'local');
  assert.equal(elements.get('startBtn').style.display,'block');
  assert.match(elements.get('status').textContent,/unauthenticated/);
  assert.equal(writes.length,0);
});
