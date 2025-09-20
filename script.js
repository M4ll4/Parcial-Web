// script.js - versión mínima + fallback CORS proxy
const API_KEY = 'ad650991-fcf8-40d1-aa43-cbb5f3dbbdfd';
const API_BASE = 'https://www.balldontlie.io/api/v1';

const $ = id => document.getElementById(id);
const searchInput = $('searchInput');
const btnSearch = $('btnSearch');
const btnRandom = $('btnRandom');
const resultsList = $('resultsList');
const basicInfo = $('basicInfo');
const statsContent = $('statsContent');
const teamInfo = $('teamInfo');

// helper: construye headers si hay key
function buildHeaders() {
  const headers = { 'Content-Type': 'application/json' };
  if (API_KEY && API_KEY.trim()) headers['Authorization'] = API_KEY;
  return headers;
}

// helper: intenta fetch normal, si falla por CORS reintenta via AllOrigins
async function fetchJsonWithFallback(url) {
  try {
    const res = await fetch(url, { headers: buildHeaders() });
    if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
    return await res.json();
  } catch (err) {
    // si fallo por CORS o "Failed to fetch", reintentamos con proxy CORS público
    console.warn('Fetch directo falló, intentando proxy CORS...', err.message);
    // proxy que retorna contenido sin wrappers: AllOrigins / api.allorigins.win
    const proxy = 'https://api.allorigins.win/raw?url=';
    const proxiedUrl = proxy + encodeURIComponent(url);
    const res2 = await fetch(proxiedUrl);
    if (!res2.ok) throw new Error(`Proxy error ${res2.status}`);
    // la respuesta ya es el JSON original (raw), así que parseamos
    return await res2.json();
  }
}

// render minimal player info
function renderPlayer(p) {
  if (!p) return;
  const name = `${p.first_name} ${p.last_name}`;
  basicInfo.innerHTML = `<strong>${name}</strong><br/>Pos: ${p.position || 'N/A'}<br/>Team: ${p.team?.full_name || 'N/A'}`;
  teamInfo.innerHTML = p.team ? `${p.team.full_name} (${p.team.abbreviation})` : '—';
}

// cargar season averages
async function getSeasonAverages(playerId, season = new Date().getFullYear() - 1) {
  statsContent.textContent = 'Cargando...';
  const url = `${API_BASE}/season_averages?season=${season}&player_ids[]=${playerId}`;
  try {
    const json = await fetchJsonWithFallback(url);
    if (!json.data || !json.data.length) {
      statsContent.textContent = 'No hay promedios para esa temporada.';
      return;
    }
    const s = json.data[0];
    statsContent.textContent = `PTS:${s.pts} • REB:${s.reb} • AST:${s.ast} • Games:${s.games_played}`;
  } catch (e) {
    statsContent.textContent = `Error: ${e.message}`;
  }
}

// buscar jugadores y listar
async function searchPlayers(q) {
  resultsList.innerHTML = '<li>Cargando...</li>';
  const url = `${API_BASE}/players?search=${encodeURIComponent(q)}&per_page=25`;
  try {
    const json = await fetchJsonWithFallback(url);
    const arr = json.data || [];
    if (!arr.length) { resultsList.innerHTML = '<li>No se encontraron jugadores</li>'; return; }
    resultsList.innerHTML = '';
    arr.forEach(p => {
      const li = document.createElement('li');
      li.textContent = `${p.first_name} ${p.last_name} — ${p.team?.abbreviation || ''}`;
      li.onclick = () => { renderPlayer(p); getSeasonAverages(p.id); };
      resultsList.appendChild(li);
    });
    // autoselecciona el primero
    renderPlayer(arr[0]); getSeasonAverages(arr[0].id);
  } catch (e) {
    resultsList.innerHTML = `<li>Error: ${e.message}</li>`;
  }
}

async function randomPlayer() {
  resultsList.innerHTML = '<li>Cargando aleatorio...</li>';
  try {
    const json = await fetchJsonWithFallback(`${API_BASE}/players?per_page=100`);
    const arr = json.data || [];
    if (!arr.length) { resultsList.innerHTML = '<li>No hay jugadores</li>'; return; }
    const p = arr[Math.floor(Math.random()*arr.length)];
    resultsList.innerHTML = '';
    renderPlayer(p); getSeasonAverages(p.id);
  } catch (e) {
    resultsList.innerHTML = `<li>Error: ${e.message}</li>`;
  }
}

// eventos
btnSearch.addEventListener('click', () => {
  const q = searchInput.value.trim();
  if (!q) return alert('Escribe nombre o apellido');
  searchPlayers(q);
});
btnRandom.addEventListener('click', randomPlayer);

// init text
basicInfo.textContent = 'Selecciona un jugador para ver detalle.';
statsContent.textContent = '—';
teamInfo.textContent = '—';