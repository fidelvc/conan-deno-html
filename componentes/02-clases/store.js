/**
 * store.js · 02 clases
 * ====================
 *
 * El estado del bloque 01, con un sitio donde vivir.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * EL PROBLEMA QUE RESUELVE ESTE BLOQUE
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * En el 01 el estado eran tres variables sueltas:
 *
 *     let characters = [];
 *     let query = "";
 *     let visible = [];
 *
 * Eso funciona hasta que alguien añade un criterio. Con un filtro de grupo
 * encima aparecen cuatro variables, la reconstrucción de la lista tiene que
 * tener en cuenta a los dos, y quien escriba un filtro nuevo tiene que saber
 * de la existencia del otro. El estado se desincroniza porque nadie es
 * dueño de él.
 *
 * La clase no arregla eso sola: lo arregla el hecho de que ahora **existe un
 * sitio** donde el estado se lee y donde se escribe. Todo cambio pasa por un
 * método, y todo método deja el estado coherente.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * LO QUE NO CAMBIA
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * El aspecto, el dataset, los nombres y el idioma. Si este bloque se ve
 * distinto al 01 en la página, es que has roto algo.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * POR QUÉ ESTO SÍ TIENE TESTS
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Porque `CharacterStore` no toca el DOM: es estado y funciones puras sobre
 * datos. Deno lo ejecuta en microsegundos, sin navegador y sin puertos. La
 * lección del bloque 04 de `ejercicios/` era esta: si una función no necesita
 * el DOM, testéala sin el DOM.
 */

export class CharacterStore {
  /** @type {Array<object>} */
  #characters;
  /** @type {string} */
  #query = "";
  /** @type {Array<object>} */
  #visible;
  /** @type {Set<(state: object) => void>} */
  #listeners = new Set();

  constructor(characters) {
    this.#characters = characters;
    this.#visible = characters;
  }

  /** Todos los personajes, sin filtrar. */
  get characters() {
    return this.#characters;
  }

  /** La búsqueda actual, ya normalizada. */
  get query() {
    return this.#query;
  }

  /** Los que casan con la búsqueda. Es lo que se pinta. */
  get visible() {
    return this.#visible;
  }

  /** El estado entero, para los oyentes. */
  get state() {
    return {
      characters: this.#characters,
      query: this.#query,
      visible: this.#visible,
    };
  }

  /**
   * TODO 1 · Cambia la búsqueda.
   *
   * Cuatro pasos, en este orden:
   *   1. normaliza `query` con `trim().toLowerCase()`,
   *   2. calcula `#visible` con un `filter` y `matchesQuery`,
   *   3. avisa a los oyentes con el estado nuevo,
   *   4. y nada más. Este método no pinta nada.
   *
   * Que no pinte nada es lo importante. Si un setter de datos dibuja, ya
   * tienes dos fuentes de verdad y el bug del 01 vuelve por la puerta de
   * atrás.
   */
  setQuery(query) {
    throw new Error("TODO 1: implementa CharacterStore.setQuery", {
      cause: { query },
    });
  }

  /**
   * TODO 2 · Registra un oyente.
   *
   *   1. añádelo al `Set` con `.add()`,
   *   2. y devuelve una función que lo quita con `.delete()`.
   *
   * Devolver la función de baja es lo que hace que esto sea usable: quien
   * se suscribe guarda lo que le devuelve, y en algún momento (al desmontar
   * un componente, al recargar la lista) lo llama y desaparece de verdad. Sin
   * eso, los oyentes se acumulan para siempre y cada cambio pinta cinco
   * veces la misma lista.
   */
  subscribe(listener) {
    throw new Error("TODO 2: implementa CharacterStore.subscribe", {
      cause: { listener: typeof listener },
    });
  }
}

/** Normaliza un texto: sin espacios sobrantes y en minúsculas. */
export function normalize(text) {
  return String(text).trim().toLowerCase();
}

/** Sin acentos, para que `kyoúsuke` se encuentre escribiendo `kyousuke`. */
export function withoutAccents(text) {
  return normalize(text).normalize("NFD").replace(/\p{Diacritic}/gu, "");
}

/** El texto por el que se busca: nombre, alias y etiquetas. */
function searchText(character) {
  return withoutAccents(
    [character.name, character.alias, ...character.tags]
      .filter(Boolean)
      .join(" "),
  );
}

/** ¿El personaje casa con la búsqueda? Todos los términos tienen que salir. */
export function matchesQuery(character, query) {
  const terms = withoutAccents(query).split(/\s+/).filter(Boolean);

  if (terms.length === 0) return true;

  const haystack = searchText(character);

  return terms.every((term) => haystack.includes(term));
}
