/**
 * store_test.js · 06 actualizar
 * =============================
 *
 * Ocho tests para `add`, `update` y `remove`. Son la especificación del
 * bloque, y todos pasan sin navegador.
 *
 * Fíjate en qué insiste esta batería: en que **el array no se muta**. Es el
 * error más fácil de cometer y el más difícil de ver, porque la página sigue
 * funcionando. Un test que mira el array antiguo después del cambio es lo
 * único que lo caza.
 */

import { assertEquals } from "@std/assert";
import { CharacterStore, slugify } from "./store.js";

const FIXTURE = [
  { id: "kyousuke", name: "Kyousuke", tags: ["tsundere"], relationships: [] },
  { id: "kuroneko", name: "Kuroneko", tags: ["gata"], relationships: [] },
  { id: "ruri", name: "Ruri", tags: [], relationships: [] },
];

/** Copia profunda de mano: los tests no deben compartir arrays con el store. */
function cloneFixture() {
  return FIXTURE.map((character) => ({
    ...character,
    tags: [...character.tags],
    relationships: [...character.relationships],
  }));
}

Deno.test("slugify normaliza y quita acentos", () => {
  assertEquals(slugify("  Kirino IJN  "), "kirino-ijn");
  assertEquals(slugify("Kurúsuke"), "kurusuke");
});

Deno.test("TODO 1 · add devuelve el id nuevo", () => {
  const store = new CharacterStore(cloneFixture());
  const id = store.add("Manami");
  assertEquals(id, "manami");
});

Deno.test("TODO 1 · add no muta el array anterior", () => {
  const characters = cloneFixture();
  const store = new CharacterStore(characters);
  const before = store.characters;

  store.add("Manami");

  // El array viejo sigue teniendo 3, y el store tiene uno nuevo.
  assertEquals(before.length, 3);
  assertEquals(store.characters, before);
});

Deno.test("TODO 1 · add desambigua ids repetidos", () => {
  const store = new CharacterStore(cloneFixture());
  const first = store.add("Kuroneko");
  const second = store.add("Kuroneko");
  assertEquals(first, "kuroneko-2");
  assertEquals(second, "kuroneko-3");
});

Deno.test("TODO 1 · add recalcula visible con la búsqueda puesta", () => {
  const store = new CharacterStore(cloneFixture());
  store.setQuery("manami");
  assertEquals(store.visible.length, 0);

  store.add("Manami");

  // Si `add` no recalcula, el nuevo no aparece y esto falla.
  assertEquals(store.visible.map((character) => character.id), ["manami"]);
});

Deno.test("TODO 2 · update cambia solo los campos dados", () => {
  const store = new CharacterStore(cloneFixture());
  assertEquals(store.update("ruri", { tags: ["hermana menor"] }), true);

  const ruri = store.characters.find((character) => character.id === "ruri");
  assertEquals(ruri.tags, ["hermana menor"]);
  // El nombre no se toca: esto es un patch, no un replace.
  assertEquals(ruri.name, "Ruri");
});

Deno.test("TODO 2 · update con un id inexistente no hace nada", () => {
  const store = new CharacterStore(cloneFixture());
  assertEquals(store.update("no-existe", { name: "X" }), false);
  assertEquals(store.characters.length, 3);
});

Deno.test("TODO 3 · remove borra el personaje y su favorito", () => {
  const store = new CharacterStore(cloneFixture());
  store.toggleFavorite("ruri");
  assertEquals(store.favoriteCount, 1);

  assertEquals(store.remove("ruri"), true);

  assertEquals(store.characters.length, 2);
  // Sin esta línea, el store guardaría un id que ya no apunta a nadie.
  assertEquals(store.favoriteCount, 0);
});

Deno.test("TODO 3 · remove con un id inexistente devuelve false", () => {
  const store = new CharacterStore(cloneFixture());
  assertEquals(store.remove("no-existe"), false);
  assertEquals(store.characters.length, 3);
});

Deno.test("reset tira lo añadido y deja el dataset", () => {
  const store = new CharacterStore(cloneFixture());
  store.add("Manami");
  assertEquals(store.characters.length, 4);

  store.reset();

  assertEquals(store.characters.length, 3);
  assertEquals(store.addedIds.size, 0);
});

Deno.test("los oyentes reciben el tipo de cambio", () => {
  const store = new CharacterStore(cloneFixture());
  const changes = [];
  store.subscribe((_state, change) => changes.push(change.type));

  store.add("Manami");
  store.update("ruri", { name: "Ruri K." });
  store.remove("ruri");
  store.reset();

  assertEquals(changes, ["added", "updated", "removed", "reset"]);
});
