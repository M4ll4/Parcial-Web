// script.js - versión mínima + fallback CORS proxy
const API_KEY = '61ede74307mshd14f507d19ae370p14b596jsn239a9602f4ec'; // pon aquí tu key de RapidAPI
const API_HOST = 'anime-db.p.rapidapi.com';
const API_BASE = 'https://anime-db.p.rapidapi.com/anime';

async function fetchJsonWithFallback(url) {
  const res = await fetch(url, {
    method: 'GET',
    headers: {
      'X-RapidAPI-Key': API_KEY,
      'X-RapidAPI-Host': API_HOST
    }
  });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  return await res.json();
}

const $ = id => document.getElementById(id);
const searchInput = $('searchInput');
const btnSearch = $('btnSearch');
const btnRandom = $('btnRandom');
const resultsList = $('resultsList');
const basicInfo = $('basicInfo');
const statsContent = $('statsContent');
const teamInfo = $('teamInfo');

// Renderiza info básica del anime
function renderAnime(anime) {
  if (!anime) return;
  basicInfo.innerHTML = `<strong>${anime.title}</strong><br/>Tipo: ${anime.type || 'N/A'}<br/>Ranking: ${anime.ranking || 'N/A'}`;
  teamInfo.innerHTML = anime.genres ? anime.genres.join(', ') : '—';
  statsContent.textContent = anime.episodes ? `Episodios: ${anime.episodes}` : '—';
}

// Buscar animes y listar
async function searchAnimes(q) {
  resultsList.innerHTML = '<li>Cargando...</li>';
  const url = `${API_BASE}?page=1&size=10&search=${encodeURIComponent(q)}`;
  try {
    const json = await fetchJsonWithFallback(url);
    const arr = json.data || [];
    if (!arr.length) { resultsList.innerHTML = '<li>No se encontraron animes</li>'; return; }
    resultsList.innerHTML = '';
    arr.forEach(anime => {
      const li = document.createElement('li');
      li.textContent = `${anime.title} — ${anime.type || ''}`;
      li.onclick = () => { renderAnime(anime); };
      resultsList.appendChild(li);
    });
    renderAnime(arr[0]);
  } catch (e) {
    resultsList.innerHTML = `<li>Error: ${e.message}</li>`;
  }
}

// Anime aleatorio
async function randomAnime() {
  resultsList.innerHTML = '<li>Cargando aleatorio...</li>';
  try {
    const url = `${API_BASE}?page=1&size=50`;
    const json = await fetchJsonWithFallback(url);
    const arr = json.data || [];
    if (!arr.length) { resultsList.innerHTML = '<li>No hay animes</li>'; return; }
    const anime = arr[Math.floor(Math.random()*arr.length)];
    resultsList.innerHTML = '';
    renderAnime(anime);
  } catch (e) {
    resultsList.innerHTML = `<li>Error: ${e.message}</li>`;
  }
}

// eventos
btnSearch.addEventListener('click', () => {
  const q = searchInput.value.trim();
  if (!q) return alert('Escribe el nombre de un anime');
  searchAnimes(q);
});
btnRandom.addEventListener('click', randomAnime);

// init text
basicInfo.textContent = 'Selecciona un anime para ver detalle.';
statsContent.textContent = '—';
teamInfo.textContent = '—';