// home.js - Fungsi untuk halaman beranda Mahasiswa UNPER

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

// Data dummy untuk percobaan
let tasks = [];
let classSchedules = [];
let currentUser = null;

// DOM Elements
const greetingTimeEl = document.getElementById('greeting-time');
const currentDateEl = document.getElementById('current-date');
const totalTasksEl = document.getElementById('total-tasks');
const todayDeadlinesEl = document.getElementById('today-deadlines');
const lateTasksEl = document.getElementById('late-tasks');
const urgentTasksListEl = document.getElementById('urgent-tasks-list');
const weeklyScheduleEl = document.getElementById('weekly-schedule');
const addTaskBtn = document.getElementById('add-task-btn');
const userNameEl = document.getElementById('user-name');

// Format tanggal ke bahasa Indonesia
function formatDate(dateString) {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', options);
}

// Format tanggal singkat
function formatDateShort(dateString) {
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
}

// Periksa apakah tanggal adalah hari ini
function isToday(dateString) {
    const today = new Date();
    const taskDate = new Date(dateString);
    return taskDate.getDate() === today.getDate() &&
           taskDate.getMonth() === today.getMonth() &&
           taskDate.getFullYear() === today.getFullYear();
}

// Periksa apakah tanggal sudah lewat
function isOverdue(dateString) {
    const today = new Date();
    const taskDate = new Date(dateString);
    return taskDate < today && taskDate.getDate() !== today.getDate();
}

// Hitung jumlah tugas berdasarkan kriteria
function countTasksBy(filter) {
    if (filter === 'total') {
        return tasks.filter(task => task.status !== 'completed').length;
    } else if (filter === 'today') {
        return tasks.filter(task =>
            isToday(task.deadlineDate) &&
            task.status !== 'completed'
        ).length;
    } else if (filter === 'overdue') {
        return tasks.filter(task =>
            isOverdue(task.deadlineDate) &&
            task.status !== 'completed'
        ).length;
    }
}

// Dapatkan tugas mendesak dan tugas hari ini
function getUrgentTasks() {
    return tasks.filter(task => {
        return (task.priority === 'mendesak' || isToday(task.deadlineDate)) &&
               task.status !== 'completed';
    }).sort((a, b) => {
        // Urutkan berdasarkan prioritas dan tanggal deadline
        const priorityOrder = { 'mendesak': 4, 'tinggi': 3, 'sedang': 2, 'rendah': 1 };
        if (priorityOrder[b.priority] !== priorityOrder[a.priority]) {
            return priorityOrder[b.priority] - priorityOrder[a.priority];
        }
        return new Date(a.deadlineDate) - new Date(b.deadlineDate);
    });
}

// Render tugas mendesak
function renderUrgentTasks() {
    const urgentTasks = getUrgentTasks();

    if (urgentTasks.length === 0) {
        urgentTasksListEl.innerHTML = '<p class="no-tasks">Tidak ada tugas mendesak saat ini</p>';
        return;
    }

    urgentTasksListEl.innerHTML = urgentTasks.map(task => {

        const attachmentsHtml = task.attachments && task.attachments.length > 0 ?
            `<div class="attachments-summary" style="margin-top: 8px;">
                <small>
                    <i class="fas fa-paperclip"></i>
                    ${task.attachments.length} lampiran
                    <button type="button" class="btn btn-outline btn-sm" onclick="viewAttachmentsHome(${task.id})" style="padding: 2px 6px; margin-left: 8px; font-size: 0.75rem;">
                        <i class="fas fa-eye"></i> Lihat
                    </button>
                </small>
            </div>` : '';

        return `
            <div class="task-card priority-${task.priority}">
                <input type="checkbox" class="task-checkbox" ${task.status === 'completed' ? 'checked' : ''}
                    onchange="toggleTaskStatus(${task.id})">
                <div class="task-info">
                    <div class="task-title">${task.title}</div>
                    <div>
                        <span class="task-course">${task.category}</span>
                        <span class="task-deadline">${formatDateShort(task.deadlineDate)} ${task.deadlineTime}</span>
                    </div>
                    ${attachmentsHtml}
                </div>
            </div>
        `;
    }).join('');
}

// Toggle status tugas
function toggleTaskStatus(taskId) {
    const task = tasks.find(t => t.id === taskId);
    if (task) {
        task.status = task.status === 'completed' ? 'pending' : 'completed';
        updateStats();
        renderUrgentTasks();
        saveData(); // Using the original function name
    }
}

// Ambil jadwal kuliah mingguan dari server
async function fetchWeeklySchedules() {
    const authToken = localStorage.getItem('authToken');
    if (!authToken) {
        console.error('No authentication token found');
        return [];
    }

    try {
        const response = await fetch('/api/class-schedule/weekly', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        return data.schedules || [];
    } catch (error) {
        console.error('Error fetching weekly schedules:', error);
        return [];
    }
}

// Render jadwal mingguan
function renderWeeklySchedule(schedules = null) {
    // Gunakan schedules jika disediakan, atau ambil dari variabel global
    const schedulesToRender = schedules !== null ? schedules : classSchedules;

    if (schedulesToRender.length === 0) {
        weeklyScheduleEl.innerHTML = '<p class="no-tasks">Belum ada jadwal kuliah yang dimasukkan</p>';
        return;
    }

    // Urutkan berdasarkan hari dalam seminggu
    const dayOrder = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'];
    const groupedSchedules = {};

    // Kelompokkan jadwal berdasarkan hari
    schedulesToRender.forEach(schedule => {
        if (!groupedSchedules[schedule.day]) {
            groupedSchedules[schedule.day] = [];
        }
        groupedSchedules[schedule.day].push(schedule);
    });

    // Urutkan hari sesuai dengan dayOrder
    const sortedDays = dayOrder.filter(day => groupedSchedules[day]);

    weeklyScheduleEl.innerHTML = sortedDays.map(day => {
        const daySchedules = groupedSchedules[day].sort((a, b) => a.start_time.localeCompare(b.start_time));
        const scheduleItems = daySchedules.map(schedule => {
            return `
                <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #eee;">
                    <div>
                        <strong>${schedule.start_time} - ${schedule.end_time}</strong><br>
                        <span style="color: var(--primary-color);">${schedule.course}</span>
                    </div>
                    <div style="text-align: right;">
                        <div>${schedule.place || 'Tempat belum ditentukan'}</div>
                    </div>
                </div>
            `;
        }).join('');

        return `
            <div style="background: var(--bg-white); border-radius: 8px; padding: 12px; margin-bottom: 10px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
                <h3 style="margin: 0 0 10px 0; color: var(--primary-color);">${getDayNameInIndonesian(day)}</h3>
                ${scheduleItems}
            </div>
        `;
    }).join('');
}

// Fungsi untuk mendapatkan nama hari dalam bahasa Indonesia
function getDayNameInIndonesian(day) {
    const dayMap = {
        'Min': 'Minggu',
        'Sen': 'Senin',
        'Sel': 'Selasa',
        'Rab': 'Rabu',
        'Kam': 'Kamis',
        'Jum': 'Jumat',
        'Sab': 'Sabtu'
    };
    return dayMap[day] || day;
}

// Update statistik halaman
function updateStats() {
    totalTasksEl.textContent = countTasksBy('total');
    todayDeadlinesEl.textContent = countTasksBy('today');
    lateTasksEl.textContent = countTasksBy('overdue');
}

// Set user name in greeting
function setGreeting() {
    if (currentUser && currentUser.name) {
        if (userNameEl) {
            userNameEl.textContent = currentUser.name;
        }
    }
}

// Tampilkan tanggal hari ini
function displayCurrentDate() {
    if (currentDateEl) {
        currentDateEl.textContent = formatDate(new Date().toISOString().split('T')[0]);
    }
}

// Fungsi untuk menyimpan data ke localStorage (per user)
function saveData() {
    if (currentUser) {
        const userStorageKey = `user_data_${currentUser.email}`;
        const userData = JSON.parse(localStorage.getItem(userStorageKey)) || { tasks: [], classSchedules: [], theme: 'light' };

        // Hapus properti subtasks dari semua tugas sebelum menyimpan
        const tasksWithoutSubtasks = tasks.map(task => {
            const { subtasks, ...cleanTask } = task;
            return cleanTask;
        });

        userData.tasks = tasksWithoutSubtasks;
        // classSchedules sekarang diambil dari server, bukan disimpan ke localStorage
        localStorage.setItem(userStorageKey, JSON.stringify(userData));
    }
}

// Fungsi untuk memuat data dari localStorage (per user)
function loadData() {
    if (currentUser) {
        const userStorageKey = `user_data_${currentUser.email}`;
        const userData = JSON.parse(localStorage.getItem(userStorageKey)) || { tasks: [], classSchedules: [], theme: 'light' };

        // Muat tugas dan pastikan subtasks dihapus
        tasks = (userData.tasks || []).map(task => {
            const { subtasks, ...cleanTask } = task;
            return cleanTask;
        });
        // classSchedules sekarang diambil dari server, bukan dari localStorage
    }
}

// Terapkan tema yang disimpan
function applySavedTheme() {
    let savedTheme = 'light'; // default
    if (currentUser) {
        const userStorageKey = `user_data_${currentUser.email}`;
        const userData = JSON.parse(localStorage.getItem(userStorageKey)) || { tasks: [], classSchedules: [], theme: 'light' };
        savedTheme = userData.theme || 'light';
    }
    const isDark = savedTheme === 'dark';
    if (isDark) {
        document.body.classList.add('dark-theme');
    } else {
        document.body.classList.remove('dark-theme');
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

// Inisialisasi aplikasi
async function initHome() {
    // Muat data pengguna (dengan verifikasi otentikasi)
    await loadCurrentUser();

    // Jika currentUser null karena otentikasi gagal, hentikan inisialisasi
    if (!currentUser) {
        return; // loadCurrentUser telah mengarahkan ke halaman login
    }

    // Muat data
    loadData();

    // Ambil jadwal kuliah dari server
    const serverSchedules = await fetchWeeklySchedules();
    // Gunakan jadwal dari server, atau jadwal lokal jika server gagal
    classSchedules = serverSchedules.length > 0 ? serverSchedules : [];

    // Terapkan tema yang disimpan
    applySavedTheme();

    // Atur sapaan dan tanggal
    setGreeting();
    displayCurrentDate();

    // Update statistik
    updateStats();

    // Render tugas mendesak dan jadwal
    renderUrgentTasks();
    renderWeeklySchedule(classSchedules);

    // Tambahkan event listener untuk tombol tambah tugas
    if (addTaskBtn) {
        addTaskBtn.addEventListener('click', () => {
            window.location.href = 'add_task.html';
        });
    }

    // Tambahkan event listener untuk navigasi
    setupNavigation();
}

// Inisialisasi aplikasi saat DOM siap
document.addEventListener('DOMContentLoaded', async () => {
    await initHome();
});

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

// Fungsi untuk melihat lampiran tugas di halaman beranda
function viewAttachmentsHome(taskId) {
    const task = tasks.find(t => t.id === taskId);
    if (!task || !task.attachments || task.attachments.length === 0) {
        alert('Tidak ada lampiran untuk tugas ini');
        return;
    }

    // Tampilkan modal dengan daftar lampiran
    showAttachmentsModalHome(task);
}

// Fungsi untuk menampilkan modal lampiran di halaman beranda
function showAttachmentsModalHome(task) {
    // Hapus modal sebelumnya jika ada
    const existingModal = document.getElementById('attachmentsModal');
    if (existingModal) {
        existingModal.remove();
    }

    // Buat modal
    const modal = document.createElement('div');
    modal.id = 'attachmentsModal';
    modal.className = 'modal';
    modal.style.cssText = `
        display: block;
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.5);
        z-index: 1000;
        overflow-y: auto;
    `;

    // Konten modal
    const modalContent = document.createElement('div');
    modalContent.style.cssText = `
        background: white;
        margin: 50px auto;
        padding: 20px;
        border-radius: 10px;
        width: 90%;
        max-width: 600px;
        max-height: 80vh;
        overflow-y: auto;
    `;

    // Header modal
    const header = document.createElement('div');
    header.style.cssText = `
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 20px;
    `;
    header.innerHTML = `
        <h3 style="margin: 0;">Lampiran Tugas: ${task.title}</h3>
        <button id="closeAttachmentsModalHome" style="background: none; border: none; font-size: 1.5rem; cursor: pointer;">
            &times;
        </button>
    `;

    // Daftar lampiran
    const attachmentsList = document.createElement('div');
    attachmentsList.id = 'attachmentsList';
    attachmentsList.style.cssText = `
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
        gap: 15px;
        margin-bottom: 20px;
    `;

    // Tambahkan setiap lampiran ke daftar
    task.attachments.forEach((attachment, index) => {
        const isImage = attachment.type && attachment.type.startsWith('image/');
        const attachmentItem = document.createElement('div');
        attachmentItem.style.cssText = `
            border: 1px solid #ddd;
            border-radius: 8px;
            padding: 10px;
            text-align: center;
        `;

        if (isImage && attachment.base64) {
            // Untuk gambar, tampilkan preview
            attachmentItem.innerHTML = `
                <div style="margin-bottom: 10px;">
                    <img src="${attachment.base64}"
                         style="max-width: 100%; max-height: 150px; border-radius: 4px;"
                         alt="${attachment.name}">
                </div>
                <div style="font-size: 0.85rem; word-break: break-all;">${attachment.name}</div>
                <button type="button" class="btn btn-outline btn-sm"
                        onclick="downloadAttachmentHome(${task.id}, ${index})"
                        style="margin-top: 8px; padding: 4px 8px; font-size: 0.75rem;">
                    <i class="fas fa-download"></i> Unduh
                </button>
            `;
        } else {
            // Untuk file non-gambar, tampilkan ikon
            attachmentItem.innerHTML = `
                <div style="font-size: 2rem; margin-bottom: 10px; color: var(--primary-color);">
                    <i class="fas fa-file"></i>
                </div>
                <div style="font-size: 0.85rem; word-break: break-all; margin-bottom: 10px;">${attachment.name}</div>
                <button type="button" class="btn btn-outline btn-sm"
                        onclick="downloadAttachmentHome(${task.id}, ${index})"
                        style="padding: 4px 8px; font-size: 0.75rem;">
                    <i class="fas fa-download"></i> Unduh
                </button>
            `;
        }

        attachmentsList.appendChild(attachmentItem);
    });

    // Tombol tutup
    const closeBtn = document.createElement('button');
    closeBtn.textContent = 'Tutup';
    closeBtn.className = 'btn btn-primary';
    closeBtn.style.cssText = `
        width: 100%;
        padding: 12px;
        font-size: 1rem;
    `;
    closeBtn.onclick = () => modal.remove();

    // Bangun modal
    modalContent.appendChild(header);
    modalContent.appendChild(attachmentsList);
    modalContent.appendChild(closeBtn);
    modal.appendChild(modalContent);

    // Tambahkan ke body
    document.body.appendChild(modal);

    // Tambahkan event listener untuk tombol close
    document.getElementById('closeAttachmentsModalHome').onclick = () => modal.remove();
}

// Fungsi untuk mengunduh lampiran dari halaman beranda
function downloadAttachmentHome(taskId, attachmentIndex) {
    const task = tasks.find(t => t.id === taskId);
    if (!task || !task.attachments || !task.attachments[attachmentIndex]) {
        alert('Lampiran tidak ditemukan');
        return;
    }

    const attachment = task.attachments[attachmentIndex];

    if (attachment.base64) {
        // Buat elemen link untuk download
        const link = document.createElement('a');
        link.href = attachment.base64;
        link.download = attachment.name;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    } else {
        alert('File tidak dapat diunduh');
    }
}

// Event listener untuk perubahan localStorage (misalnya dari halaman lain)
window.addEventListener('storage', function(e) {
    if (currentUser && e.key === `user_data_${currentUser.email}`) {
        // Jika data pengguna berubah dari halaman lain, muat ulang tugas dan render ulang
        loadData();
        updateStats();
        renderUrgentTasks();
        renderWeeklySchedule(); // Render jadwal mingguan juga agar tetap sinkron

        // Juga aplikasikan tema terbaru
        applySavedTheme();
    }
});