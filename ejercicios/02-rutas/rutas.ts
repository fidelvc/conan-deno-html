/**
 * BLOQUE 02 · Rutas limpias, seguridad y el redirect de verdad
 * ==========================================================
 *
 * Objetivo del bloque
 * -------------------
 *   1. Separar "qué ruta es" de "qué hay que servir".
 *   2. Ver las URLs limpias (`/kirino`) y por qué NO son un redirect.
 *   3. Entender el path traversal: por qué `/paginas/../../etc/passwd` es
 *      un agujero y cómo se tapa.
 *   4. Usar un redirect de verdad, que en el bloque 01 no hacía falta.
 *
 * Cómo se ejecuta
 * ---------------
 *   deno task ej02
 *   y abre http://localhost:8000
 *
 * Tus tareas (los TODO)
 * ---------------------
 *   1. `isSafePathSegment`  → el candado de seguridad
 *   2. `resolveRoute`       → el mapa de rutas
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * LA IDEA IMPORTANTE DE ESTE BLOQUE
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Hay tres cosas distintas que la gente llama "redirect", y solo una es un
 * redirect de verdad:
 *
 *   a) URL = FICHERO         `/paginas/presentacion.html`
 *      No hay nada que hacer. Es lo más simple, y por eso muchas webs
 *      siguen así.
 *
 *   b) URL LIMPIA → FICHERO   `/paginas/presentacion` → sirve
 *      `presentacion.html`
 *      Esto NO es un redirect. Es una REESCRITURA INTERNA: decides tú qué
 *      fichero sale, dentro del servidor. El navegador pide `/presentacion`,
 *      nunca se entera de que por dentro salió un `.html`, y la barra de
 *      direcciones se queda limpia. Es lo que hace `resolveRoute`.
 *
 *   c) REDIRECT DE VERDAD    `/kirino` → 301 → `/personajes/kirino`
 *      Aquí SÍ cambia la URL del navegador: se manda una cabecera `Location`
 *      y un código 301. Se usa para canonicalizar (una sola URL oficial por
 *      contenido), para mover una página antigua, y para mandar a alguien
 *      tras un login.
 *
 * Tu `resolveRoute` implementa (b). El 301 de (c) ya está escrito en
 * `server.ts`, y el test te dice que tiene que devolver 301 y no 200.
 *
 * Este fichero solo decide QUÉ ruta es. De qué color se pinta, y de dónde
 * salen los bytes, es cosa de `server.ts`.
 */

import { CHARACTERS } from "../../datos/personajes.ts";

/** Lo que hay que hacer con una petición. Nada de Deno dentro de este tipo. */
export type Route =
  | { kind: "indice" }
  | { kind: "personaje"; id: string }
  | { kind: "pagina"; template: string }
  | { kind: "redireccion"; to: string };

/**
 * Rutas fijas. El servidor las conoce todas; no adivina.
 *
 * `template` es un nombre de fichero que viene de esta tabla, nunca de la
 * URL. Eso ya es la primera capa de defensa: aunque alguien mande
 * `../../../etc/passwd`, nunca llega a formar parte de un `template`.
 */
export const ROUTES: Record<string, Route> = {
  "/": { kind: "indice" },
  "/personajes": { kind: "indice" },
  "/paginas/presentacion": { kind: "pagina", template: "presentacion.html" },

  // (c) El único caso de redirect real de esta app. Canónico: la ficha de un
  // personaje vive en /personajes/<id>, y /kirino es solo un atajo.
  "/kirino": { kind: "redireccion", to: "/personajes/kirino" },
  "/kuroneko": { kind: "redireccion", to: "/personajes/ruri" },
};

/** El patrón dinámico de las fichas: `/personajes/<id>`. */
export const PERSONAJE_PATTERN = /^\/personajes\/([^/]+)$/;

// ─────────────────────────────────────────────────────────────────────────────
// Tus tareas empiezan aquí
// ─────────────────────────────────────────────────────────────────────────────

/**
 * TODO 1 · ¿Este trozo de ruta es seguro de usar como nombre de fichero?
 *
 * Este es el corazón del bloque. El ataque se llama *path traversal*: si
 * construyes una ruta de fichero concatenando lo que viene de la URL, un
 * `..` sube de directorio y se sale del proyecto.
 *
 * Con estas dos líneas (que son el error típico) el ataque funciona:
 *
 *     const ruta = `./pages/paginas/${nombre}.html`;   // NO hagas esto
 *     await Deno.readTextFile(ruta);
 *
 *     // "nombre" = "../../../../etc/passwd"
 *     // ruta = "./pages/paginas/../../../../etc/passwd.html"
 *     //                             ↑ fuera de tu proyecto
 *
 * @param segment Un trozo de la URL, sin las barras.
 * @returns `true` si se puede usar tal cual, `false` ante cualquier cosa
 *          sospechosa.
 *
 * Reglas, y todas hacen falta:
 *   - No puede ser la cadena vacía.
 *   - No puede ser `.` ni `..`.
 *   - No puede traer barras: ni `/` ni `\`. Una barra parte la ruta en varios
 *     trozos, que es justo lo que quieres evitar.
 *   - No puede traer un byte nulo (`\0`), que en algunos sistemas de ficheros
 *     corta la cadena en silencio.
 *   - Solo letras, dígitos, punto, guion y guion bajo. Rechaza `%`, `?`, `#`,
 *     espacios y todo lo demás.
 *
 * Pistas:
 *   - `/^[A-Za-z0-9._-]+$/.test(segment)` cubre casi todo, pero acepta `"."`
 *     y `".."`, así que descártalos aparte.
 *   - Una condición con `||` va bien: `algo inválido || otro inválido`
 *     devuelve el segundo valor, que es truthy.
 *   - Ojo con esto: una URL llega YA decodificada en `url.pathname`. Si
 *     alguien pide `/paginas/%2e%2e/secreto`, tú recibes `..`, no `%2e%2e`.
 *     Por eso hay que mirar el valor real, no solo los signos de porcentaje.
 */
export function isSafePathSegment(segment: string): boolean {
  throw new Error("TODO 1: implementa isSafePathSegment", { cause: segment });
}

/**
 * TODO 2 · Traduce una URL a una ruta.
 *
 * @param pathname Solo el path de la URL, sin dominio ni query. Viene ya
 *                 decodificado, y siempre empieza por `/`.
 * @returns La ruta, o `null` si no hay que servir nada (eso será un 404).
 *
 * Orden de resolución, de arriba abajo:
 *   1. ¿Está tal cual en `ROUTES`? Entonces devuélvela. Esto cubre `/`,
 *      `/paginas/presentacion` y los atajos que son redirect.
 *   2. ¿Casa con el patrón `/personajes/<algo>`? Entonces devuelve
 *      `{ kind: "personaje", id: <algo> }`, pero SOLO si `<algo>` es el `id` de
 *      un personaje que exista en el dataset. Si no existe, `null`.
 *   3. Cualquier otra cosa: `null`.
 *
 * Pistas:
 *   - `ROUTES[pathname]` vale aquí, porque todas las claves empiezan por `/` y
 *     entonces nunca colisionan con `constructor` ni `toString`. Aun así, la
 *     costumbre sana es `Object.hasOwn(ROUTES, pathname)`, y un día te hará
 *     falta cuando la tabla deje de llevar prefijo.
 *   - `pathname.match(PERSONAJE_PATTERN)` te da el `id` en el grupo 1.
 *   - `CHARACTERS.some((c) => c.id === id)` para comprobar que existe.
 *   - `null` es un valor de retorno del todo válido en TypeScript: úsalo sin
 *     miedo en vez de inventar un `routeNotFound`.
 */
export function resolveRoute(pathname: string): Route | null {
  throw new Error("TODO 2: implementa resolveRoute", {
    cause: { pathname, personajesConocidos: CHARACTERS.length },
  });
}
