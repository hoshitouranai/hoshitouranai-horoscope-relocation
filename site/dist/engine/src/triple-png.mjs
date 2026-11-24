function imageFrom(svg) {
  const xml = new XMLSerializer().serializeToString(svg);
  const url = URL.createObjectURL(new Blob([xml], {type:'image/svg+xml;charset=utf-8'}));
  const image = new Image();
  return new Promise((resolve,reject) => {
    image.onload = () => { URL.revokeObjectURL(url); resolve(image); };
    image.onerror = () => { URL.revokeObjectURL(url); reject(new Error('図を画像に変換できませんでした。')); };
    image.src = url;
  });
}

export async function makeTriplePng(svg, labels) {
  const image=await imageFrom(svg);
  const canvas=document.createElement('canvas');
  const size=1600;
  const margin=36;
  canvas.width=size;
  canvas.height=size;
  const ctx=canvas.getContext('2d');
  ctx.fillStyle='#fffdf8';
  ctx.fillRect(0,0,size,size);

  const titleLines=labels.title?.match(/.{1,32}/gu)??[];
  const titleHeight=titleLines.length*58;
  const scale=Math.min((size-2*margin)/image.width,(size-2*margin-titleHeight)/image.height);
  const width=image.width*scale;
  const height=image.height*scale;
  const top=(size-height-titleHeight)/2;
  ctx.drawImage(image,(size-width)/2,top+titleHeight,width,height);
  ctx.fillStyle='#14243e';
  ctx.font='bold 48px sans-serif';
  ctx.textAlign='center';
  ctx.textBaseline='middle';
  titleLines.forEach((line,index)=>ctx.fillText(line,size/2,top+29+index*58,size-2*margin));

  const blob=await new Promise((resolve,reject)=>canvas.toBlob(value=>{
    if(value)resolve(value);
    else reject(new Error('PNGを生成できませんでした。'));
  },'image/png'));
  return new File([blob],'hoshitouranai-triple-chart-square.png',{type:'image/png'});
}
