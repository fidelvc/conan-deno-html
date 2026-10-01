/**
 * character-list.js · 03 templates
 * ================================
 *
 * El contenedor que repite tarjetas. Su trabajo es solo: un `map` que crea
 * un `<character-card>` por personaje.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * LO QUE HAY Y LO QUE NO HAY EN UN CUSTOM ELEMENTO
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Lo que hay, y da igual a dónde estés:
 *
 *   · una clase que extiende `HTMLElement`,
 *   · `customElements.define("nombre-con-guion", Clase)`,
 *   · `connectedCallback()` cuando el elemento entra en el documento,
 *   · atributos observados con `static observedAttributes`.
 *
 * Lo que **no** hay, y es lo primero que sorprende: no hay constructor con
 * argumentos. `<character-card>` no es `new CharacterCard(kyousuke)`. Los datos
 * llegan por propiedades, por atributos o por lo que pinte el contenedor, y
 * por eso el `set character` de `character-card.js` existe.
 *
 * Y el nombre tiene guion, siempre en minúsculas: los nombres válidos llevan
 * al menos un guion (`character-card`, `x-button`). Sin guion, el navegador
 * cree que es un HTML estándar desconocido, lo deja como
 * `HTMLElement` y tu `set character` no aparece en ninguna parte.
 */

/** Importarlo es lo que hace que el navegador ejecute su `define`. */
import "./character-card.js";

export class CharacterList extends HTMLElement {
  #characters = [];

  get characters() {
    return this.#characters;
  }

  /**
   * TODO 2 · Pinta un `<character-card>` por cada personaje.
   *
   *   1. guarda la lista en `#characters`,
   *   2. vacía `this` con `replaceChildren()`,
   *   3. y por cada personaje crea un `character-card` y asígnale el
   *      personaje con la propiedad `character`.
   *
   * `replaceChildren()` sin argumentos es la forma limpia de vaciar un
   * contenedor en una llamada. La alternativa —borrar en un bucle, o poner
   * `innerHTML = ""`— deja de funcionar en cuanto metes un nodo que no
   * depende de la lista, que es justo lo que pasa en cuanto añades una
   * cabecera al componente.
   */
  set characters(characters) {
    throw new Error(
      "TODO 2 · implementa el setter characters de CharacterList",
    );
  }
}

customElements.define("character-list", CharacterList);
