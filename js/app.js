const chatMessages = document.getElementById('chat-messages');
const chatForm = document.getElementById('chat-form');
const userInput = document.getElementById('user-input');

// Initialize Netlify Identity
if (window.netlifyIdentity) {
  window.netlifyIdentity.on("init", user => {
    if (!user) {
      appendMessage("ai", "Welcome! Please navigate to `/admin.html` to log in securely. The AI is locked to prevent unauthorized API usage.");
      userInput.disabled = true;
    }
  });
}

function appendMessage(sender, text) {
  const msgDiv = document.createElement('div');
  msgDiv.classList.add('message', sender);
  
  const contentDiv = document.createElement('div');
  contentDiv.classList.add('markdown-body');
  
  if (sender === 'ai') {
    // Parse markdown for AI responses
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
  
  const user = window.netlifyIdentity && window.netlifyIdentity.currentUser();
  if (!user) {
    appendMessage('ai', 'Error: You must be logged in to use the AI. Visit `/admin.html` to log in.');
    return;
  }

  const text = userInput.value.trim();
  if (!text) return;

  // Show user message
  appendMessage('user', text);
  userInput.value = '';
  
  showTypingIndicator();

  try {
    const token = await user.jwt();
    
    // Call the Netlify Function
    const response = await fetch('/.netlify/functions/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ message: text })
    });

    if (!response.ok) {
      if (response.status === 401) {
         throw new Error("Unauthorized. Please log in again.");
      }
      throw new Error(`Server responded with status ${response.status}`);
    }

    const data = await response.json();
    removeTypingIndicator();
    appendMessage('ai', data.reply);
    
  } catch (error) {
    removeTypingIndicator();
    appendMessage('ai', `Sorry, an error occurred: ${error.message}`);
    console.error(error);
  }
});
