// Variabel Global untuk menyimpan data cuaca (Memori Cache agar map instan)
window.dataCuacaGlobal = null;

function formatWaktu(w) {
    if (!w || w.length < 10) return "-";
    return `${w.slice(6, 8)}/${w.slice(4, 6)} ${w.slice(8, 10)}:00`;
}

// ================== LOAD DATA PEGAWAI (Disesuaikan dengan Bootstrap)
// ================== LOAD DATA PEGAWAI (Super Rapi & Sejajar) ==================
async function loadPegawai() {
    const el = document.getElementById("pegawaiList");
    if (!el) return;
    try {
        const r = await fetch("/pegawai");
        if (!r.ok) throw new Error("Gagal fetch data");
        const data = await r.json();
        
        let html = '<div class="row row-cols-1 row-cols-sm-2 row-cols-md-3 row-cols-lg-4 g-4 justify-content-center">';
        data.forEach(p => {
            const nama = p.nama || "Tanpa Nama";
            const jabatan = p.jabatan || "-";
            const nip = p.nip || "-";
            const email = p.email || "-";
            
            let fotoPath = "/static/img/default_pegawai.png"; 
            if (p.foto) {
                fotoPath = p.foto.startsWith('http') ? p.foto : `/static/${p.foto}`;
            }

            html += `
                <div class="col">
                    <div class="card shadow-sm h-100 text-center p-4 border-0 rounded-4 d-flex flex-column">
                        
                        <img src="${fotoPath}" alt="${nama}" class="rounded-circle mx-auto mb-3 border border-3 border-primary shadow-sm" style="width: 100px; height: 100px; object-fit: cover; flex-shrink: 0;">
                        
                        <div class="flex-grow-1 d-flex align-items-center justify-content-center mb-3">
                            <h5 class="card-title fw-bold text-dark mb-0" style="font-size: 1.05rem; line-height: 1.4;">${nama}</h5>
                        </div>
                        
                        <div class="mb-4">
                            <span class="badge bg-primary bg-opacity-10 text-primary border border-primary border-opacity-25 px-3 py-2 rounded-pill fw-bold" style="font-size: 0.85rem;">
                                ${jabatan}
                            </span>
                        </div>
                        
                        <div class="mt-auto pt-3 border-top border-secondary border-opacity-25">
                            <small class="text-muted d-block text-truncate fw-semibold" title="NIP: ${nip}">NIP. ${nip}</small>
                            <small class="text-muted d-block text-truncate" title="Email: ${email}">${email}</small>
                        </div>

                    </div>
                </div>`;
        });
        html += '</div>';
        el.innerHTML = html;
    } catch (e) {
        console.error(e);
        el.innerHTML = "<p class='text-danger text-center'>Gagal memuat data pegawai. Pastikan server Flask berjalan.</p>";
    }
}
// ================== LOAD CUACA (Disesuaikan dengan Bootstrap)
function loadCuacaUtama() {
    const elHarian = document.getElementById("cuacaHarian");
    
    fetch("/api/cuaca_all")
        .then(r => r.json())
        .then(data => {
            window.dataCuacaGlobal = data;

            let html = '<div class="row row-cols-1 row-cols-md-2 row-cols-lg-3 g-4">';
            for (const [nama, hariArray] of Object.entries(data)) {
                const besok = hariArray[1] || hariArray[0]; 
                const lusa = hariArray[2] || hariArray[0];

                html += `
                    <div class="col">
                        <div class="card h-100 shadow-sm border-0 rounded-4 overflow-hidden">
                            <div class="card-header text-white text-center fw-bold py-3" style="background-color: #004a8f;">
                                Kec. ${nama}
                            </div>
                            <div class="card-body p-4">
                                <div class="d-flex justify-content-between align-items-center mb-3">
                                    <div>
                                        <span class="badge bg-secondary mb-2">Besok</span>
                                        <h5 class="mb-0 fw-bold text-dark">${besok.cuaca === "-" ? "N/A" : besok.cuaca}</h5>
                                        <small class="text-muted">🌡️ ${besok.suhu === "-" ? "--" : besok.suhu}°C | 💧 ${besok.rh === "-" ? "--" : besok.rh}%</small>
                                    </div>
                                    <span class="fs-1">⛅</span>
                                </div>
                                <hr class="border-secondary opacity-25">
                                <div class="d-flex justify-content-between align-items-center">
                                    <div>
                                        <span class="badge bg-secondary mb-2">Lusa</span>
                                        <h5 class="mb-0 fw-bold text-dark">${lusa.cuaca === "-" ? "N/A" : lusa.cuaca}</h5>
                                        <small class="text-muted">🌡️ ${lusa.suhu === "-" ? "--" : lusa.suhu}°C | 💧 ${lusa.rh === "-" ? "--" : lusa.rh}%</small>
                                    </div>
                                    <span class="fs-1">☁️</span>
                                </div>
                            </div>
                        </div>
                    </div>`;
            }
            html += '</div>';
            if (elHarian) elHarian.innerHTML = html;

            if (data["Namlea"]) {
                const n = data["Namlea"][0];
                if (document.getElementById("cuacaSekarang")) {
                    document.getElementById("cuacaSekarang").innerText = n.cuaca !== "-" ? n.cuaca : "Belum Tersedia";
                }
                if (document.getElementById("suhu")) {
                    document.getElementById("suhu").innerText = n.cuaca !== "-" ? `${n.suhu} °C` : "--";
                }
                if (document.getElementById("rh")) {
                    document.getElementById("rh").innerText = n.cuaca !== "-" ? `${n.rh} %` : "--";
                }
                if (document.getElementById("lokasiUser")) {
                    document.getElementById("lokasiUser").innerText = "Kab. Buru (Namlea)";
                }
            }
        })
        .catch(() => {
            if (elHarian) elHarian.innerHTML = "<p class='text-danger text-center'>Gagal memuat data cuaca dari server.</p>";
        });
}

// ================== GEMPA
function loadGempa() {
    fetch("https://data.bmkg.go.id/DataMKG/TEWS/autogempa.json")
        .then(r => r.json())
        .then(d => {
            let g = d.Infogempa.gempa;
            if (document.getElementById("gempaSingkat")) {
                document.getElementById("gempaSingkat").innerText = `${g.Magnitude} SR | ${g.Wilayah}`;
            }
            if (document.getElementById("gempaData")) {
                document.getElementById("gempaData").textContent = 
                    `Magnitudo: ${g.Magnitude}\nWilayah: ${g.Wilayah}\nWaktu: ${g.Tanggal} ${g.Jam}\nPotensi: ${g.Potensi}`;
            }
        })
        .catch(e => console.log("Gagal memuat gempa", e));
}

// ================== NAVIGASI SPA
function showPage(id) {
    document.querySelectorAll(".konten").forEach(c => c.classList.remove("aktif"));
    const target = document.getElementById(id);
    if (target) target.classList.add("aktif");

    if (id === "profil") loadPegawai();
    if (id === "gempa") loadGempa();
    if (id === "cuaca" && window.map) {
        setTimeout(() => window.map.invalidateSize(), 300);
    }
}

// ================== INITIALIZATION & MAP SETUP
document.addEventListener("DOMContentLoaded", function() {
    
    // 1. Fungsi Jam Realtime (WIT & UTC) Instan 0 Detik
    function updateJam() {
        const elWIT = document.getElementById("jamWIT");
        const elUTC = document.getElementById("jamUTC");
        const sekarang = new Date();

        if (elWIT) {
            elWIT.innerText = sekarang.toLocaleString("id-ID", { 
                timeZone: 'Asia/Jayapura', 
                weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', 
                hour: '2-digit', minute: '2-digit', second: '2-digit',
                timeZoneName: 'short'
            });
        }

        if (elUTC) {
            elUTC.innerText = sekarang.toLocaleString("id-ID", { 
                timeZone: 'UTC', 
                weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', 
                hour: '2-digit', minute: '2-digit', second: '2-digit',
                timeZoneName: 'short'
            });
        }
    }

    // Panggil fungsi jam langsung di awal
    updateJam(); 
    // Putar fungsi jam setiap 1 detik
    setInterval(updateJam, 1000);

    // 2. Load Data Awal
    loadGempa();
    loadCuacaUtama();

    // 3. Setup Peta (Leaflet)
    const mapContainer = document.getElementById("map");
    if (mapContainer) {
        const bounds = [[-4.5, 125.0], [-2.5, 128.5]];

        window.map = L.map("map", {
            center: [-3.4, 126.7],
            zoom: 9, 
            minZoom: 8,
            maxBounds: bounds, 
            maxBoundsViscosity: 1.0
        });

        L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}", {
            attribution: "Tiles © Esri", 
            noWrap: true
        }).addTo(window.map);

        const kecamatanBuru = [
            {nama:"Namlea", lat:-3.2458, lon:127.0875},
            {nama:"Air Buaya", lat:-3.1186, lon:126.3858},
            {nama:"Waeapo", lat:-3.3935, lon:127.0425},
            {nama:"Waplau", lat:-3.1812, lon:126.8465},
            {nama:"Batabual", lat:-3.4750, lon:127.2050},
            {nama:"Fena Leisela", lat:-3.1250, lon:126.5850},
            {nama:"Lilialy", lat:-3.2100, lon:127.0450},
            {nama:"Lolong Guba", lat:-3.4350, lon:126.9150},
            {nama:"Waelata", lat:-3.4650, lon:126.8650},
            {nama:"Teluk Kaiely", lat:-3.3850, lon:127.1050}
        ];

        let timerTutupPopup;

        kecamatanBuru.forEach(k => {
            let marker = L.marker([k.lat, k.lon]).addTo(window.map);

            marker.bindPopup("⏳ Menunggu data...", { 
                closeButton: false, 
                autoPan: true, 
                autoPanPadding: [40, 40], 
                className: 'custom-popup-cuaca'
            });

            marker.on("mouseover", function() {
                clearTimeout(timerTutupPopup); 

                if (!window.dataCuacaGlobal || !window.dataCuacaGlobal[k.nama]) {
                    marker.setPopupContent("⏳ Menunggu data...");
                    marker.openPopup();
                    return;
                }

                const hariIni = window.dataCuacaGlobal[k.nama][0]; 
                const tempDisplay = hariIni.suhu === "-" ? "--" : hariIni.suhu;
                const rhDisplay = hariIni.rh === "-" ? "--" : hariIni.rh;
                const anginDisplay = hariIni.angin === "-" ? "--" : hariIni.angin;

                let isiTooltip = `
                    <div class="tooltip-pro" style="min-width: 140px;">
                        <div class="tooltip-header" style="font-weight:bold; color:#004a8f; font-size:14px;">Kec. ${k.nama}</div>
                        <div class="tooltip-status" style="font-size:10px; background:#e1effe; color:#004a8f; padding:2px 6px; border-radius:8px; margin:5px 0; display:inline-block;">HARI INI</div>
                        <div class="tooltip-main" style="margin:8px 0;">
                            <span style="font-size:24px; vertical-align:middle;">🌤️</span>
                            <span style="font-size:22px; font-weight:bold; color:#333; margin-left:5px; vertical-align:middle;">${tempDisplay}°C</span>
                        </div>
                        <div class="tooltip-footer" style="font-size:11px; color:#555; border-top:1px solid #eee; padding-top:6px; text-align:left;">
                            💧 RH: <b>${rhDisplay}%</b><br>
                            💨 Angin: <b>${anginDisplay} km/j</b>
                        </div>
                    </div>
                `;
                
                marker.setPopupContent(isiTooltip);
                marker.openPopup();
            });

            marker.on("mouseout", function() {
                timerTutupPopup = setTimeout(() => {
                    marker.closePopup();
                }, 800); 
            });
        });

        window.map.on('popupopen', function(e) {
            let nodePopup = e.popup.getElement();
            if (nodePopup) {
                nodePopup.addEventListener('mouseenter', () => clearTimeout(timerTutupPopup));
                nodePopup.addEventListener('mouseleave', () => {
                    timerTutupPopup = setTimeout(() => window.map.closePopup(e.popup), 800);
                });
            }
        });
    }
});