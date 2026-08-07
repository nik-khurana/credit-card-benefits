const chatMessages = document.getElementById('chat-messages');
const chatForm = document.getElementById('chat-form');
const userInput = document.getElementById('user-input');

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
  
  const text = userInput.value.trim();
  if (!text) return;

  // Show user message
  appendMessage('user', text);
  userInput.value = '';
  
  showTypingIndicator();

  try {
    // Call the Netlify Function directly (publicly accessible now)
    const response = await fetch('/.netlify/functions/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ message: text })
    });

    if (!response.ok) {
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
