// Запит до API для отримання даних
const API_URL = 'https://jsonplaceholder.typicode.com/comments?postId=2';

// Крок 4: Компонент ExpenseRow за Варіантом 17
const ExpenseRow = {
    name: 'ExpenseRow',
    props: {
        amount: { type: Number, required: true },
        type: { type: String, required: true },
        category: { type: String, default: 'Загальні' }
    },
    template: `
        <div class="transaction-card" :class="type === 'дохід' ? 'income' : 'expense'">
            <div class="transaction-info">
                <span class="transaction-amount">{{ amount }} грн ({{ type }})</span>
                <span class="transaction-category">{{ category }}</span>
            </div>
        </div>
    `
};

// Ініціалізація екземпляра Vue 3
const app = Vue.createApp({
    components: {
        ExpenseRow
    },
    data() {
        return {
            // Крок 3: Реактивний стан масиву транзакцій
            transactions: [
                { amount: 2000, type: 'дохід' },
                { amount: 150, type: 'витрата' },
                { amount: 350, type: 'витрата' },
                { amount: 500, type: 'дохід' },
                { amount: 120, type: 'витрата' }
            ]
        };
    },
    // Крок 6: Вичисляємий баланс через computed
    computed: {
        totalBalance() {
            return this.transactions.reduce((sum, item) => {
                const val = Number(item.amount) || 0;
                return item.type === 'дохід' ? sum + val : sum - val;
            }, 0);
        }
    }
});

// Монтування Vue додатку
const vm = app.mount('#app');


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

const amountInput = document.querySelector('#amount');

if (amountInput) {
    amountInput.addEventListener('input', () => {
        const val = Number(amountInput.value);

        if (amountInput.value !== '' && val <= 0) {
            amountInput.setCustomValidity('Сума має бути більшою за нуль');
        } else {
            amountInput.setCustomValidity('');
        }
    });
}
// Функція асинхронного завантаження даних з API
async function loadData() {
    const loadingStatus = document.querySelector('#loading-status');
    const errorMessage = document.querySelector('#error-message');

    if (loadingStatus) loadingStatus.style.display = 'block';
    if (errorMessage) errorMessage.style.display = 'none';

    try {
        const response = await fetch(API_URL);

        if (!response.ok) {
            throw new Error(`Сервер відповів кодом ${response.status}`);
        }

        const data = await response.json();

        const apiTransactions = data.map((item, index) => ({
            amount: (item.id * 50) + 100,
            type: index % 2 === 0 ? 'витрата' : 'дохід'
        }));

        vm.transactions = apiTransactions;

    } catch (error) {
        if (errorMessage) {
            errorMessage.textContent = 'Записи тимчасово недоступні. Перевірте мережеве зєднання.';
            errorMessage.style.display = 'block';
        }
        console.error('Деталі помилки завантаження:', error);
    } finally {
        if (loadingStatus) loadingStatus.style.display = 'none';
    }
}