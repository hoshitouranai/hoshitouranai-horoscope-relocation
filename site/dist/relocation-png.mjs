export async function makeRelocationPng(charts, timeLabel, title = '') {
  const canvas = document.createElement('canvas');
  canvas.width = 1920;
  canvas.height = 1080;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('PNGを作成できませんでした。');
  ctx.fillStyle = '#f4f2ed';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#16233d';
  ctx.textAlign = 'center';
  ctx.font = 'bold 45px sans-serif';
  ctx.fillText(title || 'リロケーションチャート', 960, 76, 1740);
  ctx.font = '28px sans-serif';
  ctx.fillText(timeLabel, 960, 124);
  charts.forEach(({ title, canvas: source }, index) => {
    const center = index ? 1420 : 500;
    ctx.fillText(title, center, 200, 820);
    ctx.drawImage(source, center - 400, 218, 800, 800);
  });
  return new Promise((resolve, reject) => canvas.toBlob(blob => {
    if (blob) resolve(blob);
    else reject(new Error('PNGを作成できませんでした。'));
  }, 'image/png'));
}
