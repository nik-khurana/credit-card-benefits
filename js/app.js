const chatMessages = document.getElementById('chat-messages');
const chatForm = document.getElementById('chat-form');
const userInput = document.getElementById('user-input');

// Passcode logic
const loginOverlay = document.getElementById('login-overlay');
const loginForm = document.getElementById('login-form');
const passcodeInput = document.getElementById('passcode-input');
const loginError = document.getElementById('login-error');
const chatContainer = document.getElementById('chat-container');

let currentPasscode = localStorage.getItem('admin_passcode') || '';

if (currentPasscode) {
  unlockChat();
}

loginForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const passcode = passcodeInput.value.trim();
  if (passcode) {
    currentPasscode = passcode;
    localStorage.setItem('admin_passcode', passcode);
    unlockChat();
  }
});

function unlockChat() {
  loginOverlay.classList.add('hidden');
  chatContainer.classList.remove('hidden');
}

function lockChat() {
  currentPasscode = '';
  localStorage.removeItem('admin_passcode');
  passcodeInput.value = '';
  loginOverlay.classList.remove('hidden');
  chatContainer.classList.add('hidden');
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

  try {
    const response = await fetch('/.netlify/functions/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': currentPasscode
      },
      body: JSON.stringify({ message: text })
    });

    if (!response.ok) {
      if (response.status === 401) {
        lockChat();
        loginError.textContent = "Incorrect passcode.";
        loginError.style.display = 'block';
        throw new Error("Unauthorized. Incorrect passcode.");
      }
      throw new Error(`Server responded with status ${response.status}`);
    }

    const data = await response.json();
    removeTypingIndicator();
    
    if (data.reply) {
      appendMessage('ai', data.reply);
    } else if (data.error) {
      appendMessage('ai', `Error: ${data.error}`);
    }
    
  } catch (error) {
    removeTypingIndicator();
    appendMessage('ai', `Sorry, an error occurred: ${error.message}`);
    console.error(error);
  }
});
