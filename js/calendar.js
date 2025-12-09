// calendar.js - Fungsi untuk halaman kalender

let tasks = [];
let classSchedules = [];
let currentUser = null;

// DOM Elements
const calendarGrid = document.getElementById('calendar-grid');
const currentMonthYearEl = document.getElementById('current-month-year');
const prevMonthBtn = document.getElementById('prev-month');
const nextMonthBtn = document.getElementById('next-month');
const selectedDateEl = document.getElementById('selected-date');
const dailyTasksListEl = document.getElementById('daily-tasks-list');
const scheduleForm = document.getElementById('schedule-form');
const scheduleDay = document.getElementById('schedule-day');
const scheduleCourse = document.getElementById('schedule-course');
const scheduleStartTime = document.getElementById('schedule-start-time');
const scheduleEndTime = document.getElementById('schedule-end-time');
const schedulePlace = document.getElementById('schedule-place');
const cancelScheduleBtn = document.getElementById('cancel-schedule-btn');
const addTaskBtn = document.getElementById('add-task-btn');

// Variabel untuk manajemen kalender
let currentDate = new Date();
let selectedDate = new Date();

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

// Format hari ke bahasa Indonesia
function formatDayName(dayIndex) {
    const days = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
    return days[dayIndex];
}

// Format tanggal untuk ID elemen
function formatDateId(date) {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
}

// Fungsi untuk mendapatkan nama bulan dalam bahasa Indonesia
function getMonthName(monthIndex) {
    const months = [
        'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
        'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ];
    return months[monthIndex];
}

// Fungsi untuk mendapatkan hari dalam seminggu dalam bahasa Indonesia
function getDayName(dayIndex) {
    const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    return days[dayIndex];
}

// Fungsi untuk memeriksa apakah dua tanggal sama
function isSameDate(date1, date2) {
    return date1.getDate() === date2.getDate() &&
           date1.getMonth() === date2.getMonth() &&
           date1.getFullYear() === date2.getFullYear();
}

// Fungsi untuk mendapatkan tugas untuk tanggal tertentu
function getTasksForDate(date) {
    const dateStr = formatDateId(date);
    return tasks.filter(task => formatDateId(new Date(task.deadlineDate)) === dateStr);
}

// Fungsi untuk mendapatkan jadwal kuliah untuk hari tertentu
function getSchedulesForDay(day) {
    return classSchedules.filter(schedule => schedule.day === day);
}

// Render kalender
function renderCalendar() {
    // Kosongkan grid
    calendarGrid.innerHTML = '';

    // Dapatkan informasi bulan
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    // Set judul bulan dan tahun
    if (currentMonthYearEl) {
        currentMonthYearEl.textContent = `${getMonthName(month)} ${year}`;
    }

    // Tambahkan header hari
    const dayHeaders = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
    dayHeaders.forEach(day => {
        const dayHeader = document.createElement('div');
        dayHeader.className = 'calendar-day-header';
        dayHeader.textContent = day;
        calendarGrid.appendChild(dayHeader);
    });

    // Dapatkan tanggal pertama dan terakhir dalam bulan
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    // Dapatkan hari dari tanggal pertama (0 = Minggu, 1 = Senin, dst)
    const firstDayOfWeek = firstDay.getDay();
    
    // Hitung jumlah hari dalam bulan
    const daysInMonth = lastDay.getDate();

    // Tambahkan kotak untuk hari-hari sebelum tanggal pertama
    for (let i = 0; i < firstDayOfWeek; i++) {
        const emptyDay = document.createElement('div');
        emptyDay.className = 'calendar-day empty';
        emptyDay.textContent = '';
        calendarGrid.appendChild(emptyDay);
    }

    // Tambahkan kotak untuk setiap tanggal dalam bulan
    for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(year, month, day);
        const dateId = formatDateId(date);
        const dayIndex = date.getDay();
        const dayName = formatDayName(dayIndex);
        
        // Periksa apakah ini hari ini
        const isToday = isSameDate(date, new Date());
        
        // Periksa apakah ini tanggal yang dipilih
        const isSelected = isSameDate(date, selectedDate);
        
        // Dapatkan tugas dan jadwal untuk tanggal ini
        const dateTasks = getTasksForDate(date);
        const daySchedules = getSchedulesForDay(dayName);
        
        // Hitung jumlah tugas dan jadwal mendesak
        const urgentCount = dateTasks.filter(task => task.priority === 'mendesak').length;
        const highCount = dateTasks.filter(task => task.priority === 'tinggi').length;
        const mediumCount = dateTasks.filter(task => task.priority === 'sedang').length;
        const lowCount = dateTasks.filter(task => task.priority === 'rendah').length;
        
        // Buat elemen tanggal
        const dayElement = document.createElement('div');
        dayElement.className = `calendar-day ${isToday ? 'today' : ''} ${isSelected ? 'selected' : ''}`;
        if (urgentCount > 0) dayElement.classList.add('priority-mendesak');
        else if (highCount > 0) dayElement.classList.add('priority-tinggi');
        else if (mediumCount > 0) dayElement.classList.add('priority-sedang');
        else if (lowCount > 0) dayElement.classList.add('priority-rendah');
        
        dayElement.id = `date-${dateId}`;
        
        // Tambahkan event listener untuk klik
        dayElement.addEventListener('click', () => {
            selectDate(date);
        });
        
        // Tambahkan konten ke dalam elemen tanggal
        dayElement.innerHTML = `
            <div class="day-number">${day}</div>
            <div class="task-indicators">
                ${urgentCount > 0 ? `<div class="task-indicator" style="background-color: var(--danger-color);"></div>`.repeat(Math.min(urgentCount, 2)) : ''}
                ${urgentCount > 2 ? `<div class="more-indicator">+${urgentCount - 2}</div>` : ''}
            </div>
        `;
        
        calendarGrid.appendChild(dayElement);
    }

    // Perbarui daftar tugas untuk tanggal yang dipilih
    updateDailyTasksList();
}

// Pilih tanggal
function selectDate(date) {
    selectedDate = date;
    
    // Perbarui tampilan kalender
    renderCalendar();
    
    // Perbarui tampilan tanggal terpilih
    if (selectedDateEl) {
        selectedDateEl.textContent = formatDate(date);
    }
}

// Update daftar tugas harian
function updateDailyTasksList() {
    if (!selectedDateEl || !dailyTasksListEl) return;
    
    // Perbarui tampilan tanggal terpilih
    selectedDateEl.textContent = formatDate(selectedDate);
    
    // Dapatkan tugas untuk tanggal yang dipilih
    const dateTasks = getTasksForDate(selectedDate);
    
    // Gabungkan dengan jadwal kuliah untuk hari yang dipilih
    const dayName = formatDayName(selectedDate.getDay());
    const daySchedules = getSchedulesForDay(dayName);
    
    if (dateTasks.length === 0 && daySchedules.length === 0) {
        dailyTasksListEl.innerHTML = '<p class="no-tasks">Tidak ada tugas atau jadwal kuliah untuk tanggal ini</p>';
        return;
    }
    
    // Buat daftar tugas
    const taskListItems = dateTasks.map(task => {
        return `
            <div class="task-card priority-${task.priority}">
                <input type="checkbox" class="task-checkbox" ${task.status === 'completed' ? 'checked' : ''}
                    onchange="toggleTaskStatus(${task.id})">
                <div class="task-info">
                    <div class="task-title">${task.title}</div>
                    <div>
                        <span class="task-course">${task.category}</span>
                        <span class="task-deadline">${task.deadlineTime}</span>
                    </div>
                    ${task.description ? `<div class="task-description">${task.description}</div>` : ''}
                    ${task.attachments && task.attachments.length > 0 ? `
                    <div class="attachments-summary" style="margin-top: 8px;">
                        <small>
                            <i class="fas fa-paperclip"></i>
                            ${task.attachments.length} lampiran
                            <button type="button" class="btn btn-outline btn-sm" onclick="viewAttachmentsCalendar(${task.id})" style="padding: 2px 6px; margin-left: 8px; font-size: 0.75rem;">
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
    });
    
    // Buat daftar jadwal kuliah
    const scheduleListItems = daySchedules.map(schedule => {
        return `
            <div class="task-card" style="border-left-color: var(--info-color);">
                <div class="task-info">
                    <div class="task-title">${schedule.course}</div>
                    <div>
                        <span class="task-course">Jadwal Kuliah</span>
                        <span class="task-deadline">${schedule.startTime} - ${schedule.endTime}</span>
                    </div>
                    ${schedule.place ? `<div class="task-description">Tempat: ${schedule.place}</div>` : ''}
                </div>
                <div class="task-actions">
                    <button class="btn btn-outline" onclick="editSchedule(${schedule.id})" style="padding: 5px 10px; margin-left: 5px;">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-outline" onclick="deleteSchedule(${schedule.id})" style="padding: 5px 10px; margin-left: 5px; background-color: #ffebee; color: #f44336;">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `;
    });
    
    // Gabungkan dan tampilkan
    dailyTasksListEl.innerHTML = [...taskListItems, ...scheduleListItems].join('');
}

// Toggle status tugas
function toggleTaskStatus(taskId) {
    const task = tasks.find(t => t.id === taskId);
    if (task) {
        task.status = task.status === 'completed' ? 'pending' : 'completed';
        updateDailyTasksList();
        saveData();
    }
}

// Edit tugas
function editTask(taskId) {
    // Simpan ID tugas yang akan diedit ke localStorage
    localStorage.setItem('editTaskId', taskId);
    // Arahkan ke halaman tambah tugas (akan mendeteksi bahwa ini adalah mode edit)
    window.location.href = 'add_task.html';
}

// Hapus tugas
function deleteTask(taskId) {
    if (confirm('Apakah Anda yakin ingin menghapus tugas ini?')) {
        tasks = tasks.filter(task => task.id !== taskId);
        renderCalendar();
        updateDailyTasksList();
        saveData();
    }
}

// Edit jadwal
function editSchedule(scheduleId) {
    // Temukan jadwal yang akan diedit
    const schedule = classSchedules.find(s => s.id === scheduleId);
    if (schedule) {
        // Isi form dengan data jadwal
        scheduleDay.value = schedule.day;
        scheduleCourse.value = schedule.course;
        scheduleStartTime.value = schedule.startTime;
        scheduleEndTime.value = schedule.endTime;
        schedulePlace.value = schedule.place || '';
        
        // Scroll ke form
        scheduleForm.scrollIntoView({ behavior: 'smooth' });
    }
}

// Hapus jadwal
async function deleteSchedule(scheduleId) {
    if (confirm('Apakah Anda yakin ingin menghapus jadwal ini?')) {
        const authToken = localStorage.getItem('authToken');
        if (!authToken) {
            alert('Silakan login terlebih dahulu');
            return;
        }

        try {
            const response = await fetch(`/api/class-schedule/${scheduleId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${authToken}`
                }
            });

            if (response.ok) {
                // Hapus jadwal dari array lokal
                classSchedules = classSchedules.filter(schedule => schedule.id !== scheduleId);
                renderCalendar();
                updateDailyTasksList();
                saveData();
                alert('Jadwal kuliah berhasil dihapus');
            } else {
                const errorData = await response.json();
                alert(`Gagal menghapus jadwal: ${errorData.error || 'Terjadi kesalahan'}`);
            }
        } catch (error) {
            console.error('Error deleting schedule:', error);
            alert('Terjadi kesalahan saat menghapus jadwal');
        }
    }
}

// Tambah atau update jadwal
async function addSchedule(scheduleData) {
    const authToken = localStorage.getItem('authToken');
    if (!authToken) {
        alert('Silakan login terlebih dahulu');
        return;
    }

    try {
        if (scheduleData.id) {
            // Update jadwal yang sudah ada
            const response = await fetch(`/api/class-schedule/${scheduleData.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${authToken}`
                },
                body: JSON.stringify({
                    day: scheduleData.day,
                    course: scheduleData.course,
                    start_time: scheduleData.startTime,
                    end_time: scheduleData.endTime,
                    place: scheduleData.place
                })
            });

            if (response.ok) {
                // Update jadwal di array lokal
                const scheduleIndex = classSchedules.findIndex(s => s.id === scheduleData.id);
                if (scheduleIndex !== -1) {
                    classSchedules[scheduleIndex] = {
                        ...scheduleData,
                        start_time: scheduleData.startTime, // sesuaikan nama field
                        end_time: scheduleData.endTime
                    };
                }
                alert('Jadwal kuliah berhasil diperbarui');
            } else {
                const errorData = await response.json();
                alert(`Gagal memperbarui jadwal: ${errorData.error || 'Terjadi kesalahan'}`);
                return;
            }
        } else {
            // Tambah jadwal baru
            const response = await fetch('/api/class-schedule', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${authToken}`
                },
                body: JSON.stringify({
                    day: scheduleData.day,
                    course: scheduleData.course,
                    start_time: scheduleData.startTime,
                    end_time: scheduleData.endTime,
                    place: scheduleData.place
                })
            });

            if (response.ok) {
                const result = await response.json();
                scheduleData.id = result.id;
                classSchedules.push({
                    ...scheduleData,
                    start_time: scheduleData.startTime, // sesuaikan nama field
                    end_time: scheduleData.endTime
                });
                alert('Jadwal kuliah berhasil ditambahkan');
            } else {
                const errorData = await response.json();
                alert(`Gagal menambahkan jadwal: ${errorData.error || 'Terjadi kesalahan'}`);
                return;
            }
        }

        // Kosongkan form
        scheduleForm.reset();

        // Render ulang kalender
        renderCalendar();
        updateDailyTasksList();
        saveData();
    } catch (error) {
        console.error('Error saving schedule:', error);
        alert('Terjadi kesalahan saat menyimpan jadwal');
    }
}

// Validasi form jadwal
function validateScheduleForm(formData) {
    if (!formData.day) {
        alert('Hari wajib dipilih');
        return false;
    }
    
    if (!formData.course.trim()) {
        alert('Nama mata kuliah wajib diisi');
        return false;
    }
    
    if (!formData.startTime) {
        alert('Jam mulai wajib diisi');
        return false;
    }
    
    if (!formData.endTime) {
        alert('Jam selesai wajib diisi');
        return false;
    }
    
    // Cek apakah jam selesai setelah jam mulai
    if (formData.startTime >= formData.endTime) {
        alert('Jam selesai harus setelah jam mulai');
        return false;
    }
    
    return true;
}

// Fungsi untuk menangani submit form jadwal
function handleScheduleSubmit(event) {
    event.preventDefault();
    
    // Ambil data dari form
    const formData = {
        id: null, // Akan diisi jika ini adalah edit
        day: scheduleDay.value,
        course: scheduleCourse.value,
        startTime: scheduleStartTime.value,
        endTime: scheduleEndTime.value,
        place: schedulePlace.value || ''
    };
    
    // Validasi form
    if (!validateScheduleForm(formData)) {
        return;
    }
    
    // Tambah atau update jadwal
    addSchedule(formData);
}

// Fungsi untuk menyimpan data ke localStorage (per user)
function saveData() {
    if (currentUser) {
        const userStorageKey = `user_data_${currentUser.email}`;
        const userData = JSON.parse(localStorage.getItem(userStorageKey)) || { tasks: [], classSchedules: [], theme: 'light' };
        userData.tasks = tasks;
        userData.classSchedules = classSchedules;
        localStorage.setItem(userStorageKey, JSON.stringify(userData));
    }
}

// Fungsi untuk memuat jadwal kuliah dari server
async function loadClassSchedules() {
    if (!currentUser) return;

    const authToken = localStorage.getItem('authToken');
    if (!authToken) {
        console.error('No authentication token found');
        return;
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
        classSchedules = data.schedules || [];
    } catch (error) {
        console.error('Error loading class schedules:', error);
        classSchedules = [];
    }
}

// Fungsi untuk memuat data dari localStorage (per user)
function loadData() {
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

// Setup event listeners
function setupEventListeners() {
    // Tambahkan event listener untuk tombol navigasi bulan
    if (prevMonthBtn) {
        prevMonthBtn.addEventListener('click', () => {
            currentDate.setMonth(currentDate.getMonth() - 1);
            renderCalendar();
        });
    }
    
    if (nextMonthBtn) {
        nextMonthBtn.addEventListener('click', () => {
            currentDate.setMonth(currentDate.getMonth() + 1);
            renderCalendar();
        });
    }
    
    // Tambahkan event listener untuk tombol tambah tugas
    if (addTaskBtn) {
        addTaskBtn.addEventListener('click', () => {
            window.location.href = 'add_task.html';
        });
    }
    
    // Tambahkan event listener untuk form jadwal kuliah
    if (scheduleForm) {
        scheduleForm.addEventListener('submit', handleScheduleSubmit);
    }
    
    // Tambahkan event listener untuk tombol batal form jadwal
    if (cancelScheduleBtn) {
        cancelScheduleBtn.addEventListener('click', () => {
            scheduleForm.reset();
        });
    }
    
    // Tambahkan event listener untuk navigasi
    setupNavigation();
}

// Inisialisasi aplikasi
async function initCalendar() {
    // Muat data
    loadCurrentUser();
    loadData();

    // Muat jadwal kuliah dari server
    await loadClassSchedules();

    // Terapkan tema yang disimpan
    applySavedTheme();

    // Render kalender
    renderCalendar();

    // Setup event listeners
    setupEventListeners();

    // Pilih tanggal hari ini secara default
    selectDate(new Date());
}

// Inisialisasi aplikasi saat DOM siap
document.addEventListener('DOMContentLoaded', async () => {
    await initCalendar();
});

// Fungsi untuk melihat lampiran tugas di kalender
function viewAttachmentsCalendar(taskId) {
    const task = tasks.find(t => t.id === taskId);
    if (!task || !task.attachments || task.attachments.length === 0) {
        alert('Tidak ada lampiran untuk tugas ini');
        return;
    }

    // Tampilkan modal dengan daftar lampiran
    showAttachmentsModalCalendar(task);
}

// Fungsi untuk menampilkan modal lampiran di kalender
function showAttachmentsModalCalendar(task) {
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
        <button id="closeAttachmentsModalCalendar" style="background: none; border: none; font-size: 1.5rem; cursor: pointer;">
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
                        onclick="downloadAttachmentCalendar(${task.id}, ${index})"
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
                        onclick="downloadAttachmentCalendar(${task.id}, ${index})"
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
    document.getElementById('closeAttachmentsModalCalendar').onclick = () => modal.remove();
}

// Fungsi untuk mengunduh lampiran dari kalender
function downloadAttachmentCalendar(taskId, attachmentIndex) {
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
        // Jika data pengguna berubah dari halaman lain, termasuk tema
        loadData();
        applySavedTheme();
        renderCalendar();
        updateDailyTasksList();
    }
});