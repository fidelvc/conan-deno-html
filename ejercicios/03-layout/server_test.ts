/**
 * Tests del bloque 03.
 *
 *   deno task test
 *   deno test --allow-read=. ejercicios/03-layout/
 *
 * Estos tests no necesitan ni siquiera `--allow-read` para las funciones
 * puras: `nav`, `layout`, `tagList` y `characterCard` son strings que entran y
 * strings que salen. Solo el handler toca el disco, y solo para el CSS.
 */

import {
  assertEquals,
  assertMatch,
  assertNotEquals,
  assertStringIncludes,
} from "@std/assert";
import {
  characterCard,
  characterGrid,
  findCharacter,
  relationshipList,
  tagList,
} from "./componentes.ts";
import { groupCounts, layout, nav, NAV_LINKS } from "./layout.ts";
import { handler } from "./server.ts";
import { CHARACTERS } from "../../datos/personajes.ts";
import type { Character } from "../../datos/personajes.ts";

const BASE = "http://localhost:8000";

function get(path: string): Promise<Response> {
  return Promise.resolve(handler(new Request(`${BASE}${path}`)));
}

function kirino(): Character {
  return findCharacter("kirino")!;
}

// ─────────────────────────────────────────────────────────────────────────────
// nav
// ─────────────────────────────────────────────────────────────────────────────

Deno.test("nav pinta un enlace por cada sección de NAV_LINKS", () => {
  const html = nav();
  for (const link of NAV_LINKS) {
    assertStringIncludes(html, `href="${link.href}"`);
    assertStringIncludes(html, link.label);
  }
  assertEquals(html.split("<a ").length - 1, NAV_LINKS.length);
});

Deno.test("nav envuelve todo en un <nav>", () => {
  assertStringIncludes(nav(), "<nav>");
  assertStringIncludes(nav(), "</nav>");
});

Deno.test("nav separa los enlaces con un punto medio", () => {
  assertStringIncludes(nav(), " · ");
});

Deno.test("nav marca la sección activa y solo esa", () => {
  const html = nav("/grupos");
  assertEquals(html.split('class="activo"').length - 1, 1);
  // La activa es la de /grupos, no la primera.
  const activo = html.slice(html.indexOf('class="activo"'));
  assertStringIncludes(activo.slice(0, 200), "Grupos");
});

Deno.test("nav sin sección activa no marca ninguna", () => {
  assertEquals(nav().includes('class="activo"'), false);
});

// ─────────────────────────────────────────────────────────────────────────────
// layout
// ─────────────────────────────────────────────────────────────────────────────

Deno.test("layout devuelve un documento completo", () => {
  const html = layout({ title: "Prueba", content: "<p>hola</p>" });

  assertStringIncludes(html, "<!DOCTYPE html>");
  assertStringIncludes(html, '<html lang="es">');
  assertStringIncludes(html, "<head>");
  assertStringIncludes(html, "<body>");
  assertStringIncludes(html, "<footer>");
  assertStringIncludes(html, "</html>");
});

Deno.test("layout mete el título y el contenido", () => {
  const html = layout({ title: "Kirino Kosaka", content: "<p>contenido</p>" });
  assertStringIncludes(html, "<title>Kirino Kosaka · Oreimo</title>");
  assertStringIncludes(html, "<p>contenido</p>");
});

Deno.test("layout enlaza el CSS", () => {
  assertStringIncludes(
    layout({ title: "x", content: "" }),
    '<link rel="stylesheet" href="/estilos.css">',
  );
});

Deno.test("layout mete la navegación con la sección activa", () => {
  const html = layout({ title: "x", content: "", active: "/" });
  assertStringIncludes(html, "<nav>");
  assertStringIncludes(html, 'class="activo"');
});

Deno.test("layout escapa el título", () => {
  const html = layout({ title: "<script>alert(1)</script>", content: "" });
  assertStringIncludes(html, "&lt;script&gt;");
  assertEquals(html.includes("<script>alert"), false);
});

// ─────────────────────────────────────────────────────────────────────────────
// tagList
// ─────────────────────────────────────────────────────────────────────────────

Deno.test("tagList pinta un <li> por etiqueta", () => {
  const html = tagList(["modelo", "tsundere"]);
  assertEquals(html.split("<li>").length - 1, 2);
  assertStringIncludes(html, "<li>modelo</li>");
  assertStringIncludes(html, "<li>tsundere</li>");
});

Deno.test("tagList respeta el orden del array", () => {
  const html = tagList(["a", "b", "c"]);
  assertEquals(html.indexOf("<li>a</li>") < html.indexOf("<li>b</li>"), true);
  assertEquals(html.indexOf("<li>b</li>") < html.indexOf("<li>c</li>"), true);
});

Deno.test('tagList envuelve en un <ul class="etiquetas">', () => {
  const html = tagList(["modelo"]);
  assertStringIncludes(html, '<ul class="etiquetas">');
  assertStringIncludes(html, "</ul>");
});

Deno.test("tagList con array vacío no rompe nada", () => {
  const html = tagList([]);
  assertEquals(html.includes("undefined"), false);
  assertEquals(html.includes('class="etiquetas"'), true);
});

Deno.test("tagList escapa el contenido de cada etiqueta", () => {
  const html = tagList(["<img src=x onerror=alert(1)>"]);
  assertStringIncludes(html, "&lt;img");
  assertEquals(html.includes("<img"), false);
});

Deno.test("tagList no mete espacios entre los <li>", () => {
  const html = tagList(["a", "b"]);
  assertEquals(html.includes("</li> <li"), false);
  assertEquals(html.includes("</li>\n<li"), false);
});

// ─────────────────────────────────────────────────────────────────────────────
// relationshipList
// ─────────────────────────────────────────────────────────────────────────────

Deno.test("relationshipList pinta un <li> por vínculo", () => {
  const html = relationshipList(kirino());
  assertEquals(
    html.split("<li>").length - 1,
    kirino().relationships.length,
  );
});

Deno.test("relationshipList escribe el tipo y el nombre", () => {
  assertStringIncludes(relationshipList(kirino()), "hermano mayor");
  assertStringIncludes(relationshipList(kirino()), "Kyousuke Kosaka");
});

Deno.test("relationshipList enlaza al personaje si existe", () => {
  assertStringIncludes(
    relationshipList(kirino()),
    '<a href="/personajes/kyousuke">',
  );
});

Deno.test("relationshipList sobrevive a un id que no existe", () => {
  // Se rompe el dato a propósito, como pasaría al importar datos de fuera.
  const roto: Character = {
    ...kirino(),
    relationships: [{ to: "alguien-que-no-existe", type: "desconocido" }],
  };

  const html = relationshipList(roto);
  assertStringIncludes(html, "alguien-que-no-existe");
  assertEquals(html.includes("undefined"), false);
  assertEquals(html.includes("href"), false);
});

Deno.test("relationshipList escapa el tipo de relación", () => {
  const hostil: Character = {
    ...kirino(),
    relationships: [{ to: "kyousuke", type: "<b>amigo</b>" }],
  };

  const html = relationshipList(hostil);
  assertStringIncludes(html, "&lt;b&gt;amigo&lt;/b&gt;");
  assertEquals(html.includes("<b>amigo</b>"), false);
});

Deno.test("relationshipList sin relaciones no rompe nada", () => {
  const soltero: Character = { ...kirino(), relationships: [] };
  const html = relationshipList(soltero);
  assertEquals(html.includes("undefined"), false);
});

// ─────────────────────────────────────────────────────────────────────────────
// characterCard
// ─────────────────────────────────────────────────────────────────────────────

Deno.test('characterCard es un <article class="personaje">', () => {
  const html = characterCard(kirino());
  assertStringIncludes(html, '<article class="personaje">');
  assertStringIncludes(html, "</article>");
});

Deno.test("characterCard enlaza a su ficha", () => {
  assertStringIncludes(
    characterCard(kirino()),
    '<a href="/personajes/kirino">',
  );
  assertStringIncludes(characterCard(kirino()), "Kirino Kosaka");
});

Deno.test("characterCard pinta el alias cuando existe", () => {
  const html = characterCard(findCharacter("ruri")!);
  assertStringIncludes(html, '<p class="alias">');
  assertStringIncludes(html, "Kuroneko");
});

Deno.test("characterCard omite el alias cuando no existe", () => {
  const html = characterCard(kirino());
  assertEquals(html.includes('<p class="alias">'), false);
  assertEquals(html.includes("también conocida como"), false);
});

Deno.test("characterCard pinta la etiqueta del grupo", () => {
  assertStringIncludes(characterCard(kirino()), "Familia Kosaka");
});

Deno.test("characterCard incluye el resumen", () => {
  assertStringIncludes(characterCard(kirino()), "modelo");
});

Deno.test("characterCard delega en tagList", () => {
  const html = characterCard(kirino());
  assertStringIncludes(html, '<ul class="etiquetas">');
  assertEquals(
    html.split("<li>").length - 1,
    kirino().tags.length,
  );
});

Deno.test("characterCard escapa un nombre con HTML dentro (XSS)", () => {
  const hostil: Character = {
    ...kirino(),
    name: '<img src=x onerror="alert(1)">',
  };

  const html = characterCard(hostil);
  assertEquals(html.includes("<img"), false, "¡ha salido HTML sin escapar!");
  assertStringIncludes(html, "&lt;img");
  assertStringIncludes(html, "&lt;img src=x onerror=");
});

Deno.test("characterCard escapa un id con comillas (inyección de atributo)", () => {
  // Si el id no estuviera escapado dentro del href, esto rompería el atributo.
  const hostil: Character = {
    ...kirino(),
    id: 'kirino" onmouseover="alert(1)',
  };

  const html = characterCard(hostil);
  assertEquals(html.includes('onmouseover="alert'), false);
  assertStringIncludes(html, "&quot;");
});

Deno.test("characterCard nunca escribe la palabra undefined", () => {
  for (const character of CHARACTERS) {
    assertEquals(
      characterCard(character).includes("undefined"),
      false,
      `undefined en ${character.id}`,
    );
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// characterGrid y groupCounts (ya resueltos)
// ─────────────────────────────────────────────────────────────────────────────

Deno.test("characterGrid pinta una tarjeta por personaje", () => {
  const html = characterGrid([kirino(), findCharacter("ruri")!]);
  assertEquals(html.split('<article class="personaje">').length - 1, 2);
});

Deno.test("characterGrid con lista vacía no rompe nada", () => {
  const html = characterGrid([]);
  assertEquals(html.includes("undefined"), false);
  assertStringIncludes(html, 'class="rejilla"');
});

Deno.test("groupCounts suma todos los personajes", () => {
  const total = groupCounts().reduce((sum, group) => sum + group.total, 0);
  assertEquals(total, CHARACTERS.length);
});

// ─────────────────────────────────────────────────────────────────────────────
// El handler
// ─────────────────────────────────────────────────────────────────────────────

Deno.test("GET / responde 200 con la página generada", async () => {
  const res = await get("/");
  assertEquals(res.status, 200);
  assertEquals(res.headers.get("content-type"), "text/html; charset=utf-8");

  const body = await res.text();
  assertStringIncludes(body, "<!DOCTYPE html>");
  assertStringIncludes(body, "Kirino Kosaka");
  assertStringIncludes(body, "<footer>");
});

Deno.test("GET /buscar responde 200 con el formulario", async () => {
  const body = await (await get("/buscar")).text();
  assertStringIncludes(body, 'method="get"');
  assertStringIncludes(body, 'name="q"');
});

Deno.test("GET /grupos responde 200 con los grupos", async () => {
  const body = await (await get("/grupos")).text();
  assertStringIncludes(body, "Familia Kosaka");
  assertStringIncludes(body, "Stardust Witch Meruru");
});

Deno.test("GET /personajes/ruri responde 200 con la ficha", async () => {
  const res = await get("/personajes/ruri");
  assertEquals(res.status, 200);
  assertStringIncludes(await res.text(), "Kuroneko");
});

Deno.test("GET /personajes/inventado responde 404", async () => {
  assertEquals((await get("/personajes/inventado")).status, 404);
});

Deno.test("GET /estilos.css responde con text/css", async () => {
  const res = await get("/estilos.css");
  assertEquals(res.status, 200);
  assertEquals(res.headers.get("content-type"), "text/css; charset=utf-8");
});

Deno.test("ninguna página de la app imprime HTML sin escapar", async () => {
  for (const path of ["/", "/buscar", "/grupos", "/personajes/kirino"]) {
    const body = await (await get(path)).text();
    assertMatch(body, /<!DOCTYPE html>/);
    // Ningún alert, ningún onerror, ningún script inyectado.
    assertEquals(
      body.includes("alert("),
      false,
      `algo se ha colado en ${path}`,
    );
    assertEquals(
      body.includes("onerror="),
      false,
      `algo se ha colado en ${path}`,
    );
  }
  assertNotEquals(CHARACTERS.length, 0);
});
