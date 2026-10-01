# 05 · Modificar

El estado cambia: marcas favoritos, y la tarjeta lo refleja. El clic ocurre en
la tarjeta, el dato vive en el store, y entre los dos hay un `CustomEvent`.

```sh
deno task comp                  # http://localhost:8000/05-modificar/
deno test componentes/05-modificar/
```

## Qué hay aquí

| Fichero             | Qué cambia respecto al 04                             |
| ------------------- | ----------------------------------------------------- |
| `store.js`          | Un estado más: `favoriteIds`, un `Set`.               |
| `character-card.js` | Un botón que lanza un `CustomEvent`.                  |
| `character-list.js` | Escucha a las tarjetas y reenvía. No conoce el store. |
| `app.js`            | Conecta el evento con el store. Cuatro líneas.        |
| `store_test.js`     | Los tests del `toggleFavorite`.                       |

## Los TODOs

| # | Dónde                             | Qué practicas                                    |
| - | --------------------------------- | ------------------------------------------------ |
| 1 | `CharacterStore.toggleFavorite`   | `Set` con `add` y `delete`, y devolver el estado |
| 2 | `CharacterCard.favoriteChanged`   | `CustomEvent` con `bubbles` y `detail`           |
| 3 | `CharacterList.connectedCallback` | Escuchar, reenviar **una vez**, y darse de baja  |

## Cómo se verifica

Tests primero: `deno test componentes/05-modificar/`.

Y luego, en el navegador:

1. Pincha en el botón de favorito de Kyousuke. El botón cambia de aspecto y el
   contador de favoritos sube a 1.
2. Vuelve a pinchar. Baja a 0. El `Set` hace el trabajo solo.
3. Busca `ruri` y pincha en su favorito. Vuelve a la lista completa con el
   buscador vacío: el favorito de Ruri **sigue ahí**. El filtro no puede perder
   el estado.
4. **Repite el 1 cinco veces seguidas.** El contador no se desincroniza, y el
   listado no se repinta cinco veces. Si se repinta de más, es el bug del
   `connectedCallback` sin darse de baja.
5. En la consola: `document.querySelector("character-list").character.length`. Y
   `character-list.addEventListener("character-favorite", ...)` a mano, para ver
   el `detail` que lleva el evento.
6. **Abre la pestaña con las 17 tarjetas y pincha rápido en dos tarjetas
   distintas.** Solo las que has pulsado quedan marcadas.

## La idea

La ruta de un clic, de abajo arriba:

```
character-card  lanza  "character-favorite" con detail: { id }
      ↓ bubbles
character-list  reenvía el mismo evento, una sola vez
      ↓ bubbles
app.js          store.toggleFavorite(id)
      ↓
CharacterStore  cambia #favoriteIds y llama a #notify()
      ↓
app.js          render(state) → list.characters = state.visible
      ↓
character-card  recibe su personaje otra vez, ya con isFavorite = true
```

Cuatro saltos, y en ninguno la tarjeta decide nada. Solo dice qué ha pasado.

**Por qué un `Set` y no `character.favorite = true`.** El `Set` separa dos cosas
que el otro enfoque mezcla: el dataset, que viene del servidor y es de todos, y
el estado de la aplicación, que es tuyo. En el bloque 06 se serializa el store,
y ahí se nota: con la bandera en el personaje, el favorito acaba guardado en el
sitio donde solo deberían estar datos de lectura.

**Por qué `CustomEvent` y no un callback.** Con un callback, cada nivel del
árbol reenvía:

```js
card.onFavorite = () => list.onCardFavorite();
list.onCardFavorite = () => store.toggleFavorite(id);
```

Con un nivel más, otro reenvío, y el componente queda atado a la forma de su
árbol. Con eventos, la tarjeta lanza y ya está: quien esté escuchando, lo oye.

**Y la parte incómoda**, que es la que de verdad enseña el bloque. La tarjeta
lanza un evento por instancia. Pinchas en una, y esa. Pero si la lista reenvía
sin mirar, el evento sale **una vez por tarjeta** —17 veces— y `toggleFavorite`
se llama 17 veces con el mismo id. Con `bubbles: true` y un `dispatchEvent` en
el `connectedCallback` ingenuo, eso es exactamente lo que pasa.

La solución son las dos opciones del TODO 3, y las dos tienen un coste:

- `stopPropagation` en la tarjeta: fácil, pero impide que un ancestro legítimo
  escuche el evento original. Rompes la reusabilidad, que es justo lo que acabas
  de construir.
- Marcar el evento (`event.detail.forwarded = true`), comprobar en la lista si
  ya viene reenviado, y reenviar solo una vez. Más código, cero coste para quien
  esté arriba.

Y el otro bug del bloque, que es más discreto: **`connectedCallback` se llama
cada vez que el elemento entra en el documento**, no solo la primera. Si
registras un oyente sin quitar el anterior, cada montaje suma otro. El punto 4
de la verificación es para cazarlo.

## Dónde está el problema todavía

Fíjate en que toda modificación pasa por `render(state)`, que **repinta la lista
entera**. Con 17 tarjetas no se nota. Con 500, o con un `input` en cada tarjeta,
se nota muchísimo: pierdes el foco, el scroll, y la posición del ratón.

Ese es el bloque 06.
