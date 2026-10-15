import { mediaActions } from './config.js';

export class DetailsPanel {
  constructor() { this.panel = document.querySelector('#details-panel'); this.closeButton = document.querySelector('#close-details'); this.onClose = () => {}; this.closeButton.addEventListener('click', () => this.close()); }
  open(property, onRoute, onLayout, onMedia) {
    const values = { '#property-title': property.title, '#property-address': property.address, '#property-area': property.area,
      '#property-price': new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP', maximumFractionDigits: 0 }).format(property.price),
      '#property-measurements': property.measurements || 'Not specified', '#property-status': property.status, '#property-description': property.description || 'No description supplied.' };
    Object.entries(values).forEach(([selector, value]) => { document.querySelector(selector).textContent = value; });
    document.querySelector('#property-utilities').replaceChildren(...Object.entries(property.utilities || {}).map(([name, value]) => row(name, value)));
    const routes = property.routeLabels?.length ? property.routeLabels : ['No routes configured'];
    document.querySelector('#property-routes').replaceChildren(...routes.map((route) => { const item = document.createElement('li'); item.textContent = route; return item; }));
    document.querySelector('#property-media').replaceChildren(...mediaActions.map((item) => mediaButton(item, property, onRoute, onLayout, onMedia)));
    this.panel.classList.add('is-open'); this.panel.setAttribute('aria-hidden', 'false'); this.closeButton.focus({ preventScroll: true });
  }
  close() { if (!this.panel.classList.contains('is-open')) return; this.panel.classList.remove('is-open'); this.panel.setAttribute('aria-hidden', 'true'); this.onClose(); }
}

function row(name, value) { const wrap = document.createElement('div'); const dt = document.createElement('dt'); const dd = document.createElement('dd'); dt.textContent = name; dd.textContent = Array.isArray(value) ? value.join(', ') : value; wrap.append(dt, dd); return wrap; }
function mediaButton(item, property, onRoute, onLayout, onMedia) {
  const button = document.createElement('button'); button.type = 'button'; button.className = 'feature-button';
  const icon = document.createElement('span'); icon.setAttribute('aria-hidden', 'true'); icon.textContent = item.icon; const label = document.createElement('span'); label.textContent = item.label; button.append(icon, label);
  if (item.type === 'route') {
    button.setAttribute('aria-pressed', 'false');
    button.addEventListener('click', () => { const active = onRoute(); button.classList.toggle('is-active', active); button.setAttribute('aria-pressed', String(active)); });
  } else if (item.type === 'layout') {
    button.setAttribute('aria-pressed', 'false');
    button.addEventListener('click', () => { const active = onLayout(); button.classList.toggle('is-active', active); button.setAttribute('aria-pressed', String(active)); });
  } else if (property.media?.[item.key]) button.addEventListener('click', () => onMedia({ title: `${property.title} — ${item.label}`, url: property.media[item.key], type: item.mediaType, isExample: property.id.startsWith('property-') }));
  else { button.setAttribute('aria-disabled', 'true'); button.title = `${item.label} asset has not been supplied`; }
  return button;
}
