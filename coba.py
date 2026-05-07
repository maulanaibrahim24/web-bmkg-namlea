import time
import requests
import sqlite3
import os
# Tambahan import 'redirect' di sini
from flask import Flask, render_template, request, jsonify, redirect
from werkzeug.utils import secure_filename

app = Flask(__name__)

# ==========================================
# PENGATURAN DATABASE & UPLOAD FOTO
# ==========================================
# Folder penyimpanan foto sesuai screenshot Anda
UPLOAD_FOLDER = 'static/img'
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

def get_db():
    conn = sqlite3.connect('stasiun.db')
    conn.row_factory = sqlite3.Row
    return conn

# Fungsi untuk membuat tabel database otomatis saat pertama kali dijalankan
def init_db():
    with app.app_context():
        db = get_db()
        # Tabel Konten (Berita, Visi Misi, Artikel)
        db.execute('''CREATE TABLE IF NOT EXISTS konten 
                     (id INTEGER PRIMARY KEY AUTOINCREMENT, 
                      kategori TEXT, 
                      judul TEXT, 
                      isi TEXT, 
                      foto TEXT, 
                      tanggal TIMESTAMP DEFAULT CURRENT_TIMESTAMP)''')
        db.commit()

init_db()

# ==========================================
# DATA PEGAWAI (Tetap pakai List Anda dulu)
# ==========================================
PEGAWAI = [
    {
        "nama": "Warjo, S.Tr.", 
        "jabatan": "Kepala Stasiun", 
        "nip": "19XXXXXXXXXXXXXX", 
        "email": "warjo@bmkg.go.id", 
        "foto": "img/Namlea1.png" # Berikan foto default jika tidak ada
    },
    {
        "nama": "M.Ikram Sampulawa S.Tr.", 
        "jabatan": "Kapoksi",  
        "nip": "-", 
        "email": "-", 
        "foto": "img/Youtube.png"
    },
    {
        "nama": "Sarfudin Rideng, S.Tr.", 
        "jabatan": "Forecaster",
        "nip": "-", 
        "email": "-", 
        "foto": "img/foto_maulana.png"
    },
    {
        "nama": "Abdul Hamid Patinasarany", 
        "jabatan": "Observer",
        "nip": "-", 
        "email": "-", 
        "foto": "img/foto_maulana.png"
    },
    {
        "nama": "Alfin Situngkir", 
        "jabatan": "Teknisi",
        "nip": "-", 
        "email": "rizky.pratama@bmkg.go.id", 
        "foto": "img/Youtube.png"
    },
    {
        "nama": "Yeremia Faldo, S.Tr.", 
        "jabatan": "Forecaster", 
        "nip": "19951211 201902 1 003", 
        "email": "rizky.pratama@bmkg.go.id", 
        "foto": "img/Youtube.png"
    },
    {
        "nama": "M. Ishlah Alfasyah, S.Tr. Met.", 
        "jabatan": "Forecaster", 
        "nip": "19951211 201902 1 003", 
        "email": "rizky.pratama@bmkg.go.id", 
        "foto": "img/Youtube.png"
    },
    {
        "nama": "Maulana Malik Ibrahim S.Tr. Inst.", 
        "jabatan": "Teknisi", 
        "nip": "200206242025121002", 
        "email": "maulana.ibrahim@bmkg.go.id", 
        "foto": "img/foto_maulana.png"
    }
]

# ==========================================
# SISTEM CACHE CUACA (Logika Anda)
# ==========================================
CACHE_CUACA = None
WAKTU_FETCH_TERAKHIR = 0
DURASI_CACHE = 1800 

# ==========================================
# ROUTE UTAMA
# ==========================================
@app.route("/")
def home():
    # Mengambil berita terbaru dari database untuk ditampilkan di beranda
    db = get_db()
    berita_terbaru = db.execute("SELECT * FROM konten ORDER BY tanggal DESC").fetchall()
    return render_template("index.html", 
                           jumlah_pegawai=len(PEGAWAI), 
                           berita=berita_terbaru)

@app.route("/pegawai")
def pegawai():
    return jsonify(PEGAWAI)

@app.route("/api/cuaca_all")
def cuaca_all():
    global CACHE_CUACA, WAKTU_FETCH_TERAKHIR
    KODE_BMKG = {
        "Namlea": "81.04.01.2001", "Air Buaya": "81.04.02.2001", "Waeapo": "81.04.03.2001", 
        "Waplau": "81.04.06.2001", "Batabual": "81.04.10.2001", "Lolong Guba": "81.04.11.2001",
        "Waelata": "81.04.12.2001", "Fena Leisela": "81.04.13.2001", "Teluk Kaiely": "81.04.14.2001", 
        "Lilialy": "81.04.15.2001"
    }
    if CACHE_CUACA is not None and (time.time() - WAKTU_FETCH_TERAKHIR) < DURASI_CACHE:
        return jsonify(CACHE_CUACA)

    hasil = {}
    for kec, kode in KODE_BMKG.items():
        try:
            r = requests.get(f"https://api.bmkg.go.id/publik/prakiraan-cuaca?adm4={kode}").json()
            cuaca_list = r["data"][0]["cuaca"]
            hasil_kec = []
            for i in range(min(3, len(cuaca_list))):
                hari = cuaca_list[i]
                idx = 0 if i == 0 else len(hari)//2
                jam_data = hari[idx]
                hasil_kec.append({
                    "cuaca": jam_data.get("weather_desc", "-"),
                    "suhu": jam_data.get("t", "-"),
                    "rh": jam_data.get("hu", "-"),
                    "angin": jam_data.get("ws", "-")
                })
            hasil[kec] = hasil_kec
        except:
            hasil[kec] = [{"cuaca": "-", "suhu": "-", "rh": "-", "angin": "-"}] * 3
            
    CACHE_CUACA = hasil
    WAKTU_FETCH_TERAKHIR = time.time()
    return jsonify(hasil)

# ==========================================
# ROUTE ADMIN (HALAMAN CMS)
# ==========================================
@app.route("/admin")
def admin():
    # Mengambil semua data untuk ditampilkan di tabel admin
    db = get_db()
    semua_konten = db.execute("SELECT * FROM konten ORDER BY tanggal DESC").fetchall()
    return render_template("admin.html", daftar_konten=semua_konten)

@app.route("/api/update_konten", methods=["POST"])
def update_konten():
    kategori = request.form.get('kategori')
    judul = request.form.get('judul')
    isi = request.form.get('isi')
    file = request.files.get('foto')
    
    filename = ""
    if file and file.filename != '':
        filename = secure_filename(file.filename)
        # File disimpan ke static/img
        file.save(os.path.join(app.config['UPLOAD_FOLDER'], filename))

    db = get_db()
    db.execute("INSERT INTO konten (kategori, judul, isi, foto) VALUES (?, ?, ?, ?)",
                 (kategori, judul, isi, filename))
    db.commit()
    
    return """
    <div style='text-align:center; padding:50px; font-family:Arial;'>
        <h2>✅ Konten Berhasil Diupload!</h2>
        <p>Gambar tersimpan di folder static/img Anda.</p>
        <a href='/admin' style='background:blue; color:white; padding:10px; text-decoration:none;'>Tambah Lagi</a>
        <a href='/' style='background:green; color:white; padding:10px; text-decoration:none;'>Lihat Web</a>
    </div>
    """

@app.route("/api/hapus_konten/<int:id>", methods=["POST"])
def hapus_konten(id):
    db = get_db()
    
    # 1. Cari nama file foto untuk dihapus sekalian dari folder static/img
    konten = db.execute("SELECT foto FROM konten WHERE id = ?", (id,)).fetchone()
    if konten and konten['foto']:
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], konten['foto'])
        if os.path.exists(filepath):
            os.remove(filepath) # Menghapus file gambar
            
    # 2. Hapus data dari database
    db.execute("DELETE FROM konten WHERE id = ?", (id,))
    db.commit()
    
    # 3. Kembali ke halaman admin secara otomatis
    return redirect("/admin")

if __name__ == "__main__":
    app.run(debug=True)