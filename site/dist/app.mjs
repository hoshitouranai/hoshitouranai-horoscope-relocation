import {zodiacOutlineData} from './zodiac-outlines.mjs';
import {createYearlyEphemerisLoader} from './yearly-ephemeris.mjs';
import {
  WORLD_CITIES, ZODIAC_SIGNS, zodiacGlyphStyle, PLANET_GLYPHS, loadHistoricalTimezones, civilTimeToUtc, resolveLocation,
  relocationChart, chartSect, pairList,
} from './engine/src/index.mjs';
import { RETROGRADE_COLOR, RETROGRADE_MARK } from './engine/src/retrograde-display.mjs';
import { extraRetrogradeAt } from './points/extra-retrograde.mjs';
import { createAsteroidLookup, wheelLayer } from './points/extra-chart-points.mjs';
import { createLilithLookup } from './points/lilith-years.mjs';
import { houseNumberAt } from './points/relocation-house-comparison.mjs';

import { enableKeyboardDateEntry, normalizeChartDate } from './engine/src/date-entry.mjs';
import { selectHouses } from './relocation-houses.mjs';
import { officialSingleCanvas } from './official-single.mjs';
import { preparePngControl, savePng } from './png-download.mjs';
import { makeRelocationPng } from './relocation-png.mjs';

const $ = id => document.getElementById(id);
enableKeyboardDateEntry([$('date')]);
const finland = {
  helsinki: { name: 'ヘルシンキ', latitude: 60.1699, longitude: 24.9384, timeZone: 'Europe/Helsinki' },
  rovaniemi: { name: 'ロヴァニエミ', latitude: 66.5039, longitude: 25.7294, timeZone: 'Europe/Helsinki' },
  ivalo: { name: 'イヴァロ', latitude: 68.6572, longitude: 27.5397, timeZone: 'Europe/Helsinki' },
};
const labels = {
  vertex: 'Vertex', antiVertex: 'Anti-Vertex', meanLilith: 'Meanリリス', trueLilith: 'Trueリリス',
  ceres: 'セレス', pallas: 'パラス', juno: 'ジュノー', vesta: 'ベスタ', fortune: 'PoF',
};
for (const [id, name] of Object.entries(labels)) {
  const label = document.createElement('label');
  const input = document.createElement('input');
  Object.assign(input, { type: 'checkbox', name: 'point', value: id, checked: id === 'vertex' });
  label.append(input, name);
  $('points').append(label);
}
for (const id of ['origin', 'target']) {
  for (const city of WORLD_CITIES) $(id).add(new Option(city.name, city.id));
  for (const [key, city] of Object.entries(finland)) $(id).add(new Option(city.name, key));
  $(id).add(new Option('緯度・経度を指定', 'custom'));
}
$('origin').value = 'tokyo';
$('target').value = 'sydney';

const binary = async path => {
  const response = await fetch(new URL(path, import.meta.url));
  if (!response.ok) throw new Error('年別データを読み込めません');
  return response.arrayBuffer();
};
const asteroidPositions = createAsteroidLookup(year => binary(`./asteroids/asteroids-${year}.bin`));
const lilithPositions = createLilithLookup(year => binary(`./lilith/lilith-${year}.bin`));
let stationData;
function loadExtraStations() {
  stationData ??= fetch(new URL('./points/extra-stations.json', import.meta.url))
    .then(response => {
      if (!response.ok) throw new Error('逆行データを読み込めません');
      return response.json();
    })
    .catch(error => { stationData = undefined; throw error; });
  return stationData;
}
async function withRetrograde(positions, utcMs, ids) {
  const [points, stations] = await Promise.all([positions(utcMs), loadExtraStations()]);
  return points.map((point, index) => ({
    ...point,
    retrograde: extraRetrogradeAt(stations, utcMs, point.id ?? ids[index]),
  }));
}
const asteroidAt = utcMs => withRetrograde(asteroidPositions, utcMs);
const lilithAt = utcMs => withRetrograde(lilithPositions, utcMs, ['meanLilith', 'trueLilith']);
async function readEngineData(url) {
  if (!url.pathname.endsWith('.json')) return binary(url.href);
  const response = await fetch(url);
  if (!response.ok) throw new Error('天文暦のデータを読み込めません');
  return response.json();
}
const ready = loadHistoricalTimezones();
const ephemerisFor = createYearlyEphemerisLoader(readEngineData);
let generation = 0;
let pngUrl;
let pngFile;
let pngRevision = 0;

function clearPng() {
  pngRevision++;
  if (pngUrl) URL.revokeObjectURL(pngUrl);
  pngUrl = undefined;
  pngFile = undefined;
  preparePngControl($('png'));
  for (const id of ['png-download', 'png-open']) {
    $(id).hidden = true;
    $(id).removeAttribute('href');
  }
  $('png-open').open = false;
  $('png-image').removeAttribute('src');
  $('png-tab').removeAttribute('href');
  $('png-status').textContent = '';
}

function coordinateVisibility() {
  for (const id of ['origin', 'target']) {
    const custom = $(id).value === 'custom';
    $(`${id}-coordinates`).hidden = !custom;
    for (const field of ['lat', 'lon', ...(id === 'origin' ? ['zone'] : [])]) {
      $(`${id}-${field}`).disabled = !custom;
    }
  }
  $('coordinate-help').hidden = ['origin', 'target'].every(id => $(id).value !== 'custom');
}

function location(id) {
  if (Object.hasOwn(finland, $(id).value)) return finland[$(id).value];
  if ($(id).value !== 'custom') return { cityId: $(id).value };
  const latitude = $(`${id}-lat`).valueAsNumber;
  const longitude = $(`${id}-lon`).valueAsNumber;
  return { latitude, longitude, ...(id === 'origin' ? { timeZone: $('origin-zone').value } : {}) };
}

let rows = [];
let aspectChoice = '';

function position(degrees) {
  if (degrees == null) return null;
  const minutes = Math.round(degrees * 60) % 21600;
  const within = minutes % 1800;
  return {
    sign: Math.floor(minutes / 1800),
    degree: `${Math.floor(within / 60)}°${String(within % 60).padStart(2, '0')}′`,
  };
}

function glyph(text, className) {
  const node = document.createElement('span');
  node.className = className;
  node.setAttribute('aria-hidden', 'true');
  node.textContent = text;
  return node;
}

function signCell(row, degrees, retrograde = false) {
  const cell = row.insertCell();
  cell.className = 'sign-cell';
  const value = position(degrees);
  if (!value) {
    cell.textContent = '—';
    return;
  }
  const sign = zodiacGlyphStyle(value.sign);
  const badge = glyph('', 'sign-glyph');
  const [outline, left, bottom, right, top] = zodiacOutlineData[value.sign];
  const ns = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(ns, 'svg');
  svg.setAttribute('viewBox', `${left} ${-top} ${right-left} ${top-bottom}`);
  svg.setAttribute('width', '1em');
  svg.setAttribute('height', '1em');
  svg.setAttribute('aria-hidden', 'true');
  const path = document.createElementNS(ns, 'path');
  path.setAttribute('d', outline);
  path.setAttribute('transform', 'scale(1 -1)');
  path.setAttribute('fill', 'currentColor');
  svg.append(path);
  badge.append(svg);
  badge.style.setProperty('--sign-color', sign.color);
  const degree = document.createElement('span');
  degree.className = 'degree';
  degree.textContent = value.degree;
  cell.append(badge, ZODIAC_SIGNS[value.sign], degree);
  if (retrograde) {
    const mark = document.createElement('span');
    mark.className = 'retrograde';
    mark.textContent = RETROGRADE_MARK;
    mark.setAttribute('aria-label', '逆行');
    mark.style.color = RETROGRADE_COLOR;
    cell.append(mark);
  }
}

function showRows() {
  $('rows').replaceChildren();
  for (const row of rows) {
    const changed = row.houses.every(Number.isInteger) && row.houses[0] !== row.houses[1];
    if ($('changed').checked && !changed) continue;
    const tr = $('rows').insertRow();
    tr.dataset.changed = String(changed);
    const label = document.createElement('th');
    label.scope = 'row';
    if (row.glyph) label.append(glyph(row.glyph, 'body-glyph'));
    label.append(row.name);
    tr.append(label);
    for (const [i, degrees] of row.degrees.entries()) {
      signCell(tr, degrees, row.retrograde[i]);
      const cell = tr.insertCell();
      cell.className = 'house-cell';
      cell.textContent = row.houses[i] ?? '—';
    }
  }
}

function showCusps(charts) {
  const body = $('cusp-rows');
  body.replaceChildren();
  for (let i = 0; i < 12; i++) {
    const row = body.insertRow();
    const label = document.createElement('th');
    label.scope = 'row';
    label.textContent = `${i + 1}ハウス`;
    row.append(label);
    for (const chart of charts) signCell(row, chart.cusps[i]);
  }
}

function wheelPairs(planets, includeExtras) {
  const pairs = pairList(planets.slice(0, 12).map(point => point.longitude));
  if (!includeExtras) return pairs;

  for (let j = 12; j < planets.length; j++) {
    for (let i = 0; i < j; i++) {
      const slot = i >= 7 && i <= 9 ? 7 : 0;
      const positions = Array(12).fill(NaN);
      positions[slot] = planets[i].longitude;
      positions[11] = planets[j].longitude;
      for (const pair of pairList(positions)) pairs.push({ ...pair, i, j });
    }
  }
  return pairs;
}

function selectableAspects(layers) {
  const pairs = layers.map(({ planets }) => wheelPairs(planets, $('extra-aspects').checked).map(pair => {
    const first = planets[pair.i].id ?? planets[pair.i].name;
    const second = planets[pair.j].id ?? planets[pair.j].name;
    return {
      ...pair,
      choice: JSON.stringify([first, second, pair.ang]),
      optionLabel: `${labels[first] ?? first} × ${labels[second] ?? second}　${pair.name} ${pair.ang}°`,
    };
  }));
  const options = new Map(pairs.flat().map(pair => [pair.choice, pair]));
  if (!options.size || (aspectChoice !== 'all' && !options.has(aspectChoice))) aspectChoice = '';

  const picker = $('aspect-pair');
  picker.replaceChildren(new Option('線を表示しない', ''));
  if (aspectChoice === 'all') picker.add(new Option('すべてのアスペクト', 'all'));
  const groups = new Map();
  for (const kind of ['major', 'minor']) {
    const group = document.createElement('optgroup');
    group.label = kind === 'major' ? 'メジャー' : 'マイナー';
    groups.set(kind, group);
  }
  for (const pair of options.values()) {
    groups.get(pair.kind).append(new Option(pair.optionLabel, pair.choice));
  }
  for (const group of groups.values()) if (group.children.length) picker.append(group);
  picker.value = aspectChoice;
  $('all-aspects').disabled = !options.size;
  $('all-aspects').setAttribute('aria-pressed', String(aspectChoice === 'all'));

  return pairs.map(items => aspectChoice === 'all' ? items : items.filter(pair => pair.choice === aspectChoice));
}

async function update() {
  const request = ++generation;
  clearPng();
  $('results').hidden = true;
  $('status').textContent = '計算中…';
  try {
    const t = await ready;
    if (request !== generation) return;
    if (!$('origin-zone').options.length) {
      for (const zone of Object.keys(t.zones).sort()) $('origin-zone').add(new Option(zone, zone));
      $('origin-zone').value = 'Asia/Tokyo';
    }
    const unknown = $('unknown-time').checked;
    const method = $('houses').value;
    const reference = method === 'solar' || method === 'natural';
    const input = {
      date: normalizeChartDate($('date').value), time: unknown ? '12:00' : $('time').value,
      birthLocation: location('origin'), destination: location('target'),
    };
    const origin = resolveLocation(t, input.birthLocation);
    const conversion = civilTimeToUtc(t, {date: input.date, time: input.time, timeZone: origin.timeZone});
    $('ambiguity').hidden = conversion.status !== 'ambiguous';
    let utcMs = conversion.utcMs;
    if (conversion.status === 'ambiguous') {
      const chosen = Number($('candidate').value);
      $('candidate').replaceChildren(new Option('時刻を選択', ''));
      for (const {utcMs: candidate} of conversion.candidates) {
        $('candidate').add(new Option(new Date(candidate).toISOString(), String(candidate)));
      }
      if (!conversion.candidates.some(candidate => candidate.utcMs === chosen)) {
        $('status').textContent = '出生時刻に対応するUTCが2つあります。候補を選んでください。';
        return;
      }
      $('candidate').value = String(chosen);
      utcMs = chosen;
    }
    if (!Number.isSafeInteger(utcMs)) {
      $('status').textContent = '入力された現地時刻を確定できません。日付と時刻を確認してください。';
      return;
    }
    const e = await ephemerisFor(utcMs);
    if (request !== generation) return;
    const result = relocationChart(e, t, {...input, birthUtcMs: utcMs});
    const selection = new FormData($('controls')).getAll('point').filter(id =>
      !reference || !['vertex','antiVertex','fortune'].includes(id));
    const charts = [result.natal, result.relocated].map(chart => selectHouses(chart, method));
    const layers = await Promise.all(charts.map(chart => {
      const mode = $('fortune').value;
      const { latitude, longitude } = chart.location;
      const sect = mode === 'sect' && selection.includes('fortune')
        ? chartSect(chart, latitude, longitude).sect : null;
      return wheelLayer(chart, selection, { asteroidAt, lilithAt, fortune: { mode, sect } });
    }));
    if (request !== generation) return;
    const points = layers.map(({planets}) => new Map(planets.map(p => [p.id ?? p.name, p])));
    const pointGlyphs = new Map(layers.flatMap(({planets}) => planets.filter(point => point.id).map(point => [point.id, point.name])));
    const names = [...result.natal.bodies.map(body => body.name), ...selection, ...(!reference ? ['ASC', 'MC', 'DSC', 'IC'] : [])];
    charts.forEach((chart,i) => {
      for (const [id, longitude] of [
        ['ASC', chart.asc], ['MC', chart.mc], ['DSC', (chart.asc + 180) % 360], ['IC', (chart.mc + 180) % 360],
      ]) points[i].set(id, { longitude });
    });
    rows = names.map(id => {
      const bodies = points.map(chart => chart.get(id));
      const degrees = bodies.map(body => body?.longitude);
      const houses = degrees.map((degree, i) => degree == null || ['ASC','MC','DSC','IC'].includes(id)
        ? null : houseNumberAt(degree, charts[i].cusps));
      return { name: labels[id] ?? id, glyph: PLANET_GLYPHS[id] ?? pointGlyphs.get(id), degrees, houses, retrograde: bodies.map(body => Boolean(body?.retrograde)) };
    });
    const show = { major: true, minor: true };
    const utc = new Date(result.utcMs).toISOString().slice(0,16).replace('T',' ');
    const titles = charts.map((chart, i) => {
      const id = i ? 'target' : 'origin';
      const { latitude, longitude } = chart.location;
      const city = $(id).value === 'custom'
        ? `${latitude.toFixed(4)}°, ${longitude.toFixed(4)}°` : $(id).selectedOptions[0].text;
      return `${i ? '移転図' : '出生図'} · ${city}`;
    });
    const aspectPairs = selectableAspects(layers);
    const images = await Promise.all(layers.map((layer, i) => officialSingleCanvas({
      ...charts[i], ...layer, pairs: aspectPairs[i],
    }, titles[i], `${utc} UTC`, show, { wheelOnly: true })));
    if (request !== generation) return;
    for (const [i, prefix] of ['birth', 'target'].entries()) {
      $(`${prefix}-title`).textContent = titles[i];
      const count = aspectPairs[i].length;
      $(`${prefix}-house`).textContent = `${charts[i].house} · アスペクト ${count}組`;
      $(`${prefix}-wheel`).replaceChildren(images[i]);
    }
    showRows();
    showCusps(charts);
    $('results').hidden = false;
    $('status').textContent = unknown
      ? `出生時刻不明 · 出生地の正午を仮の時刻に使用（${utc} UTC）。月・アスペクトは参考値です。`
      : reference
        ? `共通の出生時刻 · ${utc} UTC。基準ハウスは地点間で共通です。`
        : `共通の出生時刻 · ${utc} UTC`;
    void prepareCurrentPng();
  } catch (error) {
    if (request === generation) $('status').textContent = error.message;
  }
}

$('controls').addEventListener('submit', event => { event.preventDefault(); void update(); });
function syncHouseControls() {
  const unknown = $('unknown-time').checked;
  $('time').disabled = unknown;
  for (const option of $('houses').options) {
    option.disabled = unknown && option.value !== 'solar' && option.value !== 'natural';
  }
  if (unknown && !['solar','natural'].includes($('houses').value)) $('houses').value = 'solar';
  const reference = ['solar','natural'].includes($('houses').value);
  for (const input of $('points').querySelectorAll('input')) {
    input.disabled = reference && ['vertex','antiVertex','fortune'].includes(input.value);
  }
}

$('controls').addEventListener('change', event => {
  if (event.target.id === 'chart-title') return;
  if (event.target.id === 'aspect-pair') aspectChoice = $('aspect-pair').value;
  syncHouseControls();
  coordinateVisibility();
  if (['date', 'time', 'origin', 'origin-zone', 'unknown-time'].includes(event.target.id)) $('candidate').replaceChildren();
  if ($('controls').checkValidity()) void update();
  else {
    generation++;
    clearPng();
    $('results').hidden = true;
    $('status').textContent = '日付・時刻・座標を入力してください。';
  }
});
function showCustomTitle() {
  const title = $('chart-title').value.trim();
  $('custom-title').textContent = title || 'リロケーションチャート';
}

$('chart-title').addEventListener('input', () => {
  showCustomTitle();
  if (!$('results').hidden) void prepareCurrentPng();
});

async function prepareCurrentPng() {
  clearPng();
  const request = pngRevision;
  $('png-status').textContent = 'PNGを準備中…';
  try {
    const charts = ['birth', 'target'].map(id => ({
      canvas: $(`${id}-wheel`).querySelector('canvas'),
      title: $(`${id}-title`).textContent,
    }));
    const blob = await makeRelocationPng(charts, $('status').textContent, $('chart-title').value.trim());
    if (request !== pngRevision) return;
    pngFile = new File([blob], 'hoshitouranai-relocation-1920x1080.png', { type: 'image/png' });
    pngUrl = URL.createObjectURL(pngFile);
    $('png-image').src = pngUrl;
    $('png-tab').href = pngUrl;
    $('png-open').hidden = false;
    preparePngControl($('png'), pngFile);
    $('png-tab').hidden = !$('png').hidden;
    $('png-status').textContent = '';
  } catch (error) {
    if (request === pngRevision) $('png-status').textContent = error.message;
  }
}

$('png').addEventListener('click', () => {
  if (pngFile && pngUrl) savePng(pngFile, pngUrl, $('png-download'));
});
for (const id of ['origin', 'target']) {
  $(`${id}-custom`).addEventListener('click', () => {
    $(id).value = 'custom';
    $(id).dispatchEvent(new Event('change', { bubbles: true }));
    $(`${id}-lat`).focus();
  });
}
$('all-aspects').addEventListener('click', () => {
  aspectChoice = aspectChoice === 'all' ? '' : 'all';
  void update();
});
$('changed').addEventListener('change', showRows);
void update();
