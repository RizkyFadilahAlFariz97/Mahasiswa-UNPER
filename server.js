const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcryptjs');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const jwt = require('jsonwebtoken');
const app = express();
const PORT = process.env.PORT || 3001;

// Konfigurasi JWT (dalam produksi, gunakan secret yang lebih aman)
const JWT_SECRET = process.env.JWT_SECRET || 'mahasiswa_unper_secret_key_2025';

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('.')); // Serve static files from the root

// Rate limiting untuk endpoint login
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 menit
    max: 5, // batasi setiap IP untuk membuat maksimal 5 permintaan login per windowMs
    message: { error: 'Terlalu banyak upaya login, coba lagi dalam 15 menit' },
    standardHeaders: true,
    legacyHeaders: false,
});

// Buka database SQLite
const dbPath = path.join(__dirname, 'database.db');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error opening database:', err.message);
    } else {
        console.log('Connected to SQLite database');
    }
});

// Buat tabel users jika belum ada (dengan kolom profile_photo)
db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    nim TEXT UNIQUE NOT NULL,
    faculty TEXT NOT NULL,
    major TEXT NOT NULL,
    password TEXT NOT NULL,
    profile_photo TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
)`, (err) => {
    if (err) {
        console.error('Error creating users table:', err.message);
    } else {
        console.log('Users table ready');

        // Pastikan kolom profile_photo ada (coba tambahkan, abaikan error jika sudah ada)
        db.run(`ALTER TABLE users ADD COLUMN profile_photo TEXT DEFAULT NULL`, function(err) {
            if (err) {
                if (err.message.includes('duplicate column name')) {
                    console.log('Column profile_photo already exists');
                } else {
                    // Jika error karena kolom sudah ada dalam definisi tabel, itu normal
                    console.log('Note: profile_photo column may already be part of table definition');
                }
            } else {
                console.log('Column profile_photo added successfully');
            }
        });
    }
});

// Buat tabel class_schedule jika belum ada
db.run(`CREATE TABLE IF NOT EXISTS class_schedule (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    day TEXT NOT NULL,
    course TEXT NOT NULL,
    start_time TEXT NOT NULL,
    end_time TEXT NOT NULL,
    place TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id)
)`, (err) => {
    if (err) {
        console.error('Error creating class_schedule table:', err.message);
    } else {
        console.log('Class schedule table ready');
    }
});

// Fungsi validasi email
function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

// Fungsi validasi NIM (misalnya: hanya angka, panjangnya 8-15 karakter)
function validateNim(nim) {
    const re = /^[0-9]{8,15}$/;
    return re.test(nim);
}

// Endpoint untuk registrasi
app.post('/api/register', (req, res) => {
    const { name, email, nim, faculty, major, password } = req.body;

    // Validasi input
    if (!name || !email || !nim || !faculty || !major || !password) {
        return res.status(400).json({ error: 'Semua field wajib diisi' });
    }

    // Validasi format email
    if (!validateEmail(email)) {
        return res.status(400).json({ error: 'Format email tidak valid' });
    }

    // Validasi format NIM
    if (!validateNim(nim)) {
        return res.status(400).json({ error: 'Format NIM tidak valid (harus 8-15 digit angka)' });
    }

    // Validasi panjang password
    if (password.length < 6) {
        return res.status(400).json({ error: 'Password harus memiliki minimal 6 karakter' });
    }

    // Hash password
    const hashedPassword = bcrypt.hashSync(password, 10);

    // Simpan ke database
    const stmt = db.prepare('INSERT INTO users (name, email, nim, faculty, major, password, profile_photo) VALUES (?, ?, ?, ?, ?, ?, ?)');
    stmt.run([name, email, nim, faculty, major, hashedPassword, null], function(err) {
        if (err) {
            if (err.message.includes('UNIQUE constraint failed')) {
                res.status(400).json({ error: 'Email atau NIM sudah terdaftar' });
            } else {
                res.status(500).json({ error: 'Gagal menyimpan data pengguna' });
            }
        } else {
            res.status(201).json({
                message: 'Registrasi berhasil',
                userId: this.lastID
            });
        }
    });
    stmt.finalize();
});

// Endpoint untuk login
app.post('/api/login', loginLimiter, (req, res) => {
    const { email, password } = req.body;

    // Validasi input
    if (!email || !password) {
        return res.status(400).json({ error: 'Email dan password wajib diisi' });
    }

    // Validasi format email atau NIM (jika format NIM)
    if (!validateEmail(email) && !validateNim(email)) {
        return res.status(400).json({ error: 'Format email atau NIM tidak valid' });
    }

    // Cek apakah user ada di database
    const query = 'SELECT id, name, email, nim, faculty, major, profile_photo, password FROM users WHERE email = ? OR nim = ?';

    db.get(query, [email, email], (err, user) => {
        if (err) {
            return res.status(500).json({ error: 'Gagal memeriksa pengguna' });
        }

        if (!user) {
            return res.status(401).json({ error: 'Email/NIM atau password salah' });
        }

        // Bandingkan password
        const isValidPassword = bcrypt.compareSync(password, user.password);
        if (!isValidPassword) {
            return res.status(401).json({ error: 'Email/NIM atau password salah' });
        }

        // Buat token JWT
        const token = jwt.sign(
            { userId: user.id, email: user.email },
            JWT_SECRET,
            { expiresIn: '24h' } // Token berlaku selama 24 jam
        );

        // Return data pengguna (tanpa password) dan token
        const { password: hashedPassword, ...userWithoutPassword } = user;
        res.json({
            message: 'Login berhasil',
            user: userWithoutPassword,
            token: token
        });
    });
});

// Middleware untuk memverifikasi JWT
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
        return res.status(401).json({ error: 'Akses token diperlukan' });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ error: 'Token tidak valid' });
        }
        req.user = user;
        next();
    });
}

// Endpoint untuk cek apakah user sudah login (menggunakan token)
app.get('/api/check-auth', authenticateToken, (req, res) => {
    const userId = req.user.userId;

    const query = 'SELECT id, name, email, nim, faculty, major, profile_photo FROM users WHERE id = ?';

    db.get(query, [userId], (err, user) => {
        if (err) {
            return res.status(500).json({ error: 'Gagal memeriksa pengguna' });
        }

        if (!user) {
            return res.status(404).json({ error: 'Pengguna tidak ditemukan' });
        }

        res.json({ user });
    });
});

// Endpoint untuk lupa password (implementasi dasar)
app.post('/api/forgot-password', (req, res) => {
    const { email } = req.body;

    if (!email) {
        return res.status(400).json({ error: 'Email wajib disertakan' });
    }

    // Validasi format email
    if (!validateEmail(email)) {
        return res.status(400).json({ error: 'Format email tidak valid' });
    }

    // Di implementasi nyata, di sini akan ada proses pengiriman email reset password
    // Untuk versi ini, kita hanya akan menampilkan pesan bahwa jika email ditemukan,
    // maka instruksi reset akan dikirim

    // Cek apakah email ada di database
    const query = 'SELECT id FROM users WHERE email = ?';

    db.get(query, [email], (err, user) => {
        if (err) {
            return res.status(500).json({ error: 'Gagal memeriksa pengguna' });
        }

        // Kita tidak mengungkapkan apakah email ditemukan atau tidak untuk mencegah
        // pengungkapan informasi pengguna
        res.json({
            message: 'Jika email ditemukan, instruksi reset password telah dikirimkan'
        });
    });
});

// Endpoint untuk memperbarui profil pengguna
app.put('/api/update-profile', authenticateToken, (req, res) => {
    const userId = req.user.userId;
    const { name } = req.body;

    // Validasi input
    if (!name) {
        return res.status(400).json({ error: 'Nama wajib disertakan' });
    }

    if (name.length < 3) {
        return res.status(400).json({ error: 'Nama harus terdiri dari minimal 3 karakter' });
    }

    if (name.length > 100) {
        return res.status(400).json({ error: 'Nama terlalu panjang (maksimal 100 karakter)' });
    }

    // Update nama pengguna di database
    const updateQuery = 'UPDATE users SET name = ? WHERE id = ?';

    db.run(updateQuery, [name, userId], function(err) {
        if (err) {
            return res.status(500).json({ error: 'Gagal memperbarui profil' });
        }

        if (this.changes === 0) {
            return res.status(404).json({ error: 'Pengguna tidak ditemukan' });
        }

        res.json({
            message: 'Profil berhasil diperbarui',
            userId: userId,
            name: name
        });
    });
});

// Endpoint untuk memperbarui email pengguna
app.put('/api/update-email', authenticateToken, (req, res) => {
    const userId = req.user.userId;
    const { email } = req.body;

    // Validasi input
    if (!email) {
        return res.status(400).json({ error: 'Email wajib disertakan' });
    }

    // Validasi format email
    if (!validateEmail(email)) {
        return res.status(400).json({ error: 'Format email tidak valid' });
    }

    // Cek apakah email sudah digunakan oleh pengguna lain
    const checkQuery = 'SELECT id FROM users WHERE email = ? AND id != ?';

    db.get(checkQuery, [email, userId], (err, row) => {
        if (err) {
            return res.status(500).json({ error: 'Gagal memeriksa email' });
        }

        if (row) {
            return res.status(400).json({ error: 'Email sudah digunakan oleh pengguna lain' });
        }

        // Update email pengguna di database
        const updateQuery = 'UPDATE users SET email = ? WHERE id = ?';

        db.run(updateQuery, [email, userId], function(err) {
            if (err) {
                return res.status(500).json({ error: 'Gagal memperbarui email' });
            }

            if (this.changes === 0) {
                return res.status(404).json({ error: 'Pengguna tidak ditemukan' });
            }

            res.json({
                message: 'Email berhasil diperbarui',
                userId: userId,
                email: email
            });
        });
    });
});

// Endpoint untuk mengganti sandi pengguna
app.put('/api/change-password', authenticateToken, (req, res) => {
    const userId = req.user.userId;
    const { currentPassword, newPassword } = req.body;

    // Validasi input
    if (!currentPassword || !newPassword) {
        return res.status(400).json({ error: 'Password saat ini dan password baru wajib disertakan' });
    }

    if (newPassword.length < 6) {
        return res.status(400).json({ error: 'Password baru harus memiliki minimal 6 karakter' });
    }

    // Ambil password saat ini dari database
    const query = 'SELECT password FROM users WHERE id = ?';

    db.get(query, [userId], (err, user) => {
        if (err) {
            return res.status(500).json({ error: 'Gagal memeriksa pengguna' });
        }

        if (!user) {
            return res.status(404).json({ error: 'Pengguna tidak ditemukan' });
        }

        // Bandingkan password saat ini
        const isValidPassword = bcrypt.compareSync(currentPassword, user.password);
        if (!isValidPassword) {
            return res.status(401).json({ error: 'Password saat ini salah' });
        }

        // Hash password baru
        const hashedNewPassword = bcrypt.hashSync(newPassword, 10);

        // Update password di database
        const updateQuery = 'UPDATE users SET password = ? WHERE id = ?';

        db.run(updateQuery, [hashedNewPassword, userId], function(err) {
            if (err) {
                return res.status(500).json({ error: 'Gagal memperbarui password' });
            }

            if (this.changes === 0) {
                return res.status(404).json({ error: 'Pengguna tidak ditemukan' });
            }

            res.json({
                message: 'Password berhasil diperbarui'
            });
        });
    });
});

// Endpoint untuk menghapus akun pengguna
app.delete('/api/delete-account', authenticateToken, (req, res) => {
    const userId = req.user.userId;
    const { userId: bodyUserId } = req.body;

    // Validasi bahwa userId dari token cocok dengan userId dari body
    if (userId != bodyUserId) {
        return res.status(403).json({ error: 'Otorisasi gagal' });
    }

    // Hapus pengguna dari database
    const deleteQuery = 'DELETE FROM users WHERE id = ?';

    db.run(deleteQuery, [userId], function(err) {
        if (err) {
            return res.status(500).json({ error: 'Gagal menghapus akun' });
        }

        if (this.changes === 0) {
            return res.status(404).json({ error: 'Pengguna tidak ditemukan' });
        }

        res.json({
            message: 'Akun berhasil dihapus'
        });
    });
});

// Endpoint untuk memperbarui foto profil pengguna
app.put('/api/update-profile-photo', authenticateToken, (req, res) => {
    const userId = req.user.userId;

    // Karena Node.js tidak menyertakan body parser untuk file upload secara bawaan,
    // kita perlu menggunakan middleware seperti multer untuk menangani upload file
    // Namun dalam implementasi ini, kita akan mengasumsikan data foto dikirim sebagai base64
    let base64Image = '';

    // Baca body request untuk mendapatkan data gambar
    let body = '';
    req.on('data', chunk => {
        body += chunk.toString();
    });

    req.on('end', () => {
        try {
            const data = JSON.parse(body);
            base64Image = data.photo;

            // Validasi bahwa data gambar tersedia
            if (!base64Image) {
                return res.status(400).json({ error: 'Data gambar tidak ditemukan' });
            }

            // Update foto profil di database (hanya simpan base64 image)
            const updateQuery = `UPDATE users SET profile_photo = ? WHERE id = ?`;

            db.run(updateQuery, [base64Image, userId], function(err) {
                if (err) {
                    console.error('Database error:', err.message);
                    return res.status(500).json({ error: 'Gagal memperbarui foto profil' });
                }

                if (this.changes === 0) {
                    return res.status(404).json({ error: 'Pengguna tidak ditemukan' });
                }

                // Ambil data pengguna terbaru
                const selectQuery = 'SELECT id, name, email, nim, faculty, major, profile_photo FROM users WHERE id = ?';
                db.get(selectQuery, [userId], (err, user) => {
                    if (err) {
                        console.error('Database query error:', err.message);
                        return res.status(500).json({ error: 'Gagal mengambil data pengguna' });
                    }

                    if (!user) {
                        return res.status(404).json({ error: 'Pengguna tidak ditemukan setelah update' });
                    }

                    // Jangan sertakan password di respons
                    const { password, ...userWithoutPassword } = user;

                    res.json({
                        message: 'Foto profil berhasil diperbarui',
                        user: userWithoutPassword
                    });
                });
            });
        } catch (error) {
            console.error('Error parsing request body:', error);
            return res.status(400).json({ error: 'Format data tidak valid' });
        }
    });
});

// Endpoint untuk menambah jadwal kuliah
app.post('/api/class-schedule', authenticateToken, (req, res) => {
    const userId = req.user.userId;
    const { day, course, start_time, end_time, place } = req.body;

    // Validasi input
    if (!day || !course || !start_time || !end_time) {
        return res.status(400).json({ error: 'Semua field wajib diisi' });
    }

    // Validasi format waktu
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeRegex.test(start_time) || !timeRegex.test(end_time)) {
        return res.status(400).json({ error: 'Format waktu tidak valid. Gunakan HH:MM' });
    }

    // Validasi apakah waktu selesai setelah waktu mulai
    if (start_time >= end_time) {
        return res.status(400).json({ error: 'Waktu selesai harus setelah waktu mulai' });
    }

    // Insert jadwal ke database
    const stmt = db.prepare('INSERT INTO class_schedule (user_id, day, course, start_time, end_time, place) VALUES (?, ?, ?, ?, ?, ?)');
    stmt.run([userId, day, course, start_time, end_time, place], function(err) {
        if (err) {
            res.status(500).json({ error: 'Gagal menyimpan jadwal kuliah' });
        } else {
            res.status(201).json({
                message: 'Jadwal kuliah berhasil ditambahkan',
                id: this.lastID
            });
        }
    });
    stmt.finalize();
});

// Endpoint untuk mendapatkan jadwal kuliah mingguan
app.get('/api/class-schedule/weekly', authenticateToken, (req, res) => {
    const userId = req.user.userId;

    // Query untuk mendapatkan jadwal kuliah berdasarkan user_id
    const query = `
        SELECT id, user_id, day, course, start_time, end_time, place, created_at
        FROM class_schedule
        WHERE user_id = ?
        ORDER BY CASE day
            WHEN 'Sen' THEN 1
            WHEN 'Sel' THEN 2
            WHEN 'Rab' THEN 3
            WHEN 'Kam' THEN 4
            WHEN 'Jum' THEN 5
            WHEN 'Sab' THEN 6
            WHEN 'Min' THEN 7
            ELSE 8
        END, start_time
    `;

    db.all(query, [userId], (err, schedules) => {
        if (err) {
            return res.status(500).json({ error: 'Gagal mengambil jadwal kuliah' });
        }

        res.json({
            schedules: schedules
        });
    });
});

// Endpoint untuk mengupdate jadwal kuliah
app.put('/api/class-schedule/:id', authenticateToken, (req, res) => {
    const userId = req.user.userId;
    const scheduleId = req.params.id;
    const { day, course, start_time, end_time, place } = req.body;

    // Validasi input
    if (!day || !course || !start_time || !end_time) {
        return res.status(400).json({ error: 'Semua field wajib diisi' });
    }

    // Validasi format waktu
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeRegex.test(start_time) || !timeRegex.test(end_time)) {
        return res.status(400).json({ error: 'Format waktu tidak valid. Gunakan HH:MM' });
    }

    // Validasi apakah waktu selesai setelah waktu mulai
    if (start_time >= end_time) {
        return res.status(400).json({ error: 'Waktu selesai harus setelah waktu mulai' });
    }

    // Update jadwal di database
    const updateQuery = 'UPDATE class_schedule SET day = ?, course = ?, start_time = ?, end_time = ?, place = ? WHERE id = ? AND user_id = ?';

    db.run(updateQuery, [day, course, start_time, end_time, place, scheduleId, userId], function(err) {
        if (err) {
            return res.status(500).json({ error: 'Gagal memperbarui jadwal kuliah' });
        }

        if (this.changes === 0) {
            return res.status(404).json({ error: 'Jadwal tidak ditemukan atau Anda tidak memiliki izin untuk mengakses jadwal ini' });
        }

        res.json({
            message: 'Jadwal kuliah berhasil diperbarui',
            id: scheduleId
        });
    });
});

// Endpoint untuk menghapus jadwal kuliah
app.delete('/api/class-schedule/:id', authenticateToken, (req, res) => {
    const userId = req.user.userId;
    const scheduleId = req.params.id;

    // Hapus jadwal dari database
    const deleteQuery = 'DELETE FROM class_schedule WHERE id = ? AND user_id = ?';

    db.run(deleteQuery, [scheduleId, userId], function(err) {
        if (err) {
            return res.status(500).json({ error: 'Gagal menghapus jadwal kuliah' });
        }

        if (this.changes === 0) {
            return res.status(404).json({ error: 'Jadwal tidak ditemukan atau Anda tidak memiliki izin untuk menghapus jadwal ini' });
        }

        res.json({
            message: 'Jadwal kuliah berhasil dihapus'
        });
    });
});

// Endpoint root untuk mengarahkan ke index.html
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Jalankan server
app.listen(PORT, 'localhost', () => {
    console.log(`Server berjalan di http://localhost:${PORT}`);
}).on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
        console.error(`Port ${PORT} sudah digunakan. Silakan tutup aplikasi lain yang menggunakan port tersebut.`);
        process.exit(1);
    } else {
        console.error('Error starting server:', err);
    }
});