/**
 * server.ts · el lado HTTP del bloque 05
 * ======================================
 *
 * Aquí NO hay `pages/` con ficheros `.html`. El formulario se genera con
 * `renderDraftForm` porque hay que meter en él tres cosas que un fichero
 * estático no tiene: lo que el usuario escribió, los errores de validación, y
 * el `selected` del desplegable. Un HTML fijo no puede hacer eso.
 *
 * Reparto del trabajo:
 *   - `formulario.ts` → 5 tareas, todas funciones puras (fáciles de testear)
 *   - `server.ts`     → 1 tarea, y es la de verdad: el `switch` del POST
 *
 * El resto de este fichero está hecho a propósito. Léelo entero antes de
 * tocar nada: es el esqueleto de referencia de cómo se hace un servidor con
 * formularios en Deno.
 */

import {
  createRedirect,
  EMPTY_DRAFT,
  errorList,
  escapeHtml,
  GROUPS,
  NO_ERRORS,
  readFields,
  renderDraftForm,
  slug,
  validate,
} from "./formulario.ts";
import type { Draft } from "./formulario.ts";

const HTML_HEADERS = { "content-type": "text/html; charset=utf-8" };

/**
 * ⚠️ ESTO NO ES UNA BASE DE DATOS. ⚠️
 *
 * Un `const` con un array mutable en memoria, que se pierde al reiniciar el
 * proceso y que se mezcla entre peticiones. Sirve para practicar y para que
 * el test sea rápido, y para NADA más.
 *
 * En un proyecto real esto sería `INSERT INTO personajes ...`, y el
 * identificador te lo daría la propia base de datos (o un UUID), no un slug
 * generado a mano. Es el primer cambio que hay que hacer al llevar esto a
 * producción, y ya lo verás cuando hables de deploy.
 */
const drafts: Draft[] = [];

/** Todas las altas, la más reciente la primera. */
export function listDrafts(): Draft[] {
  return [...drafts].reverse();
}

/** ¿Ya existe un alta con ese slug? Lo usa el handler para el 409. */
export function draftExists(id: string): boolean {
  return drafts.some((draft) => slug(draft.name) === id);
}

// ─────────────────────────────────────────────────────────────────────────────
// Tus tareas
// ─────────────────────────────────────────────────────────────────────────────

/**
 * TODO ÚNICO DE ESTE FICHERO · El `case "/nuevo"` cuando es un POST.
 *
 * El flujo completo, en orden. Los tests los comprueban uno a uno:
 *
 *   1. SOLO si es POST. Un GET a `/nuevo` cae en el otro `case` y pinta el
 *      formulario vacío. Este `if` no es decorativo: es lo que impide que un
 *      GET rabioso guarde datos.
 *
 *   2. LEER EL CUERPO. `await request.formData()`. Fíjate en la firma del
 *      handler: por fin es `async`, porque leer el cuerpo de una petición es
 *      asíncrono. Sin `await`, `formData()` te devuelve una promesa y
 *      `readFields` recibe una promesa.
 *
 *      Detalle importante: si el `Content-Type` de la petición no es
 *      `application/x-www-form-urlencoded` ni `multipart/form-data`,
 *      `formData()` LANZA. No devuelve un FormData vacío: lanza un `TypeError`.
 *      Los dos mensajes que verás, según el caso, son "Missing content type" y
 *      "Body can not be decoded as form data".
 *
 *      Por eso un `new Request(url, { method: "POST" })` a pelo NO vale para
 *      probar esto: llega sin content-type y revienta. El helper `form()` del
 *      test monta el cuerpo con `URLSearchParams` y pone la cabecera a mano,
 *      que es justo lo que hace un `<form>` del navegador.
 *
 *   3. VALIDAR. `readFields` + `validate`.
 *
 *   4. SI HAY ERRORES → 400 y el formulario otra vez, con `status: "error"` y
 *      los values que escribió (NO los de `EMPTY_DRAFT`, que sería
 *      hacerte perder lo que llevabas). Status 400, no 200: la petición se
 *      entiende, pero el contenido no vale. Y 500 no, porque no es un fallo del
 *      servidor.
 *
 *   5. SI ESTÁ BIEN → el PRG. `createRedirect(...)` y nada más. Cero HTML de
 *      "gracias" aquí, que es justo el error que el patrón evita.
 *
 * Reglas que el test mira:
 *   - El slug vacío (name con solo símbolos) es un 400, no un 500.
 *   - Dos altas con el mismo name no se pisan: la segunda es un 409.
 *   - Tras un POST bueno, la respuesta NO lleva cuerpo y NO lleva `<form`.
 *
 * Pistas:
 *   - Todo lo que necesitas ya está importado arriba. Si te falta algo, es que
 *     la idea era agrupar las llamadas: por ejemplo, un `if (Object.keys(
 *     errors).length > 0)` para el paso 4.
 *   - `errorList(errors)` te da los mensajes como array, para el aviso.
 *   - El id de la URL es `slug(draft.name)`. Añádelo a `drafts` antes de
 *     redirigir, que si no el GET de después no lo encuentra.
 *   - Devuelve siempre un `Response` en cada rama. Un `switch` sin `return` en
 *     todas las ramas hace que Deno responda con un 500 y un error que no
 *     menciona tu código.
 */
// `async` es obligatorio aunque el esqueleto todavía no haga nada: leer el
// cuerpo de la petición es `await request.formData()`, y sin `await` el
// `formData()` te llega como promesa. El `deno-lint-ignore` desaparece en
// cuanto escribas la primera línea de verdad.
// deno-lint-ignore require-await
async function create(request: Request, _url: URL): Promise<Response> {
  throw new Error("TODO 6: implementa el POST de /nuevo", {
    cause: {
      method: request.method,
      path: _url.pathname,
      // Los cuatro helpers que tienes que usar, para que se te recorden al
      // leer el error. Nada de esto es todavía un resultado.
      uses: [
        readFields.name,
        validate.name,
        slug.name,
        createRedirect.name,
      ],
      forTheNotice: errorList.name,
    },
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// El resto del servidor, ya hecho
// ─────────────────────────────────────────────────────────────────────────────

function draftPage(body: string): Response {
  return new Response(wrapPage(body), { headers: HTML_HEADERS });
}

/** Envuelve el fragmento del formulario en la página entera. */
function wrapPage(body: string): string {
  return `<!DOCTYPE html>
<html lang="es">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Alta de personaje · Oreimo</title>
    <link rel="stylesheet" href="/estilos.css">
  </head>
  <body>
    <header>
      <nav>
        <a href="/">Altas</a> · <a href="/nuevo">Nueva alta</a>
      </nav>
    </header>
    <main>
      <h1>Oreimo · espacio de práctica</h1>
${body}
    </main>
  </body>
</html>`;
}

function listPage(): string {
  const items = listDrafts();
  const body = items.length === 0
    ? "<p>Todavía no hay ninguna alta.</p>"
    : `<ul>${
      items.map((draft) => {
        const group = GROUPS[draft.group as keyof typeof GROUPS] ?? draft.group;
        const id = slug(draft.name);
        return `<li><a href="/personajes/${escapeHtml(id)}">${
          escapeHtml(draft.name)
        }</a> — ${escapeHtml(group)}</li>`;
      }).join("")
    }</ul>`;

  return `<h1>Altas</h1>
<p><a href="/nuevo">Dar de alta un personaje</a></p>
${body}`;
}

function detailPage(id: string): Response {
  const draft = listDrafts().find((item) => slug(item.name) === id);
  if (draft === undefined) {
    return new Response(wrapPage("<h1>404</h1><p>No existe esa alta.</p>"), {
      status: 404,
      headers: HTML_HEADERS,
    });
  }
  const group = GROUPS[draft.group as keyof typeof GROUPS] ?? draft.group;
  return draftPage(`<h1>${escapeHtml(draft.name)}</h1>
<p>Grupo: ${escapeHtml(group)}</p>
<p>${escapeHtml(draft.description)}</p>`);
}

export async function handler(request: Request): Promise<Response> {
  const url = new URL(request.url);

  switch (url.pathname) {
    case "/":
      return draftPage(listPage());

    case "/nuevo":
      if (request.method === "POST") return await create(request, url);
      return draftPage(renderDraftForm(EMPTY_DRAFT, NO_ERRORS, "new"));

    case "/estilos.css": {
      return new Response(
        `body { font-family: system-ui, sans-serif; margin: 2rem auto; max-width: 40rem; }
         label { display: block; margin-top: 1rem; font-weight: 600; }
         .error { color: #b00; }
         .error ul { margin: 0; padding-left: 1.2rem; }`,
        { headers: { "content-type": "text/css; charset=utf-8" } },
      );
    }

    default: {
      if (url.pathname.startsWith("/personajes/")) {
        return detailPage(url.pathname.slice("/personajes/".length));
      }
      return new Response("404 · no encontrado", {
        status: 404,
        headers: HTML_HEADERS,
      });
    }
  }
}

if (import.meta.main) {
  Deno.serve(handler);
}
