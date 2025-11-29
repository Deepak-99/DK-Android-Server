// public/admin/js/modules/core/MapPanel.js
// Usage:
//   import MapPanel from './MapPanel.js';
//   const mapPanel = new MapPanel({ api, ws, containerId: 'map', ui });
//   mapPanel.init();

export default class MapPanel {
    constructor({ api, ws, containerId = 'map', ui = null } = {}) {
        this.api = api; // ApiService instance (with .get)
        this.ws = ws;   // WebSocketService instance (optional) - will receive events via onEvent
        this.containerId = containerId;
        this.ui = ui;
        this.map = null;
        this.deviceMarkers = new Map(); // deviceId -> marker
        this.devicePolylines = new Map(); // deviceId -> polyline layer
        this.heatLayers = new Map(); // deviceId -> heatlayer
        this.selectedDeviceId = null;
        this._socketEventHandler = this._onSocketEvent.bind(this);

        // default map options
        this.center = [20.5937, 78.9629]; // fallback center (India)
        this.zoom = 5;
        this.tileUrl = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
    }

    async init() {
        // create map DOM if needed
        const container = document.getElementById(this.containerId);
        if (!container) {
            console.error('Map container not found:', this.containerId);
            return;
        }

        // init map
        this.map = L.map(this.containerId).setView(this.center, this.zoom);
        L.tileLayer(this.tileUrl, {
            maxZoom: 19,
            attribution: '&copy; OpenStreetMap contributors'
        }).addTo(this.map);

        // simple control: device select
        this._renderControls();

        // subscribe to WS events via WebSocketService onEvent callback if available
        if (this.ws && typeof this.ws.on === 'function') {
            // WebSocketService in admin already calls onEvent callback globally,
            // but we can also use ws.on('location-update', ...) if implemented.
            // We'll use the central onEvent path: the AdminPanel calls ws with onEvent.
            // If ws has event listeners, attach to its local emitter too.
            try {
                this.ws.on('location-update', (payload) => this._handleLocationUpdate(payload));
            } catch (err) {
                // ignore
            }
        }

        // subscribe to admin WebSocket events through global onEvent if available
        if (this.ws && typeof this.ws.onEvent === 'function') {
            // nothing — your AdminPanel should call this.handleWebSocketEvent to integrate.
        }

        // map click to show nearest device info (optional)
        this.map.on('click', (e) => {
            const latlng = e.latlng;
            // show popup
            L.popup()
                .setLatLng(latlng)
                .setContent(`<div>Lat: ${latlng.lat.toFixed(6)}<br/>Lng: ${latlng.lng.toFixed(6)}</div>`)
                .openOn(this.map);
        });

        // load devices list for control
        await this.loadDeviceList();
    }

    _renderControls() {
        // container for device selector and buttons
        const container = document.createElement('div');
        container.className = 'map-controls p-2';
        container.style.background = 'rgba(255,255,255,0.9)';
        container.style.borderRadius = '6px';
        container.style.maxWidth = '320px';
        container.style.fontSize = '14px';

        const html = `
      <div class="mb-2">
        <strong>Devices</strong>
        <select id="map-device-select" class="form-select form-select-sm mt-1">
          <option value="">-- Select device --</option>
        </select>
      </div>
      <div class="d-flex gap-2">
        <button id="map-load-history" class="btn btn-sm btn-primary">Load history</button>
        <button id="map-toggle-heat" class="btn btn-sm btn-outline-secondary">Toggle heat</button>
        <button id="map-fit-all" class="btn btn-sm btn-outline-secondary">Fit all</button>
      </div>
      <div id="map-status" class="mt-2 small text-muted"></div>
    `;
        container.innerHTML = html;

        const topRight = L.control({ position: 'topright' });
        topRight.onAdd = function () {
            return container;
        };
        topRight.addTo(this.map);

        // events
        container.querySelector('#map-device-select').addEventListener('change', (e) => {
            this.selectedDeviceId = e.target.value || null;
            if (this.selectedDeviceId) {
                this.highlightDevice(this.selectedDeviceId);
            }
        });

        container.querySelector('#map-load-history').addEventListener('click', async () => {
            if (!this.selectedDeviceId) return alert('Select a device first');
            await this.loadHistory(this.selectedDeviceId, { limit: 500 });
        });

        container.querySelector('#map-toggle-heat').addEventListener('click', () => {
            if (!this.selectedDeviceId) return alert('Select a device first');
            this.toggleHeat(this.selectedDeviceId);
        });

        container.querySelector('#map-fit-all').addEventListener('click', () => {
            this.fitAllMarkers();
        });

        this.statusEl = container.querySelector('#map-status');
    }

    async loadDeviceList() {
        try {
            const resp = await this.api.get('/devices');
            const devices = resp.data || resp;
            const select = document.getElementById('map-device-select');
            if (!select) return;
            // clear existing options (except placeholder)
            select.querySelectorAll('option:not([value=""])').forEach(o => o.remove());
            for (const d of devices) {
                const opt = document.createElement('option');
                opt.value = d.id;
                opt.text = `${d.name || d.device_name || d.deviceId} (${d.deviceId})`;
                select.appendChild(opt);
            }
        } catch (err) {
            console.warn('Failed to load devices for map', err);
            if (this.ui) this.ui.showNotification('Failed to load devices for map', 'warning');
        }
    }

    /**
     * Called by your AdminPanel when WebSocket events arrive.
     * You can wire in: adminPanel.handleWebSocketEvent -> mapPanel.handleWebSocketEvent
     */
    handleWebSocketEvent(type, payload) {
        if (!type) return;
        if (type === 'location-update' || type === 'device-heartbeat' || type === 'device-registered') {
            if (type === 'location-update') this._handleLocationUpdate(payload);
            // optionally update device list / status
            if (type === 'device-registered') {
                // refresh devices list
                this.loadDeviceList();
            }
        }
    }

    _onSocketEvent(e) {
        // placeholder if you attach raw socket events
        if (e && e.type === 'location-update') this._handleLocationUpdate(e.payload || e.data);
    }

    _handleLocationUpdate(payload) {
        if (!payload || !payload.deviceId) return;
        const deviceId = payload.deviceId;
        const lat = parseFloat(payload.latitude);
        const lng = parseFloat(payload.longitude);

        if (!isFinite(lat) || !isFinite(lng)) return;

        // if there's an existing marker, move it; else create
        const key = deviceId;
        if (this.deviceMarkers.has(key)) {
            const marker = this.deviceMarkers.get(key);
            marker.setLatLng([lat, lng]);
            marker._popup && marker._popup.setContent(this._popupContent(deviceId, payload));
        } else {
            const marker = L.circleMarker([lat, lng], { radius: 6, fillOpacity: 0.9 }).addTo(this.map);
            marker.bindPopup(this._popupContent(deviceId, payload));
            this.deviceMarkers.set(key, marker);
        }

        // add point to polyline for selected device
        if (this.selectedDeviceId && String(this.selectedDeviceId) === String(payload.deviceId)) {
            this._appendToPolyline(payload.deviceId, [lat, lng]);
        }

        // add to heat layer
        if (this.heatLayers.has(key)) {
            const heat = this.heatLayers.get(key);
            heat.addLatLng([lat, lng, 0.5]);
        }

        // optionally fit map to new marker if not currently visible
        // console.debug('location update', payload);
        this._setStatus(`Last update: ${new Date(payload.timestamp || Date.now()).toLocaleString()}`);
    }

    _popupContent(deviceId, payload) {
        return `
      <div>
        <strong>${payload.deviceName || payload.device_name || deviceId}</strong><br/>
        ${payload.address ? `<small>${payload.address}</small><br/>` : ''}
        <small>${payload.latitude?.toFixed?.(6)}, ${payload.longitude?.toFixed?.(6)}</small><br/>
        <small>${new Date(payload.timestamp || Date.now()).toLocaleString()}</small>
      </div>
    `;
    }

    _setStatus(text) {
        if (this.statusEl) this.statusEl.textContent = text;
    }

    async loadHistory(deviceId, { limit = 500 } = {}) {
        try {
            this._setStatus('Loading history...');
            const resp = await this.api.get(`/devices/${deviceId}/locations?limit=${limit}`);
            const locations = resp.data || [];
            if (!Array.isArray(locations) || locations.length === 0) {
                this._setStatus('No history available');
                return;
            }

            // convert to LatLngs (descending order returned)
            const latlngs = locations.map(l => [parseFloat(l.latitude), parseFloat(l.longitude), l.timestamp]);
            latlngs.reverse(); // make oldest -> newest

            // draw polyline
            this._drawPolyline(deviceId, latlngs);

            // optionally create heat layer
            this._createHeat(deviceId, latlngs);

            // add markers for endpoints
            const start = latlngs[0];
            const end = latlngs[latlngs.length - 1];
            if (start) {
                const startMarker = L.circleMarker([start[0], start[1]], { radius: 5, color: 'green' }).addTo(this.map);
                startMarker.bindPopup('Start');
            }
            if (end) {
                const endMarker = L.circleMarker([end[0], end[1]], { radius: 5, color: 'red' }).addTo(this.map);
                endMarker.bindPopup('End');
            }

            // fit map to polyline
            const bounds = latlngs.map(p => [p[0], p[1]]);
            this.map.fitBounds(bounds, { maxZoom: 16, padding: [30, 30] });
            this._setStatus(`Loaded ${latlngs.length} points`);
        } catch (err) {
            console.error('Failed to load history', err);
            this._setStatus('Failed to load history');
            if (this.ui) this.ui.showNotification('Failed to load device history', 'danger');
        }
    }

    _drawPolyline(deviceId, latlngs) {
        // remove existing polyline for device
        if (this.devicePolylines.has(deviceId)) {
            const layer = this.devicePolylines.get(deviceId);
            this.map.removeLayer(layer);
            this.devicePolylines.delete(deviceId);
        }

        const latlngPairs = latlngs.map(p => [p[0], p[1]]);
        const polyline = L.polyline(latlngPairs, { color: '#3388ff', weight: 4 }).addTo(this.map);
        this.devicePolylines.set(deviceId, polyline);
    }

    _appendToPolyline(deviceId, latlng) {
        if (!this.devicePolylines.has(deviceId)) {
            const poly = L.polyline([latlng], { color: '#3388ff', weight: 4 }).addTo(this.map);
            this.devicePolylines.set(deviceId, poly);
        } else {
            const poly = this.devicePolylines.get(deviceId);
            poly.addLatLng(latlng);
        }
    }

    _createHeat(deviceId, latlngs) {
        // remove existing heat
        if (this.heatLayers.has(deviceId)) {
            const layer = this.heatLayers.get(deviceId);
            try { this.map.removeLayer(layer); } catch (_) {}
            this.heatLayers.delete(deviceId);
        }

        if (typeof L.heatLayer !== 'function') {
            console.warn('leaflet.heat not available - skipping heatmap');
            return;
        }
        const heatPoints = latlngs.map(p => [p[0], p[1], 0.5]);
        const heat = L.heatLayer(heatPoints, { radius: 25, blur: 15 }).addTo(this.map);
        this.heatLayers.set(deviceId, heat);
    }

    toggleHeat(deviceId) {
        if (!deviceId) deviceId = this.selectedDeviceId;
        if (!deviceId) return;
        if (this.heatLayers.has(deviceId)) {
            const layer = this.heatLayers.get(deviceId);
            this.map.removeLayer(layer);
            this.heatLayers.delete(deviceId);
        } else {
            // attempt to load history and create heat
            this.loadHistory(deviceId, { limit: 1000 });
        }
    }

    highlightDevice(deviceId) {
        const marker = this.deviceMarkers.get(deviceId);
        if (marker) {
            this.map.setView(marker.getLatLng(), 14);
            marker.openPopup();
        } else {
            this._setStatus('No real-time location for selected device');
        }
    }

    fitAllMarkers() {
        const markers = Array.from(this.deviceMarkers.values());
        if (markers.length === 0) return;
        const bounds = L.latLngBounds(markers.map(m => m.getLatLng()));
        this.map.fitBounds(bounds.pad(0.1));
    }
}
