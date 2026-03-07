const SESSION_KEY = 'skygate_user_data';

export function saveSession(userData) {
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(userData));
}

export function getSession() {
  const raw = sessionStorage.getItem(SESSION_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function clearSession() {
  sessionStorage.removeItem(SESSION_KEY);
}
