import {zodiacPosition} from './angles.mjs';

export const ANGLE_LABEL_STYLE = Object.freeze({
  sizePerRadius:11/310, offsetPerRadius:9/310, nameWeight:700, degreeWeight:400,
});
export const DOUBLE_WHEEL_STYLE = Object.freeze({
  houseOuterRadius:218, houseFill:'#eef1f3', houseStroke:'#9caab9',
  houseNumberSize:12, houseNumberColor:'#263d59',
  outerRadius:367, outerFallbackRadius:385, outerGlyphScale:1.7,
  aspectFrameLegend:'アスペクト線の端にある丸囲みは内円の天体、四角囲みは外円の天体です。',
});

const OFFSETS = [0,...Array.from({length:29},(_,i)=>[i+1,-i-1]).flat()];
const signed = degrees => ((degrees+540)%360)-180;
const tolerance = 1e-9;

function segmentHitsBox(a,b,box) {
  let lo=0, hi=1;
  for (const [i,center] of [[0,box.x],[1,box.y]]) {
    const delta=b[i]-a[i];
    if (Math.abs(delta)<tolerance) {
      if (Math.abs(a[i]-center)>box.half) return false;
      continue;
    }
    const bounds=[(center-box.half-a[i])/delta,(center+box.half-a[i])/delta].sort((x,y)=>x-y);
    lo=Math.max(lo,bounds[0]);
    hi=Math.min(hi,bounds[1]);
  }
  return lo<=hi;
}

export function layoutBadges(items,point,radii,blocked=[],withinSign=false,checkGuide=false) {
  for (const scale of [1,.82,.66,.52,.42]) {
    const result=tryLayout(items.map(item=>({...item,half:item.half*scale})),point,radii,blocked,withinSign,checkGuide);
    if (result) return result;
  }
  throw new Error('天体が密集しているため、この縮尺で記号を配置できません。');
}

export function tryLayout(items,point,radii,blocked,withinSign,checkGuide) {
  const occupied = [...blocked];
  const result=[];
  for (const item of [...items].sort((a,b)=>a.longitude-b.longitude || a.key.localeCompare(b.key))) {
    let placed;
    const {signIndex}=zodiacPosition(item.longitude);
    search: for (const half of [item.half,item.half*.87,item.half*.73]) {
      for (const offset of OFFSETS) {
        const angle = item.longitude+offset;
        if (withinSign && zodiacPosition(angle).signIndex!==signIndex) continue;
        for (const radius of radii) {
          const [x,y]=point(angle,radius);
          const box={x,y,half};
          if (withinSign) {
            const center = signIndex*30+15;
            const margin = Math.asin(Math.SQRT2*half/radius)*180/Math.PI;
            if (Math.abs(signed(angle-center))+margin>15+tolerance) continue;
          }
          if (occupied.some(other=>Math.abs(x-other.x)<half+other.half+2 && Math.abs(y-other.y)<half+other.half+2)) continue;
          if (checkGuide && blocked.some(axis=>{
            const anchor=point(item.longitude,311);
            const bend=point(item.longitude,318);
            return segmentHitsBox(anchor,bend,axis)||segmentHitsBox(bend,[x,y],axis);
          })) continue;
          occupied.push(box);
          placed={...item,...box,radius,angle};
          break search;
        }
      }
    }
    if (!placed) return null;
    result.push(placed);
  }
  return result;
}

export function comparisonGuides(placements,axes,point,stopBeforeGlyph=false) {
  return placements.map(mark=>{
    const anchor=point(mark.longitude,311);
    const bend=point(mark.longitude,318);
    const target=[mark.x,mark.y];
    // The angle triangle occupies the same rim space as a close planet tick.
    const atAngle=axes.some(axis=>Math.abs(signed(axis.longitude-mark.longitude))<1.25);
    const reserved=[...axes,...placements.filter(other=>other.key!==mark.key)];
    const clear=(from,to)=>reserved.every(box=>!segmentHitsBox(from,to,box));
    const segments=[];
    if (!atAngle && clear(anchor,bend)) segments.push([anchor,bend]);
    const start=atAngle?point(mark.longitude,323):bend;
    const distance=Math.hypot(target[0]-start[0],target[1]-start[1]);
    const stop=stopBeforeGlyph?target.map((value,i)=>value+(start[i]-value)*Math.min(1,mark.half/distance)):target;
    if (clear(start,stop)) segments.push([start,stop]);
    return {key:mark.key,segments};
  });
}

