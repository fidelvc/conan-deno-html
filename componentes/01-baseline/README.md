# 01 · Baseline

La versión más simple que funciona. Tres funciones y un `addEventListener`.

```sh
deno task comp   # y abre http://localhost:8000/01-baseline/
```

## Qué hay aquí

| Fichero  | Qué hace                                           |
| -------- | -------------------------------------------------- |
| `app.js` | Pide los datos, filtra, pinta. Todo en un fichero. |

Un solo fichero, sin clases, sin componentes, sin estado propio. Si la app fuera
esta, esto estaría bien. La pregunta del bloque es **qué la rompe**.

## Los TODOs

| # | Función         | Qué practicas                                      |
| - | --------------- | -------------------------------------------------- |
| 1 | `matchesQuery`  | Normalizar antes de comparar: acentos y mayúsculas |
| 2 | `describeCount` | Un texto que depende de dos números a la vez       |

## Cómo se verifica

No hay tests: este código necesita `document`, y Deno no tiene `document`. La
especificación es esta lista. Ábrela en el navegador y ve tachando:

1. Al cargar, se ven las 17 tarjetas y el contador dice el total.
2. Escribes `k` en el buscador: solo aparecen los personajes con `k`.
3. Escribes `KYOUSUKE`: sale igual, porque se normaliza a minúsculas.
4. Escribes `kyoúsuke`: **también** sale, y ese es el TODO 1.
5. Escribes `zzzz`: la lista queda vacía y el contador dice 0.
6. Borras el buscador: vuelven las 17.

Para ver si lo has resuelto: mira los tests de la serie de `ejercicios/`, que
tienen la misma lógica en TypeScript.

## Qué se rompe aquí

Abre `app.js` y mira las tres variables de estado:

```js
let characters = [];
let query = "";
let visible = [];
```

Cada una la escribe una función distinta, y ninguna sabe de las otras dos. Añade
un criterio más —"ver solo los del grupo X"— y tendrás que:

- añadir una cuarta variable,
- reconstruir `visible` incluyendo los dos criterios,
- y acordarte de que quien escriba el filtro tiene que tener en cuenta al otro.

Eso no es un problema de `matchesQuery`. Es un problema de **dónde vive el
estado**, y por eso el bloque 02 mete esas cuatro variables dentro de una clase.
