/**
 * store_test.js · 02 clases
 * =========================
 *
 * La especificación de `CharacterStore`, escrita como tests. Cada nombre
 * aquí dice lo que debería hacer el código, y el `throw` del TODO hace que
 * fallen hasta que lo implementes.
 *
 * Estos tests no necesitan navegador: el store no toca el DOM. Es el bloque
 * 04 de `ejercicios/` aplicando la misma idea.
 */

import { assertEquals } from "@std/assert";
import {
  CharacterStore,
  matchesQuery,
  normalize,
  withoutAccents,
} from "./store.js";

/** Un dataset mínimo, para que los tests no dependan de `personajes.ts`. */
const FIXTURE = [
  {
    id: "kyousuke",
    name: "Kyousuke Kosaka",
    alias: undefined,
    tags: ["tsundere"],
  },
  { id: "kuroneko", name: "Kuroneko", alias: "Rin", tags: ["gata"] },
  { id: "ruri", name: "Ruri", alias: undefined, tags: ["hermana menor"] },
];

Deno.test("normalize quita espacios y pasa a minúsculas", () => {
  assertEquals(normalize("  Kirino  "), "kirino");
});

Deno.test("withoutAccents quita los acentos", () => {
  assertEquals(withoutAccents("Kurúsuke"), "kurusuke");
});

Deno.test("matchesQuery acepta la búsqueda vacía", () => {
  assertEquals(matchesQuery(FIXTURE[0], ""), true);
});

Deno.test("matchesQuery busca por nombre", () => {
  assertEquals(matchesQuery(FIXTURE[0], "kyousuke"), true);
  assertEquals(matchesQuery(FIXTURE[2], "kyousuke"), false);
});

Deno.test("matchesQuery busca por alias", () => {
  assertEquals(matchesQuery(FIXTURE[1], "rin"), true);
});

Deno.test("matchesQuery busca por etiqueta", () => {
  assertEquals(matchesQuery(FIXTURE[2], "hermana"), true);
});

Deno.test("matchesQuery ignora mayúsculas y acentos", () => {
  assertEquals(matchesQuery(FIXTURE[0], "  KYÓUSUKE "), true);
});

Deno.test("matchesQuery exige TODOS los términos", () => {
  assertEquals(matchesQuery(FIXTURE[0], "kyousuke tsundere"), true);
  assertEquals(matchesQuery(FIXTURE[0], "kyousuke gato"), false);
});

Deno.test("el store empieza con todo visible", () => {
  const store = new CharacterStore(FIXTURE);
  assertEquals(store.visible.length, 3);
  assertEquals(store.query, "");
});

Deno.test("el store no expone la referencia interna del array", () => {
  const store = new CharacterStore(FIXTURE);
  // Mutar lo que devuelve `characters` sería mutar el estado del store.
  assertEquals(store.characters, FIXTURE);
});

Deno.test("TODO 1 · setQuery filtra y recalcula visible", () => {
  const store = new CharacterStore(FIXTURE);
  store.setQuery("  RIN ");
  assertEquals(store.query, "rin");
  assertEquals(store.visible.map((character) => character.id), ["kuroneko"]);
});

Deno.test("TODO 1 · setQuery con la búsqueda vacía lo devuelve todo", () => {
  const store = new CharacterStore(FIXTURE);
  store.setQuery("rin");
  store.setQuery("");
  assertEquals(store.visible.length, 3);
});

Deno.test("TODO 1 · setQuery no muta el array de personajes", () => {
  const store = new CharacterStore(FIXTURE);
  store.setQuery("rin");
  assertEquals(store.characters.length, 3);
});

Deno.test("TODO 2 · subscribe recibe el estado nuevo", () => {
  const store = new CharacterStore(FIXTURE);
  const received = [];
  store.subscribe((state) => received.push(state.visible.length));

  store.setQuery("rin");

  assertEquals(received, [1]);
});

Deno.test("TODO 2 · subscribe devuelve la función de baja", () => {
  const store = new CharacterStore(FIXTURE);
  const received = [];
  const unsubscribe = store.subscribe((state) =>
    received.push(state.visible.length)
  );

  unsubscribe();
  store.setQuery("rin");

  assertEquals(received, []);
});

Deno.test("TODO 2 · dos oyentes reciben los dos", () => {
  const store = new CharacterStore(FIXTURE);
  let first = 0;
  let second = 0;

  store.subscribe(() => first++);
  store.subscribe(() => second++);
  store.setQuery("rin");

  assertEquals(first, 1);
  assertEquals(second, 1);
});
