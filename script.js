// Data State
let transactions = JSON.parse(localStorage.getItem('transactions')) || [];
let debts = JSON.parse(localStorage.getItem('debts')) || [];
let currentLang = localStorage.getItem('lang') || 'my';
let warningThreshold = parseInt(localStorage.getItem('warningAmount')) || 0;
let warningEnabled = localStorage.getItem('warningEnabled') === 'true';

// Dictionary for Translations
const dict = {
    en: {
        totalBalance: "Total Balance", income: "Income", expense: "Expense",
        radioIncome: "Income (+)", radioExpense: "Expense (-)",
        addBtn: "Add Record", txList: "Transaction List", emptyList: "No records yet.",
        totalDebt: "Total Debt", radioBorrow: "Borrowed", radioRepay: "Repaid",
        addDebtBtn: "Add Debt Record", insufficient: "Cannot spend more than current balance!",
        warningMsg: "Warning: Balance is low!"
    },
    my: {
        totalBalance: "Total Balance (လက်ကျန်ငွေ)", income: "ဝင်ငွေ", expense: "ထွက်ငွေ",
        radioIncome: "ဝင်ငွေ (+)", radioExpense: "ထွက်ငွေ (-)",
        addBtn: "စာရင်းသွင်းမည်", txList: "Transaction List / စာရင်းများ", emptyList: "စာရင်းမရှိသေးပါ",
        totalDebt: "စုစုပေါင်း ပေးရန်အကြွေး", radioBorrow: "ယူထားသောငွေ", radioRepay: "ပြန်ဆပ်ငွေ",
        addDebtBtn: "အကြွေးစာရင်းသွင်းမည်", insufficient: "ရှိတာထက်ပိုသုံး၍မရပါ!",
        warningMsg: "သတိပေးချက်- လက်ကျန်ငွေနည်းနေပါပြီ!"
    },
    ja: {
        totalBalance: "残高", income: "収入", expense: "支出",
        radioIncome: "収入 (+)", radioExpense: "支出 (-)",
        addBtn: "追加する", txList: "取引履歴", emptyList: "記録がありません",
        totalDebt: "借入総額", radioBorrow: "借入", radioRepay: "返済",
        addDebtBtn: "借入記録を追加", insufficient: "残高不足です！",
        warningMsg: "警告: 残高が少なくなっています！"
    }
};

// Elements
const balanceAmountEl = document.getElementById('balanceAmount');
const totalIncomeEl = document.getElementById('totalIncome');
const totalExpenseEl = document.getElementById('totalExpense');
const txListEl = document.getElementById('transactionList');
const debtListEl = document.getElementById('debtList');
const noteInput = document.getElementById('noteInput');
const amountInput = document.getElementById('amountInput');
const dateInput = document.getElementById('dateInput');
const radioExpense = document.getElementById('typeExpense');

// Initialize
function init() {
    loadEditableTexts();
    applySettings();
    updateUI();
    updateDebtUI();
    
    // Set today's date default
    dateInput.value = new Date().toISOString().split('T')[0];
}

// Format Currency
const formatMoney = (num) => new Intl.NumberFormat().format(num);

// Auto-detect Expense word "ဖိုး"
noteInput.addEventListener('input', (e) => {
    if(e.target.value.includes('ဖိုး') || e.target.value.toLowerCase().includes('bill')) {
        radioExpense.checked = true;
    }
});

// Update Main UI
function updateUI() {
    let income = 0; let expense = 0;
    txListEl.innerHTML = '';

    if(transactions.length === 0) {
        txListEl.innerHTML = `<p class="empty-msg">${dict[currentLang].emptyList}</p>`;
    }

    transactions.forEach(t => {
        if(t.type === 'income') income += t.amount;
        else expense += t.amount;

        const div = document.createElement('div');
        div.className = `list-item ${t.type}-item`;
        div.innerHTML = `
            <div>
                <strong>${t.note}</strong> <br>
                <small>${t.date}</small>
            </div>
            <div style="display:flex; align-items:center; gap:10px;">
                <span class="amt">${t.type === 'income' ? '+' : '-'}${formatMoney(t.amount)}</span>
                <button class="delete-btn" onclick="deleteTx(${t.id})"><i class="fas fa-trash"></i></button>
            </div>
        `;
        txListEl.appendChild(div);
    });

    const balance = income - expense;
    balanceAmountEl.innerText = formatMoney(balance);
    totalIncomeEl.innerText = `+${formatMoney(income)}`;
    totalExpenseEl.innerText = `-${formatMoney(expense)}`;

    // Warning System Check
    if(warningEnabled && balance <= warningThreshold && balance > 0) {
        balanceAmountEl.style.color = '#e74c3c';
        alert(dict[currentLang].warningMsg);
    } else {
        balanceAmountEl.style.color = 'inherit';
    }
}

// Add Transaction
document.getElementById('addBtn').addEventListener('click', () => {
    const type = document.querySelector('input[name="transactionType"]:checked').value;
    const note = noteInput.value.trim();
    const amount = parseFloat(amountInput.value);
    const date = dateInput.value;

    if(!note || isNaN(amount) || amount <= 0) return alert("Please enter valid details.");

    // Prevent Overspending
    const currentBalance = transactions.reduce((acc, t) => t.type === 'income' ? acc + t.amount : acc - t.amount, 0);
    if(type === 'expense' && amount > currentBalance) {
        return alert(dict[currentLang].insufficient);
    }

    transactions.push({ id: Date.now(), type, note, amount, date });
    localStorage.setItem('transactions', JSON.stringify(transactions));
    
    noteInput.value = ''; amountInput.value = '';
    updateUI();
});

// Delete Transaction
window.deleteTx = (id) => {
    transactions = transactions.filter(t => t.id !== id);
    localStorage.setItem('transactions', JSON.stringify(transactions));
    updateUI();
};

// --- Debt Tracker Logic ---
function updateDebtUI() {
    let totalDebt = 0;
    debtListEl.innerHTML = '';

    if(debts.length === 0) {
        debtListEl.innerHTML = `<p class="empty-msg">${dict[currentLang].emptyList}</p>`;
    }

    debts.forEach(d => {
        if(d.type === 'borrow') totalDebt += d.amount;
        else totalDebt -= d.amount;

        const div = document.createElement('div');
        div.className = `list-item debt-item`;
        div.innerHTML = `
            <div>
                <strong>${d.name}</strong> <span style="font-size:0.8em; padding:2px 5px; background: rgba(0,0,0,0.1); border-radius:3px;">${d.type === 'borrow' ? 'ယူ' : 'ဆပ်'}</span>
            </div>
            <div style="display:flex; align-items:center; gap:10px;">
                <span style="font-weight:bold;">${formatMoney(d.amount)}</span>
                <button class="delete-btn" onclick="deleteDebt(${d.id})"><i class="fas fa-trash"></i></button>
            </div>
        `;
        debtListEl.appendChild(div);
    });

    document.getElementById('totalDebtAmount').innerText = formatMoney(totalDebt);
}

document.getElementById('addDebtBtn').addEventListener('click', () => {
    const type = document.querySelector('input[name="debtType"]:checked').value;
    const name = document.getElementById('debtNameInput').value.trim();
    const amount = parseFloat(document.getElementById('debtAmountInput').value);

    if(!name || isNaN(amount) || amount <= 0) return;

    debts.push({ id: Date.now(), type, name, amount });
    localStorage.setItem('debts', JSON.stringify(debts));
    
    document.getElementById('debtNameInput').value = '';
    document.getElementById('debtAmountInput').value = '';
    updateDebtUI();
});

window.deleteDebt = (id) => {
    debts = debts.filter(d => d.id !== id);
    localStorage.setItem('debts', JSON.stringify(debts));
    updateDebtUI();
};

// --- Settings & UI Interactivity ---

// Settings Toggle
document.getElementById('settingsBtn').addEventListener('click', () => {
    document.getElementById('settingsPanel').classList.toggle('hidden');
});
document.getElementById('closeSettings').addEventListener('click', () => {
    document.getElementById('settingsPanel').classList.add('hidden');
});

// Language Change
document.getElementById('languageSelect').addEventListener('change', (e) => {
    currentLang = e.target.value;
    localStorage.setItem('lang', currentLang);
    applyLanguage();
});

function applyLanguage() {
    const t = dict[currentLang];
    document.getElementById('strTotalBalance').innerText = t.totalBalance;
    document.getElementById('strIncome').innerText = t.income;
    document.getElementById('strExpense').innerText = t.expense;
    document.getElementById('strRadioIncome').innerText = t.radioIncome;
    document.getElementById('strRadioExpense').innerText = t.radioExpense;
    document.getElementById('strAddBtn').innerText = t.addBtn;
    document.getElementById('strTransactionList').innerText = t.txList;
    document.getElementById('strTotalDebt').innerText = t.totalDebt;
    document.getElementById('strRadioBorrow').innerText = t.radioBorrow;
    document.getElementById('strRadioRepay').innerText = t.radioRepay;
    document.getElementById('strAddDebtBtn').innerText = t.addDebtBtn;
    updateUI(); updateDebtUI();
}

// Themes & Dark Mode
document.getElementById('darkModeToggle').addEventListener('change', (e) => {
    if(e.target.checked) {
        document.body.setAttribute('data-theme', 'dark');
        localStorage.setItem('darkMode', 'true');
    } else {
        document.body.removeAttribute('data-theme');
        localStorage.setItem('darkMode', 'false');
    }
});

document.getElementById('themeSelect').addEventListener('change', (e) => {
    document.body.setAttribute('data-color', e.target.value);
    localStorage.setItem('themeColor', e.target.value);
});

// Background Upload
document.getElementById('bgUpload').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if(file) {
        const reader = new FileReader();
        reader.onload = (event) => {
            document.body.style.backgroundImage = `url(${event.target.result})`;
            localStorage.setItem('customBg', event.target.result);
        };
        reader.readAsDataURL(file);
    }
});

// Warning System
document.getElementById('warningToggle').addEventListener('change', (e) => {
    warningEnabled = e.target.checked;
    localStorage.setItem('warningEnabled', warningEnabled);
    updateUI();
});
document.getElementById('warningAmount').addEventListener('input', (e) => {
    warningThreshold = parseInt(e.target.value) || 0;
    localStorage.setItem('warningAmount', warningThreshold);
});

// Editable Texts Saving
function loadEditableTexts() {
    ['appTitle', 'motivationText', 'debtMotivation'].forEach(id => {
        const el = document.getElementById(id);
        const saved = localStorage.getItem(id);
        if(saved) el.innerText = saved;
        el.addEventListener('blur', () => localStorage.setItem(id, el.innerText));
    });
}

function applySettings() {
    document.getElementById('languageSelect').value = currentLang;
    applyLanguage();

    if(localStorage.getItem('darkMode') === 'true') {
        document.getElementById('darkModeToggle').checked = true;
        document.body.setAttribute('data-theme', 'dark');
    }
    
    const theme = localStorage.getItem('themeColor');
    if(theme) {
        document.getElementById('themeSelect').value = theme;
        document.body.setAttribute('data-color', theme);
    }

    const bg = localStorage.getItem('customBg');
    if(bg) document.body.style.backgroundImage = `url(${bg})`;

    document.getElementById('warningToggle').checked = warningEnabled;
    document.getElementById('warningAmount').value = warningThreshold;
}

// App Install Mock
document.getElementById('installAppBtn').addEventListener('click', () => {
    alert("To make this a real installable app (PWA), we just need to add a manifest.json and a basic service worker to your project folder! UI is ready to go.");
});

init();
