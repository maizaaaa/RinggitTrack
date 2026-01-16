// ==========================================
// 1. GLOBAL STATE & INITIALIZATION
// ==========================================
let transactions = []; // Loaded from DB
let goals = []; // Loaded from DB
let budgetHistory = []; 
let totalBudget = 0;
let myChart = null;
let calendar = null;

// CHANGE: Your API Base URL
const API_URL = "http://192.168.0.10/RinggitTrack/api";

// Unified Initialization
document.addEventListener('DOMContentLoaded', () => {
    // 1. Set Month Picker
    const now = new Date();
    const monthStr = now.toISOString().slice(0, 7); 
    const picker = document.getElementById('reportMonth');
    if(picker) picker.value = monthStr;

    // 2. Load Data
    loadDataFromDB();
    loadGoalsFromDB(); 
	loadBudgetFromDB();
    
    // 3. Render Initial States
    renderBudgetHistory(); // Load budget history immediately
    updateUI();
    fetchLiveRate();
    initCalendar(); 
    navigateTo('home'); 
});

// ==========================================
// 2. DATA LOADING (PHP API)
// ==========================================
function loadDataFromDB() {
    fetch(`${API_URL}/get_transactions.php`)
    .then(response => response.json())
    .then(data => {
        transactions = data; 
        updateUI(); 
        if(calendar) { 
            calendar.removeAllEvents(); 
            calendar.addEventSource(getCalendarEvents()); 
        }
    })
    .catch(error => console.error('Error loading DB:', error));
}

function loadGoalsFromDB() {
    fetch(`${API_URL}/goals.php?action=fetch`)
    .then(res => res.json())
    .then(data => {
        goals = data; 
        renderGoals(); 
    })
    .catch(err => console.error("Error loading goals:", err));
}

// 1. LOAD DATA: Call this inside document.addEventListener('DOMContentLoaded', ...)
function loadBudgetFromDB() {
    console.log("Fetching budget history..."); // DEBUG LOG

    fetch(`${API_URL}/budget.php?action=fetch`)
    .then(response => {
        if (!response.ok) throw new Error("Network response was not ok");
        return response.json();
    })
    .then(data => {
    console.log("Budget Data Received:", data);

    budgetHistory = Array.isArray(data) ? data : data.data || [];

    totalBudget = budgetHistory.reduce(
        (sum, item) => sum + parseFloat(item.amount),
        0
    );

    renderBudgetHistory();
    updateUI();
});
}

// ==========================================
// 3. NAVIGATION & TABS
// ==========================================
function navigateTo(screenId) {
    document.querySelectorAll('.page-view').forEach(view => view.classList.add('hidden'));
    
    const target = document.getElementById(`view-${screenId}`);
    if(target) target.classList.remove('hidden');

    const container = document.getElementById('mainContainer');
    if(container) container.scrollTop = 0;

    const titles = {
        'home': 'Dashboard', 'budget': 'My Budget', 'analytics': 'Reports',
        'settings': 'Settings', 'about': 'About', 'data-profile': 'Data Management'
    };
    document.getElementById('headerTitle').textContent = titles[screenId] || 'RinggitTrack';

    // Bottom Nav Logic
    document.querySelectorAll('.nav-item').forEach(btn => {
        btn.classList.remove('text-indigo-600', 'active');
        btn.classList.add('text-slate-300');
    });

    let activeNavId = '';
    if (screenId === 'home') activeNavId = 'nav-home';
    else if (screenId === 'budget') activeNavId = 'nav-budget';
    else if (screenId === 'analytics') activeNavId = 'nav-analytics';
    else if (['settings', 'data-profile', 'about'].includes(screenId)) activeNavId = 'nav-settings';

    if (activeNavId) {
        const activeBtn = document.getElementById(activeNavId);
        if(activeBtn) {
            activeBtn.classList.remove('text-slate-300');
            activeBtn.classList.add('text-indigo-600', 'active');
        }
    }

    // Specific Screen Actions
    if (screenId === 'analytics') {
        refreshReports();
        if(calendar) setTimeout(() => calendar.render(), 100);
    } 
    else if (screenId === 'data-profile') {
        const settingInput = document.getElementById('settingsBudgetInput');
        if(settingInput) settingInput.value = totalBudget;
    }
    else if (screenId === 'budget') {
        const totalSpent = transactions.reduce((sum, t) => sum + t.amount, 0);
        updateBudgetView(totalSpent);
        renderGoals();
    }
}

function switchHomeTab(subTabName) {
    document.querySelectorAll('.home-tab').forEach(tab => tab.classList.add('hidden'));
    document.getElementById(`tab-${subTabName}`).classList.remove('hidden');
    
    const btnOverview = document.getElementById('btn-overview');
    const btnHistory = document.getElementById('btn-history');
    
    const activeClass = "bg-indigo-50 text-indigo-700 shadow-sm";
    const inactiveClass = "text-slate-500 hover:bg-slate-50";

    if(subTabName === 'overview') {
        btnOverview.className = "flex-1 py-2 rounded-lg text-xs font-bold transition " + activeClass;
        btnHistory.className = "flex-1 py-2 rounded-lg text-xs font-bold transition " + inactiveClass;
    } else {
        btnHistory.className = "flex-1 py-2 rounded-lg text-xs font-bold transition " + activeClass;
        btnOverview.className = "flex-1 py-2 rounded-lg text-xs font-bold transition " + inactiveClass;
    }
}

function switchReportTab(tabName) {
    document.querySelectorAll('.report-subview').forEach(el => el.classList.add('hidden'));
    
    document.getElementById(`tab-btn-insights`).className = "flex-1 py-2 rounded-lg text-xs font-bold transition text-slate-400";
    document.getElementById(`tab-btn-calendar`).className = "flex-1 py-2 rounded-lg text-xs font-bold transition text-slate-400";

    document.getElementById(`tab-btn-${tabName}`).className = "flex-1 py-2 rounded-lg text-xs font-bold transition bg-slate-100 text-slate-700 shadow-sm";
    document.getElementById(`report-view-${tabName}`).classList.remove('hidden');

    if(tabName === 'calendar' && calendar) {
        setTimeout(() => calendar.render(), 50);
    }
}

// ==========================================
// 4. CORE FUNCTIONS (Search, UI, Budget)
// ==========================================

function searchTransactions() {
    const query = document.getElementById('searchInput').value.toLowerCase();
    const filteredData = transactions.filter(t => {
        return t.item_name.toLowerCase().includes(query) || 
               t.category.toLowerCase().includes(query) || 
               t.amount.toString().includes(query);
    });

    renderList('fullHistoryList', filteredData);

    const emptyState = document.getElementById('emptyState');
    if (emptyState) {
        if (filteredData.length === 0) {
            emptyState.classList.remove('hidden');
            emptyState.querySelector('p').textContent = "No matching transactions found";
        } else {
            emptyState.classList.add('hidden');
            emptyState.querySelector('p').textContent = "No transactions found";
        }
    }
}

function updateUI() {
    const totalSpent = transactions.reduce((sum, t) => sum + t.amount, 0);
    const currentBalance = totalBudget - totalSpent;
    
    // Dashboard Cards
    const balanceEl = document.getElementById('balanceDisplay');
    const budgetEl = document.getElementById('totalBudgetDisplay');
    const expenseEl = document.getElementById('totalExpenseDisplay');

    if(balanceEl) balanceEl.textContent = `RM ${currentBalance.toFixed(2)}`;
    if(budgetEl) budgetEl.textContent = `RM ${totalBudget.toFixed(2)}`;
    if(expenseEl) expenseEl.textContent = `- RM ${totalSpent.toFixed(2)}`;
    
    // Lists & Empty States
    renderList('recentList', transactions.slice(0, 3)); 
    renderList('fullHistoryList', transactions); 
    
    if (transactions.length === 0) document.getElementById('emptyState')?.classList.remove('hidden');
    else document.getElementById('emptyState')?.classList.add('hidden');
    
    // Charts & Bars
    updateChart();
    updateBudgetView(totalSpent);
    renderGoals();
}

function updateBudgetView(totalSpent) {
    const cardAmount = document.getElementById('budgetCardAmount');
    const statusText = document.getElementById('budgetStatusText');
    const progressBar = document.getElementById('budgetProgressBar');

    if (cardAmount) cardAmount.textContent = `RM ${totalBudget.toFixed(2)}`;

    let percentage = 0;
    if (totalBudget > 0) percentage = (totalSpent / totalBudget) * 100;

    if (statusText && progressBar) {
        const visualWidth = Math.min(percentage, 100);
        progressBar.style.width = `${visualWidth}%`;

        if (totalBudget === 0) {
            statusText.textContent = "No Limit Set";
            progressBar.className = "bg-white/30 h-1.5 rounded-full transition-all duration-500";
        } else if (percentage >= 100) {
            statusText.textContent = `Over Limit (${percentage.toFixed(0)}%)`;
            progressBar.className = "bg-rose-400 h-1.5 rounded-full transition-all duration-500 shadow-[0_0_10px_rgba(251,113,133,0.8)]";
        } else {
            statusText.textContent = `${percentage.toFixed(0)}% Used`;
            progressBar.className = "bg-white h-1.5 rounded-full transition-all duration-500";
        }
    }
}

// ==========================================
// 5. BUDGET HISTORY LOGIC (The Fix)
// ==========================================

function openBudgetModal() {
    const modal = document.getElementById('budgetModal');
    const input = document.getElementById('budgetInput');

    modal.classList.remove('hidden');

    input.value = ''; // ALWAYS empty (top-up amount)
    renderBudgetHistory();
    input.focus();
}


function saveBudget() {
    const input = document.getElementById('budgetInput');
    const amount = parseFloat(input.value);

    if (!amount || amount <= 0) {
        alert("Please enter a valid amount");
        return;
    }

    const payload = { amount: amount };

    console.log("Sending budget update...", payload); // DEBUG LOG

    fetch(`http://192.168.0.10/RinggitTrack/api/budget.php?action=add`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    })
    .then(res => res.json())
    .then(data => {
        console.log("Save Response:", data); // DEBUG LOG

        if(data.status === 'success') {
            loadBudgetFromDB(); // Reload data immediately
            input.value = '';   // Clear input
        } else {
            alert("Error saving: " + (data.message || "Unknown error"));
        }
    })
    .catch(err => console.error("Save Error:", err));
}

function renderBudgetHistory() {
    const list = document.getElementById('topupHistoryList');
    const totalLabel = document.getElementById('totalAdded');
    const emptyMsg = document.getElementById('emptyHistoryMsg');

    if (!list) {
        console.error("CRITICAL ERROR: <div id='topupHistoryList'> not found.");
        return;
    }

    // Remove only history items (not empty message)
    list.querySelectorAll('.history-item').forEach(el => el.remove());

    // Empty state
    if (!budgetHistory || budgetHistory.length === 0) {
        if (emptyMsg) {
            emptyMsg.style.display = 'block';
            list.appendChild(emptyMsg);
        }
    } else {
        if (emptyMsg) emptyMsg.style.display = 'none';

        budgetHistory.forEach(t => {
            let dateStr = "Date Error";
            let timeStr = "";

            const rawDate = t.created_at || t.date;
            if (rawDate) {
                try {
                    const safeDateStr = rawDate.replace(" ", "T");
                    const dateObj = new Date(safeDateStr);
                    dateStr = dateObj.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
                    timeStr = dateObj.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
                } catch (e) {
                    console.error("Date parse error", e);
                }
            }

            const item = document.createElement('div');
            item.className = "history-item flex justify-between items-center bg-slate-50 p-3 rounded-xl border border-slate-100 mb-2";
            item.innerHTML = `
                <div class="flex items-center space-x-3">
                    <div class="bg-indigo-50 text-indigo-500 w-8 h-8 rounded-lg flex items-center justify-center">
                        <i class="fas fa-plus text-xs"></i>
                    </div>
                    <div>
                        <h4 class="font-bold text-slate-700 text-xs">Budget Top-up</h4>
                        <p class="text-[10px] text-slate-400 font-semibold">${dateStr} • ${timeStr}</p>
                    </div>
                </div>
                <span class="font-bold text-emerald-600 text-sm">
                    + RM ${parseFloat(t.amount).toFixed(2)}
                </span>
            `;

            list.appendChild(item);
        });
    }

    // Update total
    if (totalLabel) {
        totalLabel.innerText = `Total: RM ${totalBudget.toFixed(2)}`;
    }
}


function clearData() {
    // 1. Safety Check: Ask the user confirmation
    if(!confirm("Are you absolutely sure? This will permanently delete ALL transactions, budget history, and goals.")) {
        return;
    }

    console.log("Resetting data...");

    // 2. Call the PHP Script
    fetch(`${API_URL}/reset_data.php`, {
        method: 'POST'
    })
    .then(res => res.json())
    .then(data => {
        if(data.status === 'success') {
            
            // 3. Reset Frontend Global Variables
            transactions = [];
            goals = [];
            budgetHistory = [];
            totalBudget = 0;

            // 4. Refresh All UI Components
            updateUI();             // Updates Balance, Charts, Transaction List
            renderGoals();          // Clears Goals List
            renderBudgetHistory();  // Clears Budget History Modal
            
            // Clear Calendar if it exists
            if(calendar) {
                calendar.removeAllEvents();
            }

            alert("System Reset: All data has been cleared.");

        } else {
            alert("Error: " + data.message);
        }
    })
    .catch(err => {
        console.error("Reset Error:", err);
        alert("Failed to connect to server.");
    });
}

// ==========================================
// 6. GOALS & TRANSACTIONS (CRUD)
// ==========================================

function openGoalModal() {
    const modal = document.getElementById('goalModal');
    const form = document.getElementById('goalForm');
    const title = document.getElementById('goalModalTitle');
    const hiddenIdx = document.getElementById('goalEditIndex');

    form.reset();
    hiddenIdx.value = ""; 
    title.textContent = "New Savings Goal";
    modal.classList.remove('hidden');
}

function editGoal(goalId) {
    const goal = goals.find(g => g.id == goalId);
    if (!goal) return; 

    const modal = document.getElementById('goalModal');
    document.getElementById('goalName').value = goal.name;
    document.getElementById('goalTarget').value = goal.target;
    document.getElementById('goalSaved').value = goal.saved;
    document.getElementById('goalEditIndex').value = goal.id; 
    document.getElementById('goalModalTitle').textContent = "Edit Savings Goal";
    modal.classList.remove('hidden');
}

function renderGoals() {
    const list = document.getElementById('goalsList');
    const emptyState = document.getElementById('goalsEmptyState');
    if (!list) return;

    list.innerHTML = '';

    if (goals.length === 0) {
        if(emptyState) emptyState.classList.remove('hidden');
        return;
    } 
    if(emptyState) emptyState.classList.add('hidden');

    goals.forEach((goal) => {
        let percent = 0;
        if(goal.target > 0) percent = (goal.saved / goal.target) * 100;
        if(percent > 100) percent = 100;

        const el = document.createElement('div');
        el.className = "bg-white p-4 rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.04)] border border-slate-100 relative overflow-hidden group text-left";
        
        let barColor = 'bg-indigo-500';
        let txtColor = 'text-indigo-600';
        let icon = 'fa-star';
        
        if(percent < 30) { barColor = 'bg-rose-500'; txtColor = 'text-rose-600'; icon = 'fa-flag'; }
        else if(percent >= 100) { barColor = 'bg-emerald-500'; txtColor = 'text-emerald-600'; icon = 'fa-check-circle'; }

        el.innerHTML = `
            <div class="flex justify-between items-start mb-2 relative z-10">
                <div class="flex items-center space-x-3">
                    <div class="w-8 h-8 rounded-full bg-slate-50 ${txtColor} flex items-center justify-center">
                        <i class="fas ${icon} text-xs"></i>
                    </div>
                    <div>
                        <h4 class="font-bold text-slate-700 text-xs">${goal.name}</h4>
                        <p class="text-[10px] text-slate-400">Target: RM ${parseFloat(goal.target).toFixed(2)}</p>
                    </div>
                </div>
                <div class="text-right flex items-center">
                    <span class="text-xs font-bold ${txtColor} mr-2">${percent.toFixed(0)}%</span>
                    <button onclick="editGoal(${goal.id})" class="text-slate-300 hover:text-indigo-500 p-1 mr-1"><i class="fas fa-pen text-xs"></i></button>
                    <button onclick="deleteGoal(${goal.id})" class="text-slate-300 hover:text-rose-500 p-1"><i class="fas fa-trash text-xs"></i></button>
                </div>
            </div>
            <div class="w-full bg-slate-100 rounded-full h-2 mt-2 relative z-10">
                <div class="${barColor} h-2 rounded-full transition-all duration-1000" style="width: ${percent}%"></div>
            </div>
            <p class="text-[10px] text-slate-400 mt-2 text-right font-bold relative z-10">
                Saved: RM ${parseFloat(goal.saved).toFixed(2)}
            </p>
        `;
        list.appendChild(el);
    });
}

document.getElementById('goalForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const editId = document.getElementById('goalEditIndex').value;
    
    const goalData = {
        name: document.getElementById('goalName').value,
        target: parseFloat(document.getElementById('goalTarget').value),
        saved: parseFloat(document.getElementById('goalSaved').value)
    };

    let url = `${API_URL}/goals.php?action=add`;
    if (editId !== "") {
        url = `${API_URL}/goals.php?action=update`;
        goalData.id = editId;
    }

    fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(goalData)
    })
    .then(res => res.json())
    .then(data => {
        if(data.status === 'success') {
            closeModal('goalModal');
            loadGoalsFromDB(); 
        } else {
            alert("Error saving goal");
        }
    })
    .catch(err => console.error(err));
});

function deleteGoal(id) {
    if(confirm("Remove this savings goal?")) {
        fetch(`${API_URL}/goals.php?action=delete`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: id })
        })
        .then(res => res.json())
        .then(data => {
            if(data.status === 'success') loadGoalsFromDB();
            else alert("Error deleting goal");
        });
    }
}

document.getElementById('expenseForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const editId = document.getElementById('editId').value;
    
    const item = {
        item_name: document.getElementById('itemName').value,
        amount: parseFloat(document.getElementById('amount').value),
        category: document.getElementById('category').value,
        date: document.getElementById('date').value,
        location: { 
            lat: document.getElementById('geoLat').value, 
            lng: document.getElementById('geoLng').value, 
            address: document.getElementById('geoAddress').value 
        }
    };

    let url = `${API_URL}/add_transaction.php`;
    if (editId) {
        url = `${API_URL}/update_transaction.php`;
        item.id = editId; 
    }

    fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item)
    })
    .then(res => res.json())
    .then(data => {
        if(data.status === 'success') {
            closeModal('expenseModal');
            loadDataFromDB(); 
        } else {
            alert("Database Error: " + data.message);
        }
    })
    .catch(err => console.error("Error:", err));
});

function openExpenseModal(editItem = null) {
    document.getElementById('expenseModal').classList.remove('hidden');
    document.getElementById('geoText').textContent = "Tap to tag location";
    document.getElementById('geoText').className = "text-[10px] text-indigo-500 truncate";
    
    if (editItem) {
        document.getElementById('modalTitle').textContent = "Edit Transaction";
        document.getElementById('editId').value = editItem.id;
        document.getElementById('itemName').value = editItem.item_name;
        document.getElementById('amount').value = editItem.amount;
        document.getElementById('category').value = editItem.category;
        document.getElementById('date').value = editItem.date;

        if(editItem.location && editItem.location.address) {
            document.getElementById('geoLat').value = editItem.location.lat; 
            document.getElementById('geoLng').value = editItem.location.lng;
            document.getElementById('geoAddress').value = editItem.location.address; 
            document.getElementById('geoText').textContent = editItem.location.address;
        }
        document.getElementById('deleteBtn').classList.remove('hidden');
    } else {
        document.getElementById('modalTitle').textContent = "New Transaction";
        document.getElementById('expenseForm').reset();
        document.getElementById('editId').value = "";
        document.getElementById('deleteBtn').classList.add('hidden');
        document.getElementById('date').value = new Date().toLocaleDateString('en-CA');
    }
}

function deleteCurrentItem() { 
    const id = document.getElementById('editId').value; 
    
    if(confirm("Delete this transaction permanently?")) { 
        fetch(`${API_URL}/delete_transaction.php`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: id })
        })
        .then(res => res.json())
        .then(data => {
            if(data.status === 'success') {
                closeModal('expenseModal'); 
                loadDataFromDB(); 
            } else {
                alert("Failed to delete.");
            }
        })
        .catch(err => console.error("Delete error:", err));
    }
}

// ==========================================
// 7. UTILS & HELPERS
// ==========================================

function renderList(elementId, data) {
    const list = document.getElementById(elementId);
    if(!list) return;
    list.innerHTML = '';
    
    data.forEach(t => {
        let icon = 'fa-shopping-bag';
        let bgClass = 'bg-slate-100 text-slate-500';
        if (t.category === 'Food') { icon = 'fa-utensils'; bgClass = 'bg-orange-50 text-orange-500'; }
        else if (t.category === 'Transport') { icon = 'fa-bus'; bgClass = 'bg-emerald-50 text-emerald-500'; }
        else if (t.category === 'Study') { icon = 'fa-book'; bgClass = 'bg-blue-50 text-blue-500'; }
        else if (t.category === 'Entertainment') { icon = 'fa-film'; bgClass = 'bg-purple-50 text-purple-500'; }

        const addressHtml = (t.location && t.location.address) ? 
            `<div class="flex items-center mt-1 text-[9px] text-indigo-500">
                <i class="fas fa-map-marker-alt mr-1"></i>
                <span class="truncate max-w-[150px]">${t.location.address}</span>
             </div>` : '';

        const li = document.createElement('li');
        li.className = "bg-white p-4 rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.04)] border border-slate-100 flex items-center justify-between active:scale-[0.99] transition cursor-pointer";
        li.innerHTML = `
            <div class="flex items-center space-x-4">
                <div class="${bgClass} w-10 h-10 rounded-xl flex items-center justify-center">
                    <i class="fas ${icon} text-sm"></i>
                </div>
                <div class="overflow-hidden">
                    <h4 class="font-bold text-slate-700 text-sm truncate">${t.item_name}</h4>
                    <p class="text-[10px] text-slate-400 font-semibold uppercase">${t.category} • ${t.date}</p>
                    ${addressHtml}
                </div>
            </div>
            <p class="font-bold text-slate-700 whitespace-nowrap">- RM ${t.amount.toFixed(2)}</p>
        `;
        li.addEventListener('click', () => openExpenseModal(t));
        list.appendChild(li);
    });
}

function getGeo() {
    const geoText = document.getElementById('geoText');
    if (!navigator.geolocation) {
        alert("Geolocation not supported.");
        return;
    }

    geoText.textContent = "Locating...";
    
    navigator.geolocation.getCurrentPosition(async (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords;
        document.getElementById('geoLat').value = lat; 
        document.getElementById('geoLng').value = lng;

        try {
            const res = await fetch(`${API_URL}/get_address.php?lat=${lat}&lng=${lng}`);
            const data = await res.json();
            
            console.log("Address Data:", data); // Keep this for debugging

            // 1. Try specific building/place names first
            let simpleName = data.address.amenity || 
                             data.address.shop || 
                             data.address.building || 
                             data.address.office ||
                             data.address.tourism;

            // 2. If no building, try street/road names
            if (!simpleName) {
                if (data.address.road) {
                    simpleName = data.address.road;
                    if (data.address.house_number) {
                        simpleName = data.address.house_number + " " + simpleName;
                    }
                }
            }

            // 3. If no road, try area names (This fixes your issue!)
            if (!simpleName) {
                 simpleName = data.address.hamlet || 
                              data.address.village || 
                              data.address.suburb || 
                              data.address.residential ||
                              data.address.city_district ||
                              data.address.city;
            }

            // 4. Absolute Fallback: Use the first part of the full display name
            if (!simpleName && data.display_name) {
                simpleName = data.display_name.split(',')[0]; 
            }

            // 5. Final safety net
            if (!simpleName) {
                simpleName = "Pinned Location";
            }

            // Update UI
            document.getElementById('geoAddress').value = simpleName; 
            document.getElementById('geoText').textContent = simpleName; 
            document.getElementById('geoText').className = "text-[10px] text-indigo-600 font-bold truncate block w-full";

        } catch (e) { 
            console.error("Geo Error:", e);
            document.getElementById('geoAddress').value = `${lat.toFixed(4)}, ${lng.toFixed(4)}`; 
            document.getElementById('geoText').textContent = "Location Saved (Coords Only)"; 
        }
    }, (error) => {
        geoText.textContent = "GPS Error";
        console.error("GPS Error:", error);
    });
}

async function fetchLiveRate() {
    try {
        const res = await fetch('https://open.er-api.com/v6/latest/USD');
        const data = await res.json();
        document.getElementById('apiRate').textContent = `1 USD = RM ${data.rates.MYR.toFixed(2)}`;
    } catch (e) { document.getElementById('apiRate').textContent = "Market Offline"; }
}

function closeModal(id) { document.getElementById(id).classList.add('hidden'); }

// Charts and Reporting
function getFilteredTransactions() {
    const picker = document.getElementById('reportMonth');
    if(!picker || !picker.value) return transactions;
    return transactions.filter(t => t.date.startsWith(picker.value));
}

function refreshReports() {
    updateChart();
    const picker = document.getElementById('reportMonth');
    if(calendar && picker.value) {
        calendar.gotoDate(picker.value + '-01');
    }
    const dateObj = new Date(picker.value + '-01');
    const monthName = dateObj.toLocaleString('default', { month: 'long', year: 'numeric' });
    const label = document.getElementById('chartMonthLabel');
    if(label) label.textContent = monthName;
}

function updateChart() {
    const ctx = document.getElementById('expenseChart');
    if(!ctx) return;
    
    const isDark = document.body.classList.contains('dark-mode');
    Chart.defaults.color = isDark ? '#ffffff' : '#64748b';
    Chart.defaults.borderColor = isDark ? '#334155' : '#e2e8f0';

    const currentData = getFilteredTransactions(); 
    const categories = ['Food', 'Transport', 'Study', 'Entertainment', 'Other'];
    const colors = ['#f97316', '#10b981', '#6366f1', '#f43f5e', '#64748b'];
    
    const dataPoints = categories.map(cat => currentData.filter(t => t.category === cat).reduce((sum, t) => sum + t.amount, 0));
    
    if (myChart) myChart.destroy();
    myChart = new Chart(ctx.getContext('2d'), {
        type: 'doughnut',
        data: { labels: categories, datasets: [{ data: dataPoints, backgroundColor: colors, borderWidth: 0, hoverOffset: 15 }] },
        options: { responsive: true, maintainAspectRatio: false, cutout: '70%', plugins: { legend: { display: false } } }
    });

    const breakdownEl = document.getElementById('categoryBreakdown');
    if(breakdownEl) {
        breakdownEl.innerHTML = '';
        if(currentData.length === 0) {
            breakdownEl.innerHTML = '<p class="text-center text-[10px] text-slate-400 py-4">No data for selected month.</p>';
        } else {
            categories.forEach((cat, index) => {
                if(dataPoints[index] > 0) {
                    const div = document.createElement('div');
                    div.className = "flex justify-between items-center text-xs p-3 bg-slate-50 rounded-xl border border-slate-100";
                    div.innerHTML = `
                        <div class="flex items-center space-x-2">
                            <div class="w-2 h-2 rounded-full" style="background-color: ${colors[index]}"></div>
                            <span class="text-slate-600 font-bold">${cat}</span>
                        </div>
                        <span class="font-bold text-slate-800">RM ${dataPoints[index].toFixed(2)}</span>
                    `;
                    breakdownEl.appendChild(div);
                }
            });
        }
    }
}

function initCalendar() {
    var calendarEl = document.getElementById('calendar');
    if(!calendarEl) return;

    calendar = new FullCalendar.Calendar(calendarEl, {
        initialView: 'dayGridMonth',
        headerToolbar: { left: 'prev', center: 'title', right: 'next' },
        height: 'auto',
        events: getCalendarEvents(), 
        eventContent: function(arg) {
            const total = arg.event.extendedProps.total;
            const cssClass = total > 100 ? 'bubble-high' : 'bubble-low';
            let el = document.createElement('div');
            el.className = `event-bubble ${cssClass}`;
            el.innerText = arg.event.title;
            return { domNodes: [el] };
        },
        dateClick: function(info) {
            const txns = transactions.filter(t => t.date === info.dateStr);
            let msg = `Spending on ${info.dateStr}:\n`;
            if(txns.length === 0) msg += "No spending recorded.";
            else txns.forEach(t => msg += `• ${t.item_name}: RM ${t.amount.toFixed(2)}\n`);
            alert(msg);
        }
    });
    calendar.render();
}

function getCalendarEvents() {
    const dailyTotals = {};
    transactions.forEach(t => {
        if (!dailyTotals[t.date]) dailyTotals[t.date] = 0;
        dailyTotals[t.date] += t.amount;
    });
    return Object.keys(dailyTotals).map(date => ({
        title: 'RM ' + dailyTotals[date].toFixed(0),
        start: date,
        allDay: true,
        extendedProps: { total: dailyTotals[date] }
    }));
}

function downloadPDF() {
    if (!window.jspdf) { alert("PDF Library not loaded."); return; }
    
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    const monthInput = document.getElementById('reportMonth').value;
    const filteredData = getFilteredTransactions();

    if (filteredData.length === 0) { 
        alert(`No transactions found for ${monthInput}.`); 
        return; 
    }

    doc.setFontSize(18); doc.setTextColor(30); 
    doc.text("Monthly Spending Report", 14, 22);
    
    doc.setFontSize(10); doc.setTextColor(100); 
    doc.text(`Period: ${monthInput}`, 14, 30);

    const totalSpent = filteredData.reduce((sum, t) => sum + t.amount, 0);
    doc.setFillColor(241, 245, 249); 
    doc.rect(14, 35, 180, 10, 'F');
    doc.setTextColor(30); doc.setFont(undefined, 'bold');
    doc.text(`Total Expenditure: RM ${totalSpent.toFixed(2)}`, 18, 41);

    const tableRows = filteredData.sort((a, b) => new Date(a.date) - new Date(b.date)).map(t => [
        t.date, 
        t.category, 
        t.item_name, 
        `RM ${t.amount.toFixed(2)}`
    ]);

    doc.autoTable({
        head: [["Date", "Category", "Description", "Amount"]],
        body: tableRows,
        startY: 50,
        theme: 'grid',
        headStyles: { fillColor: [79, 70, 229] },
        alternateRowStyles: { fillColor: [248, 250, 252] }
    });
    
    doc.save(`RinggitTrack_${monthInput}.pdf`);
}

function toggleTheme() {
    document.body.classList.toggle('dark-mode');
    const isDark = document.body.classList.contains('dark-mode');
    if (myChart) {
        Chart.defaults.color = isDark ? '#ffffff' : '#64748b'; 
        Chart.defaults.borderColor = isDark ? '#334155' : '#e2e8f0';
        myChart.update();
    }
}

// ==========================================
// 8. TOGGLE
// ==========================================
// 1. Initialize Toggle State on App Load
document.addEventListener('deviceready', () => {
    const isEnabled = localStorage.getItem('daily_reminder_enabled') === 'true';
    const toggle = document.getElementById('reminderToggle');
    if (toggle) {
        toggle.checked = isEnabled;
    }
    
    // Check permission status
    cordova.plugins.notification.local.hasPermission(function (granted) {
        if (!granted) {
            // Turn off toggle if permission was revoked in phone settings
            if(toggle) toggle.checked = false;
        }
    });
});

// 2. The Main Toggle Function
function toggleReminders() {
    const toggle = document.getElementById('reminderToggle');
    const isChecked = toggle.checked;

    if (isChecked) {
        // User turned ON -> Schedule Notification
        enableDailyNotification();
    } else {
        // User turned OFF -> Cancel Notification
        disableDailyNotification();
    }
}

function enableDailyNotification() {
    // 1. Safety Check: Are we on a phone?
    if (typeof cordova === 'undefined') {
        alert("NOTE: Notifications only work on a real phone (Android/iOS).");
        console.warn("Cordova not found. Skipping notification scheduling.");
        
        // Save state anyway so you can test the UI toggle
        localStorage.setItem('daily_reminder_enabled', 'true');
        return; 
    }

    // 2. Request Permission (Only runs on Phone)
    cordova.plugins.notification.local.requestPermission(function (granted) {
        if (granted) {
            cordova.plugins.notification.local.schedule({
                id: 1, 
                title: 'RinggitTrack',
                text: 'Don\'t forget to track your spending today!',
                trigger: { every: 'day', count: 1, hour: 8, minute: 0 }, 
                foreground: true 
            });

            localStorage.setItem('daily_reminder_enabled', 'true');
            alert("Reminders set for 8:00 AM daily!");
        } else {
            alert("Permission denied. Please enable notifications in settings.");
            document.getElementById('reminderToggle').checked = false;
        }
    });
}

function disableDailyNotification() {
    // 1. Safety Check
    if (typeof cordova === 'undefined') {
        console.warn("Cordova not found. Skipping notification cancel.");
        localStorage.setItem('daily_reminder_enabled', 'false');
        return;
    }

    // 2. Cancel Notification (Only runs on Phone)
    cordova.plugins.notification.local.cancel(1, function() {
        localStorage.setItem('daily_reminder_enabled', 'false');
        console.log("Daily reminders disabled");
    });
}