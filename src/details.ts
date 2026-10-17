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

  open(property: Property, onRoute: () => boolean, onLayout: () => boolean, onMedia: (request: MediaRequest) => void): void {
    const values: Record<string, string> = { '#property-title': property.title, '#property-address': property.address, '#property-area': property.area,
      '#property-price': new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP', maximumFractionDigits: 0 }).format(property.price),
      '#property-measurements': property.measurements || 'Not specified', '#property-status': property.status, '#property-description': property.description || 'No description supplied.' };
    Object.entries(values).forEach(([selector, value]) => { qs<HTMLElement>(selector).textContent = value; });
    qs<HTMLElement>('#collapsed-property-title').textContent = property.title;
    qs<HTMLElement>('#property-utilities').replaceChildren(...Object.entries(property.utilities || {}).map(([name, value]) => row(name, value)));
    const routes = property.routeLabels?.length ? property.routeLabels : ['No routes configured'];
    qs<HTMLElement>('#property-routes').replaceChildren(...routes.map((route) => { const item = document.createElement('li'); item.textContent = route; return item; }));
    qs<HTMLElement>('#property-media').replaceChildren(...mediaActions.map((item) => mediaButton(item, property, onRoute, onLayout, onMedia)));
    this.scroller.scrollTop = 0; this.panel.classList.add('is-open'); this.panel.setAttribute('aria-hidden', 'false'); this.closeButton.focus({ preventScroll: true });
  }

  setCollapsed(collapsed: boolean): void { this.panel.classList.toggle('is-collapsed', collapsed); this.toggleButton.setAttribute('aria-expanded', String(!collapsed)); this.toggleButton.setAttribute('aria-label', collapsed ? 'Expand property details' : 'Collapse property details'); this.scroller.inert = collapsed; }
  close(): void { if (!this.panel.classList.contains('is-open')) return; this.panel.classList.remove('is-open'); this.panel.setAttribute('aria-hidden', 'true'); this.setCollapsed(false); this.onClose(); }
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
