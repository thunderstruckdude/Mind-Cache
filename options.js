document.addEventListener("DOMContentLoaded", function () {
    const apiKeyInput = document.getElementById("apiKey");
    const saveKeyButton = document.getElementById("saveKey");
    const status = document.getElementById("status");
  
    // Load saved API key
    browser.storage.local.get("apiKey", (data) => {
      if (data.apiKey) {
        apiKeyInput.value = data.apiKey;
      }
    });
  
    // Save API key
    saveKeyButton.addEventListener("click", () => {
      const apiKey = apiKeyInput.value.trim();
      if (apiKey) {
        browser.storage.local.set({ apiKey });
        status.textContent = "API Key saved!";
        status.style.color = "green";
      } else {
        status.textContent = "Please enter a valid API key.";
        status.style.color = "red";
      }
    });
  });
  