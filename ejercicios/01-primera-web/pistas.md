# Pistas · Bloque 01 · Tu primera web

Las hay porque los tests fallan a propósito. Si prefieres pelearte con ellos
solos, esta es la lista de pistas; si te atascas, vuelve aquí.

---

## 1 · Por qué no ves el formulario

El formulario **sí está** en `pages/index.html`. No aparece en el navegador
porque el servidor nunca llega a enviarte la página: revienta antes.

Lo que pasa por cada petición a `/`:

```
handler            server.ts:220
  └─ serveIndex    server.ts:183
       ├─ lee pages/index.html del disco
       ├─ filterCharacters(CHARACTERS, query)   ← TODO 1, aún lanza
       ├─ renderCharacters(...)                 ← TODO 3, aún lanza
       └─ injectInto(...) × 2  (rellena <!-- cards --> y <!-- query -->)
```

`serveIndex` no devuelve nunca nada: la excepción sube hasta `Deno.serve`, y
Deno responde **500 Internal Server Error** con su propia página de error. Tu
`index.html` entero —cabecera, formulario, contador, rejilla — viaja dentro de
esa respuesta que nunca se construye. Por eso no ves ni el formulario ni las
tarjetas: no es que falte el formulario, es que falta la página.

Eso también explica lo de "no encuentro el personaje": el 500 no es un personaje
que no exista, es tu código lanzando. En cuanto los tres TODOs de `server.ts`
devuelvan algo en vez de lanzar, la página aparece.

**Moraleja que ya te topas en el bloque 02:** en un handler, cualquier excepción
se convierte en un 500 opaco. Cuando algo "no aparece", mira primero la terminal
donde corre `deno task ej01`: ahí está la traza del `throw`.

## 2 · El orden correcto

Son cinco TODOs, y solo tres están en TypeScript:

| # | Dónde                             | De qué depende              |
| - | --------------------------------- | --------------------------- |
| 1 | `server.ts` · `filterCharacters`  | de `searchText`             |
| 2 | `server.ts` · `searchText`        | —                           |
| 3 | `server.ts` · `renderCharacters`  | de `searchText`             |
| 4 | `public/app.js` · `matchesQuery`  | de que 3 pinte las tarjetas |
| 5 | `public/app.js` · `describeCount` | —                           |

**La numeración es el orden en que están en el fichero, no el orden en el que
conviene escribirlas.** `filterCharacters` es el TODO 1, pero no lo puedes
escribir hasta que exista `searchText`, porque cada personaje se compara contra
el texto que produce esa función. Por eso el orden de trabajo es:

```
searchText (2)  →  filterCharacters (1)  →  renderCharacters (3)  →  app.js (4, 5)
```

Los dos de `app.js` van **al final**, y tu `matchesQuery` no se puede probar
hasta que el servidor pinte las tarjetas. `app.js` busca elementos con
`[data-buscar]` (`public/app.js:21`), y ese atributo lo pone el TODO 3. Con el
servidor roto no hay tarjetas, no hay nada que filtrar, y cualquier cosa que
escribas ahí se queda sin poder probar.

Un aviso: **los dos TODOs de `app.js` no los cubre ningún test.**
`deno task test` solo mira ficheros `.ts`, así que ahí el comprobador eres tú:
escribe en el buscador, mira la consola con F12, y comprueba que el contador y
el texto de "vacío" cambian. La ventaja de esto es que ves el resultado al
instante; la desventaja es que nadie te avisa si te equivocas.

---

## 3 · Las cinco tareas, una a una

### TODO 2 · `searchText(character)` → `string` ← **empieza por aquí**

Lo que tiene que devolver: **una sola cadena en minúsculas** con todo lo
buscable de ese personaje, y nada más. Nada de HTML, nada de espacios raros.

Métodos que entran aquí: los de `Array` (`push`, `join`) y los de `String`
(`toLowerCase`). Piensa en qué campos entran: el `name` siempre; el `nameKana`
también (buscar "五更" debería encontrar a Ruri); el `alias` cuando exista; y
las `tags`, porque el buscador tiene que encontrar a Kanako escribiendo "idol".

Trampas concretas, con su test:

- **El `alias` es opcional.** Kyousuke no tiene. Si lo metes en la lista de
  campos y haces el `join` sin más, el `undefined` se convierte en la palabra
  `"undefined"` dentro de la cadena, y buscar "und" le encuentra a todo el
  mundo. Test: _"searchText nunca deja un 'undefined' suelto"_
  (`server_test.ts:63`).
- **Los espacios.** Si el hueco del alias vacío lo dejas como cadena vacía,
  quedan **dos espacios seguidos** en medio de la frase. No rompe la búsqueda,
  pero ensucia el atributo y el test lo comprueba con todos los personajes:
  _"searchText no deja espacios dobles"_ (`server_test.ts:72`).
- **Las mayúsculas.** El resultado entero tiene que estar en minúsculas, y el
  test lo recorre entero. Test: _"searchText está en minúsculas"_
  (`server_test.ts:56`).

Piensa en esto: la salida de esta función va a meterse dentro de un atributo
HTML (`data-buscar=...`), entre comillas. ¿Qué pasaría si un nombre tuviera
comillas dentro? Eso lo resuelve el TODO 3.

### TODO 1 · `filterCharacters(characters, query)` → `Character[]`

Lo que tiene que devolver: los personajes que coinciden con la búsqueda. Si la
búsqueda está vacía, **todos**: una búsqueda vacía no debe ocultar nada, y esa
es la diferencia entre un buscador útil y uno que parece roto.

Métodos: `filter` (que devuelve un array nuevo, no toca el original) e
`includes` para comprobar si el texto buscado aparece dentro del texto del
personaje. Y antes, normalizar: la búsqueda que llega de la URL puede venir con
mayúsculas y con espacios alrededor.

Las dos normalizaciones van **a la query** (`"  Kirino "` → `"kirino"`). ¿Por
qué? Porque el test _"filterCharacters ignora mayúsculas y espacios sobrantes"_
(`server_test.ts:108`) compara el resultado de `"  Kirino "` con el de
`"kirino"` y exige que sean idénticos.

Detalles que se te pueden pasar:

- **No mutes el array de entrada.** `sort` muta; `filter` no. Test explícito:
  _"filterCharacters no muta el array original"_ (`server_test.ts:131`).
- **Sin coincidencias devuelve `[]`**, no `null`, ni `undefined`, ni una cadena
  vacía. Test: `server_test.ts:127`.
- **Un nombre devuelve más de una persona, y es correcto.** El dataset pone
  "Kirino" en las etiquetas de Ayase, Manami y Meruru, así que buscar "kirino"
  devuelve cuatro. El test lo fija como comportamiento esperado
  (`server_test.ts:98`), no como bug. Si te parece raro, es que el buscador está
  funcionando: por eso buscas una etiqueta y no solo un nombre.

### TODO 3 · `renderCharacters(characters)` → `string`

Lo que tiene que devolver: el HTML de las tarjetas, ya pegado y **listo para
meter dentro del `<ul>`**, sin el `<ul>` alrededor. El contrato exacto está en
el docstring, pero aquí va desglosado, porque los tests son muy literales:

- Un `<li class="personaje" data-buscar="...">` por personaje, y el
  `data-buscar` es lo que devuelva `searchText`.
- Dentro, un `<h2>` con el `name`.
- Si hay alias, un `<p class="alias">` con el texto "también conocida como
  Kuroneko". Si no hay, ese `<p>` **no aparece en absoluto**: el test
  `server_test.ts:166` comprueba que la palabra "también conocida como"
  desaparece para Kyousuke.
- Después, un `<ul class="etiquetas">` con un `<li>` por cada tag. El test
  `server_test.ts:170` cuenta los `<li>` que hay **después** de
  `class="etiquetas"`, así que el orden importa.
- Si la lista está vacía, devuelve la cadena vacía. Nada de texto de "no hay
  resultados" aquí: eso lo pone el `<p id="vacio">` que ya está en el HTML.

Métodos: `map` para convertir cada personaje en su trozo de cadena, y `join`
para pegarlos.

Trampas concretas:

- **El pegado, no las comas.** `map` te devuelve un array de cadenas, y hay que
  pegarlo con `join("")`. Si lo concatenas de otra manera, el array se convierte
  a texto con comas entre elementos y aparecen tarjetas del estilo `</li>,<li>`.
  El test `server_test.ts:179` caza exactamente eso.
- **Escapa el `data-buscar`.** Aquí sí hace falta `escapeHtml`, que ya tienes
  escrita y exportada en `server.ts:141`, porque el texto va entre comillas
  dobles dentro de un atributo. El test `server_test.ts:273` inventa un
  personaje llamado `Safinata "$&"` y comprueba que sale escapado. Fíjate en que
  el dataset real no tiene nada peligroso: el test se lo inventa. Es aviso de
  que en cuanto metas texto de la URL en el HTML, esto es obligatorio.

### TODO 4 · `matchesQuery(card, query)` → `boolean` (en `app.js`)

Lo que tiene que devolver: `true` si la tarjeta se queda a la vista. Ya lo
tienes medio hecho, así que esto es corto. Revisa dos cosas:

- **La búsqueda vacía tiene que dejar todo visible.** Sin este caso, con el
  input borrado desaparecen todas las tarjetas y la página parece rota.
- **El `trim` no debería estar dos veces.** En `applyFilter` (`app.js:65`) la
  query ya viene normalizada. Repetir el recorte no rompe nada, pero si un día
  alguien llama a `matchesQuery` desde otro sitio con una query sin recortar, el
  comportamiento sería distinto según por dónde entre. Decide dónde vive la
  normalización y quédate con una.

Ojo con una tentación: aquí **no** busques en el `textContent` de la tarjeta.
Existe el atributo `data-buscar` justo para esto, y el servidor lo dejó
normalizado. Si el navegador filtra por un sitio y el servidor por otro, la
página miente, y es justo lo que el README avisa de que hay que comparar.

### TODO 5 · `describeCount(visible, total)` → `string` (en `app.js`)

Lo que tiene que devolver: el texto del contador, listo para meter en
`#contador`. Solo eso; de escribirlo se encarga `applyFilter` (`app.js:74`).

Lo importante es el **plural**: "1 personaje" y "0 personajes" no se escriben
igual, y "17 personajes" tampoco. Y `visible` nunca es mayor que `total`, así
que no hace falta el caso "más de".

La pista de que se puede hacer con `filter` + `.length` es literal: en este
punto ya tienes un array de tarjetas a mano, así que puedes contar cuántas
cumplen la condición **sobre el array**, sin volver a recorrer el DOM. En
`applyFilter` ya se cuenta con un contador, pero `describeCount` recibe los dos
números como parámetros, así que tu trabajo es solo redactar.

---

## 4 · Los tests son la especificación

Corre solo este bloque mientras trabajas en él:

```sh
deno test --allow-read=. ejercicios/01-primera-web/
```

No hace falta `--allow-net` porque el `handler` es una función normal: recibe un
`Request` y devuelve un `Response`, sin servidor de por medio. Por eso los tests
van en milisegundos y por eso puedes probar el HTML generado sin abrir nunca el
navegador.

Cómo leer un fallo:

- `AssertionError` con dos cadenas distintas → el contrato está en el mensaje
  del test, léelo entero antes de tocar nada.
- `Error: TODO 1: implementa filterCharacters` → esa función sigue sin
  implementarse. Ojo: este error **arranca en cascada**. Si `filterCharacters`
  lanza, los tests de `renderCharacters` y los del `handler` también fallan,
  aunque no tengan nada que ver. Cuando veas muchos fallos a la vez, empieza por
  el más bajo de la lista y vuelve a mirar.
- Un test que pasa sin que hayas escrito nada → no lo arregles, está bien.

Los tests del `handler` son los que te dicen si la página entera funciona. Los
tres últimos que te importan:

- `GET /` responde 200 con `content-type` de HTML.
- `GET /?q=kirino` solo pinta a Kirino y **no** a Ruri.
- `GET /?q=<script>` sale escapado en la respuesta.

Ese último es el motivo de que `escapeHtml` esté en el handler y no solo en el
TODO 3: la búsqueda viene de la URL, y lo que viene de la URL es del visitante.

---

## 5 · "Pongo un nombre y no aparece"

Que un nombre no encuentre a nadie **es el resultado correcto** si ese nombre no
está en `datos/personajes.ts`. El buscador no adivina: filtra lo que hay. Con el
dataset actual, "kirino", "kuroneko", "idol", "gothic lolita" o "magical girl"
encuentran a alguien; "Oreimo" o el nombre de un personaje que no esté en la
lista, no.

Y hay un caso intermedio que sorprende: buscar un nombre puede devolver
**varias** tarjetas. Ya está explicado arriba, en el TODO 1, y el test
`server_test.ts:98` lo fija como lo correcto.

Cuando esto funcione, el orden en el que se ve cada cosa es este:

1. El servidor pinta las tarjetas y devuelve el HTML completo.
2. `app.js` carga al final del `<body>`, lee `form.dataset.query` y pone ese
   texto en el input. Por eso recargar con `?q=kirino` no pierde la búsqueda.
3. `applyFilter` se llama una vez al final, y por eso el contador y el texto de
   "vacío" ya están bien desde el primer momento, sin esperar a que escribas.

---

## 6 · Comprobaciones manuales

Con `deno task ej01` corriendo en otra terminal:

```sh
curl -s http://localhost:8000/ | head -50
curl -s "http://localhost:8000/?q=kirino"
curl -s http://localhost:8000/app.js | head -20
```

Qué mirar:

- Con una búsqueda vacía, `<!-- cards -->` y `<!-- query -->` tienen que haber
  desaparecido. Si siguen ahí, `injectInto` no encontró el marcador: suele ser
  un espacio de más en el comentario del HTML.
- Con `?q=kirino`, el `data-query="kirino"` tiene que estar relleno. Eso es lo
  que hace que el input salga escrito al recargar.
- `app.js` tiene que servirse con `content-type: text/javascript`. Si tu
  navegador lo rechaza, casi siempre es por el `type="module"` del `<script>` o
  por un error de sintaxis en el fichero, y lo ves en la consola con F12.
- El contador y el texto de "vacío" solo existen si `app.js` se ha ejecutado. Si
  no se mueven al escribir, el problema es JavaScript, no el servidor.
