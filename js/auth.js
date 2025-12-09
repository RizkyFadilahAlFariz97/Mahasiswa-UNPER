// auth.js - Fungsi autentikasi untuk halaman login

// Fungsi untuk menangani proses login
function handleLogin(event) {
    event.preventDefault();

    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    // Validasi input
    if (!email || !password) {
        alert('Silakan masukkan email/NIM dan password Anda');
        return;
    }

    // Proses login ke server
    loginToServer(email, password);
}

// Login ke server
async function loginToServer(email, password) {
    try {
        const response = await fetch('/api/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (response.ok) {
            // Simpan data pengguna dan token ke localStorage untuk digunakan di frontend
            localStorage.setItem('currentUser', JSON.stringify(data.user));
            localStorage.setItem('authToken', data.token); // Simpan token untuk otentikasi

            // Arahkan ke halaman beranda
            window.location.href = 'home.html';
        } else {
            alert(data.error || 'Gagal login. Silakan coba lagi.');
        }
    } catch (error) {
        console.error('Error during login:', error);
        alert('Terjadi kesalahan saat login. Silakan coba lagi.');
    }
}

// Fungsi untuk menangani lupa password
async function handleForgotPassword() {
    const email = prompt('Masukkan email Anda untuk reset password:');

    if (!email) {
        return; // User membatalkan
    }

    // Validasi format email sederhana
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        alert('Format email tidak valid');
        return;
    }

    try {
        const response = await fetch('/api/forgot-password', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email })
        });

        const data = await response.json();

        if (response.ok) {
            alert(data.message);
        } else {
            alert(data.error || 'Gagal mengirim permintaan reset password. Silakan coba lagi.');
        }
    } catch (error) {
        console.error('Error during forgot password request:', error);
        alert('Terjadi kesalahan saat mengirim permintaan. Silakan coba lagi.');
    }
}

// Fungsi untuk menangani pendaftaran
function handleRegister() {
    window.location.href = 'register.html';
}

// Fungsi untuk menangani proses registrasi
function handleRegistration(event) {
    event.preventDefault();

    const name = document.getElementById('name').value;
    const email = document.getElementById('email').value;
    const nim = document.getElementById('nim').value;
    const faculty = document.getElementById('faculty').value;
    const major = document.getElementById('major').value;
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;

    // Validasi input
    if (!name || !email || !nim || !faculty || !major || !password || !confirmPassword) {
        alert('Silakan lengkapi semua field yang wajib diisi');
        return;
    }

    // Validasi format email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        alert('Format email tidak valid');
        return;
    }

    // Validasi format NIM (hanya angka, panjang 8-15 digit)
    const nimRegex = /^[0-9]{8,15}$/;
    if (!nimRegex.test(nim)) {
        alert('Format NIM tidak valid (harus 8-15 digit angka)');
        return;
    }

    // Validasi password
    if (password.length < 6) {
        alert('Password minimal 6 karakter');
        return;
    }

    if (password !== confirmPassword) {
        alert('Password dan konfirmasi password tidak cocok');
        return;
    }

    // Proses registrasi ke server
    registerToServer({
        name,
        email,
        nim,
        faculty,
        major,
        password
    });
}

// Registrasi ke server
async function registerToServer(userData) {
    try {
        const response = await fetch('/api/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(userData)
        });

        const data = await response.json();

        if (response.ok) {
            // Simpan data pengguna ke localStorage untuk digunakan di frontend
            localStorage.setItem('currentUser', JSON.stringify({
                id: data.userId,
                name: userData.name,
                email: userData.email,
                nim: userData.nim,
                faculty: userData.faculty,
                major: userData.major
            }));

            // Buat struktur data khusus untuk pengguna ini
            const userStorageKey = `user_data_${userData.email}`;
            const userDataStorage = {
                tasks: [],
                classSchedules: [],
                theme: 'light' // Default theme
            };
            localStorage.setItem(userStorageKey, JSON.stringify(userDataStorage));

            // Beri tahu pengguna bahwa registrasi berhasil
            console.log(`Registrasi berhasil untuk: ${userData.email}`);

            // Arahkan ke halaman beranda
            window.location.href = 'home.html';
        } else {
            alert(data.error || 'Gagal mendaftar. Silakan coba lagi.');
        }
    } catch (error) {
        console.error('Error during registration:', error);
        alert('Terjadi kesalahan saat mendaftar. Silakan coba lagi.');
    }
}

// Fungsi untuk logout
function logout() {
    // Ambil informasi pengguna saat ini untuk menghapus data spesifik pengguna
    const currentUser = localStorage.getItem('currentUser');
    if (currentUser) {
        const user = JSON.parse(currentUser);
        // Hapus data spesifik pengguna
        localStorage.removeItem(`user_data_${user.email}`);
    }

    localStorage.removeItem('currentUser');
    localStorage.removeItem('authToken'); // Hapus token otentikasi
    localStorage.removeItem('tasks'); // Ini akan dihapus karena tidak digunakan lagi
    window.location.href = 'login.html';
}

// Mapping fakultas dan jurusan
const facultyMajorMap = {
    'Fakultas Teknik': ['Teknik Sipil', 'Teknik Informatika'],
    'Fakultas Ekonomi dan Bisnis': ['Akuntansi', 'Manajemen'],
    'Fakultas Pertanian dan Peternakan': ['Agroteknologi', 'Agribisnis', 'Peternakan'],
    'Fakultas Keguruan dan Ilmu Pendidikan': ['PGSD', 'Pendidikan Bahasa Inggris'],
    'Fakultas Ilmu Kesehatan': ['Farmasi'],
    'Fakultas Hukum': ['Ilmu Hukum']
};

// Fungsi untuk mengisi dropdown jurusan berdasarkan fakultas yang dipilih
function populateMajorDropdown() {
    const facultySelect = document.getElementById('faculty');
    const majorSelect = document.getElementById('major');

    if (!facultySelect || !majorSelect) return;

    // Kosongkan dropdown jurusan
    majorSelect.innerHTML = '<option value="">Pilih Jurusan</option>';

    // Dapatkan fakultas yang dipilih
    const selectedFaculty = facultySelect.value;

    // Jika fakultas dipilih, tambahkan jurusan-jurusan terkait
    if (selectedFaculty && facultyMajorMap[selectedFaculty]) {
        const majors = facultyMajorMap[selectedFaculty];

        majors.forEach(major => {
            const option = document.createElement('option');
            option.value = major;
            option.textContent = major;
            majorSelect.appendChild(option);
        });

        // Kosongkan field jurusan jika fakultas berubah
        majorSelect.value = '';
    }
}

// Fungsi untuk memeriksa apakah pengguna sudah login
async function checkAuth() {
    const currentUser = localStorage.getItem('currentUser');
    const authToken = localStorage.getItem('authToken');

    // Jika tidak ada data pengguna atau token otentikasi, arahkan ke login
    if ((!currentUser || !authToken) &&
        !window.location.pathname.includes('login.html') &&
        !window.location.pathname.includes('register.html') &&
        !window.location.pathname.includes('index.html')) {
        // Jika tidak login dan mencoba mengakses halaman yang dilindungi, arahkan ke login
        window.location.href = 'login.html';
    } else if (authToken && window.location.pathname.includes('home.html')) {
        // Jika di halaman home dan ada token, verifikasi status otentikasi ke server
        const isValid = await verifyAuthStatus();
        if (!isValid) {
            // Jika token tidak valid, arahkan ke login
            window.location.href = 'login.html';
        }
    }
}

// Inisialisasi fungsi saat DOM siap
document.addEventListener('DOMContentLoaded', async () => {
    // Tambahkan event listener untuk form login
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }

    // Tambahkan event listener untuk form registrasi
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', handleRegistration);
    }

    // Tambahkan event listener untuk link lupa password
    const forgotPasswordLink = document.getElementById('forgotPassword');
    if (forgotPasswordLink) {
        forgotPasswordLink.addEventListener('click', (e) => {
            e.preventDefault();
            handleForgotPassword();
        });
    }

    // Tambahkan event listener untuk link daftar
    const registerLink = document.getElementById('registerLink');
    if (registerLink) {
        registerLink.addEventListener('click', (e) => {
            e.preventDefault();
            handleRegister();
        });
    }

    // Tambahkan event listener untuk dropdown fakultas (hanya di halaman register)
    const facultySelect = document.getElementById('faculty');
    const majorSelect = document.getElementById('major');
    if (facultySelect && majorSelect && window.location.pathname.includes('register.html')) {
        facultySelect.addEventListener('change', populateMajorDropdown);

        // Isi dropdown jurusan jika fakultas sudah dipilih saat halaman dimuat
        populateMajorDropdown();
    }

    // Periksa otentikasi
    await checkAuth();
});

// Fungsi untuk memeriksa status otentikasi dengan menghubungi server
async function verifyAuthStatus() {
    const authToken = localStorage.getItem('authToken');

    if (!authToken) {
        return false;
    }

    try {
        const response = await fetch('/api/check-auth', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });

        if (response.ok) {
            const data = await response.json();
            // Perbarui data pengguna jika diperlukan
            localStorage.setItem('currentUser', JSON.stringify(data.user));
            return true;
        } else {
            // Jika token tidak valid atau user tidak ditemukan, hapus token
            localStorage.removeItem('authToken');
            localStorage.removeItem('currentUser');
            return false;
        }
    } catch (error) {
        console.error('Error verifying auth status:', error);
        return false;
    }
}

// Ekspor fungsi agar bisa digunakan di halaman lain
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { logout, checkAuth, verifyAuthStatus };
}