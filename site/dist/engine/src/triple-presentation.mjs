import {clocksAt} from './world-city.mjs';

export const TRIPLE_TITLE_STYLE = 'overflow-wrap:anywhere;text-align:center';
export const TRIPLE_ANGLE_LABELS = Object.freeze({offset:7.5, baseline:'alphabetic'});

export function tripleClockLabel(db, utcMs, city) {
  const local=clocksAt(db,utcMs,city.timeZone).local.slice(0,16).replace('T',' ');
  return local+'（'+city.name+'）';
}

function el(tag, attrs, text) {
  const node=document.createElementNS('http://www.w3.org/2000/svg',tag);
  for(const [key,value] of Object.entries(attrs)) node.setAttribute(key,value);
  if(text) node.textContent=text;
  return node;
}

export function styleTripleWheel(svg,footer) {
  for(const node of [...footer.children].slice(2))node.remove();
  footer.setAttribute('font-size','16');
  const [brandIcon,brandName]=footer.children;
  brandIcon.setAttribute('x','552');
  brandName.setAttribute('x','590');
  brandName.setAttribute('font-size','17');
  brandIcon.setAttribute('y','671');
  brandName.setAttribute('y','691');
  svg.setAttribute('viewBox','-98 -98 896 936');
  svg.setAttribute('height','936');
  svg.firstElementChild.setAttribute('height','936');
  svg.append(footer);
}

export function appendTripleCornerLabels(svg,middleLabel,labels) {
  const corners=[
    {x:-72,y:-62,align:'start',lines:['ネイタル',labels.birth]},
    {x:772,y:-62,align:'end',lines:[middleLabel,labels.progression]},
    {x:-72,y:691,align:'start',lines:['トランジット',labels.target]},
  ];
  for(const {x,y,align,lines} of corners){
    const group=el('g',{fill:'#14243e','font-family':'system-ui,sans-serif','text-anchor':align});
    lines.forEach((line,index)=>group.append(el('text',{
      x,y:y+[0,27,50][index],'font-size':[20,21,16][index],'font-weight':index<2?700:400,
    },line)));
    svg.append(group);
  }
}
