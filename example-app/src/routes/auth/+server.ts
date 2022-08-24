import { login } from "$lib/api/login";
import { redirect, type RequestHandler } from "@sveltejs/kit";

export const POST: RequestHandler = async ({ request, setHeaders }) => {
  const form = await request.formData();
  const email = form.get('email')?.toString() ?? '';
  const password = form.get('password')?.toString() ?? '';

  const token = await login({ email, password });
  setHeaders({ 'set-cookie': 'bearer=' + token.access_token });
  throw redirect(308, '/popup');
}
