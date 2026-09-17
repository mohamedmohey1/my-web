/* =========================================================
   Expense Tracker - script.js (Flask + SQLite version)
   CS50 Final Project
   All pages share this one file.
   Data now lives in a SQL database, accessed through the
   Flask API at /api/expenses (see app.py).
   ========================================================= */

/* ---------- Constants ---------- */

const API_BASE = "/api/expenses";

const CATEGORIES = ["Food", "Transport", "Shopping", "Bills", "Entertainment", "Other"];

const CATEGORY_ICONS = {
  Food: "🍔",
  Transport: "🚌",
  Shopping: "🛍️",
  Bills: "🧾",
  Entertainment: "🎬",
  Other: "📦",
};

const MONTH_NAMES = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

/* =========================================================
   API helpers (talk to the Flask backend instead of localStorage)
   ========================================================= */

// Fetch all expenses from the database. Returns an array (empty if none).
async function getExpenses() {
  const res = await fetch(API_BASE);
  if (!res.ok) {
    console.error("Failed to load expenses");
    return [];
  }
  return res.json();
}

// Fetch a single expense by id. Returns null if it doesn't exist.
async function getExpenseById(id) {
  const res = await fetch(`${API_BASE}/${id}`);
  if (!res.ok) return null;
  return res.json();
}

// Create a new expense. Throws an Error with a friendly message on failure.
async function addExpense(expense) {
  const res = await fetch(API_BASE, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(expense),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Could not add expense.");
  return data;
}

// Update an existing expense by id. Throws an Error on failure.
async function updateExpense(id, updatedFields) {
  const res = await fetch(`${API_BASE}/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(updatedFields),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Could not save changes.");
  return data;
}

// Delete an expense by id. Throws an Error on failure.
async function deleteExpense(id) {
  const res = await fetch(`${API_BASE}/${id}`, { method: "DELETE" });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Could not delete expense.");
  return data;
}

/* =========================================================
   Formatting helpers
   ========================================================= */

function formatCurrency(amount) {
  const value = isNaN(amount) ? 0 : Number(amount);
  return "$" + value.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function formatDate(dateStr) {
  if (!dateStr) return "";
  const [year, month, day] = dateStr.split("-");
  const d = new Date(Number(year), Number(month) - 1, Number(day));
  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function todayISO() {
  const d = new Date();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${month}-${day}`;
}

function getQueryParam(name) {
  const params = new URLSearchParams(window.location.search);
  return params.get(name);
}

/* =========================================================
   Calculation helpers (run on data already fetched from the API)
   ========================================================= */

function calculateTotal(expenses) {
  return expenses.reduce((sum, exp) => sum + Number(exp.amount), 0);
}

function calculateTodayTotal(expenses) {
  const today = todayISO();
  return calculateTotal(expenses.filter((exp) => exp.date === today));
}

function calculateThisMonthTotal(expenses) {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const inMonth = expenses.filter((exp) => {
    const d = new Date(exp.date + "T00:00:00");
    return d.getFullYear() === year && d.getMonth() === month;
  });
  return calculateTotal(inMonth);
}

// Returns { Food: {total, count}, Transport: {total, count}, ... }
function groupByCategory(expenses) {
  const groups = {};
  CATEGORIES.forEach((cat) => {
    groups[cat] = { total: 0, count: 0 };
  });
  expenses.forEach((exp) => {
    const cat = CATEGORIES.includes(exp.category) ? exp.category : "Other";
    groups[cat].total += Number(exp.amount);
    groups[cat].count += 1;
  });
  return groups;
}

// Returns an array of the last `numMonths` months with totals, oldest first.
function groupByMonth(expenses, numMonths = 6) {
  const now = new Date();
  const buckets = [];

  for (let i = numMonths - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    buckets.push({
      key,
      label: `${MONTH_NAMES[d.getMonth()]} ${d.getFullYear()}`,
      total: 0,
    });
  }

  expenses.forEach((exp) => {
    const d = new Date(exp.date + "T00:00:00");
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const bucket = buckets.find((b) => b.key === key);
    if (bucket) bucket.total += Number(exp.amount);
  });

  return buckets;
}

function sortByDateDesc(expenses) {
  return [...expenses].sort((a, b) => {
    if (a.date === b.date) return (b.created_at || "").localeCompare(a.created_at || "");
    return a.date < b.date ? 1 : -1;
  });
}

/* =========================================================
   Navigation (shared sidebar, highlights current page)
   ========================================================= */

const NAV_ITEMS = [
  { href: "/index.html", icon: "🏠", label: "Dashboard" },
  { href: "/expenses.html", icon: "📋", label: "All Expenses" },
  { href: "/add.html", icon: "➕", label: "Add Expense" },
  { href: "/categories.html", icon: "🗂️", label: "Categories" },
  { href: "/statistics.html", icon: "📊", label: "Statistics" },
  { href: "/about.html", icon: "ℹ️", label: "About" },
];

function renderSidebar() {
  const mount = document.getElementById("sidebar-mount");
  if (!mount) return;

  let currentPage = window.location.pathname;
  if (currentPage === "/") currentPage = "/index.html";

  const linksHtml = NAV_ITEMS.map((item) => {
    const isActive = currentPage === item.href;
    return `<li><a href="${item.href}" class="${isActive ? "active" : ""}">
        <span class="nav-icon">${item.icon}</span> ${item.label}
      </a></li>`;
  }).join("");

  mount.innerHTML = `
    <aside class="sidebar" id="sidebar">
      <div class="sidebar-brand">
        <span class="brand-icon">💰</span>
        <span>Expense Tracker</span>
      </div>
      <ul class="nav-list">
        ${linksHtml}
      </ul>
    </aside>
  `;
}

function setupMenuToggle() {
  const toggleBtn = document.getElementById("menu-toggle");
  const sidebar = document.getElementById("sidebar");
  if (!toggleBtn || !sidebar) return;

  toggleBtn.addEventListener("click", () => {
    sidebar.classList.toggle("open");
  });

  sidebar.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => sidebar.classList.remove("open"));
  });
}

// Runs on every page once the DOM is ready.
document.addEventListener("DOMContentLoaded", () => {
  renderSidebar();
  setupMenuToggle();

  // Each of these checks for its own page marker before doing anything,
  // so it is safe to call all of them on every page. They are async and
  // fetch from the Flask API, so they resolve independently.
  initDashboardPage();
  initExpensesPage();
  initAddPage();
  initEditPage();
  initDetailsPage();
  initCategoriesPage();
  initStatisticsPage();
});

/* =========================================================
   Reusable UI helpers
   ========================================================= */

function showAlert(elementId, message, type = "success") {
  const el = document.getElementById(elementId);
  if (!el) return;
  el.textContent = message;
  el.className = `alert show alert-${type}`;
}

function hideAlert(elementId) {
  const el = document.getElementById(elementId);
  if (!el) return;
  el.className = "alert";
}

function setFieldError(fieldWrapperId, message) {
  const wrapper = document.getElementById(fieldWrapperId);
  if (!wrapper) return;
  wrapper.classList.add("has-error");
  const errorEl = wrapper.querySelector(".error-message");
  if (errorEl) errorEl.textContent = message;
}

function clearFieldError(fieldWrapperId) {
  const wrapper = document.getElementById(fieldWrapperId);
  if (!wrapper) return;
  wrapper.classList.remove("has-error");
}

function buildCategoryOptions(selectedValue = "") {
  return CATEGORIES.map((cat) => {
    const selected = cat === selectedValue ? "selected" : "";
    return `<option value="${cat}" ${selected}>${cat}</option>`;
  }).join("");
}

function categoryBadge(category) {
  const icon = CATEGORY_ICONS[category] || "📦";
  return `<span class="badge cat-${category}">${icon} ${category}</span>`;
}

/* =========================================================
   DASHBOARD PAGE (index.html)
   ========================================================= */

async function initDashboardPage() {
  const container = document.getElementById("dashboard-page");
  if (!container) return;

  const expenses = await getExpenses();

  document.getElementById("stat-total").textContent = formatCurrency(calculateTotal(expenses));
  document.getElementById("stat-today").textContent = formatCurrency(calculateTodayTotal(expenses));
  document.getElementById("stat-month").textContent = formatCurrency(calculateThisMonthTotal(expenses));
  document.getElementById("stat-count").textContent = expenses.length;

  renderDashboardCategorySummary(expenses);
  renderLatestExpenses(expenses);
}

function renderDashboardCategorySummary(expenses) {
  const list = document.getElementById("dashboard-category-list");
  if (!list) return;

  const groups = groupByCategory(expenses);
  const total = calculateTotal(expenses);

  const rows = CATEGORIES
    .map((cat) => ({ cat, ...groups[cat] }))
    .filter((g) => g.count > 0)
    .sort((a, b) => b.total - a.total);

  if (rows.length === 0) {
    list.innerHTML = `<p class="empty-state">No expenses yet. Add your first expense to see a breakdown here.</p>`;
    return;
  }

  list.innerHTML = rows
    .map((g) => {
      const percent = total > 0 ? Math.round((g.total / total) * 100) : 0;
      return `
        <li class="category-row cat-${g.cat}">
          <span class="category-dot"></span>
          <div style="flex:1;">
            <div style="display:flex; justify-content:space-between;">
              <span class="cat-name">${CATEGORY_ICONS[g.cat]} ${g.cat}</span>
              <span class="cat-amount">${formatCurrency(g.total)}</span>
            </div>
            <div class="category-bar-track">
              <div class="category-bar-fill" style="width:${percent}%;"></div>
            </div>
          </div>
        </li>`;
    })
    .join("");
}

function renderLatestExpenses(expenses) {
  const tbody = document.getElementById("latest-expenses-body");
  const emptyState = document.getElementById("latest-expenses-empty");
  if (!tbody) return;

  const latest = sortByDateDesc(expenses).slice(0, 5);

  if (latest.length === 0) {
    tbody.innerHTML = "";
    if (emptyState) emptyState.style.display = "block";
    return;
  }
  if (emptyState) emptyState.style.display = "none";

  tbody.innerHTML = latest
    .map(
      (exp) => `
      <tr>
        <td>${formatDate(exp.date)}</td>
        <td>${categoryBadge(exp.category)}</td>
        <td class="amount-cell">${formatCurrency(exp.amount)}</td>
        <td>${exp.note ? exp.note : "<span style='color:var(--color-text-light);'>—</span>"}</td>
      </tr>`
    )
    .join("");
}

/* =========================================================
   ALL EXPENSES PAGE (expenses.html)
   ========================================================= */

function initExpensesPage() {
  const container = document.getElementById("expenses-page");
  if (!container) return;

  const searchInput = document.getElementById("search-input");
  const categoryFilter = document.getElementById("category-filter-select");
  const dateFilter = document.getElementById("date-filter-input");
  const clearBtn = document.getElementById("clear-filters-btn");

  categoryFilter.innerHTML =
    `<option value="">All Categories</option>` + buildCategoryOptions();

  async function renderTable() {
    const allExpenses = sortByDateDesc(await getExpenses());
    const search = searchInput.value.trim().toLowerCase();
    const category = categoryFilter.value;
    const date = dateFilter.value;

    const filtered = allExpenses.filter((exp) => {
      const matchesSearch =
        !search ||
        (exp.note || "").toLowerCase().includes(search) ||
        exp.category.toLowerCase().includes(search);
      const matchesCategory = !category || exp.category === category;
      const matchesDate = !date || exp.date === date;
      return matchesSearch && matchesCategory && matchesDate;
    });

    const tbody = document.getElementById("expenses-table-body");
    const emptyState = document.getElementById("expenses-empty-state");
    const tableWrapper = document.getElementById("expenses-table-wrapper");

    if (filtered.length === 0) {
      tableWrapper.style.display = "none";
      emptyState.style.display = "block";
      emptyState.querySelector("p").textContent =
        allExpenses.length === 0
          ? "You haven't added any expenses yet."
          : "No expenses match your search or filters.";
      return;
    }

    tableWrapper.style.display = "block";
    emptyState.style.display = "none";

    tbody.innerHTML = filtered
      .map(
        (exp) => `
        <tr>
          <td>${formatDate(exp.date)}</td>
          <td>${categoryBadge(exp.category)}</td>
          <td class="amount-cell">${formatCurrency(exp.amount)}</td>
          <td>${exp.note ? exp.note : "<span style='color:var(--color-text-light);'>—</span>"}</td>
          <td>
            <div class="action-buttons">
              <a class="btn btn-secondary btn-sm" href="/details.html?id=${exp.id}">View</a>
              <a class="btn btn-secondary btn-sm" href="/edit.html?id=${exp.id}">Edit</a>
              <button class="btn btn-danger btn-sm" data-delete-id="${exp.id}">Delete</button>
            </div>
          </td>
        </tr>`
      )
      .join("");

    tbody.querySelectorAll("[data-delete-id]").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const id = btn.getAttribute("data-delete-id");
        if (confirm("Are you sure you want to delete this expense? This cannot be undone.")) {
          try {
            await deleteExpense(id);
            renderTable();
          } catch (err) {
            alert(err.message);
          }
        }
      });
    });
  }

  searchInput.addEventListener("input", renderTable);
  categoryFilter.addEventListener("change", renderTable);
  dateFilter.addEventListener("change", renderTable);
  clearBtn.addEventListener("click", () => {
    searchInput.value = "";
    categoryFilter.value = "";
    dateFilter.value = "";
    renderTable();
  });

  renderTable();
}

/* =========================================================
   ADD EXPENSE PAGE (add.html)
   ========================================================= */

function initAddPage() {
  const form = document.getElementById("add-expense-form");
  if (!form) return;

  const categorySelect = document.getElementById("add-category");
  categorySelect.innerHTML = `<option value="">Select a category</option>` + buildCategoryOptions();
  document.getElementById("add-date").value = todayISO();

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    hideAlert("add-alert");

    const amount = document.getElementById("add-amount").value;
    const category = document.getElementById("add-category").value;
    const date = document.getElementById("add-date").value;
    const note = document.getElementById("add-note").value;

    const isValid = validateExpenseForm({ amount, category, date, prefix: "add" });
    if (!isValid) return;

    try {
      await addExpense({ amount, category, date, note });
      showAlert("add-alert", "Expense added successfully!", "success");
      form.reset();
      document.getElementById("add-date").value = todayISO();
      setTimeout(() => {
        window.location.href = "/expenses.html";
      }, 900);
    } catch (err) {
      showAlert("add-alert", err.message, "error");
    }
  });
}

// Shared validation used by both the Add and Edit forms (client-side check;
// the Flask API validates again on the server before touching the database).
function validateExpenseForm({ amount, category, date, prefix }) {
  let valid = true;

  clearFieldError(`${prefix}-amount-field`);
  clearFieldError(`${prefix}-category-field`);
  clearFieldError(`${prefix}-date-field`);

  if (!amount || isNaN(amount) || parseFloat(amount) <= 0) {
    setFieldError(`${prefix}-amount-field`, "Please enter an amount greater than 0.");
    valid = false;
  }

  if (!category) {
    setFieldError(`${prefix}-category-field`, "Please select a category.");
    valid = false;
  }

  if (!date) {
    setFieldError(`${prefix}-date-field`, "Please choose a date.");
    valid = false;
  }

  return valid;
}

/* =========================================================
   EDIT EXPENSE PAGE (edit.html)
   ========================================================= */

async function initEditPage() {
  const form = document.getElementById("edit-expense-form");
  if (!form) return;

  const id = getQueryParam("id");
  const expense = id ? await getExpenseById(id) : null;

  if (!expense) {
    document.getElementById("edit-page-content").innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">🔍</div>
        <p>We couldn't find that expense. It may have already been deleted.</p>
        <a class="btn btn-primary" href="/expenses.html">Back to All Expenses</a>
      </div>`;
    return;
  }

  const categorySelect = document.getElementById("edit-category");
  categorySelect.innerHTML = buildCategoryOptions(expense.category);

  document.getElementById("edit-amount").value = expense.amount;
  document.getElementById("edit-date").value = expense.date;
  document.getElementById("edit-note").value = expense.note;
  document.getElementById("edit-id").value = expense.id;

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    hideAlert("edit-alert");

    const amount = document.getElementById("edit-amount").value;
    const category = document.getElementById("edit-category").value;
    const date = document.getElementById("edit-date").value;
    const note = document.getElementById("edit-note").value;

    const isValid = validateExpenseForm({ amount, category, date, prefix: "edit" });
    if (!isValid) return;

    try {
      await updateExpense(expense.id, { amount, category, date, note });
      showAlert("edit-alert", "Changes saved successfully!", "success");
      setTimeout(() => {
        window.location.href = `/details.html?id=${expense.id}`;
      }, 900);
    } catch (err) {
      showAlert("edit-alert", err.message, "error");
    }
  });
}

/* =========================================================
   EXPENSE DETAILS PAGE (details.html)
   ========================================================= */

async function initDetailsPage() {
  const container = document.getElementById("details-page-content");
  if (!container) return;

  const id = getQueryParam("id");
  const expense = id ? await getExpenseById(id) : null;

  if (!expense) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">🔍</div>
        <p>We couldn't find that expense. It may have already been deleted.</p>
        <a class="btn btn-primary" href="/expenses.html">Back to All Expenses</a>
      </div>`;
    return;
  }

  container.innerHTML = `
    <div class="card details-card">
      <div class="details-amount">${formatCurrency(expense.amount)}</div>
      <div style="margin-bottom: 16px;">${categoryBadge(expense.category)}</div>

      <div class="details-row">
        <span class="details-label">Date</span>
        <span class="details-value">${formatDate(expense.date)}</span>
      </div>
      <div class="details-row">
        <span class="details-label">Note</span>
        <span class="details-value">${expense.note ? expense.note : "—"}</span>
      </div>

      <div class="form-actions" style="margin-top: 22px;">
        <a class="btn btn-primary" href="/edit.html?id=${expense.id}">Edit</a>
        <button class="btn btn-danger" id="details-delete-btn">Delete</button>
        <a class="btn btn-secondary" href="/expenses.html">Back</a>
      </div>
    </div>
  `;

  document.getElementById("details-delete-btn").addEventListener("click", async () => {
    if (confirm("Are you sure you want to delete this expense? This cannot be undone.")) {
      try {
        await deleteExpense(expense.id);
        window.location.href = "/expenses.html";
      } catch (err) {
        alert(err.message);
      }
    }
  });
}

/* =========================================================
   CATEGORIES PAGE (categories.html)
   ========================================================= */

async function initCategoriesPage() {
  const grid = document.getElementById("categories-grid");
  if (!grid) return;

  const expenses = await getExpenses();
  const groups = groupByCategory(expenses);

  grid.innerHTML = CATEGORIES.map((cat) => {
    const g = groups[cat];
    return `
      <div class="card category-card cat-${cat}">
        <div class="cat-title">
          <span class="cat-icon">${CATEGORY_ICONS[cat]}</span>
          <span>${cat}</span>
        </div>
        <div class="cat-total">${formatCurrency(g.total)}</div>
        <div class="cat-count">${g.count} expense${g.count === 1 ? "" : "s"}</div>
      </div>`;
  }).join("");
}

/* =========================================================
   STATISTICS PAGE (statistics.html)
   ========================================================= */

async function initStatisticsPage() {
  const page = document.getElementById("statistics-page");
  if (!page) return;

  const monthSelect = document.getElementById("stats-month-filter");
  const allExpenses = await getExpenses();

  async function render() {
    const selectedMonth = monthSelect.value; // "" or "YYYY-MM"
    const expenses = selectedMonth
      ? allExpenses.filter((exp) => exp.date.startsWith(selectedMonth))
      : allExpenses;

    document.getElementById("stats-total").textContent = formatCurrency(calculateTotal(expenses));
    document.getElementById("stats-count").textContent = expenses.length;
    const avg = expenses.length ? calculateTotal(expenses) / expenses.length : 0;
    document.getElementById("stats-average").textContent = formatCurrency(avg);

    renderCategoryBarChart(expenses);
    renderMonthChart(allExpenses);
  }

  const months = [...new Set(allExpenses.map((exp) => exp.date.slice(0, 7)))].sort().reverse();
  monthSelect.innerHTML =
    `<option value="">All Time</option>` +
    months
      .map((m) => {
        const d = new Date(`${m}-01T00:00:00`);
        const label = `${MONTH_NAMES[d.getMonth()]} ${d.getFullYear()}`;
        return `<option value="${m}">${label}</option>`;
      })
      .join("");

  monthSelect.addEventListener("change", render);
  render();
}

function renderCategoryBarChart(expenses) {
  const wrap = document.getElementById("stats-category-chart");
  if (!wrap) return;

  const groups = groupByCategory(expenses);
  const rows = CATEGORIES.map((cat) => ({ cat, ...groups[cat] }));
  const maxTotal = Math.max(1, ...rows.map((r) => r.total));

  if (calculateTotal(expenses) === 0) {
    wrap.innerHTML = `<p class="empty-state">No data for this period yet.</p>`;
    return;
  }

  wrap.innerHTML = rows
    .map((r) => {
      const percent = Math.round((r.total / maxTotal) * 100);
      return `
        <div class="bar-chart-row cat-${r.cat}">
          <span class="bar-chart-label">${CATEGORY_ICONS[r.cat]} ${r.cat}</span>
          <div class="bar-chart-track">
            <div class="bar-chart-fill" style="width:${percent}%; background: var(--cat-color);"></div>
          </div>
          <span class="bar-chart-value">${formatCurrency(r.total)}</span>
        </div>`;
    })
    .join("");
}

function renderMonthChart(allExpenses) {
  const wrap = document.getElementById("stats-month-chart");
  if (!wrap) return;

  const buckets = groupByMonth(allExpenses, 6);
  const maxTotal = Math.max(1, ...buckets.map((b) => b.total));

  wrap.innerHTML = buckets
    .map((b) => {
      const heightPercent = Math.max(2, Math.round((b.total / maxTotal) * 100));
      return `
        <div class="month-bar-col">
          <span class="month-bar-value">${b.total > 0 ? formatCurrency(b.total) : ""}</span>
          <div class="month-bar" style="height:${heightPercent}%;"></div>
          <span class="month-bar-label">${b.label}</span>
        </div>`;
    })
    .join("");
}
