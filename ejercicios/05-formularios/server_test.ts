/**
 * Tests del bloque 05.
 *
 *   deno task test
 *   deno test --allow-read=. ejercicios/05-formularios/
 *
 * Dos tipos de test en un solo fichero:
 *   - Los de `formulario.test.ts` son funciones puras. Corren en microsegundos.
 *   - Los de aquí son extremo a extremo: mandan una `Request` al handler y
 *     miran el `Response`. Tardan milisegundos, pero comprueban el flujo
 *     completo (validar → guardar → 303 → GET).
 *
 * COSA IMPORTANTE SOBRE ESTE FICHERO
 * ----------------------------------
 * `altas` es un array en memoria, COMPARTIDO entre todos los tests del
 * fichero. Si un test crea un alta, los siguientes la ven. Por eso casi todos
 * usan nombres distintos y únicos, y por eso hay un test que mira el 409.
 * No los reordenes sin pensar, o empiezan a fallar en sitios raros.
 */

import { assertEquals, assertMatch, assertStringIncludes } from "@std/assert";
import {
  ALTA_VACIA,
  crearRedirect,
  escapeHtml,
  GROUPS,
  leerCampos,
  LIMITES,
  listaErrores,
  renderAlta,
  SIN_ERRORES,
  slug,
  validar,
} from "./formulario.ts";
import { existeAlta, handler, listarAltas } from "./server.ts";
import type { Alta, Errores } from "./formulario.ts";

const BASE = "http://localhost:8000";
const NOMBRE_VALIDO = "Sena Akagi";

function get(path: string): Promise<Response> {
  return Promise.resolve(handler(new Request(`${BASE}${path}`)));
}

function form(datos: Record<string, string>): Request {
  // Esto es EXACTAMENTE lo que manda un `<form method="post">` real cuando no
  // tiene `enctype="multipart/form-data"`: el cuerpo es
  // `application/x-www-form-urlencoded`, o sea pares clave=valor con el texto
  // escapado.
  //
  // Ojo con dos atajos que NO existen y que todo el mundo se inventa:
  //   - `new Request(url, { method: "POST", formData: datos })`. No existe esa
  //     opción en `RequestInit`. No da error al construir (TypeScript se queja,
  //     el runtime se lo come), pero deja el cuerpo vacío y sin content-type.
  //   - `new Request(url, { method: "POST", body: datos })`. Un objeto plano no
  //     se puede convertir a texto, así que tampoco vale.
  return new Request(`${BASE}/nuevo`, {
    method: "POST",
    body: new URLSearchParams(datos),
    headers: { "content-type": "application/x-www-form-urlencoded" },
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// TIPOS Y CONSTANTES
// ─────────────────────────────────────────────────────────────────────────────

Deno.test("ALTA_VACIA son tres strings vacíos", () => {
  assertEquals(ALTA_VACIA, { nombre: "", grupo: "", descripcion: "" });
});

Deno.test("SIN_ERRORES es un objeto vacío", () => {
  assertEquals(SIN_ERRORES, {});
  assertEquals(Object.keys(SIN_ERRORES).length, 0);
});

Deno.test("LIMITES cuadra con lo que se pide", () => {
  assertEquals(LIMITES.nombre.min, 2);
  assertEquals(LIMITES.nombre.max, 40);
  assertEquals(LIMITES.descripcion.max, 200);
});

// ─────────────────────────────────────────────────────────────────────────────
// leerCampos
// ─────────────────────────────────────────────────────────────────────────────

Deno.test("leerCampos saca los tres campos", () => {
  const data = new FormData();
  data.set("nombre", "Sena");
  data.set("grupo", "familia-akagi");
  data.set("descripcion", "la hermana lista");

  assertEquals(leerCampos(data), {
    nombre: "Sena",
    grupo: "familia-akagi",
    descripcion: "la hermana lista",
  });
});

Deno.test("leerCampos devuelve los TRES campos aunque falten", () => {
  const alta = leerCampos(new FormData());
  assertEquals(alta.nombre, "");
  assertEquals(alta.grupo, "");
  assertEquals(alta.descripcion, "");
});

Deno.test("leerCampos aplica trim", () => {
  const data = new FormData();
  data.set("nombre", "  Sena Akagi  \n");
  assertEquals(leerCampos(data).nombre, "Sena Akagi");
});

Deno.test("leerCampos NO devuelve undefined (el tipo lo engaña)", () => {
  // `FormData.get()` devuelve `string | File | null`. Los tres casos raros:
  const data = new FormData();
  data.set("nombre", new File(["x"], "nuevo.txt"));

  const alta = leerCampos(data);
  assertEquals(typeof alta.nombre, "string");
  assertEquals(typeof alta.grupo, "string");
  assertEquals(typeof alta.descripcion, "string");
});

Deno.test("leerCampos con un File en el campo no lo pone como nombre", () => {
  const data = new FormData();
  data.set("nombre", new File(["contenido"], "secreto.txt"));
  // No puede ser el contenido del fichero, y tampoco `[object File]`.
  const alta = leerCampos(data);
  assertEquals(alta.nombre.includes("contenido"), false);
  assertEquals(alta.nombre, "");
});

Deno.test("leerCampos ignora campos que no son del formulario", () => {
  const data = new FormData();
  data.set("nombre", "Sena");
  data.set("admin", "true");
  data.set("_csrf", "falso");
  assertEquals(Object.keys(leerCampos(data)).sort(), [
    "descripcion",
    "grupo",
    "nombre",
  ]);
});

// ─────────────────────────────────────────────────────────────────────────────
// validar
// ─────────────────────────────────────────────────────────────────────────────

function altaValida(overrides: Partial<Alta> = {}): Alta {
  const base: Alta = {
    nombre: NOMBRE_VALIDO,
    grupo: "familia-akagi",
    descripcion: "",
  };
  return { ...base, ...overrides };
}

Deno.test("validar acepta un alta correcta", () => {
  assertEquals(validar(altaValida()), {});
});

Deno.test("validar rechaza el nombre vacío", () => {
  const errores = validar(altaValida({ nombre: "" }));
  assertEquals(typeof errores.nombre, "string");
});

Deno.test("validar rechaza un nombre de 1 carácter", () => {
  assertEquals(typeof validar(altaValida({ nombre: "S" })).nombre, "string");
});

Deno.test("validar acepta un nombre de 2 caracteres", () => {
  assertEquals(validar(altaValida({ nombre: "Se" })).nombre, undefined);
});

Deno.test("validar rechaza un nombre de 41 caracteres", () => {
  assertEquals(
    typeof validar(altaValida({ nombre: "a".repeat(41) })).nombre,
    "string",
  );
});

Deno.test("validar acepta un nombre de 40 caracteres", () => {
  assertEquals(
    validar(altaValida({ nombre: "a".repeat(40) })).nombre,
    undefined,
  );
});

Deno.test("validar rechaza el grupo vacío", () => {
  assertEquals(typeof validar(altaValida({ grupo: "" })).grupo, "string");
});

Deno.test("validar rechaza un grupo inventado", () => {
  // El <select> se puede manipular. Esto no es un <select>, es un POST cualquiera.
  assertEquals(
    typeof validar(altaValida({ grupo: "grupo-inventado" })).grupo,
    "string",
  );
});

Deno.test("validar acepta CUALQUIER grupo de GROUPS", () => {
  for (const id of Object.keys(GROUPS)) {
    assertEquals(
      validar(altaValida({ grupo: id })).grupo,
      undefined,
      `el grupo ${id} debería valer`,
    );
  }
});

Deno.test("validar acepta la descripción vacía (es opcional)", () => {
  assertEquals(validar(altaValida({ descripcion: "" })).descripcion, undefined);
});

Deno.test("validar rechaza una descripción de 201 caracteres", () => {
  assertEquals(
    typeof validar(altaValida({ descripcion: "a".repeat(201) })).descripcion,
    "string",
  );
});

Deno.test("validar devuelve TODOS los errores a la vez", () => {
  const errores = validar({
    nombre: "",
    grupo: "banana",
    descripcion: "a".repeat(500),
  });
  assertEquals(Object.keys(errores).sort(), ["descripcion", "grupo", "nombre"]);
});

Deno.test("los mensajes de error son texto útil, no 'error'", () => {
  const errores = validar(altaValida({ nombre: "" }));
  const mensaje = errores.nombre ?? "";
  assertEquals(mensaje.length > 10, true);
  assertEquals(mensaje.toLowerCase().includes("error"), false);
  assertMatch(mensaje, /nombre/i);
});

Deno.test("validar es puro: no toca lo que recibe", () => {
  const entrada = altaValida();
  validar(entrada);
  assertEquals(entrada, altaValida());
});

Deno.test("listaErrores saca los mensajes en orden", () => {
  const errores: Errores = {
    nombre: "Pon un nombre",
    grupo: "Elige grupo",
  };
  assertEquals(listaErrores(errores), ["Pon un nombre", "Elige grupo"]);
});

Deno.test("listaErrores de SIN_ERRORES es []", () => {
  assertEquals(listaErrores(SIN_ERRORES), []);
});

// ─────────────────────────────────────────────────────────────────────────────
// slug
// ─────────────────────────────────────────────────────────────────────────────

Deno.test("slug baja a minúsculas y cambia espacios por guiones", () => {
  assertEquals(slug("Sena Akagi"), "sena-akagi");
});

Deno.test("slug quita los acentos", () => {
  assertEquals(slug("Ágata Ñuñez"), "agata-nunez");
  assertEquals(slug("Aínhoa Élez"), "ainhoa-elez");
});

Deno.test("slug NO puede devolver acentos", () => {
  const limpio = slug("Pérez Muñoz");
  assertEquals(limpio, "perez-munoz");
  assertMatch(limpio, /^[a-z0-9-]+$/);
});

Deno.test("slug colapsa separadores seguidos", () => {
  // "D.K." tiene dos separadores con un punto entre medias: "d-k", no "d--k".
  assertEquals(slug("D.K."), "d-k");
  assertEquals(slug("a   b"), "a-b");
  assertEquals(slug("a!!!b"), "a-b");
});

Deno.test("slug quita guiones de los extremos", () => {
  assertEquals(slug("  Sena  "), "sena");
  assertEquals(slug("---Sena---"), "sena");
  assertEquals(slug("!!!"), "");
});

Deno.test("slug deja los números", () => {
  assertEquals(slug("Agari 2"), "agari-2");
  assertEquals(slug("Stardust Witch Meruru 0"), "stardust-witch-meruru-0");
});

Deno.test("slug de un nombre vacío es ''", () => {
  assertEquals(slug(""), "");
  assertEquals(slug("   "), "");
});

Deno.test("slug nunca deja guiones dobles", () => {
  for (const nombre of ["a  b", "a--b", "a .- b", "a//b"]) {
    assertEquals(slug(nombre).includes("--"), false, nombre);
  }
});

Deno.test("slug no puede usarse para salir de la ruta", () => {
  // Aunque le pases "../../etc/passwd" a mano, no puede hacer daño.
  const resultado = slug("../../etc/passwd");
  assertEquals(resultado.includes("/"), false);
  assertEquals(resultado.startsWith("."), false);
});

// ─────────────────────────────────────────────────────────────────────────────
// renderAlta
// ─────────────────────────────────────────────────────────────────────────────

Deno.test("renderAlta pinta un formulario con method=post", () => {
  const html = renderAlta(ALTA_VACIA, SIN_ERRORES, "nuevo");
  assertStringIncludes(html, "<form");
  assertStringIncludes(html, 'method="post"');
  assertStringIncludes(html, 'action="/nuevo"');
});

Deno.test("renderAlta tiene un input por cada campo", () => {
  const html = renderAlta(ALTA_VACIA, SIN_ERRORES, "nuevo");
  for (const name of ["nombre", "grupo", "descripcion"]) {
    assertStringIncludes(html, `name="${name}"`);
  }
});

Deno.test("renderAlta con valores previos los deja en el value", () => {
  const html = renderAlta(
    { nombre: "Sena", grupo: "familia-akagi", descripcion: "la hermana" },
    SIN_ERRORES,
    "nuevo",
  );
  assertStringIncludes(html, 'value="Sena"');
  assertStringIncludes(html, "la hermana");
});

Deno.test("renderAlta pinta una option por cada grupo", () => {
  const html = renderAlta(ALTA_VACIA, SIN_ERRORES, "nuevo");
  for (const id of Object.keys(GROUPS)) {
    assertStringIncludes(html, `value="${id}"`);
  }
});

Deno.test("renderAlta marca el grupo elegido con selected", () => {
  const html = renderAlta(
    { nombre: "", grupo: "familia-akagi", descripcion: "" },
    SIN_ERRORES,
    "nuevo",
  );
  assertMatch(html, /<option value="familia-akagi"[^>]*selected/);
});

Deno.test("renderAlta sin grupo elegido NO preselecciona un grupo", () => {
  // Puede (o no) marcar el <option value=""> de "Elige uno": las dos son HTML
  // válido. Lo que no puede hacer es marcar un grupo que el usuario no eligió.
  const html = renderAlta(ALTA_VACIA, SIN_ERRORES, "nuevo");
  for (const id of Object.keys(GROUPS)) {
    assertEquals(
      new RegExp(`<option value="${id}"[^>]*selected`).test(html),
      false,
      `preseleccionó el grupo ${id}`,
    );
  }
});

Deno.test("renderAlta ESCAPA el nombre con HTML dentro", () => {
  // La parte importante del bloque. Un `nombre` con `<script>` tiene que
  // aparecer escapado, no ejecutarse.
  const html = renderAlta(
    {
      nombre: "<script>alert(1)</script>",
      grupo: "familia-akagi",
      descripcion: "",
    },
    SIN_ERRORES,
    "nuevo",
  );
  assertEquals(html.includes("<script>"), false);
  assertStringIncludes(html, "&lt;script&gt;");
});

Deno.test("renderAlta ESCAPA la descripción con HTML dentro", () => {
  const html = renderAlta(
    {
      nombre: "Sena",
      grupo: "familia-akagi",
      descripcion: "<img src=x onerror=alert(1)>",
    },
    SIN_ERRORES,
    "nuevo",
  );
  assertEquals(html.includes("<img"), false);
  assertStringIncludes(html, "&lt;img");
});

Deno.test("renderAlta ESCAPA las comillas para no romper el atributo", () => {
  const html = renderAlta(
    { nombre: '" onfocus="alert(1)', grupo: "familia-akagi", descripcion: "" },
    SIN_ERRORES,
    "nuevo",
  );
  assertEquals(html.includes('" onfocus="'), false);
  assertStringIncludes(html, "&quot;");
});

Deno.test("renderAlta muestra los mensajes de error", () => {
  const html = renderAlta(ALTA_VACIA, { nombre: "Pon un nombre" }, "error");
  assertStringIncludes(html, "Pon un nombre");
});

Deno.test("renderAlta sin errores NO inventa un aviso de error", () => {
  const html = renderAlta(ALTA_VACIA, SIN_ERRORES, "nuevo");
  assertEquals(html.includes('class="error"'), false);
});

Deno.test("renderAlta en status error SÍ trae el aviso", () => {
  assertStringIncludes(
    renderAlta(ALTA_VACIA, { grupo: "Elige un grupo" }, "error"),
    "Elige un grupo",
  );
});

Deno.test("renderAlta escapó un grupo manipulado en el value", () => {
  const html = renderAlta(
    { nombre: "Sena", grupo: '"><script>alert(1)</script>', descripcion: "" },
    SIN_ERRORES,
    "nuevo",
  );
  assertEquals(html.includes("<script"), false);
});

// ─────────────────────────────────────────────────────────────────────────────
// crearRedirect
// ─────────────────────────────────────────────────────────────────────────────

Deno.test("crearRedirect devuelve 303", () => {
  assertEquals(crearRedirect("/personajes/sena-akagi").status, 303);
});

Deno.test("crearRedirect pone la cabecera Location", () => {
  assertEquals(
    crearRedirect("/personajes/sena-akagi").headers.get("location"),
    "/personajes/sena-akagi",
  );
});

Deno.test("crearRedirect NO tiene cuerpo", () => {
  assertEquals(crearRedirect("/personajes/sena-akagi").body, null);
});

Deno.test("crearRedirect no es 302 (el 303 es el que cambia POST por GET)", () => {
  const status = crearRedirect("/x").status;
  assertEquals(status === 302, false);
  assertEquals(status === 303, true);
});

// ─────────────────────────────────────────────────────────────────────────────
// Extremo a extremo: GET
// ─────────────────────────────────────────────────────────────────────────────

Deno.test("GET /nuevo responde 200 con el formulario", async () => {
  const res = await get("/nuevo");
  assertEquals(res.status, 200);
  assertStringIncludes(res.headers.get("content-type") ?? "", "text/html");
  assertStringIncludes(await res.text(), "<form");
});

Deno.test("GET /nuevo NO crea ninguna alta", async () => {
  const antes = listarAltas().length;
  await get("/nuevo");
  assertEquals(listarAltas().length, antes);
});

Deno.test("GET / responde 200 y dice que no hay altas al principio", async () => {
  const res = await get("/");
  assertEquals(res.status, 200);
  assertStringIncludes(await res.text(), "Oreimo");
});

// ─────────────────────────────────────────────────────────────────────────────
// Extremo a extremo: POST válido
// ─────────────────────────────────────────────────────────────────────────────

Deno.test("POST válido responde 303 y NO devuelve HTML", async () => {
  const res = await handler(
    form({ nombre: "Kurara Test", grupo: "club-meruru" }),
  );
  assertEquals(res.status, 303);
  const cuerpo = await res.text();
  assertEquals(cuerpo.includes("<form"), false);
});

Deno.test("POST válido manda a la ficha del slug", async () => {
  const res = await handler(
    form({ nombre: "Kirino Test", grupo: "familia-kosaka" }),
  );
  assertEquals(res.headers.get("location"), "/personajes/kirino-test");
});

Deno.test("POST válido guarda el alta", async () => {
  const res = await handler(form({ nombre: "Moe Test", grupo: "club-meruru" }));
  assertEquals(res.status, 303);
  assertEquals(existeAlta("moe-test"), true);
  assertEquals(
    listarAltas().some((a) => a.nombre === "Moe Test"),
    true,
  );
});

Deno.test("después del POST, un GET a la ficha la encuentra", async () => {
  await handler(form({ nombre: "Sora Test", grupo: "hermanas-gokou" }));
  const res = await get("/personajes/sora-test");
  assertEquals(res.status, 200);
  assertStringIncludes(await res.text(), "Sora Test");
});

Deno.test("el PRG funciona: el GET de después NO crea otra alta", async () => {
  const antes = listarAltas().length;
  await handler(form({ nombre: "Rin Test", grupo: "familia-kurusu" }));
  const trasPost = listarAltas().length;
  // Esto es lo que pasa si en vez del 303 devuelves HTML: el F5 repite el POST.
  await get("/personajes/rin-test");
  await get("/");
  assertEquals(listarAltas().length, trasPost);
  assertEquals(trasPost, antes + 1);
});

Deno.test("el alta guardada conserva la descripción", async () => {
  await handler(
    form({
      nombre: "Nana Test",
      grupo: "familia-akagi",
      descripcion: "con poderes de telepatía",
    }),
  );
  const alta = listarAltas().find((a) => a.nombre === "Nana Test");
  assertEquals(alta?.descripcion, "con poderes de telepatía");
});

// ─────────────────────────────────────────────────────────────────────────────
// Extremo a extremo: POST con errores
// ─────────────────────────────────────────────────────────────────────────────

Deno.test("POST sin nombre responde 400", async () => {
  const res = await handler(form({ nombre: "", grupo: "familia-akagi" }));
  assertEquals(res.status, 400);
});

Deno.test("POST sin nombre NO guarda nada", async () => {
  const antes = listarAltas().length;
  await handler(form({ nombre: "", grupo: "familia-akagi" }));
  assertEquals(listarAltas().length, antes);
});

Deno.test("POST con errores devuelve el formulario otra vez", async () => {
  const res = await handler(form({ nombre: "", grupo: "familia-akagi" }));
  assertStringIncludes(await res.text(), "<form");
});

Deno.test("POST con errores CONSERVA lo que habías escrito", async () => {
  // El "sticky form": no obligues a reescribirlo todo por un error.
  const res = await handler(
    form({ nombre: "", grupo: "familia-akagi", descripcion: "no la pierdo" }),
  );
  assertEquals(res.status, 400);
  assertStringIncludes(await res.text(), "no la pierdo");
});

Deno.test("POST sin grupo responde 400", async () => {
  const res = await handler(form({ nombre: "Sin Grupo", grupo: "" }));
  assertEquals(res.status, 400);
});

Deno.test("POST con grupo inventado responde 400", async () => {
  const res = await handler(form({ nombre: "Grupo Raro", grupo: "banana" }));
  assertEquals(res.status, 400);
  assertEquals(existeAlta("grupo-raro"), false);
});

Deno.test("POST con solo símbolos da 400, no 500", async () => {
  // El slug acaba siendo "" y eso es un error de validación, no un crash.
  const res = await handler(form({ nombre: "!!!", grupo: "familia-akagi" }));
  assertEquals(res.status, 400);
});

Deno.test("POST con descripción de 201 caracteres da 400", async () => {
  const res = await handler(
    form({
      nombre: "Larga Test",
      grupo: "familia-akagi",
      descripcion: "a".repeat(201),
    }),
  );
  assertEquals(res.status, 400);
});

Deno.test("POST con descripción de 200 caracteres SÍ vale", async () => {
  const res = await handler(
    form({
      nombre: "Justa Test",
      grupo: "familia-akagi",
      descripcion: "a".repeat(200),
    }),
  );
  assertEquals(res.status, 303);
});

Deno.test("nombre duplicado responde 409, no 303", async () => {
  const datos = { nombre: "Repetida Test", grupo: "familia-akagi" };
  const primera = await handler(form(datos));
  assertEquals(primera.status, 303);

  const segunda = await handler(form(datos));
  assertEquals(segunda.status, 409);
  assertEquals(
    listarAltas().filter((a) => a.nombre === "Repetida Test").length,
    1,
  );
});

// ─────────────────────────────────────────────────────────────────────────────
// XSS extremo a extremo
// ─────────────────────────────────────────────────────────────────────────────

Deno.test("un <script> en el nombre NO sale sin escapar tras un 400", async () => {
  const res = await handler(
    form({ nombre: "<script>alert(1)</script>", grupo: "" }),
  );
  const html = await res.text();
  assertEquals(html.includes("<script>alert(1)</script>"), false);
});

Deno.test("un <script> en el nombre tampoco se cuela al guardado", async () => {
  // Con grupo válido, el alta se guarda: el nombre se pinta en el listado y en
  // la ficha, y ahí también tiene que estar escapado.
  const nombre = "<img src=x onerror=alert(1)> Test";
  const res = await handler(form({ nombre, grupo: "familia-akagi" }));
  assertEquals(res.status, 303);

  const ficha = await get(`/personajes/${slug(nombre)}`);
  const html = await ficha.text();
  assertEquals(html.includes("<img src=x"), false);
  assertStringIncludes(html, "&lt;img");
});

Deno.test("el listado escapa todos los nombres", async () => {
  await handler(form({ nombre: "<b>x</b> Kokoro", grupo: "club-videojuegos" }));
  const html = await (await get("/")).text();
  assertEquals(html.includes("<b>x</b>"), false);
});

Deno.test("la ficha de un alta con HTML en la descripción escapa", async () => {
  await handler(
    form({
      nombre: "Kurara Html",
      grupo: "club-meruru",
      descripcion: "<script>alert(1)</script>",
    }),
  );
  const html = await (await get("/personajes/kurara-html")).text();
  assertEquals(html.includes("<script>alert(1)</script>"), false);
  assertStringIncludes(html, "&lt;script&gt;");
});

// ─────────────────────────────────────────────────────────────────────────────
// 404
// ─────────────────────────────────────────────────────────────────────────────

Deno.test("GET a un alta inexistente da 404", async () => {
  assertEquals((await get("/personajes/no-existe")).status, 404);
});

Deno.test("GET a una ruta desconocida da 404", async () => {
  assertEquals((await get("/lo-que-sea")).status, 404);
});

Deno.test("el 404 de la ficha es HTML, no texto plano", async () => {
  const res = await get("/personajes/no-existe");
  assertStringIncludes(res.headers.get("content-type") ?? "", "text/html");
});

// ─────────────────────────────────────────────────────────────────────────────
// escapeHtml (utilidad ya resuelta)
//
// Viene del bloque 01, donde la escribió el alumno. Se comprueba aquí para que
// no se pueda "optimizar" y romper el escapado sin que nada se entere.
// ─────────────────────────────────────────────────────────────────────────────

Deno.test("escapeHtml escapa los cinco caracteres", () => {
  assertEquals(escapeHtml(`&<>"'`), "&amp;&lt;&gt;&quot;&#39;");
});

Deno.test("escapeHtml escapa el & antes que nada", () => {
  // Si se escapara el & después, "&lt;" se convertiría en "&amp;lt;".
  assertEquals(escapeHtml("<"), "&lt;");
  assertEquals(escapeHtml("&lt;"), "&amp;lt;");
});

Deno.test("escapeHtml no toca el texto normal", () => {
  assertEquals(escapeHtml("Sena Akagi"), "Sena Akagi");
});
