// add_task.js - Fungsi untuk halaman tambah/edit tugas

// Data dummy untuk percobaan
let tasks = [];
let currentUser = null;
let editTaskId = null; // ID tugas yang sedang diedit (jika ada)
let attachments = []; // Array untuk menyimpan file attachments

// DOM Elements
const taskForm = document.getElementById('task-form');
const taskTitle = document.getElementById('task-title');
const taskDescription = document.getElementById('task-description');
const taskCategory = document.getElementById('task-category');
const deadlineDate = document.getElementById('deadline-date');
const deadlineTime = document.getElementById('deadline-time');
const priorityOptions = document.querySelectorAll('input[name="priority"]');
const enableReminder = document.getElementById('enable-reminder');
const attachBtn = document.getElementById('attach-btn');
const attachmentInput = document.getElementById('attachment-input');
const attachmentPreview = document.getElementById('attachment-preview');
const cancelBtn = document.getElementById('cancel-btn');
const saveTaskBtn = taskForm.querySelector('button[type="submit"]');

// Inisialisasi tugas kosong
const emptyTask = {
    id: null,
    title: '',
    description: '',
    deadlineDate: '',
    deadlineTime: '',
    category: '',
    status: 'pending',
    priority: 'sedang',
    reminder: false,
    attachments: []
};

// Fungsi untuk menangani pemilihan file
function handleFileSelection(event) {
    const files = Array.from(event.target.files);

    files.forEach(file => {
        const fileObj = {
            id: Date.now() + Math.random(), // ID unik
            name: file.name,
            size: file.size,
            type: file.type,
            file: file // Simpan file objek penuh
        };

        attachments.push(fileObj);
    });

    renderAttachmentPreview();
}

// Fungsi untuk merender preview lampiran
function renderAttachmentPreview() {
    if (attachments.length === 0) {
        attachmentPreview.innerHTML = '<p style="color: var(--text-light); font-style: italic;">Belum ada file dipilih</p>';
        return;
    }

    // Gunakan Promise.all untuk menunggu semua proses rendering selesai
    const attachmentElements = attachments.map((attachment, index) => {
        // Cek apakah file adalah gambar
        const isImage = attachment.type.startsWith('image/');

        if (isImage) {
            // Untuk file gambar, tampilkan preview
            // Gunakan base64 jika tersedia (file yang disimpan), atau file objek jika baru dipilih
            const src = attachment.base64 || (attachment.file ? URL.createObjectURL(attachment.file) : '');

            return `
                <div class="attachment-item" style="position: relative; display: inline-block; margin: 5px; padding: 5px; border: 1px solid #ddd; border-radius: 5px;">
                    <img src="${src}" style="width: 60px; height: 60px; object-fit: cover; border-radius: 3px;" alt="Preview">
                    <div style="font-size: 0.8rem; max-width: 100px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${attachment.name}</div>
                    <button type="button" class="btn btn-outline" onclick="removeAttachment(${index})"
                        style="position: absolute; top: -8px; right: -8px; padding: 2px 6px; width: 20px; height: 20px; display: flex; align-items: center; justify-content: center; font-size: 0.7rem;">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            `;
        } else {
            // Untuk file non-gambar, tampilkan ikon dan nama file
            return `
                <div class="attachment-item" style="display: flex; align-items: center; margin: 5px 0; padding: 8px; background: var(--bg-light); border-radius: 5px;">
                    <i class="fas fa-file" style="margin-right: 8px; color: var(--primary-color);"></i>
                    <div style="flex: 1; font-size: 0.9rem; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${attachment.name}</div>
                    <button type="button" class="btn btn-outline" onclick="removeAttachment(${index})"
                        style="padding: 3px 8px; margin-left: 8px; font-size: 0.8rem;">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            `;
        }
    });

    attachmentPreview.innerHTML = attachmentElements.join('');
}

// Fungsi untuk menghapus lampiran
function removeAttachment(index) {
    const removed = attachments.splice(index, 1)[0];
    // Revoke object URL jika file objek ada untuk mencegah kebocoran memori
    if (removed.file) {
        URL.revokeObjectURL(removed.file);
    }
    renderAttachmentPreview();
}

// Fungsi untuk menyimpan lampiran ke localStorage (dalam bentuk base64)
async function saveAttachmentsAsBase64() {
    const attachmentsToSave = [];

    for (const attachment of attachments) {
        // Jika attachment.file ada (baru dipilih), convert ke base64
        if (attachment.file) {
            const base64 = await fileToBase64(attachment.file);
            attachmentsToSave.push({
                id: attachment.id,
                name: attachment.name,
                size: attachment.size,
                type: attachment.type,
                base64: base64,
                isStored: false // Ini adalah file baru
            });
        } else {
            // Jika attachment.file tidak ada, berarti ini sudah disimpan sebelumnya
            attachmentsToSave.push({
                id: attachment.id,
                name: attachment.name,
                size: attachment.size,
                type: attachment.type,
                base64: attachment.base64,
                isStored: true // Ini adalah file yang sudah disimpan
            });
        }
    }

    return attachmentsToSave;
}

// Fungsi bantu untuk convert file ke base64
function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result);
        reader.onerror = error => reject(error);
    });
}

// Ambil ID tugas yang akan diedit dari localStorage (jika ada)
function getEditTaskId() {
    const id = localStorage.getItem('editTaskId');
    if (id) {
        editTaskId = parseInt(id);
        localStorage.removeItem('editTaskId'); // Hapus setelah diambil
        return editTaskId;
    }
    return null;
}

// Dapatkan tugas berdasarkan ID
function getTaskById(id) {
    return tasks.find(task => task.id === id);
}


// Simpan tugas
async function saveTask(taskData) {
    // Hapus properti subtasks dari taskData sebelum menyimpan
    const { subtasks, ...cleanTaskData } = taskData;

    // Konversi lampiran ke base64
    const attachmentsAsBase64 = await saveAttachmentsAsBase64();

    if (editTaskId !== null) {
        // Update tugas yang sudah ada
        const taskIndex = tasks.findIndex(t => t.id === editTaskId);
        if (taskIndex !== -1) {
            tasks[taskIndex] = { ...tasks[taskIndex], ...cleanTaskData, attachments: attachmentsAsBase64 };
        }
    } else {
        // Tambah tugas baru
        const newId = tasks.length > 0 ? Math.max(...tasks.map(t => t.id)) + 1 : 1;
        tasks.push({ ...cleanTaskData, id: newId, attachments: attachmentsAsBase64 });
    }

    // Simpan ke localStorage
    saveData();

    // Kembali ke halaman daftar tugas
    window.location.href = 'tasks.html';
}

// Tangani submit form
async function handleFormSubmit(event) {
    event.preventDefault();

    // Ambil data dari form
    const formData = {
        title: taskTitle.value,
        description: taskDescription.value,
        deadlineDate: deadlineDate.value,
        deadlineTime: deadlineTime.value,
        category: taskCategory.value,
        priority: document.querySelector('input[name="priority"]:checked').value,
        reminder: enableReminder.checked
    };

    // Validasi form
    if (!validateForm(formData)) {
        return;
    }

    // Simpan tugas
    await saveTask(formData);
}

// Validasi form
function validateForm(formData) {
    if (!formData.title.trim()) {
        alert('Judul tugas wajib diisi');
        return false;
    }
    
    if (!formData.category) {
        alert('Kategori tugas wajib dipilih');
        return false;
    }
    
    if (!formData.deadlineDate) {
        alert('Tanggal deadline wajib diisi');
        return false;
    }
    
    if (!formData.deadlineTime) {
        alert('Waktu deadline wajib diisi');
        return false;
    }
    
    // Cek apakah deadline sudah lewat
    const deadline = new Date(`${formData.deadlineDate}T${formData.deadlineTime}`);
    const now = new Date();
    if (deadline < now) {
        alert('Tanggal dan waktu deadline tidak boleh di masa lalu');
        return false;
    }
    
    return true;
}

// Isi form dengan data tugas yang diedit
function populateForm(task) {
    taskTitle.value = task.title || '';
    taskDescription.value = task.description || '';
    taskCategory.value = task.category || '';
    deadlineDate.value = task.deadlineDate || '';
    deadlineTime.value = task.deadlineTime || '';

    // Set prioritas
    priorityOptions.forEach(option => {
        if (option.value === task.priority) {
            option.checked = true;
        }
    });

    enableReminder.checked = task.reminder || false;

    // Isi lampiran
    if (task.attachments) {
        // Konversi lampiran yang disimpan ke format yang bisa digunakan
        attachments = task.attachments.map(att => {
            // Jika lampiran memiliki base64 dan merupakan file yang disimpan sebelumnya
            if (att.base64 && att.isStored) {
                return {
                    id: att.id,
                    name: att.name,
                    size: att.size,
                    type: att.type,
                    base64: att.base64,
                    isStored: true
                };
            } else {
                // Jika tidak, kembalikan seperti semula
                return { ...att };
            }
        });
        renderAttachmentPreview();
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
        localStorage.setItem(userStorageKey, JSON.stringify(userData));
    }
}

// Fungsi untuk memuat tugas dari localStorage (per user)
function loadData() {
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
function loadCurrentUser() {
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
        currentUser = JSON.parse(savedUser);
    } else {
        // Jika tidak ada data pengguna, arahkan ke halaman login
        window.location.href = 'login.html';
    }
}

// Setup event listeners
function setupEventListeners() {
    // Event listener untuk form submit
    if (taskForm) {
        taskForm.addEventListener('submit', handleFormSubmit);
    }

    // Event listener untuk tombol lampirkan
    if (attachBtn) {
        attachBtn.addEventListener('click', () => {
            attachmentInput.click();
        });
    }

    // Event listener untuk input file
    if (attachmentInput) {
        attachmentInput.addEventListener('change', handleFileSelection);
    }

    // Event listener untuk tombol batal
    if (cancelBtn) {
        cancelBtn.addEventListener('click', () => {
            window.location.href = 'tasks.html';
        });
    }

    // Event listener untuk pilihan prioritas
    priorityOptions.forEach(option => {
        option.addEventListener('change', () => {
            // Hapus kelas aktif dari semua pilihan
            document.querySelectorAll('.priority-option').forEach(el => {
                el.style.borderColor = '#ddd';
            });

            // Tambahkan kelas aktif ke pilihan yang dipilih
            const parentLabel = option.closest('.priority-option');
            parentLabel.style.borderColor = 'var(--primary-color)';
        });
    });

    // Set border default pada prioritas yang dipilih
    setTimeout(() => {
        const checkedOption = document.querySelector('input[name="priority"]:checked');
        if (checkedOption) {
            const parentLabel = checkedOption.closest('.priority-option');
            parentLabel.style.borderColor = 'var(--primary-color)';
        }
    }, 100);
}

// Inisialisasi aplikasi
function initAddTask() {
    // Muat data
    loadCurrentUser();
    loadData();

    // Terapkan tema yang disimpan
    applySavedTheme();

    // Cek apakah sedang mengedit tugas
    const taskId = getEditTaskId();
    if (taskId !== null) {
        const taskToEdit = getTaskById(taskId);
        if (taskToEdit) {
            // Set judul halaman
            document.querySelector('.header-content h1').textContent = 'Edit Tugas';
            // Isi form dengan data tugas
            populateForm(taskToEdit);
        }
    } else {
        // Jika tidak mengedit, inisialisasi lampiran kosong
        attachments = [];
        renderAttachmentPreview();
    }

    // Setup event listeners
    setupEventListeners();


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
                    // Konfirmasi sebelum pindah halaman jika form telah diubah
                    if (hasFormChanged()) {
                        if (confirm('Perubahan belum disimpan. Apakah Anda yakin ingin meninggalkan halaman ini?')) {
                            window.location.href = href;
                        }
                    } else {
                        window.location.href = href;
                    }
                }
            }
        });
    });
}

// Cek apakah form telah diubah
function hasFormChanged() {
    // Untuk sementara, kita anggap form selalu dianggap berubah
    // Di implementasi nyata, kita akan membandingkan nilai awal dan nilai sekarang
    return true;
}

// Inisialisasi aplikasi saat DOM siap
document.addEventListener('DOMContentLoaded', () => {
    initAddTask();
});

// Event listener untuk perubahan localStorage (misalnya dari halaman lain)
window.addEventListener('storage', function(e) {
    if (currentUser && e.key === `user_data_${currentUser.email}`) {
        // Jika data pengguna berubah dari halaman lain, termasuk tema
        applySavedTheme();
    }
});