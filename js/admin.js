const loginOverlay = document.getElementById('login-overlay');
const loginBtn = document.getElementById('login-btn');
const adminPanel = document.getElementById('admin-panel');
const logoutBtn = document.getElementById('logout-btn');
const cardListEl = document.getElementById('card-list');
const addCardForm = document.getElementById('add-card-form');
const newCardInput = document.getElementById('new-card-input');

let cards = [];

if (window.netlifyIdentity) {
  // Check on load
  window.netlifyIdentity.on('init', user => {
    if (user) {
      showAdminPanel();
    }
  });
  
  window.netlifyIdentity.on('login', user => {
    window.netlifyIdentity.close();
    showAdminPanel();
  });

  window.netlifyIdentity.on('logout', () => {
    showLoginOverlay();
  });
}

loginBtn.addEventListener('click', () => {
  window.netlifyIdentity.open();
});

logoutBtn.addEventListener('click', () => {
  window.netlifyIdentity.logout();
});

function showAdminPanel() {
  loginOverlay.classList.add('hidden');
  adminPanel.classList.remove('hidden');
  fetchCards();
}

function showLoginOverlay() {
  loginOverlay.classList.remove('hidden');
  adminPanel.classList.add('hidden');
}

async function fetchCards() {
  cardListEl.innerHTML = '<p style="color:var(--text-muted)">Loading cards...</p>';
  try {
    const user = window.netlifyIdentity.currentUser();
    const token = await user.jwt();
    
    const res = await fetch('/.netlify/functions/cards', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!res.ok) throw new Error("Failed to fetch");
    const data = await res.json();
    cards = data.cards || [];
    renderCards();
  } catch (err) {
    cardListEl.innerHTML = `<p style="color:var(--danger)">Error: ${err.message}</p>`;
  }
}

async function saveCards() {
  const user = window.netlifyIdentity.currentUser();
  const token = await user.jwt();
  
  await fetch('/.netlify/functions/cards', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
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
