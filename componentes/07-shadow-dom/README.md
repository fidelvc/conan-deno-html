# 07 · Shadow DOM

La tarjeta se encapsula: lleva su propio shadow root y sus propios estilos. Y
los estilos de la página dejan de poder romperla, igual que los suyos dejan de
poder romper la página.

```sh
deno task comp                       # http://localhost:8000/07-shadow-dom/
deno test componentes/06-actualizar/  # los tests son los del 06
```

## Qué hay aquí

| Fichero                | Qué cambia respecto al 06                              |
| ---------------------- | ------------------------------------------------------ |
| `character-card.js`    | Un shadow root, un `<style>` propio, `composed: true`. |
| `character-list.js`    | Otro shadow root. El algoritmo de `patch` no cambia.   |
| `estilos-globales.css` | CSS de la página que **no** debe afectar a nada.       |
| `app.js`               | Una línea: el `store` se importa del bloque 06.        |
| `store.js`             | **No existe aquí.** Se reutiliza el del 06.            |

Que este bloque no tenga `store.js` es el argumento: el Shadow DOM es un asunto
de estilos, y se resuelve entero dentro de los componentes. Los datos no se
tocan, ni siquiera se copian.

## Los TODOs

| # | Dónde                       | Qué practicas                                  |
| - | --------------------------- | ---------------------------------------------- |
| 1 | `CharacterCard.constructor` | `attachShadow({ mode: "open" })` una sola vez  |
| 2 | `CharacterCard.character`   | `this.shadowRoot.querySelector`                |
| 3 | `CharacterList.patch`       | `patch` con shadow root, sin cambiar el código |

## Cómo se verifica

Tests primero: `deno test componentes/06-actualizar/`. Los doce del store, sin
cambios, y el store ni siquiera está en esta carpeta.

En el navegador:

1. **La prueba del bloque.** Abre `estilos-globales.css`: tiene
   `.character { color: red }`. Las tarjetas **no están rojas**. Quita ese
   bloque, recarga, y siguen sin estar rojas. Ese es el encapsulamiento.
2. **La prueba inversa.** Añade `character-card { color: red }` a
   `assets/estilos.css` y recarga. Tampoco pasa nada. En el 06, eso habría
   pintado las 17 tarjetas.
3. En la consola: `document.querySelectorAll("character-card").length` → 17. Los
   elementos se ven. Y
   `document.querySelector("character-card [data-field=name]")` → `null`. Su
   contenido, no. Esa diferencia es lo que más confunde.
4. En la consola: `document.querySelector("character-card").shadowRoot` → el
   shadow root, y `.host` es la propia tarjeta. Con `mode: "closed"` esto sería
   `null`.
5. **Rompe el setter a propósito**: cambia `this.shadowRoot.querySelector` por
   `this.querySelector` en el TODO 2. Recarga y lee el error. Es un `TypeError`
   sobre `null` que no parece tener nada que ver con el shadow DOM, y por eso
   está aquí.
6. Quita el `composed: true` del evento. Recarga, pincha en favorito: no pasa
   nada, y en la consola no hay ningún evento. El evento se quedó dentro de la
   tarjeta.
7. Todo lo demás igual que el 06: buscar, añadir, favoritos, vaciar.

## La idea

**`attachShadow` se llama una vez, en el constructor.** Y no desde el setter,
que es donde se llama dos veces en cuanto hay dos tarjetas. La segunda vez lanza
`NotSupportedError`.

Por eso el template se clona **dentro** del shadow root, en el constructor, y el
setter solo busca dentro con `this.shadowRoot.querySelector`. Cada tarjeta tiene
su DOM; el shadow root es siempre el mismo.

**El shadow root es una frontera de estilos, no de selectores.** El host se ve
desde fuera (`document.querySelectorAll("character-card")` funciona), su
interior no. Y con `mode: "open"` por defecto, `closed` no es más seguro:
significa que las herramientas de desarrollo y los tests no pueden mirar dentro.
La encapsulación aquí es de CSS.

**Los eventos necesitan `composed: true`.** Un evento que sale del shadow root
hacia fuera es un evento compuesto, y hay que pedirlo explícitamente. Sin esa
línea, todo el flujo de favoritos del bloque 05 se rompe en silencio: la tarjeta
emite, y el evento no sale de la tarjeta.

## La línea que corta la encapsulación

Y aquí está la parte que el bloque quiere que entiendas, porque es la que decide
cuándo usas Shadow DOM y cuándo no:

**Lo que entra por un `<slot>` sigue en el light DOM.**

El shadow root reparte el contenido del slot, pero no lo mueve ni lo copia. Así
que en este bloque:

- los estilos **de dentro** del shadow root sí aplican a la tarjeta,
- los estilos **de fuera** de la página siguen aplicando a lo que metas en el
  `<slot>`,
- y por eso el `<style>` de la tarjeta usa `::slotted(button.favorite)` para
  tocar el botón: es el único selector que alcanza el light DOM desde dentro.

Prueba: quita el `::slotted` y el botón pierde el margen. Añade
`button.favorite { display: none }` a `assets/estilos.css` y el botón
desaparece, aunque la tarjeta esté completamente encapsulada.

## Cuándo no usar Shadow DOM

Porque el bloque 07 hace que el 06 parezca pequeño, y no siempre conviene:

- **Un solo `<style>` inline**, si el componente son diez líneas. El coste de un
  shadow root es un nodo más, una frontera de selectores que te va a estorbar al
  debuggear, y una fuente de estilos que ya no se ve desde el inspector de la
  página.
- **Necesitas que el CSS de la página llegue dentro**, porque el componente
  depende del tema, de las variables globales, o de un sistema de diseño. Con un
  shadow root, `--border` deja de heredarse.
- **Formularios y validación**: los formularios dentro de un shadow root no
  participaban en `FormData` del formulario exterior. Con `ElementInternals`
  esto se arregla, pero es un API que no vas a necesitar mañana.
- **Accesibilidad**: el CSS de fuera puede no alcanzar el contenido slotted, y
  un `label[for]` exterior no encuentra el input de dentro.

En la práctica, casi todos los frameworks que usan Shadow DOM lo hacen con
caveats enormes por esto. Un shadow root es una respuesta buena a "mi CSS se
rompe con el CSS de otros", y una mala respuesta a todo lo demás.
