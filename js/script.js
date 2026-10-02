let transactions = [
    { amount: 2000, type: 'дохід' },
    { amount: 150, type: 'витрата' },
    { amount: 350, type: 'витрата' },
    { amount: 500, type: 'дохід' },
    { amount: 120, type: 'витрата' }
];

// Функція обчислює баланс та суми доходів і витрат
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

    console.log(`Загальний баланс: ${totalBalance} грн`);
    console.log(`Загальні доходи: ${totalIncome} грн`);
    console.log(`Загальні витрати: ${totalExpense} грн`);

    if (totalBalance > 0) {
        console.log('Статус бюджету: Баланс додатний (все гаразд з бюджетом)');
    } else if (totalBalance === 0) {
        console.log('Статус бюджету: Баланс нульовий');
    } else {
        console.log('Статус бюджету: Баланс від’ємний (витрати перевищують доходи)');
    }

    return { totalBalance, totalIncome, totalExpense };
}

const summary = calculateBalance(transactions);

// Стрілкова функція для обчислення відсотка
const toPercent = (part, total) => Math.round((part / total) * 100);

if (summary.totalIncome > 0) {
    const expensePercentage = toPercent(summary.totalExpense, summary.totalIncome);
    console.log(`Витрати складають ${expensePercentage}% від загального доходу`);
}

const staticCards = document.querySelectorAll('.transaction-card');
staticCards.forEach(card => card.remove());

const listContainer = document.querySelector('#transactions-list .cards');

// Динамічно створює та виводить картки транзакцій у DOM
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
        title.textContent = `${item.amount} грн (${item.type}) — ${item.category || 'Загальні'}`;

        card.append(title);

        if (listContainer) {
            listContainer.append(card);
        }
    });
}

// Оновлює текстовий вміст елемента підсумкового балансу на сторінці
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

renderTransactions(transactions);
updateSummaryUI(transactions);

const transactionForm = document.querySelector('#add-transaction-form');

if (transactionForm) {
    transactionForm.addEventListener('submit', (event) => {
        event.preventDefault();

        const amountInput = document.querySelector('#amount');
        const typeInput = document.querySelector('#type');
        const categoryInput = document.querySelector('#category');

        const amount = Number(amountInput.value);
        const type = typeInput.value;
        const category = categoryInput.value.trim();

        const newTransaction = { 
            amount, 
            type, 
            category: category || 'Загальні' 
        };

        transactions.push(newTransaction);

        renderTransactions(transactions);
        updateSummaryUI(transactions);

        transactionForm.reset();
    });

const amountInput = document.querySelector('#amount');

if (amountInput) {
    // Додає обробник події для перевірки валідності введеної суми
    amountInput.addEventListener('input', () => {
        const val = Number(amountInput.value);

        if (amountInput.value !== '' && val <= 0) {
            amountInput.setCustomValidity('Сума має бути більшою за нуль');
        } else {
            amountInput.setCustomValidity('');
        }
    });
}
}

// Посилання на використаний API ендпоінт: https://jsonplaceholder.typicode.com/comments?postId=2
const API_URL = 'https://jsonplaceholder.typicode.com/comments?postId=2';

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

        const apiTransactions = data.slice(0, 5).map((item, index) => ({
            amount: (item.id * 50) + 100,
            type: index % 2 === 0 ? 'витрата' : 'дохід',
            category: item.name.substring(0, 20), 
            description: item.body.substring(0, 50) 
        }));

        transactions = apiTransactions;
        renderTransactions(transactions);
        updateSummaryUI(transactions);

    } catch (error) {
        if (errorMessage) {
            errorMessage.textContent = 'Записи тимчасово недоступні. Перевірте мережеве з\'єднання.';
            errorMessage.style.display = 'block';
        }
        console.error('Деталі помилки завантаження:', error);
    } finally {
        if (loadingStatus) loadingStatus.style.display = 'none';
    }
}

const reloadBtn = document.querySelector('#reload-btn');
if (reloadBtn) {
    reloadBtn.addEventListener('click', loadData);
}

loadData();