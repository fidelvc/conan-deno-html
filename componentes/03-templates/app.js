/**
 * app.js · 03 templates
 * =====================
 *
 * El mismo `app.js` que el 02, con una diferencia: ya no hay `cardHtml` ni
 * `escapeHtml`. El HTML se clona de un `<template>`, y el texto entra con
 * `textContent`.
 *
 * Fíjate en lo que **no** ha cambiado: el store, el `subscribe`, el
 * `setQuery`, la forma de pedir los datos. La serie entera va a consistir en
 * esto: cambiar una cosa pequeña y comprobar que todo lo demás aguanta.
 */

import "./character-list.js";
import { CharacterStore } from "./../02-clases/store.js";

const CHARACTERS_URL = "/api/characters";

const form = document.querySelector("#search-form");
const input = document.querySelector("#query");
const countLabel = document.querySelector("#result-count");
const list = document.querySelector("character-list");

/** Pinta lo que haya. No lee nada del store: recibe el estado. */
function render(state) {
  list.characters = state.visible;
  countLabel.textContent = describeCount(
    state.visible.length,
    state.characters.length,
  );
}

/** El texto del contador. */
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
