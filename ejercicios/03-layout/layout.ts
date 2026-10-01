/**
 * BLOQUE 03 · Layout y componentes (adiós a duplicar HTML)
 * =====================================================
 *
 * El problema que resuelve este bloque
 * -----------------------------------
 * En los bloques 01 y 02, `pages/indice.html` y `pages/personaje.html` tienen
 * casi todo lo mismo: el doctype, el `<head>`, el `<title>`, la barra de
 * navegación, el pie. Copiar y pegar eso a cada página nueva es como empiezan
 * los bugs: un día cambias el menú en un fichero y te olvidas de los otros
 * seis.
 *
 * La solución que se ve aquí es "sin framework": una función que recibe el
 * contenido y devuelve la página entera. Cuando leas código de un servidor de
 * Deno de verdad, esto o algo equivalente (JSX, Handlebars, plantillas) está
 * siempre presente.
 *
 * Tus tareas (los TODO)
 * ---------------------
 *   1. `nav`    → la barra de navegación, generada a partir de datos
 *   2. `layout` → la página completa
 *   3. `tagList` → las etiquetas de una tarjeta
 *   4. `characterCard` → una tarjeta de personaje
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * Y el otro tema del bloque: XSS
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Estas funciones meten datos dentro de HTML. Como el contenido viene de
 * nuestro dataset, nadie lo controla... hasta que alguien añada un formulario
 * (bloque 05) o importe datos de fuera. Por eso `escapeHtml` se usa SIEMPRE,
 * incluso aquí donde "no hace falta".
 *
 * Un test del bloque mete un `<script>` a propósito en el nombre de un
 * personaje y comprueba que sale escapado. Quitar el `escapeHtml` de `layout`
 * rompe ese test.
 */

import { CHARACTERS, GROUPS } from "../../datos/personajes.ts";

/** Se reexporta para que `componentes.ts` no tenga que llegar hasta `datos/`. */
export { GROUPS };

export interface NavLink {
  href: string;
  label: string;
}

export interface LayoutOptions {
  title: string;
  /** `href` del enlace que debe quedar marcado como sección actual. */
  active?: string;
  /** El HTML del contenido, ya montado. */
  content: string;
}

/**
 * El menú está en DATOS, no en HTML. Añadir una sección es añadir una línea
 * aquí, y las cuatro páginas se actualizan solas.
 */
export const NAV_LINKS: NavLink[] = [
  { href: "/", label: "Índice" },
  { href: "/grupos", label: "Grupos" },
  { href: "/buscar", label: "Buscar" },
];

/** Dato ya resuelto. Úsalo siempre que metas texto dentro de HTML. */
export function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

// ─────────────────────────────────────────────────────────────────────────────
// Tus tareas empiezan aquí
// ─────────────────────────────────────────────────────────────────────────────

/**
 * TODO 1 · Genera la barra de navegación.
 *
 * @param active El `href` de la sección actual, o `undefined` si no hay
 *               ninguna. Cuando coincide, su `<a>` lleva `class="active"`.
 * @returns El HTML de la barra, ya metido en un `<nav>`.
 *
 * Contrato exacto:
 *   - Un `<nav>` que envuelve todo.
 *   - Un `<a href="...">etiqueta</a>` por cada entrada de `NAV_LINKS`, en orden.
 *   - Los `<a>` van separados por un `" · "` (punto medio).
 *   - El `<a>` de la sección activa añade `class="active"`, y solo ese.
 *
 * Pistas:
 *   - `NAV_LINKS.map(...)` te da un array de cadenas; `.join(" · ")` las pega.
 *   - Un `map` dentro de una interpolación es normal: `${lista.map(...)}`
 *     convierte los elementos a string al pegarlos.
 *   - El `class` depende de la condición, así que dentro del map tendrás que
 *     meter un `if` o un `&&`. Recuerda que `""` es falsy, y un `&&` con ""
 *     devuelve "" (que no pinta nada). Es el truco habitual.
 */
export function nav(active?: string): string {
  throw new Error("TODO 1: implementa nav", {
    cause: { active, enlaces: NAV_LINKS.length },
  });
}

/**
 * TODO 2 · Genera la página entera.
 *
 * @returns El documento HTML completo, empezando por `<!DOCTYPE html>`.
 *
 * Contrato exacto, con estas etiquetas y este orden:
 *   - `<!DOCTYPE html>`, `<html lang="es">`, `<head>` con `<meta charset>`
 *     y `<title>`.
 *   - Un `<link rel="stylesheet" href="/estilos.css">`.
 *   - `<body>` con un `<header>` (que contiene `nav(options.active)`), un
 *     `<main>` con `options.content`, y un `<footer>`.
 *   - El `<title>` es `${options.title} · Oreimo`.
 *   - El `href="/estilos.css"` en minúsculas y con barra.
 *
 * Pistas:
 *   - Una plantilla literal con `${}` es lo único que necesitas. No busques
 *     más.
 *   - `escapeHtml(options.title)`: el título viene de datos.
 */
export function layout(options: LayoutOptions): string {
  throw new Error("TODO 2: implementa layout", { cause: options });
}

// ─────────────────────────────────────────────────────────────────────────────
// Datos de apoyo para la página de grupos
// ─────────────────────────────────────────────────────────────────────────────

/** Cuántos personajes hay en cada grupo. `filter` + `length`, sin `reduce`. */
export function groupCounts(): { id: string; label: string; total: number }[] {
  return Object.entries(GROUPS).map(([id, label]) => ({
    id,
    label,
    total: CHARACTERS.filter((character) => character.group === id).length,
  }));
}
