// popup.js - Handles the UI functionality of the extension

// DOM elements
const queueContainer = document.getElementById('queue-container');
const queueList = document.getElementById('queue-list');
const emptyState = document.getElementById('empty-state');
const researchPanel = document.getElementById('research-panel');
const researchTitle = document.getElementById('research-title');
const backBtn = document.getElementById('back-btn');
const googleFrame = document.getElementById('google-frame');
const chatgptResponse = document.getElementById('chatgpt-response');
const apiKeyMissing = document.getElementById('api-key-missing');
const tabBtns = document.querySelectorAll('.tab-btn');
const tabPanes = document.querySelectorAll('.tab-pane');
const googleLoading = document.querySelector('#google-results .loading-container');
const chatgptLoading = document.querySelector('#chatgpt-results .loading-container');
const settingsBtn = document.getElementById('settings-btn');
const settingsPanel = document.getElementById('settings-panel');
const closeSettingsBtn = document.getElementById('close-settings-btn');
const openaiKeyInput = document.getElementById('openai-key');
const themeSelect = document.getElementById('theme-select');
const saveSettingsBtn = document.getElementById('save-settings');

// State
let currentItem = null;
let queue = [];
let openAiKey = '';
let selectedTheme = 'dark';

// Initialize
loadQueue();
loadSettings();
setupEventListeners();

// Load queue from storage
function loadQueue() {
  browser.storage.local.get('queue', (data) => {
    queue = data.queue || [];
    renderQueue();
  });
}

// Load settings from storage
function loadSettings() {
  browser.storage.local.get(['openAiKey', 'theme'], (data) => {
    openAiKey = data.openAiKey || '';
    openaiKeyInput.value = openAiKey;
    
    selectedTheme = data.theme || 'dark';
    themeSelect.value = selectedTheme;
    applyTheme(selectedTheme);
  });
}

// Apply theme
function applyTheme(theme) {
  if (theme === 'system') {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    document.body.dataset.theme = prefersDark ? 'dark' : 'light';
  } else {
    document.body.dataset.theme = theme;
  }
}

// Render queue items
function renderQueue() {
  queueList.innerHTML = '';
  
  if (queue.length === 0) {
    emptyState.classList.remove('hidden');
    return;
  }
  
  emptyState.classList.add('hidden');
  
  // Sort by most recent first
  const sortedQueue = [...queue].sort((a, b) => new Date(b.dateAdded) - new Date(a.dateAdded));
  
  sortedQueue.forEach(item => {
    const li = document.createElement('li');
    li.className = 'queue-item';
    li.dataset.id = item.id;
    
    const formattedDate = new Date(item.dateAdded).toLocaleString();
    
    li.innerHTML = `
      <div class="queue-item-header">
        <span class="queue-item-text">${item.text}</span>
        <div class="queue-item-actions">
          <button class="icon-btn edit-btn" title="Edit">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
            </svg>
          </button>
          <button class="icon-btn delete-btn" title="Delete">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="3 6 5 6 21 6"></polyline>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
            </svg>
          </button>
        </div>
      </div>
      <div class="queue-item-date">${formattedDate}</div>
    `;
    
    // Open research panel on click
    li.addEventListener('click', (e) => {
      if (!e.target.closest('.edit-btn') && !e.target.closest('.delete-btn')) {
        openResearchPanel(item);
      }
    });
    
    // Edit button
    const editBtn = li.querySelector('.edit-btn');
    editBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      editItem(item);
    });
    
    // Delete button
    const deleteBtn = li.querySelector('.delete-btn');
    deleteBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      deleteItem(item.id);
    });
    
    queueList.appendChild(li);
  });
}

// Open research panel
function openResearchPanel(item) {
  currentItem = item;
  researchTitle.textContent = item.text;
  researchPanel.classList.add('active');
  
  // Reset tabs
  document.querySelector('.tab-btn[data-tab="google"]').click();
  
  // Load Google search
  loadGoogleSearch(item.text);
}

// Load Google search
function loadGoogleSearch(query) {
  googleLoading.classList.remove('hidden');
  googleFrame.classList.add('hidden');
  
  const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(query)}`;
  googleFrame.src = searchUrl;
  
  googleFrame.onload = () => {
    googleLoading.classList.add('hidden');
    googleFrame.classList.remove('hidden');
    
    // Mark as searched
    if (currentItem) {
      updateItemStatus(currentItem.id, { searched: true });
    }
  };
}

// Load ChatGPT response
function loadChatGptResponse(query) {
  if (!openAiKey) {
    apiKeyMissing.classList.remove('hidden');
    chatgptLoading.classList.add('hidden');
    return;
  }
  
  apiKeyMissing.classList.add('hidden');
  chatgptResponse.innerHTML = '';
  chatgptLoading.classList.remove('hidden');
  
  // Call OpenAI API
  fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${openAiKey}`
    },
    body: JSON.stringify({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: 'You are a helpful assistant providing brief, concise overviews of topics for students. Keep responses under 250 words and focus on key information.'
        },
        {
          role: 'user',
          content: `Please provide a brief overview of: ${query}`
        }
      ],
      max_tokens: 500
    })
  })
  .then(response => {
    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }
    return response.json();
  })
  .then(data => {
    const responseText = data.choices[0].message.content;
    chatgptResponse.textContent = responseText;
    chatgptLoading.classList.add('hidden');
    
    // Mark as queried
    if (currentItem) {
      updateItemStatus(currentItem.id, { chatGptQueried: true });
    }
  })
  .catch(error => {
    console.error('Error fetching ChatGPT response:', error);
    chatgptResponse.textContent = `Error: ${error.message}`;
    chatgptLoading.classList.add('hidden');
  });
}

// Edit item
function editItem(item) {
  const newText = prompt('Edit text:', item.text);
  if (newText && newText !== item.text) {
    updateItem(item.id, { text: newText });
  }
}

// Delete item
function deleteItem(id) {
  if (confirm('Are you sure you want to delete this item?')) {
    queue = queue.filter(item => item.id !== id);
    browser.storage.local.set({ queue });
    renderQueue();
  }
}

// Update item
function updateItem(id, updates) {
  const index = queue.findIndex(item => item.id === id);
  if (index !== -1) {
    queue[index] = { ...queue[index], ...updates };
    browser.storage.local.set({ queue });
    renderQueue();
  }
}

// Update item status
function updateItemStatus(id, statusUpdates) {
  const index = queue.findIndex(item => item.id === id);
  if (index !== -1) {
    queue[index] = { ...queue[index], ...statusUpdates };
    browser.storage.local.set({ queue });
  }
}

// Set up event listeners
function setupEventListeners() {
  // Back button
  backBtn.addEventListener('click', () => {
    researchPanel.classList.remove('active');
  });
  
  // Tab navigation
  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const tab = btn.dataset.tab;
      
      // Update active tab button
      tabBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      
      // Update active tab pane
      tabPanes.forEach(pane => pane.classList.remove('active'));
      document.getElementById(`${tab}-tab`).classList.add('active');
      
      // Load content if needed
      if (tab === 'chatgpt' && currentItem && !currentItem.chatGptQueried) {
        loadChatGptResponse(currentItem.text);
      }
    });
  });
  
  // Settings button
  settingsBtn.addEventListener('click', () => {
    settingsPanel.classList.add('active');
  });
  
  // Close settings button
  closeSettingsBtn.addEventListener('click', () => {
    settingsPanel.classList.remove('active');
  });
  
  // Save settings button
  saveSettingsBtn.addEventListener('click', () => {
    const apiKey = openaiKeyInput.value.trim();
    const theme = themeSelect.value;
    
    browser.storage.local.set({
      openAiKey: apiKey,
      theme: theme
    });
    
    openAiKey = apiKey;
    selectedTheme = theme;
    applyTheme(theme);
    
    settingsPanel.classList.remove('active');
  });
  
  // Listen for storage changes
  browser.storage.onChanged.addListener((changes) => {
    if (changes.queue) {
      queue = changes.queue.newValue || [];
      renderQueue();
    }
  });
}