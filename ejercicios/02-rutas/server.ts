/**
 * server.ts · el lado HTTP del bloque 02
 * =====================================
 *
 * Aquí NO hay ningún TODO. Está escrito entero a propósito: el trabajo de este
 * bloque es entender el engranaje, y leerlo es más rápido que reconstruirlo.
 * Tus dos tareas están en `rutas.ts`.
 *
 * Lo interesante:
 *   - `redirect()`: por qué `Response.redirect` no vale aquí.
 *   - La doble comprobación del nombre de plantilla.
 *   - Que el handler devuelva `Promise<Response>` sin problema: se hace
 *     `async`, y punto.
 */

import { CHARACTERS } from "../../datos/personajes.ts";
import type { Character } from "../../datos/personajes.ts";
import { isSafePathSegment, resolveRoute } from "./rutas.ts";

const PAGES_DIR = new URL("./pages/", import.meta.url);
const HTML_HEADERS = { "content-type": "text/html; charset=utf-8" };

export function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

/**
 * ⚠️ ESTA FUNCIÓN TIENE UNA TRAMPA, Y ES DELIBERADA.
 *
 * La versión ingenua, que parece correcta, es:
 *
 *     return html.replace(`<!-- ${marker} -->`, content);
 *
 * Y está mal. El SEGUNDO argumento de `String.replace` no es "el texto que
 * pongo en su lugar": es un patrón de sustitución, y en él `$` significa
 * algo. `$&` es el texto que ha encontrado, `$1` es el primer grupo de
 * captura, `` $` `` es lo que había antes...
 *
 * Así que si el contenido lleva un `$&` (y los nombres de la
 * gente, y los títulos de las canciones, los tienen),, no sale el `$&` literal: sale el
 * marcador del comentario, repetido, dentro de la página.
 *
 * La forma segura es pasar una FUNCIÓN como segundo argumento. Cuando es una
 * función, no hay interpolación ninguna: lo que devuelve se inserta tal cual.
 *
 * Esto no es un detalle exótico. Es un recordatorio de que `replace` con
 * string es un mini-lenguaje, y de que las funciones devuelven texto que no
 * controlas tú.
 */
export function injectInto(
  html: string,
  marker: string,
  content: string,
): string {
  return html.replace(`<!-- ${marker} -->`, () => content);
}

export function findCharacter(id: string): Character | undefined {
  return CHARACTERS.find((character) => character.id === id);
}

/**
 * Un redirect de verdad, con `Location` relativo.
 *
 * Ojo con esto, que sorprende a todo el mundo:
 *
 *     deno eval 'try { Response.redirect("/x") } catch (e) { console.log(e.message) }'
 *     →  TypeError: Invalid URL: '/x'
 *
 * `Response.redirect` exige una URL ABSOLUTA (con `http://` delante). Como el
 * navegador ya sabe de dónde viene la petición, un `Location: /ruta` relativo
 * vale perfectamente en HTTP. Así que lo construimos a mano.
 *
 * @param status 301 = permanente (el navegador lo cachea), 302 = temporal,
 *               303 = "mira el resultado en otro sitio" (es el del POST del
 *               bloque 05).
 */
export function redirect(to: string, status = 301): Response {
  return new Response(null, { status, headers: { location: to } });
}

function notFound(): Response {
  return new Response("404 · no encontrado", {
    status: 404,
    headers: HTML_HEADERS,
  });
}

function renderCharacterList(): string {
  return CHARACTERS
    .map((character) => {
      const alias = character.alias
        ? `<p class="alias">también conocida como ${
          escapeHtml(character.alias)
        }</p>`
        : "";
      return `<li class="character">
        <h2><a href="/personajes/${escapeHtml(character.id)}">${
        escapeHtml(character.name)
      }</a></h2>
        ${alias}
      </li>`;
    })
    .join("\n");
}

function renderCharacterDetail(character: Character): string {
  const relations = character.relationships
    .map((relationship) => {
      const target = findCharacter(relationship.to);
      const name = target ? target.name : relationship.to;
      return `<li>${escapeHtml(relationship.type)}: ${escapeHtml(name)}</li>`;
    })
    .join("\n");

  return `<h2>${escapeHtml(character.name)}</h2>
<p class="kana">${escapeHtml(character.nameKana)}</p>
<p>${escapeHtml(character.description)}</p>
<h3>Arco</h3>
<p>${escapeHtml(character.arc)}</p>
<h3>Relaciones</h3>
<ul class="relationships">${relations}</ul>`;
}

/** Lee una plantilla de `pages/` y sustituye sus marcadores. */
async function servePage(
  name: string,
  replacements: Record<string, string>,
): Promise<Response> {
  const template = await Deno.readTextFile(new URL(name, PAGES_DIR)).catch(
    (error) => {
      if (error instanceof Deno.errors.NotFound) return null;
      throw error;
    },
  );

  if (template === null) return notFound();

  let html = template;
  for (const [marker, content] of Object.entries(replacements)) {
    html = injectInto(html, marker, content);
  }

  return new Response(html, { headers: HTML_HEADERS });
}

export async function handler(req: Request): Promise<Response> {
  const route = resolveRoute(new URL(req.url).pathname);

  if (route === null) return notFound();

  switch (route.kind) {
    case "redirect":
      // El único redirect real de la app. Detrás no hay ningún fichero: solo
      // se le dice al navegador a dónde ir.
      return redirect(route.to, 301);

    case "index":
      return await servePage("indice.html", { cards: renderCharacterList() });

    case "character": {
      const character = findCharacter(route.id);
      if (character === undefined) return notFound();
      return await servePage("personaje.html", {
        detail: renderCharacterDetail(character),
      });
    }

    case "page": {
      // El `template` viene de la tabla de rutas, así que ya es de fiar. Pero
      // la segunda comprobación es gratis, y una defensa gratuita no se
      // desperdicia: si algún día alguien mete una ruta con `..` en la tabla,
      // esto sigue cerrado.
      const base = route.template.replace(/\.html$/, "");
      if (!isSafePathSegment(base)) {
        return new Response("400 · nombre de página no válido", {
          status: 400,
          headers: HTML_HEADERS,
        });
      }
      return await servePage(route.template, {});
    }
  }
}

if (import.meta.main) {
  Deno.serve(handler);
}
