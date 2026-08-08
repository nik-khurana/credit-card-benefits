const chatMessages = document.getElementById('chat-messages');
const chatForm = document.getElementById('chat-form');
const userInput = document.getElementById('user-input');

// Theme logic
const themeToggleBtn = document.getElementById('theme-toggle');
const themeIcon = document.getElementById('theme-icon');

const savedTheme = localStorage.getItem('theme') || 'dark';
if (savedTheme === 'light') {
  document.documentElement.setAttribute('data-theme', 'light');
  themeIcon.innerHTML = '<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>';
}

if (themeToggleBtn) {
  themeToggleBtn.addEventListener('click', () => {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    
    if (newTheme === 'light') {
      document.documentElement.setAttribute('data-theme', 'light');
      themeIcon.innerHTML = '<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>';
    } else {
      document.documentElement.removeAttribute('data-theme');
      themeIcon.innerHTML = '<circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>';
    }
    
    localStorage.setItem('theme', newTheme);
  });
}

const chatContainer = document.getElementById('chat-container');
const benefitsSelect = document.getElementById('benefits-select');
const categorySelect = document.getElementById('category-select');

let chatHistory = [];

function getCardsList() {
  try {
    const saved = localStorage.getItem('user_cards');
    if (saved) return JSON.parse(saved);
  } catch(e) {}
  
  return [
    "Chase Freedom Unlimited", "Chase Freedom Flex", "Chase Sapphire Preferred",
    "Chase Amazon Prime Visa", "Discover IT Card", "Apple Card",
    "Bank of America Unlimited Rewards", "Bank of America Travel Rewards",
    "Bilt Blue Card", "Amex Gold", "Amex Blue Cash Everyday"
  ];
}

function populateBenefitsDropdown() {
  if (!benefitsSelect) return;
  const cards = getCardsList();
  
  // Clear existing options except the first one
  benefitsSelect.innerHTML = '<option value="">View Card Benefits...</option>';
  
  cards.forEach(card => {
    const opt = document.createElement('option');
    opt.value = card;
    opt.textContent = card;
    benefitsSelect.appendChild(opt);
  });
}

// Initialize dropdown
populateBenefitsDropdown();

if (benefitsSelect) {
  benefitsSelect.addEventListener('change', (e) => {
    const selectedCard = e.target.value;
    if (selectedCard) {
      // Reset dropdown
      benefitsSelect.value = '';
      
      // Auto-populate chat and send
      userInput.value = `Please list all the detailed benefits and reward categories for my ${selectedCard}.`;
      chatForm.dispatchEvent(new Event('submit'));
    }
  });
}

if (categorySelect) {
  categorySelect.addEventListener('change', (e) => {
    const selectedCategory = e.target.value;
    if (selectedCategory) {
      // Reset dropdown
      categorySelect.value = '';
      
      // Auto-populate chat and send
      userInput.value = `I am about to spend money on ${selectedCategory}. Which of my cards should I use to maximize rewards, and what is the reward rate?`;
      chatForm.dispatchEvent(new Event('submit'));
    }
  });
}


function appendMessage(sender, text) {
  const msgDiv = document.createElement('div');
  msgDiv.classList.add('message', sender);
  
  const contentDiv = document.createElement('div');
  contentDiv.classList.add('markdown-body');
  
  if (sender === 'ai') {
    contentDiv.innerHTML = marked.parse(text);
  } else {
    contentDiv.textContent = text;
  }
  
  msgDiv.appendChild(contentDiv);
  chatMessages.appendChild(msgDiv);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

function showTypingIndicator() {
  const typingDiv = document.createElement('div');
  typingDiv.classList.add('typing-indicator');
  typingDiv.id = 'typing-indicator';
  typingDiv.innerHTML = '<span></span><span></span><span></span>';
  chatMessages.appendChild(typingDiv);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

function removeTypingIndicator() {
  const typingDiv = document.getElementById('typing-indicator');
  if (typingDiv) {
    typingDiv.remove();
  }
}

chatForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const text = userInput.value.trim();
  if (!text) return;

  appendMessage('user', text);
  userInput.value = '';
  showTypingIndicator();

  chatHistory.push({ role: 'user', content: text });
  
  try {
    let savedCards = [];
    try {
      savedCards = JSON.parse(localStorage.getItem('user_cards')) || [];
    } catch(e) {}

    const response = await fetch('/.netlify/functions/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ messages: chatHistory, cards: savedCards })
    });

    if (!response.ok) {
      throw new Error(`Server responded with status ${response.status}`);
    }

    const data = await response.json();
    removeTypingIndicator();
    
    if (data.reply) {
      chatHistory.push({ role: 'assistant', content: data.reply });
      
      // Keep history from getting too large (last 10 messages)
      if (chatHistory.length > 10) {
        chatHistory = chatHistory.slice(chatHistory.length - 10);
      }
      
      appendMessage('ai', data.reply);
    } else if (data.error) {
      // Revert the user message if there was an error
      chatHistory.pop();
      appendMessage('ai', `Error: ${data.error}`);
    }
    
  } catch (error) {
    // Revert the user message if there was a network error
    chatHistory.pop();
    removeTypingIndicator();
    appendMessage('ai', `Sorry, an error occurred: ${error.message}`);
    console.error(error);
  }
});
