const token = localStorage.getItem('rentmate_token');
if (!token) location.href = '/login.html';
const page = document.body.dataset.page;

const api = async (url, options = {}) => {
  const response = await fetch(`/api${url}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, ...options.headers }
  });
  const data = await response.json();
  if (!response.ok) {
    if (response.status === 401) {
      localStorage.removeItem('rentmate_token');
      location.href = '/login.html';
    }
    throw new Error(data.message);
  }
  return data;
};

const money = (value) => `₹${Number(value || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
const date = (value) => value ? new Date(value).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

const nav = [
  ['dashboard', '▦', 'Dashboard'],
  ['house', '⌂', 'My House'],
  ['rent', '₹', 'Rent'],
  ['expenses', '▣', 'Expenses'],
  ['settlements', '⇄', 'Settlements'],
  ['maintenance', '⚒', 'Maintenance'],
  ['chores', '✓', 'Chores'],
  ['pantry', '🥫', 'Pantry'],
  ['notifications', '♢', 'Notifications'],
  ['profile', '◉', 'Profile']
];

const shell = (title, action = '') => `
<div class="layout">
  <aside class="sidebar">
    <a class="brand" href="/dashboard.html">⌂ RentMate</a>
    <nav>${nav.map(([key, icon, label]) => `<a class="${page === key ? 'active' : ''}" href="/${key}.html"><b>${icon}</b>${label}</a>`).join('')}</nav>
    <button class="logout" onclick="logout()">↪ Log out</button>
  </aside>
  <main class="content">
    <header>
      <div><p class="eyebrow">YOUR SHARED HOME</p><h1>${title}</h1></div>
      ${action}
    </header>
    <section id="view"><div class="loading">Loading your home…</div></section>
  </main>
</div>`;

const setView = (html) => document.querySelector('#view').innerHTML = html;
const badge = (value) => `<span class="badge ${String(value).toLowerCase().replaceAll(' ', '-')}">${value}</span>`;

const setBanner = (msg, type = 'success') => {
  const el = document.querySelector('#msgSlot');
  if (el) el.innerHTML = `<div class="alert-banner ${type}"><span>${msg}</span><button class="small" onclick="this.parentElement.remove()" style="background:transparent;color:inherit;padding:2px 6px">✕</button></div>`;
};

window.logout = () => {
  localStorage.removeItem('rentmate_token');
  location.href = '/';
};

const noHouse = () => setView(`
<div class="empty">
  <h2>Welcome to RentMate</h2>
  <p>Create a new home or join your roommates with a shared code.</p>
  <div class="two-forms">
    <form id="createHouse"><h3>Create a house</h3><input name="name" placeholder="House name" required><input name="address" placeholder="Address (optional)"><button>Create house</button></form>
    <form id="joinHouse"><h3>Join a house</h3><input name="joinCode" placeholder="Join code" required><button>Join house</button></form>
  </div>
</div>`);

const bindHouseForms = () => {
  document.querySelector('#createHouse')?.addEventListener('submit', submit('/houses', 'POST'));
  document.querySelector('#joinHouse')?.addEventListener('submit', submit('/houses/join', 'POST'));
};

const submit = (url, method, callback = () => location.reload()) => async (event) => {
  event.preventDefault();
  try {
    await api(url, { method, body: JSON.stringify(Object.fromEntries(new FormData(event.currentTarget))) });
    callback();
  } catch (error) {
    alert(error.message);
  }
};

// ==================== DASHBOARD ====================
async function dashboard() {
  document.body.innerHTML = shell('Good to see you');
  const data = await api('/dashboard');
  if (!data.house) { noHouse(); bindHouseForms(); return; }

  setView(`
    <div class="house-line">⌂ ${data.house.name} <span>• ${data.house.members.length} members</span></div>
    <div class="cards">
      <article><span>Monthly Rent</span><strong>${money(data.house.monthlyRent / data.house.members.length)}</strong><small>Due on the ${data.house.rentDueDay}th</small></article>
      <article><span>You owe</span><strong>${money(data.owes)}</strong><small>Pending settlements</small></article>
      <article><span>You receive</span><strong>${money(data.receives)}</strong><small>From housemates</small></article>
      <article><span>Open issues</span><strong>${data.maintenance}</strong><small>Maintenance requests</small></article>
    </div>
    <div class="grid">
      <section class="panel">
        <h2>Recent expenses</h2>
        ${data.expenses.length ? data.expenses.map((item) => `
          <div class="list-row">
            <div><b>${item.title}</b><small>${item.category} · paid by ${item.paidBy.name}</small></div>
            <strong>${money(item.amount)}</strong>
          </div>`).join('') : '<p class="muted">No expenses added yet.</p>'}
      </section>
      <div>
        <section class="panel" style="margin-bottom:20px">
          <h2>Current chore</h2>
          ${data.chore ? `
            <h3>${data.chore.title}</h3>
            <p style="margin:6px 0 10px">${data.chore.description || 'No description'}</p>
            <p style="font-size:13px;color:var(--muted);margin-bottom:12px">Due: <b>${date(data.chore.dueDate)}</b></p>
            <div style="display:flex;gap:6px;align-items:center">
              ${badge(data.chore.priority || 'Medium')}
              ${badge(data.chore.frequency || 'Once')}
              ${badge(data.chore.status)}
            </div>
            <div style="margin-top:14px"><a class="button small" href="/chores.html">View Chores</a></div>
          ` : '<p class="muted">Nothing assigned right now. Enjoy it!</p>'}
        </section>
        <section class="panel">
          <h2>Shared Pantry</h2>
          ${data.pantry ? `
            <div class="list-row"><div><b>Total stocked items</b></div><strong>${data.pantry.total}</strong></div>
            <div class="list-row"><div><b>Expiring soon</b><small>Within 7 days</small></div><strong>${badge(data.pantry.expiringSoon)}</strong></div>
            <div class="list-row"><div><b>Low stock alerts</b></div><strong>${badge(data.pantry.lowStock)}</strong></div>
            <div style="margin-top:14px"><a class="button small secondary" href="/pantry.html">Open Pantry</a></div>
          ` : '<p class="muted">Pantry tracker ready.</p>'}
        </section>
      </div>
    </div>
  `);
}

// ==================== HOUSE ====================
async function house() {
  document.body.innerHTML = shell('My House');
  try {
    const [data, currentUser] = await Promise.all([api('/houses/current'), api('/auth/me')]);
    const isAdmin = data.admin === currentUser._id;
    const rentSettings = isAdmin
      ? `<form id="rentSettings"><input type="number" name="monthlyRent" value="${data.monthlyRent}" placeholder="Monthly total rent"><input type="number" name="rentDueDay" value="${data.rentDueDay}" min="1" max="31"><button>Save settings</button></form>`
      : `<p class="muted">Only the house admin can update settings. Current rent: ${money(data.monthlyRent)} · Due on the ${data.rentDueDay}th.</p>`;
    setView(`
      <div class="grid">
        <section class="panel">
          <p class="eyebrow">HOUSE DETAILS</p>
          <h2>${data.name}</h2>
          <p>${data.address || 'No address added'}</p>
          <div class="join-code"><span>JOIN CODE</span><b>${data.joinCode}</b></div>
        </section>
        <section class="panel">
          <h2>Members (${data.members.length})</h2>
          ${data.members.map((member) => `
            <div class="list-row">
              <div class="person">${member.name[0]}<span><b>${member.name}</b><small>${member.email}</small></span></div>
              ${member._id === data.admin ? badge('Admin') : ''}
            </div>`).join('')}
        </section>
      </div>
      <section class="panel settings"><h2>Rent settings</h2>${rentSettings}</section>
    `);
    document.querySelector('#rentSettings')?.addEventListener('submit', submit('/houses/current', 'PUT'));
  } catch {
    noHouse();
    bindHouseForms();
  }
}

// ==================== EXPENSES ====================
async function expenses() {
  document.body.innerHTML = shell('Shared Expenses', '<button onclick="showExpenseForm()">+ Add expense</button>');
  const items = await api('/expenses');
  setView(`
    <div id="formSlot"></div>
    <section class="panel table-wrap">
      <table>
        <thead><tr><th>Expense</th><th>Category</th><th>Paid by</th><th>Date</th><th>Amount</th></tr></thead>
        <tbody>
          ${items.map((item) => `
            <tr>
              <td><b>${item.title}</b><small>Split among ${item.splitBetween.length}</small></td>
              <td>${badge(item.category)}</td>
              <td>${item.paidBy.name}</td>
              <td>${date(item.date)}</td>
              <td><b>${money(item.amount)}</b></td>
            </tr>`).join('') || '<tr><td colspan="5" class="muted">No expenses yet.</td></tr>'}
        </tbody>
      </table>
    </section>
  `);
}

window.showExpenseForm = () => {
  document.querySelector('#formSlot').innerHTML = `
    <form class="panel inline-form" id="expenseForm">
      <input name="title" placeholder="Expense title" required>
      <select name="category"><option>Groceries</option><option>Electricity</option><option>Water</option><option>Internet</option><option>Gas</option><option>Cleaning</option><option>Household items</option><option>Other</option></select>
      <input type="number" name="amount" placeholder="Amount" min="1" required>
      <button>Add expense</button>
    </form>`;
  document.querySelector('#expenseForm').addEventListener('submit', submit('/expenses', 'POST'));
};

// ==================== SETTLEMENTS ====================
async function settlements() {
  document.body.innerHTML = shell('Settlements');
  const items = await api('/settlements');
  const me = await api('/auth/me');
  setView(`
    <section class="panel table-wrap">
      <table>
        <thead><tr><th>From</th><th>To</th><th>Amount</th><th>Status</th><th></th></tr></thead>
        <tbody>
          ${items.map((item) => `
            <tr>
              <td>${item.from.name}</td>
              <td>${item.to.name}</td>
              <td><b>${money(item.amount)}</b></td>
              <td>${badge(item.status)}</td>
              <td>${item.from._id === me._id && item.status === 'Pending' ? `<button class="small" onclick="pay('${item._id}')">Mark paid</button>` : ''}</td>
            </tr>`).join('') || '<tr><td colspan="5" class="muted">No settlements yet.</td></tr>'}
        </tbody>
      </table>
    </section>
  `);
}

window.pay = async (id) => {
  await api(`/settlements/${id}`, { method: 'PUT' });
  location.reload();
};

// ==================== MAINTENANCE (Preserved Feature) ====================
async function feature(kind, title) {
  document.body.innerHTML = shell(title, `<button onclick="showFeatureForm('${kind}')">+ Add request</button>`);
  const items = await api(`/${kind}`);
  setView(`
    <div id="formSlot"></div>
    <section class="panel table-wrap">
      <table>
        <thead><tr><th>Title</th><th>Priority</th><th>Status</th><th>Created</th></tr></thead>
        <tbody>
          ${items.map((item) => `
            <tr>
              <td><b>${item.title}</b><small>${item.location || item.description || ''}</small></td>
              <td>${badge(item.priority)}</td>
              <td>${badge(item.status)}</td>
              <td>${date(item.createdAt)}</td>
            </tr>`).join('') || '<tr><td colspan="4" class="muted">Nothing here yet.</td></tr>'}
        </tbody>
      </table>
    </section>
  `);
}

window.showFeatureForm = async (kind) => {
  document.querySelector('#formSlot').innerHTML = `
    <form class="panel inline-form feature-form" id="featureForm">
      <input name="title" placeholder="Problem title" required>
      <input name="location" placeholder="Location">
      <select name="priority"><option>Low</option><option selected>Medium</option><option>High</option><option>Urgent</option></select>
      <input name="description" placeholder="Description">
      <button>Add</button>
    </form>`;
  document.querySelector('#featureForm').addEventListener('submit', submit(`/${kind}`, 'POST'));
};

// ==================== SMART CHORE ROTATION ====================
async function chores() {
  document.body.innerHTML = shell('Household Chores', `
    <div class="header-actions">
      <button onclick="showChoreForm()">+ Add chore</button>
      <button class="secondary" onclick="rotateChores()">⇄ Rotate Chores</button>
    </div>
  `);

  try {
    const [items, currentUser, houseData, workload] = await Promise.all([
      api('/chores'),
      api('/auth/me'),
      api('/houses/current').catch(() => null),
      api('/chores/workload').catch(() => [])
    ]);

    if (!houseData) { noHouse(); bindHouseForms(); return; }

    const total = items.length;
    const pending = items.filter(c => c.status === 'Pending').length;
    const overdue = items.filter(c => c.status === 'Overdue').length;
    const completed = items.filter(c => c.status === 'Completed').length;
    const isAdmin = houseData.admin === currentUser._id;

    const actionsEl = document.querySelector('header .header-actions');
    if (actionsEl) {
      actionsEl.innerHTML = `<button onclick="showChoreForm()">+ Add chore</button>${isAdmin ? '<button class="secondary" onclick="rotateChores()">⇄ Rotate Chores</button>' : ''}`;
    }

    setView(`
      <div id="msgSlot"></div>
      <div id="formSlot"></div>

      <div class="cards">
        <article><span>Total Chores</span><strong>${total}</strong><small>Household duties</small></article>
        <article><span>Pending</span><strong>${pending}</strong><small>Awaiting action</small></article>
        <article><span>Overdue</span><strong>${overdue}</strong><small>Needs attention</small></article>
        <article><span>Completed</span><strong>${completed}</strong><small>Finished tasks</small></article>
      </div>

      ${workload.length ? `
        <section class="panel" style="margin-bottom:22px">
          <h2>Roommate Workload (Last 28 Days)</h2>
          <p class="muted" style="margin-top:-10px;margin-bottom:14px;font-size:13px">Fair weekly rotation automatically assigns recurring chores to roommates with the lowest load.</p>
          <div class="workload-grid">
            ${workload.map(w => `
              <div class="workload-card">
                <div><b>${w.user.name}</b><small>${w.user.email}</small></div>
                <div class="stats">
                  <span class="badge ${w.assignedCount > 0 ? 'medium' : ''}">${w.assignedCount} assigned</span>
                  <small>${w.completedCount} completed</small>
                </div>
              </div>
            `).join('')}
          </div>
        </section>
      ` : ''}

      <section class="panel table-wrap">
        <table>
          <thead>
            <tr>
              <th>Chore</th>
              <th>Assignee</th>
              <th>Frequency</th>
              <th>Priority</th>
              <th>Due Date</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            ${items.map((item) => {
              const isAssignee = item.assignedTo?._id === currentUser._id;
              const isCreator = item.createdBy?._id === currentUser._id;
              const canComplete = item.status !== 'Completed' && (isAssignee || isAdmin);
              const canDelete = isCreator || isAdmin;

              return `
                <tr data-chore-id="${item._id}">
                  <td>
                    <b>${item.title}</b>
                    <small>${item.description || 'No description'}</small>
                  </td>
                  <td><b>${item.assignedTo?.name || 'Unassigned'}</b></td>
                  <td>${badge(item.frequency || 'Once')}</td>
                  <td>${badge(item.priority || 'Medium')}</td>
                  <td>
                    <b>${date(item.dueDate)}</b>
                    ${item.status === 'Overdue' ? ' <small style="color:var(--red)">(Overdue)</small>' : ''}
                  </td>
                  <td>${badge(item.status)}</td>
                  <td>
                    <div style="display:flex;gap:6px;align-items:center">
                      ${canComplete ? `<button class="small" onclick="completeChore('${item._id}')">✓ Done</button>` : ''}
                      ${canDelete ? `<button class="small secondary" onclick="deleteChore('${item._id}')" title="Delete">✕</button>` : ''}
                    </div>
                  </td>
                </tr>
              `;
            }).join('') || '<tr><td colspan="7" class="muted">No chores created yet. Add one above!</td></tr>'}
          </tbody>
        </table>
      </section>
    `);
  } catch (err) {
    setView(`<div class="empty"><h2>Error loading chores</h2><p>${err.message}</p></div>`);
  }
}

window.showChoreForm = async () => {
  try {
    const house = await api('/houses/current');
    document.querySelector('#formSlot').innerHTML = `
      <form class="panel inline-form" id="choreForm" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:10px;margin-bottom:20px">
        <input name="title" placeholder="Chore title" required>
        <input name="description" placeholder="Description (optional)">
        <select name="assignedTo" required>
          <option value="" disabled selected>Assign to roommate</option>
          ${house.members.map(m => `<option value="${m._id}">${m.name}</option>`).join('')}
        </select>
        <select name="frequency">
          <option value="Weekly" selected>Weekly Rotation</option>
          <option value="Once">One-time</option>
        </select>
        <select name="priority">
          <option value="Low">Low Priority</option>
          <option value="Medium" selected>Medium Priority</option>
          <option value="High">High Priority</option>
        </select>
        <input name="dueDate" type="date">
        <button style="grid-column:1/-1">Add Chore</button>
      </form>
    `;
    document.querySelector('#choreForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      try {
        const body = Object.fromEntries(new FormData(e.currentTarget));
        await api('/chores', { method: 'POST', body: JSON.stringify(body) });
        setBanner('Chore created and assigned successfully.');
        setTimeout(chores, 400);
      } catch (err) {
        setBanner(err.message, 'error');
      }
    });
  } catch (err) {
    setBanner(err.message, 'error');
  }
};

window.rotateChores = async () => {
  try {
    const res = await api('/chores/rotate', { method: 'POST', body: JSON.stringify({ force: true }) });
    setBanner(res.message);
    setTimeout(chores, 400);
  } catch (err) {
    setBanner(err.message, 'error');
  }
};

window.completeChore = async (id) => {
  try {
    await api(`/chores/${id}`, { method: 'PUT', body: JSON.stringify({ status: 'Completed' }) });
    setBanner('Chore marked as completed.');
    setTimeout(chores, 300);
  } catch (err) {
    setBanner(err.message, 'error');
  }
};

window.deleteChore = async (id) => {
  if (!confirm('Are you sure you want to delete this chore?')) return;
  try {
    const res = await api(`/chores/${id}`, { method: 'DELETE' });
    setBanner(res.message);
    setTimeout(chores, 300);
  } catch (err) {
    setBanner(err.message, 'error');
  }
};

// ==================== SHARED PANTRY & EXPIRY TRACKER ====================
let pantryCache = { items: [], summary: { total: 0, lowStock: 0, expiringSoon: 0 }, currentUser: null, houseData: null };

async function pantry() {
  document.body.innerHTML = shell('Shared Pantry & Tracker', '<button onclick="showPantryForm()">+ Add item</button>');

  try {
    const [data, currentUser, houseData] = await Promise.all([
      api('/pantry'),
      api('/auth/me'),
      api('/houses/current').catch(() => null)
    ]);

    if (!houseData) { noHouse(); bindHouseForms(); return; }

    pantryCache = { items: data.items, summary: data.summary, currentUser, houseData };
    renderPantryView(data.items, data.summary);
  } catch (err) {
    setView(`<div class="empty"><h2>Error loading pantry</h2><p>${err.message}</p></div>`);
  }
}

function renderPantryView(items, summary) {
  const { currentUser, houseData } = pantryCache;
  const isAdmin = houseData?.admin === currentUser?._id;

  setView(`
    <div id="msgSlot"></div>
    <div id="formSlot"></div>
    <div id="modalSlot"></div>

    <div class="cards">
      <article><span>Total Items</span><strong>${summary.total}</strong><small>In pantry</small></article>
      <article><span>Low Stock</span><strong>${summary.lowStock}</strong><small>Below threshold</small></article>
      <article><span>Out of Stock</span><strong>${summary.outOfStock || 0}</strong><small>Zero quantity</small></article>
      <article><span>Expiring Soon</span><strong>${summary.expiringSoon}</strong><small>Within 7 days or expired</small></article>
    </div>

    <div class="filter-bar">
      <input id="pantrySearch" placeholder="Search item name..." oninput="filterPantry()">
      <select id="pantryCategory" onchange="filterPantry()">
        <option value="">All Categories</option>
        <option>Produce</option>
        <option>Dairy</option>
        <option>Bakery</option>
        <option>Meat</option>
        <option>Pantry</option>
        <option>Snacks</option>
        <option>Beverages</option>
        <option>Spices</option>
        <option>Other</option>
      </select>
      <select id="pantryStatus" onchange="filterPantry()">
        <option value="">All Statuses</option>
        <option value="normal">Normal</option>
        <option value="lowStock">Low Stock</option>
        <option value="outOfStock">Out of Stock</option>
        <option value="expiringSoon">Expiring Soon</option>
        <option value="expired">Expired</option>
      </select>
    </div>

    <section class="panel table-wrap">
      <table>
        <thead>
          <tr>
            <th>Item</th>
            <th>Category</th>
            <th>Stock & Adjust</th>
            <th>Low Threshold</th>
            <th>Stock Status</th>
            <th>Expiry Status</th>
            <th>Purchased By</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody id="pantryTableBody">
          ${renderPantryRows(items, currentUser, isAdmin)}
        </tbody>
      </table>
    </section>
  `);
}

function renderPantryRows(items, currentUser, isAdmin) {
  if (!items.length) {
    return '<tr><td colspan="8" class="muted">No pantry items matching this view.</td></tr>';
  }

  return items.map((item) => {
    const isCreator = item.createdBy?._id === currentUser?._id;
    const canEdit = isCreator || isAdmin;
    const canDelete = isCreator || isAdmin;

    // Stock status badge
    let stockBadge = '<span class="badge fresh">Normal</span>';
    if (item.quantity === 0) {
      stockBadge = '<span class="badge overdue">Out of Stock</span>';
    } else if (item.quantity < item.lowStockThreshold) {
      stockBadge = '<span class="badge low-stock">Low Stock</span>';
    }

    // Expiry status badge
    let expiryBadge = '<span class="badge" style="color:var(--muted)">No Expiry</span>';
    if (item.expiryDate) {
      if (item.expired) {
        expiryBadge = '<span class="badge overdue">Expired</span>';
      } else if (item.expiringSoon) {
        expiryBadge = '<span class="badge pending">Expiring Soon</span>';
      } else {
        expiryBadge = '<span class="badge fresh">Fresh</span>';
      }
    }

    return `
      <tr data-pantry-id="${item._id}">
        <td>
          <b>${item.name}</b>
          <small>${item.notes || 'No notes'}</small>
        </td>
        <td>${badge(item.category || 'Other')}</td>
        <td>
          <div class="qty-ctrl">
            <button class="qty-btn" onclick="adjustPantry('${item._id}', -1)" title="Use 1 unit">−</button>
            <b>${item.quantity} ${item.unit}</b>
            <button class="qty-btn" onclick="adjustPantry('${item._id}', 1)" title="Add 1 unit">+</button>
          </div>
        </td>
        <td><b>${item.lowStockThreshold} ${item.unit}</b></td>
        <td>${stockBadge}</td>
        <td>
          <b>${date(item.expiryDate)}</b>
          ${expiryBadge}
        </td>
        <td>${item.purchasedBy?.name || 'Housemate'}</td>
        <td>
          <div style="display:flex;gap:6px;align-items:center">
            ${canEdit ? `<button class="small" onclick="showEditPantryModal('${item._id}')">Edit</button>` : ''}
            ${canDelete ? `<button class="small secondary" onclick="deletePantry('${item._id}')" title="Delete">✕</button>` : ''}
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

window.filterPantry = () => {
  const searchVal = document.querySelector('#pantrySearch')?.value.toLowerCase().trim() || '';
  const catVal = document.querySelector('#pantryCategory')?.value || '';
  const statusVal = document.querySelector('#pantryStatus')?.value || '';

  const filtered = pantryCache.items.filter((item) => {
    const matchesSearch = !searchVal || item.name.toLowerCase().includes(searchVal);
    const matchesCategory = !catVal || item.category === catVal;
    let matchesStatus = true;
    if (statusVal === 'normal') matchesStatus = !item.lowStock && !item.outOfStock && item.quantity >= item.lowStockThreshold && item.quantity > 0;
    else if (statusVal === 'lowStock') matchesStatus = item.lowStock;
    else if (statusVal === 'outOfStock') matchesStatus = item.outOfStock;
    else if (statusVal === 'expiringSoon') matchesStatus = item.expiringSoon;
    else if (statusVal === 'expired') matchesStatus = item.expired;

    return matchesSearch && matchesCategory && matchesStatus;
  });

  const tbody = document.querySelector('#pantryTableBody');
  if (tbody) {
    const isAdmin = pantryCache.houseData?.admin === pantryCache.currentUser?._id;
    tbody.innerHTML = renderPantryRows(filtered, pantryCache.currentUser, isAdmin);
  }
};

window.showPantryForm = () => {
  document.querySelector('#formSlot').innerHTML = `
    <div class="pantry-form">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:18px">
        <h2 style="margin:0;font:600 22px 'Playfair Display',serif">Add Pantry Item</h2>
        <button type="button" class="small secondary" onclick="document.querySelector('#formSlot').innerHTML=''">✕ Close</button>
      </div>
      <form id="pantryForm" class="form-grid">
        <div class="form-group">
          <label for="pantryName">Item Name <span style="color:var(--red)">*</span></label>
          <input id="pantryName" name="name" placeholder="e.g. Basmati Rice" required>
        </div>

        <div class="form-group">
          <label for="pantryCategorySelect">Category <span style="color:var(--red)">*</span></label>
          <select id="pantryCategorySelect" name="category" required>
            <option>Produce</option>
            <option selected>Dairy</option>
            <option>Bakery</option>
            <option>Meat</option>
            <option>Pantry</option>
            <option>Snacks</option>
            <option>Beverages</option>
            <option>Spices</option>
            <option>Other</option>
          </select>
        </div>

        <div class="form-group">
          <label for="pantryQty">Quantity <span style="color:var(--red)">*</span></label>
          <input id="pantryQty" name="quantity" type="number" step="any" min="0" placeholder="e.g. 5" value="1" required>
        </div>

        <div class="form-group">
          <label for="pantryUnit">Unit <span style="color:var(--red)">*</span></label>
          <input id="pantryUnit" name="unit" placeholder="e.g. kg, litres, packets, pcs" value="pcs" required>
        </div>

        <div class="form-group">
          <label for="pantryThreshold">Low-Stock Threshold</label>
          <input id="pantryThreshold" name="lowStockThreshold" type="number" step="any" min="0" placeholder="e.g. 2" value="1">
          <small class="helper-text">Get a low-stock warning when the quantity falls below this value.</small>
        </div>

        <div class="form-group">
          <label for="pantryExpiry">Expiry Date</label>
          <input id="pantryExpiry" name="expiryDate" type="date">
          <small class="helper-text">When this item expires</small>
        </div>

        <div class="form-group">
          <label for="pantryPurchase">Purchase Date</label>
          <input id="pantryPurchase" name="purchaseDate" type="date">
          <small class="helper-text">When this item was bought</small>
        </div>

        <div class="form-group form-group-full">
          <label for="pantryNotes">Notes (Optional)</label>
          <input id="pantryNotes" name="notes" placeholder="Storage shelf, brand, or dietary notes">
        </div>

        <div class="form-actions">
          <button type="button" class="secondary" onclick="document.querySelector('#formSlot').innerHTML=''">Cancel</button>
          <button type="submit">Add to Pantry</button>
        </div>
      </form>
    </div>
  `;

  document.querySelector('#pantryForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    try {
      const body = Object.fromEntries(new FormData(e.currentTarget));
      if (body.purchaseDate && body.expiryDate && new Date(body.expiryDate) < new Date(body.purchaseDate)) {
        throw new Error('Expiry date cannot be before purchase date.');
      }
      await api('/pantry', { method: 'POST', body: JSON.stringify(body) });
      setBanner('Item added to shared pantry.');
      setTimeout(pantry, 300);
    } catch (err) {
      setBanner(err.message, 'error');
    }
  });
};

window.adjustPantry = async (id, change) => {
  try {
    await api(`/pantry/${id}/adjust`, { method: 'POST', body: JSON.stringify({ change }) });
    pantry();
  } catch (err) {
    setBanner(err.message, 'error');
  }
};

window.showEditPantryModal = (id) => {
  const item = pantryCache.items.find(i => i._id === id);
  if (!item) return;

  const fmtDate = (d) => d ? new Date(d).toISOString().slice(0, 10) : '';

  document.querySelector('#modalSlot').innerHTML = `
    <div class="modal-overlay" onclick="if(event.target === this) this.remove()">
      <div class="modal-card">
        <h2>Edit ${item.name}</h2>
        <form id="editPantryForm">
          <div class="form-group">
            <label for="editPantryName">Item Name</label>
            <input id="editPantryName" name="name" value="${item.name}" required>
          </div>
          <div class="form-group">
            <label for="editPantryCategory">Category</label>
            <select id="editPantryCategory" name="category">
              ${['Produce','Dairy','Bakery','Meat','Pantry','Snacks','Beverages','Spices','Other'].map(c => `
                <option ${item.category === c ? 'selected' : ''}>${c}</option>
              `).join('')}
            </select>
          </div>
          <div class="form-group">
            <label for="editPantryQty">Quantity</label>
            <input id="editPantryQty" name="quantity" type="number" step="any" min="0" value="${item.quantity}" required>
          </div>
          <div class="form-group">
            <label for="editPantryUnit">Unit</label>
            <input id="editPantryUnit" name="unit" value="${item.unit}" required>
          </div>
          <div class="form-group">
            <label for="editPantryThreshold">Low-Stock Threshold</label>
            <input id="editPantryThreshold" name="lowStockThreshold" type="number" step="any" min="0" value="${item.lowStockThreshold || 0}">
            <small class="helper-text">Get a low-stock warning when the quantity falls below this value.</small>
          </div>
          <div class="form-group">
            <label for="editPantryExpiry">Expiry Date</label>
            <input id="editPantryExpiry" name="expiryDate" type="date" value="${fmtDate(item.expiryDate)}">
            <small class="helper-text">When this item expires</small>
          </div>
          <div class="form-group">
            <label for="editPantryPurchase">Purchase Date</label>
            <input id="editPantryPurchase" name="purchaseDate" type="date" value="${fmtDate(item.purchaseDate)}">
            <small class="helper-text">When this item was bought</small>
          </div>
          <div class="form-group">
            <label for="editPantryNotes">Notes (Optional)</label>
            <input id="editPantryNotes" name="notes" value="${item.notes || ''}">
          </div>
          <div class="modal-actions">
            <button type="button" class="secondary" onclick="document.querySelector('.modal-overlay').remove()">Cancel</button>
            <button type="submit">Save Changes</button>
          </div>
        </form>
      </div>
    </div>
  `;

  document.querySelector('#editPantryForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    try {
      const body = Object.fromEntries(new FormData(e.currentTarget));
      if (body.purchaseDate && body.expiryDate && new Date(body.expiryDate) < new Date(body.purchaseDate)) {
        throw new Error('Expiry date cannot be before purchase date.');
      }
      await api(`/pantry/${id}`, { method: 'PUT', body: JSON.stringify(body) });
      document.querySelector('.modal-overlay')?.remove();
      setBanner('Pantry item updated successfully.');
      setTimeout(pantry, 300);
    } catch (err) {
      alert(err.message);
    }
  });
};

window.deletePantry = (id) => {
  const item = pantryCache.items.find((i) => i._id === id);
  if (!item) return;

  const modalSlot = document.querySelector('#modalSlot');
  if (!modalSlot) return;

  modalSlot.innerHTML = `
    <div class="modal-overlay" id="deletePantryModal">
      <div class="modal-card">
        <h2>Delete Pantry Item</h2>

        <p>
          Are you sure you want to remove
          <strong>${item.name}</strong> from your pantry?
        </p>

        <p class="muted">This action cannot be undone.</p>

        <div class="modal-actions">
          <button
            type="button"
            class="secondary"
            onclick="document.querySelector('#deletePantryModal')?.remove()">
            Cancel
          </button>

          <button
            type="button"
            id="confirmDeletePantry"
            style="background:var(--red)">
            Delete
          </button>
        </div>
      </div>
    </div>
  `;

  document.querySelector('#confirmDeletePantry')
    .addEventListener('click', async (event) => {
      const button = event.currentTarget;
      button.disabled = true;
      button.textContent = 'Deleting...';

      try {
        const res = await api(`/pantry/${id}`, {
          method: 'DELETE'
        });

        document.querySelector('#deletePantryModal')?.remove();
        await pantry();
        setBanner(res.message || 'Pantry item deleted successfully.');
      } catch (err) {
        button.disabled = false;
        button.textContent = 'Delete';
        setBanner(err.message || 'Could not delete pantry item.', 'error');
      }
    });
};



// ==================== NOTIFICATIONS ====================
async function notifications() {
  document.body.innerHTML = shell('Notifications');
  const items = await api('/notifications');
  setView(`
    <section class="panel">
      ${items.map((item) => `
        <div class="notification ${item.read ? '' : 'unread'}">
          <span>◉</span>
          <div><b>${item.type}</b><p>${item.message}</p><small>${date(item.createdAt)}</small></div>
          ${!item.read ? `<button class="small" onclick="readNote('${item._id}')">Read</button>` : ''}
        </div>`).join('') || '<p class="muted">You are all caught up.</p>'}
    </section>
  `);
}

window.readNote = async (id) => {
  await api(`/notifications/${id}/read`, { method: 'PUT' });
  location.reload();
};

// ==================== RENT ====================
async function rent() {
  document.body.innerHTML = shell('Rent');
  const [data, me] = await Promise.all([api('/rent'), api('/auth/me')]);
  if (!data.house) { noHouse(); bindHouseForms(); return; }
  const share = data.house.monthlyRent / data.house.members.length;
  const admin = data.house.admin === me._id;
  setView(`
    <div class="cards">
      <article><span>Total monthly rent</span><strong>${money(data.house.monthlyRent)}</strong></article>
      <article><span>Your monthly share</span><strong>${money(share)}</strong></article>
      <article><span>Due date</span><strong>${data.house.rentDueDay}th</strong><small>of every month</small></article>
    </div>
    <section class="panel table-wrap">
      <table>
        <thead><tr><th>Member</th><th>Share</th><th>Status</th><th></th></tr></thead>
        <tbody>
          ${data.payments.map((payment) => `
            <tr>
              <td>${payment.user.name}</td>
              <td>${money(payment.amount)}</td>
              <td>${badge(payment.status)}</td>
              <td>${admin && payment.status !== 'Paid' ? `<button class="small" onclick="markRentPaid('${payment._id}')">Mark paid</button>` : ''}</td>
            </tr>`).join('') || '<tr><td colspan="4" class="muted">Set a monthly rent in My House to begin tracking payments.</td></tr>'}
        </tbody>
      </table>
    </section>
  `);
}

window.markRentPaid = async (id) => {
  await api(`/rent/${id}`, { method: 'PUT', body: JSON.stringify({ status: 'Paid' }) });
  location.reload();
};

// ==================== PROFILE ====================
async function profile() {
  document.body.innerHTML = shell('My Profile');
  const user = await api('/auth/me');
  setView(`
    <section class="panel profile">
      <div class="avatar">${user.name[0]}</div>
      <h2>${user.name}</h2>
      <p>${user.email}</p>
      <p class="muted">${user.house ? 'You are connected to a shared house.' : 'Create or join a house to get started.'}</p>
    </section>
  `);
}

// Router dispatcher
({
  dashboard,
  house,
  expenses,
  settlements,
  maintenance: () => feature('maintenance', 'Maintenance'),
  chores,
  pantry,
  notifications,
  rent,
  profile
})[page]();
