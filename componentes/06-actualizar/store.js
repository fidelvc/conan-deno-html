/**
 * store.js · 06 actualizar
 * =======================
 *
 * El store del bloque 05, con `add`, `update` y `remove`.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * EL PROBLEMA QUE RESUELVE ESTE BLOQUE
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * En el bloque 05, cualquier cambio llamaba a `render(state)`, que repintaba
 * la lista entera. Con 17 tarjetas no se nota. En cuanto haya una tarjeta
 * por página, o un `input` dentro, se nota muchísimo: se pierde el foco, el
 * scroll y la posición del ratón.
 *
 * Con lo que hay en este fichero ya se puede arreglar la mitad. Cada método
 * dice **qué ha cambiado**, en vez de solo "cambia algo":
 *
 *     { type: "added",   id }
 *     { type: "updated", id, character }
 *     { type: "removed", id }
 *
 * Y `app.js` decide si eso merece repintar todo o solo tocar una tarjeta. Los
 * datos y la decisión se quedan separadas, y por eso esto tiene tests.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * POR QUÉ NUNCA MUTAS EL ARRAY
 * ─────────────────────────────────────────────────────────────────────────────
 *
 *     // NO
 *     this.#characters.push(character);
 *
 *     // SÍ
 *     this.#characters = [...this.#characters, character];
 *
 * `push` muta el array que ya estaba en `#visible` y en el estado que le
 * disteiste a un oyente. Ese oyente tiene una referencia al array antiguo, y
 * si lo está comparando para ver si algo ha cambiado, no verá la diferencia.
 *
 * `[...array, nuevo]` crea un array nuevo, y el anterior sigue intacto. Por eso
 * las referencias pueden servir para detectar cambios, que es exactamente lo
 * que hace el `patch` del componente.
 *
 * El coste es memoria: un array nuevo en cada cambio. Con 17 personajes es
 * irrelevante, y con 17 mil es la razón por la que existen las estructuras
 * incrementales.
 */

import {
  matchesQuery,
  normalize,
  withoutAccents,
} from "./../02-clases/store.js";

/** Genera un id legible a partir de un nombre: "Kirino IJN" → "kirino-ijn". */
export function slugify(name) {
  return withoutAccents(name)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export class CharacterStore {
  #characters;
  #query = "";
  #visible;
  #favoriteIds = new Set();
  #listeners = new Set();
  #addedIds = new Set();

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

  get favoriteIds() {
    return this.#favoriteIds;
  }

  /** Los ids que ha añadido esta sesión, para poder deshacerlos. */
  get addedIds() {
    return this.#addedIds;
  }

  isFavorite(id) {
    return this.#favoriteIds.has(id);
  }

  get favoriteCount() {
    return this.#favoriteIds.size;
  }

  get state() {
    return {
      characters: this.#characters,
      query: this.#query,
      visible: this.#visible,
      favoriteIds: this.#favoriteIds,
      favoriteCount: this.#favoriteIds.size,
    };
  }

  setQuery(query) {
    this.#query = normalize(query);
    this.#visible = this.#characters.filter((character) =>
      matchesQuery(character, this.#query)
    );
    this.#notify();
  }

  toggleFavorite(id) {
    if (this.#favoriteIds.has(id)) {
      this.#favoriteIds.delete(id);
      this.#notify();
      return false;
    }

    this.#favoriteIds.add(id);
    this.#notify();
    return true;
  }

  /**
   * TODO 1 · Añade un personaje nuevo al final.
   *
   *   1. genera el id con `slugify(name)`,
   *   2. si ese id ya existe, añade un sufijo `-2`, `-3`... hasta que sea
   *      único (dos personajes pueden llamarse igual, y el id tiene que
   *      seguir siendo una clave),
   *   3. rellena los campos mínimos: `id`, `name`, `family` (la que venga o
   *      "Sin familia"), `group` (el primer grupo de la lista, para que el
   *      tipo sea válido), `universe: "realidad"`, `tags: []`, `description`
   *      y `arc` vacíos, `relationships: []`,
   *   4. `this.#characters = [...this.#characters, nuevo]`,
   *   5. **recalcula `#visible`** con el filtro actual, que si no el
   *      personaje nuevo no aparece mientras haya una búsqueda activa,
   *   6. `#notify({ type: "added", id })`,
   *   7. y devuelve el `id` nuevo.
   *
   * El paso 5 es el que se olvida siempre, y hay un test para él.
   */
  add(name) {
    throw new Error("TODO 1: implementa CharacterStore.add", {
      cause: { name },
    });
  }

  /**
   * TODO 2 · Cambia un personaje sin tocar el resto.
   *
   *   1. busca el índice con `findIndex`,
   *   2. si no existe, devuelve `false` y no avisa a nadie,
   *   3. si existe, `this.#characters = this.#characters.map((character) =>
   *      character.id === id ? { ...character, ...changes } : character)`,
   *   4. recalcula `#visible`,
   *   5. `#notify({ type: "updated", id, character })` con el personaje **ya
   *      cambiado**, que es lo que va a necesitar el `patch`,
   *   6. y devuelve `true`.
   *
   * El `...changes` es lo importante: solo se pisan los campos que vienen.
   * Es un `patch`, no un `replace`. Si llegaras a escribir `character = changes`
   * en vez de `{ ...character, ...changes }`, un cambio de un solo campo
   * borraría los otros veinte.
   */
  update(id, changes) {
    throw new Error("TODO 2: implementa CharacterStore.update", {
      cause: { id, changes },
    });
  }

  /**
   * TODO 3 · Borra un personaje.
   *
   *   1. `this.#characters = this.#characters.filter((character) =>
   *      character.id !== id)`,
   *   2. si era favorito, `#favoriteIds.delete(id)`, para que no quede un id
   *      fantasma apuntando a nada,
   *   3. `#addedIds.delete(id)`,
   *   4. recalcula `#visible`,
   *   5. `#notify({ type: "removed", id })`,
   *   6. y devuelve `true` si se ha borrado algo, `false` si no.
   */
  remove(id) {
    throw new Error("TODO 3: implementa CharacterStore.remove", {
      cause: { id },
    });
  }

  /**
   * Deja el estado como estaba al empezar, tirando lo añadido.
   *
   * Vuelve a avisar con un `type` distinto, `"reset"`, porque para el
   * componente no es un cambio de una tarjeta: es un "vuelve a pintar todo".
   */
  reset() {
    this.#characters = this.#characters.filter((character) =>
      !this.#addedIds.has(character.id)
    );
    this.#addedIds = new Set();
    this.#visible = this.#characters;
    this.#notify({ type: "reset" });
  }

  subscribe(listener) {
    this.#listeners.add(listener);
    return () => this.#listeners.delete(listener);
  }

  #notify(change = { type: "reset" }) {
    const state = this.state;
    for (const listener of this.#listeners) listener(state, change);
  }
}
