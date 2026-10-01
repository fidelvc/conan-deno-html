/**
 * componentes.ts · las piezas de HTML del bloque 03
 * =================================================
 *
 * En el bloque 01 pintábamos cada tarjeta con un `map` gigante dentro del
 * handler. Funcionaba, pero no se podía reutilizar ni probar por partes. Aquí
 * cada pieza es una función: `characterCard` sabe hacer UNA tarjeta, y
 * `characterGrid` las junta. Esa separación es la mitad del trabajo en un
 * proyecto de verdad.
 *
 * Tus tareas (los TODO)
 * ---------------------
 *   1. `tagList`         → las etiquetas
 *   2. `relationshipList` → los vínculos con otros personajes
 *   3. `characterCard`   → la tarjeta entera
 *
 * `characterGrid` ya está hecha: es un `map` + `join` sobre `characterCard`.
 * Fíjate en lo poco que cuesta. Eso es lo que te compra haber partido el
 * trabajo en funciones pequeñas.
 */

import type { Character } from "../../datos/personajes.ts";
import { CHARACTERS } from "../../datos/personajes.ts";
import { escapeHtml, GROUPS } from "./layout.ts";

/** Busca un personaje por id. Lo usan las relaciones. */
export function findCharacter(id: string): Character | undefined {
  return CHARACTERS.find((character) => character.id === id);
}

// ─────────────────────────────────────────────────────────────────────────────
// Tus tareas empiezan aquí
// ─────────────────────────────────────────────────────────────────────────────

/**
 * TODO 1 · Pinta las etiquetas de un personaje.
 *
 * @param tags Etiquetas del personaje. Puede venir vacía.
 * @returns Un `<ul class="tags">` con un `<li>` por etiqueta.
 *
 * Contrato exacto:
 *   - `<ul class="tags">...</ul>`, siempre, incluso si `tags` está vacío.
 *   - Un `<li>texto</li>` por etiqueta, en el orden del array.
 *   - Cada texto pasa por `escapeHtml`.
 *   - Sin espacios ni saltos de línea entre los `<li>`: `<li>a</li><li>b</li>`.
 *
 * Pistas:
 *   - `tags.map(...).join("")`.
 *   - ¿Y si `tags` estuviera vacío? `map` devuelve `[]` y `join` devuelve `""`,
 *     así que te sale un `<ul></ul>` vacío. ¿Es problema? Decide y dilo.
 */
export function tagList(tags: string[]): string {
  throw new Error("TODO 1: implementa tagList", {
    cause: { tags, exemploEscapado: escapeHtml("<b>etiqueta</b>") },
  });
}

/**
 * TODO 2 · Pinta con quién se relaciona un personaje.
 *
 * Este es el ejercicio donde se ve por qué el dataset tiene `relationships`
 * como lista de objetos `{ to, type }` y no como un array de strings.
 *
 * @param character El personaje cuyas relaciones hay que pintar.
 * @returns Un `<ul class="relationships">` con un `<li>` por vínculo.
 *
 * Contrato exacto, por cada relación:
 *   - `<li>{tipo}: {nombre}</li>`
 *   - `nombre` es el nombre del personaje con ese `id`. Si el `to` apunta a
 *     alguien que no está en el dataset, escribe el `id` tal cual, para que se
 *     vea que el dato está roto y no se finge que no pasa nada.
 *   - Si el personaje buscado existe, su nombre va dentro de un
 *     `<a href="/personajes/{id}">`. Si no existe, texto plano.
 *   - El `{tipo}` va escapado con `escapeHtml`. El nombre también, por si acaso.
 *
 * Pistas:
 *   - Dos niveles de `map`: uno para las relaciones y otro para el nombre de
 *     cada una. Puedes anidarlos, pero a veces un `for` queda más claro.
 *   - `findCharacter(relationship.to)` te da `Character | undefined`, así que
 *     te va a obligar a comprobarlo. Eso es bueno: el tipo te está avisando.
 */
export function relationshipList(character: Character): string {
  throw new Error("TODO 2: implementa relationshipList", {
    cause: character.id,
  });
}

/**
 * TODO 3 · Pinta la tarjeta de un personaje.
 *
 * @returns Un `<article class="character">` con:
 *   - `<h2><a href="/personajes/{id}">{name}</a></h2>`
 *   - `<p class="alias">también conocida como Kuroneko</p>` SOLO si hay alias.
 *   - `<p class="group">{etiqueta del grupo}</p>`
 *   - `tagList(character.tags)`
 *   - `<p class="summary">{description}</p>`
 *
 * Contrato exacto:
 *   - El `href` es `/personajes/` seguido del `id`.
 *   - `description` va escapada. Puede traer saltos de línea (`\n   `) porque
 *     el dataset está escrito con PLS. No los quites: no rompen nada dentro de
 *     un `<p>`.
 *   - Sin alias, NO pintes el `<p class="alias">`. Ni vacío, ni "sin alias":
 *     directamente no está.
 *
 * Pistas:
 *   - Para la etiqueta del grupo: `GROUPS[character.group]`. Está importado en
 *     `layout.ts`, así que tendrás que importarlo también aquí.
 *   - El alias es opcional, así que `character.alias ? <p>...</p> : ""` es tu
 *     amigo. Un `&&` también vale, pero devuelve `undefined` cuando el alias
 *     falta y eso sale como "undefined" en la página. Cuál de los dos prefieres
 *     es cosa tuya; los tests no se preocupan, pero el HTML sí.
 */
export function characterCard(character: Character): string {
  throw new Error("TODO 3: implementa characterCard", {
    cause: { id: character.id, etiquetaDeSuGrupo: GROUPS[character.group] },
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Y esto ya está hecho
// ─────────────────────────────────────────────────────────────────────────────

/** Junta muchas tarjetas. Un `map` y un `join`: eso es todo. */
export function characterGrid(characters: Character[]): string {
  return `<div class="grid">${characters.map(characterCard).join("")}</div>`;
}
