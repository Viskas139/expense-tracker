// Посилання на використаний API ендпоінт: https://jsonplaceholder.typicode.com/comments?postId=2
const API_URL = 'https://jsonplaceholder.typicode.com/comments?postId=2';

// 1. Компонент для відображення картки операції (Варіант 17)
const ExpenseRow = {
    props: ['amount', 'type', 'category'],
    template: `
        <article class="transaction-card" :class="type === 'дохід' ? 'income' : 'expense'">
            <h3 class="card-title">{{ amount }} грн ({{ type }}) — {{ category || 'Загальні' }}</h3>
        </article>
    `
};

// КРОК 2: Функції збереження та зчитування з localStorage
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

// КРОК 5 & 6: Константи схеми та відкриття IndexedDB (Варіант 17)
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

// КРОК 7: CRUD-функції для роботи з IndexedDB

// Створення або оновлення запису 
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

// КРОК 8: Функція одноразової міграції даних з localStorage в IndexedDB
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
            // Реактивні поля форми
            newAmount: '',
            newType: 'дохід',
            newCategory: '',
            // Стан завантаження та помилок
            isLoading: false,
            errorMessage: ''
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
        }
    },

    methods: {
    // Метод для оновлення масиву транзакцій із бази IndexedDB
    async refreshList() {
        try {
            this.transactions = await getAllItems();
            // Зберігаємо резервну копію в localStorage (Крок 3)
            saveToLocalStorage(this.transactions);
        } catch (err) {
            console.error('Помилка отримання даних із IndexedDB:', err);
        }
    },

    // Додавання транзакції в IndexedDB (Крок 9)
    async addTransaction() {
        if (!this.newAmount) return;

        const newTx = {
            amount: Number(this.newAmount),
            type: this.newType,
            category: this.newCategory.trim() || 'Загальні',
            date: new Date().toISOString()
        };

        await addItem(newTx); // Запис у IndexedDB
        this.newAmount = '';
        this.newCategory = '';
        await this.refreshList(); // Перечитування даних з IndexedDB
    },

    // Видалення транзакції з IndexedDB (Крок 9)
    async removeTransaction(id) {
        await deleteItem(id); // Видалення з IndexedDB
        await this.refreshList(); // Перечитування даних з IndexedDB
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
        }
    }, 

    // КРОК 8, 9 & 11: Ініціалізація, міграція та завантаження з обробкою помилки
    async mounted() {
        try {
            throw new Error("IndexedDB unavailable");
            await migrateFromLocalStorage();
            await this.refreshList();
        } catch (err) {
            this.errorMessage = 'IndexedDB недоступна у вашому браузері.';
            console.error(err);
        }
    }
}); 

app.mount('#app');