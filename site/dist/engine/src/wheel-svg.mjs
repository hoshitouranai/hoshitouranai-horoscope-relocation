import { spreadGlyphs } from './glyph-layout.mjs';
import {RETROGRADE_MARK,RETROGRADE_COLOR} from './retrograde-display.mjs';
import {zodiacGlyphStyle} from './zodiac-display.mjs';
export {ZODIAC_GLYPHS} from './zodiac-display.mjs';
import {wrap360} from './angles.mjs';
export const ZODIAC_SIGNS=['牡羊座','牡牛座','双子座','蟹座','獅子座','乙女座','天秤座','蠍座','射手座','山羊座','水瓶座','魚座'];
export const PLANET_GLYPHS={'太陽':'☉','月':'☽','水星':'☿','金星':'♀','火星':'♂','木星':'♃','土星':'♄','天王星':'♅','海王星':'♆','冥王星':'♇','ドラゴンヘッド':'☊','キロン':'⚷'};
export function wheelPoint(longitude,radius,asc=0){
 if(!Number.isFinite(longitude)||!Number.isFinite(radius)||!Number.isFinite(asc))throw new RangeError('Non-finite wheel point');
 const rad=(180-wrap360(longitude-asc))*Math.PI/180;
 return [350+radius*Math.cos(rad),350-radius*Math.sin(rad)];
}
// Display longitude counterclockwise while preserving wheelPoint's coordinate API.
function displayPoint(longitude,radius,ascendant) {
 const [x,y]=wheelPoint(longitude,radius,ascendant);
 return [x,700-y];
}
const safeNumber=n=>Number(n.toFixed(4));
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function planetGlyph(planet){
 const glyph=esc(PLANET_GLYPHS[planet.name]??planet.name);
 const mark=planet.retrograde ? `<tspan fill="${RETROGRADE_COLOR}" baseline-shift="super" font-size="60%" data-retrograde="true">${RETROGRADE_MARK}</tspan>` : '';
 return glyph+mark;
}
export function wheelModel({cusps,planets=[],ascendant=cusps?.[0]}={}){
 if(!Array.isArray(cusps)||cusps.length!==12||cusps.some(n=>!Number.isFinite(n)))throw new RangeError('Twelve finite cusps are required');
 if(!Number.isFinite(ascendant))throw new RangeError('Finite ASC is required');
 if(!Array.isArray(planets)||planets.some(p=>!Number.isFinite(p.longitude)||!p.name))throw new RangeError('Invalid planets');
 return {ascendant:wrap360(ascendant),signs:Array.from({length:12},(_,i)=>({index:i,name:ZODIAC_SIGNS[i],boundary:i*30,center:i*30+15})),houses:cusps.map((longitude,i)=>({number:i+1,longitude:wrap360(longitude),center:wrap360(longitude+wrap360(cusps[(i+1)%12]-longitude)/2)})),planets:planets.map(({name,longitude,retrograde=false})=>({name,longitude:wrap360(longitude),retrograde:Boolean(retrograde)}))};
}
export function renderWheelSvg(input){
 const m=wheelModel(input); const parts=['<svg xmlns="http://www.w3.org/2000/svg" width="700" height="700" viewBox="0 0 700 700" role="img" aria-label="ホロスコープ"><rect width="700" height="700" fill="#fff"/>'];
 for(const r of [310,270,210,180])parts.push(`<circle cx="350" cy="350" r="${r}" fill="none" stroke="#34425f" stroke-width="1.5"/>`);
 for(const sign of m.signs){const [x,y]=displayPoint(sign.boundary,310,m.ascendant);parts.push(`<path d="M350 350 L${safeNumber(x)} ${safeNumber(y)}" stroke="#c5c9d3" stroke-width="1"/>`);const [a,b]=displayPoint(sign.center,286,m.ascendant);parts.push(`<text x="${safeNumber(a)}" y="${safeNumber(b)}" font-size="22" text-anchor="middle" dominant-baseline="middle" fill="${zodiacGlyphStyle(sign.index).color}">${zodiacGlyphStyle(sign.index).glyph}</text>`)}
 for(const h of m.houses){const [x,y]=displayPoint(h.longitude,210,m.ascendant);parts.push(`<path d="M350 350 L${safeNumber(x)} ${safeNumber(y)}" stroke="#7f8797" stroke-width="${[1,4,7,10].includes(h.number)?2.5:1}"/>`);const [a,b]=displayPoint(h.center,240,m.ascendant);parts.push(`<text x="${safeNumber(a)}" y="${safeNumber(b)}" font-size="14" text-anchor="middle" dominant-baseline="middle">${h.number}</text>`)}
 const labels = spreadGlyphs(m.planets);
 for (const {planet, labelLongitude} of labels) {
  const [tx, ty] = displayPoint(planet.longitude, 210, m.ascendant);
  const [ex, ey] = displayPoint(planet.longitude, 205, m.ascendant);
  const [lx, ly] = displayPoint(labelLongitude, 203, m.ascendant);
  const difference = Math.min(wrap360(labelLongitude - planet.longitude), wrap360(planet.longitude - labelLongitude));
  if (difference > 0.05) {
   parts.push(`<path data-glyph-leader="true" d="M${safeNumber(tx)} ${safeNumber(ty)} L${safeNumber(ex)} ${safeNumber(ey)} L${safeNumber(lx)} ${safeNumber(ly)}" fill="none" stroke="#586885" stroke-width="1.3"/>`);
  }
 }
 for (const {planet, labelLongitude} of labels) {
  const [x, y] = displayPoint(labelLongitude, 187, m.ascendant);
  parts.push(`<text data-wheel-glyph="true" x="${safeNumber(x)}" y="${safeNumber(y)}" font-size="21" text-anchor="middle" dominant-baseline="middle" paint-order="stroke" stroke="white" stroke-width="2.5" stroke-linejoin="round"><title>${esc(planet.name)} ${safeNumber(planet.longitude)}°</title>${planetGlyph(planet)}</text>`);
 }
 parts.push('</svg>');return parts.join('');
}

/** Draw chart layers from inside out, aligned to the inner chart's ASC. */
export function renderLayeredWheelSvg(charts) {
 if (!Array.isArray(charts)||charts.length<1||charts.length>3) throw new RangeError('Expected one to three charts');
 if (charts.length===1) return renderWheelSvg(charts[0]);
 const [inner,...outer]=charts.map(chart=>wheelModel(chart));
 const layers=[inner,...outer];
 const {ascendant}=inner;
 const parts=['<svg xmlns="http://www.w3.org/2000/svg" width="700" height="700" viewBox="0 0 700 700" role="img" aria-label="重ね円ホロスコープ"><rect width="700" height="700" fill="#fff"/>'];
 const point=(longitude,radius)=>displayPoint(longitude,radius,ascendant).map(safeNumber);
 const line=(longitude,start,end,color)=>{
  const [x,y]=point(longitude,start),[a,b]=point(longitude,end);
  parts.push(`<path d="M${x} ${y} L${a} ${b}" stroke="${color}"/>`);
 };
 for (const radius of [310,270,100, ...layers.slice(1).map((_,i)=>158+56*i)]) {
  parts.push(`<circle cx="350" cy="350" r="${radius}" fill="none" stroke="#34425f"/>`);
 }
 for (const sign of inner.signs) {
  line(sign.boundary,270,310,'#7f8797');
  const [x,y]=point(sign.center,290);
  parts.push(`<text x="${x}" y="${y}" text-anchor="middle" dominant-baseline="middle" font-size="22" fill="${zodiacGlyphStyle(sign.index).color}">${zodiacGlyphStyle(sign.index).glyph}</text>`);
 }
 for (const house of inner.houses) {
  line(house.longitude,45,100,'#7f8797');
  const [x,y]=point(house.center,78);
  parts.push(`<text x="${x}" y="${y}" text-anchor="middle" dominant-baseline="middle" font-size="13">${house.number}</text>`);
 }
 layers.forEach((layer,index)=>{
  const color=['#243a69','#8a3f22','#35624d'][index],radius=129+56*index;
  const label=charts[index].label??['内円','中円','外円'].at(index===1&&layers.length===2?2:index);
  parts.push(`<g aria-label="${esc(label)}" fill="${color}"><title>${esc(label)}</title>`);
  for (const planet of layer.planets) {
   const [x,y]=point(planet.longitude,radius);
   parts.push(`<text x="${x}" y="${y}" text-anchor="middle" dominant-baseline="middle" font-size="19"><title>${esc(planet.name)} ${safeNumber(planet.longitude)}°</title>${planetGlyph(planet)}</text>`);
  }
  parts.push('</g>');
 });
 return parts.join('')+'</svg>';
}
