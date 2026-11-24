import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';
const { createCanvas, Image, Path2D } = createRequire(import.meta.url)('@napi-rs/canvas');

class Element {
  children = [];
  listeners = {};
  dataset = {};
  style = new Map();
  setAttribute() {}
  constructor() { this.style.setProperty = this.style.set.bind(this.style); }
  append(...children) { this.children.push(...children); }
  add(child) { this.append(child); }
  replaceChildren(...children) { this.children = children; }
  addEventListener(name, callback) { this.listeners[name] = callback; }
  checkValidity() { return true; }
  dispatchEvent(event) { get('controls').listeners[event.type]({target:{id:this.id}}); }
  focus() { this.focused = true; }
  after(element) { this.nextSibling = element; }
  remove() { this.removed = true; }
  click() { this.clicked = true; }
  insertCell() { const cell = new Element(); this.append(cell); return cell; }
  insertRow() { return this.insertCell(); }
  removeAttribute(name) { delete this[name]; }
  querySelectorAll() { return this.children.map(label => label.children[0]); }
  querySelector() { return this.children[0]; }
  get options() { return this.children; }
  get valueAsNumber() { return this.value === '' || this.value === undefined ? NaN : Number(this.value); }
  get selectedOptions() { return this.children.filter(option => option.value === this.value); }
}
const elements = new Map();
const get = id => {
  if (!elements.has(id)) elements.set(id, Object.assign(new Element(), { id }));
  return elements.get(id);
};
globalThis.location = { search: '' };
Object.defineProperty(globalThis, 'navigator', { value: { platform: 'Win32', userAgent: 'Chrome', maxTouchPoints: 0 }, configurable: true });
get('date').value = '２０２７年１２月２１日';
get('chart-title').value = '';
get('time').value = '09:00';
get('fortune').value = 'sect';
get('houses').value = 'placidus';
for (const value of ['placidus','whole','equal','solar','natural']) get('houses').add({value});
const canvases = [];
globalThis.document = {
  getElementById: get,
  createElement: tag => {
    if (tag !== 'canvas') return new Element();
    const canvas = createCanvas(1, 1);
    canvas.setAttribute = () => {};
    canvas.toBlob = (callback, type) => callback(new Blob([canvas.toBuffer('image/png')], {type}));
    canvases.push(canvas);
    return canvas;
  },
};
globalThis.Image = class extends Image {
  set src(value) { super.src = typeof value === 'string' && value.startsWith('file:') ? fileURLToPath(value) : value; }
};
globalThis.Path2D = Path2D;
globalThis.Option = class { constructor(text, value) { this.text = text; this.value = value; } };
globalThis.FormData = class {
  getAll() { return get('points').children.map(label => label.children[0]).filter(input => input.checked).map(input => input.value); }
};
const fetchBlob = url => originalFetch(url).then(r => r.blob());
const originalFetch = globalThis.fetch;
globalThis.fetch = async url => new Response(await readFile(url));
await import(pathToFileURL(resolve(process.argv[2], 'app.mjs')));
async function waitForResults() {
  for (let i = 0; i < 300 && get('results').hidden; i++) {
    await new Promise(resolve => setTimeout(resolve, 10));
  }
  assert.equal(get('results').hidden, false, get('status').textContent);
}
await waitForResults();
assert.match(get('birth-title').textContent, /東京/);
assert.equal(get('date').type, 'text');
assert.match(get('status').textContent, /2027-12-21 00:00 UTC/);
assert.match(get('target-title').textContent, /シドニー/);
if (process.argv[3]) {
  await waitForPng();
  const image = await fetchBlob(get('png-image').src);
  await writeFile(process.argv[3], Buffer.from(await image.arrayBuffer()));
}

const cuspRows = () => get('cusp-rows').children;
const cuspPosition = cell => [cell.children[0].textContent, cell.children[2].textContent];
assert.equal(cuspRows().length, 12);
assert.equal(cuspRows()[0].children[0].textContent, '1ハウス');
assert.equal(cuspRows()[11].children[0].textContent, '12ハウス');
assert.notDeepEqual(cuspPosition(cuspRows()[0].children[1]), cuspPosition(cuspRows()[0].children[2]));

for (const label of get('points').children) label.children[0].checked = true;
get('controls').listeners.change({ target: {} });
await waitForResults();
const targetCanvas = () => get('target-wheel').children[0];
assert.equal(targetCanvas().width, 960);
const initialPng = targetCanvas().toBuffer('image/png');
for (const wheel of ['birth-wheel', 'target-wheel']) {
  const context = get(wheel).children[0].getContext('2d');
  const iconPixels = context.getImageData(30, 892, 48, 48).data;
  const textPixels = context.getImageData(91, 907, 182, 17).data;
  const count = (pixels, predicate) => {
    let found = 0;
    for (let i = 0; i < pixels.length; i += 4) {
      if (predicate(pixels[i], pixels[i+1], pixels[i+2])) found++;
    }
    return found;
  };
  assert(count(iconPixels, (r,g,b) => r > 220 && g > 155 && b < 115) > 40);
  assert(count(textPixels, (r,g,b) => r < 50 && g < 65 && b < 100) > 70);
  const center = context.getImageData(398, 374, 164, 164).data;
  assert(count(center, (r,g,b)=>r===255 && g===251 && b===240) > 17000);
  assert(count(center, (r,g,b)=>r<45 && g<65 && b<95) > 100);
}
const picker = get('aspect-pair');
assert.equal(picker.value, '');
assert.match(get('target-house').textContent, /アスペクト 0組/);
const single = picker.children.find(group => group.label === 'メジャー').children[0];
assert.match(single.text, / × .*°/);
picker.value = single.value;
get('controls').listeners.change({ target: { id: 'aspect-pair' } });
await waitForResults();
assert.match(get('birth-house').textContent, /アスペクト 1組/);
assert.match(get('target-house').textContent, /アスペクト 1組/);
assert.notDeepEqual(targetCanvas().toBuffer('image/png'), initialPng);
get('all-aspects').listeners.click();
await waitForResults();
assert.equal(picker.value, 'all');
assert(Number(get('target-house').textContent.match(/アスペクト (\d+)組/)[1]) > 1);
picker.value = '';
get('controls').listeners.change({ target: { id: 'aspect-pair' } });
await waitForResults();
assert.match(get('target-house').textContent, /アスペクト 0組/);
assert.deepEqual(targetCanvas().toBuffer('image/png'), initialPng);
get('extra-aspects').checked = true;
get('controls').listeners.change({ target: { id: 'extra-aspects' } });
await waitForResults();
assert(picker.children.some(group => group.children?.some(option => /リリス|セレス|パラス|ジュノー|ベスタ/.test(option.text))));
const mean = get('rows').children.find(row => row.children[0].children.at(-1) === 'Meanリリス');
assert.deepEqual([mean.children[2].textContent, mean.children[4].textContent], [1, 12]);
assert.equal(mean.children[0].children[0].textContent, '⚸M');
const { ZODIAC_GLYPHS, ZODIAC_COLORS } = await import(pathToFileURL(resolve(process.argv[2], 'engine/src/index.mjs')));
const sign = mean.children[1].children[0];
assert.equal(sign.textContent, ZODIAC_GLYPHS[10] + '\uFE0E');
assert.equal(sign.style.get('--sign-color'), ZODIAC_COLORS[10]);
const { RETROGRADE_COLOR, RETROGRADE_MARK } = await import(pathToFileURL(resolve(process.argv[2], 'engine/src/retrograde-display.mjs')));
const rowNamed = name => get('rows').children.find(row => row.children[0].children.at(-1) === name);
for (const name of ['天王星', 'ジュノー', 'ベスタ']) {
  const row = rowNamed(name);
  for (const column of [1,3]) {
    const mark = row.children[column].children.at(-1);
    assert.equal(mark.textContent, RETROGRADE_MARK);
    assert.equal(mark.style.color, RETROGRADE_COLOR);
  }
}
for (const name of ['太陽', 'セレス', 'パラス', 'Meanリリス', 'Trueリリス', 'Vertex', 'PoF']) {
  const row = rowNamed(name);
  assert(!row.children[1].children.some(child => child?.className === 'retrograde'));
  assert(!row.children[3].children.some(child => child?.className === 'retrograde'));
}
for (const wheel of ['birth-wheel', 'target-wheel']) {
  const pixels = get(wheel).children[0].getContext('2d').getImageData(170, 145, 620, 620).data;
  assert(pixels.some((r,i) => i%4===0 && r>=165 && r<=182 && pixels[i+1]>=33 && pixels[i+1]<=75 && pixels[i+2]>=45 && pixels[i+2]<=85));
}
const { extraRetrogradeAt } = await import(pathToFileURL(resolve(process.argv[2], 'points/extra-retrograde.mjs')));
const stations = JSON.parse(await readFile(resolve(process.argv[2], 'points/extra-stations.json')));
assert.equal(Object.keys(stations).length, 201);
for (let year = 1900; year <= 2100; year++) {
  const start = Date.UTC(year - 1, 11, 31, 15);
  const next = Date.UTC(year, 11, 31, 15);
  for (const [id, [initial, ...changes]] of Object.entries(stations[year])) {
    assert(initial === 0 || initial === 1);
    changes.forEach((second, i) => {
      assert(second > (changes[i-1] ?? 0) && second*1000 <= next-start);
      if (second*1000 < next-start) {
        const instant = start + second*1000;
        assert.notEqual(extraRetrogradeAt(stations, instant-1, id), extraRetrogradeAt(stations, instant, id));
      }
    });
    if (year < 2100) assert.equal((initial + changes.length)%2, stations[year+1][id][0]);
  }
}
console.log('PASS: shared red R for natal and relocated charts and comparison rows, optional body stations, and all year boundaries.');

get('changed').checked = true;
get('changed').listeners.change();
assert(get('rows').children.every(row => row.dataset.changed === 'true'));
get('target').value = 'tokyo';
get('controls').listeners.change({ target: { id: 'target' } });
await waitForResults();
assert.equal(get('rows').children.length, 0);
assert.equal(cuspRows().length, 12);
for (const {children} of cuspRows()) {
  assert.deepEqual(cuspPosition(children[1]), cuspPosition(children[2]));
}
console.log('PASS: application entry, official wheel canvases and aspect toggles, point selections, comparison, destination change and house filter.');

async function waitForPng() {
  for (let i = 0; i < 300 && get('png-open').hidden; i++) await new Promise(resolve => setTimeout(resolve, 10));
  assert.equal(get('png-open').hidden, false, get('png-status').textContent);
}
await waitForPng();
const desktopLink = get('png').nextSibling;
assert.equal(get('png').hidden, true);
assert.equal(desktopLink.download, 'hoshitouranai-relocation-1920x1080.png');
assert.match(desktopLink.href, /^blob:/);
assert.equal(get('png-tab').hidden, false);
assert.equal(get('png-tab').href, get('png-image').src);
const png = Buffer.from(await (await fetchBlob(desktopLink.href)).arrayBuffer());
assert.equal(png.readUInt32BE(16), 1920);
assert.equal(png.readUInt32BE(20), 1080);
const exported = canvases.at(-1).getContext('2d');
for (const x of [125, 1045]) {
  const pixels = exported.getImageData(x, 963, 32, 25).data;
  assert(pixels.some((value, i) => i % 4 === 2 && value < 100));
}
const defaultHeader = exported.getImageData(0, 32, 1920, 68).data;
navigator.userAgent = 'Mozilla/5.0 (Macintosh; Intel Mac OS X)';
navigator.maxTouchPoints = 5;
const shared = [];
navigator.canShare = ({files}) => files.length === 1;
navigator.share = event => { shared.push(event); return Promise.resolve(); };
get('chart-title').value = 'Example Name';
get('chart-title').listeners.input();
assert.equal(get('custom-title').textContent, 'Example Name');
assert.equal(desktopLink.removed, true);
await waitForPng();
assert.equal(get('png').hidden, false);
assert.equal(get('png').disabled, false);
assert.equal(get('png-tab').hidden, true);
assert.match(get('png-image').src, /^blob:/);
get('png').listeners.click();
assert.equal(shared.length, 1);
assert.equal(shared[0].files[0].type, 'image/png');
assert.equal(shared[0].files[0].name, desktopLink.download);
const titledHeader = canvases.at(-1).getContext('2d').getImageData(0, 32, 1920, 68).data;
assert.notDeepEqual(defaultHeader, titledHeader);
assert.equal(get('png-download').hidden, false);
assert.match(get('png-download').href, /^blob:/);
navigator.canShare = () => false;
get('png').listeners.click();
assert.equal(get('png-download').clicked, true);
console.log('PASS: desktop native link, iPad file sharing, download fallback and PNG preview URL.');
get('target-lat').value = '78.2';
get('target-lon').value = '15.6';
get('target-custom').listeners.click();
assert.equal(get('target-coordinates').hidden, false);
assert.equal(get('target-lat').focused, true);
await waitForResults();
assert.match(get('target-title').textContent, /78.2000°, 15.6000°/);
assert.match(get('target-house').textContent, /ポーフィリー/);
assert.equal(get('png-download').hidden, true);
get('origin-lat').value = '35.6762';
get('origin-lon').value = '139.6503';
get('origin-custom').listeners.click();
assert.equal(get('origin-coordinates').hidden, false);
assert.equal(get('origin-zone').disabled, false);
await waitForResults();
assert.match(get('status').textContent, /2027-12-21 00:00 UTC/);
console.log('PASS: custom locations, polar fallback, PNG canvas dimensions and download-link lifecycle.');


get('origin').value = 'helsinki';
get('target').value = 'ivalo';
get('houses').value = 'whole';
get('controls').listeners.change({ target: { id: 'origin' } });
await waitForResults();
assert.match(get('target-house').textContent, /^ホールサイン/);
assert.match(get('status').textContent, /2027-12-21 07:00 UTC/);
get('houses').value = 'equal';
get('controls').listeners.change({ target: { id: 'houses' } });
await waitForResults();
assert.match(get('target-house').textContent, /^イコールハウス/);
get('unknown-time').checked = true;
get('changed').checked = false;
get('controls').listeners.change({ target: { id: 'unknown-time' } });
await waitForResults();
assert.match(get('status').textContent, /正午.*10:00 UTC/);
assert.match(get('target-house').textContent, /^サンサイン/);
assert(get('rows').children.every(row => !['ASC','MC','DSC','IC','Vertex','PoF'].includes(row.children[0].children.at(-1))));
get('houses').value = 'natural';
get('controls').listeners.change({ target: { id: 'houses' } });
await waitForResults();
assert.match(get('target-house').textContent, /^ナチュラルハウス/);
console.log('PASS: Finland local time, high-latitude Whole Sign and Equal, unknown-time Solar and Natural houses.');

assert.deepEqual(cuspPosition(cuspRows()[0].children[1]), ['♈\uFE0E','0°00′']);
assert.deepEqual(cuspPosition(cuspRows()[0].children[2]), ['♈\uFE0E','0°00′']);
console.log('PASS: 12 cusp rows, independent of house-change filter, and refreshed for each house system.');
