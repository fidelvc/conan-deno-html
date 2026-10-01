# 06 · Actualizar

Añadir, editar y borrar. Y en vez de repintar la lista entera en cada cambio,
actualizar solo lo que ha cambiado.

```sh
deno task comp                  # http://localhost:8000/06-actualizar/
deno test componentes/06-actualizar/
```

## Qué hay aquí

| Fichero             | Qué cambia respecto al 05                                         |
| ------------------- | ----------------------------------------------------------------- |
| `store.js`          | `add`, `update`, `remove` y `reset`. El store **no muta** arrays. |
| `store_test.js`     | Doce tests, todos sobre los datos.                                |
| `character-card.js` | Ya no crea su propio botón: escucha el slot.                      |
| `character-list.js` | `patch` y `syncOrder`: reutilizar tarjetas.                       |
| `app.js`            | Un `switch` que decide cuánto repinta cada cambio.                |

## Los TODOs

| # | Dónde                   | Qué practicas                                   |
| - | ----------------------- | ----------------------------------------------- |
| 1 | `CharacterStore.add`    | Array nuevo, id único, recalcular el filtro     |
| 2 | `CharacterStore.update` | Patch con spread, y devolver si el id existe    |
| 3 | `CharacterStore.remove` | Filtrar y limpiar el estado que dependía del id |
| 4 | `store_test.js`         | Los doce tests                                  |
| 5 | `CharacterList.patch`   | Reutilizar tarjetas en vez de recrearlas        |

## Cómo se verifica

Tests primero: `deno test componentes/06-actualizar/`. Los doce tienen que
pasar.

En el navegador:

1. Escribe un nombre y dale a **Añadir**. Aparece al final, y el contador sube.
2. Añade "Manami" dos veces. La segunda se llama `manami-2`. **Pon el cursor en
   el campo de nombre antes de añadir la siguiente** y comprueba que el foco
   sigue ahí después: eso ya no se pierde, porque el formulario no se repinta.
3. **Escribe algo en el buscador, y con el buscador lleno añade un personaje.**
   Si aparece, el paso 5 del TODO 1 está hecho (recalcular `visible`). Es el
   fallo más común de este bloque.
4. **Cambia la búsqueda y vuelve a quitarla.** Las tarjetas que vuelven a
   aparecer son las mismas instancias, no otras: en la consola,
   `document.querySelector("character-card")` es el mismo objeto de antes.
5. **Ordena por una búsqueda que dé un subconjunto** (por ejemplo "hermana") y
   comprueba que el orden se respeta al volver a la lista completa. Si las
   tarjetas salen barajadas, `syncOrder` está mal.
6. Pulsa **Vaciar los añadidos**. Vuelven a ser 17, y las que secai del
   principio siguen ahí.
7. Marca un favorito, añade un personaje, y pulsa Vaciar. El favorito sigue
   marcado y el contador no se ha desincronizado.

## La idea

**El store no muta arrays.** Es la diferencia entre este bloque y el anterior, y
la que hace que el `patch` sea posible:

```js
// NO: muta el array que ya estaba en #visible y en el estado de un oyente
this.#characters.push(character);

// SÍ: array nuevo, el anterior intacto
this.#characters = [...this.#characters, character];
```

Con `push`, un oyente que compara referencias para ver si algo ha cambiado no ve
la diferencia. Con `[...array, nuevo]`, las referencias sí sirven, y por eso el
componente puede preguntar "¿esta tarjeta ya la tengo?".

**El store dice qué cambió, no solo que algo cambió.** Cada método avisa con un
tipo:

```js
{
  type: "added", id;
}
{
  type: "updated", id, character;
}
{
  type: "removed", id;
}
{
  type: "reset";
}
```

**Y el `switch` de `app.js` decide cuánto se repinta.** Esto es lo que hace el
bloque útil: la política de render vive en la página, no en el store ni en el
componente. El store no sabe qué es una tarjeta; la tarjeta no sabe qué es un
personaje en la base de datos.

**`patch` en vez de `render`.** En vez de tirar las 17 tarjetas y hacer 17
nuevas, el componente:

1. guarda las tarjetas en un `Map` de id a elemento,
2. para cada personaje, si ya tiene tarjeta, le hace `set character` encima,
3. si no, crea una y la añade con `append`,
4. y llama a `syncOrder`, que compara el orden pedido con el actual y mueve solo
   las que están fuera de sitio con `insertBefore`.

Ese paso 4 es el que casi nadie hace. Un `insertBefore` mueve un nodo **ya
montado**, sin recrearlo, y por eso no se pierde el foco ni el scroll de lo que
tuviera dentro. Reconstruir la lista entera es correcto y lento; comparar y
mover es rápido.

## Detalles que salen de verdad

- **`add` recalcula `visible`.** Si no, añades un personaje con una búsqueda
  puesta y no aparece. Hay test para eso.
- **`remove` limpia el favorito.** Un `Set` con el id de alguien que ya no
  existe es un id fantasma, y el contador de favoritos engaña. También hay test.
- **`add` desambigua ids repetidos.** Dos personajes con el mismo nombre no
  pueden compartir id, porque el id es la clave del `Map` del componente. Sin
  desambiguar, el segundo pisa al primero y desaparece uno.
- **`isFavorite` es un dato, no HTML.** Se pinta como `aria-pressed` para el
  lector de pantalla y como clase para el color. Esa separación es lo que
  permite que el bloque 07 no se rompa.

## Dónde está el problema todavía

Todo sigue en el light DOM, y eso significa que los estilos son globales:
`.character` en `assets/estilos.css` afecta a cualquier `.character` de la
página, y las tarjetas de esta lista comparten espacio con cualquier otra cosa.

Y hay un detalle que sale con el shadow root: el contenido del `<slot>` **sigue
en el light DOM**, así que aunque la tarjeta se encapsule, lo que metas en el
hueco sigue sin encapsular. El bloque 07 lo enseña, y es la razón por la que el
Shadow DOM no es la respuesta a todo.
