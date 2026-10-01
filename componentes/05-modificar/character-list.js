/**
 * character-list.js · 05 modificar
 * ===============================
 *
 * El contenedor del bloque 04, con un hueco más: ahora se queda con los
 * clics de sus tarjetas.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * POR QUÉ LA LISTA NO LLAMA AL STORE
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Podría. `CharacterList` podría importarse el store, guardarlo, y llamar a
 * `toggleFavorite` en cuanto oyera el evento. Serían tres líneas menos.
 *
 * Y sería un error, por una razón que conviene tener clara ya: si la lista
 * conoce el store, la lista deja de poder vivir sin él. En cuanto quieras
 * usar `<character-list>` en otra página —en un panel lateral, en una página
 * de detalle— tendrás que inyectarle un store aunque en esa página el dato
 * no exista. Y el día que tengas dos stores, la lista tendrá que saber
 * cuál.
 *
 * Así que la lista solo reenvía, y quien decide es `app.js`:
 *
 *     tarjeta --(character-favorite)--> lista --(character-favorite)--> app.js
 *
 * La lista no sabe quién está arriba. Igual que la tarjeta no sabe quién la
 * escucha. Un componente que no sabe nada del mundo es un componente que
 * puedes usar en cualquier sitio.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * POR QUÉ ESTO NO ES "SOLO REENVÍAR"
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Porque aquí se aprende la parte incómoda de los eventos: la tarjeta lanza
 * un evento **por cada instancia**, o sea, 17 veces por cada clic. Si la lista
 * reenvía las 17, el evento sale 17 veces hacia arriba.
 *
 * Dos formas de arreglarlo, y las dos están en el código:
 *
 *   · `event.stopPropagation()` en la tarjeta, para que el evento no salga de
 *     ella. El defecto es que un ancestro legítimo ya no puede escucharla.
 *   · marcar el evento con una bandera propia (`event.handled`), comprobar en
 *     la lista si ya viene reenviado, y solo reenviar una vez.
 *
 * Aquí se usa la segunda, y merece la pena ver por qué: `stopPropagation`
 * rompe la reusabilidad, que es justo lo que se acaba de construir.
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

/** El HTML del badge, o `""` si el personaje no tiene edad. */
export function badgeFor(character) {
  if (character.age === undefined) return "";
  return `<span class="badge">${escapeHtml(character.age)} años</span>`;
}

/** El botón de favorito, que es el contenido del slot en este bloque. */
function favoriteButton() {
  return `<button type="button" class="favorite">Favorito</button>`;
}

export class CharacterList extends HTMLElement {
  #characters = [];
  #isFavorite = () => false;

  /**
   * El store sigue estando fuera. La lista solo necesita **preguntar** si un
   * id es favorito, y eso se le pasa como una función.
   *
   * Por qué una función y no el store entero: porque así la lista no depende
   * de nada externo y se puede probar sola, y porque el store puede ser
   * cualquiera —un `Map` en memoria, uno guardado en `localStorage`, uno que
   * manda a un servidor— sin que la lista se entere.
   */
  set isFavorite(predicate) {
    this.#isFavorite = predicate;
    this.render();
  }

  get characters() {
    return this.#characters;
  }

  set characters(characters) {
    this.#characters = characters;
    this.render();
  }

  /**
   * TODO 3 · Escucha el evento de las tarjetas y reenvíalo **una vez**.
   *
   *   1. registra un `addEventListener("character-favorite", ...)` en
   *      `this`,
   *   2. dentro, comprueba si el evento ya viene reenviado (la marca que
   *      pongas en el TODO 2 de `character-card.js`) y, si no la trae,
   *      reenvíalo tú con `this.dispatchEvent(...)` y márcalo.
   *
   * Y algo más, que es la mitad del bloque: **hay que darse de baja**.
   * `connectedCallback` se llama cada vez que el elemento entra en el
   * documento, no solo la primera. Si registras el oyente sin quitar el
   * anterior, cada ciclo de montaje suma otro y un clic acaba repintando la
   * lista cuatro veces.
   */
  connectedCallback() {
    throw new Error("TODO 3 · implementa CharacterList.connectedCallback");
  }

  /** Un `<character-card>` por personaje, cada uno con su badge y su botón. */
  render() {
    this.replaceChildren(
      ...this.#characters.map((character) => {
        const card = document.createElement("character-card");
        card.character = character;
        card.isFavorite = this.#isFavorite(character.id);
        card.innerHTML = badgeFor(character) + favoriteButton();
        return card;
      }),
    );
  }
}

customElements.define("character-list", CharacterList);
