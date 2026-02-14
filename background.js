const DEFAULTS = {
  showAge: true,
  showTech: true,
  freshDays: 180,
  agingDays: 730,
};

chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === "install") {
    chrome.storage.sync.set(DEFAULTS, () => {
      if (chrome.runtime.lastError) {
        console.warn("VerusIT: failed to set defaults", chrome.runtime.lastError.message);
        return;
      }
      console.log("VerusIT installed — defaults set");
    });
  }
});

chrome.runtime.onStartup.addListener(() => {
  chrome.storage.sync.get(DEFAULTS, (stored) => {
    if (chrome.runtime.lastError) {
      console.warn("VerusIT: storage read failed on startup", chrome.runtime.lastError.message);
      return;
    }
    let needsUpdate = false;
    const patch = {};
    for (const key of Object.keys(DEFAULTS)) {
      if (stored[key] === undefined) {
        patch[key] = DEFAULTS[key];
        needsUpdate = true;
      }
    }
    if (needsUpdate) {
      chrome.storage.sync.set(patch);
    }
  });
});
