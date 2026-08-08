const loginOverlay = document.getElementById('login-overlay');
const loginForm = document.getElementById('login-form');
const passcodeInput = document.getElementById('passcode-input');
const loginError = document.getElementById('login-error');
const adminPanel = document.getElementById('admin-panel');
const logoutBtn = document.getElementById('logout-btn');
const cardListEl = document.getElementById('card-list');
const addCardForm = document.getElementById('add-card-form');
const newCardInput = document.getElementById('new-card-input');

let cards = [];
let currentPasscode = localStorage.getItem('admin_passcode') || '';

// Check if we already have a passcode on load
if (currentPasscode) {
  attemptLogin(currentPasscode);
}

loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  loginError.style.display = 'none';
  const passcode = passcodeInput.value.trim();
  if (passcode) {
    await attemptLogin(passcode);
  }
});

logoutBtn.addEventListener('click', () => {
  currentPasscode = '';
  localStorage.removeItem('admin_passcode');
  passcodeInput.value = '';
  showLoginOverlay();
});

function showAdminPanel() {
  loginOverlay.classList.add('hidden');
  adminPanel.classList.remove('hidden');
}

function showLoginOverlay() {
  loginOverlay.classList.remove('hidden');
  adminPanel.classList.add('hidden');
}

async function attemptLogin(passcode) {
  // Simple check: we don't have a backend to verify this anymore, so we trust it locally,
  // but it's used to authenticate chat requests. If they enter a bad passcode,
  // the chat backend will fail them with 401 anyway.
  currentPasscode = passcode;
  localStorage.setItem('admin_passcode', passcode);
  
  // Load cards from local storage
  try {
    const saved = localStorage.getItem('user_cards');
    if (saved) cards = JSON.parse(saved);
  } catch(e) {}

  if (cards.length === 0) {
    cards = [
      "Chase Freedom Unlimited", "Chase Freedom Flex", "Chase Sapphire Preferred",
      "Chase Amazon Prime Visa", "Discover IT Card", "Apple Card",
      "Bank of America Unlimited Rewards", "Bank of America Travel Rewards",
      "Bilt Blue Card", "Amex Gold", "Amex Blue Cash Everyday"
    ];
    await saveCards();
  }

  renderCards();
  showAdminPanel();
}

async function saveCards() {
  if (!currentPasscode) return;
  localStorage.setItem('user_cards', JSON.stringify(cards));
}

function renderCards() {
  cardListEl.innerHTML = '';
  if (cards.length === 0) {
    cardListEl.innerHTML = '<p style="color:var(--text-muted)">No cards added yet.</p>';
    return;
  }
  
  cards.forEach((card, index) => {
    const item = document.createElement('div');
    item.className = 'card-item';
    item.innerHTML = `
      <span>${card}</span>
      <button class="btn-remove" onclick="removeCard(${index})">Remove</button>
    `;
    cardListEl.appendChild(item);
  });
}

window.removeCard = async function(index) {
  cards.splice(index, 1);
  renderCards();
  await saveCards();
}

addCardForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const newCard = newCardInput.value.trim();
  if (newCard) {
    cards.push(newCard);
    newCardInput.value = '';
    renderCards();
    await saveCards();
  }
});
