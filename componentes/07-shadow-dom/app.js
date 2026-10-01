/**
 * app.js · 07 shadow dom
 * ======================
 *
 * Idéntico al del bloque 06, y esa es la demostración completa del bloque.
 *
 * `app.js` no ha cambiado ni una línea, pero ahora los componentes llevan su
 * propio shadow root. Se encapsulan los estilos desde dentro, sin tocar la
 * página.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * LO QUE SÍ CAMBIA PARA EL QUE LLAMA
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Tres cosas, y todas hay que aprenderlas antes de elegir Shadow DOM:
 *
 *   1. `document.querySelector("character-card [data-field=name]")` ya no
 *      encuentra nada. Los selectores de la página no cruzan la frontera.
 *
 *   2. `document.querySelectorAll("character-card")` **sí** los encuentra. Los
 *      elementos son hijos de la página; lo que está en su interior, no. Es
 *      la distinción que más confunde: el host se ve, su contenido no.
 *
 *   3. Un evento con `composed: false` **no sale** del shadow root. Por eso los
 *      eventos de esta serie llevan `composed: true`; sin eso, el clic en la
 *      tarjeta se quedaría dentro de ella y `app.js` no se enteraría nunca.
 */

import "./character-list.js";
// El store no se toca en este bloque: se reutiliza el del 06, tal cual.
import { CharacterStore } from "./../06-actualizar/store.js";

const CHARACTERS_URL = "/api/characters";

const searchForm = document.querySelector("#search-form");
const queryInput = document.querySelector("#query");
const countLabel = document.querySelector("#result-count");
const favoriteLabel = document.querySelector("#favorite-count");
const list = document.querySelector("character-list");
const addForm = document.querySelector("#add-form");
const nameInput = document.querySelector("#new-name");
const resetButton = document.querySelector("#reset");

function describeCount(visible, total) {
  if (visible === total) return `Mostrando los ${total} personajes`;
  if (visible === 0) return "Ningún personaje coincide con la búsqueda";
  return `Mostrando ${visible} de ${total} personajes`;
}

const response = await fetch(CHARACTERS_URL);
const data = await response.json();

const store = new CharacterStore(data.characters);

list.isFavorite = (id) => store.isFavorite(id);
list.addEventListener("character-favorite", (event) => {
  store.toggleFavorite(event.detail.id);
});

function onStoreChange(state, change) {
  countLabel.textContent = describeCount(
    state.visible.length,
    state.characters.length,
  );
  favoriteLabel.textContent = String(state.favoriteCount);

  switch (change.type) {
    case "added":
    case "updated":
    case "removed":
      list.patch(state.visible);
      break;

    default:
      list.characters = state.visible;
  }
}

store.subscribe(onStoreChange);

searchForm.addEventListener("submit", (event) => {
  event.preventDefault();
});

queryInput.addEventListener("input", () => {
  store.setQuery(queryInput.value);
});

addForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const name = nameInput.value.trim();
  if (name.length === 0) return;
  store.add(name);
  nameInput.value = "";
  nameInput.focus();
});

resetButton.addEventListener("click", () => {
  store.reset();
});

onStoreChange(store.state, { type: "reset" });
