// main.js - Fungsi utama aplikasi Mahasiswa UNPER

// Data dummy untuk percobaan
let tasks = [];
let currentUser = null;

// DOM Elements
const totalTasksEl = document.getElementById('total-tasks');
const todayDeadlinesEl = document.getElementById('today-deadlines');
const lateTasksEl = document.getElementById('late-tasks');
const urgentTasksListEl = document.getElementById('urgent-tasks-list');
const addTaskBtn = document.getElementById('add-task-btn');

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
        saveTasks();
    }
}

// Update statistik halaman
function updateStats() {
    totalTasksEl.textContent = countTasksBy('total');
    todayDeadlinesEl.textContent = countTasksBy('today');
    lateTasksEl.textContent = countTasksBy('overdue');
}

// Toggle tema (terang/gelap)
function toggleTheme() {
    const darkThemeToggle = document.getElementById('dark-theme-toggle');
    if (darkThemeToggle) {
        const isDark = !document.body.classList.contains('dark-theme');
        darkThemeToggle.checked = isDark;
    }

    document.body.classList.toggle('dark-theme');
    const isDark = document.body.classList.contains('dark-theme');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
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

// Fungsi untuk menyimpan tugas ke localStorage (per user)
function saveTasks() {
    if (currentUser) {
        const userStorageKey = `user_data_${currentUser.email}`;
        const userData = JSON.parse(localStorage.getItem(userStorageKey)) || { tasks: [], classSchedules: [], theme: 'light' };
        userData.tasks = tasks;
        localStorage.setItem(userStorageKey, JSON.stringify(userData));
    }
}

// Fungsi untuk memuat tugas dari localStorage (per user)
function loadTasks() {
    if (currentUser) {
        const userStorageKey = `user_data_${currentUser.email}`;
        const userData = JSON.parse(localStorage.getItem(userStorageKey)) || { tasks: [], classSchedules: [], theme: 'light' };
        tasks = userData.tasks || [];
    }
}

// Fungsi untuk memuat data pengguna
function loadCurrentUser() {
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
        currentUser = JSON.parse(savedUser);
    } else {
        // Jika tidak ada data pengguna, arahkan ke halaman login
        window.location.href = 'login.html';
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
function initApp() {
    // Muat data
    loadCurrentUser();
    loadTasks();

    // Periksa tema yang disimpan
    applySavedTheme();

    // Update statistik
    updateStats();

    // Render tugas mendesak
    renderUrgentTasks();

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
document.addEventListener('DOMContentLoaded', () => {
    initApp();
});