/**
 * app.js · 01 baseline
 * ====================
 *
 * La versión más simple que hace la página. Tres funciones y un
 * `addEventListener`, y ya está.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * LO QUE HACE
 * ─────────────────────────────────────────────────────────────────────────────
 *
 *   1. Pide los personajes a `/api/characters` (el mismo dataset que la serie
 *      de `ejercicios/`, servido como JSON).
 *   2. Cada vez que escribes en el buscador, calcula cuáles casan con la
 *      búsqueda y los pinta.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * LOS DOS TODOs
 * ─────────────────────────────────────────────────────────────────────────────
 *
 *   1. `matchesQuery`: normaliza y compara. Sin acentos, sin mayúsculas.
 *   2. `describeCount`: el texto del contador.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * LO QUE NO HAY AQUÍ (y por qué importa)
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * El estado son tres variables sueltas: `characters`, `query` y `visible`. Cada
 * una la escribe una función distinta y ninguna sabe de las otras dos. En
 * cuanto añadas un segundo criterio de búsqueda, o un botón de "ver solo el
 * grupo X", tendrás cuatro variables y una reconstrucción de la lista cada
 * vez que cambie cualquiera de ellas.
 *
 * Ese es el problema que resuelve el bloque 02. No se arregla con más funciones.
 */

/** El dataset viene del servidor; el mismo que usa la serie de `ejercicios/`. */
const CHARACTERS_URL = "/api/characters";

/**
 * TODO 1 · Devuelve `true` si el personaje casa con la búsqueda.
 *
 * El `cause` lleva los datos de entrada a propósito: si algo falla, el error
 * dice con qué se llamó. Es la costumbre de la serie, y se ve en
 * `ejercicios/04-datos/queries.ts`.
 */
function matchesQuery(character, query) {
  throw new Error("TODO 1: implementa matchesQuery", {
    cause: { id: character.id, query },
  });
}

/** TODO 2 · Devuelve el texto del contador de resultados. */
function describeCount(count, total) {
  throw new Error("TODO 2: implementa describeCount", {
    cause: { count, total },
  });
}

/** Escapa `&`, `<`, `>`, `"` y `'` para poder meter texto dentro de HTML. */
function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

/** El HTML de una tarjeta, en una sola cadena. */
function cardHtml(character) {
  return `<li class="character">
    <h2>${escapeHtml(character.name)}</h2>
    <p class="family">${escapeHtml(character.family)}</p>
    <p class="description">${escapeHtml(character.description)}</p>
  </li>`;
}

// El estado, que son tres variables sueltas. Esto es lo que cambia en el 02.
let characters = [];
let query = "";
let visible = [];

const form = document.querySelector("#search-form");
const input = document.querySelector("#query");
const countLabel = document.querySelector("#result-count");
const list = document.querySelector("#characters");

/** Pinta la lista y el contador. Es la única función que toca el DOM. */
function render() {
  list.innerHTML = visible.map(cardHtml).join("");
  countLabel.textContent = describeCount(visible.length, characters.length);
}

function search() {
  query = input.value.trim().toLowerCase();
  visible = characters.filter((character) => matchesQuery(character, query));
  render();
}

form.addEventListener("submit", (event) => {
  // Sin esto, el formularioGET recarga la página entera.
  event.preventDefault();
  search();
});

input.addEventListener("input", search);

const response = await fetch(CHARACTERS_URL);
const data = await response.json();

characters = data.characters;
visible = characters;
render();
