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
        // Обробник додавання нової операції через форму
        addTransaction() {
            if (!this.newAmount) return;

            this.transactions.push({
                id: Date.now(), // Унікальний ID
                amount: Number(this.newAmount),
                type: this.newType,
                category: this.newCategory.trim() || 'Загальні'
            });

            // Очищення полів форми
            this.newAmount = '';
            this.newCategory = '';
        },

// =========================================================================
// Крок 7: Закоментований застарілий ручний DOM-код для уникнення помилок
// =========================================================================

/*
function calculateBalance(items) {
    let totalBalance = 0;
    let totalIncome = 0;
    let totalExpense = 0;

    for (const item of items) {
        if (item.type === 'дохід') {
            totalBalance += item.amount;
            totalIncome += item.amount;
        } else if (item.type === 'витрата') {
            totalBalance -= item.amount;
            totalExpense += item.amount;
        }
    }

    return { totalBalance, totalIncome, totalExpense };
}

/*
const summary = calculateBalance(transactions);
const toPercent = (part, total) => Math.round((part / total) * 100);

if (summary.totalIncome > 0) {
    const expensePercentage = toPercent(summary.totalExpense, summary.totalIncome);
    console.log(`Витрати складають ${expensePercentage}% від загального доходу`);
}
*/

/*
const listContainer = document.querySelector('#transactions-list .cards');

function renderTransactions(items) {
    if (listContainer) {
        listContainer.innerHTML = '';
    }

    items.forEach(item => {
        const card = document.createElement('article');
        card.classList.add('transaction-card');
        card.dataset.amount = item.amount;

        if (item.type === 'дохід') {
            card.classList.add('income');
        } else {
            card.classList.add('expense');
        }

        const title = document.createElement('h3');
        title.classList.add('card-title');
        title.textContent = `${item.amount} грн (${item.type})`;

        card.append(title);

        if (listContainer) {
            listContainer.append(card);
        }
    });
}

function updateSummaryUI(items) {
    let totalBalance = 0;

    for (const item of items) {
        if (item.type === 'дохід') {
            totalBalance += item.amount;
        } else if (item.type === 'витрата') {
            totalBalance -= item.amount;
        }
    }

    const balanceElement = document.querySelector('.balance-amount');
    if (balanceElement) {
        balanceElement.textContent = `${totalBalance >= 0 ? '+' : ''}${totalBalance} грн`;
    }
}
*/

/*
const transactionForm = document.querySelector('#add-transaction-form');

if (transactionForm) {
    transactionForm.addEventListener('submit', (event) => {
        event.preventDefault();

        const amountInput = document.querySelector('#amount');
        const typeInput = document.querySelector('#type');

        const amount = Number(amountInput.value);
        const type = typeInput.value;

        const newTransaction = { amount, type };
        transactions.push(newTransaction);

        renderTransactions(transactions);
        updateSummaryUI(transactions);

        transactionForm.reset();
    });
}
*/

// Завантаження даних з API (із збереженням id з API!)
        async loadApiData() {
            this.isLoading = true;
            this.errorMessage = '';

            try {
                const response = await fetch(API_URL);
                if (!response.ok) throw new Error(`Код помилки: ${response.status}`);

                const data = await response.json();

                // Беремо id безпосередньо з API об'єктів!
                this.transactions = data.slice(0, 5).map((item) => ({
                    id: item.id, // Тепер id точно є і він унікальний з API!
                    amount: item.body.length * 10,
                    type: item.email.endsWith('.com') ? 'дохід' : 'витрата',
                    category: item.name.substring(0, 15)
                }));
            } catch (err) {
                this.errorMessage = 'Записи тимчасово недоступні. Перевірте мережеве з\'єднання.';
                console.error('Деталі помилки завантаження:', err);
            } finally {
                this.isLoading = false;
            }
        }
    }
});

app.mount('#app');