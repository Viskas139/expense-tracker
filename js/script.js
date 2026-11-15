// Посилання на використаний API ендпоінт: https://jsonplaceholder.typicode.com/comments?postId=2
const API_URL = 'https://jsonplaceholder.typicode.com/comments?postId=2';

// Палітра кольорів для секторів кругової діаграми (Лаба 12)
const CHART_COLORS = ['#2563eb', '#dc2626', '#16a34a', '#d97706', '#7c3aed', '#0891b2', '#db2777'];

// 1. Компонент для відображення картки операції (Варіант 17)
const ExpenseRow = {
    props: ['amount', 'type', 'category'],
    template: `
        <article class="transaction-card" :class="type === 'дохід' ? 'income' : 'expense'">
            <h3 class="card-title">{{ amount }} грн ({{ type }}) — {{ category || 'Загальні' }}</h3>
        </article>
    `
};

// КРОК 2 (Лаба 11): Функції збереження та зчитування з localStorage
function saveToLocalStorage(items) {
    try {
        localStorage.setItem('transactions_backup', JSON.stringify(items));
    } catch (e) {
        console.error('Помилка запису в localStorage:', e);
    }
}

function loadFromLocalStorage() {
    try {
        const raw = localStorage.getItem('transactions_backup');
        return raw ? JSON.parse(raw) : [];
    } catch (error) {
        console.error('Пошкоджені дані в localStorage:', error);
        return [];
    }
}

// КРОК 5 & 6 (Лаба 11): Константи схеми та відкриття IndexedDB (Варіант 17)
const DB_NAME = 'ExpenseTrackerDB';
const DB_VERSION = 1;
const STORE_NAME = 'transactions';

function openDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        // Створення сховища при першому запуску або підвищенні версії
        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
            }
        };

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

// КРОК 7 (Лаба 11): CRUD-функції для роботи з IndexedDB
async function addItem(item) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        tx.objectStore(STORE_NAME).put(item);
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
    });
}

// Отримання всіх записів із сховища
async function getAllItems() {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readonly');
        const request = tx.objectStore(STORE_NAME).getAll();
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

// Видалення запису за ідентифікатором id
async function deleteItem(id) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        tx.objectStore(STORE_NAME).delete(id);
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
    });
}

// КРОК 8 (Лаба 11): Одноразова міграція даних з localStorage в IndexedDB
async function migrateFromLocalStorage() {
    const isMigrated = localStorage.getItem('db_migrated');
    if (!isMigrated) {
        const localData = loadFromLocalStorage();
        if (localData && localData.length > 0) {
            for (const item of localData) {
                // Видаляємо старий id, щоб IndexedDB згенерувала унікальний ключ autoIncrement
                const { id, ...itemWithoutId } = item;
                await addItem(itemWithoutId);
            }
            console.log('Міграцію даних з localStorage в IndexedDB успішно виконано.');
        }
        // Встановлюємо прапорець, щоб міграція не виконувалася повторно
        localStorage.setItem('db_migrated', 'true');
    }
}

// 2. Створення додатка Vue 3
const app = Vue.createApp({
    components: {
        ExpenseRow
    },
    data() {
        return {
            // Початкові дані з унікальними id
            transactions: [
                { id: 1, amount: 2000, type: 'дохід', category: 'Зарплата' },
                { id: 2, amount: 150, type: 'витрата', category: 'Транспорт' },
                { id: 3, amount: 350, type: 'витрата', category: 'Продукти' },
                { id: 4, amount: 500, type: 'дохід', category: 'Фріланс' },
                { id: 5, amount: 120, type: 'витрата', category: 'Кафе' }
            ],
            
            newAmount: '',
            newType: 'дохід',
            newCategory: '',
            // Стан завантаження та помилок
            isLoading: false,
            errorMessage: '',

            // КРОК 5 & 7 (Лаба 12): Стан анімації кругової діаграми Canvas
            animationFrameId: null,
            animationProgress: 0,
            isChartAnimating: false
        };
    },

    computed: {
        // Динамічний перерахунок балансу
        totalBalance() {
            return this.transactions.reduce((sum, item) => {
                const val = Number(item.amount) || 0;
                return item.type === 'дохід' ? sum + val : sum - val;
            }, 0);
        },
        // Динамічний статус бюджету
        budgetStatus() {
            return this.totalBalance >= 0 ? 'Бюджет у нормі' : 'Перевищення витрат!';
        },
        budgetStatusClass() {
            return this.totalBalance >= 0 ? 'status-ok' : 'status-warning';
        },

        // КРОК 4 (Лаба 12): Агрегація витрат за категоріями з масиву transactions
        expenseCategories() {
            const expenses = this.transactions.filter(item => item.type === 'витрата');
            const totalExpense = expenses.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);

            if (totalExpense === 0) return [];

            const grouped = {};
            expenses.forEach(item => {
                const cat = (item.category || 'Загальні').trim();
                grouped[cat] = (grouped[cat] || 0) + (Number(item.amount) || 0);
            });

            return Object.entries(grouped).map(([category, amount], index) => ({
                category,
                amount,
                percent: Math.round((amount / totalExpense) * 100),
                color: CHART_COLORS[index % CHART_COLORS.length]
            }));
        }
    },

    // КРОК 6 (Лаба 12): Реакція діаграми на зміну даних користувача
    watch: {
        expenseCategories: {
            handler() {
                this.$nextTick(() => {
                    this.restartChartAnimation();
                });
            },
            deep: true
        }
    },

    methods: {
        async refreshList() {
            try {
                this.transactions = await getAllItems();
                saveToLocalStorage(this.transactions);
            } catch (err) {
                console.error('Помилка отримання даних із IndexedDB:', err);
            }
        },

        async addTransaction() {
            if (!this.newAmount) return;

            const newTx = {
                amount: Number(this.newAmount),
                type: this.newType,
                category: this.newCategory.trim() || 'Загальні',
                date: new Date().toISOString()
            };

            await addItem(newTx);
            this.newAmount = '';
            this.newCategory = '';
            await this.refreshList();
        },

        async removeTransaction(id) {
            await deleteItem(id);
            await this.refreshList();
        },

        // Завантаження з API та запис у IndexedDB
        async loadApiData() {
            this.isLoading = true;
            this.errorMessage = '';

            try {
                const response = await fetch(API_URL);
                if (!response.ok) throw new Error(`Помилка: ${response.status}`);

                const data = await response.json();
                const fetched = data.slice(0, 5).map((item) => ({
                    amount: item.body.length * 10,
                    type: item.email.endsWith('.com') ? 'дохід' : 'витрата',
                    category: item.name.substring(0, 15)
                }));

                for (const tx of fetched) {
                    await addItem(tx);
                }
                await this.refreshList();
            } catch (err) {
                this.errorMessage = 'Помилка завантаження даних API.';
                console.error(err);
            } finally {
                this.isLoading = false;
            }
        },

        // === КРОК 3, 5, 7, 8 (Лаба 12): Малювання та анімація кругової діаграми на Canvas ===
        drawPieChart(progress) {
            const canvas = this.$refs.expensesCanvas;
            if (!canvas) return;

            // Отримання 2D-контексту полотна (Крок 3)
            const ctx = canvas.getContext('2d');
            const categories = this.expenseCategories;
            const total = categories.reduce((sum, item) => sum + item.amount, 0);

            // Очищення кадру перед перемальовуванням (Крок 5)
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            if (total === 0) return;

            const centerX = canvas.width / 2;
            const centerY = canvas.height / 2;
            const radius = Math.min(centerX, centerY) - 10;

            // Початковий кут (-90 градусів, тобто зверху по центру)
            let startAngle = -Math.PI / 2;
            const maxAngle = Math.PI * 2 * progress;
            let drawnAngle = 0;

            categories.forEach((item) => {
                const sliceAngle = (item.amount / total) * Math.PI * 2;
                const currentSlice = Math.min(sliceAngle, Math.max(0, maxAngle - drawnAngle));

                if (currentSlice > 0) {
                    ctx.save();
                    ctx.beginPath();
                    ctx.moveTo(centerX, centerY);
                    // Малювання сектора через ctx.arc() (Варіант 17)
                    ctx.arc(centerX, centerY, radius, startAngle, startAngle + currentSlice);
                    ctx.closePath();

                    ctx.fillStyle = item.color;
                    ctx.fill();

                    // Біла рамка між секторами для чіткості
                    ctx.lineWidth = 2;
                    ctx.strokeStyle = '#ffffff';
                    ctx.stroke();
                    ctx.restore();
                }

                startAngle += sliceAngle;
                drawnAngle += sliceAngle;
            });

            // Внутрішнє біле коло (ефект кільцевої діаграми / Donut)
            ctx.save();
            ctx.beginPath();
            ctx.arc(centerX, centerY, radius * 0.5, 0, Math.PI * 2);
            ctx.fillStyle = '#ffffff';
            ctx.fill();

            // Текст загальної суми витрат у центрі діаграми
            ctx.fillStyle = '#0f172a';
            ctx.font = 'bold 16px Inter, sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(`${total} грн`, centerX, centerY);
            ctx.restore();
        },

        // Цикл анімації через requestAnimationFrame (Крок 5)
        animateChartLoop() {
            if (!this.isChartAnimating) return;

            this.animationProgress += 0.03; // Плавний крок розгортання
            if (this.animationProgress >= 1) {
                this.animationProgress = 1;
                this.drawPieChart(1);
                this.isChartAnimating = false;
                return;
            }

            this.drawPieChart(this.animationProgress);
            this.animationFrameId = requestAnimationFrame(this.animateChartLoop);
        },

        // Перезапуск анімації з нуля (Крок 7)
        restartChartAnimation() {
            this.stopChartAnimation();
            this.animationProgress = 0;
            this.isChartAnimating = true;
            this.animateChartLoop();
        },

        // Пауза або продовження анімації (Крок 7)
        toggleChartAnimation() {
            if (this.isChartAnimating) {
                this.stopChartAnimation();
            } else {
                if (this.animationProgress >= 1) {
                    this.animationProgress = 0;
                }
                this.isChartAnimating = true;
                this.animateChartLoop();
            }
        },

        // Зупинка циклу requestAnimationFrame (Крок 8)
        stopChartAnimation() {
            this.isChartAnimating = false;
            if (this.animationFrameId) {
                cancelAnimationFrame(this.animationFrameId);
                this.animationFrameId = null;
            }
        }
    },

    async mounted() {
        try {
            await migrateFromLocalStorage();
            await this.refreshList();
            this.$nextTick(() => {
                this.restartChartAnimation();
            });
        } catch (err) {
            this.errorMessage = 'IndexedDB недоступна у вашому браузері.';
            console.error(err);
        }
    },

    // КРОК 8 (Лаба 12): Коректне завершення анімації при розмонтуванні компонента
    beforeUnmount() {
        this.stopChartAnimation();
    }
});

app.mount('#app');