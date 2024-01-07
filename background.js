chrome.runtime.onInstalled.addListener(() => {
  console.log("Tab Saver Extension Installed");
  // Perform initial setup tasks here
});

// CHECK IF TABS NOT USED.

let tabActivity = {};

chrome.tabs.onActivated.addListener((activeInfo) => {
  tabActivity[activeInfo.tabId] = Date.now();
  //console.log(tabActivity);
});

function checkForInactiveTabs() {
  const INACTIVE_LIMIT = 0.5 * 60 * 1000; // 30 minutes, for example
  const now = Date.now();

  for (const [tabId, lastActive] of Object.entries(tabActivity)) {
    if (now - lastActive > INACTIVE_LIMIT) {
      // Tab has been inactive for more than the limit
      triggerPopup(tabId, tabActivity);
    }
  }
}

setInterval(checkForInactiveTabs, 1 * 60 * 1000); // Check every 10 minutes

function triggerPopup(tabId, tabActivity) {
  //console.log(tabId + "Not in use.");
  // Logic to display a message or a custom HTML popup in the tab
  // This could be done via content scripts or manipulating the tab's DOM
  if (tabActivity.length > 0) {
    chrome.runtime.sendMessage({
      action: "inactiveTabsDetected",
      tabs: tabActivity,
    });
  }
}
