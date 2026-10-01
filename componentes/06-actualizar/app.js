/**
 * app.js · 06 actualizar
 * ======================
 *
 * El `app.js` del bloque 05 con un `if` más. Y esa es toda la diferencia.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * EL `switch` ES LA IDEA DEL BLOQUE
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Antes, cualquier cambio repintaba la lista entera. Ahora se mira **qué tipo
 * de cambio es** y se hace lo justo:
 *
 *     added   → una tarjeta nueva, el resto no se toca
 *     updated → esa tarjeta se rellena otra vez, el resto no se toca
 *     removed → esa tarjeta se va
 *     reset   → aquí sí, repintado completo
 *
 * Este `switch` es el sitio donde se decide la política de render, y está en
 * la página y no en el store ni en el componente. Esa separación es lo que
 * permite que el store no sepa nada de tarjetas y el componente no sepa nada
 * de datos.
 */

import "./character-list.js";
import { CharacterStore } from "./store.js";

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

/**
 * El oyente del store. Ahora recibe dos cosas: el estado y el tipo de cambio.
 */
function onStoreChange(state, change) {
  countLabel.textContent = describeCount(
    state.visible.length,
    state.characters.length,
  );
  favoriteLabel.textContent = String(state.favoriteCount);

  switch (change.type) {
    case "added":
      list.patch(state.visible);
      break;

    case "updated":
      list.patch(state.visible);
      break;

    case "removed":
      list.patch(state.visible);
      break;

    case "reset":
      list.characters = state.visible;
      break;

    default:
      // Una búsqueda cambia la lista entera: aquí sí, repintado completo.
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
