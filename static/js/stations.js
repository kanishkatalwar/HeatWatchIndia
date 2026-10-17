(function () {
    const $ = id => document.getElementById(id);
    const KNOWN = ["Station_ID", "Station_Name", "Region_ID", "Status", "Region_Name", "State",
                   "Latest_Temperature", "Latest_Humidity", "Latest_Observation_Date"];
    let table, cols = [];

    function buildColumns(rows) {
        cols = [
            { label: "Station", sort: r => r.Station_Name || r.Station_ID, render: r => `<strong>${HW.esc(r.Station_Name || "Station #" + r.Station_ID)}</strong><div class="muted" style="font-size:10px">ID ${HW.esc(r.Station_ID)}</div>` },
            { label: "Region", sort: r => r.Region_Name || "", render: r => HW.esc(r.Region_Name || "Region " + r.Region_ID) },
            { label: "State", sort: r => r.State || "", render: r => HW.esc(r.State || "—") },
            { label: "Status", sort: r => r.Status || "", render: r => HW.isActive(r.Status)
                ? `<span class="risk-badge st-active">● Active</span>` : `<span class="risk-badge st-off">● ${HW.esc(r.Status || "Unknown")}</span>` },
            { label: "Latest temp", sort: r => HW.num(r.Latest_Temperature), cls: "temperature", render: r => HW.temp(r.Latest_Temperature) },
            { label: "Humidity", sort: r => HW.num(r.Latest_Humidity), render: r => HW.num(r.Latest_Humidity) === null ? "—" : Number(r.Latest_Humidity).toFixed(0) + "%" },
            { label: "Observed", sort: r => r.Latest_Observation_Date || "", render: r => HW.esc(HW.isoDate(r.Latest_Observation_Date)) }
        ];
        // show any extra WEATHER_STATION columns that exist in your schema
        const extra = rows.length ? Object.keys(rows[0]).filter(k => !KNOWN.includes(k)) : [];
        extra.forEach(k => cols.push({ label: HW.title(k), sort: r => r[k] ?? "", render: r => HW.esc(r[k] ?? "—") }));
    }

    async function load() {
        const tbody = document.querySelector("#stationTable tbody");
        if (!table) { buildColumns([]); makeTable(); }
        HW.loadingRows(tbody, cols.length);
        try {
            const rows = await HW.api("/api/stations/detail");
            buildColumns(rows); makeTable();
            HW.fillSelect($("regionFilter"), rows.map(r => r.Region_Name), "All regions");
            HW.fillSelect($("statusFilter"), rows.map(r => r.Status), "All statuses");
            const act = rows.filter(r => HW.isActive(r.Status)).length;
            const temps = rows.map(r => HW.num(r.Latest_Temperature)).filter(v => v !== null);
            $("sumTotal").textContent = rows.length; $("sumActive").textContent = act;
            $("sumInactive").textContent = rows.length - act;
            $("sumTemp").textContent = temps.length ? (temps.reduce((a, b) => a + b, 0) / temps.length).toFixed(1) + "°C" : "—";
            table.setRows(rows); HW.synced();
        } catch (e) { HW.errorRow(tbody, cols.length, e.message, load); HW.setStatus(false); }
    }

    function makeTable() {
        table = HW.dataTable({
            table: $("stationTable"), columns: cols, search: $("search"), count: $("count"),
            searchText: r => Object.values(r).join(" "),
            filters: [{ el: $("regionFilter"), test: (r, v) => r.Region_Name === v }, { el: $("statusFilter"), test: (r, v) => r.Status === v }],
            sortIndex: 0, sortDir: 1, empty: "No weather stations are registered yet."
        });
    }

    document.addEventListener("DOMContentLoaded", load);
})();