import { API_URL } from './config';
let delogareCallback = null;

export function setDelogareCallback(functie) {
  delogareCallback = functie;
}

export async function cerere(url, optiuni = {}, token) {
  const headers = { ...(optiuni.headers || {}) };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const raspuns = await fetch(url, { ...optiuni, headers });

  if (raspuns.status === 401) {
    if (delogareCallback) delogareCallback();
    throw new Error('Sesiune expirată');
  }

  return raspuns;
}