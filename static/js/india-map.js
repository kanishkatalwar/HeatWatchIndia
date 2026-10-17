/* India map module: schematic state outlines drawn from approximate lat/lon points.
   The outline is built in (not downloaded) so the project works offline. It is a
   visual aid, not a survey-grade boundary. */
const IndiaMap = (() => {
    const NS = "http://www.w3.org/2000/svg";
    const KX = 10.4, KY = 11.2, VB0 = [-8, -8, 335, 352];
    const px = (x, y) => [(x - 67.5) * KX, (37.5 - y) * KY];
    const pts = a => { const o = []; for (let i = 0; i < a.length; i += 2) o.push(px(a[i], a[i + 1]).map(v => v.toFixed(1)).join(",")); return o.join(" "); };
    const norm = s => String(s || "").toLowerCase().replace(/&/g, " and ").replace(/[^a-z ]/g, " ").replace(/\s+/g, " ").trim();

    const OUT = [74.4,37,75.9,36.7,77.8,35.5,80.2,35.4,80.3,34.3,79.5,32.8,78.8,32.5,78.8,31,79,30.9,80.2,30.3,81,30.2,80.2,28.8,81.3,28.2,82.7,27.5,83.9,27.4,84.6,27.2,86,26.6,87.3,26.4,88.1,27.8,88.8,28,88.9,27.3,89,26.8,92,26.8,92.1,27.8,93.5,28.6,95.2,29.4,96.2,29,97.4,28.2,97,27.2,96.1,27.2,95.2,26,94.5,25.2,94.6,24,94.3,23.2,93.4,23,93.2,22,92.5,22,92.3,23.7,91.4,24.1,91.2,23,91.5,24.5,91.9,25.1,90,25.2,89.8,25.9,89.9,26.3,89,26.3,88.4,26.2,88.4,25.5,88.1,24.7,88.7,24.2,88.9,23.6,88.6,22.9,89,22.1,89,21.6,88,21.6,87,21.2,86.9,20.6,86.5,20.3,85.8,19.9,85,19.3,84.2,18.3,83.3,17.7,82.3,16.6,81.7,16.3,80.9,15.8,80.2,15,80.1,14,80.3,13.1,79.9,12.3,79.8,11.4,79.4,10.4,78.9,9.3,78.2,8.9,77.5,8.1,76.7,8.7,76.3,9.6,75.9,11,75.2,12.2,74.7,13.1,74.4,14.5,73.8,15.5,73.4,16.6,73,17.8,72.8,19,72.7,20.3,72.9,21.1,72.6,21.6,72.5,22.3,72.2,21.3,71,20.7,70,21,69,22.3,70,22.5,70.7,22.9,69.5,22.9,68.6,23.3,68.2,23.7,68.8,24.3,70.1,24.3,70.6,25,70.1,25.7,69.5,26.6,70.3,27.8,71.9,28,73,29,74,29.8,74.6,30.5,74.4,31,74.9,31.8,74.6,32.6,74,33,73.6,33.9,73,34.4,73.8,35,72.6,35.8,72.9,36.7];
    const RAW = [
['f','Jammu, Kashmir & Ladakh',[71,38.5,81.5,38.5,81.5,33,78.5,32.8,77.7,32.6,76.9,32.9,76,32.9,75.5,32.5,74,32.3,71,32.3]],
['f','Himachal Pradesh',[75.5,32.5,76,32.9,76.9,32.9,77.7,32.6,78.5,32.8,79.2,32,79.2,31,78.2,30.6,77.4,30.4,76.9,30.7,76.5,31,76.2,31.6,75.8,32]],
['f','Punjab',[73,32.5,75.5,32.5,75.8,32,76.2,31.6,76.5,31,76.7,30.4,75.4,29.5,74.2,29.7,73,30.2]],
['f','Haryana',[76.7,30.4,77.4,30.4,77.6,30,77.5,29.3,77.35,28.2,76.9,27.7,76.2,27.7,75.4,28,74.5,28.7,74.4,29.4,75.4,29.5]],
['f','Uttarakhand',[77.4,30.4,78.2,30.6,79.2,31,80.2,30.6,81.1,30.2,80.5,29,79.5,28.7,78.7,29.2,77.9,29.5,77.6,30]],
['raj','Rajasthan',[68,30,73,30.2,74.2,29.7,74.4,29.4,74.5,28.7,75.4,28,76.2,27.7,76.9,27.7,77.35,28.2,77.5,27.4,77.9,26.7,78.3,26,78,25.1,76.5,25,75.4,24.5,74.7,24.4,74.4,23.6,73.9,23.7,73.1,24.2,72.4,24.6,71.6,24.2,71,24.3,69.5,24,68,24]],
['guj','Gujarat',[68,24,69.5,24,71,24.3,71.6,24.2,72.4,24.6,73.1,24.2,73.9,23.7,74.2,23,74,22.3,73.7,21.5,73.4,20.9,73,20.2,71,19,66,19,66,24]],
['up','Uttar Pradesh',[77.6,30,77.9,29.5,78.7,29.2,79.5,28.7,80.5,29,81.1,28.6,82.5,27.6,84,27.3,84.6,26.8,84.6,25.8,84,24.5,83,24.1,82,24.4,81,24.3,80.2,25.2,79.3,25.5,78.6,25.2,78.2,26,77.9,26.7,77.5,27.4,77.35,28.2,77.5,29.3]],
['f','Bihar',[84.6,27.4,86,26.7,87.3,26.4,88.2,26.5,88,25.6,87.6,25.2,86.5,25,85.5,24.7,84.7,24.5,84,24.5,84.6,25.8,84.6,26.8]],
['f','Jharkhand',[83.9,24,84.2,23.3,84,22.4,84.8,22.5,85.5,22,86.5,21.8,87,22.2,87.4,22.6,87.8,23.5,87.8,24.5,87.6,25.2,86.5,25,85.5,24.7,84.7,24.5,84,24.5]],
['f','Madhya Pradesh',[74,21.6,75,21.5,76,21.6,77,21.8,78,21.9,79,21.7,80,21.5,80.2,22,80.5,22.7,81,23.3,81,24.3,80.2,25.2,79.3,25.5,78.6,25.2,78.2,26,78,25.1,76.5,25,75.4,24.5,74.7,24.4,74.4,23.6,74.2,23,74,22.3]],
['f','Chhattisgarh',[80,21.5,80.5,20.4,80.8,19.8,80.9,18.5,81,17.8,81.7,17.8,82.2,18.3,83,19,83.4,20.3,83.6,21.5,84,22.4,84.2,23.3,83.9,24,83,24.1,82,24.4,81,24.3,81,23.3,80.5,22.7,80.2,22]],
['f','Odisha',[83,19,83.4,20.3,83.6,21.5,84,22.4,84.8,22.5,85.5,22,86.5,21.8,87.5,21.5,88,21,88,18,85,18,84,19.2]],
['wb','West Bengal',[88,26.9,89.9,26.9,89.9,25,90,21,86,21,86.5,21.8,87,22.2,87.4,22.6,87.8,23.5,87.8,24.5,88,25.6,88.2,26.5]],
['f','Sikkim & North-East',[88,26.9,88,27.4,88.2,28.3,98,30,98,21.5,92,21.5,90.5,24,89.9,25,89.9,26.9]],
['mh','Maharashtra',[72,21,73.4,20.9,74,21.5,75,21.5,76,21.6,77,21.8,78,21.9,79,21.7,80,21.5,80.5,20.4,80.8,19.8,80.2,19,79,19.4,78.2,19.4,78,18.8,77.5,18.2,77.2,17.8,76.2,17.5,75.2,17.1,74.4,16.5,74.1,15.8,73.6,15.7,72,15.7]],
['tg','Telangana',[80.8,19.8,80.2,19,79,19.4,78.2,19.4,78,18.8,77.5,18.2,77.2,17.8,77.4,16.8,77.2,16,77.8,15.6,78.5,16,79.2,16.2,79.8,16.4,80.5,16.5,81,17,81,17.8,80.9,18.5]],
['f','Andhra Pradesh',[77.8,15.6,78.5,16,79.2,16.2,79.8,16.4,80.5,16.5,81,17,81,17.8,81.7,17.8,82.2,18.3,83,19,84,19.2,85.2,19.5,86,19.5,86,13,80.2,13.6,79.6,13.4,79,13.3,78.5,13.2,78.2,13.6,77.6,14.2,77.2,15]],
['ka','Karnataka',[72,15.7,73.6,15.7,74.1,15.8,74.4,16.5,75.2,17.1,76.2,17.5,77.2,17.8,77.4,16.8,77.2,16,77.8,15.6,77.2,15,77.6,14.2,78.2,13.6,78.5,13.2,78,12.6,77.8,12,77.5,11.7,76.8,11.7,76.4,11.9,75.8,12,75.4,12.4,75,12.6,72,12.6]],
['f','Kerala',[72,12.6,75,12.6,75.4,12.4,75.8,12,76.4,11.9,76.8,11.7,77,11.2,77.2,10.4,77.4,9.7,77.2,9,77,8.5,77.2,7.5,72,7.5]],
['tn','Tamil Nadu',[76.8,11.7,77.5,11.7,77.8,12,78,12.6,78.5,13.2,79,13.3,79.6,13.4,80.2,13.6,81,13.7,81,7.5,77.2,7.5,77,8.5,77.2,9,77.4,9.7,77.2,10.4,77,11.2]],
['dl','Delhi',[76.95,28.4,77.35,28.4,77.35,28.9,76.95,28.9]]];

    // DB "State" values each polygon answers to
    const NAMEKEY = {
        "Jammu, Kashmir & Ladakh": ["jk", ["jammu and kashmir", "ladakh", "jammu kashmir and ladakh"]],
        "Himachal Pradesh": ["hp", ["himachal pradesh"]], "Punjab": ["pb", ["punjab"]], "Haryana": ["hr", ["haryana"]],
        "Uttarakhand": ["uk", ["uttarakhand", "uttaranchal"]], "Rajasthan": ["raj", ["rajasthan"]], "Gujarat": ["guj", ["gujarat"]],
        "Uttar Pradesh": ["up", ["uttar pradesh"]], "Bihar": ["br", ["bihar"]], "Jharkhand": ["jh", ["jharkhand"]],
        "Madhya Pradesh": ["mp", ["madhya pradesh"]], "Chhattisgarh": ["cg", ["chhattisgarh"]], "Odisha": ["od", ["odisha", "orissa"]],
        "West Bengal": ["wb", ["west bengal"]],
        "Sikkim & North-East": ["ne", ["assam", "sikkim", "meghalaya", "arunachal pradesh", "nagaland", "manipur", "mizoram", "tripura"]],
        "Maharashtra": ["mh", ["maharashtra"]], "Telangana": ["tg", ["telangana"]], "Andhra Pradesh": ["ap", ["andhra pradesh"]],
        "Karnataka": ["ka", ["karnataka"]], "Kerala": ["kl", ["kerala"]], "Tamil Nadu": ["tn", ["tamil nadu"]],
        "Delhi": ["dl", ["delhi", "nct of delhi", "new delhi", "national capital territory of delhi"]]
    };
    const STATES = RAW.map(([, name, flat]) => ({ k: NAMEKEY[name][0], n: name, m: NAMEKEY[name][1], p: flat }));

    // zoom target per state: [lon, lat, span in degrees of longitude]
    const FOC = {
        jk: [76, 34.5, 12], hp: [77.2, 31.7, 4.5], pb: [75.4, 31, 4], hr: [76.2, 29.2, 3.8], uk: [79, 30.1, 4.5],
        raj: [74.6, 26.4, 9.5], guj: [71.6, 22.4, 7.5], up: [80.6, 26.8, 8.2], br: [85.8, 25.8, 6], jh: [85.3, 23.5, 5],
        mp: [78, 23.5, 10], cg: [82, 21.5, 6.5], od: [84.3, 20.5, 6.5], wb: [88, 24.4, 5.5], ne: [93, 26, 12],
        mh: [76.4, 19.2, 9.5], tg: [79, 17.6, 5], ap: [80, 15.8, 8], ka: [76.2, 14.4, 7], kl: [76.4, 10.2, 5.5],
        tn: [78.4, 10.8, 6], dl: [77.15, 28.65, 1.7]
    };

    // approximate [lon, lat] of well-known cities, matched by REGION.Region_Name
    const CITY = {
        jaipur: [75.79, 26.91], jodhpur: [73.02, 26.24], ahmedabad: [72.58, 23.02], surat: [72.83, 21.17], delhi: [77.21, 28.61],
        "new delhi": [77.21, 28.61], lucknow: [80.95, 26.85], kanpur: [80.35, 26.45], varanasi: [82.99, 25.32], nagpur: [79.09, 21.15],
        mumbai: [72.88, 19.08], pune: [73.86, 18.52], hyderabad: [78.49, 17.39], bengaluru: [77.59, 12.97], bangalore: [77.59, 12.97],
        chennai: [80.27, 13.08], coimbatore: [76.96, 11.0], madurai: [78.12, 9.92], kolkata: [88.36, 22.57], patna: [85.14, 25.59],
        bhopal: [77.41, 23.26], indore: [75.86, 22.72], raipur: [81.63, 21.25], ranchi: [85.33, 23.34], bhubaneswar: [85.82, 20.3],
        visakhapatnam: [83.22, 17.69], vijayawada: [80.65, 16.51], kochi: [76.27, 9.93], thiruvananthapuram: [76.94, 8.52],
        chandigarh: [76.78, 30.73], amritsar: [74.87, 31.63], dehradun: [78.03, 30.32], shimla: [77.17, 31.1], srinagar: [74.8, 34.08],
        guwahati: [91.74, 26.14]
    };

    const COLORS = [[243, 213, 138], [227, 154, 69], [196, 85, 42], [142, 31, 20]];
    let svg, opts = {}, cur = null, gClip, tracer = [], vb = VB0.slice(), raf = 0, domain = [36, 46.5], gMarks, byKey = {};

    const mk = (tag, attrs, parent) => {
        const e = document.createElementNS(NS, tag);
        for (const k in attrs) e.setAttribute(k, attrs[k]);
        (parent || svg).appendChild(e);
        return e;
    };

    function color(t) {
        const f = Math.max(0, Math.min(1, (t - domain[0]) / (domain[1] - domain[0]))) * (COLORS.length - 1);
        const i = Math.min(COLORS.length - 2, Math.floor(f)), k = f - i;
        return "rgb(" + COLORS[i].map((v, j) => Math.round(v + (COLORS[i + 1][j] - v) * k)).join(",") + ")";
    }

    function init(el, o) {
        svg = el; opts = o || {};
        svg.setAttribute("viewBox", VB0.join(" "));

        for (let lo = 70; lo <= 95; lo += 5) {
            const x = px(lo, 0)[0];
            mk("line", { x1: x, x2: x, y1: px(0, 38)[1], y2: px(0, 6)[1], class: "m-grat" });
            mk("text", { x: x + 2, y: px(0, 6.4)[1], class: "m-gt" }).textContent = lo + "°E";
        }
        for (let la = 10; la <= 35; la += 5) {
            const y = px(0, la)[1];
            mk("line", { x1: px(66, 0)[0], x2: px(98, 0)[0], y1: y, y2: y, class: "m-grat" });
            mk("text", { x: px(66.3, 0)[0], y: y - 2, class: "m-gt" }).textContent = la + "°N";
        }

        mk("polygon", { points: pts(OUT), class: "m-base" });
        const clip = mk("clipPath", { id: "indiaClip" });
        mk("polygon", { points: pts(OUT) }, clip);
        const g = mk("g", { "clip-path": "url(#indiaClip)" }); gClip = g;

        STATES.forEach(s => {
            const p = mk("polygon", { points: pts(s.p), class: "st f" }, g);
            const t = document.createElementNS(NS, "title"); t.textContent = s.n; p.appendChild(t);
            p.addEventListener("click", () => { if (p.classList.contains("k")) select(s.k); });
            p.addEventListener("keydown", e => { if (e.key === "Enter" && p.classList.contains("k")) select(s.k); });
            p.dataset.k = s.k;
            byKey[s.k] = p;
        });

        mk("polygon", { points: pts(OUT), class: "m-outline" });
        [["ARABIAN SEA", 70.5, 14], ["BAY OF BENGAL", 86.5, 14.5], ["INDIAN OCEAN", 80, 6.6]].forEach(([t, x, y]) => {
            const [a, b] = px(x, y);
            mk("text", { x: a, y: b, class: "m-sea", "text-anchor": "middle" }).textContent = t;
        });
        gMarks = mk("g", {});

        svg.addEventListener("mousemove", e => {
            if (!opts.coord) return;
            const p = svg.createSVGPoint(); p.x = e.clientX; p.y = e.clientY;
            const q = p.matrixTransform(svg.getScreenCTM().inverse());
            opts.coord.textContent = (37.5 - q.y / KY).toFixed(2) + "°N  " + (q.x / KX + 67.5).toFixed(2) + "°E";
        });
        svg.addEventListener("mouseleave", () => { if (opts.coord) opts.coord.textContent = "—"; });
    }

    // regions: [{id, name, state, key, temp}] ; dom: [low, high] for the colour scale
    function setData(regions, dom) {
        domain = dom;
        const best = {};
        regions.forEach(r => { if (r.key && r.temp !== null && (best[r.key] === undefined || r.temp > best[r.key])) best[r.key] = r.temp; });

        STATES.forEach(s => {
            const e = byKey[s.k], t = best[s.k];
            e.setAttribute("class", "st " + (t === undefined ? "f" : "k") + (cur === s.k ? " sel" : ""));
            if (t === undefined) { e.style.fill = ""; e.removeAttribute("tabindex"); e.removeAttribute("aria-label"); e.removeAttribute("role"); }
            else { e.style.fill = color(t); e.tabIndex = 0; e.setAttribute("role", "button"); e.setAttribute("aria-label", s.n + ", " + t.toFixed(1) + " degrees"); }
        });

        gMarks.replaceChildren();
        const hottest = regions.filter(r => r.temp !== null && r.key).sort((a, b) => b.temp - a.temp)[0];
        const used = {};
        regions.forEach(r => {
            if (!r.key || r.temp === null) return;
            let ll = CITY[norm(r.name)];
            if (!ll) { const f = FOC[r.key]; used[r.key] = (used[r.key] || 0) + 1; ll = [f[0], f[1] - 0.9 * (used[r.key] - 1)]; }
            const [x, y] = px(ll[0], ll[1]);
            const g = mk("g", { class: "cty" + (cur === r.key ? " on" : ""), "data-k": r.key }, gMarks);
            if (hottest && hottest.id === r.id) mk("circle", { cx: x, cy: y, class: "m-halo" }, g);
            mk("circle", { cx: x, cy: y, class: "m-ring" }, g);
            mk("circle", { cx: x, cy: y, class: "m-core" }, g);
            mk("text", { x: x + 5, y: y - 2, class: "m-lab" }, g).textContent = r.temp.toFixed(1);
            mk("text", { x: x + 5, y: y + 6, class: "m-cn" }, g).textContent = r.name;
            const title = document.createElementNS(NS, "title"); title.textContent = r.name + " · " + r.temp.toFixed(1) + "°C"; g.appendChild(title);
            g.addEventListener("click", () => select(r.key));
        });
    }

    function go(to) {
        cancelAnimationFrame(raf);
        const from = vb.slice(), t0 = performance.now();
        const dur = matchMedia("(prefers-reduced-motion: reduce)").matches ? 1 : 850;
        (function step(now) {
            let x = Math.min(1, (now - t0) / dur);
            x = x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
            vb = from.map((a, i) => a + (to[i] - a) * x);
            svg.setAttribute("viewBox", vb.join(" "));
            svg.style.setProperty("--u", vb[2] / VB0[2]);
            if (x < 1) raf = requestAnimationFrame(step);
        })(t0);
    }

    function hint(t) { if (opts.hint) opts.hint.textContent = t; }

    function select(k) {
        if (!byKey[k]) return;
        if (cur === k) { reset(); return; }
        cur = k;
        svg.querySelectorAll(".sel").forEach(e => e.classList.remove("sel"));
        byKey[k].classList.add("sel");
        clearTrace();
        const pts_ = pts(STATES.find(s => s.k === k).p);
        tracer = [mk("polygon", { points: pts_, class: "trace-under" }, gClip), mk("polygon", { points: pts_, class: "trace" }, gClip)];
        opts.wrap.classList.add("zoomed");
        const f = FOC[k], w = f[2] * KX, h = w * VB0[3] / VB0[2], c = px(f[0], f[1]);
        go([c[0] - w / 2, c[1] - h / 2, w, h]);
        gMarks.querySelectorAll(".cty").forEach(m => m.classList.toggle("on", m.dataset.k === k));
        hint("CLICK STATE AGAIN TO ZOOM OUT");
        if (opts.onSelect) opts.onSelect(k);
    }

    function clearTrace() { tracer.forEach(e => e.remove()); tracer = []; }

    function reset() {
        cur = null;
        clearTrace();
        svg.querySelectorAll(".sel").forEach(e => e.classList.remove("sel"));
        opts.wrap.classList.remove("zoomed");
        gMarks.querySelectorAll(".cty").forEach(m => m.classList.remove("on"));
        go(VB0);
        hint("CLICK A STATE TO ZOOM");
        if (opts.onReset) opts.onReset();
    }

    const keyFor = stateName => { const n = norm(stateName); const s = STATES.find(x => x.m.includes(n)); return s ? s.k : null; };
    const nameOf = k => (STATES.find(s => s.k === k) || {}).n || k;

    return { init, setData, select, reset, keyFor, nameOf, color, current: () => cur };
})();