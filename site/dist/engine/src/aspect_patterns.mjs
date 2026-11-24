const MAJOR=[[0,'コンジャンクション'],[60,'セクスタイル'],[90,'スクエア'],[120,'トライン'],[150,'インコンジャンクト'],[180,'オポジション']];
const MINOR=[[30,'セミセクスタイル'],[45,'セミスクエア'],[72,'クインタイル'],[135,'セスキスクエア'],[144,'バイクインタイル']];
const LABELS=['太陽','月','水星','金星','火星','木星','土星','天王星','海王星','冥王星','ドラゴンヘッド','キロン'];
const TYPES=[
['Tスクエア',[0,90,180],true],
['グランドトライン',[0,120,240],true],
['ヨッド',[0,60,210],true],
['小三角',[0,60,120],true],
['調停の三角形',[0,60,180],true],
['トールハンマー',[0,90,225],true],
['グランドクロス',[0,90,180,270],true],
['カイト',[0,60,120,240],true],
['ミスティックレクタングル',[0,60,180,240],true],
['クレイドル',[0,60,120,180],true],
['ブーメランヨッド',[0,60,210,30],true],
['グランドクインタイル',[0,72,144,216,288],true],
['グランドセクスタイル',[0,60,120,180,240,300],true]
];
function dist(a,b){const d=Math.abs((((a-b)%360)+540)%360-180);return d;}
function outer(ids){return ids.some(i=>i>=7&&i<=9);}
function target(a,b){return dist(a,b);}
function edges(points){let e=[];for(let i=0;i<points.length;i++)for(let j=i+1;j<points.length;j++){let d=target(points[i],points[j]);if(![0,60,90,120,150,180,30,45,72,135,144].some(x=>Math.abs(d-x)<.000001))continue;e.push([i,j,d]);}return e;}
// Editorial approval 2026-11-13: C1 / B2 / G3 / M1.
// G3: all 15 edges (6 sextiles, 6 trines, 3 oppositions) are mandatory.
const shapes=TYPES.map(([name,pts,ready])=>{
 const all=edges(pts);
 return {name,pts,ready,edges:all,displayEdges:all};
});
function pairList(pos){let result=[];for(let i=0;i<12;i++)for(let j=i+1;j<12;j++){
 let d=dist(pos[i],pos[j]);let limit=outer([i,j])?1:2;
 for(const [ang,name] of MAJOR){if(Math.abs(d-ang)<=limit+1e-9){result.push({i,j,ang,name,delta:Math.abs(d-ang),kind:'major'});break;}}
 for(const [ang,name] of MINOR){if(Math.abs(d-ang)<=1+1e-9){result.push({i,j,ang,name,delta:Math.abs(d-ang),kind:'minor'});break;}}
}return result;}
function detect(pos,extraOrb=0){
 if(!Array.isArray(pos)||pos.length<12||pos.some(v=>!Number.isFinite(v)))return [];
 let matched=[];
 for(const shape of shapes){if(!shape.ready)continue;
   const n=shape.pts.length, chosen=Array(n).fill(-1),used=new Set(), all=shape.edges;
   function dfs(k){
     if(k===n){
       const ids=[...chosen],orb=outer(ids)?1:2;
       // 先に外惑星を選んだか後に選んだかにかかわらず最終の全辺を検証する。
       if(!all.every(([a,b,t])=>Math.abs(dist(pos[ids[a]],pos[ids[b]])-t)<=orb+extraOrb+1e-9))return;
       const requiredEdgeIds=all.map(([a,b,ang])=>[Math.min(ids[a],ids[b]),Math.max(ids[a],ids[b]),ang].join(':')).sort();
       const key=shape.name+':'+requiredEdgeIds.join(',');
       if(!matched.some(x=>x.key===key))matched.push({name:shape.name,ids,key,orb,requiredEdgeIds});
       return;
     }
     for(let i=0;i<12;i++){
       if(used.has(i))continue;
       let ok=true;
       // 剪定には最終許容差より緩い2°を使い、全員選定後に確定判定。
       for(const [a,b,t] of all){
         if(a!==k&&b!==k)continue;
         const other=a===k?b:a;if(other>=k)continue;
         if(Math.abs(dist(pos[i],pos[chosen[other]])-t)>2+Math.max(0,extraOrb)+1e-9){ok=false;break;}
       }
       if(!ok)continue;
       chosen[k]=i;used.add(i);dfs(k+1);used.delete(i);chosen[k]=-1;
     }
   }
   dfs(0);
 }
 return matched.sort((a,b)=>b.ids.length-a.ids.length||a.name.localeCompare(b.name,'ja'));
}
const SIGN_NAMES=['牡羊座','牡牛座','双子座','蟹座','獅子座','乙女座','天秤座','蠍座','射手座','山羊座','水瓶座','魚座'];
const APPROVAL=Object.freeze({S:'S1',N:'N3',P:'P12',D:'D2',R:'R1',E:'E1',C:'C1',B:'B2',G:'G3',M:'M1'});
// S1/N3/P12: full twelve-body concentration; one maximal grouping per sign.
function signConcentrationCandidates(pos,minCount=3){
 const n=Number(minCount);if(!Number.isInteger(n)||n<3)throw Error('minCount must be >= 3');
 if(!Array.isArray(pos)||pos.length<12||pos.some(v=>!Number.isFinite(v)))return [];
 const buckets=Array.from({length:12},()=>[]);
 for(let i=0;i<12;i++)buckets[Math.floor((((pos[i]%360)+360)%360)/30)].push(i);
 return buckets.map((ids,sign)=>({name:'ステリウム',sign,ids,key:'ステリウム:'+sign+':'+ids.join('-'),orb:null}))
  .filter(c=>c.ids.length>=n);
}
// D2: all simultaneously active distinct patterns, including disjoint groups.
// R1: contained pattern is collapsed under a parent, not removed.
function overlapCandidates(found){
 if(!Array.isArray(found))return [];
 const result=[],seen=new Set();
 for(let i=0;i<found.length;i++)for(let j=i+1;j<found.length;j++){
  const a=found[i],b=found[j];if(a.name===b.name&&a.key===b.key)continue;
  const shared=a.ids.filter(id=>b.ids.includes(id));
  const aSet=new Set(a.ids),bSet=new Set(b.ids);
  const aInside=a.ids.every(id=>bSet.has(id))&&(!a.requiredEdgeIds||a.requiredEdgeIds.every(e=>(b.requiredEdgeIds||[]).includes(e)));
  const bInside=b.ids.every(id=>aSet.has(id))&&(!b.requiredEdgeIds||b.requiredEdgeIds.every(e=>(a.requiredEdgeIds||[]).includes(e)));
  // Same set with different pattern types is not automatically a sub-pattern.
  const containment=(a.ids.length<b.ids.length&&aInside)?'a-in-b':(b.ids.length<a.ids.length&&bInside)?'b-in-a':null;
  const pair=[a.key,b.key].sort(),key='複合・重複:'+pair.join('||');
  if(seen.has(key))continue;seen.add(key);
  result.push({key,name:'複合・重複パターン',a:a.key,b:b.key,names:[a.name,b.name],ids:[...new Set([...a.ids,...b.ids])].sort((x,y)=>x-y),shared,containment,disjoint:shared.length===0,childHidden:!!containment});
 }
 return result;
}

export {detect, pairList, signConcentrationCandidates, overlapCandidates, APPROVAL};
