/**
 * store.js · 08 integración
 * =========================
 *
 * El store del bloque 06 con dos filtros más, y un detalle que cambia todo:
 *
 *   · hay **un** sitio que calcula `#visible`, y se llama `#computeVisible`.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * LO QUE ESTE BLOQUE VIENE A ENSEÑAR
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Compara los dos stores:
 *
 *   Bloque 02:                    Bloque 08:
 *     setQuery(query) {              setQuery(query) {
 *       this.#query = normalize(q)     this.#query = normalize(query)
 *       this.#visible = filter(...)    this.#computeVisible()
 *     }                              }
 *
 *                                  setGroupFilter(group) {
 *                                    this.#groupFilter = group
 *                                    this.#computeVisible()
 *                                  }
 *
 * En el 02, `setQuery` era el único que sabía filtrar. Añadir un criterio
 * obligaba a tocarlo, y a acordarse de que combinase con el criterio nuevo. En
 * el 08, cada `set` solo guarda su valor y llama a `#computeVisible`, y ese
 * método es el único que sabe cómo se combinan los tres.
 *
 * Esa es la clase de bug que no aparece hasta que hay tres filtros, y para el
 * que no hay test. Un filtro que se ignoraba a sí mismo en un `||` equivocado
 * se ve en cuanto alguien lo usa, pero uno que se combinaba mal solo aparece
 * con una combinación concreta de los tres.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * POR QUÉ UN `Set` PARA LOS GRUPOS Y NO UN STRING
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Porque "Familia Kosaka **y** Hermana Gokou" es una pregunta razonable en un
 * filtro, y con un string tendrías que separarlo otra vez en cada comparación.
 * Un `Set` de ids: `.has()`, `.add()`, `.delete()`, y la intersección sale sola.
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
  #groupFilter = new Set();
  #universeFilter = null;
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

  get visible() {
    return this.#visible;
  }

  get query() {
    return this.#query;
  }

  get groupFilter() {
    return this.#groupFilter;
  }

  get universeFilter() {
    return this.#universeFilter;
  }

  get favoriteIds() {
    return this.#favoriteIds;
  }

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
      visible: this.#visible,
      query: this.#query,
      groupFilter: this.#groupFilter,
      universeFilter: this.#universeFilter,
      favoriteIds: this.#favoriteIds,
      favoriteCount: this.#favoriteIds.size,
    };
  }

  setQuery(query) {
    this.#query = normalize(query);
    this.#computeVisible();
    this.#notify();
  }

  /**
   * TODO 1 · Filtra por uno o varios grupos.
   *
   *   1. si `groups` es un array, sustituye el `Set` entero con
   *      `new Set(groups)`,
   *   2. si es `null`, lo deja vacío, que es "sin filtro de grupo",
   *   3. `#computeVisible()`,
   *   4. y avisa con `{ type: "filtered" }`.
   *
   * Un `Set` vacío significa "no filtrar por grupo". No es lo mismo que un
   * `Set` con un id que no existe, que se vería igual en la interfaz y
   * filtraría todo. Si te parece raro, la alternativa es `null`, que es peor:
   * obliga a comprobar en cada sitio.
   */
  setGroupFilter(groups) {
    throw new Error("TODO 1: implementa CharacterStore.setGroupFilter", {
      cause: { groups },
    });
  }

  /**
   * TODO 2 · Filtra por universo ("realidad" o "meruru", o `null`).
   *
   *   1. normaliza el valor con `normalize()`,
   *   2. guárdalo en `#universeFilter`, o `null` si no hay filtro,
   *   3. `#computeVisible()`,
   *   4. y avisa con `{ type: "filtered" }`.
   */
  setUniverseFilter(universe) {
    throw new Error("TODO 2: implementa CharacterStore.setUniverseFilter", {
      cause: { universe },
    });
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

  add(name) {
    let id = slugify(name);
    let suffix = 2;

    while (this.#characters.some((character) => character.id === id)) {
      id = `${slugify(name)}-${suffix}`;
      suffix++;
    }

    const character = {
      id,
      name,
      family: "Sin familia",
      group: "familia-kosaka",
      universe: "realidad",
      tags: [],
      description: "",
      arc: "",
      relationships: [],
    };

    this.#characters = [...this.#characters, character];
    this.#addedIds.add(id);
    this.#computeVisible();
    this.#notify({ type: "added", id });
    return id;
  }

  update(id, changes) {
    const index = this.#characters.findIndex((character) =>
      character.id === id
    );
    if (index === -1) return false;

    this.#characters = this.#characters.map((character) =>
      character.id === id ? { ...character, ...changes } : character
    );
    this.#computeVisible();
    this.#notify({ type: "updated", id, character: this.#characters[index] });
    return true;
  }

  remove(id) {
    const exists = this.#characters.some((character) => character.id === id);
    if (!exists) return false;

    this.#characters = this.#characters.filter((character) =>
      character.id !== id
    );
    this.#favoriteIds.delete(id);
    this.#addedIds.delete(id);
    this.#computeVisible();
    this.#notify({ type: "removed", id });
    return true;
  }

  reset() {
    this.#characters = this.#characters.filter((character) =>
      !this.#addedIds.has(character.id)
    );
    this.#addedIds = new Set();
    this.#query = "";
    this.#groupFilter = new Set();
    this.#universeFilter = null;
    this.#computeVisible();
    this.#notify({ type: "reset" });
  }

  subscribe(listener) {
    this.#listeners.add(listener);
    return () => this.#listeners.delete(listener);
  }

  /**
   * El único sitio que sabe cómo se combinan los filtros.
   *
   * Los tres se aplican con AND: un personaje sale si casa con la búsqueda **y**
   * con el grupo **y** con el universo. La búsqueda ya la resuelve
   * `matchesQuery`, que ya era un AND de términos.
   */
  #computeVisible() {
    this.#visible = this.#characters.filter((character) => {
      if (!matchesQuery(character, this.#query)) return false;

      if (
        this.#groupFilter.size > 0 &&
        !this.#groupFilter.has(character.group)
      ) {
        return false;
      }

      if (
        this.#universeFilter !== null &&
        character.universe !== this.#universeFilter
      ) {
        return false;
      }

      return true;
    });
  }

  #notify(change = { type: "filtered" }) {
    const state = this.state;
    for (const listener of this.#listeners) listener(state, change);
  }
}
