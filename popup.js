function removeSavedTab(tabId, listItem, savedTabs) {
  delete savedTabs[tabId];
  chrome.storage.local.set({ savedTabs: savedTabs }, function () {
    console.log("Tab removed:", tabId);
    listItem.remove(); // Remove the tab entry from the list
  });
}

// Function to update the list of saved tabs
function updateSavedTabList(savedTabs) {
  const savedTabList = document.getElementById("savedTabList");
  savedTabList.innerHTML = ""; // Clear existing items

  for (const [tabId, tab] of Object.entries(savedTabs)) {
    const listItem = document.createElement("li");
    const contentDiv = document.createElement("div"); // Container for favicon and text
    const buttonDiv = document.createElement("div");
    buttonDiv.className = "buttonHolder";
    contentDiv.className = "contentHolder";

    // Create an image element for the favicon
    if (tab.favIconUrl) {
      const favicon = document.createElement("img");
      favicon.src = tab.favIconUrl;
      favicon.style.height = "16px";
      favicon.style.width = "16px";
      favicon.style.marginRight = "8px";
      favicon.style.marginLeft = "8px";
      contentDiv.appendChild(favicon);
    }

    // Create a span for the text
    const textSpan = document.createElement("span");
    textSpan.appendChild(document.createTextNode(tab.title));
    contentDiv.appendChild(textSpan);
    listItem.appendChild(contentDiv);

    const openButton = document.createElement("button");
    openButton.textContent = "Open";
    openButton.addEventListener("click", function () {
      openTab(tab, listItem, openButton, savedTabs);
    });

    const deleteButton = document.createElement("button");
    deleteButton.textContent = "X";
    deleteButton.className = "delete-button"; // Add this line to set the class
    deleteButton.addEventListener("click", function () {
      removeSavedTab(tabId, listItem, savedTabs);
    });

    buttonDiv.appendChild(openButton);
    buttonDiv.appendChild(deleteButton);
    listItem.appendChild(buttonDiv);
    savedTabList.appendChild(listItem);
  }
}

// Function to update the list of tabs that can be saved
function updateTabsToSaveList(savedTabs) {
  const tabsToSaveList = document.getElementById("tabsToSaveList");
  tabsToSaveList.innerHTML = ""; // Clear existing items

  chrome.tabs.query({}, function (tabs) {
    tabs.forEach((tab) => {
      if (!savedTabs[tab.id]) {
        const listItem = document.createElement("li");
        const contentDiv = document.createElement("div");
        //const buttonDiv = document.createElement("div");
        //buttonDiv.className = "buttonHolder";
        contentDiv.className = "contentHolder";

        listItem.addEventListener("click", function () {
          saveTab(tab, listItem, saveButton, savedTabs);
        });

        // Create an image element for the favicon
        if (tab.favIconUrl) {
          const favicon = document.createElement("img");
          favicon.src = tab.favIconUrl;
          favicon.style.height = "16px";
          favicon.style.width = "16px";
          favicon.style.marginRight = "8px";
          favicon.style.marginLeft = "8px";
          contentDiv.appendChild(favicon);
        }

        // Create a span for the text
        const textSpan = document.createElement("span");
        textSpan.appendChild(document.createTextNode(tab.title));
        contentDiv.appendChild(textSpan);
        listItem.appendChild(contentDiv);

        //const saveButton = document.createElement("button");
        //saveButton.textContent = "";
        //saveButton.addEventListener("click", function () {
        //  saveTab(tab, listItem, saveButton, savedTabs);
        //});

        //buttonDiv.appendChild(saveButton);
        //listItem.appendChild(buttonDiv);
        tabsToSaveList.appendChild(listItem);
      }
    });
  });
}

function isUrlSaved(savedTabs, url) {
  return Object.values(savedTabs).some((tab) => tab.url === url);
}

function saveTab(tab, listItem, button, savedTabs) {
  if (isUrlSaved(savedTabs, tab.url)) {
    alert("This URL is already saved.");
    return;
  }
  savedTabs[tab.id] = tab;
  chrome.storage.local.set({ savedTabs: savedTabs }, function () {
    console.log("Tab saved:", tab);
    updateTabLists();
    chrome.tabs.remove(tab.id);
  });
}

function openTab(tab, listItem, button, savedTabs) {
  chrome.tabs.create({ url: tab.url }, function () {
    delete savedTabs[tab.id];
    chrome.storage.local.set({ savedTabs: savedTabs }, function () {
      console.log("Tab opened");
      updateTabLists();
    });
  });
}

// Function to update both lists
function updateTabLists() {
  chrome.storage.local.get(["savedTabs"], function (result) {
    const savedTabs = result.savedTabs || {};
    updateSavedTabList(savedTabs);
    updateTabsToSaveList(savedTabs);
  });
}

document.addEventListener("DOMContentLoaded", updateTabLists);
