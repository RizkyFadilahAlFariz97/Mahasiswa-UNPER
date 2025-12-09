// tasks.js - Fungsi untuk halaman daftar tugas

// Data tugas
let tasks = [];
let currentUser = null;

// DOM Elements
const allTasksListEl = document.getElementById('all-tasks-list');
const addTaskBtn = document.getElementById('add-task-btn');
const searchTasksEl = document.getElementById('search-tasks');
const filterBtn = document.getElementById('filter-btn');
const sortBtn = document.getElementById('sort-btn');
const filterModal = document.getElementById('filterModal');
const categoryFilter = document.getElementById('category-filter');
const priorityFilter = document.getElementById('priority-filter');
const statusFilter = document.getElementById('status-filter');
const clearFilterBtn = document.getElementById('clear-filter');
const applyFilterBtn = document.getElementById('apply-filter');

// Variabel untuk filter dan sorting
let currentFilter = {
    category: '',
    priority: '',
    status: ''
};
let currentSort = 'date-asc'; // date-asc, date-desc, priority, title

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

// Render daftar tugas
function renderTasks() {
    // Filter dan sortir tugas
    let filteredTasks = [...tasks];

    // Filter berdasarkan pencarian
    if (searchTasksEl && searchTasksEl.value.trim() !== '') {
        const searchTerm = searchTasksEl.value.toLowerCase();
        filteredTasks = filteredTasks.filter(task => 
            task.title.toLowerCase().includes(searchTerm) ||
            task.description.toLowerCase().includes(searchTerm) ||
            task.category.toLowerCase().includes(searchTerm)
        );
    }

    // Filter berdasarkan kategori
    if (currentFilter.category) {
        filteredTasks = filteredTasks.filter(task => 
            task.category === currentFilter.category
        );
    }

    // Filter berdasarkan prioritas
    if (currentFilter.priority) {
        filteredTasks = filteredTasks.filter(task => 
            task.priority === currentFilter.priority
        );
    }

    // Filter berdasarkan status
    if (currentFilter.status) {
        filteredTasks = filteredTasks.filter(task => 
            task.status === currentFilter.status
        );
    }

    // Sortir tugas
    filteredTasks.sort((a, b) => {
        switch (currentSort) {
            case 'date-asc':
                return new Date(a.deadlineDate) - new Date(b.deadlineDate);
            case 'date-desc':
                return new Date(b.deadlineDate) - new Date(a.deadlineDate);
            case 'priority':
                const priorityOrder = { 'mendesak': 4, 'tinggi': 3, 'sedang': 2, 'rendah': 1 };
                if (priorityOrder[b.priority] !== priorityOrder[a.priority]) {
                    return priorityOrder[b.priority] - priorityOrder[a.priority];
                }
                return new Date(a.deadlineDate) - new Date(b.deadlineDate);
            case 'title':
                return a.title.localeCompare(b.title);
            default:
                return new Date(a.deadlineDate) - new Date(b.deadlineDate);
        }
    });

    if (filteredTasks.length === 0) {
        allTasksListEl.innerHTML = '<p class="no-tasks">Belum ada tugas yang dibuat atau tidak ada tugas yang sesuai dengan filter</p>';
        return;
    }

    allTasksListEl.innerHTML = filteredTasks.map(task => {
        const isOverdueTask = isOverdue(task.deadlineDate) && task.status !== 'completed';
        const isTodayTask = isToday(task.deadlineDate) && task.status !== 'completed';
        
        return `
            <div class="task-card priority-${task.priority} ${isOverdueTask ? 'overdue-task' : ''}">
                <input type="checkbox" class="task-checkbox" ${task.status === 'completed' ? 'checked' : ''}
                    onchange="toggleTaskStatus(${task.id})">
                <div class="task-info">
                    <div class="task-title">${task.title}</div>
                    <div>
                        <span class="task-course">${task.category}</span>
                        <span class="task-deadline">${formatDateShort(task.deadlineDate)} ${task.deadlineTime}</span>
                    </div>
                    ${task.description ? `<div class="task-description">${task.description}</div>` : ''}
                    ${isTodayTask ? '<div class="task-badge today">Hari Ini</div>' : ''}
                    ${isOverdueTask ? '<div class="task-badge overdue">Telat</div>' : ''}
                    ${task.attachments && task.attachments.length > 0 ? `
                    <div class="attachments-summary" style="margin-top: 8px;">
                        <small>
                            <i class="fas fa-paperclip"></i>
                            ${task.attachments.length} lampiran
                            <button type="button" class="btn btn-outline btn-sm" onclick="viewAttachments(${task.id})" style="padding: 2px 6px; margin-left: 8px; font-size: 0.75rem;">
                                <i class="fas fa-eye"></i> Lihat
                            </button>
                        </small>
                    </div>` : ''}
                </div>
                <div class="task-actions">
                    <button class="btn btn-outline" onclick="editTask(${task.id})" style="padding: 5px 10px; margin-left: 5px;">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-outline" onclick="deleteTask(${task.id})" style="padding: 5px 10px; margin-left: 5px; background-color: #ffebee; color: #f44336;">
                        <i class="fas fa-trash"></i>
                    </button>
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
        renderTasks();
        saveTasks();
    }
}

// Fungsi untuk mengedit tugas
function editTask(taskId) {
    // Simpan ID tugas yang akan diedit ke localStorage
    localStorage.setItem('editTaskId', taskId);
    // Arahkan ke halaman tambah tugas (akan mendeteksi bahwa ini adalah mode edit)
    window.location.href = 'add_task.html';
}

// Fungsi untuk menghapus tugas
function deleteTask(taskId) {
    if (confirm('Apakah Anda yakin ingin menghapus tugas ini?')) {
        tasks = tasks.filter(task => task.id !== taskId);
        renderTasks();
        updateStats();
        saveTasks();
    }
}

// Fungsi untuk melihat lampiran tugas
function viewAttachments(taskId) {
    const task = tasks.find(t => t.id === taskId);
    if (!task || !task.attachments || task.attachments.length === 0) {
        alert('Tidak ada lampiran untuk tugas ini');
        return;
    }

    // Tampilkan modal dengan daftar lampiran
    showAttachmentsModal(task);
}

// Fungsi untuk menampilkan modal lampiran
function showAttachmentsModal(task) {
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
        <button id="closeAttachmentsModal" style="background: none; border: none; font-size: 1.5rem; cursor: pointer;">
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
                        onclick="downloadAttachment(${task.id}, ${index})"
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
                        onclick="downloadAttachment(${task.id}, ${index})"
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
    document.getElementById('closeAttachmentsModal').onclick = () => modal.remove();
}

// Fungsi untuk mengunduh lampiran
function downloadAttachment(taskId, attachmentIndex) {
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

// Update statistik halaman (dari main.js)
function updateStats() {
    // Update statistik di halaman utama juga
    const totalTasksEl = document.getElementById('total-tasks');
    const todayDeadlinesEl = document.getElementById('today-deadlines');
    const lateTasksEl = document.getElementById('late-tasks');
    
    if (totalTasksEl) {
        totalTasksEl.textContent = tasks.filter(task => task.status !== 'completed').length;
    }
    if (todayDeadlinesEl) {
        todayDeadlinesEl.textContent = tasks.filter(task =>
            isToday(task.deadlineDate) &&
            task.status !== 'completed'
        ).length;
    }
    if (lateTasksEl) {
        lateTasksEl.textContent = tasks.filter(task =>
            isOverdue(task.deadlineDate) &&
            task.status !== 'completed'
        ).length;
    }
}

// Buka modal filter
function openFilterModal() {
    filterModal.style.display = 'block';
    
    // Isi nilai filter saat ini
    categoryFilter.value = currentFilter.category;
    priorityFilter.value = currentFilter.priority;
    statusFilter.value = currentFilter.status;
}

// Tutup modal filter
function closeFilterModal() {
    filterModal.style.display = 'none';
}

// Terapkan filter
function applyFilter() {
    currentFilter = {
        category: categoryFilter.value,
        priority: priorityFilter.value,
        status: statusFilter.value
    };
    
    renderTasks();
    closeFilterModal();
}

// Bersihkan filter
function clearFilter() {
    currentFilter = {
        category: '',
        priority: '',
        status: ''
    };
    
    categoryFilter.value = '';
    priorityFilter.value = '';
    statusFilter.value = '';
    
    renderTasks();
    closeFilterModal();
}

// Fungsi untuk menyimpan tugas ke localStorage (per user)
function saveTasks() {
    if (currentUser) {
        const userStorageKey = `user_data_${currentUser.email}`;
        const userData = JSON.parse(localStorage.getItem(userStorageKey)) || { tasks: [], classSchedules: [], theme: 'light' };

        // Hapus properti subtasks dari semua tugas sebelum menyimpan
        const tasksWithoutSubtasks = tasks.map(task => {
            const { subtasks, ...cleanTask } = task;
            return cleanTask;
        });

        userData.tasks = tasksWithoutSubtasks;
        localStorage.setItem(userStorageKey, JSON.stringify(userData));
    }
}

// Fungsi untuk memuat tugas dari localStorage (per user)
function loadTasks() {
    if (currentUser) {
        const userStorageKey = `user_data_${currentUser.email}`;
        const userData = JSON.parse(localStorage.getItem(userStorageKey)) || { tasks: [], classSchedules: [], theme: 'light' };

        // Muat tugas dan pastikan subtasks dihapus
        tasks = (userData.tasks || []).map(task => {
            const { subtasks, ...cleanTask } = task;
            return cleanTask;
        });
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

// Setup event listeners
function setupEventListeners() {
    // Tambahkan event listener untuk tombol tambah tugas
    if (addTaskBtn) {
        addTaskBtn.addEventListener('click', () => {
            window.location.href = 'add_task.html';
        });
    }

    // Event listener untuk pencarian
    if (searchTasksEl) {
        searchTasksEl.addEventListener('input', () => {
            renderTasks();
        });
    }

    // Event listener untuk tombol filter
    if (filterBtn) {
        filterBtn.addEventListener('click', openFilterModal);
    }

    // Event listener untuk tombol sortir
    if (sortBtn) {
        sortBtn.addEventListener('click', () => {
            // Tampilkan pilihan sortir
            const sortOptions = [
                { value: 'date-asc', label: 'Tanggal (Terdekat)' },
                { value: 'date-desc', label: 'Tanggal (Terlama)' },
                { value: 'priority', label: 'Prioritas' },
                { value: 'title', label: 'Judul (A-Z)' }
            ];
            
            const selectedSort = prompt(
                'Pilih metode pengurutan:\n' +
                sortOptions.map((opt, i) => `${i + 1}. ${opt.label}`).join('\n'),
                sortOptions.find(opt => opt.value === currentSort)?.label || 'Tanggal (Terdekat)'
            );
            
            if (selectedSort) {
                const selectedOption = sortOptions.find(opt => 
                    opt.label === selectedSort || 
                    sortOptions.indexOf(opt) + 1 === parseInt(selectedSort)
                );
                
                if (selectedOption) {
                    currentSort = selectedOption.value;
                    renderTasks();
                }
            }
        });
    }

    // Event listener untuk tombol-tombol di modal filter
    if (applyFilterBtn) {
        applyFilterBtn.addEventListener('click', applyFilter);
    }
    
    if (clearFilterBtn) {
        clearFilterBtn.addEventListener('click', clearFilter);
    }

    // Event listener untuk close modal (klik di luar modal)
    window.addEventListener('click', function(event) {
        if (event.target === filterModal) {
            closeFilterModal();
        }
    });

    // Tambahkan event listener untuk navigasi
    setupNavigation();
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
function initTasks() {
    // Muat data
    loadCurrentUser();
    loadTasks();

    // Terapkan tema yang disimpan
    applySavedTheme();

    // Render tugas
    renderTasks();

    // Update statistik
    updateStats();

    // Setup event listeners
    setupEventListeners();
}

// Inisialisasi aplikasi saat DOM siap
document.addEventListener('DOMContentLoaded', () => {
    initTasks();
});

// Event listener untuk perubahan localStorage (misalnya dari halaman lain)
window.addEventListener('storage', function(e) {
    if (currentUser && e.key === `user_data_${currentUser.email}`) {
        // Jika data pengguna berubah dari halaman lain, termasuk tema
        loadTasks();
        applySavedTheme();
        renderTasks();
        updateStats();
    }
});