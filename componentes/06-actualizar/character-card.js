/**
 * character-card.js · 06 actualizar
 * ================================
 *
 * Igual que el del bloque 05, con una diferencia: la tarjeta ya **no** crea
 * su propio botón, lo recibe.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * POR QUÉ
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * En el 05 la tarjeta hacía:
 *
 *     const button = document.createElement("button");
 *     button.addEventListener("click", this.favoriteChanged);
 *     fragment.querySelector("slot").replaceChildren(button);
 *
 * Eso funcionaba, pero obligaba a la tarjeta a saber que el contenido del
 * slot era siempre un botón de favorito. Un componente que adivina qué hay en
 * su hueco no puede usarse con otra cosa dentro.
 *
 * Aquí la tarjeta solo escucha el clic que llegue del slot, sin mirar qué es.
 * El botón lo pone `character-list.js`, que es quien sabe que esto es una
 * lista de favoritos. Cambia el botón por un enlace, o por nada, y la tarjeta
 * sigue funcionando.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * `isFavorite` Y EL `aria-pressed`
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * `isFavorite` es un dato, no un aspecto: se pinta como atributo
 * `aria-pressed` para que un lector de pantalla anuncie "pulsado", y como
 * clase para el color. Y se pinta **una vez**, cuando llegan los datos.
 * Cuando cambia, quien lo cambia es el componente que lo contiene, y por eso
 * `set isFavorite` vuelve a rellenar.
 */

const template = document.querySelector("#character-card-template");

export class CharacterCard extends HTMLElement {
  #character = null;
  #isFavorite = false;

  /**
   * Rellena el template y deja el slot como está.
   *
   * Ojo al detalle importante: `replaceChildren(fragment)` se come **todo**,
   * slot incluido. Por eso quien rellena el slot tiene que hacerlo **después**
   * de esto, siempre. Es el bug que se veía venir en el bloque 04, y aquí
   * está escrito en el orden correcto a propósito.
   */
  set character(character) {
    this.#character = character;

    const fragment = template.content.cloneNode(true);

    fragment.querySelector('[data-field="name"]').textContent = character.name;
    fragment.querySelector('[data-field="family"]').textContent =
      character.family;
    fragment.querySelector('[data-field="description"]').textContent =
      character.description;
    fragment.querySelector('[data-field="tags"]').replaceChildren(
      ...character.tags.map((tag) => {
        const item = document.createElement("li");
        item.textContent = tag;
        return item;
      }),
    );

    this.classList.toggle("is-favorite", this.#isFavorite);

    this.replaceChildren(fragment);
  }

  get character() {
    return this.#character;
  }

  /** Dato puro, sin HTML: la clase se pone en el elemento, no en una cadena. */
  set isFavorite(isFavorite) {
    if (this.#isFavorite === isFavorite) return;
    this.#isFavorite = isFavorite;
    this.classList.toggle("is-favorite", isFavorite);

    const button = this.querySelector("button.favorite");
    if (button) button.setAttribute("aria-pressed", String(isFavorite));
  }

  get isFavorite() {
    return this.#isFavorite;
  }

  /**
   * Avisa de que alguien ha pulsado algo dentro de la tarjeta.
   *
   * No mira qué es. Solo sabe que ha habido un clic y sube el evento con el
   * id del personaje, para que quien esté arriba decida.
   */
  favoriteChanged() {
    this.dispatchEvent(
      new CustomEvent("character-favorite", {
        bubbles: true,
        detail: { id: this.#character?.id, forwarded: false },
      }),
    );
  }

  constructor() {
    super();
    this.favoriteChanged = this.favoriteChanged.bind(this);
    this.addEventListener("click", this.favoriteChanged);
  }
}

customElements.define("character-card", CharacterCard);
