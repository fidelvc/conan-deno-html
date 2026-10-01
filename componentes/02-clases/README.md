# 02 · Clases

El bloque 01 con el estado dentro de una clase. En la página no cambia nada, y
esa es la prueba de que la clase hizo su trabajo.

```sh
deno task comp          # http://localhost:8000/02-clases/
deno test componentes/02-clases/
```

## Qué hay aquí

| Fichero         | Qué hace                                                |
| --------------- | ------------------------------------------------------- |
| `store.js`      | `CharacterStore`: el estado y las reglas. Nada de DOM.  |
| `app.js`        | El cable: pide los datos, se suscribe al store y pinta. |
| `store_test.js` | Los tests, que aquí **sí** existen.                     |

## Los TODOs

| # | Método                     | Qué practicas                                    |
| - | -------------------------- | ------------------------------------------------ |
| 1 | `CharacterStore.setQuery`  | Un setter que normaliza, recalcula y avisa       |
| 2 | `CharacterStore.subscribe` | Un oyente que devuelve su propia función de baja |

## Cómo se verifica

`deno test componentes/02-clases/` te da la especificación entera, de golpe. Y
luego en el navegador, lo mismo que en el 01: buscar, buscar con mayúsculas,
buscar con acentos, vaciar.

## La idea

Mira el antes y el después en `app.js`:

```js
// 01: search() mutaba variables y luego alguien tenía que acordarse de pintar.
let visible = characters.filter(...);
render();

// 02: search() solo dice qué quiere. El store avisa a quien esté escuchando.
store.setQuery(input.value);
```

`render` ya no se llama a mano en ningún sitio. Se registra una vez con
`subscribe`, y a partir de ahí el store se encarga.

Eso tiene una consecuencia importante, y no es retórica: **el store no sabe que
existe un `render`**. Si mañana el mismo store pinta en dos sitios —una lista y
un contador en otra página—, no hay que tocar el store. Se suscribe dos veces.

## Dónde está el problema todavía

La tarjeta sigue siendo una cadena:

```js
return `<li class="character">
  <h2>${escapeHtml(character.name)}</h2>
  <p class="family">${escapeHtml(character.family)}</p>
  <p class="description">${escapeHtml(character.description)}</p>
</li>`;
```

Con tres líneas aguanta. Añade un botón, un badge, un campo que solo aparece a
veces, y tendrás comillas anidadas, `\n` dentro de la cadena, y `escapeHtml` en
cada punto por el que puede colarse un `<`.

El bloque 03 pasa ese HTML a un `<template>`, donde el editor lo resalta, el
navegador lo parsea, y no hay ni una comilla.
