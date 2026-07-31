// Injects picker.js into the active tab on the toolbar button or Alt+Shift+P.
// ponytail: activeTab instead of host_permissions — no "read your data on all
// sites" prompt, and the user gesture is the grant. Injecting at page load
// would pop the picker UI on every tab, which nobody wants.
const inject = (tab) =>
  tab?.id != null && chrome.scripting.executeScript({ target: { tabId: tab.id }, files: ['picker.js'] });

chrome.action.onClicked.addListener(inject);
chrome.commands.onCommand.addListener((_cmd, tab) => inject(tab));
