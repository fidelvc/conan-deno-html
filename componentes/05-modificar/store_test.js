/**
 * store_test.js · 05 modificar
 * ===========================
 *
 * Lo que se puede probar sin DOM, probado. Los componentes de este bloque no
 * tienen tests, y no por pereza: necesitan `HTMLElement`, `dispatchEvent` y
 * un documento. Su especificación es la lista de verificación del README.
 *
 * Lo que sí se puede probar es la parte interesante: que un id se marque y se
 * desmarque, que los oyentes se enteren, y que nada más se entere.
 */

import { assertEquals } from "@std/assert";
import { CharacterStore } from "./store.js";

const FIXTURE = [
  { id: "kyousuke", name: "Kyousuke", tags: [] },
  { id: "kuroneko", name: "Kuroneko", tags: [] },
  { id: "ruri", name: "Ruri", tags: [] },
];

Deno.test("nada es favorito al empezar", () => {
  const store = new CharacterStore(FIXTURE);
  assertEquals(store.favoriteCount, 0);
  assertEquals(store.isFavorite("kyousuke"), false);
});

Deno.test("toggleFavorite marca y desmarca", () => {
  const store = new CharacterStore(FIXTURE);

  assertEquals(store.toggleFavorite("kyousuke"), true);
  assertEquals(store.isFavorite("kyousuke"), true);
  assertEquals(store.favoriteCount, 1);

  assertEquals(store.toggleFavorite("kyousuke"), false);
  assertEquals(store.isFavorite("kyousuke"), false);
  assertEquals(store.favoriteCount, 0);
});

Deno.test("toggleFavorite no toca los personajes", () => {
  const store = new CharacterStore(FIXTURE);
  store.toggleFavorite("kyousuke");
  // El dataset es de solo lectura: el favorito vive en el store.
  assertEquals(FIXTURE[0].favorite, undefined);
  assertEquals(store.characters.length, 3);
});

Deno.test("toggleFavorite avisa a los oyentes", () => {
  const store = new CharacterStore(FIXTURE);
  const received = [];
  store.subscribe((state) => received.push(state.favoriteCount));

  store.toggleFavorite("kyousuke");
  store.toggleFavorite("ruri");

  assertEquals(received, [1, 2]);
});

Deno.test("toggleFavorite sobrevive a un id desconocido", () => {
  const store = new CharacterStore(FIXTURE);
  // No lanza, y el id simplemente no está en ninguna tarjeta.
  assertEquals(store.toggleFavorite("no-existe"), true);
  assertEquals(store.favoriteCount, 1);
});

Deno.test("setQuery y los favoritos son independientes", () => {
  const store = new CharacterStore(FIXTURE);
  store.toggleFavorite("kyousuke");
  store.setQuery("ruri");

  // El filtro no puede perder un favorito.
  assertEquals(store.isFavorite("kyousuke"), true);
  assertEquals(store.visible.map((character) => character.id), ["ruri"]);
});

Deno.test("la baja de un oyente funciona con varios eventos", () => {
  const store = new CharacterStore(FIXTURE);
  let calls = 0;
  const unsubscribe = store.subscribe(() => calls++);

  store.toggleFavorite("kyousuke");
  unsubscribe();
  store.toggleFavorite("ruri");

  assertEquals(calls, 1);
});
