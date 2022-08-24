<script lang="ts">
	import { browser } from '$app/env';
	import LoginForm from '$lib/components/LoginForm.svelte';
	import type { LayoutData } from './$types';

	export let data: LayoutData;
	let webextAccessToken = data.token;

	if (browser && webextAccessToken) {
		window.postMessage(
			{ type: 'storage.set', payload: { credentials: webextAccessToken } },
			window.location.origin
		);
	}
</script>

<main class="popup-container">
	{#if webextAccessToken}
		<slot />
	{:else}
		<LoginForm />
	{/if}
</main>

<style lang="scss">
	.popup-container {
		display: flex;
		width: 100vw;
		height: 4rem;
		justify-content: center;
	}

	@media screen and (max-width: 320px) {
		.popup-container {
			height: 50vh;
		}
	}
</style>
