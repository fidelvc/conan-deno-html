/**
 * character-card.js · 03 templates
 * ================================
 *
 * El primer Custom Element de la serie: una tarjeta, y el HTML que la
 * describe vive en un `<template>` en vez de en una cadena.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * POR QUÉ `<template>` Y NO UNA CADENA
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * El bloque 02 hacía esto:
 *
 *     `<li class="character"><h2>${escapeHtml(character.name)}</h2>...</li>`
 *
 * Funciona, y para tres líneas es lo razonable. Pero en cuanto la tarjeta
 * crece aparecen cosas que en una cadena son un problema y en un `<template>`
 * no:
 *
 *   · el editor no resalta el HTML, y no puedes pinchar en él para saltar al
 *     elemento;
 *   · hay que acordarse de `escapeHtml` en cada interpolación, y basta con
 *     olvidar una;
 *   · un atributo se abre con comillas dobles y el contenido con simples, o
 *     al revés, y a partir de ahí ya no sabes cuál es cuál.
 *
 * Con `<template>` el HTML se escribe en `index.html`, se parsea **una** vez,
 * y el elemento del que clonas no está en el documento: está en
 * `template.content`, un fragmento que no se pinta hasta que alguien lo clona
 * dentro de la página. Esa es la propiedad que lo hace útil aquí, y por eso
 * existe el elemento y no un `div` escondido.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * POR QUÉ `textContent` Y NO `innerHTML`
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Rellenar el template con `textContent` es lo que hace que `escapeHtml`
 * desaparezca de este bloque. `textContent` **no interpreta** lo que le
 * pases: pone el texto tal cual, siempre. Un `<script>` en el nombre de un
 * personaje sale como texto, y punto.
 *
 * El coste es que si algún día quieres meter HTML de verdad en el template,
 * este camino no vale. Con datos, casi nunca lo quieres.
 */

/** La plantilla de la tarjeta, tal cual la escribió el HTML. */
const template = document.querySelector("#character-card-template");

export class CharacterCard extends HTMLElement {
  #character = null;

  /** El personaje que se está pintando, o `null` si no hay ninguno. */
  get character() {
    return this.#character;
  }

  /**
   * TODO 1 · Rellena el template con el personaje.
   *
   *   1. guarda el personaje en `#character`,
   *   2. clona `template.content` con `cloneNode(true)`,
   *   3. busca dentro del clon los huecos con `querySelector` y rellénalos
   *      con `textContent`,
   *   4. y vacía `this` antes de meter el clon, o en la segunda tarjeta
   *      aparecerán las dos.
   *
   * Los selectores son los `data-*` del template:
   * `[data-field="name"]`, `[data-field="family"]`,
   * `[data-field="description"]`, `[data-field="tags"]`.
   */
  set character(character) {
    throw new Error("TODO 1: implementa el setter character de CharacterCard", {
      // Si `hijos` sale a 0, el `id` del template no coincide con el del HTML.
      cause: { id: character.id, hijos: template.content.childElementCount },
    });
  }
}

customElements.define("character-card", CharacterCard);
