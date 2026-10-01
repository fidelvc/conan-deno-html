# Convenciones del repo

Este repo tiene dos idiomas y cada uno va en su sitio. La regla es corta:

> **Todo lo que es código, en inglés. Todo lo que es contenido, en español.**

## Qué cuenta como código

Va siempre en inglés, sin excepciones, aunque el proyecto esté en español:

| Elemento                          | Ejemplo                                               |
| --------------------------------- | ----------------------------------------------------- |
| Funciones                         | `filterCharacters`, `describeCount`, `createRedirect` |
| Clases, tipos, interfaces         | `CharacterStore`, `ValidationResult`                  |
| Variables, parámetros, constantes | `visibleCount`, `EMPTY_DRAFT`, `NO_AGE`               |
| Propiedades y campos              | `character.name`, `draft.group`                       |
| IDs de HTML                       | `id="result-count"`, `id="search-form"`               |
| Clases CSS y variables CSS        | `.character`, `.tags`, `--border`, `--muted`          |
| Atributos `data-*`                | `data-search`, `data-character-id`                    |
| Nombres de Custom Elements        | `<character-list>`, `<character-card>`                |
| Eventos                           | `input`, `change`, y los `CustomEvent` que invoques   |
| Nombres de fichero de código      | `store.ts`, `components/character-list.js`            |

## Qué cuenta como contenido

Va en español:

| Elemento                        | Ejemplo                                        |
| ------------------------------- | ---------------------------------------------- |
| Comentarios y JSDoc             | `/** Escapa`&`antes que`<`. */`                |
| Títulos de test                 | `Deno.test("slug quita los acentos", ...)`     |
| Enunciados, objetivos, pistas   | `pistas.md`, los README                        |
| Texto visible de la interfaz    | `<h1>Índice de personajes</h1>`                |
| Mensajes de validación          | `"Pon un nombre de al menos 2 caracteres"`     |
| Valores del dataset             | `tags: ["idol", "modelo"]`                     |
| Nombres de fichero de contenido | `pages/indice.html`, `pages/presentacion.html` |

## Los términos de JavaScript no se traducen

Esta es la parte que más se olvida. `filter`, `find`, `includes`, `map`, `join`,
`reduce`, `flatMap`, `sort`, `some`, `every`, `slice`, `customElements`,
`attachShadow`, `HTMLTemplateElement`, `CustomEvent`… son **nombres de API**.

Se usan tal cual, en inglés, siempre. Cuando los menciones en un texto en
español, van entre backticks y la explicación va en español:

```ts
// El texto en español, el término de API en inglés y sin traducir.
characters.filter((character) => character.tags.includes(query));
```

En español puedes decir "filtra con `filter`" o "usa `find` para localizar el
primer personaje". Nunca `filtrar()` ni `buscar()` como nombre de método, y
nunca un alias en español en el código.

Lo mismo con los atributos del DOM: `dataset.search`, no `dataset.buscar`. Con
`data-search` el `dataset` se lee igual; con `data-buscar` tendrías que escribir
`card.dataset.buscar`, que mezcla idiomas en la misma línea.

## Por qué importa

Porque un lector que ya conoce la API puede leer tu código sin consultar nada.
Si el método se llama `buscar`, alguien que viene de cualquier otra base de
datos tiene que pararse a descubrir si es un `find`, un `filter` o un `search`.
Con `filter`, lo sabe antes de acabar de leer la línea.

Y porque mezclar idiomas en el mismo fichero es lo que hace que un proyecto deje
de ser legible: el texto es para las personas, el código es para el lenguaje.
