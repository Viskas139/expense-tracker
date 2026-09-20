console.log('app.js підключено успішно!');

const transactions = [
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
        title.textContent = `${item.amount} грн (${item.type})`;

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