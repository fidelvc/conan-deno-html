/**
 * app.js · 02 clases
 * ==================
 *
 * El mismo HTML del bloque 01, pero el estado ya no son tres variables sueltas:
 * es un `CharacterStore`.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * LA DIFERENCIA CON EL 01
 * ─────────────────────────────────────────────────────────────────────────────
 *
 *   Antes:  search()  →  mutaba dos variables  →  render()
 *   Ahora:  search()  →  store.setQuery(...)   →  (el store avisa) → render()
 *
 * `render` ya no se llama a mano. Se registra con `subscribe`, que devuelve
 * una función de baja: cuando alguien llame a esa función, este bloque deja
 * de enterarse de los cambios.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * LO QUE SIGUE SIN ESTAR RESUELTO
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * El HTML de la tarjeta sigue siendo una cadena con `map` y `join`. Con dos
 * o tres tarjetas es cómodo; con un formulario de edición, una línea más, ya
 * son comillas y `\n` mezclados con el contenido. El bloque 03 lo arregla con
 * `<template>`, y de paso te enseña por qué existe el elemento.
 */

import { CharacterStore } from "./store.js";

const CHARACTERS_URL = "/api/characters";

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

const form = document.querySelector("#search-form");
const input = document.querySelector("#query");
const countLabel = document.querySelector("#result-count");
const list = document.querySelector("#characters");

/** Pinta lo que haya. No lee nada del store: recibe el estado. */
function render(state) {
  list.innerHTML = state.visible.map(cardHtml).join("");
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

// Suscribirse devuelve la baja. En una app de una sola vista no hace falta
// llamarla, pero en cuanto el componente se monte y desmonte, sí: aquí se
// llama al salir de la página, que es el caso real.
const unsubscribe = store.subscribe(render);

addEventListener("pagehide", unsubscribe, { once: true });

form.addEventListener("submit", (event) => {
  // Sin esto, el formularioGET recarga la página entera.
  event.preventDefault();
});

input.addEventListener("input", () => {
  store.setQuery(input.value);
});

render(store.state);
