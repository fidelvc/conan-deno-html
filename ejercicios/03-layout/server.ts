/**
 * server.ts · el lado HTTP del bloque 03
 * =====================================
 *
 * Fíjate en lo que NO hay aquí: ni `pages/`, ni ficheros `.html`, ni
 * `injectInto`, ni marcadores `<!-- -->`. Todas las páginas de esta app se
 * generan con las funciones de `layout.ts` y `componentes.ts`.
 *
 * El único fichero que se lee del disco es el CSS, que no necesita ser
 * generado por nadie.
 *
 * Tus tres tareas están en `layout.ts` (2) y `componentes.ts` (1).
 */

import { CHARACTERS } from "../../datos/personajes.ts";
import { characterCard, characterGrid, findCharacter } from "./componentes.ts";
import { groupCounts, layout } from "./layout.ts";

const PUBLIC_DIR = new URL("./public/", import.meta.url);
const HTML_HEADERS = { "content-type": "text/html; charset=utf-8" };

function page(title: string, content: string, active?: string): Response {
  return new Response(layout({ title, active, content }), {
    headers: HTML_HEADERS,
  });
}

function notFound(): Response {
  return new Response("404 · no encontrado", {
    status: 404,
    headers: HTML_HEADERS,
  });
}

function indexPage(query: string): Response {
  const normalized = query.trim().toLowerCase();
  const visible = normalized === ""
    ? CHARACTERS
    : CHARACTERS.filter((character) =>
      [
        character.name,
        character.nameKana,
        character.alias ?? "",
        ...character.tags,
      ]
        .join(" ")
        .toLowerCase()
        .includes(normalized)
    );

  const content = visible.length === 0
    ? "<p>Ningún personaje coincide con esa búsqueda.</p>"
    : characterGrid(visible);

  return page(
    visible.length === CHARACTERS.length ? "Índice" : `Búsqueda: ${query}`,
    `<h1>Personajes</h1>${content}`,
    "/",
  );
}

function groupsPage(): Response {
  const items = groupCounts()
    .map((group) =>
      `<li><a href="/grupos#${group.id}">${group.label}</a>: ${group.total}</li>`
    )
    .join("");

  return page(
    "Grupos",
    `<h1>Grupos</h1><ul class="list">${items}</ul>`,
    "/grupos",
  );
}

async function styles(): Promise<Response> {
  const css = await Deno.readTextFile(new URL("estilos.css", PUBLIC_DIR)).catch(
    () => null,
  );

  return css === null
    ? new Response("no encontrado", { status: 404 })
    : new Response(css, {
      headers: { "content-type": "text/css; charset=utf-8" },
    });
}

export async function handler(req: Request): Promise<Response> {
  const url = new URL(req.url);

  switch (url.pathname) {
    case "/":
    case "/index.html":
      return indexPage(url.searchParams.get("q") ?? "");

    case "/buscar":
      return page(
        "Buscar",
        `<h1>Buscar</h1>
<form method="get" action="/">
  <label for="q">Nombre, alias o etiqueta</label>
  <input id="q" name="q" type="search" value="">
  <button type="submit">Buscar</button>
</form>`,
        "/buscar",
      );

    case "/grupos":
      return groupsPage();

    case "/estilos.css":
      return await styles();

    default: {
      // Las fichas se generan con el mismo componente que la lista. Un solo
      // sitio donde se pinta un personaje.
      const character = url.pathname.startsWith("/personajes/")
        ? findCharacter(url.pathname.slice("/personajes/".length))
        : undefined;

      if (character === undefined) return notFound();
      return page(character.name, characterCard(character), "/");
    }
  }
}

if (import.meta.main) {
  Deno.serve(handler);
}
