(function () {
    const $ = id => document.getElementById(id);
    let table, max = 50;

    const cols = [
        { label: "Region", render: r => `<strong>${HW.esc(r.Region_Name || "Region " + r.Region_ID)}</strong>`, sort: r => r.Region_Name || "" },
        { label: "State", render: r => HW.esc(r.State || "—"), sort: r => r.State || "" },
        { label: "Forecast date", render: r => HW.esc(HW.date(r.Day, r.Month, r.Year)), sort: r => HW.dateKey(r.Day, r.Month, r.Year) },
        { label: "Max temperature", sort: r => HW.num(r.Max_Temperature), render: r => {
            const t = HW.num(r.Max_Temperature);
            return `<div class="temp-cell"><span class="temperature">${HW.temp(t)}</span><div class="bar-bg"><div class="bar-fill" style="width:${t === null ? 0 : Math.max(6, t / max * 100)}%"></div></div></div>`;
        } },
        { label: "Risk", sort: r => HW.num(r.Max_Temperature), render: r => { const k = HW.risk(r.Max_Temperature); return HW.badge(k.label, k.cls); } },
        { label: "Severity (DB)", sort: r => r.Severity_Level || "", render: r => HW.esc(r.Severity_Level || "—") }
    ];

    async function load() {
        HW.loadingRows(document.querySelector("#forecastTable tbody"), cols.length);
        try {
            const rows = await HW.api("/api/forecasts/detail");
            max = Math.max(50, ...rows.map(r => HW.num(r.Max_Temperature) || 0));
            HW.fillSelect($("regionFilter"), rows.map(r => r.Region_Name), "All regions");
            HW.fillSelect($("severityFilter"), rows.map(r => r.Severity_Level), "All severities");
            const nums = rows.map(r => HW.num(r.Max_Temperature)).filter(v => v !== null);
            $("sumTotal").textContent = rows.length;
            $("sumMax").textContent = nums.length ? Math.max(...nums).toFixed(1) + "°C" : "—";
            $("sumAvg").textContent = nums.length ? (nums.reduce((a, b) => a + b, 0) / nums.length).toFixed(1) + "°C" : "—";
            $("sumCrit").textContent = nums.filter(v => v >= 45).length;
            table.setRows(rows);
            HW.synced();
        } catch (e) { HW.errorRow(document.querySelector("#forecastTable tbody"), cols.length, e.message, load); HW.setStatus(false); }
    }

    document.addEventListener("DOMContentLoaded", () => {
        table = HW.dataTable({
            table: $("forecastTable"), columns: cols, search: $("search"), count: $("count"),
            searchText: r => [r.Region_Name, r.State, r.Severity_Level, HW.date(r.Day, r.Month, r.Year)].join(" "),
            filters: [
                { el: $("regionFilter"), test: (r, v) => r.Region_Name === v },
                { el: $("severityFilter"), test: (r, v) => r.Severity_Level === v },
                { el: $("riskFilter"), test: (r, v) => HW.risk(r.Max_Temperature).label === v }
            ],
            sortIndex: 3, sortDir: -1, empty: "No forecasts have been recorded yet."
        });
        load();
    });
})();