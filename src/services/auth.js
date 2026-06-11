import { api, session } from './api';

/**
 * POST /v1/login → 204 No Content + Set-Cookie: access_token=<JWT>
 * The browser stores the cookie automatically (credentials: "include").
 */
export async function login(email, password) {
  // Throws on 401 / other errors
  await api.post('/v1/login', { email, password });

  // 204 success — mark session and derive display name from email
  const name = email.split('@')[0];
  session.setLoggedIn();
  session.setName(name);
  session.setEmail(email);

  return { name, email };
}

export function logout() {
  session.clear();
}
