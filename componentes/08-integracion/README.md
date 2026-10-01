# 08 · Integración

Todo junto, y un componente más: los filtros por grupo y por universo viven
dentro de la lista y ya no son un `<select>` en la página.

```sh
deno task comp                  # http://localhost:8000/08-integracion/
deno test componentes/08-integracion/
```

## Qué hay aquí

| Fichero             | Qué cambia respecto al 07                                     |
| ------------------- | ------------------------------------------------------------- |
| `store.js`          | Dos filtros más y **un** `#computeVisible` que los combina.   |
| `store_test.js`     | Quince tests, siete de ellos sobre la combinación de filtros. |
| `character-list.js` | Los botones de filtro, dentro del shadow root.                |
| `character-card.js` | **No cambia.** Ni una línea.                                  |
| `app.js`            | Tres `addEventListener` más.                                  |

## Los TODOs

| # | Dónde                              | Qué practicas                                    |
| - | ---------------------------------- | ------------------------------------------------ |
| 1 | `CharacterStore.setGroupFilter`    | Un `Set` de grupos, vacío significa "sin filtro" |
| 2 | `CharacterStore.setUniverseFilter` | Un filtro más sobre el mismo patrón              |
| 3 | `CharacterList.groupFilterChanged` | Un `CustomEvent` que lleva el estado **después** |

## Cómo se verifica

Tests primero: `deno test componentes/08-integracion/`. Los quince.

En el navegador:

1. Los botones de grupo salen **encima** de la lista, y el de "Familia Kosaka"
   sale ya pulsado, por el atributo `groups` del `index.html`.
2. Pincha en otro grupo. Se desmarca Kosaka y se marca el nuevo. Vuelve a
   pincharlo y se desmarca.
3. **Combina los tres filtros**: busca `k`, marca "Familia Kosaka", y pulsa
   "Meruru". El contador dice 0, y la lista está vacía. Luego quita el de Meruru
   y aparecen los que casan.
4. Añade un personaje con "Familia Kosaka" y "Realidad" activos: sale. Añade
   otro con "Meruru" activo: no sale, y al quitarlo sale. El `add` recalcula
   contra los tres filtros.
5. En la consola: `document.querySelector("button.filter")` → `null`. Los
   botones están dentro del shadow root. Con
   `document.querySelector("character-list").shadowRoot.querySelectorAll("button.filter")`
   → 9.
6. **Vaciar los añadidos** quita también los filtros y la búsqueda. Es el
   `reset` completo.

## La idea

**El argumento del bloque es un `if` que no existe.**

Compara los dos `setQuery`:

```js
// 02 · este método es el único que sabe filtrar
setQuery(query) {
  this.#query = normalize(query);
  this.#visible = this.#characters.filter((character) =>
    matchesQuery(character, this.#query)
  );
}

// 08 · este método solo guarda su valor, y llama al que sabe
setQuery(query) {
  this.#query = normalize(query);
  this.#computeVisible();
}
```

En el bloque 02, añadir un filtro obligaba a **reescribir** `setQuery`, y a
acordarse de que combinase con el nuevo. Aquí cada `set` tiene una línea útil y
`#computeVisible` es el único sitio donde se decide cómo se mezclan los tres.
Añadir un cuarto filtro es un `set` más y tres líneas en un método.

Y hay un test que lo pinsa: `los tres filtros se combinan con AND`. Es el caso
que no aparece hasta que hay tres filtros, y el que más caro sale si se
equivoca.

**Los filtros son parte de la lista, así que viven en la lista.** Un filtro por
grupo sin lista no significa nada. Y al vivir en el componente traen su estilo,
su `aria-pressed` y su teclado sin que nadie tenga que acordarse.

`app.js` no tiene ni un `<select>`, ni un `id`, ni un listener por filtro. Tiene
tres líneas.

**El evento lleva el estado _después_, no el id pulsado.** El filtro es
conmutado, y por eso quien escucha necesita saber si activar o desactivar. La
lista lo decide y lo dice en el `detail`, así que `app.js` no tiene que saber si
el grupo estaba activo:

```js
list.addEventListener("group-filter-changed", (event) => {
  store.setGroupFilter(event.detail.groups); // ← solo aplica
});
```

Si el `detail` dijera "ha pasado el grupo X", `app.js` tendría que preguntar
cuál era el estado antes, y volvería a conocer la mecánica del filtro.

**Y la tarjeta no ha cambiado.** Ha cambiado cuatro veces desde el 03 (template,
slot, botón, shadow root) y aquí no toca. Lo que hace —enseñar un personaje y
avisar de un clic— es lo mismo desde el principio.

Eso es la señal de que la frontera está bien puesta: cuando el requisito crece,
el cambio cae en la lista o en el store, y no dentro de la tarjeta. En el 06
todo era una sola tarjeta, y por eso crecía sin parar. Aquí no.

## Lo que queda sin resolver

Tres cosas, y ninguna es un fallo:

- **`syncOrder` está vacío.** `replaceChildren` con el orden correcto resuelve
  el caso en una pasada, así que la comparación previa no hace falta a esta
  escala. El método se queda por si quieres implementarlo, y el README del 06
  explica por qué importa cuando haya cientos de tarjetas.
- **Los datos viven en memoria.** Un `Set` de favoritos y un array de añadidos
  se pierden al recargar. `localStorage` es el siguiente paso, y no es difícil.
- **No hay `URLSearchParams`.** Un filtro que no se puede compartir por un
  enlace es un filtro que se pierde al copiar la URL. Es el paso natural después
  de este.

## Y la pregunta que queda

Si has llegado hasta aquí, esta serie ha hecho su trabajo: no se termina
terminando, se termina explicando.

Compárala con el bloque 01. La primera serie tenía 5 bloques y 16 TODOs, con
HTML en cadenas, el estado en variables sueltas, y los tests como
especificación. Esta tiene 8 bloques y 3 preguntas, y ninguna se responde
escribiendo una función: se responden decidiendo **dónde va cada cosa**.

Cuando puedas contestar estas tres sin mirar, puedes dejar la serie:

1. ¿Por qué `<character-card>` no sabe nada del store?
2. ¿Qué pasaría si `render` no existiera y solo tuvieras `patch`?
3. ¿Cuándo **no** usarías Shadow DOM, aunque este repo lo use siempre?
