<script lang="ts">
	import { credentials } from '$lib/store/credentials';	
	import LoginForm from '$lib/components/LoginForm.svelte';
</script>

<main class="popup-container">
	{#if $credentials.access_token}
		<slot />
	{:else}
		<LoginForm />
	{/if}
</main>

<style lang="scss">
	.popup-container {
		display: flex;
		width: 100vw;
		height: 100%;
		justify-content: center;
		background-color: white;
	}

	@media screen and (max-width: 320px) {
		.popup-container {
			height: 50vh;
		}
	}
</style>
