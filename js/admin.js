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
  try {
    const res = await fetch('/.netlify/functions/cards', {
      headers: {
        'Authorization': passcode
      }
    });
    
    if (res.ok) {
      const data = await res.json();
      cards = data.cards || [];
      currentPasscode = passcode;
      localStorage.setItem('admin_passcode', passcode);
      renderCards();
      showAdminPanel();
    } else {
      if (res.status === 401) {
        throw new Error("Incorrect passcode.");
      }
      throw new Error("Failed to connect to server.");
    }
  } catch (err) {
    currentPasscode = '';
    localStorage.removeItem('admin_passcode');
    loginError.textContent = err.message;
    loginError.style.display = 'block';
    showLoginOverlay();
  }
}

async function saveCards() {
  if (!currentPasscode) return;
  
  await fetch('/.netlify/functions/cards', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': currentPasscode
    },
    body: JSON.stringify({ cards })
  });
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
