function removeSavedTab(tabId, listItem, savedTabs) {
  listItem.classList.add("disappear-left");

  listItem.addEventListener("animationend", function () {
    delete savedTabs[tabId];
    chrome.storage.local.set({ savedTabs: savedTabs }, function () {
      console.log("Tab removed:", tabId);
      listItem.remove(); // Remove the tab entry from the list
    });
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
    listItem.className = "clickable-item";
    contentDiv.className = "contentHolder";
    buttonDiv.className = "buttonHolder";

    // Create an image element for the favicon
    if (tab.favIconUrl) {
      const favicon = document.createElement("img");
      favicon.src = tab.favIconUrl;
      favicon.style.height = "16px";
      favicon.style.width = "16px";
      favicon.style.marginLeft = "8px";
      contentDiv.appendChild(favicon);
    }

    listItem.addEventListener("click", function () {
      openTab(tab, listItem, savedTabs);
    });

    const deleteButton = document.createElement("button");
    deleteButton.className = "delete-button"; // Add this line to set the class
    const img = document.createElement("img");
    img.src = "images/black-x.svg"; // Path to your SVG file
    img.alt = "Delete"; // Alt text for accessibility
    deleteButton.appendChild(img);
    deleteButton.addEventListener("click", function (event) {
      event.stopPropagation();
      removeSavedTab(tabId, listItem, savedTabs);
    });

    // Create a span for the text
    const textSpan = document.createElement("span");
    textSpan.appendChild(document.createTextNode(tab.title));
    contentDiv.appendChild(textSpan);

    buttonDiv.appendChild(deleteButton);

    listItem.appendChild(contentDiv);
    listItem.appendChild(buttonDiv);
    savedTabList.appendChild(listItem);
    //setTimeout(() => listItem.classList.add("fade-in-move-up"), 0.5);
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
        const buttonDiv = document.createElement("div");
        listItem.className = "clickable-item";
        contentDiv.className = "contentHolder";
        buttonDiv.className = "buttonHolder";

        // Create an image element for the favicon
        if (tab.favIconUrl) {
          const favicon = document.createElement("img");
          favicon.src = tab.favIconUrl;
          favicon.style.height = "16px";
          favicon.style.width = "16px";
          favicon.style.marginLeft = "8px";
          contentDiv.appendChild(favicon);
        }

        listItem.addEventListener("click", function () {
          saveTab(tab, listItem, savedTabs);
        });

        // Create a span for the text
        const textSpan = document.createElement("span");
        textSpan.appendChild(document.createTextNode(tab.title));
        contentDiv.appendChild(textSpan);

        listItem.appendChild(contentDiv);
        listItem.appendChild(buttonDiv);

        tabsToSaveList.appendChild(listItem);
      }
    });
  });
}

function isUrlSaved(savedTabs, url) {
  return Object.values(savedTabs).some((tab) => tab.url === url);
}

function saveTab(tab, listItem, savedTabs) {
  if (isUrlSaved(savedTabs, tab.url)) {
    alert("This tab is already saved.");
    return;
  }

  listItem.classList.add("slide-up-fade-out");

  listItem.addEventListener("animationend", function onAnimationEnd() {
    listItem.removeEventListener("animationend", onAnimationEnd);
    // Now, remove the list item from the DOM and proceed with saving logic
    listItem.remove();

    savedTabs[tab.id] = tab;
    chrome.storage.local.set({ savedTabs: savedTabs }, function () {
      console.log("Tab saved:", tab);
      updateTabLists();
      chrome.tabs.remove(tab.id);
    });
  });
}

function openTab(tab, listItem, savedTabs) {
  chrome.tabs.create({ url: tab.url, index: tab.index }, function () {
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
