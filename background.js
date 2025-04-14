// background.js - Handles context menu and extension functionality
let openAiKey = '';

// Initialize context menu
browser.contextMenus.create({
  id: "add-to-study-queue",
  title: "Add to Study Queue",
  contexts: ["selection"]
});

// Handle context menu click
browser.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "add-to-study-queue" && info.selectionText) {
    addToQueue(info.selectionText.trim());
  }
});

// Add item to queue with timestamp as ID
function addToQueue(text) {
  browser.storage.local.get('queue', (data) => {
    const queue = data.queue || [];
    const newItem = {
      id: Date.now(),
      text: text,
      dateAdded: new Date().toISOString(),
      searched: false,
      chatGptQueried: false
    };
    
    queue.push(newItem);
    browser.storage.local.set({ queue });
    
    // Show notification
    browser.notifications.create({
      type: 'basic',
      iconUrl: 'icons/icon48.png',
      title: 'Study Queue',
      message: 'Item added to your study queue!'
    });
  });
}

// Initialize API key from storage
browser.storage.local.get('openAiKey', (data) => {
  if (data.openAiKey) {
    openAiKey = data.openAiKey;
  }
});

// Listen for API key updates
browser.storage.onChanged.addListener((changes) => {
  if (changes.openAiKey) {
    openAiKey = changes.openAiKey.newValue;
  }
});