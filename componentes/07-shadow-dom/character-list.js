/**
 * character-list.js · 07 shadow dom
 * ================================
 *
 * La lista del bloque 06, también encapsulada.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * EL DETALLE QUE ROMPE ESTE BLOQUE
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * La lista del bloque 06 hacía esto:
 *
 *     card.innerHTML = badgeFor(character) + favoriteButton(...);
 *
 * Con la tarjeta en el light DOM, eso funcionaba: el `<slot>` de la tarjeta
 * estaba en la misma ruta de selectores y `innerHTML` lo encontraba.
 *
 * Ahora la tarjeta está dentro de **su** shadow root. Y `innerHTML` es de
 * exactamente el light DOM: pone los nodos como hijos del `<character-card>`,
 * que es donde está el `<slot>`. Así que **sí sigue funcionando**, y esa es
 * la parte que sorprende.
 *
 * Donde sí se rompe es al revés: la lista, si se encapsula, ya no puede hacer
 * `card.character = ...` con un `querySelector` suyo, porque la tarjeta sigue
 * siendo un hijo suyo. Eso funciona. Lo que no funciona es que la lista
 * **sí** puede estilizar a las tarjetas con sus propias reglas, y antes no
 * podía.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * POR QUÉ ESTA LISTA NO TIENE UN `<slot>`
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Podría, y en una app real probablemente lo tendría: `<slot>` para que quien
 * use la lista pueda poner una cabecera o un pie dentro. Aquí no, porque si lo
 * metiera, el contenido de `<slot>` se quedaría en el light DOM de la lista, es
 * decir, en el de la **página** (salvo `mode: "closed"`), y volvería a quedar
 * sin encapsular.
 *
 * Ese es el tradeoff del que habla este bloque, y por eso el README termina
 * con la pregunta de cuándo **no** usar Shadow DOM.
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

/**
 * Los estilos de la lista. `:host` para el propio componente, y `.character`
 * para lo que hay dentro, que aquí sí es suyo.
 */
const styles = `
  :host {
    display: block;
  }

  .grid {
    display: grid;
    gap: 1rem;
    grid-template-columns: repeat(auto-fill, minmax(14rem, 1fr));
    margin: 0;
    padding: 0;
    list-style: none;
  }
`;

export class CharacterList extends HTMLElement {
  #characters = [];
  #isFavorite = () => false;
  #cards = new Map();

  get root() {
    return this.shadowRoot;
  }

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
   * TODO 3 · Actualiza solo lo que ha cambiado, y ya sin shadow root.
   *
   * Igual que el del bloque 06. No hay que cambiar ni una línea del
   * algoritmo, y esa es la prueba de que el shadow root **no** cambia cómo se
   * pinta: solo dónde viven los nodos.
   *
   * Lo único que hay que tener en cuenta es que `this.replaceChildren` sigue
   * funcionando con un shadow root: los hijos del shadow root son sus hijos.
   */
  patch(characters) {
    throw new Error("TODO 3: implementa CharacterList.patch", {
      cause: { total: characters.length, cacheadas: this.#cards.size },
    });
  }

  /** Mueve tarjetas para que el orden sea el pedido, sin recrearlas. */
  syncOrder(characters) {
    throw new Error("TODO 3: implementa CharacterList.syncOrder", {
      cause: { pedido: characters.map((character) => character.id) },
    });
  }

  #createCard(character) {
    const card = document.createElement("character-card");
    this.#fillCard(card, character);
    this.#cards.set(character.id, card);
    return card;
  }

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
        composed: true,
        detail: event.detail,
      }),
    );
  }

  constructor() {
    super();

    // TODO 3 · Este es el otro `attachShadow`. Mismo patrón, otro componente.
    // El `innerHTML` con el `<ul class="grid">` va **dentro** del shadow root,
    // así que el `<ul>` de la lista ya no es un hijo de la página: y por eso
    // `assets/estilos.css` ya no lo puede estropear.
    this.innerHTML = `
      <style>${styles}</style>
      <ul class="grid"></ul>
    `;
  }

  connectedCallback() {
    this.addEventListener("character-favorite", this.#forwardFavoriteChange);
  }

  disconnectedCallback() {
    this.removeEventListener("character-favorite", this.#forwardFavoriteChange);
  }
}

customElements.define("character-list", CharacterList);
