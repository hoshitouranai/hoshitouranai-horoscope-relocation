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
const zodiacOutlines = [["M854 0Q854 600 711.0 986.5Q568 1373 399 1373Q270 1373 253.0 1274.5Q236 1176 236 1142Q236 1014 320 886H186Q93 1018 93 1179Q93 1311 174.5 1404.5Q256 1498 402 1498Q774 1498 905 725Q913 676 918 636Q922 676 930 725Q1062 1498 1433 1498Q1580 1498 1661.0 1404.5Q1742 1311 1742 1179Q1742 1018 1649 886H1515Q1600 1014 1600 1143Q1600 1177 1583.0 1275.0Q1566 1373 1436 1373Q1268 1373 1125.0 986.5Q982 600 982 0Z",93,0,1742,1498],["M917 860Q770 860 667.0 756.5Q564 653 564.0 506.0Q564 359 667.0 256.0Q770 153 917.0 153.0Q1064 153 1167.5 256.0Q1271 359 1271.0 506.0Q1271 653 1168.5 756.5Q1066 860 917 860ZM917 1010Q1048 1015 1124 1076Q1210 1142 1258.5 1232.0Q1307 1322 1387.5 1409.0Q1468 1496 1653 1496V1388Q1530 1388 1446.5 1232.0Q1363 1076 1232 968Q1211 949 1188 934Q1234 904 1277 863Q1423 714 1423 504Q1423 295 1275.5 147.5Q1128 0 917 0Q709 0 561.0 147.5Q413 295 413 504Q413 714 561 863Q602 905 650 935Q626 949 605 968Q476 1076 390.5 1232.0Q305 1388 183 1388V1496Q368 1496 461.0 1409.0Q554 1322 590.0 1232.0Q626 1142 711 1076Q788 1015 917 1010Z",183,0,1653,1496],["M530 1276Q362 1298 192 1350V1498Q539 1408 919.0 1408.0Q1299 1408 1642 1498V1347Q1466 1300 1300 1276V222Q1466 199 1642 152V0Q1299 91 919.0 91.0Q539 91 192 0V148Q362 201 530 222ZM682 234Q798 247 915 247Q915 247 1148 234V1265Q1032 1252 915 1252Q915 1252 682 1265Z",192,0,1642,1498],["M1251 241Q1345 241 1411.5 307.5Q1478 374 1478.0 469.0Q1478 564 1412.0 630.0Q1346 696 1251.0 696.0Q1156 696 1090.0 630.0Q1024 564 1024.0 469.0Q1024 374 1090.0 307.5Q1156 241 1251 241ZM1060 64Q748 66 566.0 86.0Q384 106 231 149V273Q484 189 666.0 178.0Q848 167 907 167Q1037 167 1029 193Q898 301 898 468Q898 615 1000.5 718.5Q1103 822 1250 822Q1399 822 1502.0 718.5Q1605 615 1605.0 468.0Q1605 321 1501 218Q1428 141 1305.0 103.0Q1182 65 1060 64ZM585 759Q679 759 745.5 825.0Q812 891 812.0 986.0Q812 1081 745.5 1147.0Q679 1213 585.0 1213.0Q491 1213 424.0 1147.0Q357 1081 357.0 986.0Q357 891 423.5 825.0Q490 759 585 759ZM775 1391Q1088 1389 1270.0 1368.5Q1452 1348 1605 1305V1182Q1352 1266 1171.0 1276.5Q990 1287 932 1287Q799 1287 807 1261Q938 1153 938 987Q938 839 835.5 735.5Q733 632 586 632Q437 632 334.0 735.5Q231 839 231 987Q231 1133 335 1236Q408 1313 530.5 1351.5Q653 1390 775 1391Z",231,64,1605.0,1391],["M660 396Q735 425 760.0 481.5Q785 538 785 577Q785 612 771 647Q742 722 685.5 747.0Q629 772 590 772Q554 772 519 758Q444 728 419.5 672.5Q395 617 395 578Q395 543 409 507Q439 431 494.5 406.5Q550 382 589 382Q624 382 660 396ZM672 1134Q672 1295 783.5 1395.5Q895 1496 1075 1496Q1247 1496 1356.0 1385.5Q1465 1275 1465 1099Q1465 912 1320.0 661.0Q1175 410 1175 230Q1179 106 1313 103Q1384 103 1484 191L1549 119Q1422 0 1311 0Q1212 0 1140.0 60.5Q1068 121 1068 232Q1068 431 1211.5 671.5Q1355 912 1355 1106Q1355 1240 1273.0 1322.5Q1191 1405 1059 1405Q932 1405 857.0 1327.5Q782 1250 782 1121Q782 1061 805.0 988.5Q828 916 853 854Q890 756 894.5 692.0Q899 628 899 611Q899 524 867 456Q816 341 700 296Q644 274 588 274Q528 274 441.5 311.5Q355 349 308 469Q286 523 286 579Q286 639 313 699Q364 813 481 859Q536 880 591 880Q667 880 741 839Q749 839 749 852Q749 878 710.5 970.0Q672 1062 672 1134Z",286,0,1549,1496],["M680 1496Q743 1496 802.5 1397.0Q862 1298 862 1170Q902 1289 1001.0 1392.5Q1100 1496 1175 1496Q1237 1496 1278.0 1412.5Q1319 1329 1319 1110V908Q1367 1033 1432.5 1092.5Q1498 1152 1566 1152Q1626 1152 1676.0 1036.0Q1726 920 1726 647Q1726 239 1345 -82Q1346 -176 1492 -369H1324Q1278 -328 1204 -167Q1037 -268 862 -275V-159Q1053 -131 1177 -44L1168 173V1028Q1168 1046 1168 1063Q1168 1344 1122 1345Q1064 1344 997.5 1235.5Q931 1127 868 927V0H717V922Q717 1243 701.5 1296.0Q686 1349 651 1349Q651 1349 650 1349Q650 1349 649 1349Q608 1349 518.5 1236.0Q429 1123 410 908V0H261V1089Q261 1279 109 1470H251Q369 1391 405 1215Q428 1308 519.5 1402.0Q611 1496 680 1496ZM1319 618V58Q1577 308 1601 646Q1601 839 1578.5 908.5Q1556 978 1528 978Q1528 978 1524 978Q1494 978 1422.5 875.0Q1351 772 1319 618Z",109,-369,1726,1496],["M171 259H1665V107H171ZM728 506H171V658H525Q458 762 458 893Q458 1078 586.5 1207.5Q715 1337 900 1337Q1086 1337 1215.5 1207.5Q1345 1078 1345 893Q1345 762 1277 658H1665V506H1072V658H1071Q1089 671 1106 688Q1192 773 1192 894Q1192 1016 1107.0 1101.0Q1022 1186 900.0 1186.0Q778 1186 693.0 1101.0Q608 1016 608 894Q608 773 693 688Q709 671 728 658Z",171,107,1665,1337],["M1280 271Q1280 160 1331.5 97.5Q1383 35 1472 34H1561V152H1565L1768 -21L1565 -196L1561 -192V-74H1472Q1269 -74 1201 46Q1157 120 1149 238L1128 1028Q1128 1046 1128 1063Q1128 1344 1082 1345Q1024 1344 957.5 1235.5Q891 1127 828 927V0H677V922Q677 1243 661.5 1296.0Q646 1349 611 1349Q611 1349 610 1349Q610 1349 609 1349Q568 1349 478.5 1236.0Q389 1123 370 908V0H221V1089Q221 1279 69 1470H211Q329 1391 365 1215Q388 1308 479.5 1402.0Q571 1496 640 1496Q703 1496 762.5 1397.0Q822 1298 822 1170Q862 1289 961.0 1392.5Q1060 1496 1135 1496Q1197 1496 1238.0 1412.5Q1279 1329 1279 1110V908L1280 272Z",69,-196,1768,1496],["M1514 728V1236L809 531L1126 214L1018 106L701 423L277 -1L276 0L170 106L169 107L593 531L276 848L277 849L383 955L384 956L701 639L1406 1344H898V1496H1666V728Z",169,-1,1666,1496],["M851 1496Q958 1496 998.5 1063.0Q1039 630 1064 634Q1173 855 1368 855Q1489 855 1565.5 760.0Q1642 665 1642 562Q1642 417 1570.5 331.5Q1499 246 1357 246Q1202 246 1080 379Q1036 219 973.0 111.5Q910 4 772 0H604V118L758 119Q880 123 985 499Q935 515 903.0 909.5Q871 1304 813 1304Q777 1304 700.0 1070.5Q623 837 623 642Q623 627 623 613L465 611Q465 864 394.5 1112.0Q324 1360 192 1366V1463Q339 1463 419.5 1352.0Q500 1241 540 966Q586 1167 631 1255Q672 1346 733.0 1421.0Q794 1496 851 1496ZM1137 510Q1230 365 1360 365Q1521 365 1530 562Q1523 719 1364 738Q1212 738 1137 510Z",192,0,1642,1496],["M176 413Q501 684 616 684Q661 684 674 644Q698 573 754.0 573.0Q810 573 896.0 644.0Q982 715 1038 715Q1092 715 1116 644Q1142 573 1199.0 573.0Q1256 573 1342 644Q1385 680 1426 680Q1550 680 1659 364L1565 313Q1502 498 1407 498Q1356 498 1296 445Q1210 369 1154.0 369.0Q1098 369 1073 444Q1045 522 986 522Q931 522 848 455Q761 384 706 384Q650 384 625 456Q601 526 547 526Q492 526 363.0 419.5Q234 313 229 313L176 411ZM176 884Q500 1153 616 1153Q660 1153 674 1114Q698 1044 754 1044Q809 1044 895 1114Q982 1186 1037.0 1186.0Q1092 1186 1115 1114Q1142 1044 1198 1044Q1255 1044 1341 1114Q1384 1149 1425 1149Q1550 1149 1659 834L1565 784Q1502 969 1407 969Q1356 969 1296 915Q1209 838 1154 838Q1098 838 1072 914Q1045 992 986 992Q931 992 847 924Q761 853 705 853Q650 853 625 925Q601 997 546.0 997.0Q491 997 362.5 890.5Q234 784 229 784L176 881Z",176,313,1659,1186.0],["M1038 665 797 662Q765 324 487 3L322 0Q629 351 656 662H360V834H656Q628 1144 321 1496L487 1493Q765 1173 797 834H1039Q1070 1173 1349 1493L1514 1496Q1207 1144 1180 834H1475L1474 662H1178Q1207 351 1514 0L1348 3Q1069 324 1038 662Z",321,0,1514,1496]].map(([path,...bounds])=>[new Path2D(path),...bounds]);
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
  for (const size of [42, 38, 34, 30, 26]) {
    const placed = [];
    ctx.font = size + 'px ' + symbol;
    ctx.textAlign = "center";
    for (const [i, lon] of positions.entries()) {
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
