/**
 * character-card.js · 07 shadow dom
 * =================================
 *
 * La tarjeta del bloque 06, pero con su propio shadow root. A partir de aquí
 * la tarjeta **no está en la página**: está en un shadow root que cuelga de
 * ella, y el CSS de la página no llega.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * LO QUE CAMBIA Y LO QUE NO
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * No cambia el HTML de la tarjeta, ni el `set character`, ni los eventos, ni
 * los `<slot>`. Todo lo del bloque 06 sigue valiendo.
 *
 * Cambia dónde vive el DOM: `this.shadowRoot` en vez de `this`. Y por eso hay
 * un TODO que parece un one-liner y en realidad es el bug más caro de todo el
 * bloque: `this.querySelector("[data-field=name]")` **deja de encontrar** los
 * elementos que están dentro del shadow root. Devuelve `null`, y
 * `null.textContent = ...` lanza.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * LAS TRES REGLAS DEL SHADOW DOM
 * ─────────────────────────────────────────────────────────────────────────────
 *
 *   1. `attachShadow()` se llama **una vez por elemento**, y solo desde el
 *      constructor. La segunda vez lanza `NotSupportedError`. Por eso el
 *      template se clona **dentro** del shadow root y no se mete con
 *      `innerHTML`.
 *
 *   2. El shadow root está **cerrado a los selectores de fuera**.
 *      `document.querySelector("character-card [data-field=name]")` devuelve
 *      `null` siempre. Para entrar hay que usar `shadowRoot.querySelector(...)`
 *      desde dentro, y por eso `mode: "open"` importa: con `"closed"` el
 *      `shadowRoot` es `null` incluso para el propio componente desde fuera.
 *
 *   3. Lo que entra por un `<slot>` **sigue en el light DOM**. El shadow root
 *      los reparte, pero no los mueve ni los copia. Los estilos del shadow root
 *      no los tocan, y los de la página sí. Es la línea que corta la
 *      encapsulación, y por eso el `<style>` de la tarjeta usa `:host` y
 *      selectores de elemento, y no selectores de clase del contenido.
 */

const template = document.querySelector("#character-card-template");

/**
 * Los estilos de la tarjeta, dentro de su propio shadow root.
 *
 * Todo lo que sea "de la tarjeta" va aquí. Ojo a los dos selectores:
 *
 *   · `:host` es la tarjeta. Se puede estilizar como cualquier elemento, y
 *     desde aquí se le puede poner una clase desde fuera: el host sí recibe
 *     clases de fuera, lo que no hace es recibir los estilos de fuera.
 *   · `::slotted(...)` estiliza **el contenido del slot**, y funciona
 *     precisamente porque ese contenido sigue en el light DOM. Sin esto no
 *     se puede tocar lo que mete quien usa el componente.
 */
const styles = `
  :host {
    display: block;
  }

  :host([hidden]) {
    display: none;
  }

  .character {
    padding: 0.9rem 1rem;
    border: 1px solid var(--border, currentColor);
    border-radius: 0.6rem;
  }

  :host(.is-favorite) .character {
    border-color: currentColor;
    border-width: 2px;
  }

  .character h2 {
    margin: 0 0 0.2rem;
    font-size: 1.05rem;
  }

  .family {
    margin: 0 0 0.4rem;
    font-size: 0.85rem;
  }

  .description {
    margin: 0 0 0.5rem;
  }

  .tags {
    display: flex;
    flex-wrap: wrap;
    gap: 0.35rem;
    margin: 0;
    padding: 0;
    list-style: none;
  }

  .tags li {
    padding: 0.1rem 0.45rem;
    border: 1px solid currentColor;
    border-radius: 999px;
    font-size: 0.75rem;
  }

  .badge {
    display: inline-block;
    margin-inline-end: 0.4rem;
    font-size: 0.75rem;
  }

  ::slotted(button.favorite) {
    margin-block-start: 0.4rem;
  }
`;

export class CharacterCard extends HTMLElement {
  #character = null;
  #isFavorite = false;

  /** El shadow root, o `null` si el navegador no lo soporta. */
  get root() {
    return this.shadowRoot;
  }

  /**
   * TODO 1 · Crea el shadow root una vez.
   *
   *   1. `this.attachShadow({ mode: "open" })`,
   *   2. mete un `<style>` con `styles` y el template clonado dentro,
   *      usando `append` y `cloneNode(true)`.
   *
   * Por qué no `this.innerHTML = "<style>...</style>"`: porque `attachShadow` no
   * se puede llamar dos veces sobre el mismo elemento, y si alguien vuelve a
   * instanciar el componente con `new CharacterCard()` y lo mete en la página,
   * un `innerHTML` con el shadow entero no se puede reconstruir. Con el
   * shadow montado **una vez en el constructor** y el template clonado en cada
   * setter, cada tarjeta tiene su DOM y el shadow es siempre el mismo.
   *
   * Y por qué `mode: "open"`: con `"closed"` el `shadowRoot` es `null` para
   * todo el mundo, y los tests de la página y las herramientas de desarrollo
   * dejan de poder mirar dentro. "Open" no significa menos seguro: significa
   * que la encapsulación es de estilos, no un secreto.
   */
  constructor() {
    super();

    throw new Error("TODO 1: crea el shadow root de CharacterCard", {
      // `estilos` y `hijos` a 0 son los dos fallos típicos: copiar el CSS fuera
      // del `<style>`, o equivocar el `id` del template en el HTML.
      cause: {
        estilos: styles.length,
        hijos: template.content.childElementCount,
      },
    });
  }

  /**
   * TODO 2 · Rellena el shadow root.
   *
   * Igual que el del bloque 06, con dos cambios:
   *
   *   1. los selectores van contra `this.shadowRoot`, no contra `this`,
   *   2. y el `<slot>` se rellena **después** del `replaceChildren`, porque
   *      `replaceChildren` se come todo lo que haya, slot incluido.
   *
   * El paso 1 es el que se olvida. `this.querySelector("[data-field=name]")`
   * devuelve `null` en cuanto el contenido está dentro del shadow root, y
   * `null.textContent = "x"` revienta con un TypeError que no parece tener
   * nada que ver con el shadow DOM. Es el error más caro de este bloque.
   */
  set character(character) {
    throw new Error("TODO 2: implementa el setter character de CharacterCard", {
      cause: { id: character.id },
    });
  }

  get character() {
    return this.#character;
  }

  /** Dato puro: la clase va en el host, que sí es de fuera. */
  set isFavorite(isFavorite) {
    if (this.#isFavorite === isFavorite) return;
    this.#isFavorite = isFavorite;
    this.classList.toggle("is-favorite", isFavorite);

    const button = this.querySelector("button.favorite");
    if (button) button.setAttribute("aria-pressed", String(isFavorite));
  }

  get isFavorite() {
    return this.#isFavorite;
  }

  favoriteChanged() {
    this.dispatchEvent(
      new CustomEvent("character-favorite", {
        bubbles: true,
        composed: true,
        detail: { id: this.#character?.id, forwarded: false },
      }),
    );
  }
}

customElements.define("character-card", CharacterCard);
