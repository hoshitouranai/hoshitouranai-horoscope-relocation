// Keep an explicit download link available even if the browser suppresses the first attempt.
export function savePng(file, url, link) {
  link.href = url;
  link.download = file.name;
  link.hidden = false;

  const appleMobile = isAppleMobile();
  const files = [file];
  if (appleMobile && navigator.share && navigator.canShare?.({files})) {
    navigator.share({files}).catch(() => {});
  } else {
    link.click();
  }
}

const nativeDownloads = new WeakMap();

function isAppleMobile() {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (/Macintosh/.test(navigator.userAgent) && navigator.maxTouchPoints > 1);
}

export function preparePngControl(button, file) {
  const previous = nativeDownloads.get(button);
  if (previous?.href) URL.revokeObjectURL(previous.href);
  previous?.remove();
  nativeDownloads.delete(button);
  button.disabled = !file;
  button.hidden = false;
  if (!file || isAppleMobile()) return;

  const link = document.createElement('a');
  link.className = 'png-download-button';
  link.textContent = button.textContent;
  link.href = URL.createObjectURL(file);
  link.download = file.name;
  button.after(link);
  button.hidden = true;
  nativeDownloads.set(button, link);
}
