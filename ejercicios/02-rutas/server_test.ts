/**
 * Tests del bloque 02.
 *
 *   deno task test
 *   deno test --allow-read=. ejercicios/02-rutas/
 *
 * La primera parte de los tests es un aviso sobre lo que el parser de URL ya
 * hace por ti y lo que NO hace. Léelos antes de escribir `isSafePathSegment`:
 * hay un sitio donde parece que estás a salvo y no lo estás.
 */

import { assertEquals, assertStringIncludes } from "@std/assert";
import { isSafePathSegment, resolveRoute, ROUTES } from "./rutas.ts";
import { handler, injectInto, redirect } from "./server.ts";

const BASE = "http://localhost:8000";

function get(path: string): Promise<Response> {
  return Promise.resolve(handler(new Request(`${BASE}${path}`)));
}

// ─────────────────────────────────────────────────────────────────────────────
// Lo que el parser de URL ya hace, y lo que no
// ─────────────────────────────────────────────────────────────────────────────

Deno.test("el parser YA aplana '..' y '%2e%2e' cuando son un segmento entero", () => {
  // Estos dos NO son un ataque: el parser los ha resuelto antes de que los veas.
  assertEquals(
    new URL(`${BASE}/paginas/../../etc/passwd`).pathname,
    "/etc/passwd",
  );
  assertEquals(
    new URL(`${BASE}/paginas/%2e%2e/%2e%2e/etc/passwd`).pathname,
    "/etc/passwd",
  );
});

Deno.test("PERO las barras codificadas SÍ sobreviven: ese es el agujero real", () => {
  const pathname = new URL(`${BASE}/paginas/..%2f..%2fetc`).pathname;

  // El parser no toca el `%2f`, porque no es un separador para él...
  assertStringIncludes(pathname, "..%2f");
  // ...pero en cuanto tu código llama a decodeURIComponent, aparece el `../`.
  // Y si ese valor lo usas para montar una ruta de fichero, te has salido.
  assertStringIncludes(decodeURIComponent(pathname), "../../");
});

Deno.test("el byte nulo también sobrevive en la URL", () => {
  const pathname = new URL(`${BASE}/paginas/%00secreto`).pathname;
  assertStringIncludes(decodeURIComponent(pathname), "\0");
});

// ─────────────────────────────────────────────────────────────────────────────
// isSafePathSegment
// ─────────────────────────────────────────────────────────────────────────────

Deno.test("isSafePathSegment acepta nombres normales", () => {
  for (
    const good of [
      "presentacion",
      "personaje",
      "presentacion-2",
      "v1_0",
      "curoneko",
      "a",
      "presentacion.html",
    ]
  ) {
    assertEquals(isSafePathSegment(good), true, `debería aceptar: ${good}`);
  }
});

Deno.test("isSafePathSegment rechaza los dos puntos", () => {
  assertEquals(isSafePathSegment(".."), false);
  assertEquals(isSafePathSegment("."), false);
});

Deno.test("isSafePathSegment rechaza la cadena vacía", () => {
  assertEquals(isSafePathSegment(""), false);
});

Deno.test("isSafePathSegment rechaza barras, de delante y de atrás", () => {
  assertEquals(isSafePathSegment("a/b"), false);
  assertEquals(isSafePathSegment("/etc/passwd"), false);
  assertEquals(isSafePathSegment("a\\b"), false);
  assertEquals(isSafePathSegment("..\\..\\etc"), false);
});

Deno.test("isSafePathSegment rechaza el byte nulo", () => {
  assertEquals(isSafePathSegment("a\0b"), false);
});

Deno.test("isSafePathSegment rechaza todo lo que no sea alphanumerico", () => {
  for (const bad of ["con espacio", "a?b", "a#b", "a%2fb", "ñ", "a;b", "a|b"]) {
    assertEquals(isSafePathSegment(bad), false, `debería rechazar: ${bad}`);
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// resolveRoute
// ─────────────────────────────────────────────────────────────────────────────

Deno.test("resolveRoute resuelve las rutas fijas de la tabla", () => {
  assertEquals(resolveRoute("/"), { kind: "indice" });
  assertEquals(resolveRoute("/personajes"), { kind: "indice" });
  assertEquals(resolveRoute("/paginas/presentacion"), {
    kind: "pagina",
    template: "presentacion.html",
  });
});

Deno.test("resolveRoute devuelve el redirect de los atajos", () => {
  assertEquals(resolveRoute("/kirino"), {
    kind: "redireccion",
    to: "/personajes/kirino",
  });
  assertEquals(resolveRoute("/kuroneko"), {
    kind: "redireccion",
    to: "/personajes/ruri",
  });
});

Deno.test("resolveRoute reconoce el patrón /personajes/<id>", () => {
  assertEquals(resolveRoute("/personajes/kirino"), {
    kind: "personaje",
    id: "kirino",
  });
});

Deno.test("resolveRoute devuelve null si el id no existe en el dataset", () => {
  // La whitelist de ids es la mejor defensa: si el id no está en CHARACTERS,
  // no hay ni que preguntarse si es peligroso.
  assertEquals(resolveRoute("/personajes/inventado"), null);
});

Deno.test("resolveRoute devuelve null ante rutas desconocidas", () => {
  assertEquals(resolveRoute("/no-existe"), null);
  assertEquals(resolveRoute("/personajes"), { kind: "indice" });
  assertEquals(resolveRoute("/paginas"), null);
});

Deno.test("resolveRoute no se deja llevar por barras extra", () => {
  assertEquals(resolveRoute("/personajes/kirino/mas"), null);
  assertEquals(resolveRoute("/personajes/"), null);
  assertEquals(resolveRoute("/personajes//kirino"), null);
});

Deno.test("resolveRoute bloquea el traversal con barras codificadas", () => {
  // `new URL` deja esto intacto, así que llega entero a tu función.
  const pathname = new URL(`${BASE}/paginas/..%2f..%2fetc`).pathname;
  assertEquals(resolveRoute(pathname), null);
});

Deno.test("resolveRoute no se confunde con las propiedades del objeto", () => {
  // Si un día la tabla se llena de rutas sin prefijo, `ROUTES["constructor"]`
  // devolvería la función constructora. Ejecuta esto después de implementarlo:
  assertEquals(resolveRoute("/constructor"), null);
  assertEquals(resolveRoute("/toString"), null);
  assertEquals(Object.keys(ROUTES).length, 5);
});

// ─────────────────────────────────────────────────────────────────────────────
// El redirect de verdad
// ─────────────────────────────────────────────────────────────────────────────

Deno.test("Response.redirect NO acepta URLs relativas (por eso escribimos redirect)", () => {
  // Esta es la razón de que exista la función `redirect` a mano.
  assertEquals(
    (() => {
      try {
        Response.redirect("/personajes/kirino");
        return "no lanzó";
      } catch (error) {
        return error instanceof TypeError;
      }
    })(),
    true,
  );
});

Deno.test("redirect fabrica un 301 con cabecera Location", () => {
  const res = redirect("/personajes/kirino");
  assertEquals(res.status, 301);
  assertEquals(res.headers.get("location"), "/personajes/kirino");
});

Deno.test("GET /kirino devuelve 301, no 200", async () => {
  const res = await get("/kirino");
  assertEquals(res.status, 301);
  assertEquals(res.headers.get("location"), "/personajes/kirino");
});

Deno.test("seguir el redirect de /kirino acaba en la ficha", async () => {
  const res = await get("/kirino");
  const seguido = await get(res.headers.get("location")!);
  const body = await seguido.text();

  assertEquals(seguido.status, 200);
  assertStringIncludes(body, "Kirino Kosaka");
});

Deno.test("GET /kuroneko lleva a la ficha de Ruri, no a la de Kuroneko", async () => {
  const res = await get("/kuroneko");
  assertEquals(res.headers.get("location"), "/personajes/ruri");

  const body = await (await get("/personajes/ruri")).text();
  assertStringIncludes(body, "Ruri Gokou");
  assertStringIncludes(body, "Kuroneko");
});

// ─────────────────────────────────────────────────────────────────────────────
// El handler
// ─────────────────────────────────────────────────────────────────────────────

Deno.test("GET / responde 200 con el índice", async () => {
  const res = await get("/");
  assertEquals(res.status, 200);
  assertEquals(res.headers.get("content-type"), "text/html; charset=utf-8");
  assertStringIncludes(await res.text(), "Kirino Kosaka");
});

Deno.test("GET /personajes/kirino responde 200 con su ficha", async () => {
  const res = await get("/personajes/kirino");
  assertEquals(res.status, 200);
  assertStringIncludes(await res.text(), "Kirino Kosaka");
});

Deno.test("la ficha lista las relaciones del personaje", async () => {
  const body = await (await get("/personajes/kirino")).text();
  // Kyousuke es hermano de Kirino: sale por la relación, no por la etiqueta.
  assertStringIncludes(body, "hermano mayor: Kyousuke Kosaka");
});

Deno.test("GET /personajes/inventado responde 404", async () => {
  assertEquals((await get("/personajes/inventado")).status, 404);
});

Deno.test("GET /paginas/presentacion responde 200 con la página estática", async () => {
  const res = await get("/paginas/presentacion");
  assertEquals(res.status, 200);
  assertStringIncludes(await res.text(), "Prueba a romperlo");
});

Deno.test("los intentos de traversal NO devuelven contenido del sistema", async () => {
  const intentos = [
    "/etc/passwd", // el parser ya lo aplanó, pero no está en la tabla
    "/paginas/..%2f..%2fetc%2fpasswd",
    "/paginas/%2e%2e%2f%2e%2e%2fetc",
    "/personajes/..%2f..%2fetc%2fpasswd",
    "/paginas/%00presentacion",
  ];

  for (const intento of intentos) {
    const res = await get(intento);
    assertEquals(res.status, 404, `debía dar 404: ${intento}`);

    const body = await res.text();
    assertEquals(
      body.includes("root:"),
      false,
      `¡ha filtrado algo del sistema con ${intento}!`,
    );
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// injectInto
//
// Esta función YA está resuelta y no hay que tocarla, pero tiene una trampa
// documentada en el propio código. Estos tests la fijan por si alguien cambia
// la implementación y rompe el escapado del contenido.
// ─────────────────────────────────────────────────────────────────────────────

Deno.test("injectInto mete el contenido en el marcador", () => {
  assertEquals(
    injectInto("<h1><!-- titulo --></h1>", "titulo", "Oreimo"),
    "<h1>Oreimo</h1>",
  );
});

Deno.test("injectInto NO interpreta los $ del contenido", () => {
  // El bug: `html.replace(marcador, contenido)` trata el segundo argumento
  // como patrón de sustitución. Con "$&" en el contenido, sale el marcador
  // repetido en vez de la señal de dólar.
  const contenido = 'Tsubasa "$&" y "$1" y "$`"';
  const html = injectInto("<h1><!-- t --></h1>", "t", contenido);
  assertEquals(
    html.includes(contenido),
    true,
    `el contenido se ha roto: ${html}`,
  );
  assertEquals(html.includes("$&"), true);
});

Deno.test("injectInto deja intacto el resto del HTML", () => {
  assertEquals(
    injectInto("<p>a</p><!-- m --><p>b</p>", "m", "X"),
    "<p>a</p>X<p>b</p>",
  );
});

Deno.test("un nombre con $ no rompe la página", () => {
  // Extremo a extremo: el contenido viene de los datos, y `injectInto` es la
  // última barrera antes de que llegue al HTML.
  const html = injectInto(
    '<div class="card"><!-- nombre --></div>',
    "nombre",
    'Safinata "$&"',
  );
  assertStringIncludes(html, 'Safinata "$&"');
});
