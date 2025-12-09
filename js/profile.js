// profile.js - Fungsi untuk halaman profil pengguna

let currentUser = null;
const darkThemeToggle = document.getElementById('dark-theme-toggle');
const notificationsToggle = document.getElementById('notifications-toggle');
const userNameEl = document.getElementById('user-name');
const userIdEl = document.getElementById('user-id');
const userMajorEl = document.getElementById('user-major');
const logoutBtn = document.getElementById('logout-btn');
const settingItems = document.querySelectorAll('.setting-item');
const nameEditForm = document.getElementById('name-edit-form');
const emailEditForm = document.getElementById('email-edit-form');
const passwordEditForm = document.getElementById('password-edit-form');
const photoEditForm = document.getElementById('photo-edit-form');
const newNameInput = document.getElementById('new-name');
const newEmailInput = document.getElementById('new-email');
const currentPasswordInput = document.getElementById('current-password');
const newPasswordInput = document.getElementById('new-password');
const confirmPasswordInput = document.getElementById('confirm-password');
const profilePhotoInput = document.getElementById('profile-photo');
const currentPhotoImg = document.getElementById('current-photo');
const userEmailEl = document.getElementById('user-email');
const profilePhotoDisplay = document.getElementById('profile-photo-display');
const changePhotoBtn = document.getElementById('change-photo-btn');
const displayNameEl = document.getElementById('display-name');
const displayEmailEl = document.getElementById('display-email');

// Variabel untuk menyimpan file foto yang dipilih
let selectedPhotoFile = null;

// Fungsi untuk memeriksa apakah pengguna sudah login
async function checkAuth() {
    const currentUser = localStorage.getItem('currentUser');
    const authToken = localStorage.getItem('authToken');

    // Jika tidak ada data pengguna atau token otentikasi, arahkan ke login
    if (!currentUser || !authToken) {
        window.location.href = 'login.html';
        return false;
    }

    // Jika ada token, verifikasi status otentikasi ke server
    try {
        const response = await fetch('/api/check-auth', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });

        if (!response.ok) {
            // Jika token tidak valid, hapus data dan arahkan ke login
            localStorage.removeItem('currentUser');
            localStorage.removeItem('authToken');
            window.location.href = 'login.html';
            return false;
        }

        const data = await response.json();
        // Perbarui data pengguna jika diperlukan
        localStorage.setItem('currentUser', JSON.stringify(data.user));
        return true;
    } catch (error) {
        console.error('Error verifying auth status:', error);
        localStorage.removeItem('currentUser');
        localStorage.removeItem('authToken');
        window.location.href = 'login.html';
        return false;
    }
}

// Fungsi untuk memuat data pengguna
async function loadCurrentUser() {
    const isValid = await checkAuth();
    if (isValid) {
        const savedUser = localStorage.getItem('currentUser');
        if (savedUser) {
            currentUser = JSON.parse(savedUser);
        }
    } else {
        // Fungsi checkAuth sudah mengarahkan ke login.html jika tidak valid
        return;
    }
}

// Fungsi untuk memperbarui tampilan profil
function updateProfileDisplay() {
    if (currentUser) {
        if (userNameEl) userNameEl.textContent = currentUser.name || 'Nama Pengguna';
        if (userIdEl) userIdEl.textContent = `NIM: ${currentUser.nim || '1234567890'}`;
        if (userMajorEl) userMajorEl.textContent = `${currentUser.major || 'Informatika'}, ${currentUser.faculty || 'Fakultas Teknologi Informasi'}`;
        if (userEmailEl) userEmailEl.textContent = `Email: ${currentUser.email || 'user@example.com'}`;

        // Update display name and email in the settings
        if (displayNameEl) displayNameEl.textContent = currentUser.name || 'Nama Pengguna';
        if (displayEmailEl) displayEmailEl.textContent = currentUser.email || 'user@example.com';

        // Update foto profil di halaman profil jika ada
        if (profilePhotoDisplay) {
            // Hapus konten lama
            profilePhotoDisplay.innerHTML = '';

            // Tambahkan foto profil baru
            if (currentUser.profile_photo) {
                const img = document.createElement('img');
                img.src = currentUser.profile_photo;
                img.alt = 'Foto Profil';
                img.style.width = '100%';
                img.style.height = '100%';
                img.style.objectFit = 'cover';

                profilePhotoDisplay.appendChild(img);
            } else {
                // Jika tidak ada foto profil, gunakan ikon default
                const icon = document.createElement('i');
                icon.className = 'fas fa-user';
                icon.style.fontSize = '3rem'; // Menyesuaikan ukuran ikon dengan foto

                profilePhotoDisplay.appendChild(icon);
            }
        }

        // Juga update foto di preview form jika sedang terbuka
        if (currentPhotoImg && currentUser.profile_photo) {
            currentPhotoImg.src = currentUser.profile_photo;
        }
    }
}

// Fungsi untuk mengubah nama pengguna
async function changeUserName(newName) {
    if (!newName || newName.trim() === '') {
        alert('Nama tidak boleh kosong');
        return false;
    }

    if (newName.trim().length < 3) {
        alert('Nama harus terdiri dari minimal 3 karakter');
        return false;
    }

    try {
        const response = await fetch('/api/update-profile', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('authToken')}`
            },
            body: JSON.stringify({
                userId: currentUser.id,
                name: newName.trim()
            })
        });

        const data = await response.json();

        if (response.ok) {
            // Perbarui data pengguna di localStorage
            currentUser.name = newName.trim();
            localStorage.setItem('currentUser', JSON.stringify(currentUser));

            // Update tampilan profil
            updateProfileDisplay();

            alert('Nama berhasil diperbarui');
            return true;
        } else {
            alert(data.error || 'Gagal memperbarui nama. Silakan coba lagi.');
            return false;
        }
    } catch (error) {
        console.error('Error updating user name:', error);
        alert('Terjadi kesalahan saat memperbarui nama. Silakan coba lagi.');
        return false;
    }
}

// Fungsi untuk mengubah email pengguna
async function changeUserEmail(newEmail) {
    if (!newEmail || newEmail.trim() === '') {
        alert('Email tidak boleh kosong');
        return false;
    }

    // Validasi format email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newEmail)) {
        alert('Format email tidak valid');
        return false;
    }

    // Validasi bahwa ini adalah email berbeda
    if (newEmail === currentUser.email) {
        alert('Email baru harus berbeda dari email saat ini');
        return false;
    }

    try {
        const response = await fetch('/api/update-email', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('authToken')}`
            },
            body: JSON.stringify({
                userId: currentUser.id,
                email: newEmail.trim()
            })
        });

        const data = await response.json();

        if (response.ok) {
            // Perbarui data pengguna di localStorage
            currentUser.email = newEmail.trim();
            localStorage.setItem('currentUser', JSON.stringify(currentUser));

            // Update tampilan profil
            updateProfileDisplay();

            alert('Email berhasil diperbarui');
            return true;
        } else {
            alert(data.error || 'Gagal memperbarui email. Silakan coba lagi.');
            return false;
        }
    } catch (error) {
        console.error('Error updating user email:', error);
        alert('Terjadi kesalahan saat memperbarui email. Silakan coba lagi.');
        return false;
    }
}

// Fungsi untuk mengganti sandi pengguna
async function changeUserPassword(currentPassword, newPassword, confirmPassword) {
    if (!currentPassword || !newPassword || !confirmPassword) {
        alert('Semua field sandi wajib diisi');
        return false;
    }

    if (newPassword !== confirmPassword) {
        alert('Konfirmasi sandi tidak cocok');
        return false;
    }

    if (newPassword.length < 6) {
        alert('Sandi baru harus memiliki minimal 6 karakter');
        return false;
    }

    try {
        const response = await fetch('/api/change-password', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('authToken')}`
            },
            body: JSON.stringify({
                userId: currentUser.id,
                currentPassword: currentPassword,
                newPassword: newPassword
            })
        });

        const data = await response.json();

        if (response.ok) {
            alert('Sandi berhasil diperbarui');
            return true;
        } else {
            alert(data.error || 'Gagal mengganti sandi. Silakan coba lagi.');
            return false;
        }
    } catch (error) {
        console.error('Error changing password:', error);
        alert('Terjadi kesalahan saat mengganti sandi. Silakan coba lagi.');
        return false;
    }
}

// Fungsi untuk mengganti foto profil pengguna
async function changeProfilePhoto(photoFile) {
    if (!photoFile) {
        alert('Silakan pilih file foto terlebih dahulu');
        return false;
    }

    // Validasi ukuran file (maksimal 5MB)
    if (photoFile.size > 5 * 1024 * 1024) {
        alert('Ukuran file terlalu besar. Maksimal 5MB.');
        return false;
    }

    // Validasi tipe file
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
    if (!allowedTypes.includes(photoFile.type)) {
        alert('Format file tidak didukung. Gunakan JPEG, PNG, atau GIF.');
        return false;
    }

    try {
        // Konversi file ke base64
        const base64 = await fileToBase64(photoFile);

        // Kirim foto ke server
        const response = await fetch('/api/update-profile-photo', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('authToken')}`
            },
            body: JSON.stringify({
                photo: base64
            })
        });

        const data = await response.json();

        if (response.ok) {
            // Perbarui data pengguna di localStorage dengan data yang dikembalikan oleh server
            // Ini penting karena server mengembalikan user object yang telah diperbarui
            if (data.user) {
                currentUser = data.user;
                localStorage.setItem('currentUser', JSON.stringify(currentUser));
            } else {
                // Jika tidak ada data.user dalam respons, perbarui manual
                currentUser.profile_photo = base64;
                localStorage.setItem('currentUser', JSON.stringify(currentUser));
            }

            // Update tampilan profil
            updateProfileDisplay();

            alert('Foto profil berhasil diperbarui');
            return true;
        } else {
            console.error('Server error:', data.error);
            alert(data.error || 'Gagal memperbarui foto profil. Silakan coba lagi.');
            return false;
        }
    } catch (error) {
        console.error('Error changing profile photo:', error);
        alert('Terjadi kesalahan saat mengganti foto profil. Silakan coba lagi.');
        return false;
    }
}

// Fungsi bantu untuk mengonversi file ke base64
function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result);
        reader.onerror = error => reject(error);
    });
}

// Fungsi untuk menghapus akun pengguna
async function deleteUserAccount() {
    const confirmDelete = confirm('Apakah Anda yakin ingin menghapus akun Anda? Tindakan ini tidak dapat dibatalkan dan semua data Anda akan dihapus secara permanen.');

    if (!confirmDelete) {
        return false; // Pengguna membatalkan
    }

    try {
        const response = await fetch('/api/delete-account', {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('authToken')}`
            },
            body: JSON.stringify({
                userId: currentUser.id
            })
        });

        const data = await response.json();

        if (response.ok) {
            // Hapus semua data lokal
            if (currentUser) {
                // Hapus data spesifik pengguna
                localStorage.removeItem(`user_data_${currentUser.email}`);
            }

            localStorage.removeItem('currentUser');
            localStorage.removeItem('authToken');
            localStorage.removeItem('tasks');

            alert('Akun Anda telah berhasil dihapus');
            // Arahkan ke halaman utama
            window.location.href = 'index.html';
            return true;
        } else {
            alert(data.error || 'Gagal menghapus akun. Silakan coba lagi.');
            return false;
        }
    } catch (error) {
        console.error('Error deleting user account:', error);
        alert('Terjadi kesalahan saat menghapus akun. Silakan coba lagi.');
        return false;
    }
}

// Fungsi untuk menyimpan tema ke localStorage (per user)
function saveTheme(theme) {
    if (currentUser) {
        const userStorageKey = `user_data_${currentUser.email}`;
        let userData = JSON.parse(localStorage.getItem(userStorageKey)) || { tasks: [], classSchedules: [], theme: 'light' };
        userData.theme = theme;
        localStorage.setItem(userStorageKey, JSON.stringify(userData));
    }
}

// Fungsi untuk memuat tema dari localStorage (per user)
function loadTheme() {
    let savedTheme = 'light'; // default
    if (currentUser) {
        const userStorageKey = `user_data_${currentUser.email}`;
        const userData = JSON.parse(localStorage.getItem(userStorageKey)) || { tasks: [], classSchedules: [], theme: 'light' };
        savedTheme = userData.theme || 'light';
    }
    return savedTheme;
}

// Terapkan tema yang disimpan
function applySavedTheme() {
    const savedTheme = loadTheme();
    const isDark = savedTheme === 'dark';
    
    // Perbarui toggle sesuai tema
    if (darkThemeToggle) {
        darkThemeToggle.checked = isDark;
    }
    
    if (isDark) {
        document.body.classList.add('dark-theme');
    } else {
        document.body.classList.remove('dark-theme');
    }
}

// Ganti tema
function toggleTheme() {
    const isDark = document.body.classList.contains('dark-theme');
    const newTheme = isDark ? 'light' : 'dark';
    
    if (newTheme === 'dark') {
        document.body.classList.add('dark-theme');
    } else {
        document.body.classList.remove('dark-theme');
    }
    
    saveTheme(newTheme);
}

// Ganti status notifikasi
function toggleNotifications() {
    const notificationsEnabled = notificationsToggle.checked;
    localStorage.setItem('notificationsEnabled', notificationsEnabled);
}

// Fungsi untuk logout
function handleLogout() {
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

// Setup navigasi antar halaman
function setupNavigation() {
    // Tambahkan event listener ke semua link navigasi
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        item.addEventListener('click', function(e) {
            if (!this.classList.contains('active')) {
                const href = this.getAttribute('href');
                if (href && href !== '#') {
                    e.preventDefault();
                    window.location.href = href;
                }
            }
        });
    });
}


// Fungsi untuk menyembunyikan semua form edit
function hideAllEditForms() {
    if (nameEditForm) nameEditForm.style.display = 'none';
    if (emailEditForm) emailEditForm.style.display = 'none';
    if (passwordEditForm) passwordEditForm.style.display = 'none';
    if (photoEditForm) photoEditForm.style.display = 'none';

    // Hapus kelas aktif dari semua item setting
    if (settingItems) {
        settingItems.forEach(item => item.classList.remove('active'));
    }
}

// Setup event listeners
function setupEventListeners() {
    // Event listener untuk toggle tema
    if (darkThemeToggle) {
        darkThemeToggle.addEventListener('change', toggleTheme);
    }

    // Event listener untuk toggle notifikasi
    if (notificationsToggle) {
        notificationsToggle.addEventListener('change', toggleNotifications);
    }

    // Event listener untuk tombol logout
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }

    // Event listener untuk header setting items (untuk membuka form edit)
    const settingHeaders = document.querySelectorAll('.setting-header');
    settingHeaders.forEach(header => {
        header.addEventListener('click', function(e) {
            // Jika klik bukan pada tombol simpan atau batal, atau input, tampilkan form
            if (!e.target.closest('.form-actions') &&
                !e.target.closest('input') &&
                !e.target.closest('.save-btn') &&
                !e.target.closest('.cancel-btn') &&
                !e.target.closest('#delete-account-trigger')) {

                const targetFormId = this.getAttribute('data-target');
                if (targetFormId) {
                    const targetForm = document.getElementById(targetFormId);
                    if (targetForm) {
                        // Jika form sudah terbuka, tutup form
                        if (targetForm.style.display === 'block') {
                            hideAllEditForms();
                            return;
                        }

                        // Sembunyikan semua form edit lainnya
                        hideAllEditForms();

                        // Tampilkan form edit
                        targetForm.style.display = 'block';

                        // Tambahkan kelas aktif ke item setting
                        const settingItem = targetForm.closest('.setting-item');
                        if (settingItem) {
                            settingItem.classList.add('active');
                        }
                    }
                }
            }
        });
    });

    // Event listener untuk tombol ganti foto langsung
    if (changePhotoBtn) {
        changePhotoBtn.addEventListener('click', function() {
            // Klik pada tombol kamera langsung membuka input file
            profilePhotoInput.click();
        });
    }

    // Event listener untuk input foto profil (ketika file dipilih)
    if (profilePhotoInput) {
        profilePhotoInput.addEventListener('change', function() {
            // Cek apakah ada file yang dipilih
            if (this.files && this.files[0]) {
                // Simpan file yang dipilih ke variabel
                selectedPhotoFile = this.files[0];

                // Tampilkan form edit foto
                const targetForm = document.getElementById('photo-edit-form');
                if (targetForm) {
                    // Sembunyikan semua form edit lainnya
                    hideAllEditForms();

                    // Tampilkan form edit foto
                    targetForm.style.display = 'block';

                    // Tambahkan kelas aktif ke item setting
                    const settingItem = targetForm.closest('.setting-item');
                    if (settingItem) {
                        settingItem.classList.add('active');
                    }

                    // Perbarui preview foto
                    const reader = new FileReader();
                    reader.onload = function(e) {
                        const preview = document.querySelector('.current-photo-preview');
                        if (preview) {
                            preview.src = e.target.result;
                        }
                    };
                    reader.readAsDataURL(this.files[0]);
                }
            } else {
                // Jika tidak ada file dipilih, pastikan form ditutup
                const targetForm = document.getElementById('photo-edit-form');
                if (targetForm) {
                    targetForm.style.display = 'none';
                    const settingItem = targetForm.closest('.setting-item');
                    if (settingItem) {
                        settingItem.classList.remove('active');
                    }
                }
                // Reset variabel file
                selectedPhotoFile = null;
            }
        });
    }

    // Event listener untuk tombol simpan (menggunakan event delegation)
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('save-btn')) {
            const formId = e.target.getAttribute('data-form');
            const formElement = document.getElementById(formId);
            if (formElement) {
                // Panggil fungsi simpan berdasarkan form
                if (formId === 'name-edit-form') {
                    changeUserName(newNameInput.value).then(success => {
                        if (success) hideAllEditForms();
                    });
                } else if (formId === 'email-edit-form') {
                    changeUserEmail(newEmailInput.value).then(success => {
                        if (success) hideAllEditForms();
                    });
                } else if (formId === 'password-edit-form') {
                    changeUserPassword(
                        currentPasswordInput.value,
                        newPasswordInput.value,
                        confirmPasswordInput.value
                    ).then(success => {
                        if (success) hideAllEditForms();
                    });
                } else if (formId === 'photo-edit-form') {
                    changeProfilePhoto(selectedPhotoFile).then(success => {
                        if (success) {
                            hideAllEditForms();
                            // Reset file setelah berhasil disimpan
                            selectedPhotoFile = null;
                            // Reset input file
                            profilePhotoInput.value = '';
                        }
                    });
                }
            }
        }
    });

    // Event listener untuk tombol batal (menggunakan event delegation)
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('cancel-btn')) {
            hideAllEditForms();
        }
    });

    // Event listener untuk hapus akun
    const deleteAccountTrigger = document.getElementById('delete-account-trigger');
    if (deleteAccountTrigger) {
        deleteAccountTrigger.addEventListener('click', function() {
            deleteUserAccount();
        });
    }

    // Tambahkan event listener untuk navigasi
    setupNavigation();
}

// Inisialisasi aplikasi
async function initProfile() {
    // Muat data pengguna (dengan verifikasi otentikasi)
    await loadCurrentUser();

    // Jika currentUser null karena otentikasi gagal, hentikan inisialisasi
    if (!currentUser) {
        return; // loadCurrentUser telah mengarahkan ke halaman login
    }

    // Update tampilan profil
    updateProfileDisplay();

    // Terapkan tema yang disimpan
    applySavedTheme();

    // Setup event listeners
    setupEventListeners();
}

// Inisialisasi aplikasi saat DOM siap
document.addEventListener('DOMContentLoaded', async () => {
    await initProfile();
});

// Event listener untuk perubahan localStorage (misalnya dari halaman lain)
window.addEventListener('storage', function(e) {
    if (currentUser && e.key === `user_data_${currentUser.email}`) {
        // Jika data pengguna berubah dari halaman lain, terapkan tema baru
        applySavedTheme();
    }
});