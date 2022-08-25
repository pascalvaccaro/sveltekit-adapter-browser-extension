import { browser } from '$app/env';
import { writable } from 'svelte/store';

export type Credentials = Record<string, unknown>;
export const credentials = writable<Credentials>({});

const handleMessage = (message: { type: string; payload: Credentials }) =>
	message.type === 'credentials.set' && credentials.set(message.payload);

if (browser) {
	const isWebextRuntime =
		typeof chrome.storage === 'object' && typeof chrome.storage.onChanged === 'function';

	credentials.subscribe((newCreds) => {
		const message = { type: 'storage.set', payload: { credentials: newCreds } };
		if (isWebextRuntime) chrome.storage.sync.set(message.payload);
		else window.postMessage(message, '*');
	});

	if (isWebextRuntime) chrome.runtime.onMessage.addListener(handleMessage);
	else window.addEventListener('message', (ev) => handleMessage(ev.data));
}
