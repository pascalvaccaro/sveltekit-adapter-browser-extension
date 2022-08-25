import { error } from '@sveltejs/kit';

export const login = async (body: Record<'email' | 'password', string>) => {
	if (!body.email || !body.password) throw error(400, 'Missing email or password');
	const creds = await Promise.resolve({ access_token: 'accessToken' });
	return creds;
};
