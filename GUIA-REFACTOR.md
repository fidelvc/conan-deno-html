# Guía de refactor · de funciones sueltas a Web Components

Esta es la segunda serie del repo. La primera (`ejercicios/`) te enseña Deno,
HTML y los métodos de array. Esta te enseña **cómo se reorganiza el código
cuando la app crece**, y lo hace con el mismo dataset, para que puedas comparar
los dos approaches lado a lado.

Todo lo que hay aquí está pensado para abrirse, leerlo y romperlo. No hay build,
ni `node_modules`, ni framework. Los ficheros `.js` se sirven tal cual y el
navegador carga módulos ES con `<script type="module">`.

```sh
deno task comp     # servidor de esta serie en http://localhost:8000
```

## La idea, en una frase

Cada bloque parte de un código que ya funciona, y en cada uno hay exactamente un
problema que no se puede arreglar con otra función más. El siguiente bloque es
el mismo comportamiento con ese problema resuelto.

No se trata de aprender "la forma correcta". Se trata de que veas **qué presión
empuja** a cada herramienta: por qué aparece el segundo fichero, por qué ese
segundo fichero necesita estado, por qué el estado necesita un contenedor, por
qué el contenedor necesita emitir eventos.

## Por qué aquí y no en `ejercicios/`

Porque la serie vieja no se puede tocar. Cada bloque suyo tiene sus tests
fallando a propósito: **los tests son el enunciado**. Si los reescribo con
clases y Web Components, desaparecen los TODOs, desaparecen los tests y con
ellos el ejercicio.

Además, el orden importa. Se puede refactorizar un fichero feo; refactorizar un
proceso de aprendizaje es otra cosa.

## El recorrido

| #  | Bloque           | El problema del bloque anterior                             | La herramienta                              |
| -- | ---------------- | ----------------------------------------------------------- | ------------------------------------------- |
| 01 | `01-baseline`    | —                                                           | Todo procedural, con `innerHTML`            |
| 02 | `02-clases`      | El estado reparte entre tres variables y se desincroniza    | Una clase que lo contiene todo              |
| 03 | `03-templates`   | El HTML son cadenas con `map` y `join`                      | `<template>` + un Custom Element            |
| 04 | `04-slots`       | `<character-card>` no sabe reutilizarse dentro de una lista | `<slot>` y un componente hijo               |
| 05 | `05-modificar`   | Al marcar un personaje, el HTML y el estado se contradicen  | Eventos que suben: `CustomEvent`            |
| 06 | `06-actualizar`  | Añadir, editar y borrar son tres bloques de código          | El store emite cambios; quien escucha pinta |
| 07 | `07-shadow-dom`  | Los estilos de `<character-card>` se rompen fuera           | `attachShadow` y encapsulación real         |
| 08 | `08-integracion` | —                                                           | Todo junto, con los ocho bloques de antes   |

## Las tres fases, en una frase cada una

**Fase 1 · Mostrar datos.** Etiquetas 01 a 04. Se trata de _qué_ pintas: desde
`innerHTML` con cadenas hasta `<template>` y `<slot>`. Aprendes que el HTML
tiene una sintaxis propia, y que escribirlo con `join("")` es una forma de no
usar esa sintaxis.

**Fase 2 · Modificar.** Etiquetas 05 y 06. Se trata de _cómo_ cambia el estado y
de _quién_ se entera. Aparece el flujo unidireccional: el store es la única
fuente de verdad, los componentes solo pintan lo que reciben, y los eventos
suben sin que el hijo sepa quién escucha.

**Fase 3 · Actualizar.** Etiquetas 06 y 07. Se trata de _qué_ pasa cuando la
colección cambia entera, y de que un componente debería poder vivir en una
página que no es la tuya. Aparece el Shadow DOM, y con él el tradeoff real:
encapsulas los estilos y pagas en accesibilidad, en `querySelector` y en
formularios.

## Lo que NO cambia entre bloques

Esto es lo importante, y es lo que hace comparable la serie:

- **El dataset.** Viene de `/api/characters`, que sirve el mismo
  `datos/personajes.ts` que los bloques de `ejercicios/`. No hay copia.
- **El aspecto.** Todos los bloques usan `assets/estilos.css`. Un cambio de
  color se ve en los ocho.
- **Los nombres.** `Character`, `CharacterStore`, `characterCard`,
  `characterList`. Si cambian de un bloque a otro, la comparación que quieres
  hacer se pierde en el ruido.
- **El idioma.** Ver `CONVENCIONES.md`: el código en inglés, el contenido en
  español, y los términos de la API (`filter`, `map`, `slot`, `attachShadow`)
  sin traducir nunca.

## Por qué los tests se ejecutan solo en algunos bloques

Los bloques 02, 05, 06 y 08 llevan `*_test.js`, porque la lógica del store es
**pura**: no toca el DOM y se testea en Deno, en microsegundos, sin navegador.
El 07 no lleva store propio, así que se prueban los del 06.

Los bloques 01, 03, 04 y 07 no llevan tests, porque su código de componentes
necesita `document`, `customElements` y `attachShadow`, y Deno no tiene nada de
eso. Su especificación es la lista de verificación manual de cada `README.md`.

Esto no es capricho ni una cuestión de purismo. Es la misma lección del bloque
04 de `ejercicios/`: **si una función no necesita el DOM, testéala sin el DOM.**
Cuando necesita el DOM, la alternativa no es un framework de testing: es mirar
la página.

## Cómo se usa

Los bloques van en orden, y cada uno empieza con el anterior. La idea es hacer
el bloque 01, luego el 02, y **mirar la diferencia**. No hace falta que el 01
esté terminado para empezar el 02.

Los TODOs que llevan `throw new Error("TODO ...")` están igual que en la serie
vieja: si algo funciona antes de que toques nada, no estás probando nada.

Y ojo con una cosa, porque es la trampa de esta serie: **esta serie no está para
dejarse terminada.** Se termina cuando puedas explicar por qué el bloque 07
tiene más código que el 03 y sin embargo hace menos.

## Si vienes de frameworks

Si vienes de React, Vue o Svelte, la mayoría de esta serie te va a sonar inútil,
y en parte tienes razón: para una app con estado compartido, routing y un equipo
de veinte personas, un framework te ahorra meses.

Lo que aquí se hace a mano es lo que un framework hace por ti, y verlo una vez
es lo que te deja de usarlo por magia:

- El bloque 02 es un `useState` escrito a mano, sin hooks.
- El bloque 05 es un evento que sube por el árbol, como un callback.
- El bloque 06 es un store con suscriptores, como una librería de estado.
- El bloque 07 es el aislamiento de estilos del que **todo** framework con
  CSS-in-JS te estaba escondiendo.
