/**
 * server.ts · el servidor estático de la serie de componentes
 * =========================================================
 *
 * Esta serie vive en el navegador, pero no hay build ni `node_modules`: Deno
 * sirve ficheros tal cual y el navegador carga módulos ES con `<script
 * type="module">`. Lo único que este servidor añade al HTML estático es una
 * ruta JSON con el dataset, para que no haya que duplicarlo.
 *
 *   deno task comp
 *   y abre http://localhost:8000
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * LAS DOS ÚNICAS COSAS QUE HACE
 * ─────────────────────────────────────────────────────────────────────────────
 *
 *   1. Servir ficheros de esta carpeta (`componentes/`) como están.
 *   2. Servir `/api/characters` con el dataset en JSON.
 *
 * El dataset es el MISMO que usan los bloques de `ejercicios/`, importado de
 * `datos/personajes.ts`. No hay copia: si mañana añades un personaje al
 * fichero de datos, aparece en los ocho ejercicios de esta serie sin tocar
 * nada más. Un navegador no puede importar un `.ts`, de ahí el JSON; pero el
 * origen sigue siendo uno solo.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * POR QUÉ `/api/characters` Y NO UNA COPIA EN JS
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Un fichero `personajes.js` generado sería más rápido, pero se queda viejo en
 * cuanto alguien edita el dataset y se oblida de regenerarlo, y ahí es
 * imposible saber cuál de las dos copias manda. Con una ruta JSON no hay copia
 * que sincronizar: el servidor siempre lee el original.
 *
 * La contrapartida es un `fetch`, y por tanto código asíncrono. Es el mismo
 * trato que en cualquier web real, así que se aprende aquí y no más adelante.
 */

import { CHARACTERS, GROUPS, RELATIONSHIP_TYPES } from "../datos/personajes.ts";

const ROOT_DIR = new URL("./", import.meta.url);

const CONTENT_TYPES: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
};

/** `/` devuelve el índice de la serie, no un 404: es la puerta de entrada. */
const INDEX = new URL("./index.html", ROOT_DIR);

/**
 * El tipo sale de la **extensión del fichero servido**, no de la URL.
 *
 * `/01-baseline/` y `/01-baseline/index.html` son la misma página, y solo una
 * de las dos lleva extensión. Mirar la URL da `application/octet-stream` para
 * la primera, y el navegador se lo descarga en vez de renderizarlo.
 */
function contentTypeFor(file: URL): string {
  const extension = file.pathname.slice(file.pathname.lastIndexOf("."));
  return CONTENT_TYPES[extension] ?? "application/octet-stream";
}

/**
 * Traduce una URL a un fichero dentro de esta carpeta, o `null` si se sale.
 *
 * Es el mismo candado que el bloque 02, y por la misma razón: `new URL(path,
 * base)` normaliza los `..`, así que comprobarlos DESPUÉS de resolver es
 * tarde. Aquí se filtran los segmentos antes de construir la URL.
 */
function resolveFile(pathname: string): URL | null {
  const segments = pathname.split("/").filter((segment) => segment !== "");

  const isSafe = segments.every(
    (segment) => /^[A-Za-z0-9._-]+$/.test(segment) && segment !== "..",
  );

  if (!isSafe) return null;

  const file = new URL(segments.join("/"), ROOT_DIR);

  // Comprobación de red de seguridad: aunque los segmentos sean seguros, el
  // fichero resuelto tiene que seguir dentro de `componentes/`.
  if (!file.pathname.startsWith(ROOT_DIR.pathname)) return null;

  return file;
}

/** ¿La ruta resuelta es una carpeta? Entonces se sirve su `index.html`. */
async function isDirectory(file: URL): Promise<boolean> {
  try {
    return (await Deno.stat(file)).isDirectory;
  } catch {
    // Si no existe, no es un directorio: lo dirá el `readTextFile` de después.
    return false;
  }
}

export async function handler(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const pathname = url.pathname;

  if (pathname === "/api/characters") {
    return Response.json({
      characters: CHARACTERS,
      groups: GROUPS,
      relationshipTypes: RELATIONSHIP_TYPES,
    });
  }

  const file = pathname === "/"
    ? INDEX
    : resolveFile(decodeURIComponent(pathname));

  if (file === null) {
    return new Response("404 · no encontrado", { status: 404 });
  }

  let target = file;

  // `/01-baseline/` y `/01-baseline/index.html` tienen que servir lo mismo.
  // Sin esto, `Deno.readTextFile` de un directorio lanza y sale un 500.
  if (await isDirectory(target)) {
    target = new URL(
      "index.html",
      target.href.endsWith("/") ? target : `${target.href}/`,
    );
  }

  let content: string;

  try {
    content = await Deno.readTextFile(target);
  } catch (error) {
    if (error instanceof Deno.errors.NotFound) {
      return new Response("404 · no encontrado", { status: 404 });
    }
    throw error;
  }

  return new Response(content, {
    headers: {
      "content-type": contentTypeFor(target),
      // Sin esto el navegador cachea el módulo y no ves tus cambios.
      "cache-control": "no-store",
    },
  });
}

if (import.meta.main) {
  Deno.serve(handler);
}
