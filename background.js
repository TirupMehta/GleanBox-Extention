chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "glean",
    title: "Glean",
    contexts: ["selection"]
  });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "glean" && info.selectionText) {
    const gleaning = {
      text: info.selectionText.trim(),
      url: tab.url,
      title: tab.title,
      timestamp: new Date().toISOString()
    };
    chrome.storage.sync.get('gleaned', ({ gleaned = [] }) => {
      const updatedGleaned = [...gleaned, gleaning];
      chrome.storage.sync.set({ gleaned: updatedGleaned }, () => {
        if (chrome.runtime.lastError) {
          console.error('Save failed:', chrome.runtime.lastError);
        } else {
          console.log('Gleaning saved:', gleaning);
        }
      });
    });
  }
});

chrome.omnibox.onInputEntered.addListener((text) => {
  chrome.storage.sync.get('gleaned', ({ gleaned = [] }) => {
    const matches = gleaned.filter(g => g.text.toLowerCase().includes(text.toLowerCase()));
    if (matches.length > 0) {
      chrome.tabs.create({ url: matches[0].url });
    } else {
      chrome.tabs.update({ url: `https://www.google.com/search?q=${encodeURIComponent(text)}` });
    }
  });
});