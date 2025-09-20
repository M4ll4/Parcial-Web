// script.js - Fetch minimal a balldontlie API para buscar jugadores y promedios

const API_BASE = 'https://www.balldontlie.io/api/v1';

const searchInput = document.getElementById('searchInput');
const btnSearch = document.getElementById('btnSearch');
const btnRandom = document.getElementById('btnRandom');
const resultsList = document.getElementById('resultsList');

const banner = document.getElementById('banner');
const bannerName = document.getElementById('bannerName');

const basicInfo = document.getElementById('basicInfo');
const statsContent = document.getElementById('statsContent');
const teamInfo = document.getElementById('teamInfo');

// Helper: set banner image (intenta nba-players service, sino fallback)
function setBannerImage(firstName, lastName, displayName) {
  // service widely used for player headshots (no garantía 100% uptime)
  const imgUrl = `https://nba-players.herokuapp.com/players/${lastName}/${firstName}`;

  // intentamos cargar la imagen; si falla usamos fallback
  const img = new Image();
  img.onload = () => {
    banner.style.backgroundImage = `url('${imgUrl}')`;
    bannerName.textContent = displayName;
  };
  img.onerror = () => {
    // fallback: color + texto
    banner.style.backgroundImage = '';
    banner.style.background = '#bfe7ff';
    bannerName.textContent = displayName;
  };
  img.src = imgUrl;
}

// Render jugador seleccionado (obj player desde balldontlie)
function renderPlayer(player) {
  if (!player) return;
  const name = `${player.first_name} ${player.last_name}`;
  setBannerImage(player.first_name, player.last_name, name);

  basicInfo.innerHTML = `
    <strong>${name}</strong><br/>
    Posición: ${player.position || 'N/A'}<br/>
    Equipo: ${player.team ? player.team.full_name : 'N/A'}
  `;

  // mostrar info de equipo
  teamInfo.innerHTML = player.team ? `
    ${player.team.full_name} (${player.team.abbreviation})<br/>
    City: ${player.team.city}<br/>
    Conference: ${player.team.conference}
  ` : 'Sin info de equipo';
}

// Buscar jugadores por texto
async function searchPlayers(q) {
  try {
    resultsList.innerHTML = '<li>Cargando...</li>';
    const res = await fetch(`${API_BASE}/players?search=${encodeURIComponent(q)}&per_page=25`);
    const data = await res.json();
    const players = data.data || [];

    if (!players.length) {
      resultsList.innerHTML = '<li>No se encontraron jugadores</li>';
      return;
    }

    // listar resultados
    resultsList.innerHTML = '';
    players.forEach(p => {
      const li = document.createElement('li');
      li.textContent = `${p.first_name} ${p.last_name} — ${p.team ? p.team.abbreviation : ''}`;
      li.addEventListener('click', () => {
        renderPlayer(p);
        loadSeasonAverages(p.id);
      });
      resultsList.appendChild(li);
    });

    // autoseleccionar el primer resultado para demo rápida
    renderPlayer(players[0]);
    loadSeasonAverages(players[0].id);

  } catch (err) {
    resultsList.innerHTML = `<li>Error: ${err.message}</li>`;
  }
}

// Cargar promedios de temporada para un player_id usando season_averages
async function loadSeasonAverages(playerId, season = new Date().getFullYear()-1) {
  // la API usa parámetro player_ids[] y season, p.e. ?season=2023&player_ids[]=ID
  statsContent.textContent = 'Cargando promedios...';
  try {
    const url = `${API_BASE}/season_averages?season=${season}&player_ids[]=${playerId}`;
    const res = await fetch(url);
    const data = await res.json();

    // data.data es un array (puede venir vacío)
    if (!data.data || !data.data.length) {
      statsContent.innerHTML = 'No hay promedios para esta temporada (o datos no disponibles).';
      return;
    }
    const s = data.data[0];
    // Mostrar los campos más comunes
    statsContent.innerHTML = `
      PTS: ${s.pts} <br/>
      REB: ${s.reb} <br/>
      AST: ${s.ast} <br/>
      MIN: ${s.min || 'N/A'} <br/>
      FG%: ${s.fg_pct} <br/>
      FG3%: ${s.fg3_pct} <br/>
      FT%: ${s.ft_pct} <br/>
      Games: ${s.games_played}
    `;
  } catch (err) {
    statsContent.textContent = `Error cargando promedios: ${err.message}`;
  }
}

// Buscar jugador aleatorio sencillo: pedimos página grande y elegimos uno
async function randomPlayer() {
  resultsList.innerHTML = '<li>Cargando jugador aleatorio...</li>';
  try {
    // pedimos una página con muchos resultados por simplicidad (max per_page=100)
    const res = await fetch(`${API_BASE}/players?per_page=100`);
    const data = await res.json();
    const players = data.data || [];
    if (!players.length) {
      resultsList.innerHTML = '<li>No hay jugadores</li>';
      return;
    }
    const p = players[Math.floor(Math.random() * players.length)];
    resultsList.innerHTML = '';
    renderPlayer(p);
    loadSeasonAverages(p.id);
  } catch (err) {
    resultsList.innerHTML = `<li>Error: ${err.message}</li>`;
  }
}

// Eventos
btnSearch.addEventListener('click', () => {
  const q = searchInput.value.trim();
  if (!q) {
    alert('Escribe el nombre o apellido del jugador');
    return;
  }
  searchPlayers(q);
});

btnRandom.addEventListener('click', () => {
  randomPlayer();
});

// Init: mostrar mensaje
bannerName.textContent = 'Busca por nombre (ej: Curry, LeBron, Doncic)';
basicInfo.textContent = 'Selecciona un jugador de la lista para ver detalles.';
