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
  averageAge,
  byGroup,
  countByGroup,
  countByUniverse,
  DATA,
  groupByGroup,
  NO_AGE,
  relatedTo,
  search,
  sortByAge,
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
  // Esto es lo que hace que `sortByAge` y `averageAge` tengan borde.
  const withAge = CHARACTERS.filter((character) => character.age !== undefined);
  assertEquals(idsOf(withAge), ["kyousuke", "kirino"]);
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
// byGroup
// ─────────────────────────────────────────────────────────────────────────────

Deno.test("byGroup devuelve solo los del grupo", () => {
  const kosaka = byGroup(CHARACTERS, "familia-kosaka");
  for (const character of kosaka) {
    assertEquals(character.group, "familia-kosaka");
  }
  assertEquals(idsOf(kosaka).includes("yoshino"), true);
  assertEquals(idsOf(kosaka).includes("kanako"), false);
  assertEquals(idsOf(kosaka).length, 5);
});

Deno.test("byGroup con un grupo pequeño devuelve solo esos", () => {
  // El club de Meruru solo tiene a Meruru y Kurara Hoshino:
  assertEquals(idsOf(byGroup(CHARACTERS, "club-meruru")), [
    "meruru",
    "kurara-hoshino",
  ]);
  // Un id que no existe en GROUPS tampoco revienta: devuelve [].
  assertEquals(byGroup(CHARACTERS, "no-existe" as never), []);
});

Deno.test("byGroup respeta el orden del array original", () => {
  const gokou = idsOf(byGroup(CHARACTERS, "hermanas-gokou"));
  const enDataset = idsOf(CHARACTERS).filter((id) => gokou.includes(id));
  assertEquals(gokou, enDataset);
});

Deno.test("byGroup con array vacío devuelve []", () => {
  assertEquals(byGroup([], "familia-kosaka"), []);
});

// ─────────────────────────────────────────────────────────────────────────────
// search
// ─────────────────────────────────────────────────────────────────────────────

Deno.test("search encuentra por nombre", () => {
  assertEquals(idsOf(search(CHARACTERS, "kirino")).includes("kirino"), true);
});

Deno.test("search encuentra por alias", () => {
  assertEquals(idsOf(search(CHARACTERS, "kuroneko")), ["ruri"]);
});

Deno.test("search encuentra por etiqueta", () => {
  const resultado = idsOf(search(CHARACTERS, "idol"));
  assertEquals(resultado.includes("kanako"), true);
  assertEquals(resultado.includes("kanata"), true);
});

Deno.test("search normaliza mayúsculas y espacios", () => {
  assertEquals(
    idsOf(search(CHARACTERS, "  Kirino  ")),
    idsOf(search(CHARACTERS, "kirino")),
  );
});

Deno.test("search con query vacía devuelve todo", () => {
  assertEquals(search(CHARACTERS, ""), CHARACTERS);
  assertEquals(search(CHARACTERS, "   ").length, CHARACTERS.length);
});

Deno.test("search sin coincidencias devuelve []", () => {
  assertEquals(search(CHARACTERS, "zzzzz"), []);
});

Deno.test("search no muta el array original", () => {
  const antes = idsOf(CHARACTERS);
  search(CHARACTERS, "kirino");
  assertEquals(idsOf(CHARACTERS), antes);
});

// ─────────────────────────────────────────────────────────────────────────────
// sortByAge
// ─────────────────────────────────────────────────────────────────────────────

Deno.test("sortByAge asc pone a la más joven primero", () => {
  // Solo hay dos con edad: Kirino (14) y Kyousuke (17).
  const sorted = sortByAge(CHARACTERS, "asc");
  const withAge = sorted.filter((c) => c.age !== undefined);
  assertEquals(idsOf(withAge), ["kirino", "kyousuke"]);
});

Deno.test("sortByAge desc pone a la más mayor primero", () => {
  const sorted = sortByAge(CHARACTERS, "desc");
  const withAge = sorted.filter((c) => c.age !== undefined);
  assertEquals(idsOf(withAge), ["kyousuke", "kirino"]);
});

Deno.test("sortByAge deja a los SIN EDAD al final, en los dos órdenes", () => {
  for (const order of ["asc", "desc"] as const) {
    const sorted = sortByAge(CHARACTERS, order);
    const withAge = sorted.filter((c) => c.age !== undefined);

    assertEquals(
      withAge.length,
      sorted.length - (CHARACTERS.length - withAge.length),
      `en ${order} no se han filtrado bien`,
    );
    // Los desconocidos son la última posición y las que quedan.
    for (const character of sorted.slice(withAge.length)) {
      assertEquals(character.age, undefined, `${character.id} tiene edad`);
    }
  }
});

Deno.test("sortByAge por defecto es asc", () => {
  assertEquals(
    idsOf(sortByAge(CHARACTERS)),
    idsOf(sortByAge(CHARACTERS, "asc")),
  );
});

Deno.test("sortByAge NO muta el array original (¡OJO con sort!)", () => {
  // Esta es la trampa del ejercicio. Si haces `characters.sort(...)` en vez de
  // `[...characters].sort(...)`, este test falla y el dataset queda corrupto
  // para todos los tests siguientes.
  const antes = idsOf(CHARACTERS);
  sortByAge(CHARACTERS, "asc");
  assertEquals(idsOf(CHARACTERS), antes);
});

Deno.test("sortByAge devuelve un array NUEVO", () => {
  const resultado = sortByAge(CHARACTERS, "asc");
  assertNotStrictEquals(resultado, CHARACTERS);
});

Deno.test("sortByAge con array vacío no rompe nada", () => {
  assertEquals(sortByAge([], "asc"), []);
});

Deno.test("NO_AGE vale Infinity", () => {
  assertEquals(NO_AGE, Number.POSITIVE_INFINITY);
});

// ─────────────────────────────────────────────────────────────────────────────
// countByGroup
// ─────────────────────────────────────────────────────────────────────────────

Deno.test("countByGroup tiene una clave por cada grupo", () => {
  const conteo = countByGroup(CHARACTERS);
  assertEquals(Object.keys(conteo).length, Object.keys(GROUPS).length);
  assertEquals(Object.keys(conteo).sort(), Object.keys(GROUPS).sort());
});

Deno.test("countByGroup cuenta bien", () => {
  const conteo = countByGroup(CHARACTERS);
  assertEquals(conteo["familia-kosaka"], 5);
  assertEquals(conteo["hermanas-gokou"], 3);
  assertEquals(conteo["familia-tamura"], 1);
});

Deno.test("countByGroup suma el total de personajes", () => {
  const conteo = countByGroup(CHARACTERS);
  const total = Object.values(conteo).reduce((suma, n) => suma + n, 0);
  assertEquals(total, CHARACTERS.length);
});

Deno.test("countByGroup no se salta ningún grupo", () => {
  // Si te olvidas de inicializar los grupos a 0, aquí sale `undefined`.
  for (const [id, total] of Object.entries(countByGroup(CHARACTERS))) {
    assertEquals(typeof total, "number", `el grupo ${id} no es un número`);
  }
});

Deno.test("countByGroup con array vacío pone todos a 0", () => {
  const conteo = countByGroup([]);
  for (const [id, total] of Object.entries(conteo)) {
    assertEquals(total, 0, `el grupo ${id} debería estar a 0`);
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// groupByGroup
// ─────────────────────────────────────────────────────────────────────────────

Deno.test("groupByGroup tiene una clave por cada grupo", () => {
  const grupos = groupByGroup(CHARACTERS);
  assertEquals(Object.keys(grupos).length, Object.keys(GROUPS).length);
});

Deno.test("groupByGroup mete a cada personaje en su grupo", () => {
  const grupos = groupByGroup(CHARACTERS);
  for (const [id, personajes] of Object.entries(grupos)) {
    for (const character of personajes) {
      assertEquals(character.group, id, `${character.id} está en el grupo mal`);
    }
  }
});

Deno.test("groupByGroup mantiene todos los personajes", () => {
  const grupos = groupByGroup(CHARACTERS);
  const total = Object.values(grupos).reduce(
    (suma, lista) => suma + lista.length,
    0,
  );
  assertEquals(total, CHARACTERS.length);
});

Deno.test("groupByGroup y countByGroup cuentan lo mismo", () => {
  const grupos = groupByGroup(CHARACTERS);
  const conteo = countByGroup(CHARACTERS);
  for (const [id, lista] of Object.entries(grupos)) {
    assertEquals(lista.length, conteo[id as keyof typeof conteo]);
  }
});

Deno.test("groupByGroup no muta el array original", () => {
  const antes = idsOf(CHARACTERS);
  groupByGroup(CHARACTERS);
  assertEquals(idsOf(CHARACTERS), antes);
});

// ─────────────────────────────────────────────────────────────────────────────
// relatedTo
// ─────────────────────────────────────────────────────────────────────────────

Deno.test("relatedTo devuelve a quien declara", () => {
  const relacionados = relatedTo(CHARACTERS, "kirino");
  assertEquals(relacionados.includes(byId("kyousuke")), true);
  assertEquals(relacionados.length, byId("kirino").relationships.length);
});

Deno.test("relatedTo es UNIDIRECCIONAL (dataset asimétrico)", () => {
  // Ruri declara a Kyousuke, Kyousuke no declara a Ruri.
  assertEquals(
    relatedTo(CHARACTERS, "ruri").some((c) => c.id === "kyousuke"),
    true,
  );
  assertEquals(
    relatedTo(CHARACTERS, "kyousuke").some((c) => c.id === "ruri"),
    false,
  );
});

Deno.test("relatedTo no incluye al propio personaje", () => {
  for (const character of CHARACTERS) {
    const relacionados = relatedTo(CHARACTERS, character.id);
    assertEquals(
      relacionados.some((c) => c.id === character.id),
      false,
      `${character.id} se ha metido a sí mismo`,
    );
  }
});

Deno.test("relatedTo nunca deja un hole (undefined) en el array", () => {
  // La trampa clásica de `flatMap` mal usado: si la función interna devuelve
  // `undefined` en vez de un array vacío, te queda un `undefined` dentro de la
  // lista y el `assertEquals` explota más abajo, en un sitio que no explica
  // nada. Aquí se comprueba directamente.
  for (const character of CHARACTERS) {
    const relacionados = relatedTo(CHARACTERS, character.id);
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

Deno.test("relatedTo descarta ids que no existen en el dataset", () => {
  const roto: Character = {
    ...byId("kyousuke"),
    relationships: [
      { to: "kirino", type: "hermana menor" },
      { to: "fantasma-que-no-existe", type: "desconocido" },
    ],
  };
  const withBroken = [...CHARACTERS.filter((c) => c.id !== "kyousuke"), roto];

  const relacionados = relatedTo(withBroken, "kyousuke");
  assertEquals(idsOf(relacionados), ["kirino"]);
});

Deno.test("relatedTo no repite personajes", () => {
  const repetido: Character = {
    ...byId("kyousuke"),
    relationships: [
      { to: "kirino", type: "hermana menor" },
      { to: "kirino", type: "otra vez" },
    ],
  };
  const withDuplicate = [
    ...CHARACTERS.filter((c) => c.id !== "kyousuke"),
    repetido,
  ];

  assertEquals(idsOf(relatedTo(withDuplicate, "kyousuke")), ["kirino"]);
});

Deno.test("relatedTo con un id inexistente devuelve []", () => {
  assertEquals(relatedTo(CHARACTERS, "no-existe"), []);
});

Deno.test("relatedTo de alguien sin relaciones devuelve []", () => {
  const solo: Character = { ...byId("kirino"), relationships: [] };
  const withLoner = [...CHARACTERS.filter((c) => c.id !== "kirino"), solo];
  assertEquals(relatedTo(withLoner, "kirino"), []);
});

// ─────────────────────────────────────────────────────────────────────────────
// averageAge
// ─────────────────────────────────────────────────────────────────────────────

Deno.test("averageAge calcula la media de las edades conocidas", () => {
  // (17 + 14) / 2 = 15.5
  assertEquals(averageAge(CHARACTERS), 15.5);
});

Deno.test("averageAge NO redondea a entero", () => {
  assertEquals(averageAge(CHARACTERS), 15.5);
});

Deno.test("averageAge devuelve null si nadie tiene edad", () => {
  // El borde importante: 0 es un valor válido, null es "no hay datos".
  const withoutAges = CHARACTERS.map((c) => ({ ...c, age: undefined }));
  assertEquals(averageAge(withoutAges), null);
});

Deno.test("averageAge NO devuelve 0 cuando no hay datos", () => {
  const withoutAges = CHARACTERS.map((c) => ({ ...c, age: undefined }));
  assertNotStrictEquals(averageAge(withoutAges), 0);
});

Deno.test("averageAge con array vacío devuelve null", () => {
  assertEquals(averageAge([]), null);
});

Deno.test("averageAge funciona con un subconjunto", () => {
  const soloKirino = [byId("kirino")];
  assertEquals(averageAge(soloKirino), 14);
});

Deno.test("averageAge acepta el total por parámetro", () => {
  assertEquals(averageAge(CHARACTERS, 2), 15.5);
});

// ─────────────────────────────────────────────────────────────────────────────
// Utilidades ya resueltas
// ─────────────────────────────────────────────────────────────────────────────

Deno.test("countByUniverse separa el mundo real del anime", () => {
  const conteo = countByUniverse(CHARACTERS);
  assertEquals(conteo.realidad, 15);
  assertEquals(conteo.meruru, 2);
  assertEquals(conteo.realidad + conteo.meruru, CHARACTERS.length);
});

// ─────────────────────────────────────────────────────────────────────────────
// DATA
// ─────────────────────────────────────────────────────────────────────────────

Deno.test("DATA es el MISMO array que CHARACTERS, no una copia", () => {
  // El atajo de `queries.ts` tiene que seguir apuntando al array del módulo de
  // datos. Si alguien lo sustituye por una copia reordenada, medio programa ve
  // los personajes en otro orden y no hay ningún error: solo resultados raros.
  assertStrictEquals(DATA, CHARACTERS);
});

Deno.test("DATA se puede usar igual que CHARACTERS", () => {
  assertEquals(DATA.length, CHARACTERS.length);
});
