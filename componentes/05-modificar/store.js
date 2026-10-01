/**
 * store.js · 05 modificar
 * ======================
 *
 * El `CharacterStore` del bloque 02, con un estado más: los favoritos.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * EL PROBLEMA QUE RESUELVE ESTE BLOQUE
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * El clic ocurre en la tarjeta. El dato vive en el store. Son dos ficheros
 * que no se conocen, y entre ellos hay una persona escribiendo:
 *
 *   1. la tarjeta lanza un evento diciendo qué botón se ha pulsado,
 *   2. alguien por encima lo escucha y llama a `store.toggleFavorite(id)`,
 *   3. el store cambia su estado y avisa a sus oyentes,
 *   4. quien esté suscrito vuelve a pintar.
 *
 * Cuatro pasos, y ninguno se salta. El paso 2 es el único que sabe de dónde
 * viene el clic, y por eso está **fuera** de la tarjeta: la tarjeta no sabe
 * quién escucha, ni le importa.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * POR QUÉ `favoriteIds` Y NO UNA BANDERA EN EL PERSONAJE
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Un `character.favorite = true` sería más corto, y por eso es tentador. Pero
 * mezcla dos cosas: el **dataset**, que viene del servidor y es de todos, y
 * el **estado de la aplicación**, que es tuyo y de nadie más. En cuanto
 * serialices el store (el bloque 06 lo hace) el favorito acaba guardado
 * con datos que son solo de lectura.
 *
 * `Set` además te da `add`, `delete` y `has` sin comprobar nada, que es
 * exactamente lo que hace falta para un conjunto de ids.
 *
 * Los tests están al final. Esta vez hay más lógica que en el 02, y se puede
 * probar entera sin DOM otra vez.
 */

import { matchesQuery, normalize } from "./../02-clases/store.js";

export class CharacterStore {
  #characters;
  #query = "";
  #visible;
  #favoriteIds = new Set();
  #listeners = new Set();

  constructor(characters) {
    this.#characters = characters;
    this.#visible = characters;
  }

  get characters() {
    return this.#characters;
  }

  get query() {
    return this.#query;
  }

  get visible() {
    return this.#visible;
  }

  /** Los ids marcados como favoritos. Un `Set`, no un array. */
  get favoriteIds() {
    return this.#favoriteIds;
  }

  /** ¿Es este id favorito? */
  isFavorite(id) {
    return this.#favoriteIds.has(id);
  }

  /** Cuántos favoritos hay, para el contador de la página. */
  get favoriteCount() {
    return this.#favoriteIds.size;
  }

  get state() {
    return {
      characters: this.#characters,
      query: this.#query,
      visible: this.#visible,
      favoriteIds: this.#favoriteIds,
      favoriteCount: this.#favoriteCount(),
    };
  }

  setQuery(query) {
    this.#query = normalize(query);
    this.#visible = this.#characters.filter((character) =>
      matchesQuery(character, this.#query)
    );
    this.#notify();
  }

  /**
   * TODO 1 · Marca o desmarca un favorito.
   *
   *   1. si `#favoriteIds.has(id)`, bórralo con `.delete(id)`,
   *      si no, añádelo con `.add(id)`,
   *   2. avisa a los oyentes con `#notify()`,
   *   3. y devuelve `true` si queda como favorito, `false` si no.
   *
   * Devolver el estado nuevo es lo que permite al botón pintar sin volver a
   * preguntar. No es obligatorio, pero cualquier alternativa que obliga a
   * releer el estado tiene un `isFavorite` más por el camino.
   */
  toggleFavorite(id) {
    throw new Error("TODO 1: implementa CharacterStore.toggleFavorite", {
      cause: { id, yaEraFavorito: this.#favoriteIds.has(id) },
    });
  }

  /** Registra un oyente y devuelve la función de baja. */
  subscribe(listener) {
    this.#listeners.add(listener);
    return () => this.#listeners.delete(listener);
  }

  #favoriteCount() {
    return this.#favoriteIds.size;
  }

  #notify() {
    const state = this.state;
    for (const listener of this.#listeners) listener(state);
  }
}
