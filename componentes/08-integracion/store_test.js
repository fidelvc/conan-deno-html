/**
 * store_test.js · 08 integración
 * =============================
 *
 * Los doce tests del store más los nuevos de los filtros. Son la
 * especificación de los tres TODOs de datos, y todos corren sin navegador.
 *
 * La batería nueva insiste en una cosa que el bloque 02 no podía comprobar:
 * **los tres filtros se combinan, y se combinan bien**. El caso interesante
 * no es "un filtro funciona", es "dos filtros a la vez dan lo que la interfaz
 * promete".
 */

import { assertEquals } from "@std/assert";
import { CharacterStore, slugify } from "./store.js";

const FIXTURE = [
  {
    id: "kyousuke",
    name: "Kyousuke",
    group: "familia-kosaka",
    universe: "realidad",
    tags: [],
  },
  {
    id: "kuroneko",
    name: "Kuroneko",
    group: "familia-kosaka",
    universe: "realidad",
    tags: [],
  },
  {
    id: "ruri",
    name: "Ruri",
    group: "hermanas-gokou",
    universe: "realidad",
    tags: [],
  },
  {
    id: "meruru",
    name: "Meruru",
    group: "club-meruru",
    universe: "meruru",
    tags: [],
  },
];

function cloneFixture() {
  return FIXTURE.map((character) => ({
    ...character,
    tags: [...character.tags],
  }));
}

Deno.test("slugify normaliza y quita acentos", () => {
  assertEquals(slugify("  Kirino IJN  "), "kirino-ijn");
});

Deno.test("TODO 1 · setGroupFilter con un grupo", () => {
  const store = new CharacterStore(cloneFixture());
  store.setGroupFilter(["familia-kosaka"]);
  assertEquals(
    store.visible.map((character) => character.id),
    ["kyousuke", "kuroneko"],
  );
});

Deno.test("TODO 1 · setGroupFilter con varios grupos es un OR", () => {
  const store = new CharacterStore(cloneFixture());
  store.setGroupFilter(["familia-kosaka", "hermanas-gokou"]);
  assertEquals(store.visible.length, 3);
});

Deno.test("TODO 1 · setGroupFilter con array vacío quita el filtro", () => {
  const store = new CharacterStore(cloneFixture());
  store.setGroupFilter(["familia-kosaka"]);
  store.setGroupFilter([]);
  assertEquals(store.visible.length, 4);
});

Deno.test("TODO 1 · setGroupFilter con null quita el filtro", () => {
  const store = new CharacterStore(cloneFixture());
  store.setGroupFilter(["familia-kosaka"]);
  store.setGroupFilter(null);
  assertEquals(store.visible.length, 4);
});

Deno.test("TODO 2 · setUniverseFilter filtra por universo", () => {
  const store = new CharacterStore(cloneFixture());
  store.setUniverseFilter("meruru");
  assertEquals(store.visible.map((character) => character.id), ["meruru"]);
});

Deno.test("TODO 2 · setUniverseFilter con null quita el filtro", () => {
  const store = new CharacterStore(cloneFixture());
  store.setUniverseFilter("meruru");
  store.setUniverseFilter(null);
  assertEquals(store.visible.length, 4);
});

Deno.test("los tres filtros se combinan con AND", () => {
  const store = new CharacterStore(cloneFixture());
  store.setQuery("ruri");
  store.setGroupFilter(["familia-kosaka"]);
  // Ruri es de las Gokou, así que el grupo la descarta.
  assertEquals(store.visible.length, 0);

  store.setGroupFilter(["hermanas-gokou"]);
  assertEquals(store.visible.map((character) => character.id), ["ruri"]);
});

Deno.test("búsqueda y universo juntos", () => {
  const store = new CharacterStore(cloneFixture());
  store.setQuery("meruru");
  store.setUniverseFilter("realidad");
  // Meruru es del universo equivocado.
  assertEquals(store.visible.length, 0);

  store.setUniverseFilter("meruru");
  assertEquals(store.visible.length, 1);
});

Deno.test("un filtro nuevo no rompe los anteriores", () => {
  const store = new CharacterStore(cloneFixture());
  store.setGroupFilter(["familia-kosaka"]);
  store.setUniverseFilter("meruru");
  store.setQuery("kyousuke");

  // Kyousuke casa con la búsqueda y el grupo, pero no con el universo.
  assertEquals(store.visible.length, 0);

  store.setUniverseFilter(null);
  assertEquals(store.visible.map((character) => character.id), ["kyousuke"]);
});

Deno.test("add recalcula visible con los tres filtros puestos", () => {
  const store = new CharacterStore(cloneFixture());
  store.setUniverseFilter("realidad");
  store.setGroupFilter(["familia-kosaka"]);

  store.add("Manami");

  // Manami se crea en `familia-kosaka` y en `realidad`, así que sale.
  assertEquals(store.visible.length, 3);
});

Deno.test("reset quita también los filtros", () => {
  const store = new CharacterStore(cloneFixture());
  store.add("Manami");
  store.setQuery("manami");
  store.setGroupFilter(["familia-kosaka"]);

  store.reset();

  assertEquals(store.query, "");
  assertEquals(store.groupFilter.size, 0);
  assertEquals(store.universeFilter, null);
  assertEquals(store.visible.length, 3);
});

Deno.test("los oyentes reciben filtered al cambiar un filtro", () => {
  const store = new CharacterStore(cloneFixture());
  const changes = [];
  store.subscribe((_state, change) => changes.push(change.type));

  store.setGroupFilter(["familia-kosaka"]);
  store.setUniverseFilter("meruru");

  assertEquals(changes, ["filtered", "filtered"]);
});
