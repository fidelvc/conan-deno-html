/**
 * Tests del bloque 04.
 *
 *   deno task test
 *   deno test ejercicios/04-datos/          (fíjate: sin --allow-read, aquí
 *                                             no se lee nada del disco)
 *
 * Estos son los tests más densos de la serie, y a propósito: en este bloque
 * los tests son el enunciado. Cada nombre dice exactamente qué se espera.
 *
 * Antes de mirar un test que falla, lee el comentario de la función
 * correspondiente en `queries.ts`: ahí está la pista.
 */

import {
  assertEquals,
  assertNotStrictEquals,
  assertStrictEquals,
} from "@std/assert";
import {
  agruparPorGrupo,
  buscar,
  contarPorGrupo,
  contarPorUniverso,
  DATOS,
  edadMedia,
  ordenarPorEdad,
  porGrupo,
  relacionadosCon,
  SIN_EDAD,
} from "./queries.ts";
import { CHARACTERS, GROUPS } from "../../datos/personajes.ts";
import type { Character } from "../../datos/personajes.ts";

function idsOf(characters: Character[]): string[] {
  return characters.map((character) => character.id);
}

function byId(id: string): Character {
  return CHARACTERS.find((character) => character.id === id)!;
}

// ─────────────────────────────────────────────────────────────────────────────
// Contexto: lo que vas a necesitar saber del dataset
// ─────────────────────────────────────────────────────────────────────────────

Deno.test("el dataset tiene 17 personajes", () => {
  assertEquals(CHARACTERS.length, 17);
});

Deno.test("SOLO hay 2 edades confirmadas en todo el dataset", () => {
  // Esto es lo que hace que `ordenarPorEdad` y `edadMedia` tengan borde.
  const conEdad = CHARACTERS.filter((character) => character.age !== undefined);
  assertEquals(idsOf(conEdad), ["kyousuke", "kirino"]);
});

Deno.test("las relaciones NO son simétricas (Ruri declara a Kyousuke, Kyousuke no)", () => {
  // Un test que fija un defecto del dataset, para que nadie lo "arregle"
  // sin querer pensando que es un error.
  assertEquals(
    byId("ruri").relationships.some((r) => r.to === "kyousuke"),
    true,
  );
  assertEquals(
    byId("kyousuke").relationships.some((r) => r.to === "ruri"),
    false,
  );
});

// ─────────────────────────────────────────────────────────────────────────────
// porGrupo
// ─────────────────────────────────────────────────────────────────────────────

Deno.test("porGrupo devuelve solo los del grupo", () => {
  const kosaka = porGrupo(CHARACTERS, "familia-kosaka");
  for (const character of kosaka) {
    assertEquals(character.group, "familia-kosaka");
  }
  assertEquals(idsOf(kosaka).includes("yoshino"), true);
  assertEquals(idsOf(kosaka).includes("kanako"), false);
  assertEquals(idsOf(kosaka).length, 5);
});

Deno.test("porGrupo con un grupo pequeño devuelve solo esos", () => {
  // El club de Meruru solo tiene a Meruru y Kurara Hoshino:
  assertEquals(idsOf(porGrupo(CHARACTERS, "club-meruru")), [
    "meruru",
    "kurara-hoshino",
  ]);
  // Un id que no existe en GROUPS tampoco revienta: devuelve [].
  assertEquals(porGrupo(CHARACTERS, "no-existe" as never), []);
});

Deno.test("porGrupo respeta el orden del array original", () => {
  const gokou = idsOf(porGrupo(CHARACTERS, "hermanas-gokou"));
  const enDataset = idsOf(CHARACTERS).filter((id) => gokou.includes(id));
  assertEquals(gokou, enDataset);
});

Deno.test("porGrupo con array vacío devuelve []", () => {
  assertEquals(porGrupo([], "familia-kosaka"), []);
});

// ─────────────────────────────────────────────────────────────────────────────
// buscar
// ─────────────────────────────────────────────────────────────────────────────

Deno.test("buscar encuentra por nombre", () => {
  assertEquals(idsOf(buscar(CHARACTERS, "kirino")).includes("kirino"), true);
});

Deno.test("buscar encuentra por alias", () => {
  assertEquals(idsOf(buscar(CHARACTERS, "kuroneko")), ["ruri"]);
});

Deno.test("buscar encuentra por etiqueta", () => {
  const resultado = idsOf(buscar(CHARACTERS, "idol"));
  assertEquals(resultado.includes("kanako"), true);
  assertEquals(resultado.includes("kanata"), true);
});

Deno.test("buscar normaliza mayúsculas y espacios", () => {
  assertEquals(
    idsOf(buscar(CHARACTERS, "  Kirino  ")),
    idsOf(buscar(CHARACTERS, "kirino")),
  );
});

Deno.test("buscar con texto vacío devuelve todo", () => {
  assertEquals(buscar(CHARACTERS, ""), CHARACTERS);
  assertEquals(buscar(CHARACTERS, "   ").length, CHARACTERS.length);
});

Deno.test("buscar sin coincidencias devuelve []", () => {
  assertEquals(buscar(CHARACTERS, "zzzzz"), []);
});

Deno.test("buscar no muta el array original", () => {
  const antes = idsOf(CHARACTERS);
  buscar(CHARACTERS, "kirino");
  assertEquals(idsOf(CHARACTERS), antes);
});

// ─────────────────────────────────────────────────────────────────────────────
// ordenarPorEdad
// ─────────────────────────────────────────────────────────────────────────────

Deno.test("ordenarPorEdad asc pone a la más joven primero", () => {
  // Solo hay dos con edad: Kirino (14) y Kyousuke (17).
  const ordenados = ordenarPorEdad(CHARACTERS, "asc");
  const conEdad = ordenados.filter((c) => c.age !== undefined);
  assertEquals(idsOf(conEdad), ["kirino", "kyousuke"]);
});

Deno.test("ordenarPorEdad desc pone a la más mayor primero", () => {
  const ordenados = ordenarPorEdad(CHARACTERS, "desc");
  const conEdad = ordenados.filter((c) => c.age !== undefined);
  assertEquals(idsOf(conEdad), ["kyousuke", "kirino"]);
});

Deno.test("ordenarPorEdad deja a los SIN EDAD al final, en los dos órdenes", () => {
  for (const orden of ["asc", "desc"] as const) {
    const ordenados = ordenarPorEdad(CHARACTERS, orden);
    const conEdad = ordenados.filter((c) => c.age !== undefined);

    assertEquals(
      conEdad.length,
      ordenados.length - (CHARACTERS.length - conEdad.length),
      `en ${orden} no se han filtrado bien`,
    );
    // Los desconocidos son la última posición y las que quedan.
    for (const character of ordenados.slice(conEdad.length)) {
      assertEquals(character.age, undefined, `${character.id} tiene edad`);
    }
  }
});

Deno.test("ordenarPorEdad por defecto es asc", () => {
  assertEquals(
    idsOf(ordenarPorEdad(CHARACTERS)),
    idsOf(ordenarPorEdad(CHARACTERS, "asc")),
  );
});

Deno.test("ordenarPorEdad NO muta el array original (¡OJO con sort!)", () => {
  // Esta es la trampa del ejercicio. Si haces `characters.sort(...)` en vez de
  // `[...characters].sort(...)`, este test falla y el dataset queda corrupto
  // para todos los tests siguientes.
  const antes = idsOf(CHARACTERS);
  ordenarPorEdad(CHARACTERS, "asc");
  assertEquals(idsOf(CHARACTERS), antes);
});

Deno.test("ordenarPorEdad devuelve un array NUEVO", () => {
  const resultado = ordenarPorEdad(CHARACTERS, "asc");
  assertNotStrictEquals(resultado, CHARACTERS);
});

Deno.test("ordenarPorEdad con array vacío no rompe nada", () => {
  assertEquals(ordenarPorEdad([], "asc"), []);
});

Deno.test("SIN_EDAD vale Infinity", () => {
  assertEquals(SIN_EDAD, Number.POSITIVE_INFINITY);
});

// ─────────────────────────────────────────────────────────────────────────────
// contarPorGrupo
// ─────────────────────────────────────────────────────────────────────────────

Deno.test("contarPorGrupo tiene una clave por cada grupo", () => {
  const conteo = contarPorGrupo(CHARACTERS);
  assertEquals(Object.keys(conteo).length, Object.keys(GROUPS).length);
  assertEquals(Object.keys(conteo).sort(), Object.keys(GROUPS).sort());
});

Deno.test("contarPorGrupo cuenta bien", () => {
  const conteo = contarPorGrupo(CHARACTERS);
  assertEquals(conteo["familia-kosaka"], 5);
  assertEquals(conteo["hermanas-gokou"], 3);
  assertEquals(conteo["familia-tamura"], 1);
});

Deno.test("contarPorGrupo suma el total de personajes", () => {
  const conteo = contarPorGrupo(CHARACTERS);
  const total = Object.values(conteo).reduce((suma, n) => suma + n, 0);
  assertEquals(total, CHARACTERS.length);
});

Deno.test("contarPorGrupo no se salta ningún grupo", () => {
  // Si te olvidas de inicializar los grupos a 0, aquí sale `undefined`.
  for (const [id, total] of Object.entries(contarPorGrupo(CHARACTERS))) {
    assertEquals(typeof total, "number", `el grupo ${id} no es un número`);
  }
});

Deno.test("contarPorGrupo con array vacío pone todos a 0", () => {
  const conteo = contarPorGrupo([]);
  for (const [id, total] of Object.entries(conteo)) {
    assertEquals(total, 0, `el grupo ${id} debería estar a 0`);
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// agruparPorGrupo
// ─────────────────────────────────────────────────────────────────────────────

Deno.test("agruparPorGrupo tiene una clave por cada grupo", () => {
  const grupos = agruparPorGrupo(CHARACTERS);
  assertEquals(Object.keys(grupos).length, Object.keys(GROUPS).length);
});

Deno.test("agruparPorGrupo mete a cada personaje en su grupo", () => {
  const grupos = agruparPorGrupo(CHARACTERS);
  for (const [id, personajes] of Object.entries(grupos)) {
    for (const character of personajes) {
      assertEquals(character.group, id, `${character.id} está en el grupo mal`);
    }
  }
});

Deno.test("agruparPorGrupo mantiene todos los personajes", () => {
  const grupos = agruparPorGrupo(CHARACTERS);
  const total = Object.values(grupos).reduce(
    (suma, lista) => suma + lista.length,
    0,
  );
  assertEquals(total, CHARACTERS.length);
});

Deno.test("agruparPorGrupo y contarPorGrupo cuentan lo mismo", () => {
  const grupos = agruparPorGrupo(CHARACTERS);
  const conteo = contarPorGrupo(CHARACTERS);
  for (const [id, lista] of Object.entries(grupos)) {
    assertEquals(lista.length, conteo[id as keyof typeof conteo]);
  }
});

Deno.test("agruparPorGrupo no muta el array original", () => {
  const antes = idsOf(CHARACTERS);
  agruparPorGrupo(CHARACTERS);
  assertEquals(idsOf(CHARACTERS), antes);
});

// ─────────────────────────────────────────────────────────────────────────────
// relacionadosCon
// ─────────────────────────────────────────────────────────────────────────────

Deno.test("relacionadosCon devuelve a quien declara", () => {
  const relacionados = relacionadosCon(CHARACTERS, "kirino");
  assertEquals(relacionados.includes(byId("kyousuke")), true);
  assertEquals(relacionados.length, byId("kirino").relationships.length);
});

Deno.test("relacionadosCon es UNIDIRECCIONAL (dataset asimétrico)", () => {
  // Ruri declara a Kyousuke, Kyousuke no declara a Ruri.
  assertEquals(
    relacionadosCon(CHARACTERS, "ruri").some((c) => c.id === "kyousuke"),
    true,
  );
  assertEquals(
    relacionadosCon(CHARACTERS, "kyousuke").some((c) => c.id === "ruri"),
    false,
  );
});

Deno.test("relacionadosCon no incluye al propio personaje", () => {
  for (const character of CHARACTERS) {
    const relacionados = relacionadosCon(CHARACTERS, character.id);
    assertEquals(
      relacionados.some((c) => c.id === character.id),
      false,
      `${character.id} se ha metido a sí mismo`,
    );
  }
});

Deno.test("relacionadosCon nunca deja un hole (undefined) en el array", () => {
  // La trampa clásica de `flatMap` mal usado: si la función interna devuelve
  // `undefined` en vez de un array vacío, te queda un `undefined` dentro de la
  // lista y el `assertEquals` explota más abajo, en un sitio que no explica
  // nada. Aquí se comprueba directamente.
  for (const character of CHARACTERS) {
    const relacionados = relacionadosCon(CHARACTERS, character.id);
    for (const relacionado of relacionados) {
      assertNotStrictEquals(
        relacionado,
        undefined,
        `hole tras ${character.id}`,
      );
    }
    assertEquals(relacionados.length, relacionados.filter(Boolean).length);
  }
});

Deno.test("relacionadosCon descarta ids que no existen en el dataset", () => {
  const roto: Character = {
    ...byId("kyousuke"),
    relationships: [
      { to: "kirino", type: "hermana menor" },
      { to: "fantasma-que-no-existe", type: "desconocido" },
    ],
  };
  const conRoto = [...CHARACTERS.filter((c) => c.id !== "kyousuke"), roto];

  const relacionados = relacionadosCon(conRoto, "kyousuke");
  assertEquals(idsOf(relacionados), ["kirino"]);
});

Deno.test("relacionadosCon no repite personajes", () => {
  const repetido: Character = {
    ...byId("kyousuke"),
    relationships: [
      { to: "kirino", type: "hermana menor" },
      { to: "kirino", type: "otra vez" },
    ],
  };
  const conRepeticion = [
    ...CHARACTERS.filter((c) => c.id !== "kyousuke"),
    repetido,
  ];

  assertEquals(idsOf(relacionadosCon(conRepeticion, "kyousuke")), ["kirino"]);
});

Deno.test("relacionadosCon con un id inexistente devuelve []", () => {
  assertEquals(relacionadosCon(CHARACTERS, "no-existe"), []);
});

Deno.test("relacionadosCon de alguien sin relaciones devuelve []", () => {
  const solo: Character = { ...byId("kirino"), relationships: [] };
  const conSolo = [...CHARACTERS.filter((c) => c.id !== "kirino"), solo];
  assertEquals(relacionadosCon(conSolo, "kirino"), []);
});

// ─────────────────────────────────────────────────────────────────────────────
// edadMedia
// ─────────────────────────────────────────────────────────────────────────────

Deno.test("edadMedia calcula la media de las edades conocidas", () => {
  // (17 + 14) / 2 = 15.5
  assertEquals(edadMedia(CHARACTERS), 15.5);
});

Deno.test("edadMedia NO redondea a entero", () => {
  assertEquals(edadMedia(CHARACTERS), 15.5);
});

Deno.test("edadMedia devuelve null si nadie tiene edad", () => {
  // El borde importante: 0 es un valor válido, null es "no hay datos".
  const sinEdades = CHARACTERS.map((c) => ({ ...c, age: undefined }));
  assertEquals(edadMedia(sinEdades), null);
});

Deno.test("edadMedia NO devuelve 0 cuando no hay datos", () => {
  const sinEdades = CHARACTERS.map((c) => ({ ...c, age: undefined }));
  assertNotStrictEquals(edadMedia(sinEdades), 0);
});

Deno.test("edadMedia con array vacío devuelve null", () => {
  assertEquals(edadMedia([]), null);
});

Deno.test("edadMedia funciona con un subconjunto", () => {
  const soloKirino = [byId("kirino")];
  assertEquals(edadMedia(soloKirino), 14);
});

Deno.test("edadMedia acepta el total por parámetro", () => {
  assertEquals(edadMedia(CHARACTERS, 2), 15.5);
});

// ─────────────────────────────────────────────────────────────────────────────
// Utilidades ya resueltas
// ─────────────────────────────────────────────────────────────────────────────

Deno.test("contarPorUniverso separa el mundo real del anime", () => {
  const conteo = contarPorUniverso(CHARACTERS);
  assertEquals(conteo.realidad, 15);
  assertEquals(conteo.meruru, 2);
  assertEquals(conteo.realidad + conteo.meruru, CHARACTERS.length);
});

// ─────────────────────────────────────────────────────────────────────────────
// DATOS
// ─────────────────────────────────────────────────────────────────────────────

Deno.test("DATOS es el MISMO array que CHARACTERS, no una copia", () => {
  // El atajo de `queries.ts` tiene que seguir apuntando al array del módulo de
  // datos. Si alguien lo sustituye por una copia reordenada, medio programa ve
  // los personajes en otro orden y no hay ningún error: solo resultados raros.
  assertStrictEquals(DATOS, CHARACTERS);
});

Deno.test("DATOS se puede usar igual que CHARACTERS", () => {
  assertEquals(DATOS.length, CHARACTERS.length);
});
