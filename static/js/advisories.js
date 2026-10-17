(function () {
    const $ = id => document.getElementById(id);
    let rows = [], level = "ALL";

    function render() {
        const q = $("search").value.trim().toLowerCase(), region = $("regionFilter").value;
        const out = rows.filter(a =>
            (level === "ALL" || HW.alert(a.Alert_Level) === level) &&
            (region === "ALL" || a.Region_Name === region) &&
            (!q || [a.Region_Name, a.State, a.Message, a.Alert_Level].join(" ").toLowerCase().includes(q)));
        $("count").textContent = `${out.length} of ${rows.length}`;
        const grid = $("advisoryGrid");
        if (!out.length) { HW.emptyBox(grid, rows.length ? "No advisories match your filters." : "No advisories have been issued yet."); return; }
        grid.innerHTML = out.map(a => {
            const lv = HW.alert(a.Alert_Level);
            return `<article class="adv-card ${lv}">
                <header><h3>${HW.esc(a.Region_Name || "Advisory #" + a.Advisory_ID)}</h3><span class="alert-level ${lv}">${lv}</span></header>
                <div class="muted" style="font-size:11px">${HW.esc(a.State || "")}${a.Max_Temperature !== null && a.Max_Temperature !== undefined ? " · forecast " + HW.temp(a.Max_Temperature) : ""}</div>
                <p>${HW.esc(a.Message || "No message provided.")}</p>
                <footer><span>${HW.esc(HW.date(a.Day, a.Month, a.Year))}</span><span>Advisory #${HW.esc(a.Advisory_ID)} · Forecast #${HW.esc(a.Forecast_ID ?? "N/A")}</span></footer></article>`;
        }).join("");
    }

    async function load() {
        const grid = $("advisoryGrid");
        grid.innerHTML = `<div class="skeleton" style="height:130px"></div><div class="skeleton" style="height:130px"></div><div class="skeleton" style="height:130px"></div>`;
        try {
            rows = await HW.api("/api/advisories/detail");
            HW.fillSelect($("regionFilter"), rows.map(a => a.Region_Name), "All regions");
            $("sumTotal").textContent = rows.length;
            ["RED", "ORANGE", "YELLOW"].forEach(l => $("sum" + l).textContent = rows.filter(a => HW.alert(a.Alert_Level) === l).length);
            render(); HW.synced();
        } catch (e) { HW.errorBox(grid, e.message, load); HW.setStatus(false); }
    }

    document.addEventListener("DOMContentLoaded", () => {
        HW.chips($("levelChips"), ["ALL", "RED", "ORANGE", "YELLOW"], v => { level = v; render(); });
        $("search").addEventListener("input", render);
        $("regionFilter").addEventListener("change", render);
        load();
    });
})();