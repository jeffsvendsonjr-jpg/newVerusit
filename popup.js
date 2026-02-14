const defaults = {
  showAge: true,
  showTech: true,
  freshDays: 180,
  agingDays: 730,
};

function formatDays(days) {
  if (days < 365) return `${days}d`;
  return `${(days / 365).toFixed(days % 365 === 0 ? 0 : 1)}y`;
}

function loadSettings() {
  chrome.storage.sync.get(defaults, (settings) => {
    document.getElementById("showAge").checked = settings.showAge;
    document.getElementById("showTech").checked = settings.showTech;
    document.getElementById("freshDays").value = settings.freshDays;
    document.getElementById("agingDays").value = settings.agingDays;
    document.getElementById("freshDaysValue").textContent = formatDays(settings.freshDays);
    document.getElementById("agingDaysValue").textContent = formatDays(settings.agingDays);
  });
}

function saveSettings() {
  const settings = {
    showAge: document.getElementById("showAge").checked,
    showTech: document.getElementById("showTech").checked,
    freshDays: parseInt(document.getElementById("freshDays").value),
    agingDays: parseInt(document.getElementById("agingDays").value),
  };
  chrome.storage.sync.set(settings);
}

document.getElementById("showAge").addEventListener("change", saveSettings);
document.getElementById("showTech").addEventListener("change", saveSettings);

document.getElementById("freshDays").addEventListener("input", (e) => {
  document.getElementById("freshDaysValue").textContent = formatDays(parseInt(e.target.value));
  saveSettings();
});

document.getElementById("agingDays").addEventListener("input", (e) => {
  document.getElementById("agingDaysValue").textContent = formatDays(parseInt(e.target.value));
  saveSettings();
});

loadSettings();
