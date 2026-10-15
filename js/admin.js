export class AdminConsole {
  constructor(store, map, onDataChange) {
    this.store = store; this.map = map; this.onDataChange = onDataChange; this.panel = document.querySelector('#admin-panel'); this.dialog = document.querySelector('#admin-dialog'); this.points = [];
    this.#bindAccess(); this.#bindTabs(); this.#bindForms(); this.refresh();
  }
  requestAccess() { this.dialog.hidden = false; document.querySelector('#admin-passcode').focus(); }
  close() { this.panel.classList.remove('is-open'); this.panel.setAttribute('aria-hidden', 'true'); this.#stopPinning(); this.points = []; this.#renderPoints(); }
  refresh() {
    const data = this.store.snapshot(); this.#renderProperties(data); this.#renderDestinations(data); this.#renderRoutes(data); this.#fillSelects(data); this.#fillUtilities(data.utilities);
  }
  #bindAccess() {
    document.querySelector('#admin-button').addEventListener('click', () => this.requestAccess());
    document.querySelector('#cancel-admin').addEventListener('click', () => this.#closeDialog());
    document.querySelector('#admin-access-form').addEventListener('submit', (event) => {
      event.preventDefault(); const input = document.querySelector('#admin-passcode');
      if (input.value !== 'admin') { document.querySelector('#admin-access-error').textContent = 'Incorrect access passcode.'; return; }
      input.value = ''; document.querySelector('#admin-access-error').textContent = ''; this.#closeDialog(); this.panel.classList.add('is-open'); this.panel.setAttribute('aria-hidden', 'false');
    });
    document.querySelector('#close-admin').addEventListener('click', () => this.close());
  }
  #bindTabs() {
    document.querySelectorAll('[data-admin-tab]').forEach((button) => button.addEventListener('click', () => {
      document.querySelectorAll('[data-admin-tab]').forEach((item) => item.classList.toggle('is-active', item === button));
      document.querySelectorAll('[data-admin-view]').forEach((view) => { view.hidden = view.dataset.adminView !== button.dataset.adminTab; });
      this.#stopPinning();
    }));
  }
  #bindForms() {
    const pinButton = document.querySelector('#pin-boundary');
    pinButton.addEventListener('click', () => {
      const active = !pinButton.classList.contains('is-active'); pinButton.classList.toggle('is-active', active);
      pinButton.textContent = active ? '✓ Finish boundary' : '＋ Start pinning on map';
      this.map.setClickMode(active ? (point) => { this.points.push(point); this.#renderPoints(); this.map.showDraft(this.points); } : null, active ? 'Click the map to add boundary points' : null);
    });
    document.querySelector('#property-form').addEventListener('submit', (event) => {
      event.preventDefault(); if (this.points.length < 3) { alert('Add at least three boundary points on the map.'); return; }
      const form = new FormData(event.currentTarget); const utilities = this.#propertyUtilities(); const center = centroid(this.points);
      this.store.addProperty({ id: crypto.randomUUID(), title: form.get('title').trim(), address: form.get('address').trim(), coordinates: center, polygon: [...this.points], area: form.get('area').trim(), price: Number(form.get('price')), measurements: form.get('measurements').trim(), status: form.get('status'), description: form.get('description').trim(), utilities, routeLabels: [], media: { panoramaUrl: form.get('panoramaUrl').trim(), aerialVideoUrl: form.get('aerialVideoUrl').trim(), walkthroughVideoUrl: form.get('walkthroughVideoUrl').trim() } });
      event.currentTarget.reset(); this.points = []; pinButton.classList.remove('is-active'); pinButton.textContent = '＋ Start pinning on map'; this.map.clearDraft(); this.#changed();
    });
    document.querySelector('#utilities-form').addEventListener('submit', (event) => { event.preventDefault(); const form = new FormData(event.currentTarget); const utilities = {}; for (const [key, value] of form) utilities[key] = value.split(',').map((item) => item.trim()).filter(Boolean); this.store.saveUtilities(utilities); this.#changed(); });
    const locationForm = document.querySelector('#location-form');
    document.querySelector('#use-map-location').addEventListener('click', () => this.map.setClickMode((point) => { locationForm.elements.lat.value = point[0].toFixed(6); locationForm.elements.lng.value = point[1].toFixed(6); this.map.showDraft([point]); this.map.setClickMode(null); }, 'Click the map to choose a destination'));
    locationForm.addEventListener('submit', (event) => { event.preventDefault(); const form = new FormData(event.currentTarget); this.store.addDestination({ id: crypto.randomUUID(), name: form.get('name').trim(), type: form.get('type'), coordinates: [Number(form.get('lat')), Number(form.get('lng'))] }); event.currentTarget.reset(); this.map.clearDraft(); this.#changed(); });
    document.querySelector('#route-form').addEventListener('submit', (event) => { event.preventDefault(); const form = new FormData(event.currentTarget); this.store.addRoute({ id: crypto.randomUUID(), propertyId: form.get('propertyId'), destinationId: form.get('destinationId') }); this.#changed(); });
  }
  #renderPoints() {
    const list = document.querySelector('#boundary-points'); list.replaceChildren(...this.points.map((point, index) => feedPoint(point, index, () => { this.points.splice(index, 1); this.#renderPoints(); this.map.showDraft(this.points); })));
  }
  #renderProperties(data) { document.querySelector('#property-feed').replaceChildren(...data.properties.map((item) => feedItem(item.title, `${item.area} · ${item.status}`, () => { this.store.removeProperty(item.id); this.#changed(); }))); }
  #renderDestinations(data) { document.querySelector('#location-feed').replaceChildren(...data.destinations.map((item) => feedItem(item.name, `${item.type} · ${item.coordinates.map((v) => v.toFixed(4)).join(', ')}`, () => { this.store.removeDestination(item.id); this.#changed(); }))); }
  #renderRoutes(data) { document.querySelector('#route-feed').replaceChildren(...data.routes.map((route) => { const property = data.properties.find((item) => item.id === route.propertyId); const destination = data.destinations.find((item) => item.id === route.destinationId); return feedItem(property?.title || 'Missing property', destination?.name || 'Missing destination', () => { this.store.removeRoute(route.id); this.#changed(); }); })); }
  #fillSelects(data) { fillSelect(document.querySelector('#route-property'), data.properties, 'title'); fillSelect(document.querySelector('#route-destination'), data.destinations, 'name'); }
  #fillUtilities(utilities) { const form = document.querySelector('#utilities-form'); Object.entries(utilities).forEach(([key, values]) => { if (form.elements[key]) form.elements[key].value = values.join(', '); }); }
  #propertyUtilities() { const options = this.store.snapshot().utilities; return Object.fromEntries(Object.entries(options).map(([key, values]) => [key, values.join(', ')])); }
  #changed() { this.refresh(); this.onDataChange(this.store.snapshot()); }
  #closeDialog() { this.dialog.hidden = true; document.querySelector('#admin-button').focus(); }
  #stopPinning() { const button = document.querySelector('#pin-boundary'); button.classList.remove('is-active'); button.textContent = '＋ Start pinning on map'; this.map.clearDraft(); }
}

function centroid(points) { return [points.reduce((sum, point) => sum + point[0], 0) / points.length, points.reduce((sum, point) => sum + point[1], 0) / points.length]; }
function fillSelect(select, items, label) { const current = select.value; select.replaceChildren(...items.map((item) => { const option = document.createElement('option'); option.value = item.id; option.textContent = item[label]; return option; })); if ([...select.options].some((option) => option.value === current)) select.value = current; }
function feedItem(title, detail, onDelete) { const item = document.createElement('article'); item.className = 'feed-item'; const strong = document.createElement('strong'); strong.textContent = title; const small = document.createElement('small'); small.textContent = detail; item.append(strong, small); if (onDelete) { const button = document.createElement('button'); button.type = 'button'; button.textContent = 'Remove'; button.addEventListener('click', onDelete); item.append(button); } return item; }
function feedPoint(point, index, onDelete) { const row = document.createElement('div'); row.className = 'point-row'; const number = document.createElement('b'); number.textContent = index + 1; const text = document.createElement('span'); text.textContent = `${point[0].toFixed(6)}, ${point[1].toFixed(6)}`; const button = document.createElement('button'); button.className = 'mini-delete'; button.type = 'button'; button.textContent = '×'; button.addEventListener('click', onDelete); row.append(number, text, button); return row; }
