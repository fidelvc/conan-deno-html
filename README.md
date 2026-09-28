# deno-con-html · Serie de ejercicios

Cinco ejercicios para aprender Deno, HTML y los métodos de JavaScript usando
como dominio un dataset de personajes de _Oreimo_. Cada bloque parte de un
código que ya funciona y te pone un `TODO` encima. Los tests te dicen qué se
espera, así que no hace falta que te sepas el tema de memoria: te lo enseñan
fallando.

Todo lo que hay aquí está pensado para abrirse, leerlo y romperlo. No hay build,
ni `node_modules`, ni framework.

## Requisitos

- **Deno 2.9 o superior.** Nada más. No hay `npm install`.

```sh
deno --version
```

Las dependencias (aquí solo `@std/assert`) se resuelven por JSR y se fijan en
`deno.lock`, que ya está en el repo.

## Cómo se usa

Hay dos cosas que vas a hacer todo el rato:

```sh
deno task ejXX     # levantar el servidor del bloque XX en http://localhost:8000
deno task test     # correr todos los tests (van a fallar: eso es el ejercicio)
```

Y las de mantenimiento, que deberían pasar siempre:

```sh
deno task check      # tipado
deno task lint       # reglas de estilo
deno task fmt        # formatear
deno task fmt:check  # comprobar el formato (lo que corre CI)
```

> **Por qué los tests fallan y eso está bien.** Cada función que tienes que
> escribir empieza con `throw new Error("TODO ...")`. Un test que pasa antes de
> que hagas nada no estaría probando nada. Cuando un bloque esté completo, su
> sección entera se pone en verde; los demás siguen en rojo. Por eso el paso de
> tests está comentado en el CI: si no, el pipeline siempre estaría rojo.
>
> Para ver si lo has resuelto, mira los tests de **tu** bloque, no el total.

## Estructura

```
datos/personajes.ts          El dataset. 17 personajes, 7 grupos, relaciones.
main.ts                      El bloque 00: el "hello world" que crea deno init.
ejercicios/
  01-primera-web/            Servir HTML, formularios GET, eventos DOM
  02-rutas/                  Enrutado, plantillas, XSS y path traversal
  03-layout/                 Layout y componentes sin plantillas
  04-datos/                  Métodos de array: filter, map, reduce, sort
  05-formularios/            POST, validación y el patrón PRG
```

Cada bloque es autónomo: repite su propia `escapeHtml` en vez de importarla de
otro bloque, para que puedas abrir el 04 sin haber hecho el 03.

## Los bloques

### 00 · `main.ts` (hecho)

El esqueleto que genera `deno init`: un `handler` que devuelve HTML en `/` y
JSON en `/api`, y `Deno.serve(handler)` al final. Solo para tener una referencia
de cómo se ve un servidor completo. No hay que tocarlo.

### 01 · Primera web · `deno task ej01`

Sirve una página estática, un formulario `GET` y un `app.js` que mejora el
formulario en el navegador.

| TODO | Fichero         | Qué practicas                                       |
| ---- | --------------- | --------------------------------------------------- |
| 1    | `server.ts`     | `filter`: qué personajes casan con una búsqueda     |
| 2    | `server.ts`     | Normalizar antes de comparar (mayúsculas, espacios) |
| 3    | `server.ts`     | Generar HTML con un `map` + `join("")`              |
| 1    | `public/app.js` | `matchesQuery`: replicar el filtro en el cliente    |
| 2    | `public/app.js` | `describeCount`: un texto que cambia con el número  |

Son **cinco** TODOs, pero solo tres están en TypeScript. Los de `app.js` son el
mismo filtro escrito en el navegador, y por eso merece la pena comparar los dos:
si el navegador y el servidor filtran de forma distinta, la página miente.

La idea de fondo: el formulario funciona **sin JavaScript** (es un `GET`
normal). `app.js` solo lo hace más rápido. Eso se llama mejora progresiva, y es
la diferencia entre una web que funciona y una web que se rompe.

### 02 · Rutas · `deno task ej02`

Un enrutador a mano, con plantillas, redirecciones y las dos Vulnerabilidades
clásicas de un servidor de ficheros.

| TODO | Fichero    | Qué practicas                                                  |
| ---- | ---------- | -------------------------------------------------------------- |
| 1    | `rutas.ts` | `isSafePathSegment`: qué segmentos de URL son legítimos        |
| 2    | `rutas.ts` | `resolveRoute`: `/personajes/:id` y redirección canónica (301) |

Aquí solo hay dos TODOs, pero importan mucho, porque en el servidor ya está
resuelto lo peligroso y hay que entender **por qué** está así:

- `escapeHtml` y `injectInto` están hechos, y `injectInto` es deliberadamente
  frágil. Sustituir un marcador `<!-- titulo -->` con `String.replace` parece
  inofensivo y no lo es: si el contenido tiene un `$&` o un `$1`, el `replace`
  lo interpreta como grupo de captura. En `server_test.ts` hay un personaje cuyo
  nombre lleva esos caracteres, precisamente para que lo veas.
- La resolución de rutas ya **descarta** `..` antes de tocar el disco. Con
  `isSafePathSegment` sin implementar, el servidor se limita a servir, que
  tampoco es una política de seguridad, pero es un fallo visible.
- La demostración importante: la versión ingenua de esta lógica consigue leer
  `/etc/passwd`. La que hay aquí, no. Se puede comprobar.

### 03 · Layout · `deno task ej03`

Cero ficheros `.html`. Todas las páginas se generan con funciones.

| TODO | Fichero          | Qué practicas                                  |
| ---- | ---------------- | ---------------------------------------------- |
| 1    | `layout.ts`      | `nav`: el patrón de "devuelve `""` si no toca" |
| 2    | `layout.ts`      | `layout`: la página entera en una plantilla    |
| 3    | `componentes.ts` | `tagList` y `relationshipList`: listas         |
| 4    | `componentes.ts` | `characterCard`: componer y escapar a la vez   |

`escapeHtml` se usa en TODO. Quítalo de `layout` y mira cómo los tests lo
detectan: no para que la página se vea mal, sino porque el HTML de un personaje
con `<` en la descripción podría inyectar etiquetas.

### 04 · Datos · `sin servidor`

No hay `Deno.serve` aquí, y esa es la lección: **una función pura se testea
sola**, sin servidor, sin puertos, sin red. Los tests corren en microsegundos.

| TODO | Fichero      | Qué practicas                                      |
| ---- | ------------ | -------------------------------------------------- |
| 1    | `queries.ts` | `filter`                                           |
| 2    | `queries.ts` | `filter` + `includes` + normalizar mayúsculas      |
| 3    | `queries.ts` | `sort` y la trampa de que **muta** el array        |
| 4    | `queries.ts` | `reduce` a un objeto de contadores                 |
| 5    | `queries.ts` | `reduce` a un objeto de arrays                     |
| 6    | `queries.ts` | `find` + `flatMap`, y `Set` para quitar duplicados |
| 7    | `queries.ts` | `reduce` y la diferencia entre `0` y `null`        |

Dos trampas del dataset hacen que este bloque no sea trivial:

- **Solo hay 2 edades** en 17 personajes. Los demás no las tienen, y por eso
  `ordenarPorEdad` y `edadMedia` tienen que saber qué hacer con los huecos.
- **Las relaciones no son simétricas.** Ruri declara a Kyousuke; Kyousuke no
  declara a Ruri. Hay un test que lo fija, para que nadie lo "arregle" por
  error.

Y una trampa de JavaScript, que el TODO 3 documenta a fondo: multiplicar el
comparador por `-1` para invertir el orden **no funciona** cuando hay `Infinity`
de por medio. Pasa en `asc` y se rompe en `desc`. Hay tests para los dos órdenes
por eso.

```sh
deno test ejercicios/04-datos/     # no necesita ni --allow-read
```

### 05 · Formularios · `deno task ej05`

Del `GET` del bloque 01 al `POST`: el navegador manda datos en el cuerpo de la
petición y el servidor decide qué hacer con ellos.

| TODO | Fichero         | Qué practicas                                                      |
| ---- | --------------- | ------------------------------------------------------------------ |
| 1    | `formulario.ts` | `FormData.get()` y por qué devuelve `string \| File \| null`       |
| 2    | `formulario.ts` | Validar y devolver **todos** los errores, no solo el primero       |
| 3    | `formulario.ts` | `normalize("NFD")` para quitar acentos y hacer slugs               |
| 4    | `formulario.ts` | Sticky form: reenviar el formulario con lo que ya escribiste       |
| 5    | `formulario.ts` | Un 303 construido a mano (`Response.redirect` no acepta relativas) |
| 6    | `server.ts`     | El flujo entero del POST                                           |

Lo importante de este bloque es el **PRG** (Post / Redirect / Get):

```
POST /nuevo  →  303  →  GET /personajes/sena-akagi
```

Si después de guardar devuelves el HTML de "gracias", el F5 del navegador vuelve
a mandar el POST y guardas el mismo personaje otra vez. El 303 no lleva cuerpo:
le dice al navegador "ya está, ahora pide esta URL". Como el siguiente paso es
un GET, recargar es inofensivo.

Dos errores que verás caer si los haces:

- `Response.redirect("/personajes/...")` lanza `TypeError: Invalid URL`. La API
  exige una URL **absoluta**. O construyes el `Response` a mano, o usas
  `new Response(null, { status: 303, headers: { location: destino } })`.
- `await request.formData()` **lanza** si el `Content-Type` no es
  `application/x-www-form-urlencoded` ni `multipart/form-data`. No devuelve un
  `FormData` vacío. En los tests, el helper `form()` monta la petición como lo
  haría un `<form>` de verdad, con `URLSearchParams` y la cabecera puesta a
  mano.

Y el recordatorio de siempre: el `nombre` que escribe el usuario vuelve a la
página en el `value` y en el listado. Sin `escapeHtml`, eso es XSS. Hay tests
que mandan `<script>alert(1)</script>` y comprueban que sale como texto.

## Sobre el dataset

`datos/personajes.ts` es un **subconjunto curado para practicar**, no una base
de datos verificada. Se han incluido solo datos confirmables y lo que falta está
marcado como tal:

- `age` solo aparece en Kyousuke (17) y Kirino (14).
- `seiyuu` se omite en Manami porque las fuentes discrepan.

Los ids de las relaciones apuntan a personajes del propio dataset, pero apuntar
a alguien que no está no rompe nada: `relacionadosCon` lo descarta. Esa es la
diferencia entre un dataset de juguete y uno real.

## Despliegue

Localmente todo funciona con `deno task ejXX`. Para producción hay tres caminos,
de menos a más, o de menos a más control.

**Nada de esto es necesario para hacer los ejercicios.** Es para entender qué
cambia cuando el código sale de tu máquina.

### 1 · Deno Deploy

```sh
deno install -g -A jsr:@deno/deployctl
deployctl deploy --project=oreimo ejercicios/05-formularios/server.ts
```

- Es lo más rápido, y lo único para lo que no hace falta poner una tarjeta ni
  pedir permiso a nadie.
- El HTTPS y el dominio los pone la plataforma.
- Importante: en Deploy, `Deno.serve` no hace falta y **no debe** estar. Se
  exporta `default { fetch }` y el runtime provides la request. Este repo usa
  `Deno.serve` a propósito, porque es lo que se ejecuta en local; para Deploy
  habría que cambiar esa última línea.
- Las Deploy functions no tienen sistema de ficheros escribible. El `altas` en
  memoria del bloque 05 no sobrevive ni a dos peticiones, así que ahí haría
  falta una base de datos real.

### 2 · AWS Lambda + Function URL

```sh
deno run -A npm:esbuild --bundle=entry.ts --platform=node --format=esm --outfile=dist/lambda.mjs
```

- Compilas a un `.mjs` y lo subes a Lambda con runtime Node.
- El API Gateway o una Function URL pone el HTTPS.
- Sirve para cuando ya tienes todo tu stack en AWS y lo único que quieres
  cambiar es el lenguaje del handler.
- Ojo con el cold start y con el límite de payload de Lambda: aquí da igual,
  pero en general importa.

### 3 · Contenedor en ECS / Fargate

```dockerfile
FROM denoland/deno:alpine
WORKDIR /app
COPY . .
EXPOSE 8000
CMD ["deno", "run", "--allow-net", "--allow-read=.", "server.ts"]
```

- Es lo que eliges si quieres Deno de verdad, con su `--allow-net` y sus
  permisos finos, y no solo el lenguaje.
- Ojo con el `CMD`: es `deno run`, no `deno serve`. `deno serve` exige que el
  módulo exporte `default { fetch }` y falla con este repo, que usa
  `Deno.serve(handler)`. Es exactamente el mismo punto que el de Deploy.
- Control total del sistema de ficheros, del sistema de procesos y del sistema
  de secretos.
- Es la opción que cuesta más, y la que no necesitas.

### Lo que cambia en los tres

|                   | Local                          | Deploy                                      |
| ----------------- | ------------------------------ | ------------------------------------------- |
| Puerto            | `8000` por defecto             | lo pone la plataforma                       |
| `Deno.serve`      | sí, al final del fichero       | no, se exporta `fetch`                      |
| Permisos          | los declaras en el `deno task` | los declaras en el comando o el `deno.json` |
| Estado en memoria | vale para practicar            | no vale para nada                           |

Ese último punto es el que más se olvida: `altas` del bloque 05 es un array en
memoria. En local dura hasta que cierres el proceso. En producción es una fuente
de bugs.

## Formatear y CI

```sh
deno task fmt        # formatea
deno task fmt:check  # solo comprueba (no escribe)
```

`.github/workflows/ci.yml` corre `deno ci`, `fmt --check` y `lint` en cada push
y en cada PR. El paso de `deno test` está comentado a propósito, por lo
explicado arriba.
