/**
 * BLOQUE 05 · Formularios: POST, validación y PRG
 * ===============================================
 *
 * Aquí se junta todo lo anterior. En el bloque 01 mandabas un formulario con
 * `method="get"`: el navegador ponía los campos en la URL y recargaba la
 * página. Ahora va a ser `method="post"`: el navegador manda los datos en el
 * CUERPO de la petición, y el servidor decide qué hacer con ellos.
 *
 * Tus cinco tareas
 * ----------------
 *   1. `leerCampos`    → sacar los tres campos del `FormData`, sin `undefined`
 *   2. `validar`       → reglas de validación y mensajes de error
 *   3. `slug`          → "Sena Akagi" → "sena-akagi"
 *   4. `renderAlta`    → el formulario, con errores y con lo que ya escribiste
 *   5. `crearRedirect` → un 303 bien construido, que es el corazón del PRG
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * POR QUÉ IMPORTA EL PATRÓN PRG
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * "PRG" = Post / Redirect / Get.
 *
 * Si después de guardar algo devuelves la respuesta CON contenido (o el
 * HTML de "gracias"), el usuario tiene un problema: al recargar la página, el
 * navegador vuelve a MANDAR el POST, y tu servidor guarda el mismo personaje
 * otra vez. Duplicados, siempre, en cuanto alguien pulse F5.
 *
 * La solución es la de la flecha:
 *
 *     POST /nuevo  →  303 See Other  →  GET /personajes/sena-akagi
 *
 * El 303 no trae cuerpo. Solo dice "ya está, ahora pide esta URL". Cuando el
 * navegador obedeca, hace un GET. Un GET no vuelve a guardar nada, así que
 * recargar es inofensivo. Además el "Gracias" queda en la URL y se puede
 * compartir o marcar en favoritos, que es justo lo que un POST no permite.
 *
 * 303 y no 302: los dos "redirigen a otro sitio", pero el 303 obliga al
 * cliente a cambiar POST por GET. Con un 302, algunos navegadores antiguos
 * reintentan con POST y volvemos a tener el problema.
 */

// ─────────────────────────────────────────────────────────────────────────────
// Tipos
// ─────────────────────────────────────────────────────────────────────────────

import { GROUPS } from "../../datos/personajes.ts";
import type { GroupId } from "../../datos/personajes.ts";

/** Lo que el usuario quiere dar de alta. Siempre los tres campos, siempre texto. */
export interface Alta {
  nombre: string;
  grupo: string;
  descripcion: string;
}

/**
 * Clave de campo → mensaje. Solo aparecen los campos que fallan.
 *
 * OJO al `Partial`: las claves son OPCIONALES a propósito, porque el contrato
 * de `validar` es "si no hay errores, devuelve `{}`", y un `{}` vacío no es
 * asignable a un `Record<..., string>` de tres claves obligatorias. Con
 * `Partial` el tipo cuenta la historia: puede faltar cualquiera.
 */
export type Errores = Partial<
  Record<"nombre" | "grupo" | "descripcion", string>
>;

/** Un alta es válida, o no lo es y dice por qué. */
export type Resultado =
  | { ok: true; alta: Alta }
  | { ok: false; errores: Errores };

/** El formulario recién abierto: todo vacío. */
export const ALTA_VACIA: Alta = { nombre: "", grupo: "", descripcion: "" };

/** Sin errores de validación. Es un objeto VACÍO, no un array de mensajes. */
export const SIN_ERRORES: Errores = {};

/** Máximo de caracteres de cada campo. Se usan en el HTML y en la validación. */
export const LIMITES = {
  nombre: { min: 2, max: 40 },
  descripcion: { max: 200 },
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// Tus tareas empiezan aquí
// ─────────────────────────────────────────────────────────────────────────────

/**
 * TODO 1 · Saca los tres campos del `FormData`.
 *
 * @returns Un `Alta` con los TRES campos presentes. Aunque no venga nada, el
 *          resultado tiene `nombre`, `grupo` y `descripcion` como `string`.
 *
 * Por qué importa tanto: `FormData.get()` devuelve `FormDataEntryValue | null`,
 * y ese tipo incluye `File`. No es un capricho del tipado: un formulario con
 * `<input type="file">` mete un `File` de verdad. Si haces
 * `const nombre = data.get("nombre")` y el visitante no ha rellenado el campo,
 * tienes `null` en una variable que el resto del programa da por `string`, y el
 * fallo sale tres funciones más abajo, en un `toLowerCase` que no tiene nada
 * que ver.
 *
 * Pistas:
 *   - Un helper que convierte cualquier entrada en texto:
 *
 *         function textoCampo(valor: FormDataEntryValue | null): string {
 *           return typeof valor === "string" ? valor.trim() : "";
 *         }
 *
 *     El `.trim()` aquí ya te ahorra el-recordatorio de hacerlo tres veces.
 *   - `FormData` se lee con `.get("nombre")`, por el `name` del input.
 *   - Si el campo no viene, `textoCampo` devuelve `""` y no hay que comprobar
 *     nada más.
 */
export function leerCampos(data: FormData): Alta {
  throw new Error("TODO 1: implementa leerCampos", { cause: [...data.keys()] });
}

/**
 * TODO 2 · Valida el alta.
 *
 * @returns `{}` si todo está bien (un objeto VACÍO, que es "sin errores"), o
 *          un objeto con un mensaje por cada campo que falla. Si fallan dos,
 *          vienen los dos mensajes: el usuario no debería tener que corregir
 *          los errores de uno en uno.
 *
 * Reglas, en este orden de importancia:
 *   - `nombre`: obligatorio. Entre 2 y 40 caracteres ya sin contar espacios
 *     (por eso `leerCampos` hace `trim`).
 *   - `grupo`: obligatorio, y tiene que ser una clave que exista en `GROUPS`.
 *     Ojo: el `value` de un `<select>` es un `string` cualquiera que puede
 *     venir manipulado, así que hay que comprobarlo contra `GROUPS` y no
 *     fiarse. No hagas solo `if (alta.grupo)`, que también pasa con "banana".
 *   - `descripcion`: opcional, pero como mucho 200 caracteres.
 *
 * Pistas:
 *   - Empieza por `const errores: Errores = {};` y ve rellenando. Devolver
 *     `errores` tal cual es lo correcto: `{}` es exactamente "sin errores",
 *     y por eso las claves de `Errores` son opcionales.
 *   - El error se detecta con `Object.keys(errores).length > 0`. Con
 *     `if (errores)` NO funciona: `{}` es un objeto que siempre es truthy.
 *   - Longitud: `alta.nombre.length`. Con el `trim` ya hecho, no te preocupes
 *     de contar espacios.
 *   - ¿Existe la clave? `Object.hasOwn(GROUPS, alta.grupo)`. Con `GROUPS` siendo
 *     un `as const`, `Object.hasOwn` es la forma que el tipado acepta sin
 *     fightar. (Comprobar `GROUPS[alta.grupo]` a pelo también vale, pero
 *     TypeScript se queja de indexar con un `string`.)
 *   - Los mensajes van en español y son concretos: "Pon un nombre de al menos
 *     2 caracteres", no "campo inválido". El mensaje es parte de la UX.
 */
export function validar(alta: Alta): Errores {
  throw new Error("TODO 2: implementa validar", { cause: alta });
}

/**
 * TODO 3 · Convierte un nombre en un id para la URL.
 *
 * "Sena Akagi" → "sena-akagi". "  ¡Kirino  ¡" → "kirino". "D.K." → "d-k".
 *
 * @returns El slug. Si al limpiar no queda nada, devuelve `""` (y quien lo
 *         llame decide qué hacer, que en este caso es devolver un 400).
 *
 * Pistas, en orden:
 *   1. `trim()`.
 *   2. `toLowerCase()`.
 *   3. QUITAR LOS ACENTOS. `toLowerCase` no lo hace, y "É" -> "é" no es "e".
 *      Se hace en dos pasos:
 *         .normalize("NFD")   // parte "é" en "e" + "´"
 *          .replace(/\p{Diacritic}/gu, "")   // y se queda solo con la "e"
 *      El flag `u` es obligatorio: sin él, `\p{...}` no funciona.
 *   4. Cambiar todo lo que no sea `[a-z0-9]` por un guion.
 *      `/[^a-z0-9]+/g` (la `+` agrupa los guiones repetidos en uno solo).
 *   5. Quitar guiones del principio y del final: `replace(/^-+|-+$/g, "")`.
 *
 * Ojo con el paso 4 y los ejemplos: "D.K." son dos separadores con un punto
 * entre medias, así que sale "d-k" y no "d--k". El `+` del regex es lo que lo
 * arregla. Hay un test justo para eso.
 */
export function slug(nombre: string): string {
  throw new Error("TODO 3: implementa slug", { cause: nombre });
}

/**
 * TODO 4 · Pinta el formulario de alta.
 *
 * @param valores Lo que el usuario había escrito. En el GET inicial es
 *                `ALTA_VACIA`; tras un POST con errores, son sus valores. Esto
 *                se llama "sticky form" y evita que tenga que reescribirlo
 *                todo por un error de validación.
 * @param errores Los mensajes de `validar`, o `{}` si no hay.
 * @param status  "nuevo" en el GET inicial, "error" cuando se reenvía tras
 *                un POST fallido. Sirve para poner un aviso arriba.
 *
 * Reglas de seguridad, y aquí sí son de las que importan de verdad:
 *   - NADA de lo que venga en `valores` se pinta sin pasar por `escapeHtml`.
 *     Un `nombre` con `<script>` dentro tiene que aparecer como texto, no
 *     ejecutarse. Hay un test que lo comprueba.
 *   - `<option selected>` solo en el grupo que eligió, y solo si existe.
 *   - El atributo `value` va entre comillas dobles y con el texto escapado.
 *
 * Pistas:
 *   - `escapeHtml` ya está resuelta más abajo en este mismo fichero. Reúsala.
 *     Ojo: el `&` va PRIMERO. Si escapas `<` antes que `&`, el `&lt;` que acabas
 *     de escribir se vuelve a escapar y sale `&amp;lt;` en pantalla.
 *   - Un `<select>` se recorre con `Object.entries(GROUPS)`, que da
 *     `[id, nombreLargo]` en el orden del objeto, que es el orden que quieres
 *     en el desplegable.
 *   - La plantilla es larga. Concatena con `+` o con plantillas, pero ten el
 *     cuidado de que el HTML quede bien formado: si te falta un `</label>`,
 *     los tests no se van a enterar, pero el navegador sí.
 */
export function renderAlta(
  valores: Alta,
  errores: Errores,
  status: "nuevo" | "error" = "nuevo",
): string {
  throw new Error("TODO 4: implementa renderAlta", {
    cause: { valores, errores, status },
  });
}

/**
 * TODO 5 · Construye la respuesta del PRG.
 *
 * @returns Un `Response` con estado 303 y la cabecera `Location` apuntando a
 *          `destino`. SIN cuerpo, o con un cuerpo vacío.
 *
 * ⚠️ LA TRAMPA DE ESTE EJERCICIO
 * Lo lógico sería `Response.redirect(destino, 303)`. NO FUNCIONA con rutas
 * relativas: `Response.redirect("/personajes/sena-akagi")` lanza
 * `TypeError: Invalid URL`, porque `Response.redirect` exige una URL ABSOLUTA
 * (con esquema y host). Es una de las cosas que más gente se tropieza con
 * Deno, y no sale en ningún tutorial.
 *
 * Hay dos salidas, y las dos son correctas:
 *   1. Construir el `Response` a mano, como pide este ejercicio:
 *
 *          new Response(null, { status: 303, headers: { location: destino } })
 *
 *      La cabecera se escribe `location` en minúsculas. `Headers` normaliza
 *      los nombres a minúsculas al construirse, así que `Location` también
 *      valdría, pero en un `HeadersInit` de tipo `Record<string, string>`
 *      minuscula es lo que sale en todos los ejemplos de la documentación.
 *   2. `Response.redirect(new URL(destino, "http://localhost"), 303)`, que sí
 *      funciona porque ya es absoluta. Se usa cuando el servidor de verdad
 *      conoce su propio host.
 *
 * Pistas:
 *   - `status: 303` es el número mágico. `Response.redirect` acepta 301, 302,
 *     303, 307 y 308; para POST → GET el que toca es 303.
 *   - Pasar `null` como cuerpo es lo correcto para un redirect. Algunos
 *     clientes y proxies se confunden si hay bytes.
 *   - Devuelve un `Response`, no un string y no un status: el test comprueba
 *     las cabeceras.
 */
export function crearRedirect(destino: string): Response {
  throw new Error("TODO 5: implementa crearRedirect", { cause: destino });
}

// ─────────────────────────────────────────────────────────────────────────────
// Utilidades ya resueltas
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Escapa `& < > " '` para poder meter texto dentro de HTML.
 *
 * Va aquí, resuelta, porque cada bloque es autónomo: el bloque 01 tiene la
 * suya en `server.ts`, la del 02 también, la del 03 en `layout.ts`. Es algo de
 * deliberado, para que al abrir un bloque no tengas que ir leyendo el anterior
 * buscando dónde estaba.
 *
 * El orden de los `replaceAll` NO es arbitrario: el `&` tiene que ir primero.
 * Si `<` se escapara antes, al sustituir `<` por `&lt;` el `&` de ese `&lt;`
 * se escaparía en la siguiente línea y aparecería `&amp;lt;` en la pantalla.
 */
export function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

/** Une los tres mensajes de error en una lista para el aviso. */
export function listaErrores(errores: Errores): string[] {
  return Object.values(errores).filter((mensaje) => mensaje.length > 0);
}

export { GROUPS };
export type { GroupId };
