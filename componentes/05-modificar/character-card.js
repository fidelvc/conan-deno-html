/**
 * character-card.js · 05 modificar
 * ================================
 *
 * La tarjeta del bloque 04, con un botón y un evento.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * LO QUE HACE Y LO QUE NO HACE
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Hace:   avisa de que alguien ha pulsado su botón de favorito.
 * No hace: decidir si el personaje es favorito, ni guardarlo, ni repintarse.
 *
 * Esa última parte es la que sorprende. La tarjeta **no** cambia de aspecto
 * al pulsarla. Cambia de aspecto cuando el store avisa, la lista se repinta, y
 * la tarjeta recibe su personaje otra vez con `isFavorite` a `true`. Dos
 * cosas muy distintas, y por eso el botón parece no hacer nada durante un
 * instante.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * POR QUÉ UN `CustomEvent` Y NO UN CALLBACK
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Un callback sería más corto: `card.onFavorite = () => ...`. Funciona, y es
 * el motivo por el que mucha gente no pasa nunca a los eventos.
 *
 * El problema del callback es que te ata a la forma del árbol. Con un
 * callback, cada nivel que hay en medio tiene que reenviar la llamada:
 *
 *     card.onFavorite = () => list.onCardFavorite()
 *     list.onCardFavorite = () => store.toggleFavorite(id)
 *
 * Y en cuanto hay un nivel más, otro reenvío. Con eventos no: la tarjeta lanza
 * un evento que sube, y quien esté escuchando lo oye. Los niveles de en medio
 * no tienen que hacer **nada**. Es la diferencia entre un árbol de llamadas y
 * un árbol de escuchas.
 *
 * El `bubbles: true` es lo que hace que suba. Sin él, el evento se queda en
 * la tarjeta y no lo oye nadie.
 */

const template = document.querySelector("#character-card-template");

export class CharacterCard extends HTMLElement {
  #character = null;
  #isFavorite = false;

  /**
   * TODO 2 · Rellena el template con el personaje.
   *
   *   1. guarda el personaje en `#character`,
   *   2. clona `template.content` con `cloneNode(true)`,
   *   3. busca dentro del clon los huecos con `querySelector` y rellénalos
   *      con `textContent`,
   *   4. y vacía `this` antes de meter el clon, o en la segunda tarjeta
   *      aparecerán las dos.
   *
   * El botón va en el slot, y lo pone esta misma tarjeta. En el 06 se verá por
   * qué es mejor que lo ponga quien compone.
   *
   * Los selectores son los `data-*` del template:
   * `[data-field="name"]`, `[data-field="family"]`,
   * `[data-field="description"]`, `[data-field="tags"]`.
   */
  set character(character) {
    throw new Error("TODO 2: implementa el setter character de CharacterCard", {
      // Si `hijos` sale a 0, el `id` del template no coincide con el del HTML.
      cause: { id: character.id, hijos: template.content.childElementCount },
    });
  }

  get character() {
    return this.#character;
  }

  get isFavorite() {
    return this.#isFavorite;
  }

  /**
   * TODO 3 · Avisa de que se ha pulsado el botón de favorito.
   *
   * Un `addEventListener` no es un método de la clase: es una función, y por
   * eso hace falta el `bind` en el `constructor`. Sin él, `this` dentro sería
   * el botón, no la tarjeta, y `this.dispatchEvent` no existiría.
   *
   * Después, lanza un `CustomEvent`:
   *
   *     this.dispatchEvent(
   *       new CustomEvent("character-favorite", {
   *         bubbles: true,
   *         detail: { id: this.#character.id, forwarded: false },
   *       }),
   *     );
   *
   *   · `bubbles: true` para que suba por el árbol,
   *   · `detail` para llevar el id. En un `Event` normal no hay dónde meter
   *     datos, y por eso existe `CustomEvent`.
   *   · `forwarded: false` es la marca de "este evento no ha pasado todavía
   *     por una lista". La lista la pone a `true` al reenviar, y así sabe si
   *     el que oye es el primero o un ancestro. En el 06 se explica.
   */
  favoriteChanged() {
    throw new Error("TODO 3: implementa CharacterCard.favoriteChanged", {
      cause: { id: this.#character?.id },
    });
  }

  constructor() {
    super();
    this.favoriteChanged = this.favoriteChanged.bind(this);
  }
}

customElements.define("character-card", CharacterCard);
