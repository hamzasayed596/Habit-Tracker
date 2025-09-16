document.addEventListener('DOMContentLoaded', function() {
    let habits = JSON.parse(localStorage.getItem('habits')) || [];
    const habitForm = document.getElementById('habit-form');
    const habitsList = document.getElementById('habits-list');
    const todayHabits = document.getElementById('today-habits');
    const calendar = document.getElementById('calendar');
    const todayDateEl = document.getElementById('today-date');
    const today = new Date();
    initApp();
    function initApp() {
        todayDateEl.textContent = today.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
        setupEventListeners();
        renderHabits();
    }
    function setupEventListeners() {
        const tabs = document.querySelectorAll('.tab');
        const tabContents = document.querySelectorAll('.tab-content');
        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const tabId = tab.getAttribute('data-tab');
                tabs.forEach(t => t.classList.remove('active'));
                tabContents.forEach(tc => tc.classList.remove('active'));
                tab.classList.add('active');
                document.getElementById(`${tabId}-tab`).classList.add('active');
                if (tabId === 'progress' || tabId === 'analytics') {
                    updateCharts();
                }
            });
        });
        habitForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const name = document.getElementById('habit-name').value;
            const category = document.getElementById('habit-category').value;
            const frequency = document.getElementById('habit-frequency').value;
            const newHabit = {
                id: Date.now(),
                name,
                category,
                frequency,
                createdAt: new Date().toISOString(),
                completedDates: []
            };
            habits.push(newHabit);
            saveHabits();
            renderHabits();
            habitForm.reset();
        });
    }
    function saveHabits() {
        localStorage.setItem('habits', JSON.stringify(habits));
    }
    function renderHabits() {
        renderHabitsList();
        renderTodayHabits();
        renderCalendar();
    }
    function renderHabitsList() {
        habitsList.innerHTML = '';
        if (habits.length === 0) {
            habitsList.innerHTML = '<p class="no-habits">No habits yet. Add your first habit to get started!</p>';
            return;
        }
        habits.forEach(habit => {
            const habitEl = document.createElement('div');
            habitEl.className = 'habit-item';
            habitEl.innerHTML = `
                <div class="habit-info">
                    <strong>${habit.name}</strong>
                    <span>${habit.category} • ${habit.frequency}</span>
                </div>
                <div class="habit-actions">
                    <button class="btn btn-danger" onclick="deleteHabit(${habit.id})">Delete</button>
                </div>
            `;
            habitsList.appendChild(habitEl);
        });
    }
    function renderTodayHabits() {
        todayHabits.innerHTML = '';
        const todayStr = formatDate(today);
        if (habits.length === 0) {
            todayHabits.innerHTML = '<p class="no-habits">No habits to show today. Add habits to start tracking!</p>';
            return;
        }
        habits.forEach(habit => {
            const isCompleted = habit.completedDates.includes(todayStr);
            const habitEl = document.createElement('div');
            habitEl.className = 'habit-item';
            habitEl.innerHTML = `
                <div class="habit-info">
                    <strong>${habit.name}</strong>
                    <span>${habit.category}</span>
                </div>
                <div class="habit-actions">
                    <button class="btn ${isCompleted ? 'btn-danger' : 'btn-success'}" 
                            onclick="toggleHabit(${habit.id})">
                        ${isCompleted ? 'Undo' : 'Complete'}
                    </button>
                </div>
            `;
            todayHabits.appendChild(habitEl);
        });
    }
    function renderCalendar() {
        calendar.innerHTML = '';
        const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
        const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        const daysInMonth = lastDay.getDate();
        for (let i = 0; i < firstDay.getDay(); i++) {
            const emptyDay = document.createElement('div');
            emptyDay.className = 'calendar-day empty';
            calendar.appendChild(emptyDay);
        }
        for (let i = 1; i <= daysInMonth; i++) {
            const day = document.createElement('div');
            day.className = 'calendar-day';
            day.textContent = i.toString();
            const dateStr = formatDate(new Date(today.getFullYear(), today.getMonth(), i));
            let completedCount = 0;
            habits.forEach(habit => {
                if (habit.completedDates.includes(dateStr)) {
                    completedCount++;
                }
            });
            if (completedCount > 0) {
                day.classList.add('completed');
                day.title = `${completedCount} habit${completedCount > 1 ? 's' : ''} completed`;
            } else if (new Date(today.getFullYear(), today.getMonth(), i) < today &&
                new Date(today.getFullYear(), today.getMonth(), i).getDay() !== 0 &&
                new Date(today.getFullYear(), today.getMonth(), i).getDay() !== 6) {
                day.classList.add('missed');
            }
            calendar.appendChild(day);
        }
    }
    window.toggleHabit = function(habitId) {
        const habit = habits.find(h => h.id === habitId);
        if (!habit) return;
        const todayStr = formatDate(today);
        const index = habit.completedDates.indexOf(todayStr);
        if (index > -1) {
            habit.completedDates.splice(index, 1);
        }
        else {
            habit.completedDates.push(todayStr);
        }
        saveHabits();
        renderTodayHabits();
        renderCalendar();
    }
    window.deleteHabit = function(habitId) {
        if (confirm('Are you sure you want to delete this habit?')) {
            habits = habits.filter(h => h.id !== habitId);
            saveHabits();
            renderHabits();
        }
    }
    function formatDate(date) {
        return date.toISOString().split('T')[0];
    }
    function updateCharts() {
        updateCompletionChart();
        updateStreakChart();
        updateCategoryChart();
        updateTrendChart();
        updateStats();
    }
    function updateCompletionChart() {
        const ctx = document.getElementById('completion-chart').getContext('2d');
        const last7Days = [];
        for (let i = 6; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            last7Days.push(formatDate(date));
        }
        const completionData = last7Days.map(date => {
            const total = habits.length;
            if (total === 0) return 0;
            const completed = habits.filter(habit =>
                habit.completedDates.includes(date)
            ).length;
            return (completed / total) * 100;
        });
        if (window.completionChart) {
            window.completionChart.destroy();
        }
        window.completionChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: last7Days.map(d => new Date(d).toLocaleDateString('en-US', { weekday: 'short' })),
                datasets: [{
                    label: 'Completion Rate (%)',
                    data: completionData,
                    backgroundColor: 'rgba(67, 97, 238, 0.5)',
                    borderColor: 'rgba(67, 97, 238, 1)',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 100,
                        ticks: {
                            callback: function(value) {
                                return value + '%';
                            }
                        }
                    }
                },
                plugins: {
                    title: {
                        display: true,
                        text: 'Weekly Completion Rate',
                        color: '#e5e7eb',
                        font: {
                            size: 16
                        }
                    },
                    legend: {
                        labels: {
                            color: '#e5e7eb'
                        }
                    }
                }
            }
        });
    }
    function updateStreakChart() {
        const ctx = document.getElementById('streak-chart').getContext('2d');
        const habitNames = habits.map(h => h.name);
        const streaks = habits.map(habit => {
            const sortedDates = habit.completedDates.sort();
            if (sortedDates.length === 0) return 0;
            let streak = 1;
            const todayStr = formatDate(new Date());
            const yesterdayStr = formatDate(new Date(Date.now() - 86400000));
            if (sortedDates.includes(todayStr)) {
                streak = 1;
                for (let i = 1; i < 30; i++) {
                    const prevDate = formatDate(new Date(Date.now() - i * 86400000));
                    if (sortedDates.includes(prevDate)) {
                        streak++;
                    } else {
                        break;
                    }
                }
            }
            else if (sortedDates.includes(yesterdayStr)) {
                streak = 1;
                for (let i = 2; i < 30; i++) {
                    const prevDate = formatDate(new Date(Date.now() - i * 86400000));
                    if (sortedDates.includes(prevDate)) {
                        streak++;
                    } else {
                        break;
                    }
                }
            }
            return streak;
        });
        if (window.streakChart) {
            window.streakChart.destroy();
        }
        window.streakChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: habitNames,
                datasets: [{
                    label: 'Current Streak (days)',
                    data: streaks,
                    backgroundColor: 'rgba(76, 201, 240, 0.5)',
                    borderColor: 'rgba(76, 201, 240, 1)',
                    borderWidth: 1
                }]
            },
            options: {
                indexAxis: 'y',
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: 'Current Streaks',
                        color: '#e5e7eb',
                        font: {
                            size: 16
                        }
                    },
                    legend: {
                        labels: {
                            color: '#e5e7eb'
                        }
                    }
                },
                scales: {
                    x: {
                        ticks: {
                            color: '#e5e7eb'
                        }
                    },
                    y: {
                        ticks: {
                            color: '#e5e7eb'
                        }
                    }
                }
            }
        });
    }
    function updateCategoryChart() {
        const ctx = document.getElementById('category-chart').getContext('2d');
        const categories = ['health', 'productivity', 'learning', 'personal', 'other'];
        const categoryCounts = categories.map(cat =>
            habits.filter(h => h.category === cat).length
        );
        if (window.categoryChart) {
            window.categoryChart.destroy();
        }
        window.categoryChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: categories.map(cat => cat.charAt(0).toUpperCase() + cat.slice(1)),
                datasets: [{
                    data: categoryCounts,
                    backgroundColor: [
                        'rgba(67, 97, 238, 0.7)',
                        'rgba(58, 12, 163, 0.7)',
                        'rgba(114, 9, 183, 0.7)',
                        'rgba(76, 201, 240, 0.7)',
                        'rgba(247, 37, 133, 0.7)'
                    ],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: 'Habits by Category',
                        color: '#e5e7eb',
                        font: {
                            size: 16
                        }
                    },
                    legend: {
                        position: 'bottom',
                        labels: {
                            color: '#e5e7eb',
                            padding: 15
                        }
                    }
                }
            }
        });
    }
    function updateTrendChart() {
        const ctx = document.getElementById('trend-chart').getContext('2d');
        const last30Days = [];

        for (let i = 29; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            last30Days.push(formatDate(date));
        }
        const completionData = last30Days.map(date => {
            return habits.filter(habit =>
                habit.completedDates.includes(date)
            ).length;
        });
        if (window.trendChart) {
            window.trendChart.destroy();
        }
        window.trendChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: last30Days.map(d => new Date(d).getDate()),
                datasets: [{
                    label: 'Habits Completed',
                    data: completionData,
                    fill: true,
                    backgroundColor: 'rgba(247, 37, 133, 0.2)',
                    borderColor: 'rgba(247, 37, 133, 1)',
                    tension: 0.2,
                    pointBackgroundColor: 'rgba(247, 37, 133, 1)',
                    pointRadius: 3
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: '30-Day Trend',
                        color: '#e5e7eb',
                        font: {
                            size: 16
                        }
                    },
                    legend: {
                        labels: {
                            color: '#e5e7eb'
                        }
                    }
                },
                scales: {
                    x: {
                        ticks: {
                            color: '#e5e7eb'
                        }
                    },
                    y: {
                        ticks: {
                            color: '#e5e7eb'
                        }
                    }
                }
            }
        });
    }
    function updateStats() {
        let longestStreak = 0;
        habits.forEach(habit => {
            const sortedDates = habit.completedDates.sort();
            if (sortedDates.length > 0) {
                let streak = 1;
                for (let i = 1; i < sortedDates.length; i++) {
                    const prevDate = new Date(sortedDates[i-1]);
                    const currDate = new Date(sortedDates[i]);
                    const diffTime = Math.abs(currDate - prevDate);
                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                    if (diffDays === 1) {
                        streak++;
                    }
                    else {
                        if (streak > longestStreak) longestStreak = streak;
                        streak = 1;
                    }
                }
                if (streak > longestStreak) longestStreak = streak;
            }
        });
        document.getElementById('current-streak').textContent = `${longestStreak} days`;
        const totalHabits = habits.length;
        const completedHabits = habits.filter(habit => habit.completedDates.length > 0).length;
        const completionRate = totalHabits > 0 ? Math.round((completedHabits / totalHabits) * 100) : 0;
        document.getElementById('completion-rate').textContent = `${completionRate}%`;
        document.getElementById('total-habits').textContent = habits.length;
    }
    function calculateCompletionRate() {
        const totalHabits = habits.length;
        if (totalHabits === 0) return 0;
        const completedHabits = habits.filter(habit => habit.completedDates.length > 0).length;
        return (completedHabits / totalHabits) * 100;
    }
});