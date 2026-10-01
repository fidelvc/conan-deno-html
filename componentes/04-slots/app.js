/**
 * app.js · 04 slots
 * =================
 *
 * Idéntico al del bloque 03, y esa es la forma de comprobar que los
 * componentes son una cosa aparte de la página: `app.js` no ha cambiado.
 *
 * La diferencia real está dentro de `character-card.js`, que ya no pinta su
 * contenido, y en `character-list.js`, que ahora elige qué va en el hueco.
 */

import "./character-list.js";
import { CharacterStore } from "./../02-clases/store.js";

const CHARACTERS_URL = "/api/characters";

const form = document.querySelector("#search-form");
const input = document.querySelector("#query");
const countLabel = document.querySelector("#result-count");
const list = document.querySelector("character-list");

function render(state) {
  list.characters = state.visible;
  countLabel.textContent = describeCount(
    state.visible.length,
    state.characters.length,
  );
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

form.addEventListener("submit", (event) => {
  event.preventDefault();
});

input.addEventListener("input", () => {
  store.setQuery(input.value);
});

render(store.state);
