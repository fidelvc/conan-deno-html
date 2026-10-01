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
 *     completo (validate → guardar → 303 → GET).
 *
 * COSA IMPORTANTE SOBRE ESTE FICHERO
 * ----------------------------------
 * `drafts` es un array en memoria, COMPARTIDO entre todos los tests del
 * fichero. Si un test crea un alta, los siguientes la ven. Por eso casi todos
 * usan nombres distintos y únicos, y por eso hay un test que mira el 409.
 * No los reordenes sin pensar, o empiezan a fallar en sitios raros.
 */

import { assertEquals, assertMatch, assertStringIncludes } from "@std/assert";
import {
  createRedirect,
  EMPTY_DRAFT,
  errorList,
  escapeHtml,
  GROUPS,
  LIMITS,
  NO_ERRORS,
  readFields,
  renderDraftForm,
  slug,
  validate,
} from "./formulario.ts";
import { draftExists, handler, listDrafts } from "./server.ts";
import type { Draft, Errors } from "./formulario.ts";

const BASE = "http://localhost:8000";
const VALID_NAME = "Sena Akagi";

function get(path: string): Promise<Response> {
  return Promise.resolve(handler(new Request(`${BASE}${path}`)));
}

function form(fields: Record<string, string>): Request {
  // Esto es EXACTAMENTE lo que manda un `<form method="post">` real cuando no
  // tiene `enctype="multipart/form-data"`: el cuerpo es
  // `application/x-www-form-urlencoded`, o sea pares clave=valor con el texto
  // escapado.
  //
  // Ojo con dos atajos que NO existen y que todo el mundo se inventa:
  //   - `new Request(url, { method: "POST", formData: fields })`. No existe esa
  //     opción en `RequestInit`. No da error al construir (TypeScript se queja,
  //     el runtime se lo come), pero deja el cuerpo vacío y sin content-type.
  //   - `new Request(url, { method: "POST", body: fields })`. Un objeto plano no
  //     se puede convertir a texto, así que tampoco vale.
  return new Request(`${BASE}/nuevo`, {
    method: "POST",
    body: new URLSearchParams(fields),
    headers: { "content-type": "application/x-www-form-urlencoded" },
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// TIPOS Y CONSTANTES
// ─────────────────────────────────────────────────────────────────────────────

Deno.test("EMPTY_DRAFT son tres strings vacíos", () => {
  assertEquals(EMPTY_DRAFT, { name: "", group: "", description: "" });
});

Deno.test("NO_ERRORS es un objeto vacío", () => {
  assertEquals(NO_ERRORS, {});
  assertEquals(Object.keys(NO_ERRORS).length, 0);
});

Deno.test("LIMITS cuadra con lo que se pide", () => {
  assertEquals(LIMITS.name.min, 2);
  assertEquals(LIMITS.name.max, 40);
  assertEquals(LIMITS.description.max, 200);
});

// ─────────────────────────────────────────────────────────────────────────────
// readFields
// ─────────────────────────────────────────────────────────────────────────────

Deno.test("readFields saca los tres campos", () => {
  const data = new FormData();
  data.set("name", "Sena");
  data.set("group", "familia-akagi");
  data.set("description", "la hermana lista");

  assertEquals(readFields(data), {
    name: "Sena",
    group: "familia-akagi",
    description: "la hermana lista",
  });
});

Deno.test("readFields devuelve los TRES campos aunque falten", () => {
  const draft = readFields(new FormData());
  assertEquals(draft.name, "");
  assertEquals(draft.group, "");
  assertEquals(draft.description, "");
});

Deno.test("readFields aplica trim", () => {
  const data = new FormData();
  data.set("name", "  Sena Akagi  \n");
  assertEquals(readFields(data).name, "Sena Akagi");
});

Deno.test("readFields NO devuelve undefined (el tipo lo engaña)", () => {
  // `FormData.get()` devuelve `string | File | null`. Los tres casos raros:
  const data = new FormData();
  data.set("name", new File(["x"], "nuevo.txt"));

  const draft = readFields(data);
  assertEquals(typeof draft.name, "string");
  assertEquals(typeof draft.group, "string");
  assertEquals(typeof draft.description, "string");
});

Deno.test("readFields con un File en el campo no lo pone como name", () => {
  const data = new FormData();
  data.set("name", new File(["contenido"], "secreto.txt"));
  // No puede ser el contenido del fichero, y tampoco `[object File]`.
  const draft = readFields(data);
  assertEquals(draft.name.includes("contenido"), false);
  assertEquals(draft.name, "");
});

Deno.test("readFields ignora campos que no son del formulario", () => {
  const data = new FormData();
  data.set("name", "Sena");
  data.set("admin", "true");
  data.set("_csrf", "falso");
  assertEquals(Object.keys(readFields(data)).sort(), [
    "description",
    "group",
    "name",
  ]);
});

// ─────────────────────────────────────────────────────────────────────────────
// validate
// ─────────────────────────────────────────────────────────────────────────────

function validDraft(overrides: Partial<Draft> = {}): Draft {
  const base: Draft = {
    name: VALID_NAME,
    group: "familia-akagi",
    description: "",
  };
  return { ...base, ...overrides };
}

Deno.test("validate acepta un alta correcta", () => {
  assertEquals(validate(validDraft()), {});
});

Deno.test("validate rechaza el name vacío", () => {
  const errors = validate(validDraft({ name: "" }));
  assertEquals(typeof errors.name, "string");
});

Deno.test("validate rechaza un name de 1 carácter", () => {
  assertEquals(typeof validate(validDraft({ name: "S" })).name, "string");
});

Deno.test("validate acepta un name de 2 caracteres", () => {
  assertEquals(validate(validDraft({ name: "Se" })).name, undefined);
});

Deno.test("validate rechaza un name de 41 caracteres", () => {
  assertEquals(
    typeof validate(validDraft({ name: "a".repeat(41) })).name,
    "string",
  );
});

Deno.test("validate acepta un name de 40 caracteres", () => {
  assertEquals(
    validate(validDraft({ name: "a".repeat(40) })).name,
    undefined,
  );
});

Deno.test("validate rechaza el group vacío", () => {
  assertEquals(typeof validate(validDraft({ group: "" })).group, "string");
});

Deno.test("validate rechaza un group inventado", () => {
  // El <select> se puede manipular. Esto no es un <select>, es un POST cualquiera.
  assertEquals(
    typeof validate(validDraft({ group: "group-inventado" })).group,
    "string",
  );
});

Deno.test("validate acepta CUALQUIER group de GROUPS", () => {
  for (const id of Object.keys(GROUPS)) {
    assertEquals(
      validate(validDraft({ group: id })).group,
      undefined,
      `el group ${id} debería valer`,
    );
  }
});

Deno.test("validate acepta la descripción vacía (es opcional)", () => {
  assertEquals(
    validate(validDraft({ description: "" })).description,
    undefined,
  );
});

Deno.test("validate rechaza una descripción de 201 caracteres", () => {
  assertEquals(
    typeof validate(validDraft({ description: "a".repeat(201) })).description,
    "string",
  );
});

Deno.test("validate devuelve TODOS los errors a la vez", () => {
  const errors = validate({
    name: "",
    group: "banana",
    description: "a".repeat(500),
  });
  assertEquals(Object.keys(errors).sort(), ["description", "group", "name"]);
});

Deno.test("los mensajes de error son texto útil, no 'error'", () => {
  const errors = validate(validDraft({ name: "" }));
  const message = errors.name ?? "";
  assertEquals(message.length > 10, true);
  assertEquals(message.toLowerCase().includes("error"), false);
  assertMatch(message, /name/i);
});

Deno.test("validate es puro: no toca lo que recibe", () => {
  const entrada = validDraft();
  validate(entrada);
  assertEquals(entrada, validDraft());
});

Deno.test("errorList saca los mensajes en orden", () => {
  const errors: Errors = {
    name: "Pon un name",
    group: "Elige group",
  };
  assertEquals(errorList(errors), ["Pon un name", "Elige group"]);
});

Deno.test("errorList de NO_ERRORS es []", () => {
  assertEquals(errorList(NO_ERRORS), []);
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

Deno.test("slug de un name vacío es ''", () => {
  assertEquals(slug(""), "");
  assertEquals(slug("   "), "");
});

Deno.test("slug nunca deja guiones dobles", () => {
  for (const name of ["a  b", "a--b", "a .- b", "a//b"]) {
    assertEquals(slug(name).includes("--"), false, name);
  }
});

Deno.test("slug no puede usarse para salir de la ruta", () => {
  // Aunque le pases "../../etc/passwd" a mano, no puede hacer daño.
  const resultado = slug("../../etc/passwd");
  assertEquals(resultado.includes("/"), false);
  assertEquals(resultado.startsWith("."), false);
});

// ─────────────────────────────────────────────────────────────────────────────
// renderDraftForm
// ─────────────────────────────────────────────────────────────────────────────

Deno.test("renderDraftForm pinta un formulario con method=post", () => {
  const html = renderDraftForm(EMPTY_DRAFT, NO_ERRORS, "new");
  assertStringIncludes(html, "<form");
  assertStringIncludes(html, 'method="post"');
  assertStringIncludes(html, 'action="/nuevo"');
});

Deno.test("renderDraftForm tiene un input por cada campo", () => {
  const html = renderDraftForm(EMPTY_DRAFT, NO_ERRORS, "new");
  for (const name of ["name", "group", "description"]) {
    assertStringIncludes(html, `name="${name}"`);
  }
});

Deno.test("renderDraftForm con values previos los deja en el value", () => {
  const html = renderDraftForm(
    { name: "Sena", group: "familia-akagi", description: "la hermana" },
    NO_ERRORS,
    "new",
  );
  assertStringIncludes(html, 'value="Sena"');
  assertStringIncludes(html, "la hermana");
});

Deno.test("renderDraftForm pinta una option por cada group", () => {
  const html = renderDraftForm(EMPTY_DRAFT, NO_ERRORS, "new");
  for (const id of Object.keys(GROUPS)) {
    assertStringIncludes(html, `value="${id}"`);
  }
});

Deno.test("renderDraftForm marca el group elegido con selected", () => {
  const html = renderDraftForm(
    { name: "", group: "familia-akagi", description: "" },
    NO_ERRORS,
    "new",
  );
  assertMatch(html, /<option value="familia-akagi"[^>]*selected/);
});

Deno.test("renderDraftForm sin group elegido NO preselecciona un group", () => {
  // Puede (o no) marcar el <option value=""> de "Elige uno": las dos son HTML
  // válido. Lo que no puede hacer es marcar un group que el usuario no eligió.
  const html = renderDraftForm(EMPTY_DRAFT, NO_ERRORS, "new");
  for (const id of Object.keys(GROUPS)) {
    assertEquals(
      new RegExp(`<option value="${id}"[^>]*selected`).test(html),
      false,
      `preseleccionó el group ${id}`,
    );
  }
});

Deno.test("renderDraftForm ESCAPA el name con HTML dentro", () => {
  // La parte importante del bloque. Un `name` con `<script>` tiene que
  // aparecer escapado, no ejecutarse.
  const html = renderDraftForm(
    {
      name: "<script>alert(1)</script>",
      group: "familia-akagi",
      description: "",
    },
    NO_ERRORS,
    "new",
  );
  assertEquals(html.includes("<script>"), false);
  assertStringIncludes(html, "&lt;script&gt;");
});

Deno.test("renderDraftForm ESCAPA la descripción con HTML dentro", () => {
  const html = renderDraftForm(
    {
      name: "Sena",
      group: "familia-akagi",
      description: "<img src=x onerror=alert(1)>",
    },
    NO_ERRORS,
    "new",
  );
  assertEquals(html.includes("<img"), false);
  assertStringIncludes(html, "&lt;img");
});

Deno.test("renderDraftForm ESCAPA las comillas para no romper el atributo", () => {
  const html = renderDraftForm(
    { name: '" onfocus="alert(1)', group: "familia-akagi", description: "" },
    NO_ERRORS,
    "new",
  );
  assertEquals(html.includes('" onfocus="'), false);
  assertStringIncludes(html, "&quot;");
});

Deno.test("renderDraftForm muestra los mensajes de error", () => {
  const html = renderDraftForm(EMPTY_DRAFT, { name: "Pon un name" }, "error");
  assertStringIncludes(html, "Pon un name");
});

Deno.test("renderDraftForm sin errors NO inventa un aviso de error", () => {
  const html = renderDraftForm(EMPTY_DRAFT, NO_ERRORS, "new");
  assertEquals(html.includes('class="error"'), false);
});

Deno.test("renderDraftForm en status error SÍ trae el aviso", () => {
  assertStringIncludes(
    renderDraftForm(EMPTY_DRAFT, { group: "Elige un group" }, "error"),
    "Elige un group",
  );
});

Deno.test("renderDraftForm escapó un group manipulado en el value", () => {
  const html = renderDraftForm(
    { name: "Sena", group: '"><script>alert(1)</script>', description: "" },
    NO_ERRORS,
    "new",
  );
  assertEquals(html.includes("<script"), false);
});

// ─────────────────────────────────────────────────────────────────────────────
// createRedirect
// ─────────────────────────────────────────────────────────────────────────────

Deno.test("createRedirect devuelve 303", () => {
  assertEquals(createRedirect("/personajes/sena-akagi").status, 303);
});

Deno.test("createRedirect pone la cabecera Location", () => {
  assertEquals(
    createRedirect("/personajes/sena-akagi").headers.get("location"),
    "/personajes/sena-akagi",
  );
});

Deno.test("createRedirect NO tiene cuerpo", () => {
  assertEquals(createRedirect("/personajes/sena-akagi").body, null);
});

Deno.test("createRedirect no es 302 (el 303 es el que cambia POST por GET)", () => {
  const status = createRedirect("/x").status;
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

Deno.test("GET /nuevo NO crea ningún alta", async () => {
  const antes = listDrafts().length;
  await get("/nuevo");
  assertEquals(listDrafts().length, antes);
});

Deno.test("GET / responde 200 y dice que no hay drafts al principio", async () => {
  const res = await get("/");
  assertEquals(res.status, 200);
  assertStringIncludes(await res.text(), "Oreimo");
});

// ─────────────────────────────────────────────────────────────────────────────
// Extremo a extremo: POST válido
// ─────────────────────────────────────────────────────────────────────────────

Deno.test("POST válido responde 303 y NO devuelve HTML", async () => {
  const res = await handler(
    form({ name: "Kurara Test", group: "club-meruru" }),
  );
  assertEquals(res.status, 303);
  const cuerpo = await res.text();
  assertEquals(cuerpo.includes("<form"), false);
});

Deno.test("POST válido manda a la ficha del slug", async () => {
  const res = await handler(
    form({ name: "Kirino Test", group: "familia-kosaka" }),
  );
  assertEquals(res.headers.get("location"), "/personajes/kirino-test");
});

Deno.test("POST válido guarda el alta", async () => {
  const res = await handler(form({ name: "Moe Test", group: "club-meruru" }));
  assertEquals(res.status, 303);
  assertEquals(draftExists("moe-test"), true);
  assertEquals(
    listDrafts().some((a) => a.name === "Moe Test"),
    true,
  );
});

Deno.test("después del POST, un GET a la ficha la encuentra", async () => {
  await handler(form({ name: "Sora Test", group: "hermanas-gokou" }));
  const res = await get("/personajes/sora-test");
  assertEquals(res.status, 200);
  assertStringIncludes(await res.text(), "Sora Test");
});

Deno.test("el PRG funciona: el GET de después NO crea otra alta", async () => {
  const antes = listDrafts().length;
  await handler(form({ name: "Rin Test", group: "familia-kurusu" }));
  const trasPost = listDrafts().length;
  // Esto es lo que pasa si en vez del 303 devuelves HTML: el F5 repite el POST.
  await get("/personajes/rin-test");
  await get("/");
  assertEquals(listDrafts().length, trasPost);
  assertEquals(trasPost, antes + 1);
});

Deno.test("el alta guardada conserva la descripción", async () => {
  await handler(
    form({
      name: "Nana Test",
      group: "familia-akagi",
      description: "con poderes de telepatía",
    }),
  );
  const draft = listDrafts().find((a) => a.name === "Nana Test");
  assertEquals(draft?.description, "con poderes de telepatía");
});

// ─────────────────────────────────────────────────────────────────────────────
// Extremo a extremo: POST con errors
// ─────────────────────────────────────────────────────────────────────────────

Deno.test("POST sin name responde 400", async () => {
  const res = await handler(form({ name: "", group: "familia-akagi" }));
  assertEquals(res.status, 400);
});

Deno.test("POST sin name NO guarda nada", async () => {
  const antes = listDrafts().length;
  await handler(form({ name: "", group: "familia-akagi" }));
  assertEquals(listDrafts().length, antes);
});

Deno.test("POST con errors devuelve el formulario otra vez", async () => {
  const res = await handler(form({ name: "", group: "familia-akagi" }));
  assertStringIncludes(await res.text(), "<form");
});

Deno.test("POST con errors CONSERVA lo que habías escrito", async () => {
  // El "sticky form": no obligues a reescribirlo todo por un error.
  const res = await handler(
    form({ name: "", group: "familia-akagi", description: "no la pierdo" }),
  );
  assertEquals(res.status, 400);
  assertStringIncludes(await res.text(), "no la pierdo");
});

Deno.test("POST sin group responde 400", async () => {
  const res = await handler(form({ name: "Sin Grupo", group: "" }));
  assertEquals(res.status, 400);
});

Deno.test("POST con group inventado responde 400", async () => {
  const res = await handler(form({ name: "Grupo Raro", group: "banana" }));
  assertEquals(res.status, 400);
  assertEquals(draftExists("group-raro"), false);
});

Deno.test("POST con solo símbolos da 400, no 500", async () => {
  // El slug acaba siendo "" y eso es un error de validación, no un crash.
  const res = await handler(form({ name: "!!!", group: "familia-akagi" }));
  assertEquals(res.status, 400);
});

Deno.test("POST con descripción de 201 caracteres da 400", async () => {
  const res = await handler(
    form({
      name: "Larga Test",
      group: "familia-akagi",
      description: "a".repeat(201),
    }),
  );
  assertEquals(res.status, 400);
});

Deno.test("POST con descripción de 200 caracteres SÍ vale", async () => {
  const res = await handler(
    form({
      name: "Justa Test",
      group: "familia-akagi",
      description: "a".repeat(200),
    }),
  );
  assertEquals(res.status, 303);
});

Deno.test("name duplicado responde 409, no 303", async () => {
  const fields = { name: "Repetida Test", group: "familia-akagi" };
  const primera = await handler(form(fields));
  assertEquals(primera.status, 303);

  const segunda = await handler(form(fields));
  assertEquals(segunda.status, 409);
  assertEquals(
    listDrafts().filter((a) => a.name === "Repetida Test").length,
    1,
  );
});

// ─────────────────────────────────────────────────────────────────────────────
// XSS extremo a extremo
// ─────────────────────────────────────────────────────────────────────────────

Deno.test("un <script> en el nombre NO sale sin escapar tras un 400", async () => {
  const res = await handler(
    form({ name: "<script>alert(1)</script>", group: "" }),
  );
  const html = await res.text();
  assertEquals(html.includes("<script>alert(1)</script>"), false);
});

Deno.test("un <script> en el nombre tampoco se cuela al guardado", async () => {
  // Con group válido, el alta se guarda: el name se pinta en el listado y en
  // la ficha, y ahí también tiene que estar escapado.
  const name = "<img src=x onerror=alert(1)> Test";
  const res = await handler(form({ name, group: "familia-akagi" }));
  assertEquals(res.status, 303);

  const ficha = await get(`/personajes/${slug(name)}`);
  const html = await ficha.text();
  assertEquals(html.includes("<img src=x"), false);
  assertStringIncludes(html, "&lt;img");
});

Deno.test("el listado escapa todos los nombres", async () => {
  await handler(form({ name: "<b>x</b> Kokoro", group: "club-videojuegos" }));
  const html = await (await get("/")).text();
  assertEquals(html.includes("<b>x</b>"), false);
});

Deno.test("la ficha de un alta con HTML en la descripción escapa", async () => {
  await handler(
    form({
      name: "Kurara Html",
      group: "club-meruru",
      description: "<script>alert(1)</script>",
    }),
  );
  const html = await (await get("/personajes/kurara-html")).text();
  assertEquals(html.includes("<script>alert(1)</script>"), false);
  assertStringIncludes(html, "&lt;script&gt;");
});

// ─────────────────────────────────────────────────────────────────────────────
// 404
// ─────────────────────────────────────────────────────────────────────────────

Deno.test("GET a una alta inexistente da 404", async () => {
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
