/**
 * Tests del bloque 01.
 *
 * Cómo se ejecuta
 * ---------------
 *   deno task test          (toda la suite)
 *   deno test --allow-read=. ejercicios/01-primera-web/   (solo este bloque)
 *
 * Nota sobre el permiso: el handler lee ficheros de `pages/`, así que los
 * tests necesitan `--allow-read`. Por eso la task `test` lo lleva. Fíjate en
 * que no hace falta `--allow-net`: no hay ningún servidor levantado, porque el
 * handler es una función normal que recibe un `Request` y devuelve un
 * `Response`. Eso es lo que hace que esto sea rápido y testeable.
 *
 * Estos tests están en rojo a propósito. Son tu lista de tareas.
 */

import { assertEquals, assertStringIncludes } from "@std/assert";
import {
  escapeHtml,
  filterCharacters,
  handler,
  injectInto,
  renderCharacters,
  searchText,
} from "./server.ts";
import { CHARACTERS } from "../../datos/personajes.ts";

const BASE = "http://localhost:8000";

function get(path: string): Promise<Response> {
  return Promise.resolve(handler(new Request(`${BASE}${path}`)));
}

function idsOf(characters: { id: string }[]): string[] {
  return characters.map((character) => character.id);
}

// ─────────────────────────────────────────────────────────────────────────────
// searchText
// ─────────────────────────────────────────────────────────────────────────────

Deno.test("searchText incluye el nombre, el kana y las etiquetas", () => {
  const kirino = CHARACTERS.find((c) => c.id === "kirino")!;
  const text = searchText(kirino);

  assertStringIncludes(text, "kirino");
  assertStringIncludes(text, "modelo");
});

Deno.test("searchText incluye el alias (Kuroneko encuentra a Ruri)", () => {
  const ruri = CHARACTERS.find((c) => c.id === "ruri")!;
  assertStringIncludes(searchText(ruri), "kuroneko");
});

Deno.test("searchText está en minúsculas", () => {
  for (const character of CHARACTERS) {
    const text = searchText(character);
    assertEquals(text, text.toLowerCase(), `no está en minúsculas: ${text}`);
  }
});

Deno.test("searchText nunca deja un 'undefined' suelto", () => {
  // Ruri es el único personaje con alias, así que recorre el caso peor.
  const ruri = CHARACTERS.find((c) => c.id === "ruri")!;
  const kyousuke = CHARACTERS.find((c) => c.id === "kyousuke")!;

  assertEquals(searchText(kyousuke).includes("undefined"), false);
  assertEquals(searchText(ruri).includes("undefined"), false);
});

Deno.test("searchText no deja espacios dobles", () => {
  // Kyousuke no tiene alias. Si haces `[a, b, c.alias, ...tags].join(" ")`, el
  // hueco del alias vacío deja dos espacios seguidos. No rompe la búsqueda,
  // pero se ve en el HTML y ensucia el atributo.
  for (const character of CHARACTERS) {
    const text = searchText(character);
    assertEquals(text.includes("  "), false, `espacio doble en: ${text}`);
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// filterCharacters
// ─────────────────────────────────────────────────────────────────────────────

Deno.test("filterCharacters con búsqueda vacía devuelve todos", () => {
  assertEquals(
    idsOf(filterCharacters(CHARACTERS, "")),
    idsOf(CHARACTERS),
  );
});

Deno.test("filterCharacters encuentra a Kirino por su nombre", () => {
  const result = idsOf(filterCharacters(CHARACTERS, "kirino"));
  assertEquals(result.includes("kirino"), true);
});

Deno.test("buscar un nombre también devuelve a quien lo lleva en su etiqueta", () => {
  // Detalle importante, y no es un fallo: `searchText` incluye las etiquetas, y
  // Ayase, Manami y Meruru tienen a "Kirino" en las suyas. Escribir "kirino"
  // devuelve a más de una persona, y eso es lo que hace útil un buscador.
  const result = idsOf(filterCharacters(CHARACTERS, "kirino"));
  assertEquals(result.includes("ayase"), true);
  assertEquals(result.includes("manami"), true);
  assertEquals(result.includes("meruru"), true);
});

Deno.test("filterCharacters ignora mayúsculas y espacios sobrantes", () => {
  const conAcentos = idsOf(filterCharacters(CHARACTERS, "  Kirino "));
  const enMinusculas = idsOf(filterCharacters(CHARACTERS, "kirino"));
  assertEquals(conAcentos, enMinusculas);
  assertEquals(conAcentos.includes("kirino"), true);
});

Deno.test("filterCharacters encuentra a Ruri por su alias Kuroneko", () => {
  // Aquí sí es exactamente una persona: "Kuroneko" solo está en su etiqueta.
  assertEquals(idsOf(filterCharacters(CHARACTERS, "kuroneko")), ["ruri"]);
});

Deno.test("filterCharacters con una etiqueta devuelve varios", () => {
  // "idol" aparece en Kanako y Kanata.
  const result = idsOf(filterCharacters(CHARACTERS, "idol"));
  assertEquals(result.includes("kanako"), true);
  assertEquals(result.includes("kanata"), true);
});

Deno.test("filterCharacters sin coincidencias devuelve un array vacío", () => {
  assertEquals(filterCharacters(CHARACTERS, "zzzzz"), []);
});

Deno.test("filterCharacters no muta el array original", () => {
  const before = idsOf(CHARACTERS);
  filterCharacters(CHARACTERS, "kirino");
  assertEquals(idsOf(CHARACTERS), before);
});

// ─────────────────────────────────────────────────────────────────────────────
// renderCharacters
// ─────────────────────────────────────────────────────────────────────────────

Deno.test("renderCharacters devuelve cadena vacía para lista vacía", () => {
  assertEquals(renderCharacters([]), "");
});

Deno.test("renderCharacters pinta un <li> por personaje", () => {
  const html = renderCharacters([CHARACTERS[0]]);
  assertEquals(html.split('class="character"').length - 1, 1);
});

Deno.test("renderCharacters incluye el data-search de searchText", () => {
  const ruri = CHARACTERS.find((c) => c.id === "ruri")!;
  const html = renderCharacters([ruri]);

  assertStringIncludes(html, "data-search=");
  assertStringIncludes(html, searchText(ruri));
});

Deno.test("renderCharacters muestra el alias cuando existe", () => {
  const ruri = CHARACTERS.find((c) => c.id === "ruri")!;
  assertStringIncludes(
    renderCharacters([ruri]),
    "también conocida como Kuroneko",
  );
});

Deno.test("renderCharacters no inventa un alias donde no lo hay", () => {
  const kyousuke = CHARACTERS.find((c) => c.id === "kyousuke")!;
  const html = renderCharacters([kyousuke]);
  assertEquals(html.includes("también conocida como"), false);
});

Deno.test("renderCharacters pinta una etiqueta por cada tag", () => {
  const kyousuke = CHARACTERS.find((c) => c.id === "kyousuke")!;
  const html = renderCharacters([kyousuke]);
  const tagsHtml = html.split('class="tags"')[1] ?? "";
  assertEquals(tagsHtml.split("<li>").length - 1, kyousuke.tags.length);
});

Deno.test("renderCharacters no mete comas entre tarjetas", () => {
  // El clásico error de usar toString() en vez de join("").
  const html = renderCharacters([CHARACTERS[0], CHARACTERS[1]]);
  assertEquals(html.includes("</li>,"), false);
  assertEquals(html.includes("</li>,<li"), false);
});

// ─────────────────────────────────────────────────────────────────────────────
// Utilidades ya resueltas
// ─────────────────────────────────────────────────────────────────────────────

Deno.test("injectInto sustituye el marcador por el contenido", () => {
  assertEquals(
    injectInto("<ul><!-- cards --></ul>", "cards", "<li>hola</li>"),
    "<ul><li>hola</li></ul>",
  );
});

Deno.test("escapeHtml neutraliza las cinco entidades peligrosas", () => {
  assertEquals(
    escapeHtml(`<script>"x" & 'y'</script>`),
    "&lt;script&gt;&quot;x&quot; &amp; &#39;y&#39;&lt;/script&gt;",
  );
});

// ─────────────────────────────────────────────────────────────────────────────
// El handler, de punta a punta
// ─────────────────────────────────────────────────────────────────────────────

Deno.test("GET / responde 200 con content-type de HTML", async () => {
  const res = await get("/");
  assertEquals(res.status, 200);
  assertEquals(res.headers.get("content-type"), "text/html; charset=utf-8");
});

Deno.test("GET / devuelve el esqueleto de la página", async () => {
  const body = await (await get("/")).text();
  assertStringIncludes(body, "<!DOCTYPE html>");
  assertStringIncludes(body, 'id="search-form"');
  assertStringIncludes(body, "Oreimo");
});

Deno.test("GET / sin query pinta a todos los personajes", async () => {
  const body = await (await get("/")).text();
  assertStringIncludes(body, "Kyousuke Kosaka");
  assertStringIncludes(body, "Kirino Kosaka");
});

Deno.test("GET /?q=kirino solo pinta a Kirino", async () => {
  const body = await (await get("/?q=kirino")).text();
  assertStringIncludes(body, "Kirino Kosaka");
  assertEquals(body.includes("Ruri Gokou"), false);
});

Deno.test("GET /?q=kirino devuelve la búsqueda en el data-query", async () => {
  const body = await (await get("/?q=kirino")).text();
  assertStringIncludes(body, 'data-query="kirino"');
});

Deno.test("GET /?q=<script> escapa la búsqueda", async () => {
  // Sin escape, esto sería un XSS reflejado.
  const body = await (await get("/?q=%3Cscript%3E")).text();
  assertStringIncludes(body, "&lt;script&gt;");
  assertEquals(body.includes('data-query="<script>'), false);
});

Deno.test("GET /estilos.css responde con text/css", async () => {
  const res = await get("/estilos.css");
  assertEquals(res.status, 200);
  assertEquals(res.headers.get("content-type"), "text/css; charset=utf-8");
});

Deno.test("GET /app.js responde con text/javascript", async () => {
  const res = await get("/app.js");
  assertEquals(res.status, 200);
  assertEquals(
    res.headers.get("content-type"),
    "text/javascript; charset=utf-8",
  );
});

Deno.test("GET /no-existe responde 404", async () => {
  const res = await get("/no-existe");
  assertEquals(res.status, 404);
});

Deno.test("injectInto NO interpreta los $ del contenido", () => {
  // El segundo argumento de `String.replace` es un patrón de sustitución: con
  // el string, un `$&` en el contenido saldría repetido como marcador.
  const contenido = 'Safinata "$&"';
  const html = injectInto("<ul><!-- cards --></ul>", "cards", contenido);
  assertStringIncludes(html, contenido);
});

Deno.test("renderCharacters escapa el data-search", () => {
  const conDolar = {
    ...CHARACTERS[0],
    name: 'Safinata "$&"',
  };
  const html = renderCharacters([conDolar]);
  assertEquals(html.includes('data-search="Safinata "$&""'), false);
  assertStringIncludes(html, "&amp;");
});
