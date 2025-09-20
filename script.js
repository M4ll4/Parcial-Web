// script.js - versión simplificada y concisa
const API_KEY = 'ad650991-fcf8-40d1-aa43-cbb5f3dbbdfd';
const API_BASE = 'https://www.balldontlie.io/api/v1';

const $ = id => document.getElementById(id);

const searchInput = $('searchInput');
const btnSearch = $('btnSearch');
const btnRandom = $('btnRandom');
const resultsList = $('resultsList');

const banner = $('banner');
const bannerName = $('bannerName');

const basicInfo = $('basicInfo');
const statsContent = $('statsContent');
const teamInfo = $('teamInfo');

function setBanner(first, last, display) {
  const url = `https://nba-players.herokuapp.com/players/${last}/${first}`;
  const img = new Image();
  img.onload = () => {
    banner.style.backgroundImage = `url(${url})`;
    banner.style.backgroundSize = 'cover';
    banner.style.backgroundPosition = 'center';
    bannerName.textContent = display;
  };
  img.onerror = () => {
    banner.style.backgroundImage = '';
    banner.style.background = '#bfe7ff';
    bannerName.textContent = display;
  };
  img.src = url;
}

async function fetchJson(url, useKey = true) {
  const headers = { 'Content-Type': 'application/json' };
  if (useKey && API_KEY) headers['Authorization'] = API_KEY;
  const res = await fetch(url, { headers });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  return res.json();
}

function renderPlayer(p) {
  if (!p) return;
  const name = `${p.first_name} ${p.last_name}`;
  setBanner(p.first_name, p.last_name, name);
  basicInfo.innerHTML = `<strong>${name}</strong><br/>Pos: ${p.position || 'N/A'}<br/>Team: ${p.team?.full_name || 'N/A'}`;
  teamInfo.innerHTML = p.team ? `${p.team.full_name} (${p.team.abbreviation})<br/>City: ${p.team.city}` : '—';
}

async function getSeasonAverages(id, season = new Date().getFullYear() - 1) {
  statsContent.textContent = 'Cargando...';
  const url = `${API_BASE}/season_averages?season=${season}&player_ids[]=${id}`;
  try {
    const json = await fetchJson(url);
    if (!json.data || !json.data.length) { statsContent.textContent = 'No hay datos.'; return; }
    const s = json.data[0];
    statsContent.innerHTML = `PTS: ${s.pts} • REB: ${s.reb} • AST: ${s.ast} • Games: ${s.games_played}`;
  } catch (e) {
    statsContent.textContent = `Error: ${e.message}`;
  }
}

async function searchPlayers(q) {
  resultsList.innerHTML = '<li>Cargando...</li>';
  const url = `${API_BASE}/players?search=${encodeURIComponent(q)}&per_page=25`;
  try {
    const json = await fetchJson(url);
    const players = json.data || [];
    if (!players.length) { resultsList.innerHTML = '<li>No encontrados</li>'; return; }
    resultsList.innerHTML = '';
    players.forEach(p => {
      const li = document.createElement('li');
      li.textContent = `${p.first_name} ${p.last_name} — ${p.team?.abbreviation || ''}`;
      li.onclick = () => { renderPlayer(p); getSeasonAverages(p.id); };
      resultsList.appendChild(li);
    });
    renderPlayer(players[0]); getSeasonAverages(players[0].id);
  } catch (e) {
    resultsList.innerHTML = `<li>Error: ${e.message}</li>`;
  }
}

async function randomPlayer() {
  resultsList.innerHTML = '<li>Cargando aleatorio...</li>';
  try {
    const json = await fetchJson(`${API_BASE}/players?per_page=100`);
    const arr = json.data || [];
    if (!arr.length) { resultsList.innerHTML = '<li>Error: no players</li>'; return; }
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

// init
bannerName.textContent = 'Busca por nombre (ej: Curry, LeBron)';
basicInfo.textContent = 'Selecciona un jugador para ver detalle.';
statsContent.textContent = '—';
teamInfo.textContent = '—';