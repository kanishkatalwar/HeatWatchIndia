/* Dashboard: stat cards, India map, trend, quick stats, advisories, stations */
(function () {
    window.HW_SKIP_PING = true;                 // the dashboard reports status itself
    const $ = id => document.getElementById(id);

    let regions = [];                           // one entry per REGION
    let states = {};                            // map key -> {key, name, regions[]}
    let advisories = [];
    let stations = [];

    /* ---------------- stat cards ---------------- */
    async function loadStats() {
        try {
            const d = await HW.api("/api/dashboard");
            HW.setStatus(true);
            if (d.highest_forecast) {
                $("highestTemperature").textContent = HW.temp(d.highest_forecast.Max_Temperature);
                $("highestRegion").textContent = d.highest_forecast.Region_Name;
            } else {
                $("highestTemperature").textContent = "—";
                $("highestRegion").textContent = "No forecasts yet";
            }
            $("activeStations").textContent = d.active_stations ? d.active_stations.Active_Stations : "—";
            $("redAlerts").textContent = d.red_alerts ? d.red_alerts.Red_Alerts : "—";
            $("totalForecasts").textContent = d.total_forecasts ? d.total_forecasts.Total_Forecasts : "—";
            HW.synced();
        } catch (e) {
            HW.setStatus(false);
            $("highestRegion").textContent = "Could not load";
        }
    }

    /* ---------------- map ---------------- */
    function buildModel(rows) {
        const byId = new Map();
        rows.forEach(r => {
            let g = byId.get(r.Region_ID);
            if (!g) {
                g = { id: r.Region_ID, name: r.Region_Name, state: r.State, zone: r.Climate_Zone,
                      key: IndiaMap.keyFor(r.State), temp: null, sev: null, date: null, count: 0 };
                byId.set(r.Region_ID, g);
            }
            if (r.Forecast_ID !== null && r.Forecast_ID !== undefined) {
                g.count++;
                const t = HW.num(r.Max_Temperature);
                if (t !== null && (g.temp === null || t > g.temp)) { g.temp = t; g.sev = r.Severity_Level; g.date = HW.date(r.Day, r.Month, r.Year); }
            }
        });
        regions = [...byId.values()];
        states = {};
        regions.forEach(r => {
            if (!r.key) return;
            (states[r.key] = states[r.key] || { key: r.key, name: r.state, regions: [] }).regions.push(r);
        });
    }

    function renderRank() {
        const ranked = regions.filter(r => r.temp !== null).sort((a, b) => b.temp - a.temp).slice(0, 6);
        const box = $("rankList");
        if (!ranked.length) { HW.emptyBox(box, "No forecast data available."); return; }
        const lo = Math.min(...ranked.map(r => r.temp)) - 6, hi = Math.max(...ranked.map(r => r.temp));
        box.innerHTML = ranked.map(r => `
            <button class="rank-row" data-key="${HW.esc(r.key || "")}" ${r.key ? "" : "disabled"}>
                <span>${HW.esc(r.name)}<small>${HW.esc(r.state || "")}</small></span>
                <div class="bar-bg"><div class="bar-fill" style="width:${Math.max(8, (r.temp - lo) / (hi - lo || 1) * 100)}%"></div></div>
                <b>${r.temp.toFixed(1)}°C</b>
            </button>`).join("");
        box.querySelectorAll(".rank-row[data-key]").forEach(b => { if (b.dataset.key) b.onclick = () => IndiaMap.select(b.dataset.key); });

        const lost = regions.filter(r => !r.key);
        $("mapNote").textContent = lost.length
            ? `Not shown on map (state not recognised): ${lost.map(r => r.name).join(", ")}.`
            : "Ranked by the highest Max_Temperature in HEATWAVE_FORECAST.";
    }

    const ICON = {
        sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M19 5l-2 2M7 17l-2 2"/>',
        wave: '<path d="M2 9c3-3 5 3 8 0s5 3 8 0 3-1 4-1M2 15c3-3 5 3 8 0s5 3 8 0 3-1 4-1"/>',
        rain: '<path d="M7 14a4 4 0 010-8 5 5 0 019.5 1A3.5 3.5 0 0117 14H7zM9 17l-1 3M13 17l-1 3M17 17l-1 3"/>',
        mountain: '<path d="M3 19l6-10 4 6 3-4 5 8H3z"/>',
        therm: '<path d="M10 14V5a2 2 0 014 0v9a4 4 0 11-4 0z"/>'
    };
    function zoneIcon(zone) {
        const z = String(zone || "").toLowerCase();
        const k = /arid|desert|dry/.test(z) ? "sun" : /coast|maritime|littoral/.test(z) ? "wave"
            : /humid|tropic|monsoon|wet|rain/.test(z) ? "rain" : /hill|mountain|alpine|himalay|temperate|cold/.test(z) ? "mountain" : "therm";
        return `<svg viewBox="0 0 24 24" aria-hidden="true">${ICON[k]}</svg>`;
    }

    function showDetail(key) {
        const st = states[key];
        const box = $("viewDetail");
        if (!st) return;
        const list = st.regions.slice().sort((a, b) => (b.temp ?? -1) - (a.temp ?? -1));
        const top = list[0], risk = HW.risk(top.temp);
        const ids = new Set(st.regions.map(r => r.id));
        const adv = advisories.filter(a => ids.has(a.Region_ID)).slice(0, 2);
        const stn = stations.filter(s => ids.has(s.Region_ID));
        const active = stn.filter(s => HW.isActive(s.Status)).length;
        const humid = stn.map(s => HW.num(s.Latest_Humidity)).filter(v => v !== null);

        box.innerHTML = `
            <div class="detail-head"><div class="zone-ic" title="${HW.esc(top.zone || "Climate zone not set")}">${zoneIcon(top.zone)}</div>
                <div><div class="eyebrow">${HW.esc(top.name)}${top.zone ? " · " + HW.esc(top.zone) : ""}</div>
                <h2 style="margin:0">${HW.esc(st.name)}</h2></div></div>
            <div class="big-temp">${top.temp === null ? "—" : top.temp.toFixed(1)}<small> °C</small></div>
            <div>${HW.badge(risk.label, risk.cls)} ${top.sev ? `<span class="note">DB severity: ${HW.esc(top.sev)}</span>` : ""}</div>
            <div class="mini-grid">
                <div><b>${list.reduce((n, r) => n + r.count, 0)}</b><span>FORECASTS</span></div>
                <div><b>${active}/${stn.length}</b><span>ACTIVE STN</span></div>
                <div><b>${humid.length ? Math.round(humid.reduce((a, b) => a + b, 0) / humid.length) + "%" : "—"}</b><span>HUMIDITY</span></div>
            </div>
            <div>${list.map(r => `<div class="region-line"><span>${HW.esc(r.name)}<small class="muted"> ${r.date ? "· " + HW.esc(r.date) : ""}</small></span><b>${HW.temp(r.temp)}</b></div>`).join("")}</div>
            ${adv.length ? adv.map(a => `<div class="advisory-item"><div class="alert-icon ${HW.alert(a.Alert_Level)}">🚨</div><div class="advisory-info"><strong>${HW.esc(a.Message || "Heatwave advisory")}</strong><small>${HW.esc(HW.date(a.Day, a.Month, a.Year))}</small></div><span class="alert-level ${HW.alert(a.Alert_Level)}">${HW.alert(a.Alert_Level)}</span></div>`).join("") : `<p class="note">No advisories linked to this state.</p>`}
            <button class="btn-ghost" id="zoomOut">← Zoom out</button>`;
        $("zoomOut").onclick = () => IndiaMap.reset();
        $("viewOverview").classList.remove("on");
        box.classList.add("on");
    }

    async function loadMap() {
        try {
            buildModel(await HW.api("/api/dashboard/map"));
            const temps = regions.map(r => r.temp).filter(t => t !== null);
            let lo = temps.length ? Math.floor(Math.min(...temps)) : 36, hi = temps.length ? Math.ceil(Math.max(...temps)) : 46;
            if (hi - lo < 3) hi = lo + 3;
            IndiaMap.setData(regions, [lo, hi]);
            $("legLo").textContent = lo + "°C";
            $("legMid").textContent = Math.round((lo + hi) / 2) + "°";
            $("legHi").textContent = hi + "°C";
            renderRank();
            $("mapLoading").classList.add("hide");
        } catch (e) {
            $("mapLoading").textContent = "Could not load map data.";
            HW.errorBox($("rankList"), e.message, loadMap);
        }
    }

    /* ---------------- trend + quick stats ---------------- */
    async function loadTrend() {
        const box = $("trendChart");
        try {
            const d = await HW.api("/api/dashboard/trend");
            if (!d.points.length) { HW.emptyBox(box, "No observation or forecast records to chart yet."); return; }
            $("trendSource").textContent = d.source === "observations"
                ? "Daily temperature · from WEATHER_OBSERVATION" : "Daily maximum · from HEATWAVE_FORECAST (no observations yet)";
            const series = [{ name: "Daily max", color: "#D47E30", values: d.points.map(p => HW.num(p.max)) }];
            if (d.source === "observations") series.push({ name: "Daily average", color: "#6F4E37", values: d.points.map(p => HW.num(p.avg)) });
            HW.lineChart(box, d.points.map(p => p.label), series);
        } catch (e) { HW.errorBox(box, e.message, loadTrend); }
    }

    async function loadQuick() {
        const box = $("quickStats");
        try {
            const s = await HW.api("/api/dashboard/stats");
            if (!s || !Number(s.Readings)) { HW.emptyBox(box, "No observations recorded yet."); return; }
            const t = v => HW.temp(v), h = v => HW.num(v) === null ? "—" : Number(v).toFixed(0) + "%";
            box.innerHTML = `<div class="quick-grid">
                <div><span>Average temp</span><b>${t(s.Avg_Temp)}</b></div>
                <div><span>Highest observed</span><b>${t(s.Max_Temp)}</b></div>
                <div><span>Lowest observed</span><b>${t(s.Min_Temp)}</b></div>
                <div><span>Average humidity</span><b>${h(s.Avg_Humidity)}</b></div></div>
                <p class="note" style="margin-top:10px">${Number(s.Readings).toLocaleString()} observations recorded.</p>`;
        } catch (e) { HW.errorBox(box, e.message, loadQuick); }
    }

    /* ---------------- advisories + stations ---------------- */
    async function loadAdvisories() {
        const box = $("advisoryList");
        try {
            advisories = await HW.api("/api/advisories/detail");
            if (!advisories.length) { HW.emptyBox(box, "No active advisories found."); return; }
            box.innerHTML = advisories.slice(0, 5).map(a => {
                const lv = HW.alert(a.Alert_Level);
                return `<div class="advisory-item"><div class="alert-icon ${lv}">🚨</div>
                    <div class="advisory-info"><strong>${HW.esc(a.Region_Name || "Heatwave advisory")}${a.State ? ", " + HW.esc(a.State) : ""}</strong>
                    <small>${HW.esc(a.Message || "Forecast ID " + (a.Forecast_ID ?? "N/A"))}</small></div>
                    <div style="text-align:right"><span class="alert-level ${lv}">${lv}</span><small class="muted" style="display:block;font-size:9px;margin-top:3px">${HW.esc(HW.date(a.Day, a.Month, a.Year))}</small></div></div>`;
            }).join("");
        } catch (e) { HW.errorBox(box, e.message, loadAdvisories); }
    }

    async function loadStations() {
        const box = $("stationList");
        try {
            stations = await HW.api("/api/stations/detail");
            if (!stations.length) { HW.emptyBox(box, "No weather stations registered."); return; }
            const act = stations.filter(s => HW.isActive(s.Status)).length;
            $("stationSummary").textContent = `${act} of ${stations.length} active`;
            box.innerHTML = stations.slice(0, 6).map(s => `
                <div class="station-row"><i class="dot ${HW.isActive(s.Status) ? "" : "off"}"></i>
                <div class="grow"><strong>${HW.esc(s.Station_Name || "Station #" + s.Station_ID)}</strong><small>${HW.esc(s.Region_Name || "Region " + s.Region_ID)}</small></div>
                <b>${HW.temp(s.Latest_Temperature)}</b></div>`).join("");
        } catch (e) { HW.errorBox(box, e.message, loadStations); }
    }

    /* ---------------- start ---------------- */
    document.addEventListener("DOMContentLoaded", async () => {
        IndiaMap.init($("indiaMap"), {
            wrap: $("mapBox"), hint: $("mapHint"), coord: $("mapCoord"),
            onSelect: showDetail,
            onReset: () => { $("viewDetail").classList.remove("on"); $("viewOverview").classList.add("on"); }
        });
        loadStats();
        // advisories + stations first so the zoomed-in state panel can use them
        await Promise.allSettled([loadAdvisories(), loadStations()]);
        loadMap(); loadTrend(); loadQuick();
    });
})();