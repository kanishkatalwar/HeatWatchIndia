/* Shared helpers for every HeatWatch page */
(function () {
    const HW = (window.HW = {});

    const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

    HW.esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

    HW.num = v => {
        if (v === null || v === undefined || v === "") return null;
        const n = Number(v);
        return Number.isFinite(n) ? n : null;
    };

    HW.temp = (v, d = 1) => { const n = HW.num(v); return n === null ? "—" : n.toFixed(d) + "°C"; };

    HW.date = (d, m, y) => (d && m && y) ? `${d} ${MONTHS[m - 1] || m} ${y}` : "—";
    HW.dateKey = (d, m, y) => (y || 0) * 10000 + (m || 0) * 100 + (d || 0);
    HW.isoDate = s => {
        if (!s) return "—";
        const [y, m, d] = String(s).slice(0, 10).split("-").map(Number);
        return y ? HW.date(d, m, y) : String(s);
    };

    // Same thresholds the original app used
    HW.risk = t => {
        const n = HW.num(t);
        if (n === null) return { label: "NO DATA", cls: "risk-none" };
        if (n >= 45) return { label: "CRITICAL", cls: "risk-critical" };
        if (n >= 43) return { label: "HIGH", cls: "risk-high" };
        return { label: "MODERATE", cls: "risk-moderate" };
    };

    HW.alert = l => {
        const L = String(l || "").trim().toUpperCase();
        return ["RED", "ORANGE", "YELLOW"].includes(L) ? L : "INFO";
    };

    HW.isActive = s => String(s || "").trim().toLowerCase() === "active";
    HW.title = k => k.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
    HW.badge = (label, cls) => `<span class="risk-badge ${cls}">${HW.esc(label)}</span>`;

    HW.api = async url => {
        const res = await fetch(url);
        let data = null;
        try { data = await res.json(); } catch (e) { /* not JSON */ }
        if (!res.ok || (data && data.error)) throw new Error((data && data.error) || `Request failed (${res.status})`);
        return data;
    };

    /* ---------- status + sync indicators ---------- */
    HW.setStatus = ok => {
        const dot = document.getElementById("sysDot");
        const txt = document.getElementById("sysText");
        const sub = document.getElementById("sysSub");
        if (!dot) return;
        dot.className = "status-dot " + (ok ? "ok" : "bad");
        txt.textContent = ok ? "System Online" : "Database unreachable";
        sub.textContent = ok ? "Connected to MySQL" : "Check MySQL and Flask logs";
        const b = document.getElementById("syncBadge");
        if (b && !ok) { b.className = "sync-badge err"; b.lastChild.textContent = "Offline"; }
    };
    HW.synced = () => {
        const b = document.getElementById("syncBadge");
        if (!b) return;
        b.className = "sync-badge";
        b.lastChild.textContent = "Synced " + new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    };
    HW.ping = () => HW.api("/api/dashboard").then(() => HW.setStatus(true)).catch(() => HW.setStatus(false));

    /* ---------- table states ---------- */
    HW.loadingRows = (tbody, cols, n = 5) => {
        tbody.innerHTML = Array.from({ length: n }, () =>
            `<tr>${Array.from({ length: cols }, () => `<td><div class="skeleton"></div></td>`).join("")}</tr>`).join("");
    };
    HW.errorRow = (tbody, cols, msg, retry) => {
        tbody.innerHTML = `<tr><td colspan="${cols}"><div class="state">⚠ ${HW.esc(msg)}<br><button class="retry">Try again</button></div></td></tr>`;
        tbody.querySelector(".retry").onclick = retry;
    };
    HW.errorBox = (el, msg, retry) => {
        el.innerHTML = `<div class="state">⚠ ${HW.esc(msg)}<br><button class="retry">Try again</button></div>`;
        el.querySelector(".retry").onclick = retry;
    };
HW.emptyArt = '<svg class="empty-art" viewBox="0 0 80 60" aria-hidden="true"><circle cx="52" cy="20" r="11" fill="#F3D58A"/><g stroke="#E39A45" stroke-width="2" stroke-linecap="round"><path d="M52 4v4M52 32v4M36 20h4M64 20h4M41 9l3 3M63 9l-3 3"/></g><path d="M16 46a10 10 0 010-20 13 13 0 0125 3 9 9 0 012 17H16z" fill="#FFFDF6" stroke="#6F4E37" stroke-width="2" stroke-linejoin="round"/></svg>';
    HW.emptyBox = (el, msg) => { el.innerHTML = `<div class="state">${HW.emptyArt}${HW.esc(msg)}</div>`; };

    /* ---------- searchable / sortable / filterable table ---------- */
    HW.dataTable = o => {
        // o: {table, columns:[{label, render(row), sort(row)}], search, searchText(row), filters:[{el, test(row,val)}],
        //     count, empty, sortIndex, sortDir}
        let rows = [];
        const sort = { i: o.sortIndex ?? -1, dir: o.sortDir ?? 1 };
        const head = o.table.tHead.rows[0];
        const body = o.table.tBodies[0];

        head.innerHTML = o.columns.map((c, i) =>
            `<th ${c.sort ? `class="sortable" data-i="${i}"` : ""}>${HW.esc(c.label)}<span class="arrow"></span></th>`).join("");

        head.querySelectorAll(".sortable").forEach(th => {
            th.onclick = () => {
                const i = Number(th.dataset.i);
                sort.dir = sort.i === i ? -sort.dir : 1;
                sort.i = i;
                render();
            };
        });

        function visible() {
            const q = o.search ? o.search.value.trim().toLowerCase() : "";
            let out = rows.filter(r =>
                (!q || o.searchText(r).toLowerCase().includes(q)) &&
                (o.filters || []).every(f => !f.el.value || f.el.value === "ALL" || f.test(r, f.el.value)));
            if (sort.i >= 0) {
                const key = o.columns[sort.i].sort;
                out = out.slice().sort((a, b) => {
                    const x = key(a), y = key(b);
                    if (x === null || x === undefined) return 1;
                    if (y === null || y === undefined) return -1;
                    return (typeof x === "number" && typeof y === "number" ? x - y : String(x).localeCompare(String(y))) * sort.dir;
                });
            }
            return out;
        }

        function render() {
            const out = visible();
            head.querySelectorAll("th").forEach((th, i) => {
                th.querySelector(".arrow").textContent = i === sort.i ? (sort.dir > 0 ? "▲" : "▼") : "";
            });
            if (o.count) o.count.textContent = `${out.length} of ${rows.length}`;
            if (!out.length) {
                body.innerHTML = `<tr><td colspan="${o.columns.length}"><div class="state">${HW.emptyArt}${HW.esc(rows.length ? "No records match your search or filters." : o.empty)}</div></td></tr>`;
                return;
            }
            body.innerHTML = out.map(r => `<tr>${o.columns.map(c => `<td${c.cls ? ` class="${c.cls}"` : ""}>${c.render(r)}</td>`).join("")}</tr>`).join("");
        }

        if (o.search) o.search.addEventListener("input", render);
        (o.filters || []).forEach(f => f.el.addEventListener("change", render));

        return { setRows(r) { rows = r; render(); }, render, body };
    };

    HW.fillSelect = (sel, values, allLabel) => {
        const uniq = [...new Set(values.filter(v => v !== null && v !== undefined && v !== ""))].sort();
        sel.innerHTML = `<option value="ALL">${HW.esc(allLabel)}</option>` + uniq.map(v => `<option value="${HW.esc(v)}">${HW.esc(v)}</option>`).join("");
    };

    HW.chips = (el, values, onChange) => {
        el.innerHTML = values.map((v, i) => `<button class="chip${i ? "" : " on"}" data-v="${HW.esc(v)}">${HW.esc(v)}</button>`).join("");
        el.querySelectorAll(".chip").forEach(c => c.onclick = () => {
            el.querySelectorAll(".chip").forEach(x => x.classList.remove("on"));
            c.classList.add("on");
            onChange(c.dataset.v);
        });
    };

    /* ---------- SVG line chart with hover tooltip ---------- */
    HW.lineChart = (el, labels, series, unit = "°C") => {
        const W = 640, H = 230, L = 40, R = 14, T = 14, B = 28;
        const all = series.flatMap(s => s.values).filter(v => v !== null);
        if (!all.length) { HW.emptyBox(el, "No data to chart yet."); return; }
        let lo = Math.floor(Math.min(...all) - 1), hi = Math.ceil(Math.max(...all) + 1);
        if (hi - lo < 4) hi = lo + 4;
        const n = labels.length;
        const x = i => L + (n === 1 ? (W - L - R) / 2 : i * (W - L - R) / (n - 1));
        const y = v => T + (hi - v) * (H - T - B) / (hi - lo);
        const ticks = Array.from({ length: 5 }, (_, i) => lo + i * (hi - lo) / 4);
        const fmtX = i => HW.isoDate(labels[i]).replace(/ \d{4}$/, "");

        let svg = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Temperature trend">`;
        ticks.forEach(t => { svg += `<line x1="${L}" x2="${W - R}" y1="${y(t)}" y2="${y(t)}" stroke="#e6dcc0"/><text x="${L - 8}" y="${y(t) + 3}" text-anchor="end" font-size="10" fill="#8a7461">${t.toFixed(0)}°</text>`; });
        [0, Math.floor((n - 1) / 2), n - 1].filter((v, i, a) => a.indexOf(v) === i).forEach(i => {
            svg += `<text x="${x(i)}" y="${H - 8}" text-anchor="middle" font-size="10" fill="#8a7461">${HW.esc(fmtX(i))}</text>`;
        });
        series.forEach((s, k) => {
            const pts = s.values.map((v, i) => v === null ? null : [x(i), y(v)]).filter(Boolean);
            if (!pts.length) return;
            if (k === 0) svg += `<defs><linearGradient id="areaG" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${s.color}" stop-opacity=".25"/><stop offset="1" stop-color="${s.color}" stop-opacity="0"/></linearGradient></defs><path d="M${pts[0][0]},${H - B} L${pts.map(p => p.join(",")).join(" L")} L${pts[pts.length - 1][0]},${H - B}Z" fill="url(#areaG)"/>`;
            svg += `<polyline fill="none" stroke="${s.color}" stroke-width="2.2" stroke-linejoin="round" stroke-linecap="round" points="${pts.map(p => p.join(",")).join(" ")}"/>`;
            if (n <= 40) pts.forEach(p => { svg += `<circle cx="${p[0]}" cy="${p[1]}" r="2.6" fill="#fffdf6" stroke="${s.color}" stroke-width="1.6"/>`; });
        });
        svg += `<line id="cx" y1="${T}" y2="${H - B}" stroke="#6D3B07" stroke-opacity=".4" stroke-dasharray="3 3" style="display:none"/><rect id="hit" x="${L}" y="${T}" width="${W - L - R}" height="${H - T - B}" fill="transparent"/></svg>`;
        el.innerHTML = `<div class="chart">${svg}<div class="chart-tip"></div></div>
            <div class="chart-legend">${series.map(s => `<span><i style="background:${s.color}"></i>${HW.esc(s.name)}</span>`).join("")}</div>`;

        const box = el.querySelector(".chart"), tip = box.querySelector(".chart-tip"), cx = box.querySelector("#cx");
        box.querySelector("#hit").addEventListener("mousemove", e => {
            const r = box.querySelector("svg").getBoundingClientRect();
            const px = (e.clientX - r.left) / r.width * W;
            const i = Math.max(0, Math.min(n - 1, Math.round((px - L) / ((W - L - R) / Math.max(n - 1, 1)))));
            cx.style.display = ""; cx.setAttribute("x1", x(i)); cx.setAttribute("x2", x(i));
            tip.innerHTML = `<b>${HW.esc(HW.isoDate(labels[i]))}</b><br>` + series.map(s => `${HW.esc(s.name)}: ${s.values[i] === null ? "—" : s.values[i].toFixed(1) + unit}`).join("<br>");
            tip.style.left = (x(i) / W * r.width) + "px";
            tip.style.top = (Math.min(...series.map(s => s.values[i] === null ? H : y(s.values[i]))) / H * r.height) + "px";
            tip.classList.add("on");
        });
        box.querySelector("#hit").addEventListener("mouseleave", () => { tip.classList.remove("on"); cx.style.display = "none"; });
    };

    /* ---------- page chrome ---------- */
    document.addEventListener("DOMContentLoaded", () => {
        const today = document.getElementById("today");
        if (today) today.textContent = new Date().toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short", year: "numeric" });
        const yr = document.getElementById("year");
        if (yr) yr.textContent = new Date().getFullYear();

        const body = document.body;
        const menu = document.getElementById("menuBtn");
        const scrim = document.getElementById("scrim");
        if (menu) menu.onclick = () => body.classList.toggle("menu-open");
        if (scrim) scrim.onclick = () => body.classList.remove("menu-open");
        document.addEventListener("keydown", e => { if (e.key === "Escape") body.classList.remove("menu-open"); });

        if (!window.HW_SKIP_PING) HW.ping();
    });
})();