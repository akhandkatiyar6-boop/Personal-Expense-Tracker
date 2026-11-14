/* ==============================================
   Personal Expense Tracker - script.js
   Beginner-friendly jQuery Implementation
   ============================================== */

$(document).ready(function () {
  // 1. Array to store all expense objects
  let expenses = [];

  /* --------------------------------------------------
     LOCALSTORAGE FUNCTIONS
  -------------------------------------------------- */

  // Save the expenses array to browser LocalStorage
  function saveExpensesToLocalStorage() {
    localStorage.setItem('expenses', JSON.stringify(expenses));
  }

  // Read expenses from LocalStorage when page loads
  function loadExpensesFromLocalStorage() {
    const saved = localStorage.getItem('expenses');
    if (saved) {
      try {
        expenses = JSON.parse(saved);
      } catch (error) {
        expenses = [];
      }
    }
  }

  /* --------------------------------------------------
     HELPER FUNCTIONS
  -------------------------------------------------- */

  // Set today's date as default in the date input
  function setDefaultDate() {
    const today = new Date().toISOString().split('T')[0];
    $('#expenseDate').val(today);
  }

  // Display current date in the header
  function displayCurrentDate() {
    const today = new Date();
    const options = { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' };
    $('#currentDate').text(today.toLocaleDateString('en-US', options));
  }

  // Format date string for table display (YYYY-MM-DD -> DD Mon YYYY)
  function formatDate(dateStr) {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length !== 3) return dateStr;
    const dateObj = new Date(
      parseInt(parts[0], 10),
      parseInt(parts[1], 10) - 1,
      parseInt(parts[2], 10)
    );
    return dateObj.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  }

  // Prevent XSS injection
  function escapeHtml(text) {
    return $('<div>').text(text).html();
  }

  /* --------------------------------------------------
     SUMMARY & TABLE RENDERING
  -------------------------------------------------- */

  // Update summary: Total Expenses & Number of Expenses
  function updateSummary() {
    const total = expenses.reduce(function (sum, item) {
      return sum + parseFloat(item.amount);
    }, 0);

    $('#totalAmount').text('$' + total.toFixed(2));
    $('#totalCount').text(expenses.length);
  }

  // Generate Bootstrap badges for categories
  function getCategoryBadge(category) {
    const badgeColors = {
      Food: 'bg-warning-subtle text-warning-emphasis border border-warning-subtle',
      Travel: 'bg-info-subtle text-info-emphasis border border-info-subtle',
      Shopping: 'bg-primary-subtle text-primary-emphasis border border-primary-subtle',
      Bills: 'bg-danger-subtle text-danger-emphasis border border-danger-subtle',
      Other: 'bg-secondary-subtle text-secondary-emphasis border border-secondary-subtle'
    };
    const colorClass = badgeColors[category] || 'bg-light text-dark border';
    return `<span class="badge rounded-pill category-badge ${colorClass}">${escapeHtml(category)}</span>`;
  }

  // Render expenses in the table (supports search & category filter)
  function renderTable() {
    const searchVal = $('#searchName').val().trim().toLowerCase();
    const categoryVal = $('#filterCategory').val();

    // Filter list by name and category
    const filtered = expenses.filter(function (item) {
      const matchName = item.name.toLowerCase().includes(searchVal);
      const matchCategory = !categoryVal || item.category === categoryVal;
      return matchName && matchCategory;
    });

    const $tbody = $('#expenseTableBody');
    $tbody.empty();

    if (filtered.length === 0) {
      $('#expenseTable').hide();
      $('#emptyState').show();
      $('.empty-text').text('No expenses found.');
      $('.empty-sub').text(
        expenses.length === 0
          ? 'Add your first expense using the form.'
          : 'Try adjusting or clearing your filters.'
      );
    } else {
      $('#emptyState').hide();
      $('#expenseTable').show();

      filtered.forEach(function (item) {
        const rowHtml = `
          <tr data-id="${item.id}">
            <td class="ps-3 fw-medium text-dark">${escapeHtml(item.name)}</td>
            <td class="amount-cell">$${parseFloat(item.amount).toFixed(2)}</td>
            <td class="category-cell">${getCategoryBadge(item.category)}</td>
            <td class="date-cell text-muted small">${formatDate(item.date)}</td>
            <td class="action-cell text-center pe-3">
              <button class="btn btn-outline-danger btn-sm btn-delete py-1 px-2" data-id="${item.id}" title="Delete expense">
                <i class="bi bi-trash3 me-1"></i>Delete
              </button>
            </td>
          </tr>
        `;
        $tbody.append(rowHtml);
      });
    }

    // Always update summary numbers
    updateSummary();
  }

  /* --------------------------------------------------
     FORM VALIDATION
  -------------------------------------------------- */
  function validateForm() {
    let isValid = true;

    // 1. Expense name is not empty
    const name = $('#expenseName').val().trim();
    if (!name) {
      $('#expenseName').addClass('is-invalid');
      isValid = false;
    } else {
      $('#expenseName').removeClass('is-invalid');
    }

    // 2. Amount is greater than 0
    const amountVal = $('#expenseAmount').val();
    const amount = parseFloat(amountVal);
    if (!amountVal || isNaN(amount) || amount <= 0) {
      $('#expenseAmount').addClass('is-invalid');
      isValid = false;
    } else {
      $('#expenseAmount').removeClass('is-invalid');
    }

    // 3. Category is selected
    const category = $('#expenseCategory').val();
    if (!category) {
      $('#expenseCategory').addClass('is-invalid');
      isValid = false;
    } else {
      $('#expenseCategory').removeClass('is-invalid');
    }

    // 4. Date is selected
    const date = $('#expenseDate').val();
    if (!date) {
      $('#expenseDate').addClass('is-invalid');
      isValid = false;
    } else {
      $('#expenseDate').removeClass('is-invalid');
    }

    return isValid;
  }

  /* --------------------------------------------------
     ADD EXPENSE - FORM SUBMISSION
  -------------------------------------------------- */
  $('#expenseForm').on('submit', function (e) {
    e.preventDefault();

    // Step 1: Validate input fields
    if (!validateForm()) {
      return;
    }

    // Step 2: Create an expense object containing id, name, amount, category, date
    const newExpense = {
      id: Date.now(), // Unique ID using timestamp
      name: $('#expenseName').val().trim(),
      amount: parseFloat($('#expenseAmount').val()).toFixed(2),
      category: $('#expenseCategory').val(),
      date: $('#expenseDate').val()
    };

    // Step 3: Add the expense to the array
    expenses.unshift(newExpense);

    // Step 4: Save the array to browser LocalStorage
    saveExpensesToLocalStorage();

    // Step 5: Display the expense immediately in the table & Step 6: Update summary
    renderTable();

    // Step 7: Clear the form after successfully adding an expense
    $('#expenseForm')[0].reset();
    $('#expenseName, #expenseAmount, #expenseCategory, #expenseDate').removeClass('is-invalid');
    setDefaultDate();
  });

  // Clear validation error when user begins correcting the field
  $('#expenseName, #expenseAmount, #expenseCategory, #expenseDate').on('input change', function () {
    $(this).removeClass('is-invalid');
  });

  /* --------------------------------------------------
     DELETE EXPENSE
  -------------------------------------------------- */
  $('#expenseTableBody').on('click', '.btn-delete', function () {
    const expenseId = $(this).data('id');

    // Remove only that expense from the array
    expenses = expenses.filter(function (item) {
      return String(item.id) !== String(expenseId);
    });

    // Save updated array to LocalStorage
    saveExpensesToLocalStorage();

    // Refresh the table and update the summary
    renderTable();
  });

  /* --------------------------------------------------
     FILTER & SEARCH HANDLERS
  -------------------------------------------------- */
  $('#searchName').on('input', function () {
    renderTable();
  });

  $('#filterCategory').on('change', function () {
    renderTable();
  });

  $('#clearFilterBtn').on('click', function () {
    $('#searchName').val('');
    $('#filterCategory').val('');
    renderTable();
  });

  /* --------------------------------------------------
     PAGE LOAD INITIALIZATION
     - Read expenses from LocalStorage
     - Display them in the table
     - Update the summary
     (Data remains after refreshing or reopening browser)
  -------------------------------------------------- */
  displayCurrentDate();
  setDefaultDate();
  loadExpensesFromLocalStorage();
  renderTable();
});
