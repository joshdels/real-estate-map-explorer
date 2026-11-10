import { mediaActions, type MediaAction } from './config';
import { qs } from './dom';
import type { MediaRequest, Property } from './types';

export class DetailsPanel {
  readonly panel = qs<HTMLElement>('#details-panel');
  private readonly scroller = qs<HTMLElement>('.details-scroll', this.panel);
  private readonly closeButton = qs<HTMLButtonElement>('#close-details');
  private readonly toggleButton = qs<HTMLButtonElement>('#toggle-details');
  onClose = (): void => {};

  constructor() {
    this.closeButton.addEventListener('click', () => this.close()); this.toggleButton.addEventListener('click', () => this.setCollapsed(!this.panel.classList.contains('is-collapsed')));
    const mobileWidth = matchMedia('(max-width: 900px)'); const shortLandscape = matchMedia('(max-height: 600px) and (orientation: landscape)');
    const sync = () => { if (!mobileWidth.matches || shortLandscape.matches) this.setCollapsed(false); };
    mobileWidth.addEventListener('change', sync); shortLandscape.addEventListener('change', sync);
  }

  private readonly viewMapButton = qs<HTMLButtonElement>('#detail-view-map');
  private readonly shareButton = qs<HTMLButtonElement>('#detail-share');
  private readonly reportButton = qs<HTMLButtonElement>('#detail-report');
  private readonly galleryButton = qs<HTMLButtonElement>('#property-gallery');
  private readonly minimapButton = qs<HTMLButtonElement>('#property-minimap');
  private readonly actionNote = qs<HTMLElement>('#detail-action-note');

  private note(message: string): void {
    this.actionNote.textContent = message;
    this.actionNote.hidden = false;
  }

  private readonly reportPanel = qs<HTMLElement>('#detail-report-panel');

  open(property: Property, onRoute: () => boolean, onLayout: () => boolean, onMedia: (request: MediaRequest) => void, onViewMap: () => void, onReport: (property: Property, reason: string) => void): void {
    const values: Record<string, string> = { '#property-title': property.title, '#property-address': property.address, '#property-area': property.area,
      '#property-price': new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP', maximumFractionDigits: 0 }).format(property.price),
      '#property-measurements': property.measurements || 'Not specified', '#property-status': property.status, '#property-description': property.description || 'No description supplied.' };
    Object.entries(values).forEach(([selector, value]) => { qs<HTMLElement>(selector).textContent = value; });
    qs<HTMLElement>('#collapsed-property-title').textContent = property.title;
    qs<HTMLElement>('#property-utilities').replaceChildren(...Object.entries(property.utilities || {}).map(([name, value]) => row(name, value)));
    const routes = property.routeLabels?.length ? property.routeLabels : ['No routes configured'];
    qs<HTMLElement>('#property-routes').replaceChildren(...routes.map((route) => { const item = document.createElement('li'); item.textContent = route; return item; }));
    this.renderGallery(property, onMedia);
    qs<HTMLImageElement>('#property-minimap-image').src = staticTileUrl(property.coordinates, 16);
    qs<HTMLElement>('#property-media').replaceChildren(...mediaActions.map((item) => mediaButton(item, property, onRoute, onLayout, onMedia)));
    this.actionNote.hidden = true; this.actionNote.textContent = '';
    this.reportPanel.hidden = true;
    this.reportButton.setAttribute('aria-expanded', 'false');
    this.viewMapButton.onclick = () => onViewMap();
    this.minimapButton.onclick = () => onViewMap();
    this.shareButton.onclick = () => this.shareProperty(property);
    this.reportButton.onclick = () => {
      const open = this.reportPanel.hidden;
      this.reportPanel.hidden = !open;
      this.reportButton.setAttribute('aria-expanded', String(open));
    };
    this.reportPanel.querySelectorAll<HTMLButtonElement>('[data-report-reason]').forEach((button) => {
      button.onclick = () => {
        onReport(property, button.dataset.reportReason || 'Other');
        this.reportPanel.hidden = true;
        this.reportButton.setAttribute('aria-expanded', 'false');
        this.note('Thank you. This listing was flagged and will be reviewed by an admin.');
      };
    });
    this.scroller.scrollTop = 0; this.panel.classList.add('is-open'); this.panel.setAttribute('aria-hidden', 'false'); this.closeButton.focus({ preventScroll: true });
  }

  private renderGallery(property: Property, onMedia: (request: MediaRequest) => void): void {
    const images = property.media?.images?.filter(Boolean) ?? [];
    const image = qs<HTMLImageElement>('#property-gallery-image');
    const placeholder = qs<HTMLElement>('#property-gallery-placeholder');
    const count = qs<HTMLElement>('#property-gallery-count');
    if (images.length > 0) {
      image.src = images[0];
      image.hidden = false;
      placeholder.hidden = true;
      count.hidden = false;
      count.textContent = images.length === 1 ? '1 photo' : `${images.length} photos`;
      this.galleryButton.removeAttribute('aria-disabled');
      this.galleryButton.onclick = () =>
        onMedia({
          title: `${property.title} — Photos`,
          type: 'gallery',
          urls: images,
          isExample: property.id.startsWith('property-'),
        });
    } else {
      image.hidden = true;
      image.removeAttribute('src');
      placeholder.hidden = false;
      count.hidden = true;
      this.galleryButton.setAttribute('aria-disabled', 'true');
      this.galleryButton.onclick = () => this.note('No photos have been supplied for this listing yet.');
    }
  }

  private shareProperty(property: Property): void {
    const url = `${location.origin}/property/${encodeURIComponent(property.id)}`;
    const title = `${property.title} — Smart Property Listing`;
    if (navigator.share) {
      void navigator
        .share({ title, text: property.address, url })
        .then(() => this.note('Share sheet opened.'))
        .catch(() => this.openFacebookShare(url));
      return;
    }
    this.openFacebookShare(url);
  }

  private openFacebookShare(url: string): void {
    const share = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
    const opened = window.open(share, '_blank', 'noopener,noreferrer,width=640,height=640');
    if (opened) {
      this.note('Opened Facebook share in a new tab.');
      return;
    }
    void navigator.clipboard
      ?.writeText(url)
      .then(() => this.note('Pop-up blocked — property link copied to clipboard instead.'))
      .catch(() => this.note(`Copy this link to share: ${url}`));
  }

  setCollapsed(collapsed: boolean): void { this.panel.classList.toggle('is-collapsed', collapsed); this.toggleButton.setAttribute('aria-expanded', String(!collapsed)); this.toggleButton.setAttribute('aria-label', collapsed ? 'Expand property details' : 'Collapse property details'); this.scroller.inert = collapsed; }
  close(): void { if (!this.panel.classList.contains('is-open')) return; this.panel.classList.remove('is-open'); this.panel.setAttribute('aria-hidden', 'true'); this.setCollapsed(false); this.onClose(); }
}

function staticTileUrl([lat, lng]: [number, number], zoom: number): string {
  const n = 2 ** zoom;
  const x = Math.floor(((lng + 180) / 360) * n);
  const latRad = (lat * Math.PI) / 180;
  const y = Math.floor(((1 - Math.asinh(Math.tan(latRad)) / Math.PI) / 2) * n);
  return `https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/${zoom}/${y}/${x}`;
}

function row(name: string, value: string): HTMLElement { const wrap = document.createElement('div'); const dt = document.createElement('dt'); const dd = document.createElement('dd'); dt.textContent = name; dd.textContent = value; wrap.append(dt, dd); return wrap; }
function mediaButton(item: MediaAction, property: Property, onRoute: () => boolean, onLayout: () => boolean, onMedia: (request: MediaRequest) => void): HTMLButtonElement {
  const button = document.createElement('button'); button.type = 'button'; button.className = `feature-button feature-${item.key ?? item.type}`;
  const icon = document.createElement('span'); icon.setAttribute('aria-hidden', 'true'); icon.textContent = item.icon; const label = document.createElement('span'); label.textContent = item.label; button.append(icon, label);
  if (item.type === 'route' || item.type === 'layout') { button.setAttribute('aria-pressed', 'false'); button.addEventListener('click', () => { const active = item.type === 'route' ? onRoute() : onLayout(); button.classList.toggle('is-active', active); button.setAttribute('aria-pressed', String(active)); }); return button; }
  const value = item.key ? property.media?.[item.key] : undefined; const available = Array.isArray(value) ? value.length > 0 : Boolean(value);
  if (available) button.addEventListener('click', () => onMedia({ title: `${property.title} — ${item.label}`, type: item.mediaType!, url: typeof value === 'string' ? value : undefined, urls: Array.isArray(value) ? value : undefined, isExample: property.id.startsWith('property-') }));
  else { button.setAttribute('aria-disabled', 'true'); button.title = `${item.label} asset has not been supplied`; }
  return button;
}
