/**
 * character-card.js · 04 slots
 * ============================
 *
 * La tarjeta del bloque 03, con una diferencia: ya no pinta su contenido,
 * lo recibe.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * QUÉ ES UN `<slot>`
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Un hueco con nombre en el template. El que **usa** el componente pone ahí
 * su contenido, y el componente decide únicamente en qué punto de su estructura
 * aparece. El HTML siguiente no dice "quiero un badge de edad aquí", dice
 * "quiero esto aquí":
 *
 *     <character-card>
 *       <span class="badge">17 años</span>
 *     </character-card>
 *
 * Y quien lo usa no sabe nada del interior de la tarjeta. Puede meter un
 * `<span>`, tres elementos, o nada. Eso es la diferencia con el bloque 03,
 * donde la lista tenía que saber qué campos tenía la tarjeta.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * LO QUE `<slot>` NO HACE
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * No mueve el contenido del usuario ni lo copia: lo reparte. Un elemento solo
 * puede estar en un sitio. Si metes el mismo nodo en dos slots, el segundo no
 * lo muestra, y no hay error que te avise.
 *
 * Y hay una consecuencia con la que se topa todo el mundo el primer día: **el
 * contenido del slot vive en el light DOM**, o sea, fuera del componente. En
 * el bloque 07 verás qué pasa con esto cuando cada componente lleva su propio
 * shadow root.
 */

const template = document.querySelector("#character-card-template");

export class CharacterCard extends HTMLElement {
  #character = null;

  get character() {
    return this.#character;
  }

  /**
   * Rellena los huecos que la tarjeta tiene de su cuenta, y deja el `<slot>`
   * intacto.
   *
   * Fíjate en que aquí no hay ningún `remove()`. Los nodos que vienen por el
   * slot no son nuestros: se los deja, se los clona, y punto. Si los
   * borraras, la tarjeta se llevaría por delante contenido del usuario, que es
   * justo el bug más caro de esta serie.
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

    this.replaceChildren(fragment);
  }
}

customElements.define("character-card", CharacterCard);
