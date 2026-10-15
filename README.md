# Real Estate Map Explorer

A local-first application for exploring and managing real-estate lots on a satellite map. The interface was reconstructed from the supplied Canva screenshots and now runs independently of the missing Canva codelet.

> [!IMPORTANT]
> All bundled listings, coordinates, boundaries, routes, and contact details are fictional sample content. They are not verified surveys or production listing data.

## Features

### Public map

- Esri satellite imagery displayed with Leaflet, reusing native zoom level 18 for closer zooms because level 19 is unavailable around the sample area
- Clickable property labels and highlighted lot boundaries
- A **Lot Layout** toggle that shows or hides calculated edge lengths and total perimeter
- Responsive property details with price, measurements, utilities, and routes
- Destination markers and direct reference route lines shown only after pressing **Routes**
- Property specialist call and Messenger actions
- In-page 360° panorama, aerial video, and walkthrough viewers
- Desktop details drawer and mobile bottom sheet

### Admin console

Open the lock button and use the local access passcode `admin`.

- **Properties:** enter listing details, start boundary pinning, click at least three points on the map, and save the property.
- **Property media:** attach a CORS-enabled equirectangular panorama and YouTube/direct aerial or walkthrough videos by URL.
- **Utilities:** configure the default utility options copied into newly created properties.
- **Routes:** connect a property to a saved destination.
- **Locations:** add schools, banks, stores, and landmarks by coordinates or by clicking the map.
- **Temporary feed:** review and remove seed or locally created properties, routes, and destinations.
- **Home:** closes the admin console and property details, then returns to the full public map.

The seed data lives in `data/data.json` and includes five fictional properties, five fictional destinations, utility options, routes, and media examples. Edit that file to change the default dataset. Admin changes are stored separately under `real-estate-map-explorer.data.v5`, remain after refresh in the same browser, and are not synchronized across devices. Clearing site data restores the JSON defaults on the next load. The visible passcode is a local convenience and provides no real security.

The interface adapts to wide desktops, tablets, phones, short landscape screens, and device safe areas. Property details use a desktop drawer and a mobile bottom sheet; admin forms collapse to a single column on narrow screens.

## Run locally

Open this repository as the VS Code workspace, then start Live Server from the root-level `index.html`. The included `.vscode/settings.json` fixes the Live Server root.

Alternatively:

```bash
python3 -m http.server 8000
```

Open <http://127.0.0.1:8000/>. Do not open the page with `file://`; JavaScript modules require HTTP. Internet access is required for Leaflet and Esri satellite tiles.

## Project structure

```text
.
├── index.html              # Public map, admin console, and dialogs
├── canva.html              # Original generated Canva export; reference only
├── SCREENSHOT_TEXT.txt     # Transcribed UI copy and sample data from references
├── data/
│   └── data.json           # Editable fictional seed properties and map data
├── css/
│   ├── tokens.css          # Colors, radii, shadows, and dimensions
│   ├── components.css      # Map, details, dialog, and admin components
│   └── layout.css          # Viewport, panels, and responsive behavior
└── js/
    ├── main.js             # Application composition and top-level events
    ├── config.js           # Map settings and public media actions
    ├── store.js            # localStorage-backed property data store
    ├── map-controller.js   # Leaflet markers, polygons, routes, and map picking
    ├── details.js          # Public property-details rendering
    ├── media-viewer.js     # 360 panorama, image, YouTube, and video modal
    └── admin.js            # Admin access, forms, tabs, feeds, and pin workflow
```

## Data flow

1. `PropertyStore.create()` fetches and validates `data/data.json`, then uses a valid browser-local override when present.
2. `MapController` renders properties, destinations, and routes.
3. `AdminConsole` validates form input, collects map clicks, and updates the store.
4. Store changes trigger a map refresh immediately.
5. Selecting a property opens `DetailsPanel` with current store data.
6. Selecting a lot keeps measurements and routes hidden. **Lot Layout** toggles geodesic edge/perimeter labels, while **Routes** toggles that property's route overlays.

## Current limitations

- There is no backend, database, multi-user synchronization, or audit history.
- Editing `data/data.json` changes the defaults, but an existing version-matching local override takes precedence until browser site data is cleared.
- The admin passcode is deliberately not secure.
- Routes are straight visual connections, not road-network directions.
- Boundary edge and perimeter measurements are geodesic map estimates, not surveyed measurements. The listing's area and dimension fields remain user-supplied labels.
- Media controls remain disabled whenever their property does not have a corresponding URL.
- LOT 001 and LOT 002 use official Pannellum and YouTube sample media placeholders. Replace their URLs before presenting the application as a real listing.
- Remote media depends on the host allowing embedding and, for panorama images, cross-origin access.
- Production use requires authenticated administration, server-side validation, authorized property data, a real route service, backups, and provider/API usage review.

See [`AGENTS.md`](./AGENTS.md) for contribution and implementation rules.

The original screenshot wording and visible sample values are transcribed in [`SCREENSHOT_TEXT.txt`](./SCREENSHOT_TEXT.txt).
