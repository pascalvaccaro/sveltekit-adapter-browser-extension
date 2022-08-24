chrome.contextMenus.create({
	id: 'select-text',
	type: 'normal',
	contexts: ['selection'],
	visible: true,
	title: 'Select this piece of text'
});

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
	if (typeof tab?.id === 'number' && info.selectionText)
		await chrome.tabs.sendMessage(tab.id, { type: 'getSelection' }).catch(console.error);
});

export {};
