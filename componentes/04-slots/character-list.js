/**
 * character-list.js · 04 slots
 * ============================
 *
 * El contenedor del bloque 03, con una diferencia: ahora sabe qué va a meter
 * en el `<slot>` de cada tarjeta, y eso no significa que sepa qué hay dentro
 * de la tarjeta.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * EL INTERCAMBIO
 * ─────────────────────────────────────────────────────────────────────────────
 *
 *   Bloque 03:  la lista conoce la estructura de la tarjeta.
 *               (`<h2>` con el nombre, `<p>` con la familia...)
 *   Bloque 04:  la lista conoce la **interfaz** de la tarjeta
 *               (`character = ...`) y decide solo qué va en el hueco.
 *
 * Eso significa que puedes cambiar el interior de `character-card` entero, o
 * usar la misma tarjeta en otro sitio con otro contenido, sin tocar esta
 * lista. Al revés también: cambiar qué hay en el slot no obliga a tocar la
 * tarjeta.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * EL CONTENIDO DEL SLOT SE ESCRIBE EN UNA CADENA
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Parece un retroceso después de haber eliminado las cadenas del bloque 03, y
 * lo parece. Pero hay una diferencia importante: **aquí el HTML es
 * responsibility de quien compone, y lo compone en un solo sitio**. El
 * interior de la tarjeta es HTML de verdad, con su resaltado; solo el relleno
 * del hueco son cadenas. Y un hueco es, por definición, un sitio donde el
 * contenido lo elige otro.
 *
 * El sitio donde esto se rompe de verdad es el bloque 05, cuando el contenido
 * del slot empiece a depender de un clic.
 */

import "./character-card.js";

/** Escapa `&`, `<`, `>`, `"` y `'`. Aquí vuelve a hacer falta, y por qué. */
function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

/**
 * TODO 1 · El HTML del badge de la tarjeta, o `""` si no hace falta.
 *
 * Dos casos, y solo dos:
 *
 *   · si el personaje tiene `age`, devuelve `<span class="badge">` con la edad,
 *   · si no, devuelve `""`.
 *
 * El `""` es la parte importante. Un componente que devuelve HTML vacío cuando
 * no tiene nada que decir es un componente que sabe cuándo callarse; uno que
 * devuelve `<span class="badge"></span>` deja un hueco en la página.
 */
export function badgeFor(character) {
  throw new Error("TODO 1: implementa badgeFor", {
    cause: { id: character.id, escapado: escapeHtml(character.description) },
  });
}

export class CharacterList extends HTMLElement {
  #characters = [];

  get characters() {
    return this.#characters;
  }

  /**
   * TODO 2 · Un `<character-card>` por personaje, cada uno con su badge.
   *
   *   1. guarda la lista en `#characters`,
   *   2. mapea cada personaje a un `character-card` con su `character` y su
   *      `innerHTML` (el contenido del slot),
   *   3. y `replaceChildren(...cards)` de golpe, no con un bucle.
   *
   * Por qué `innerHTML` aquí y no `textContent` en el 03: porque estamos
   * metiendo **HTML elegido por quien compone**, no datos. `badgeFor` ya ha
   * escapado lo que venga del dataset, así que el HTML es nuestro y solo
   * hay que pintarlo.
   */
  set characters(characters) {
    throw new Error(
      "TODO 2 · implementa el setter characters de CharacterList",
    );
  }
}

customElements.define("character-list", CharacterList);
