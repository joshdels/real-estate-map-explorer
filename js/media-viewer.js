export class MediaViewer {
  constructor() {
    this.backdrop = document.querySelector('#media-dialog'); this.stage = document.querySelector('#media-stage'); this.title = document.querySelector('#media-title'); this.caption = document.querySelector('#media-caption');
    document.querySelector('#close-media').addEventListener('click', () => this.close());
    this.backdrop.addEventListener('click', (event) => { if (event.target === this.backdrop) this.close(); });
  }
  open({ title, url, type, isExample }) {
    const safeUrl = validHttpUrl(url); if (!safeUrl) return;
    this.close(); this.title.textContent = title; this.caption.textContent = isExample ? 'Sample media placeholder. Replace this URL in the property manager.' : 'Property media supplied through the local application.';
    this.backdrop.hidden = false;
    if (type === 'panorama') this.#openPanorama(safeUrl);
    else this.stage.replaceChildren(this.#content(safeUrl, type, title));
    document.querySelector('#close-media').focus();
  }
  close() {
    this.viewer?.destroy(); this.viewer = undefined; this.stage.replaceChildren();
    this.backdrop.hidden = true;
  }
  #openPanorama(url) {
    const container = document.createElement('div'); container.className = 'panorama-viewer'; this.stage.replaceChildren(container);
    if (!window.pannellum) { container.textContent = 'The 360° viewer could not load. Check the internet connection and reload.'; return; }
    this.viewer = window.pannellum.viewer(container, { type: 'equirectangular', panorama: url, autoLoad: true, showControls: true, compass: false, escapeHTML: true });
  }
  #content(url, type, title) {
    if (type === 'image') { const image = document.createElement('img'); image.src = url; image.alt = title; return image; }
    const youtubeId = getYouTubeId(url);
    if (youtubeId) return frame(`https://www.youtube-nocookie.com/embed/${youtubeId}?rel=0`, title, 'accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture; fullscreen');
    const video = document.createElement('video'); video.src = url; video.controls = true; video.playsInline = true; return video;
  }
}

function frame(src, title, allow) { const iframe = document.createElement('iframe'); iframe.src = src; iframe.title = title; iframe.allow = allow; iframe.allowFullscreen = true; iframe.referrerPolicy = 'strict-origin-when-cross-origin'; return iframe; }
function validHttpUrl(value) { try { const url = new URL(value); return ['http:', 'https:'].includes(url.protocol) ? url.href : null; } catch { return null; } }
function getYouTubeId(value) { try { const url = new URL(value); if (url.hostname === 'youtu.be') return url.pathname.slice(1).split('/')[0]; if (url.hostname.endsWith('youtube.com')) { if (url.pathname === '/watch') return url.searchParams.get('v'); if (url.pathname.startsWith('/embed/') || url.pathname.startsWith('/shorts/')) return url.pathname.split('/')[2]; } } catch { return null; } return null; }
