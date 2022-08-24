// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
chrome.runtime.onMessage.addListener((message, sender) => {
	if (!message || typeof message !== 'object' || !message.type) return;

	if (message.type === 'getSelection' && sender.id === chrome.runtime.id) {
		const payload = (document.getSelection() ?? '').toString();
		if (!payload) return;

		// This is a way to open an iframe inside the page's document from the extension's content-script
		const iframe = document.createElement('iframe');
		iframe.setAttribute('sandbox', 'allow-scripts allow-forms allow-popups allow-modals');
		iframe.setAttribute(
			'style',
			'width: 100%; height: 120px; position: fixed; bottom: 0; left: 0;'
		);
		const src = new URL('/popup.html', `chrome-extension://${chrome.runtime.id}`);
		iframe.setAttribute('src', src.toString());
		iframe.onload = () =>
			iframe.contentWindow?.addEventListener('message', (event) => {
				if (!event.data || !event.data.type || typeof event.data.type !== 'string') return;

				if (
					event.data.type === 'storage.set' &&
					typeof event.data.payload === 'object' &&
					event.data.payload
				) {
					// Use the iframe as a storage-sync element
					chrome.storage.sync.set(event.data.payload);
				}
			});
		document.body.appendChild(iframe);
	}
});
