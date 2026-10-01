/**
 * character-list.js · 06 actualizar
 * ================================
 *
 * El contenedor del bloque 05, con una diferencia que no se ve en la página y
 * se nota en cuanto hay muchas tarjetas: **no repinta todo**.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * EL PROBLEMA
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * `render(state)` hace `replaceChildren(...todas las tarjetas)`. Funciona, y
 * con 17 elementos es instantáneo. El día que cada tarjeta tenga un `<input>`
 * o un `contenteditable`, cada pulsación de teclado va a destruir el nodo que
 * tenía el foco y crear otro: se pierde el cursor, el scroll, y la posición
 * del ratón. Con 17 no lo notas; con 500 es la app rota.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * LA SOLUCIÓN, EN TRES PIEZAS
 * ─────────────────────────────────────────────────────────────────────────────
 *
 *   1. Guardar las tarjetas ya creadas en un `Map` de id a elemento.
 *   2. En vez de repintar, `patch(characters)`: reutilizar las que ya existen
 *      con `set character` y añadir solo las nuevas con `append`.
 *   3. `syncOrder`, que compara el orden deseado con el actual y mueve solo
 *      lo que está fuera de sitio, con `insertBefore`.
 *
 * El paso 3 es el que casi nadie hace y es el que de verdad importa: comparar
 * y mover, en vez de reconstruir. Un `insertBefore` mueve un nodo **ya
 * montado**, sin recrearlo, y por tanto sin perder el foco ni el scroll de lo
 * que hubiera dentro.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * POR QUÉ UN `Map` Y NO UN ARRAY
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Porque la pregunta es "¿existe ya una tarjeta para este id?", y un `Map`
 * contesta eso en O(1). Con un array tendrías que `find`, que es O(n) por cada
 * personaje, y acabarías en O(n²). Y `Map` mantiene el orden de inserción, que
 * además hace falta para `syncOrder`.
 */

import "./character-card.js";

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export function badgeFor(character) {
  if (character.age === undefined) return "";
  return `<span class="badge">${escapeHtml(character.age)} años</span>`;
}

function favoriteButton(isFavorite) {
  return `<button type="button" class="favorite" aria-pressed="${
    isFavorite ? "true" : "false"
  }">Favorito</button>`;
}

export class CharacterList extends HTMLElement {
  #characters = [];
  #isFavorite = () => false;
  /** @type {Map<string, HTMLElement>} */
  #cards = new Map();
  /** @type {string[]} */
  #order = [];

  get characters() {
    return this.#characters;
  }

  set characters(characters) {
    this.#characters = characters;
    this.patch(characters);
  }

  set isFavorite(predicate) {
    this.#isFavorite = predicate;
    this.patch(this.#characters);
  }

  /**
   * TODO 5 · Actualiza solo lo que ha cambiado.
   *
   * El algoritmo está en el README del bloque; aquí solo hace falta la
   * estructura. Recuerda que `#cards` es la cache, y que es lo que convierte
   * esto de "17 tarjetas nuevas" en "solo los cambios".
   */
  patch(characters) {
    throw new Error("TODO 5: implementa CharacterList.patch", {
      cause: { total: characters.length, cacheadas: this.#cards.size },
    });
  }

  /** TODO 5 (parte 2) · Mueve tarjetas para que el orden sea el pedido. */
  syncOrder(characters) {
    throw new Error("TODO 5: implementa CharacterList.syncOrder", {
      cause: { pedido: characters.map((character) => character.id) },
    });
  }

  /** Crea la tarjeta de un personaje, la pinta y la guarda en el `Map`. */
  #createCard(character) {
    const card = document.createElement("character-card");
    this.#fillCard(card, character);
    this.#cards.set(character.id, card);
    return card;
  }

  /** Rellena una tarjeta que ya existe, sin recrearla. */
  #fillCard(card, character) {
    card.character = character;
    card.isFavorite = this.#isFavorite(character.id);
    card.innerHTML = badgeFor(character) + favoriteButton(card.isFavorite);
  }

  #forwardFavoriteChange(event) {
    if (event.detail.forwarded) return;
    event.detail.forwarded = true;
    this.dispatchEvent(
      new CustomEvent("character-favorite", {
        bubbles: true,
        detail: event.detail,
      }),
    );
  }

  connectedCallback() {
    this.addEventListener("character-favorite", this.#forwardFavoriteChange);
  }

  disconnectedCallback() {
    // Sin esto, cada montaje suma un oyente y un clic acaba repintando N veces.
    this.removeEventListener("character-favorite", this.#forwardFavoriteChange);
  }
}

customElements.define("character-list", CharacterList);
