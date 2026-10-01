/**
 * character-card.js · 08 integración
 * ==================================
 *
 * La tarjeta del bloque 07, sin cambios.
 *
 * A propósito, porque es el punto del bloque: la tarjeta ha cambiado cuatro
 * veces desde el 03 (template, slot, botón, shadow root) y en este bloque no
 * toca. Lo que hace —enseñar un personaje y avisar de un clic— es
 * exactamente lo mismo desde el principio.
 *
 * Un componente que no cambia cuando el requisito crece es la señal de que la
 * frontera está bien puesta. En el 06, cualquier cosa nueva se metía dentro de
 * la tarjeta; aquí se ha metido en la lista o en el store.
 *
 * Este fichero no tiene nada dentro: solo importa el del 07, para que el
 * `customElements.define` se ejecute. Es el mismo componente, el mismo
 * shadow root y los mismos estilos, reutilizado tal cual.
 */

import "./../07-shadow-dom/character-card.js";
