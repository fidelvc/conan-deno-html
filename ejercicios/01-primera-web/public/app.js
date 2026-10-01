/**
 * app.js · la mitad del cliente del bloque 01
 * =========================================
 *
 * Este fichero es JavaScript de navegador puro: no importa nada de Deno, no
 * toca el servidor y se puede abrir con F12. La página funciona igual sin él
 * (el buscador es un formulario GET de verdad); esto solo evita que la página
 * se recargue en cada tecla.
 *
 * Tus tareas
 * ----------
 *   1. `matchesQuery`  → decidir si una tarjeta coincide con la búsqueda
 *   2. `describeCount` → escribir el texto del contador
 *
 * Para probarlo: `deno task ej01`, escribe en el buscador y mira la consola
 * del navegador.
 */

const form = document.querySelector("#search-form");
const input = document.querySelector("#q");
const cards = [...document.querySelectorAll("[data-search]")];
const counter = document.querySelector("#result-count");
const empty = document.querySelector("#empty-state");

/**
 * TODO 1 · ¿Esta tarjeta coincide con lo que el usuario ha escrito?
 *
 * @param {Element} card Una tarjeta (`<li class="character">`).
 * @param {string} query Texto buscado, ya en minúsculas.
 * @returns {boolean} `true` si hay que dejarla a la vista.
 *
 * Pistas:
 *   - `card.dataset.search` ya viene en minúsculas (lo dejó el servidor al
 *     construir el atributo). Tú no tienes que normalizar nada.
 *   - Con la búsqueda vacía, todo tiene que estar visible.
 *   - `String.prototype.includes` y `String.prototype.trim`.
 */
function matchesQuery(card, query) {
 
  throw new Error("TODO 1: implementa matchesQuery", {
    cause: { searchText: card.dataset.search, query },
  });
}

/**
 * TODO 2 · Escribe el texto del contador.
 *
 * @param {number} visible Cuántas tarjetas han quedado a la vista.
 * @param {number} total Cuántas hay en total.
 * @returns {string} El texto, ya listo para meter en `#result-count`.
 *
 * Pistas:
 *   - `Array.prototype.filter` + `.length` te da el número de visibles sin
 *     tocar el DOM otra vez: cuenta sobre un array de verdad, no sobre nodos.
 *   - Ojo con el plural. "1 personaje" y "0 personajes" no se escriben igual.
 *   - Busca una forma de no repetir la misma frase dos veces.
 */
function describeCount(visible, total) {
  throw new Error("TODO 2: implementa describeCount", {
    cause: { visible, total },
  });
}

function applyFilter() {
  const query = input.value.trim().toLowerCase();
  let visible = 0;

  for (const card of cards) {
    const show = matchesQuery(card, query);
    card.hidden = !show;
    if (show) visible++;
  }

  counter.textContent = describeCount(visible, cards.length);
  empty.hidden = visible > 0;
}

// El servidor nos deja la búsqueda inicial en el formulario, para que recargar
// con "?q=kirino" rellene el input y no parezca que se ha perdido la búsqueda.
input.value = form.dataset.query ?? "";

// `input` salta en cada tecla, que es justo lo que queremos para filtrar en
// vivo. `change` saltaría al perder el foco: demasiado tarde.
input.addEventListener("input", applyFilter);

// El formulario ya funciona sin JavaScript, así que aquí solo se evita el
// viaje completo al servidor. Sin este preventDefault, cada Enter recargaría
// la página y el contador volvería a cero un instante.
form.addEventListener("submit", (event) => {
  event.preventDefault();
  applyFilter();
});

applyFilter();
