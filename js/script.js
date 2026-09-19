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