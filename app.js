// ================= 1. БАЗА ДАННЫХ И ИНИЦИАЛИЗАЦИЯ =================
// Проверяем, есть ли сохраненные данные в браузере. Если нет - создаем базовые.
let requests = JSON.parse(localStorage.getItem('sb_requests')) || [
    { id: 1, name: "Python для станков", company: "БелАЗ", status: "gap" },
    { id: 2, name: "Управление Siemens", company: "МТЗ", status: "gap" }
];

// ================= 2. ЛОГИКА ТЕМНОЙ/СВЕТЛОЙ ТЕМЫ =================
function toggleTheme() {
    document.body.classList.toggle('dark-theme');
    const isDark = document.body.classList.contains('dark-theme');
    const icon = document.querySelector('#theme-btn i');
    
    // Меняем иконку луны на солнце и обратно
    icon.className = isDark ? 'fa-solid fa-sun' : 'fa-solid fa-moon';
    // Сохраняем выбор пользователя в память
    localStorage.setItem('sb_theme', isDark ? 'dark' : 'light');
}

// ================= 3. НАВИГАЦИЯ ПО САЙДБАРУ =================
function navTo(pageId, element) {
    // Скрываем все страницы и убираем активный класс с меню
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    
    // Показываем нужную страницу и подсвечиваем кнопку
    document.getElementById('page-' + pageId).classList.add('active');
    element.classList.add('active');

    // Управляем шапкой (прячем переключатель ролей на страницах таблиц)
    const switcher = document.getElementById('role-switcher');
    const title = document.getElementById('page-title');
    
    if (pageId === 'analytics') {
        switcher.style.display = 'flex'; 
        title.innerText = 'Синхронизация рынка труда';
    } else {
        switcher.style.display = 'none'; 
        if (pageId === 'plants') title.innerText = 'Реестр предприятий';
        if (pageId === 'colleges') title.innerText = 'Реестр колледжей';
        if (pageId === 'reports') title.innerText = 'Сводный отчет';
    }
    updateUI();
}

// ================= 4. ПЕРЕКЛЮЧЕНИЕ РОЛЕЙ (ЗАВОД / КОЛЛЕДЖ) =================
function switchRole(role) {
    document.getElementById('tab-plant').classList.toggle('active', role === 'plant');
    document.getElementById('tab-college').classList.toggle('active', role === 'college');
    
    document.getElementById('view-plant').style.display = role === 'plant' ? 'block' : 'none';
    document.getElementById('view-college').style.display = role === 'college' ? 'block' : 'none';
    updateUI();
}

// ================= 5. ПОИСК КОЛЛЕДЖА (АНАЛИЗ) =================
function analyzeSkill() {
    const skill = document.getElementById('skill-select').value;
    const box = document.getElementById('match-box');
    
    box.classList.add('active');
    box.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Поиск по базе...`;
    
    // Имитация загрузки данных (полсекунды)
    setTimeout(() => {
        let res = '';
        if(skill === 'python') res = `<strong>Минский радиотехнический колледж</strong>Готовность: 85% (есть преподаватель).`;
        else if(skill === 'cnc') res = `<strong>Брестский машиностроительный</strong>Готовность: 40% (требуются инвестиции в станки).`;
        else res = `<strong>Гомельский колледж</strong>Готовность: 60% (не хватает практики).`;
        box.innerHTML = res;
    }, 500);
}

// ================= 6. СОЗДАНИЕ НОВОГО ЗАПРОСА =================
function createRequest() {
    const input = document.getElementById('new-skill-input');
    if(!input.value.trim()) return; // Защита от пустой строки
    
    requests.push({ 
        id: Date.now(), 
        name: input.value, 
        company: "Ваше предприятие", 
        status: "gap" // По умолчанию "ожидает"
    });
    
    saveData();
    input.value = '';
    showToast('Запрос отправлен в колледжи!');
    updateUI();
}

// ================= 7. СМЕНА СТАТУСА (КАНБАН) =================
function changeStatus(id) {
    const req = requests.find(r => r.id === id);
    if (!req) return;

    if (req.status === 'gap') {
        req.status = 'work'; // Берем в работу
        showToast(`Задача "${req.name}" взята в работу методистами.`);
    } else if (req.status === 'work') {
        req.status = 'done'; // Внедряем
        showToast(`Модуль "${req.name}" успешно внедрен в учебный план!`);
    }
    
    saveData();
    updateUI();
}

// ================= 8. ОБНОВЛЕНИЕ ИНТЕРФЕЙСА =================
function updateUI() {
    const gap = requests.filter(r => r.status === 'gap').length;
    const work = requests.filter(r => r.status === 'work').length;
    const done = requests.filter(r => r.status === 'done').length;
    const total = requests.length;

    // Обновляем счетчики (Завод)
    document.getElementById('plant-gap-count').innerText = gap;
    document.getElementById('plant-done-count').innerText = done;

    // Обновляем счетчики (Колледж)
    document.getElementById('college-req-count').innerText = gap;
    document.getElementById('college-work-count').innerText = work;
    document.getElementById('college-done-count').innerText = done;

    // Обновляем счетчики (Отчеты)
    document.getElementById('report-total').innerText = done;

    // --- Отрисовка графика-пончика ---
    let percent = total === 0 ? 0 : Math.round((done / total) * 100);
    const donut = document.getElementById('donut-chart');
    if(donut) {
        donut.style.background = `conic-gradient(var(--green) ${percent}%, var(--border) ${percent}%)`;
        document.getElementById('donut-percent').innerText = percent + '%';
    }

    // --- Отрисовка списка задач в кабинете Колледжа ---
    const list = document.getElementById('college-list');
    list.innerHTML = total === 0 ? '<p style="color:var(--muted); text-align:center;">Нет активных задач.</p>' : '';
    
    requests.forEach(r => {
        let btnClass = 'btn-sm', btnText = 'Взять в работу', disabled = '';
        
        if (r.status === 'work') { 
            btnClass = 'btn-sm work'; 
            btnText = 'Завершить'; 
        } else if (r.status === 'done') { 
            btnClass = 'btn-sm done'; 
            btnText = '<i class="fa-solid fa-check"></i> Внедрено'; 
            disabled = 'disabled'; 
        }

        list.innerHTML += `
            <li class="item">
                <div>
                    <strong>${r.name}</strong>
                    <p style="color:var(--muted); font-size:13px; margin-top:4px;">Запрос от: ${r.company}</p>
                </div>
                <button class="${btnClass}" onclick="changeStatus(${r.id})" ${disabled}>${btnText}</button>
            </li>
        `;
    });
}

// ================= 9. МОДАЛЬНЫЕ ОКНА (ДЕТАЛИ) =================
function openModal(title, htmlContent) {
    document.getElementById('modal-title').innerText = title;
    document.getElementById('modal-body').innerHTML = htmlContent;
    document.getElementById('modal-overlay').classList.add('active');
}

function closeModal() {
    document.getElementById('modal-overlay').classList.remove('active');
}

// Данные для всплывающего окна ЗАВОДА
function openPlant(name) {
    let html = '';
    if (name === 'БелАЗ') {
        html = `
            <div class="modal-row"><span class="modal-label">Специальность:</span> <span class="modal-value">Оператор ЧПУ</span></div>
            <div class="modal-row"><span class="modal-label">Требуется человек:</span> <span class="modal-value text-red">15</span></div>
            <div class="modal-row"><span class="modal-label">Средняя зарплата:</span> <span class="modal-value">2 500 BYN</span></div>
            <div class="modal-row"><span class="modal-label">Контактное лицо:</span> <span class="modal-value">Иванов И.И. (HR)</span></div>
            <div class="modal-row"><span class="modal-label">Статус:</span> <span class="status red-text-bg">Ищем колледж</span></div>
        `;
    } else if (name === 'МТЗ') {
        html = `
            <div class="modal-row"><span class="modal-label">Специальность:</span> <span class="modal-value">Наладчик станков</span></div>
            <div class="modal-row"><span class="modal-label">Требуется человек:</span> <span class="modal-value text-red">8</span></div>
            <div class="modal-row"><span class="modal-label">Средняя зарплата:</span> <span class="modal-value">2 100 BYN</span></div>
            <div class="modal-row"><span class="modal-label">Контактное лицо:</span> <span class="modal-value">Петрова А.С. (HR)</span></div>
            <div class="modal-row"><span class="modal-label">Статус:</span> <span class="status red-text-bg">Ищем колледж</span></div>
        `;
    } else {
        html = `
            <div class="modal-row"><span class="modal-label">Специальность:</span> <span class="modal-value">Микроэлектроника</span></div>
            <div class="modal-row"><span class="modal-label">Требуется человек:</span> <span class="modal-value text-green">0</span></div>
            <div class="modal-row"><span class="modal-label">Контактное лицо:</span> <span class="modal-value">Сидоров В.В. (HR)</span></div>
            <div class="modal-row"><span class="modal-label">Статус:</span> <span class="status green-text-bg">Все закрыто</span></div>
        `;
    }
    openModal('Детали: ОАО "' + name + '"', html);
}

// Данные для всплывающего окна КОЛЛЕДЖА
function openCollege(name) {
    let html = '';
    if (name === 'Минский') {
        html = `
            <div class="modal-row"><span class="modal-label">Специальности:</span> <span class="modal-value">Python, AutoCAD</span></div>
            <div class="modal-row"><span class="modal-label">Кол-во студентов:</span> <span class="modal-value">850</span></div>
            <div class="modal-row"><span class="modal-label">Внедрено модулей:</span> <span class="modal-value text-green">12</span></div>
            <div class="modal-row"><span class="modal-label">Директор:</span> <span class="modal-value">Козлов А.А.</span></div>
            <div class="modal-row"><span class="modal-label">Рейтинг:</span> <span class="modal-value">4.8 / 5.0</span></div>
        `;
    } else if (name === 'Брестский') {
        html = `
            <div class="modal-row"><span class="modal-label">Специальности:</span> <span class="modal-value">Сварка, Токарное дело</span></div>
            <div class="modal-row"><span class="modal-label">Кол-во студентов:</span> <span class="modal-value">420</span></div>
            <div class="modal-row"><span class="modal-label">Внедрено модулей:</span> <span class="modal-value text-orange">4</span></div>
            <div class="modal-row"><span class="modal-label">Директор:</span> <span class="modal-value">Смирнов О.П.</span></div>
            <div class="modal-row"><span class="modal-label">Рейтинг:</span> <span class="modal-value">3.9 / 5.0</span></div>
        `;
    } else {
        html = `
            <div class="modal-row"><span class="modal-label">Специальности:</span> <span class="modal-value">Механика, Программирование</span></div>
            <div class="modal-row"><span class="modal-label">Кол-во студентов:</span> <span class="modal-value">610</span></div>
            <div class="modal-row"><span class="modal-label">Внедрено модулей:</span> <span class="modal-value text-green">8</span></div>
            <div class="modal-row"><span class="modal-label">Директор:</span> <span class="modal-value">Ковалев Д.С.</span></div>
            <div class="modal-row"><span class="modal-label">Рейтинг:</span> <span class="modal-value">4.2 / 5.0</span></div>
        `;
    }
    openModal('Детали: ' + name + ' колледж', html);
}

// ================= 10. УТИЛИТЫ (СОХРАНЕНИЕ, УВЕДОМЛЕНИЯ, СБРОС) =================
function saveData() { 
    localStorage.setItem('sb_requests', JSON.stringify(requests)); 
}

function resetDemo() {
    localStorage.clear();
    showToast('Данные успешно сброшены!');
    setTimeout(() => window.location.reload(), 1000);
}

function showToast(msg) {
    const t = document.getElementById('toast');
    document.getElementById('toast-text').innerText = msg;
    t.classList.add('show');
    setTimeout(() => t.classList.remove('show'), 3000);
}

function downloadReport() {
    showToast('Формирование PDF файла...');
    setTimeout(() => showToast('Отчет успешно скачан!'), 1000);
}

// ================= 11. ЗАПУСК ПРИ ЗАГРУЗКЕ СТРАНИЦЫ =================
window.addEventListener('DOMContentLoaded', () => {
    // Восстанавливаем тему, если она была темной
    if(localStorage.getItem('sb_theme') === 'dark') {
        toggleTheme();
    }
    // Отрисовываем интерфейс
    updateUI();
    analyzeSkill();
});