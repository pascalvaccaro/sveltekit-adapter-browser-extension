import { cookieParser } from '$lib/utils/string';
import { redirect } from '@sveltejs/kit';
import { prerendering } from '$app/env';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad<{ token: string }> = async ({ request }) => {
  const token = cookieParser(request)('bearer');

  if (!token && !prerendering) throw redirect(301, '/auth/login');
  return { token };
}