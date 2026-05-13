const BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export async function registerUser(name, email, password) {
  const res = await fetch(`${BASE}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email, password })
  });
  return res.json();
}

export async function loginUser(email, password) {
  const res = await fetch(`${BASE}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  return res.json();
}

export async function fetchMovies(search = '', genre = 'All', sort = 'popularity') {
  const params = new URLSearchParams();
  if (search) params.append('q', search);
  if (genre && genre !== 'All') params.append('genre', genre);
  params.append('sort', sort);
  const res = await fetch(`${BASE}/api/movies?${params}`);
  return res.json();
}

export async function fetchMovie(id) {
  const res = await fetch(`${BASE}/api/movies/${id}`);
  return res.json();
}

export async function saveLog(token, tmdbId, title, poster, genre, year, status, rating, review) {
  const res = await fetch(`${BASE}/api/logs`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ tmdbId, title, poster, genre, year, status, rating, review })
  });
  return res.json();
}

export async function fetchUserLogs(token, userId) {
  const res = await fetch(`${BASE}/api/logs/${userId}`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  return res.json();
}

export async function fetchReviews(movieId) {
  const res = await fetch(`${BASE}/api/reviews/${movieId}`);
  return res.json();
}

export async function sendChatMessage(token, message, history) {
  const res = await fetch(`${BASE}/api/ai/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ message, history })
  });
  return res.json();
}

export async function getRecommendations(token) {
  const res = await fetch(`${BASE}/api/ai/recommendations`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  return res.json();
}

export async function deleteLog(token, tmdbId) {
  const res = await fetch(`${BASE}/api/logs/${tmdbId}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${token}` }
  });
  return res.json();
}