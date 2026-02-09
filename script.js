// State Management
let state = JSON.parse(localStorage.getItem('budgetData')) || {
    salary: 0,
    expenses: [],
    currency: 'USD'
};

let myChart;

// Initialization
function init() {
    document.getElementById('salaryInput').value = state.salary;
    document.getElementById('currencySelector').value = state.currency;
    render();
}

// Logic: Update Salary
function updateSalary() {
    state.salary = parseFloat(document.getElementById('salaryInput').value) || 0;
    saveAndRender();
}

// Logic: Add Expense (Level 1 & 2)
function addExpense() {
    const nameInput = document.getElementById('expName');
    const amtInput = document.getElementById('expAmount');
    
    const name = nameInput.value.trim();
    const amount = parseFloat(amtInput.value);

    if (!name || isNaN(amount) || amount <= 0) {
        alert("Enter a valid name and positive amount!");
        return;
    }

    state.expenses.push({ id: Date.now(), name, amount });
    nameInput.value = '';
    amtInput.value = '';
    saveAndRender();
}

// Logic: Delete Functionality (Level 2)
function deleteExpense(id) {
    state.expenses = state.expenses.filter(e => e.id !== id);
    saveAndRender();
}

// API: Currency Converter (Level 3)
async function convertCurrency() {
    const newCurrency = document.getElementById('currencySelector').value;
    try {
        const response = await fetch(`https://open.er-api.com/v6/latest/${state.currency}`);
        const data = await response.json();
        const rate = data.rates[newCurrency];
        
        state.salary = +(state.salary * rate).toFixed(2);
        state.expenses = state.expenses.map(e => ({
            ...e, 
            amount: +(e.amount * rate).toFixed(2)
        }));
        state.currency = newCurrency;
        
        document.getElementById('salaryInput').value = state.salary;
        saveAndRender();
    } catch (error) {
        console.error("Conversion failed", error);
        alert("Unable to fetch exchange rates.");
    }
}

// Persistence: Save to LocalStorage (Level 2)
function saveAndRender() {
    localStorage.setItem('budgetData', JSON.stringify(state));
    render();
}

// UI: Main Render Function
function render() {
    const list = document.getElementById('expenseList');
    const totalExp = state.expenses.reduce((sum, e) => sum + e.amount, 0);
    const balance = state.salary - totalExp;
    const symbol = state.currency === 'INR' ? '₹' : state.currency === 'EUR' ? '€' : '$';

    // Update List
    list.innerHTML = state.expenses.map(e => `
        <li class="expense-item">
            <span>${e.name}</span>
            <span>
                ${symbol}${e.amount.toFixed(2)}
                <button class="delete-btn" onclick="deleteExpense(${e.id})">❌</button>
            </span>
        </li>
    `).join('');

    // Update Balance & Alert (Level 3)
    const balDisplay = document.getElementById('balanceDisplay');
    balDisplay.innerText = `${symbol}${balance.toFixed(2)}`;
    
    const isLow = state.salary > 0 && balance < (state.salary * 0.1);
    balDisplay.classList.toggle('warning', isLow);
    document.getElementById('alertMsg').style.display = isLow ? 'block' : 'none';

    updateChart(totalExp, Math.max(0, balance));
}

// Visualization: Chart.js (Level 2)
function updateChart(exp, bal) {
    const ctx = document.getElementById('budgetChart').getContext('2d');
    if (myChart) myChart.destroy();
    
    myChart = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: ['Expenses', 'Remaining'],
            datasets: [{
                data: [exp, bal],
                backgroundColor: ['#e74c3c', '#2ecc71'],
                borderWidth: 0
            }]
        },
        options: { responsive: true, maintainAspectRatio: false }
    });
}

// Export: jsPDF (Level 3)
function downloadPDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    doc.setFontSize(18);
    doc.text("Personal Budget Report", 20, 20);
    doc.setFontSize(12);
    doc.text(`Total Salary: ${state.currency} ${state.salary}`, 20, 40);
    
    let y = 50;
    state.expenses.forEach((e, i) => {
        doc.text(`${i+1}. ${e.name}: ${e.amount}`, 20, y);
        y += 10;
    });

    doc.setFont("helvetica", "bold");
    doc.text(`Final Balance: ${document.getElementById('balanceDisplay').innerText}`, 20, y + 10);
    doc.save("Budget_Report.pdf");
}

init();