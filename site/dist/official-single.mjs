import {zodiacOutlineData} from './zodiac-outlines.mjs';
import {chartWordmark} from './chart-wordmark.mjs';
import {spreadGlyphs} from './engine/src/glyph-layout.mjs';
import {RETROGRADE_COLOR,RETROGRADE_MARK} from './engine/src/retrograde-display.mjs';
import {BRAND_ICON_DATA} from './engine/brand/icon-data.mjs';
// Rendering adapted from the pinned public Single Chart.
import {degreeTicks,angleMarkers} from './engine/src/index.mjs';
import {angleLabelStyle} from './design.mjs';
import {ZODIAC_COLORS,zodiacDegreeDisplay} from './engine/src/zodiac-display.mjs';
const brandIcon = new Image();
brandIcon.src = BRAND_ICON_DATA;

function frame(canvas,data,title,metadata) {
const ctx=canvas.getContext('2d');
const signs = ['牡羊','牡牛','双子','蟹','獅子','乙女','天秤','蠍','射手','山羊','水瓶','魚'];
const zodiac = [...'♈♉♊♋♌♍♎♏♐♑♒♓'];
const names = ['太陽','月','水星','金星','火星','木星','土星','天王星','海王星','冥王星','ドラゴンヘッド','キロン'];
const glyphs = [...'☉☽☿♀♂♃♄♅♆♇☊⚷'];
if (data.wheelOnly) {
  for (const name of data.additionalGlyphs) {
    names.push(name);
    glyphs.push(name);
  }
}
const colors = ZODIAC_COLORS;
const paleColors = colors.map(color => 'rgb('+[1,3,5].map(i=>Math.round(204+parseInt(color.slice(i,i+2),16)*.2)).join(',')+')');
const planetColors = ['#BA830F','#597597','#666F80','#328957','#B7424C','#3469B7','#344B6D','#288CA8','#4D83B7','#353B4A','#397E78','#794B93'];
const font = '"Yu Gothic","Meiryo","Noto Sans CJK JP",sans-serif';
const displayFont = '"Yu Mincho","Hiragino Mincho ProN","Noto Serif CJK JP",serif';
const symbol = '"Segoe UI Symbol","Noto Sans Symbols 2","DejaVu Sans",sans-serif';
const rad = Math.PI / 180;
const wrap = angle => ((angle % 360) + 360) % 360;
const cx = 560, cy = 587;
function label(text, x, y, size, color='#eef2ff', align='left', family=font, width=undefined, weight=400) {
  ctx.fillStyle = color;
  ctx.font = weight + ' ' + size + 'px ' + family;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  if (width === undefined) ctx.fillText(text, x, y);
  else ctx.fillText(text, x, y, width);
}
function line(a, b, color, width=1) {
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.beginPath(); ctx.moveTo(...a); ctx.lineTo(...b); ctx.stroke();
}
function circle(radius, color, width=1) {
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.beginPath(); ctx.arc(cx, cy, radius, 0, 2*Math.PI); ctx.stroke();
}
/* Zodiac outlines from DejaVu Sans.
Copyright: Copyright (c) 2003 by Bitstream, Inc. All Rights Reserved. 
 Bitstream Vera is a trademark of Bitstream, Inc.
 DejaVu changes are in public domain.
License: bitstream-vera
 Permission is hereby granted, free of charge, to any person obtaining a copy
 of the fonts accompanying this license ("Fonts") and associated
 documentation files (the "Font Software"), to reproduce and distribute the
 Font Software, including without limitation the rights to use, copy, merge,
 publish, distribute, and/or sell copies of the Font Software, and to permit
 persons to whom the Font Software is furnished to do so, subject to the
 following conditions:
 .
 The above copyright and trademark notices and this permission notice shall
 be included in all copies of one or more of the Font Software typefaces.
 .
 The Font Software may be modified, altered, or added to, and in particular
 the designs of glyphs or characters in the Fonts may be modified and
 additional glyphs or characters may be added to the Fonts, only if the fonts
 are renamed to names not containing either the words "Bitstream" or the word
 "Vera".
 .
 This License becomes null and void to the extent applicable to Fonts or Font
 Software that has been modified and is distributed under the "Bitstream
 Vera" names.
 .
 The Font Software may be sold as part of a larger software package but no
 copy of one or more of the Font Software typefaces may be sold by itself.
 .
 THE FONT SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
 OR IMPLIED, INCLUDING BUT NOT LIMITED TO ANY WARRANTIES OF MERCHANTABILITY,
 FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT OF COPYRIGHT, PATENT,
 TRADEMARK, OR OTHER RIGHT. IN NO EVENT SHALL BITSTREAM OR THE GNOME
 FOUNDATION BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, INCLUDING
 ANY GENERAL, SPECIAL, INDIRECT, INCIDENTAL, OR CONSEQUENTIAL DAMAGES,
 WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF
 THE USE OR INABILITY TO USE THE FONT SOFTWARE OR FROM OTHER DEALINGS IN THE
 FONT SOFTWARE.
 .
 Except as contained in this notice, the names of Gnome, the Gnome
 Foundation, and Bitstream Inc., shall not be used in advertising or
 otherwise to promote the sale, use or other dealings in this Font Software
 without prior written authorization from the Gnome Foundation or Bitstream
 Inc., respectively. For further information, contact: fonts at gnome dot
 org.
*/
const zodiacOutlines = zodiacOutlineData.map(([path,...bounds])=>[new Path2D(path),...bounds]);
function drawZodiac(sign,x,y,size,color,outline=false) {
  const [path,left,bottom,right,top]=zodiacOutlines[sign];
  const scale=size*.82/Math.max(right-left,top-bottom);
  ctx.save();
  ctx.translate(x,y);
  ctx.scale(scale,-scale);
  ctx.translate(-(left+right)/2,-(bottom+top)/2);
  if (outline) {
    ctx.strokeStyle='#22334c';
    ctx.lineWidth=1.4/scale;
    ctx.lineJoin='round';
    ctx.stroke(path);
  }
  ctx.fillStyle=color;
  ctx.fill(path);
  ctx.restore();
}

function degrees(lon) {
  const minutes = Math.floor((lon % 30) * 60);
  return Math.floor(minutes / 60) + '°' + String(minutes % 60).padStart(2,'0') + '′';
}
function placePlanets(positions, retro, point) {
  for (const baseSize of [42, 38, 34, 30, 26]) {
    const placed = [];
    ctx.textAlign = "center";
    for (const [i, lon] of positions.entries()) {
      const size = i < 12 ? baseSize : Math.round(baseSize * .65);
      ctx.font = size + 'px ' + symbol;
      const metrics = ctx.measureText(glyphs[i]);
      const halfWidth = Math.max(metrics.actualBoundingBoxLeft, metrics.actualBoundingBoxRight) + 3;
      const left = halfWidth;
      const right = halfWidth + ((retro & (1<<i)) ? 15 : 0);
      for (let radius=266; radius>=107; radius-=11) {
        const [x,y]=point(lon,radius);
        if (placed.some(p=>x-left<p.x+p.right && x+right>p.x-p.left && Math.abs(p.y-y)<(p.size+size)*.55)) continue;
        placed.push({i,x,y,size,left,right,halfWidth});
        break;
      }
    }
    if (placed.length===positions.length) return placed;
  }
  if (!data.wheelOnly) throw Error('天体記号を配置できませんでした。');
  const labels = spreadGlyphs(positions.map((longitude, i) => ({ longitude, i })));
  const placed = [];
  for (const {planet, labelLongitude} of labels) {
    const [x,y] = point(labelLongitude, 246);
    const [fromX,fromY] = point(planet.longitude, 270);
    const [toX,toY] = point(labelLongitude, 264);
    line([fromX,fromY],[toX,toY],'#586885',1.5);
    placed[planet.i] = {i:planet.i,x,y,size:30,halfWidth:27};
  }
  return placed;
}
function houseNumberPositions(cusps, point, radius) {
  const centers=cusps.map((cusp,i)=>{
    const span=wrap(cusps[(i+1)%12]-cusp);
    const [x,y]=point(cusp+span/2,radius);
    return {text:String(i+1),x,y};
  });
  const layout=size=>centers.map(({text,x,y})=>({
    text,x,y,size,width:text.length===1?size*.34+1:size*.62+1,height:size*.48+1
  }));
  for (const size of [18,16,14,12,10]) {
    const numbers=layout(size);
    const overlaps=numbers.some((a,i)=>numbers.slice(i+1).some(b=>
      Math.abs(a.x-b.x)<a.width+b.width+2 && Math.abs(a.y-b.y)<a.height+b.height+2
    ));
    if (!overlaps) return numbers;
  }
  return layout(9);
}
function drawHouseNumbers(cusps, point, radius, ink) {
  for (const {text,x,y,size} of houseNumberPositions(cusps,point,radius)) {
    label(text,x,y,size,ink,'center','Arial',undefined,'bold');
  }
}
const aspectStyles = [
  [0,'合','#966216',[]], [60,'セクスタイル','#256c6b',[]], [90,'スクエア','#a63249',[]],
  [120,'トライン','#256c6b',[]], [150,'クインカンクス','#6c4087',[7,5]],
  [180,'オポジション','#a63249',[]]
];
function drawAspects(pairs, placed, selected) {
  for (const pair of pairs) {
    if (selected!=='all' && pair.key!==selected) continue;
    const a=placed[pair.i], b=placed[pair.j];
    ctx.setLineDash(pair.dash);
    line([a.x,a.y],[b.x,b.y],pair.color,selected==='all'?2.6:4.1);
    ctx.setLineDash([]);
  }
}
function paint(data, title, metadata) {
  const ink='#101e36', secondary='#4f4234', rule='#b79b6e', edge='#22334c';
  const chartPaper='#fffbf0';
  const gold=ctx.createLinearGradient(0,145,1920,1080);
  gold.addColorStop(0,'#fff9ed'); gold.addColorStop(.55,'#f8eed9'); gold.addColorStop(1,'#efdfbf');
  ctx.fillStyle=gold; ctx.fillRect(0,0,1920,1080);
  if (!data.wheelOnly) {
  ctx.fillStyle='#0d1a32'; ctx.fillRect(0,0,1920,150);
  for (const [top,height] of [[204,512],[732,237]]) {
    ctx.beginPath(); ctx.roundRect(1065,top,780,height,20);
    ctx.fillStyle='#fffbf1'; ctx.fill();
    ctx.strokeStyle='#a48758'; ctx.lineWidth=2.7; ctx.stroke();
  }
  label(title,960,58,53,'#f9e6b8','center',displayFont,1700,600);
  label(metadata,960,117,27,'#f2dcb0','center',font,undefined,500);
  line([0,150],[1920,150],'#bd9858',3);
  }

  const angle = lon => Math.PI-(lon-data.asc)*rad;
  const point = (lon,r) => [cx+r*Math.cos(angle(lon)),cy+r*Math.sin(angle(lon))];
  const outer=351, inner=outer*.86, houseNumberRadius=73;

  ctx.fillStyle=chartPaper;
  ctx.beginPath(); ctx.arc(cx,cy,outer,0,2*Math.PI); ctx.fill();
  for (let i=0;i<12;i++) {
    const start=angle(i*30), end=angle((i+1)*30);
    ctx.beginPath();
    ctx.arc(cx,cy,outer,start,end,true);
    ctx.arc(cx,cy,inner,end,start);
    ctx.closePath();
    ctx.fillStyle=paleColors[i]; ctx.fill();
    line(point(i*30,inner),point(i*30,outer),edge,1.6);
    drawZodiac(i,...point(i*30+15,outer*.93),42,colors[i],true);
    line([cx,cy],point(data.cusps[i],inner),[0,3,6,9].includes(i)?'#647389':'#a4a6a7',1.7);
  }
  circle(outer,edge,3.2); circle(inner,edge,2.1);
  for (const tick of degreeTicks(point,inner-2,1.25)) line(tick.from,tick.to,'#586577',tick.width);
  const placed=placePlanets(data.positions,data.retro,point);
  const selected=data.pairs.length > 1 ? 'all' : data.pairs[0]?.key ?? '';
  if (selected) drawAspects(data.pairs,placed,selected);
  drawHouseNumbers(data.cusps,point,houseNumberRadius,ink);
  const focused=data.pairs.find(pair=>pair.key===selected);
  const angleSize = outer * angleLabelStyle.sizePerRadius;
  const angleOffset = outer * angleLabelStyle.offsetPerRadius;
  for (const axis of data.referenceOnly ? [] : angleMarkers(data,point,outer,1.15)) {
    const {name,longitude:lon,triangle}=axis;
    const closeToHorizon = Math.min(wrap(lon-data.asc)%180,180-wrap(lon-data.asc)%180)<9;
    const radius=outer+((name==='MC'||name==='IC') && closeToHorizon ? 91 : 33);
    const [x,y]=point(lon,radius);
    ctx.beginPath();
    ctx.moveTo(...triangle[0]);
    for (const vertex of triangle.slice(1)) ctx.lineTo(...vertex);
    ctx.closePath();
    ctx.fillStyle=ink;
    ctx.fill();
    label(name,x,y-angleOffset,angleSize,ink,'center','Arial',undefined,angleLabelStyle.nameWeight);
    const {glyph,color,degreeText} = zodiacDegreeDisplay(lon);
    ctx.font = angleLabelStyle.degreeWeight+' '+angleSize+'px '+symbol;
    const left=x-ctx.measureText(glyph+' '+degreeText).width/2;
    label(glyph,left,y+angleOffset,angleSize,color,'left',symbol,undefined,angleLabelStyle.degreeWeight);
    label(' '+degreeText,left+ctx.measureText(glyph).width,y+angleOffset,angleSize,ink,'left',symbol,undefined,angleLabelStyle.degreeWeight);
  }
  for (const {i,x,y,size,halfWidth} of placed) {
    const glyphX=x;
    ctx.fillStyle=chartPaper;
    ctx.fillRect(glyphX-halfWidth,y-size*.52,halfWidth*2+((data.retro & (1<<i))?15:0),size*1.04);
    if (focused && (i===focused.i || i===focused.j)) {
      ctx.beginPath(); ctx.arc(x,y,26,0,2*Math.PI);
      ctx.fillStyle=chartPaper; ctx.fill();
      ctx.strokeStyle=focused.color; ctx.lineWidth=2.5; ctx.stroke();
    }
    label(glyphs[i],glyphX,y,size,planetColors[i]??'#33496c','center',symbol);
    if (data.retro & (1<<i)) label(RETROGRADE_MARK,glyphX+halfWidth,y+size*.31,15,RETROGRADE_COLOR,'left','Arial');
  }

  if (data.wheelOnly) return;
  line([1038,224],[1038,929],rule,1.5);
  label('対象日時の天体位置（12項目）',1095,236,29,ink,'left',font,undefined,650);
  label('天体',1095,268,20,secondary);
  label('サイン',1496,268,20,secondary,'center');
  label('度数',1733,268,20,secondary,'right');
  line([1095,287],[1816,287],rule,1.5);
  data.positions.forEach((p,i) => {
    const y=308+i*31, sign=Math.floor(p/30);
    label(glyphs[i],1111,y,27,planetColors[i],'center',symbol);
    label(names[i],1143,y,27,ink,'left',font,undefined,550);
    drawZodiac(sign,1496,y,28,colors[sign]);

    label(degrees(p),1733,y,27,ink,'right',font,undefined,600);
    if (data.retro & (1<<i)) label(RETROGRADE_MARK,1790,y,22,RETROGRADE_COLOR,'center','Arial');
  });
  line([1095,669],[1816,669],rule,1.5);
  label('Swiss Ephemeris  ｜  True Node',1095,691,18,secondary);

  label('ハウスカスプ',1095,760,25,ink,'left',font,undefined,650);
  line([1095,781],[1816,781],rule,1.5);
  const axes={0:'ASC',3:'IC',6:'DSC',9:'MC'};
  data.cusps.forEach((cusp,i)=>{
    const x=1095+246*Math.floor(i/4), y=807+41*(i%4);
    const house=(data.house==='プラシーダス' ? axes[i] : undefined) ?? String(i+1).padStart(2,'0');
    label(house,x+48,y,19,secondary,'right','Arial',undefined,650);
    const sign=Math.floor(cusp/30);
    drawZodiac(sign,x+65,y,24,colors[sign]);
    label(degrees(cusp),x+84,y,21,ink,'left',font,145,550);
  });
  if (focused) {
    label(focused.title,1095,1007,25,focused.color,'left',font,720,650);
  } else if (selected==='all') {
    label('アスペクト　'+data.pairs.length+'組',1095,1007,22,ink,'left',font,undefined,650);
    
  }
  const word='HOSHITOURANAI';
  const brandX=104;
  ctx.drawImage(brandIcon,brandX,969,32,32);
  label(word,brandX+45,985,21,ink,'left','Arial',undefined,650);
}

paint(data,title,metadata);
}

function namesForPair(chart,pair) {
  return chart.planets[pair.i].name+' × '+chart.planets[pair.j].name+'　'+pair.name+' '+pair.ang+'°';
}

export async function officialSingleCanvas(chart,title,metadata,show,{wheelOnly=false}={}) {
  if (!brandIcon.complete) await brandIcon.decode();
  const canvas=document.createElement('canvas');
  canvas.width=1920;
  canvas.height=1080;
  const colors = {0:'#966216',60:'#256c6b',90:'#a63249',120:'#256c6b',150:'#6c4087',180:'#a63249'};
  const data={...chart,wheelOnly,additionalGlyphs:chart.planets.slice(12).map(body=>body.name),positions:chart.planets.map(body=>body.longitude),
    retro:chart.planets.reduce((bits,body,i)=>bits|(body.retrograde?1<<i:0),0),
    pairs:chart.pairs.filter(pair=>show[pair.kind]).map(pair=>({...pair,key:'selected',title:namesForPair(chart,pair),color:colors[pair.ang]??'#6c4087',dash:pair.kind==='minor'||pair.ang===150?[7,5]:[]}))};
  frame(canvas,data,title,metadata);
  if (wheelOnly) {
    const wheel = document.createElement('canvas');
    wheel.width = 960;
    wheel.height = 960;
    wheel.setAttribute('role','img');
    wheel.setAttribute('aria-label',title);
    const ctx = wheel.getContext('2d');
    ctx.fillStyle = '#fff9ed';
    ctx.fillRect(0,0,960,960);
    ctx.drawImage(canvas,80,107,960,960,24,0,912,912);
    ctx.drawImage(brandIcon, 30, 892, 48, 48);
    ctx.drawImage(await chartWordmark(), 91, 907, 182, 17);
    return wheel;
  }
  canvas.setAttribute('aria-label',title+'、天体位置表、ハウスカスプ表');
  return canvas;
}
