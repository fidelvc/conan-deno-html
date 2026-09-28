/**
 * BLOQUE 04 · Métodos de array sobre datos de verdad
 * ==================================================
 *
 * Este bloque NO tiene servidor. No hay HTML, no hay Deno, no hay rutas: solo
 * funciones que reciben un array de personajes y devuelven otro array, un
 * objeto o un número.
 *
 * ¿Por qué? Porque así los tests corren en microsegundos y puedes practicar
 * los métodos sin que nada más te distraiga. Cuando una función de este tipo
 * es pura, se puede probar sola; cuando necesita un servidor para probarse,
 * dejas de refactorizarla por miedo.
 *
 * Tus tareas (los TODO)
 * ---------------------
 *   1. `porGrupo`        → `filter`
 *   2. `buscar`          → `filter` + `includes` + `toLowerCase`
 *   3. `ordenarPorEdad`  → `sort` (y la trampa de que `sort` MUTA)
 *   4. `contarPorGrupo`  → `reduce` a un objeto
 *   5. `agruparPorGrupo` → `reduce` a un objeto de arrays
 *   6. `relacionadosCon` → `find` + `flatMap`
 *   7. `edadMedia`       → `reduce` y los bordes
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * DOS TRAMPAS DEL DATASET QUE NECESITAS CONOCER
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * 1. SOLO HAY 2 EDADES. De los 17 personajes, únicamente Kyousuke (17) y
 *    Kirino (14) tienen edad confirmada. `age` es opcional a propósito, y por
 *    eso `ordenarPorEdad` y `edadMedia` tienen que saber qué hacer con los
 *    huecos. Los tests te dicen exactamente qué esperan.
 *
 * 2. LAS RELACIONES NO SON SIMÉTRICAS. Ruri declara a Kyousuke, pero Kyousuke
 *    NO declara a Ruri. Los datos reales de un wiki siempre tienen este
 *    defecto. Por eso `relacionadosCon` mira solo hacia un lado, y hay un test
 *    que lo fija para que no se te "arregle" sin querer.
 */

import { CHARACTERS, GROUPS } from "../../datos/personajes.ts";
import type { Character, GroupId } from "../../datos/personajes.ts";

/** El orden en el que `ordenarPorEdad` coloca a quien no tiene edad. */
export const SIN_EDAD = Number.POSITIVE_INFINITY;

export type Orden = "asc" | "desc";

// ─────────────────────────────────────────────────────────────────────────────
// Tus tareas empiezan aquí
// ─────────────────────────────────────────────────────────────────────────────

/**
 * TODO 1 · Filtra por grupo.
 *
 * @returns Los personajes que pertenecen a ese grupo, en el orden de entrada.
 *
 * Pistas: `Array.prototype.filter`. Es el método que más vas a usar.
 */
export function porGrupo(
  characters: Character[],
  group: GroupId,
): Character[] {
  throw new Error("TODO 1: implementa porGrupo", {
    cause: { group, total: characters.length },
  });
}

/**
 * TODO 2 · Busca por texto libre.
 *
 * Busca en el nombre, en `nameKana` y en las etiquetas. El alias cuenta
 * como nombre, para que "kuroneko" encuentre a Ruri.
 *
 * @param texto Puede venir con espacios alrededor y en mayúsculas ("  KIRINO ").
 * @returns Los personajes que coinciden. Con texto vacío, todos.
 *
 * Pistas:
 *   - `filter` + `includes`, como en el bloque 01, pero aquí recibes el array
 *     como parámetro en vez de cerrarlo sobre `CHARACTERS`. Por eso el
 *     parámetro `characters` existe.
 *   - `texto.trim().toLowerCase()` ANTES de comparar, y el texto de cada
 *     personaje también en minúsculas. Si comparas "KIRINO" con "kirino"
 *     sin normalizar, no encuentra nada.
 *   - Con `texto` vacío después del trim, devuelve el array entero.
 */
export function buscar(characters: Character[], texto: string): Character[] {
  throw new Error("TODO 2: implementa buscar", {
    cause: { texto, personajesDisponibles: characters.length },
  });
}

/**
 * TODO 3 · Ordena por edad.
 *
 * ⚠️ LA TRAMPA DE ESTE EJERCICIO
 * `Array.prototype.sort` MODIFICA el array que recibe. No te devuelve una
 * copia: te devuelve EL MISMO array, ya reordenado. Si no te fijas, un
 * `sort` suelto te corrompe el dataset entero y los tests siguientes empiezan
 * a fallar por sitios inexplicables. Por eso los tests comprueban también que
 * el array de entrada no se ha tocado.
 *
 * @param orden "asc" pone primero a quien es más joven. "desc", al revés.
 * @returns Una lista NUEVA y ordenada. El array original queda intacto.
 *
 * Reglas:
 *   - Quien no tiene edad va SIEMPRE al final, en los dos órdenes. Piénsalo:
 *     si "desc" significa "de mayor a menor", `Infinity` (el valor que le
 *     asignamos a quien no tiene edad) se quedaría en un sitio absurdo.
 *   - `desc` NO es simplemente "al revés de asc". Los dos órdenes tienen que
 *     acabar con los desconocidos al final.
 *   - Dos personajes con la misma edad: el orden entre ellos da igual, así que
 *     no hace falta que sea estable.
 *
 * Pistas:
 *   - `SIN_EDAD` ya está exportado arriba. Úsalo en vez de escribir
 *     `Infinity` a mano, que además el linter se queja.
 *   - Copia antes de ordenar: `[...characters].sort(...)`.
 *   - `Array.prototype.sort` recibe una función: dos números dentro, y un
 *     número (negativo, cero o positivo) de vuelta. No devuelve un booleano.
 *
 * ⚠️ LA TRAMPA DE DENTRO
 * La solución "elegante" de multiplicar por `-1` para invertir el orden es
 * FALSA, y este ejercicio existe en parte por eso:
 *
 *     const signo = orden === "asc" ? 1 : -1;
 *     return (edadA - edadB) * signo;
 *
 * Con `edadA = Infinity` (sin edad) y `edadB = 17`, sale `-Infinity`, que es
 * negativo, así que el personaje SIN EDAD se cuela POR DELANTE. Funciona en
 * asc y se rompe en desc. Hay tests para los dos órdenes precisamente por esto.
 *
 * La forma que sí aguanta los dos: decide primero quién va último, y solo
 * después compara los números que de verdad existen.
 *
 *     if (edadA === edadB) return 0;
 *     if (edadA === SIN_EDAD) return 1;   // sin edad, al final
 *     if (edadB === SIN_EDAD) return -1;  // sin edad, al final
 *     return orden === "asc" ? edadA - edadB : edadB - edadA;
 */
export function ordenarPorEdad(
  characters: Character[],
  orden: Orden = "asc",
): Character[] {
  throw new Error("TODO 3: implementa ordenarPorEdad", {
    cause: { orden, total: characters.length },
  });
}

/**
 * TODO 4 · Cuenta cuántos personajes hay en cada grupo.
 *
 * @returns Un objeto con una clave por cada grupo de `GROUPS`, y el total
 *          como número. TODOS los grupos, incluso los que tienen 0.
 *
 * Contrato: claves exactamente igual que las de `GROUPS` (`Object.keys` del
 * resultado tiene que dar el mismo `length`).
 *
 * Pistas:
 *   - `Array.prototype.reduce` es `array.reduce((acumulado, elemento) => nuevo,
 *     valorInicial)`. El valor inicial decide el tipo de salida: un array,
 *     un objeto, un número...
 *   - Cuidado: si te olvidas del valor inicial, el primer elemento del array
 *     es el acumulador de arranque, y con `{}` te va a colar un
 *     `Personaje` dentro de un objeto. Pasa un objeto vacío de verdad.
 *   - El acumulador empieza así, para que TODOS los grupos existan aunque no
 *     tengan a nadie:
 *
 *         const conteo = {} as Record<GroupId, number>;
 *         for (const id of Object.keys(GROUPS) as GroupId[]) conteo[id] = 0;
 *
 *     El `as` es necesario porque TypeScript no puede saber que un bucle va a
 *     rellenar las siete claves. El `as GroupId[]` también: `Object.keys`
 *     devuelve `string[]`, y necesitas saber que esos `string` son ids válidos.
 *   - Dentro del `reduce`: `(acumulado[group] ?? 0) + 1`. Más corto que
 *     `Object.hasOwn(...) ? ... : ...` y se lee mejor.
 */
export function contarPorGrupo(
  characters: Character[],
): Record<GroupId, number> {
  throw new Error("TODO 4: implementa contarPorGrupo", {
    cause: characters.length,
  });
}

/**
 * TODO 5 · Agrupa los personajes por grupo.
 *
 * @returns Un objeto con una clave por grupo y un ARRAY de personajes en cada
 *          una. Los grupos vacíos se quedan con `[]`; no se omiten.
 *
 * Pistas:
 *   - Igual que el anterior, con la misma inicialización (pero con `[]` en vez
 *     de `0`), y hay que METER el personaje dentro:
 *     `[...loQueHay, character]`. Los `...` son necesarios: si haces
 *     `acumulado[group].push(character)` estás mutando el array que ya estaba
 *     dentro del objeto, que funciona, pero hace el `reduce` menos legible y
 *     es el error típico cuando alguien más lee tu código.
 *   - Dos bucles anidados, o uno con un `if`. Los dos valen.
 */
export function agruparPorGrupo(
  characters: Character[],
): Record<GroupId, Character[]> {
  throw new Error("TODO 5: implementa agruparPorGrupo", {
    cause: characters.length,
  });
}

/**
 * TODO 6 · ¿Con quién se relaciona un personaje?
 *
 * Solo mira las relaciones que DECLARA el personaje, no las que los demás
 * declaran sobre él. Es decir: es unidireccional a propósito, porque el
 * dataset no es simétrico (Ruri declara a Kyousuke, Kyousuke no declara a Ruri).
 *
 * @param id El id del personaje.
 * @returns Los personajes relacionados, en el orden en que los declara, SIN
 *          repeticiones y sin incluir al propio personaje. Si el `id` no
 *          existe, o si sus relaciones apuntan a ids que no están en el
 *          dataset, esos se descartan silenciosamente.
 *
 * Pistas:
 *   - `find` para localizar al personaje. Devuelve `undefined` si no está, y
 *     ese caso hay que cubrirlo.
 *   - Dos niveles: `map` para convertir cada `{to, type}` en el personaje que
 *     representa, y luego quitar los `undefined`. Eso es exactamente lo que
 *     hace `flatMap` con una función que devuelve un array: aplana un nivel.
 *     `relacionadosCon` se puede escribir con `flatMap` en dos líneas, o con
 *     `map` + `filter` + comprobación de tipo, en cinco. Las dos valen; la
 *     segunda es más explícita y el tipado te obliga a mirar el `undefined`.
 *   - Para quitar duplicados sin ordenar: `[...new Set(array)]`.
 *   - `flatMap` devuelve `undefined` en el array si tu función lo devuelve, así
 *     que devuelve `[]` en vez de `undefined` y filtra después.
 */
export function relacionadosCon(
  characters: Character[],
  id: string,
): Character[] {
  throw new Error("TODO 6: implementa relacionadosCon", {
    cause: {
      id,
      personajesDisponibles: characters.length,
      declaradoPor: characters.find((c) => c.id === id)?.relationships.length ??
        0,
    },
  });
}

/**
 * TODO 7 · Calcula la edad media de quienes tienen edad.
 *
 * Ojo con el borde: si nadie tiene edad, `reduce` te devuelve el valor inicial
 * (que si pones `0` es un 0 false) y te queda "0 años de media", que es
 * mentira. Hay que distinguir "la media es 0" de "no hay datos".
 *
 * @returns La media de las edades conocidas, o `null` si no hay ninguna
 *          edad conocida. Nunca `0` por defecto.
 * @param totalEdades Cuántos personajes tienen edad. Se pasa por separado
 *        para no tener que recorrer el array dos veces... o no, y então
 *        recalcúlalo tú. Piénsalo: ¿qué es más limpio?
 *
 * Pistas:
 *   - Filtra primero, luego promedia: así el `reduce` solo ve números.
 *   - `/length` no es división entera. Con 2 edades (17 y 14) el resultado
 *     tiene que ser 15.5, no 15. Si te sale 15, te has comido un `Math.floor`
 *     o estás usando `~~`.
 *   - Devuelve `null`, no `0`, cuando no hay datos. Los tests lo comprueban.
 */
export function edadMedia(
  characters: Character[],
  totalEdades: number = characters.filter((c) => c.age !== undefined).length,
): number | null {
  throw new Error("TODO 7: implementa edadMedia", {
    cause: {
      totalEdades,
      conEdad: characters.filter((c) => c.age !== undefined).map((c) => c.id),
    },
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Utilidades ya resueltas
// ─────────────────────────────────────────────────────────────────────────────

/** Cuántos personajes hay en cada universo ("realidad" o "meruru"). */
export function contarPorUniverso(
  characters: Character[],
): Record<string, number> {
  return characters.reduce<Record<string, number>>(
    (counts, character) => {
      counts[character.universe] = (counts[character.universe] ?? 0) + 1;
      return counts;
    },
    { realidad: 0, meruru: 0 },
  );
}

/**
 * Atajo para no repetir `CHARACTERS` en todas las llamadas.
 *
 * Los tests lo importan para comprobar que sigue siendo el MISMO array que
 * `datos/personajes.ts`, y no una copia: si alguien hace
 * `export const DATOS = [...CHARACTERS].sort(...)` en un módulo de arranque,
 * medio programa ve los datos desordenados sin que se note.
 */
export const DATOS = CHARACTERS;

export { GROUPS };
export type { Character, GroupId };
