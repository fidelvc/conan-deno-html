/**
 * character-list.js · 08 integración
 * =================================
 *
 * La lista del bloque 07, con una cosa más dentro: los botones de filtro por
 * grupo y por universo.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * EL BLOQUE ENTERO EN UNA FRASE
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * En el 06, los filtros de grupo eran un `<select>` en `index.html`, con su
 * listener en `app.js`. Aquí son botones **dentro** del componente, y quien
 * los decide es quien usa el componente.
 *
 * El efecto secundario es el que importa. `app.js` ya no tiene ni un
 * `<select>` que escuchar, ni un `id` de filtro, ni un `addEventListener` por
 * filtro. Solo una línea que dice "cuando pase algo, aplica esto":
 *
 *     list.addEventListener("group-filter-changed", (event) => {
 *       store.setGroupFilter(event.detail.groups);
 *     });
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * POR QUÉ ES MEJOR, Y CUÁNDO NO LO ES
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Es mejor porque el filtro es **parte de la lista**: sin lista no tiene
 * sentido, así que va con ella. Y va con su estilo, su accesibilidad y su
 * teclado, sin que nadie tenga que acordarse de duplicarlo.
 *
 * No es mejor si el filtro tiene que afectar a dos listas a la vez, o a la
 * vez que pinte otra cosa de la página. Entonces el filtro deja de ser de la
 * lista, y el sitio correcto vuelve a ser la página.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * LOS FILTROS VIVEN EN EL SHADOW ROOT
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Y eso significa que están fuera del alcance de los selectores de la
 * página: `document.querySelector("button.group")` devuelve `null`. Con
 * `mode: "open"` puedes entrar por `list.shadowRoot.querySelector(...)`, y con
 * `closed` no. El coste de la encapsulación, en vivo.
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

const styles = `
  :host {
    display: block;
  }

  .filters {
    display: flex;
    flex-wrap: wrap;
    gap: 0.35rem;
    margin-block: 0.8rem;
  }

  .filters button {
    font-size: 0.78rem;
    padding: 0.25rem 0.6rem;
  }

  .filters button[aria-pressed="true"] {
    font-weight: 600;
    border-width: 2px;
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

/** Los grupos disponibles, en el mismo orden que el dataset. */
const GROUPS = [
  ["familia-kosaka", "Familia Kosaka"],
  ["hermanas-gokou", "Hermanas Gokou"],
  ["familia-kurusu", "Familia Kurusu"],
  ["familia-tamura", "Familia Tamura"],
  ["familia-akagi", "Familia Akagi"],
  ["club-meruru", "Stardust Witch Meruru"],
  ["club-videojuegos", "Club de Investigacion de Videojuegos"],
];

const UNIVERSES = [
  ["realidad", "Realidad"],
  ["meruru", "Meruru"],
];

export class CharacterList extends HTMLElement {
  #characters = [];
  #isFavorite = () => false;
  #groups = [];
  #universe = null;
  #cards = new Map();

  get root() {
    return this.shadowRoot;
  }

  get groupFilter() {
    return this.#groups;
  }

  get universeFilter() {
    return this.#universe;
  }

  get characters() {
    return this.#characters;
  }

  /** Las tarjetas se pintan, pero los filtros viven dentro del shadow root. */
  set characters(characters) {
    this.#characters = characters;
    this.patch(characters);
  }

  set isFavorite(predicate) {
    this.#isFavorite = predicate;
    this.patch(this.#characters);
  }

  /** Marca un grupo como activo, y solo ese. */
  setGroupFilter(groups) {
    this.#groups = [...groups];
    this.#renderFilters();
  }

  setUniverseFilter(universe) {
    this.#universe = universe;
    this.#renderFilters();
  }

  patch(characters) {
    const nextIds = characters.map((character) => character.id);

    // Quita las que ya no están. `replaceChildren` al final pone el orden.
    for (const [id, card] of this.#cards) {
      if (!nextIds.includes(id)) {
        card.remove();
        this.#cards.delete(id);
      }
    }

    const next = characters.map((character) => {
      const existing = this.#cards.get(character.id);
      if (existing) {
        this.#fillCard(existing, character);
        return existing;
      }

      const card = document.createElement("character-card");
      this.#fillCard(card, character);
      this.#cards.set(character.id, card);
      return card;
    });

    this.#list.replaceChildren(...next);
  }

  syncOrder() {
    // `replaceChildren` con el orden correcto ya resuelve esto en una pasada.
    // Se deja el método porque la serie lo necesita: aquí es donde se
    // compararía con el DOM actual y se moverían solo las tarjetas que
    // cambian de posición.
  }

  #fillCard(card, character) {
    card.character = character;
    card.isFavorite = this.#isFavorite(character.id);
    card.innerHTML = badgeFor(character) + favoriteButton(card.isFavorite);
  }

  /** Los botones de filtro, con el estado actual marcado con `aria-pressed`. */
  #renderFilters() {
    this.#filters.replaceChildren(
      ...GROUPS.map(([id, label]) =>
        this.#filterButton({
          id,
          label,
          pressed: this.#groups.includes(id),
          onClick: () =>
            this.groupFilterChanged({ type: "group", groups: [id] }),
        })
      ),
      ...UNIVERSES.map(([id, label]) =>
        this.#filterButton({
          id,
          label,
          pressed: this.#universe === id,
          onClick: () => this.universeFilterChanged(id),
        })
      ),
    );
  }

  #filterButton({ id, label, pressed, onClick }) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "filter";
    button.dataset.filter = id;
    button.textContent = label;
    button.setAttribute("aria-pressed", String(pressed));
    button.addEventListener("click", onClick);
    return button;
  }

  /**
   * TODO 3 · Avisa de que se ha pulsado un filtro de grupo.
   *
   * Lanza un `CustomEvent` con `bubbles: true` y `composed: true`, y un
   * `detail` con los grupos que deben quedar **activos después** del clic.
   *
   * Por qué "después" y no "el que se ha pulsado": porque el filtro es
   * conmutado. Quien escucha tiene que saber si activar o desactivar, y eso se
   * decide mirando si ya estaba activo. Que lo decida la lista y no quien
   * escucha es lo que permite que `app.js` siga siendo una línea.
   */
  groupFilterChanged() {
    throw new Error("TODO 3 · implementa CharacterList.groupFilterChanged");
  }

  /** Igual que el anterior, para el filtro de universo. */
  universeFilterChanged(universe) {
    const next = this.#universe === universe ? null : universe;
    this.#universe = next;
    this.#renderFilters();

    this.dispatchEvent(
      new CustomEvent("universe-filter-changed", {
        bubbles: true,
        composed: true,
        detail: { universe: next },
      }),
    );
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

    const shadow = this.attachShadow({ mode: "open" });

    const style = document.createElement("style");
    style.textContent = styles;

    this.#filters = document.createElement("div");
    this.#filters.className = "filters";

    this.#list = document.createElement("ul");
    this.#list.className = "grid";

    shadow.append(style, this.#filters, this.#list);
  }

  connectedCallback() {
    this.addEventListener("character-favorite", this.#forwardFavoriteChange);
    this.#renderFilters();
  }

  disconnectedCallback() {
    this.removeEventListener("character-favorite", this.#forwardFavoriteChange);
  }
}

customElements.define("character-list", CharacterList);
