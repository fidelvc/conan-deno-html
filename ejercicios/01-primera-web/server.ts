/**
 * BLOQUE 01 · Tu primera web con Deno
 * ================================
 *
 * Objetivo del bloque
 * -------------------
 *   1. Ver cómo Deno sirve un servidor HTTP sin ninguna dependencia.
 *   2. Servir un fichero HTML real desde el disco.
 *   3. Entender el formulario GET: la URL es el estado.
 *   4. Añadir eventos del DOM encima, sin romper el caso sin JavaScript.
 *
 * Cómo se ejecuta
 * ---------------
 *   deno task ej01
 *   y abre http://localhost:8000
 *
 * Tus tareas (los TODO)
 * ---------------------
 *   1. `filterCharacters`  → decidir qué personajes mostrar
 *   2. `searchText`        → decidir con qué texto se compara la búsqueda
 *   3. `renderCharacters`  → convertir personajes en HTML
 *
 * Los tests de `server_test.ts` dicen exactamente qué se espera de cada una.
 * Ejecútalos con `deno task test`: están en rojo hasta que los resuelvas.
 *
 * El handler NO es un TODO. Está escrito a propósito para que veas de entrada
 * cómo se conecta Deno con una función `(Request) => Response`: es una función
 * normal, sin `Deno.` dentro, y por eso se puede probar sin levantar el
 * servidor. Eso es lo que hace `server_test.ts`.
 */

import { CHARACTERS } from "../../datos/personajes.ts";
import type { Character } from "../../datos/personajes.ts";

/**
 * Las carpetas del ejercicio, resueltas desde la ruta de este fichero.
 *
 * `import.meta.url` no depende del directorio desde el que ejecutes el comando,
 * así que `deno task ej01` funciona igual que `deno run ejercicios/01...`.
 * Es la alternativa moderna a `__dirname` + `path.join`.
 */
const PAGES_DIR = new URL("./pages/", import.meta.url);
const PUBLIC_DIR = new URL("./public/", import.meta.url);

/**
 * Deno NO tiene `Deno.serveFile`. Compruébalo:
 *   deno eval "console.log(typeof Deno.serveFile)"   →   undefined
 * Hay que leer el fichero y poner el `content-type` a mano.
 */
const CONTENT_TYPES: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
};

const HTML_HEADERS = { "content-type": CONTENT_TYPES[".html"] };

/** Archivos estáticos, y de qué carpeta sale cada uno. */
const STATIC_FILES: Record<string, URL> = {
  "/estilos.css": new URL("estilos.css", PAGES_DIR),
  "/app.js": new URL("app.js", PUBLIC_DIR),
};

// ─────────────────────────────────────────────────────────────────────────────
// Tus tareas empiezan aquí
// ─────────────────────────────────────────────────────────────────────────────

/**
 * TODO 1 · Decide qué personajes se muestran para una búsqueda concreta.
 *
 * @param query Texto buscado. Puede llegar vacío (`""`) desde la URL.
 * @returns Los personajes que coinciden. Si `query` está vacío, devuélvelos
 *          todos: una búsqueda vacía no debe ocultar nada.
 *
 * Pistas: `Array.prototype.filter` y `String.prototype.includes`. Ojo con las
 * mayúsculas: buscar "KURONEKO" debe encontrar a "Kuroneko".
 */
export function filterCharacters(
  characters: Character[],
  query: string,
): Character[] {
  throw new Error("TODO 1: implementa filterCharacters", {
    cause: { characters, query },
  });
}

/**
 * TODO 2 · Construye el texto por el que se busca dentro de un personaje.
 *
 * Este texto acaba en el atributo `data-buscar` de cada tarjeta, y es lo que
 * `app.js` lee en el navegador para filtrar en vivo. Piensa qué campos deben
 * ser buscables: quien escribe "kuroneko" debería encontrar a Ruri Gokou, y
 * quien escribe "idol" debería encontrar a Kanako.
 *
 * @returns Una sola cadena, en minúsculas, con lo buscable de un personaje.
 *
 * Pistas: `Array.prototype.join`, `String.prototype.toLowerCase`. El alias es
 * opcional (`alias?: string`), así que al hacer `join` puede colarse un
 * `undefined` y, si lo dejas como cadena vacía, un hueco de más: revisa que
 * no queden dos espacios seguidos.
 */
export function searchText(character: Character): string {
  throw new Error("TODO 2: implementa searchText", { cause: character });
}

/**
 * TODO 3 · Convierte una lista de personajes en HTML.
 *
 * @returns El HTML de las tarjetas, listo para meter dentro de un `<ul>`.
 *
 * Contrato exacto, en minúsculas y en este orden:
 *   - Un `<li class="personaje" data-buscar="...">` por personaje.
 *   - El `data-buscar` es el resultado de `searchText(character)`.
 *   - Dentro, un `<h2>` con `name` y, si hay alias, un `<p class="alias">` con
 *     el texto `"también conocida como Kuroneko"`.
 *   - Después, un `<ul class="etiquetas">` con un `<li>` por etiqueta.
 *   - Si la lista está vacía, devuelve `""` (nada de texto "no hay resultados").
 *
 * Pistas: `Array.prototype.map` y `Array.prototype.join`. El `map` te da un
 * array de cadenas y el `join("")` las pega. ¿Recuerdas la diferencia con
 * `toString()`, que además metería comas?
 */
export function renderCharacters(characters: Character[]): string {
  throw new Error("TODO 3: implementa renderCharacters", {
    cause: characters,
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Y a partir de aquí ya está hecho: el plumbing de Deno
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Escapa el texto antes de meterlo en HTML.
 *
 * Aquí no hace falta, porque todo lo que se pinta viene de nuestro propio
 * dataset. En cuanto empieces a meter texto que venga de la URL o de un
 * formulario, esto pasa de ser opcional a ser obligatorio. Lo ves en detalle
 * en el bloque 03.
 */
export function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

/**
 * Sustituye un comentario de HTML por su contenido. Es el truque más simple
 * que existe para "inyectar" datos en una página estática: el comentario
 * `<!-- cards -->` desaparece del resultado.
 */
/**
 * Sustituye un marcador `<!-- nombre -->` por el contenido.
 *
 * ⚠️ El segundo argumento de `String.replace` es un PATRÓN DE SUSTITUCIÓN, no
 * el texto literal. Ahí `$&` significa "el texto que acabo de encontrar", `$1`
 * es el primer grupo de captura, y así sucesivamente.
 *
 *     html.replace("<!-- cards -->", "<li>a & b</li>")   // 🆗
 *     html.replace("<!-- cards -->", "cuesta 5$&")       // 🆗 también
 *
 * Por eso el segundo argumento es una FUNCIÓN, `() => content`: cuando es
 * función no hay interpolación, y sale el contenido tal cual. El bloque 02
 * explica esto mismo con más detalle, y tiene los tests que lo comprueban.
 */
export function injectInto(
  html: string,
  marker: string,
  content: string,
): string {
  return html.replace(`<!-- ${marker} -->`, () => content);
}

function contentTypeFor(pathname: string): string {
  const dot = pathname.lastIndexOf(".");
  const extension = dot === -1 ? "" : pathname.slice(dot);
  return CONTENT_TYPES[extension] ?? "application/octet-stream";
}

async function serveIndex(query: string): Promise<Response> {
  const template = await readFile(new URL("index.html", PAGES_DIR));

  if (template === null) {
    return new Response("No encuentro pages/index.html", {
      status: 500,
      headers: HTML_HEADERS,
    });
  }

  const page = injectInto(
    injectInto(
      template,
      "cards",
      renderCharacters(filterCharacters(CHARACTERS, query)),
    ),
    // El servidor le cuenta al cliente cuál era la búsqueda inicial, con un
    // atributo `data-query` en el formulario. Así el input sale relleno sin
    // tener que reescribir el `<input>` entero.
    "query",
    escapeHtml(query),
  );

  return new Response(page, {
    headers: { ...HTML_HEADERS, "cache-control": "no-store" },
  });
}

async function readFile(url: URL): Promise<string | null> {
  try {
    return await Deno.readTextFile(url);
  } catch (error) {
    if (error instanceof Deno.errors.NotFound) return null;
    throw error;
  }
}

export async function handler(req: Request): Promise<Response> {
  const url = new URL(req.url);

  // El buscador es un formulario GET, así que la búsqueda viaja en la query:
  //   http://localhost:8000/?q=kirino
  // Con esto el servidor ya sabe filtrar, aunque el visitante no tenga JS.
  const query = url.searchParams.get("q") ?? "";

  if (url.pathname === "/" || url.pathname === "/index.html") {
    return await serveIndex(query);
  }

  const staticFile = STATIC_FILES[url.pathname];
  if (staticFile) {
    const content = await readFile(staticFile);
    return content === null
      ? new Response("No encontrado", { status: 404 })
      : new Response(content, {
        headers: { "content-type": contentTypeFor(url.pathname) },
      });
  }

  return new Response("No encontrado", {
    status: 404,
    headers: HTML_HEADERS,
  });
}

if (import.meta.main) {
  Deno.serve(handler);
}
