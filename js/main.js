import { AdminConsole } from './admin.js';
import { config } from './config.js';
import { DetailsPanel } from './details.js';
import { MapController } from './map-controller.js';
import { MediaViewer } from './media-viewer.js';
import { PropertyStore } from './store.js';

document.title = config.title;
const status = document.querySelector('#app-status');

if (!window.L) {
  status.hidden = false;
  status.textContent = 'The interactive map library could not load. Check your internet connection and reload the page.';
} else {
  start().catch((error) => {
    console.error(error);
    status.hidden = false;
    status.textContent = 'The sample dataset could not load. Serve the project over HTTP and check data/data.json.';
  });
}

async function start() {
  const store = await PropertyStore.create();
  renderAgent(store.snapshot().agent);
  const details = new DetailsPanel();
  const media = new MediaViewer();
  let map;
  let admin;

  map = new MapController((property) => {
    const data = store.snapshot();
    const routeLabels = data.routes.filter((route) => route.propertyId === property.id).map((route) => data.destinations.find((item) => item.id === route.destinationId)?.name).filter(Boolean);
    details.open({ ...property, routeLabels }, () => map.toggleRoutes(property), () => map.toggleMeasurements(property), (item) => media.open(item));
  });
  admin = new AdminConsole(store, map, (data) => { details.close(); map.render(data); });
  details.onClose = () => map.clearSelection();
  map.render(store.snapshot());

  document.querySelector('#home-button').addEventListener('click', () => {
    admin.close(); details.close(); map.showAll();
  });
  window.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape') return;
    if (!document.querySelector('#media-dialog').hidden) media.close();
    else if (!document.querySelector('#admin-dialog').hidden) document.querySelector('#cancel-admin').click();
    else if (document.querySelector('#admin-panel').classList.contains('is-open')) admin.close();
    else details.close();
  });
}

function renderAgent(agent) {
  if (!agent) return;
  document.querySelector('#agent-initials').textContent = agent.initials || 'EC';
  document.querySelector('#agent-name').textContent = agent.name || 'Eric Costuna';
  document.querySelector('#agent-role').textContent = agent.role || 'Property Specialist';
  document.querySelector('#agent-phone').textContent = `Call: ${agent.phoneDisplay || 'Not supplied'}`;
  document.querySelector('#agent-call').href = agent.phoneHref ? `tel:${agent.phoneHref}` : '#';
  document.querySelector('#agent-message').href = agent.messengerUrl || '#';
}
