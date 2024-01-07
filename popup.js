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

function openAllSavedTabs(savedTabs) {
  Object.values(savedTabs).forEach((tab, index, array) => {
    chrome.tabs.create({ url: tab.url }, function () {
      delete savedTabs[tab.id];
      if (index === array.length - 1) {
        // Check if it's the last tab in the loop
        chrome.storage.local.set({ savedTabs: savedTabs }, function () {
          console.log("All tabs opened");
          updateTabLists(); // Update UI after all tabs are opened and savedTabs is updated
        });
      }
    });
  });
}

// Event listener for Open All Saved Tabs button
const openAllButton = document.getElementById("openAllSavedTabs");
openAllButton.addEventListener("click", function () {
  chrome.storage.local.get(["savedTabs"], function (result) {
    if (result.savedTabs) {
      openAllSavedTabs(result.savedTabs);
    }
  });
});

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

function saveCurrentTabsAsWorkspace(workspaceName) {
  chrome.tabs.query({ currentWindow: true }, function (tabs) {
    let urls = tabs.map((tab) => tab.url);
    chrome.storage.local.get(["workspaces"], function (result) {
      let workspaces = result.workspaces || {};
      workspaces[workspaceName] = urls;
      chrome.storage.local.set({ workspaces: workspaces }, function () {
        console.log(`Workspace ${workspaceName} saved.`);
        // Call this function to initially populate the list and whenever a new workspace is added
        updateWorkspaceList();
      });
    });
  });
}

document.getElementById("saveWorkspace").addEventListener("click", function () {
  let workspaceName = document.getElementById("workspaceName").value;
  if (workspaceName) {
    saveCurrentTabsAsWorkspace(workspaceName);
    showWorkspaceBtn.classList.toggle("showWorkspaceInputClose");
    newWorkspaceSelector.classList.toggle("workspaceOpen");
  } else {
    showWorkspaceBtn.classList.toggle("showWorkspaceInputClose");
    newWorkspaceSelector.classList.toggle("workspaceOpen");
  }
});

function openWorkspace(workspaceName) {
  chrome.storage.local.get(["workspaces"], function (result) {
    let workspaces = result.workspaces || {};
    if (workspaces[workspaceName]) {
      workspaces[workspaceName].forEach((url) => {
        chrome.tabs.create({ url: url });
      });
    } else {
      console.log(`Workspace ${workspaceName} not found.`);
    }
  });
}

function updateWorkspaceList() {
  chrome.storage.local.get(["workspaces"], function (result) {
    let workspaces = result.workspaces || {};
    let workspaceList = document.getElementById("workspaceList");
    workspaceList.innerHTML = "";

    if (workspaces.length > 0) {
      document.getElementById("workspaceEdit").classList.add("showEditButton");
    } else {
      document
        .getElementById("workspaceEdit")
        .classList.remove("showEditButton");
    }

    for (const name in workspaces) {
      let divSpace = document.createElement("div");
      divSpace.className = "workspacePreset";
      let openButton = document.createElement("button");
      openButton.className = "openBtn";
      openButton.textContent = `${name}`;
      openButton.addEventListener("click", function () {
        openWorkspace(name);
      });

      let deleteButton = document.createElement("button");
      const deleteImg = document.createElement("img");
      deleteImg.src = "images/black-x.svg"; // Path to your SVG file
      deleteImg.alt = "Delete"; // Alt text for accessibility
      deleteButton.appendChild(deleteImg);
      deleteButton.className = "deleteBtn";
      deleteButton.id = "deleteBtnEdit";
      //deleteButton.textContent = "Delete";
      deleteButton.addEventListener("click", function () {
        deleteWorkspace(name);
      });

      divSpace.appendChild(openButton);
      divSpace.appendChild(deleteButton);
      workspaceList.appendChild(divSpace);
    }
  });
}

function deleteWorkspace(workspaceName) {
  chrome.storage.local.get(["workspaces"], function (result) {
    let workspaces = result.workspaces || {};
    if (workspaces[workspaceName]) {
      delete workspaces[workspaceName];
      chrome.storage.local.set({ workspaces: workspaces }, function () {
        console.log(`Workspace ${workspaceName} deleted.`);
        updateWorkspaceList(); // Refresh the list
      });
    }
  });
}

let newWorkspaceSelector = document.getElementById("newWorkspace");
let showWorkspaceBtn = document.getElementById("showWorkspaceInput");
let newWorkspaceInput = document.getElementById("workspaceName");
let workspaceEditButton = document.getElementById("workspaceEdit");

workspaceEditButton.addEventListener("click", function () {
  document.querySelectorAll("button.deleteBtn").forEach(function (btn) {
    btn.classList.toggle("deleteBtnEditing");
  });
});

showWorkspaceBtn.addEventListener("click", function () {
  newWorkspaceSelector.classList.toggle("workspaceOpen");
  showWorkspaceBtn.classList.toggle("showWorkspaceInputClose");
  newWorkspaceInput.value = "";
  newWorkspaceInput.focus();
});

// Call this function to initially populate the list and whenever a new workspace is added
updateWorkspaceList();

document.addEventListener("DOMContentLoaded", updateTabLists);
