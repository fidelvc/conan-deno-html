# 04 · Slots

La tarjeta ya no pinta su contenido: lo recibe. Quien la usa decide qué va
dentro, y la tarjeta solo decide dónde.

```sh
deno task comp   # http://localhost:8000/04-slots/
```

## Qué hay aquí

| Fichero             | Qué cambia respecto al 03                                |
| ------------------- | -------------------------------------------------------- |
| `character-card.js` | Añade un `<slot>`. Nada más.                             |
| `character-list.js` | Rellena el slot. Ya no conoce el interior de la tarjeta. |
| `app.js`            | **No cambia.**                                           |

Que `app.js` no cambie es el objetivo del bloque. La página no sabe que la
tarjeta ha cambiado de dentro a fuera.

## Los TODOs

| # | Dónde                      | Qué practicas                                       |
| - | -------------------------- | --------------------------------------------------- |
| 1 | `badgeFor`                 | Devolver HTML o `""`. Saber cuándo callarse.        |
| 2 | `CharacterList.characters` | Rellenar un slot por tarjeta sin conocer la tarjeta |

## Cómo se verifica

1. Al cargar, se ven las 17 tarjetas, y **solo Kyousuke y Kirino tienen badge**,
   porque son los únicos con `age` en el dataset.
2. Fíjate en el hueco: en los otros quince no hay nada, ni una marca, ni un
   espacio raro. Eso es el `""` del TODO 1.
3. En la consola: `document.querySelector("character-card").innerHTML` enseña el
   template clonado más el badge.
4. Añade otra etiqueta a Kyousuke en el dataset, recarga, y comprueba que el
   badge sigue saliendo y que la tarjeta siguiente no lo ha copiado.
5. **Prueba esto, que es el punto del bloque**: quita el `<slot></slot>` del
   template en `index.html`, recarga, y todos los badges desaparecen. Luego
   muévelo al principio de la tarjeta, recarga, y ahora salen arriba. El
   componente `character-card.js` no ha cambiado ni una línea: el hueco se llama
   desde fuera.

## La idea

El intercambio del bloque, en dos líneas:

```js
// 03 · la lista sabe qué hay dentro de la tarjeta
`<h2>${escapeHtml(character.name)}</h2>`;

// 04 · la lista sabe la interfaz, y decide solo qué va en el hueco
card.innerHTML = badgeFor(character);
```

Antes, para añadir una etiqueta nueva a la tarjeta había que tocar la tarjeta
**y** la lista, porque la lista construía el interior. Ahora se toca la tarjeta
y no se toca la lista. Ese es el punto entero de la composición.

Y por eso aquí vuelve `escapeHtml`, después de haber desaparecido en el 03. No
es un retroceso: el interior de la tarjeta es HTML de verdad, y lo único que
sigue siendo cadena es el contenido del hueco, que es por definición HTML
elegido por quien compone. `badgeFor` escapa, y a partir de ahí el HTML es
nuestro.

## Lo que un `<slot>` no hace

No copia nada: **reparte**. Si metes el mismo nodo en dos slots, el segundo no
lo enseña, y no salta ningún error. Es el primer tropiezo de todo el bloque.

Y fíjate en que la tarjeta no borra el contenido del slot. En el setter
`character` hay un `replaceChildren` que se come todo, incluidos los nodos del
usuario, y `badgeFor` funciona por casualidad: porque en la lista siempre se
rellena el slot después. Si el slot se rellenara una vez y luego cambiara la
búsqueda, la segunda pasada se comería el badge. Es un bug de verdad, y no se ve
porque todavía nadie ha escrito ese caso. El bloque 05 lo escribe.

## Dónde está el problema todavía

El contenido del slot se calcula **una vez**, al pintar, y no vuelve a cambiar
aunque el personaje cambie. Pincha en la tarjeta: no pasa nada, porque no hay
nada que pasar. No hay eventos, y sin eventos no hay forma de que un clic en la
tarjeta llegue al store.

Ese es el bloque 05.
