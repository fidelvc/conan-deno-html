/**
 * app.js · 05 modificar
 * =====================
 *
 * Donde se conecta todo. Es el primer fichero de la serie que cambia de
 * verdad, y son cuatro líneas.
 *
 *     tarjeta --(character-favorite)--> lista --(character-favorite)--> aquí
 *     aquí: store.toggleFavorite(id)
 *     store: avisa a sus oyentes
 *     aquí: render(state), que vuelve a pintar la lista
 *
 * `app.js` es el único sitio del proyecto que sabe que existen un store, una
 * lista y una tarjeta a la vez. Ese es su trabajo, y por eso es pequeño.
 */

import "./character-list.js";
import { CharacterStore } from "./store.js";

const CHARACTERS_URL = "/api/characters";

const form = document.querySelector("#search-form");
const input = document.querySelector("#query");
const countLabel = document.querySelector("#result-count");
const favoriteLabel = document.querySelector("#favorite-count");
const list = document.querySelector("character-list");

function render(state) {
  list.characters = state.visible;
  countLabel.textContent = describeCount(
    state.visible.length,
    state.characters.length,
  );
  favoriteLabel.textContent = String(state.favoriteCount);
}

function describeCount(visible, total) {
  if (visible === total) return `Mostrando los ${total} personajes`;
  if (visible === 0) return "Ningún personaje coincide con la búsqueda";
  return `Mostrando ${visible} de ${total} personajes`;
}

const response = await fetch(CHARACTERS_URL);
const data = await response.json();

const store = new CharacterStore(data.characters);

store.subscribe(render);

// La lista solo necesita saber *preguntar*; el store sigue siendo suyo.
list.isFavorite = (id) => store.isFavorite(id);

// El punto de unión entre el evento del componente y el estado.
list.addEventListener("character-favorite", (event) => {
  store.toggleFavorite(event.detail.id);
});

form.addEventListener("submit", (event) => {
  event.preventDefault();
});

input.addEventListener("input", () => {
  store.setQuery(input.value);
});

render(store.state);
