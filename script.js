let expenses = [];
let monthlyIncome = 0;

document.addEventListener('DOMContentLoaded', function() {
    const dateInput = document.getElementById('expense-date');
    const today = new Date().toISOString().split('T')[0];
    dateInput.value = today;

    loadExpenses();

    const savedIncome = localStorage.getItem('monthlyIncome');
    if (savedIncome) {
        monthlyIncome = parseFloat(savedIncome);
        document.getElementById('monthly-income').value = monthlyIncome;
    }

    const form = document.getElementById('expense-form');
    form.addEventListener('submit', handleFormSubmit);

    const saveIncomeBtn = document.getElementById('save-income-btn');
    saveIncomeBtn.addEventListener('click', saveIncome);

    const incomeInput = document.getElementById('monthly-income');
    incomeInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            saveIncome();
        }
    });

    renderExpenses();
    updateSummary();
});

function handleFormSubmit(e) {
    e.preventDefault();

    const title = document.getElementById('expense-title').value.trim();
    const amount = parseFloat(document.getElementById('expense-amount').value);
    const category = document.getElementById('expense-category').value;
    const date = document.getElementById('expense-date').value;

    if (!title || !amount || !category || !date) {
        showToast('Please fill in all fields', 'error');
        return;
    }

    if (amount <= 0) {
        showToast('Amount must be greater than 0', 'error');
        return;
    }

    const newExpense = {
        id: Date.now(),
        title: title,
        amount: amount,
        category: category,
        date: date
    };

    expenses.push(newExpense);

    saveExpenses();
    renderExpenses();
    updateSummary();
    showToast('Expense added successfully!', 'success');

    document.getElementById('expense-form').reset();
    document.getElementById('expense-date').value = new Date().toISOString().split('T')[0];
}

function saveIncome() {
    const incomeInput = document.getElementById('monthly-income');
    const income = parseFloat(incomeInput.value);
    
    if (income && income > 0) {
        monthlyIncome = income;
        localStorage.setItem('monthlyIncome', monthlyIncome);
        updateSummary();
        showToast('Income saved successfully!', 'success');
    } else {
        showToast('Please enter a valid income amount', 'error');
    }
}

function saveExpenses() {
    localStorage.setItem('expenses', JSON.stringify(expenses));
}

function loadExpenses() {
    const savedExpenses = localStorage.getItem('expenses');
    if (savedExpenses) {
        expenses = JSON.parse(savedExpenses);
    }
}

function deleteExpense(id) {
    if (confirm('Are you sure you want to delete this expense?')) {
        expenses = expenses.filter(expense => expense.id !== id);
        saveExpenses();
        renderExpenses();
        updateSummary();
        showToast('Expense deleted', 'success');
    }
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

function getCategoryLabel(category) {
    const labels = {
        'food': 'Food',
        'transport': 'Transport',
        'shopping': 'Shopping',
        'bills': 'Bills',
        'other': 'Other'
    };
    return labels[category] || category;
}

function getCategoryEmoji(category) {
    const emojis = {
        'food': '🍔',
        'transport': '🚗',
        'shopping': '🛍️',
        'bills': '💳',
        'other': '📦'
    };
    return emojis[category] || '📦';
}

function formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(amount);
}

function animateValue(element, start, end, duration) {
    const startTime = performance.now();
    const isCurrency = element.textContent.includes('$');
    
    function update(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        const easeOutCubic = 1 - Math.pow(1 - progress, 3);
        const current = start + (end - start) * easeOutCubic;
        
        if (isCurrency) {
            element.textContent = formatCurrency(current);
        } else if (element.id === 'percentage-used') {
            element.textContent = `${current.toFixed(1)}%`;
        } else {
            element.textContent = formatCurrency(current);
        }
        
        if (progress < 1) {
            requestAnimationFrame(update);
        }
    }
    
    requestAnimationFrame(update);
}

function updateSummary() {
    const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);
    
    const totalExpensesEl = document.getElementById('total-expenses');
    const displayIncomeEl = document.getElementById('display-income');
    const remainingBudgetEl = document.getElementById('remaining-budget');
    const percentageUsedEl = document.getElementById('percentage-used');
    
    const prevTotal = parseFloat(totalExpensesEl.textContent.replace(/[^0-9.-]+/g, '')) || 0;
    const prevIncome = parseFloat(displayIncomeEl.textContent.replace(/[^0-9.-]+/g, '')) || 0;
    const prevRemaining = parseFloat(remainingBudgetEl.textContent.replace(/[^0-9.-]+/g, '')) || 0;
    const prevPercentage = parseFloat(percentageUsedEl.textContent) || 0;
    
    animateValue(totalExpensesEl, prevTotal, totalExpenses, 600);
    animateValue(displayIncomeEl, prevIncome, monthlyIncome, 600);
    
    const remaining = monthlyIncome - totalExpenses;
    animateValue(remainingBudgetEl, prevRemaining, remaining, 600);
    
    if (remaining < 0) {
        remainingBudgetEl.style.color = '#f87171';
    } else if (remaining < monthlyIncome * 0.2) {
        remainingBudgetEl.style.color = '#fbbf24';
    } else {
        remainingBudgetEl.style.color = '#34d399';
    }
    
    let percentage = 0;
    if (monthlyIncome > 0) {
        percentage = (totalExpenses / monthlyIncome) * 100;
    }
    
    animateValue(percentageUsedEl, prevPercentage, percentage, 600);
    
    if (percentage >= 100) {
        percentageUsedEl.style.color = '#f87171';
    } else if (percentage >= 80) {
        percentageUsedEl.style.color = '#fbbf24';
    } else {
        percentageUsedEl.style.color = '#34d399';
    }
    
    updateProgressBar(percentage);
}

function updateProgressBar(percentage) {
    const progressBar = document.querySelector('.progress-bar');
    if (progressBar) {
        const clampedPercentage = Math.min(Math.max(percentage, 0), 100);
        progressBar.style.width = `${clampedPercentage}%`;
        
        if (clampedPercentage >= 100) {
            progressBar.style.background = 'linear-gradient(90deg, #ef4444, #f87171)';
        } else if (clampedPercentage >= 80) {
            progressBar.style.background = 'linear-gradient(90deg, #f59e0b, #fbbf24)';
        } else {
            progressBar.style.background = 'linear-gradient(90deg, #6366f1, #818cf8)';
        }
    }
}

function renderExpenses() {
    const expensesList = document.getElementById('expenses-list');

    if (expenses.length === 0) {
        expensesList.innerHTML = '<p class="empty-state">No expenses yet. Add your first expense to get started! 🚀</p>';
        return;
    }

    const sortedExpenses = [...expenses].sort((a, b) => new Date(b.date) - new Date(a.date));

    expensesList.innerHTML = sortedExpenses.map(expense => {
        return `
            <div class="expense-item">
                <div class="expense-item-content">
                    <div class="expense-title">${expense.title}</div>
                    <div class="expense-details">
                        <span class="category-badge">
                            <span>${getCategoryEmoji(expense.category)}</span>
                            <span>${getCategoryLabel(expense.category)}</span>
                        </span>
                        <span>•</span>
                        <span>${formatDate(expense.date)}</span>
                    </div>
                </div>
                <div class="expense-amount">${formatCurrency(expense.amount)}</div>
                <div class="expense-actions">
                    <button class="btn-delete" onclick="deleteExpense(${expense.id})">Delete</button>
                </div>
            </div>
        `;
    }).join('');
}

function showToast(message, type = 'success') {
    const existingToast = document.querySelector('.toast');
    if (existingToast) {
        existingToast.remove();
    }

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
        <span>${type === 'success' ? '✓' : '✕'}</span>
        <span>${message}</span>
    `;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.classList.add('show');
    }, 10);
    
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => {
            toast.remove();
        }, 300);
    }, 3000);
}
