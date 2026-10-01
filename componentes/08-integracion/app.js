/**
 * app.js · 08 integración
 * =======================
 *
 * El `app.js` más pequeño de la serie, con la funcionalidad más grande.
 *
 * Toda la diferencia con el bloque 06 son tres `addEventListener` de una
 * línea. Los filtros por grupo y por universo no viven aquí, la lista se
 * encapsuló, y la tarjeta no ha cambiado.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * LO QUE ESTE FICHERO ES
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * El sitio donde se conectan las tres cosas: el store, la lista y la página.
 * Es el **único** fichero de la serie que sabe que las tres existen a la vez,
 * y por eso es el único que cambia.
 *
 * Todo lo demás es intercambiable:
 *
 *   · otro store con los mismos métodos y la página funciona,
 *   · otra lista con los mismos eventos y la página funciona,
 *   · otra página con otro formulario y el store funciona.
 *
 * Ese es el resultado del bloque, y no se nota en la app: se nota en que
 * ningún fichero se importa a otro salvo para usar una clase.
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

// ── De la lista al store ─────────────────────────────────────────────────────

list.isFavorite = (id) => store.isFavorite(id);

list.addEventListener("character-favorite", (event) => {
  store.toggleFavorite(event.detail.id);
});

list.addEventListener("group-filter-changed", (event) => {
  store.setGroupFilter(event.detail.groups);
});

list.addEventListener("universe-filter-changed", (event) => {
  store.setUniverseFilter(event.detail.universe);
});

// ── Del store a la lista ─────────────────────────────────────────────────────

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

  // Los filtros de la lista se marcan desde aquí, no desde dentro del
  // componente: quien tiene la verdad es el store.
  list.setGroupFilter(state.groupFilter);
  list.setUniverseFilter(state.universeFilter);
}

store.subscribe(onStoreChange);

// ── De la página al store ────────────────────────────────────────────────────

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
