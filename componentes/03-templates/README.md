# 03 · Templates

El HTML de la tarjeta deja de ser una cadena y pasa a un `<template>`. Un Custom
Element clona el template por cada personaje.

```sh
deno task comp   # http://localhost:8000/03-templates/
```

## Qué hay aquí

| Fichero             | Qué hace                                      |
| ------------------- | --------------------------------------------- |
| `index.html`        | La página y el `<template>` de la tarjeta     |
| `character-card.js` | `<character-card>`: una tarjeta, un personaje |
| `character-list.js` | `<character-list>`: repite tarjetas           |
| `app.js`            | El cable, idéntico al del bloque 02           |

Dos Custom Elements ya, y ninguno ha hecho nada especial. No hay bundler, no hay
build: Deno sirve el `.js` y el navegador lo importa como módulo ES.

## Los TODOs

| # | Dónde                      | Qué practicas                                            |
| - | -------------------------- | -------------------------------------------------------- |
| 1 | `CharacterCard.character`  | `cloneNode(true)` + `textContent` sobre el clon          |
| 2 | `CharacterList.characters` | Crear un componente por elemento con `replaceChildren()` |

## Cómo se verifica

Sin tests: `cloneNode` y `textContent` son del DOM, y Deno no tiene DOM. La
especificación es esta lista:

1. Al cargar, se ven las 17 tarjetas. El contador dice el total.
2. La tarjeta tiene nombre, familia, descripción y etiquetas.
3. Escribes `k`: se filtran.
4. En la consola, `document.querySelector("character-card")` devuelve el primer
   componente, y en él `.character` está el objeto.
5. Borra el `innerHTML` de un `character-card` en la consola y llama a su setter
   otra vez: se repinta **solo** esa tarjeta, no la lista entera.
6. Abre `View Source` y busca `<h2>` dentro del `<template>`: ahí está el HTML,
   y no aparece en la página.

El punto 6 es el que explica el bloque. En el 02, el HTML de la tarjeta no
existía en ningún fichero: se construía en tiempo de ejecución, invisible para
el editor y para la vista de código fuente. Ahora es HTML de verdad.

## La idea

Tres cosas que cambian, y ninguna es el store.

**`textContent` sustituye a `escapeHtml`.** Rellenar con `textContent` es
inofensivo por definición: lo que pasa ahí es texto, siempre. Compruébalo
metiendo `<script>alert(1)</script>` como nombre en el `console.log` del fetch y
verás que sale como texto. Con `innerHTML` habrías tenido que acordarte de
escapar.

**El nombre lleva guion.** `<character-card>`, no `<CharacterCard>`. Sin guion,
el navegador trata el elemento como un HTML desconocido, no ejecuta tu clase, y
`set character` no existe. Es un error silencioso: no falla, simplemente no pasa
nada.

**Los datos no llegan por el constructor.** `<character-card>` no es
`new CharacterCard(kyousuke)`. Los Custom Elements se crean vacíos con
`document.createElement` y luego reciben los datos por una propiedad, por
atributo, o por lo que pinte el contenedor. Por eso el `set character` está
separado de la construcción.

## Dónde está el problema todavía

`<character-list>` solo sabe hacer una cosa: un `map` que crea tarjetas. No
tiene ni idea de qué hay dentro de una tarjeta. En cuanto quieras dos formatos
—la tarjeta grande del índice y la versión pequeña de un detalle— tendrás que
duplicar la tarjeta entera, y la segunda copia se desincroniza de la primera.

Y hay algo más incómodo, aunque todavía no se nota: para cambiar una tarjeta
tienes que volver a pintar la lista. El bloque 04 lo resuelve con `<slot>`, y
después el 05 con eventos. Cada uno de esos dos es un problema distinto.
