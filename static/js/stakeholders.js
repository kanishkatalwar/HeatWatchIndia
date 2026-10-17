(function () {
    const $ = id => document.getElementById(id);
    const KNOWN = ["Stakeholder_ID", "Name", "Region_ID", "Region_Name", "State", "Advisory_Count"];
    let table, cols = [];

    function buildColumns(rows) {
        const hasCount = rows.length && "Advisory_Count" in rows[0];
        cols = [
            { label: "ID", sort: r => HW.num(r.Stakeholder_ID), render: r => HW.esc(r.Stakeholder_ID) },
            { label: "Name", sort: r => r.Name || "", render: r => `<strong>${HW.esc(r.Name ?? "N/A")}</strong>` },
            { label: "Region", sort: r => r.Region_Name || "", render: r => HW.esc(r.Region_Name || "Region " + r.Region_ID) },
            { label: "State", sort: r => r.State || "", render: r => HW.esc(r.State || "—") }
        ];
        if (hasCount) cols.push({ label: "Linked advisories", sort: r => HW.num(r.Advisory_Count), render: r => `<span class="risk-badge ${r.Advisory_Count ? "ORANGE" : "INFO"}">${HW.esc(r.Advisory_Count)}</span>` });
        // any additional STAKEHOLDER columns in your schema
        const extra = rows.length ? Object.keys(rows[0]).filter(k => !KNOWN.includes(k)) : [];
        extra.forEach(k => cols.push({ label: HW.title(k), sort: r => r[k] ?? "", render: r => HW.esc(r[k] ?? "—") }));
    }

    function makeTable() {
        table = HW.dataTable({
            table: $("stakeholderTable"), columns: cols, search: $("search"), count: $("count"),
            searchText: r => Object.values(r).join(" "),
            filters: [{ el: $("regionFilter"), test: (r, v) => r.Region_Name === v }],
            sortIndex: 0, sortDir: 1, empty: "No stakeholders are registered yet."
        });
    }

    async function load() {
        const tbody = document.querySelector("#stakeholderTable tbody");
        if (!table) { buildColumns([]); makeTable(); }
        HW.loadingRows(tbody, cols.length);
        try {
            const rows = await HW.api("/api/stakeholders/detail");
            buildColumns(rows); makeTable();
            HW.fillSelect($("regionFilter"), rows.map(r => r.Region_Name), "All regions");
            table.setRows(rows); HW.synced();
        } catch (e) { HW.errorRow(tbody, cols.length, e.message, load); HW.setStatus(false); }
    }

    document.addEventListener("DOMContentLoaded", load);
})();