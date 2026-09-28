/**
 * Dataset de la serie Oreimo, usado como dominio de los ejercicios.
 *
 * IMPORTANTE
 * ----------
 * Esto es un subconjunto curado para practicar, no una base de datos completa
 * ni verificada. Solo se incluyen datos que se han podido confirmar. Lo que
 * falta esta marcado con `TODO (ejercicio)`: completarlo con lo que tu ya
 * sabes es parte del trabajo.
 *
 * Campos que quedaron vacios a proposito, para que veas como se trabaja con
 * datos reales que estan incompletos:
 *   - `age`    solo esta en Kyousuke (17) y Kirino (14), que son las edades
 *              confirmadas por las fuentes. El resto NO se inventa.
 *   - `seiyuu` hay un conflicto entre fuentes para Manami, asi que se omite en
 *              lugar de elegir al azar.
 *
 * @module
 */

export type CharacterId = string;

/**
 * El personaje existe dentro de la historia de Oreimo, o es un personaje del
 * anime magical girl que Kirino ve ("Stardust Witch Meruru")?
 *
 * Este campo existe para practicar: filtrar por el es un `filter` de una linea.
 */
export type Universe = "realidad" | "meruru";

export const GROUPS = {
  "familia-kosaka": "Familia Kosaka",
  "hermanas-gokou": "Hermanas Gokou",
  "familia-kurusu": "Familia Kurusu",
  "familia-tamura": "Familia Tamura",
  "familia-akagi": "Familia Akagi",
  "club-meruru": "Stardust Witch Meruru",
  "club-videojuegos": "Club de Investigacion de Videojuegos",
} as const;

export type GroupId = keyof typeof GROUPS;

export interface Relationship {
  /** Id del personaje con el que se relaciona. */
  to: CharacterId;
  /** Tipo de lazo: "hermano", "mejor amiga", "padre", "companera de club"... */
  type: string;
}

export interface Character {
  id: CharacterId;
  name: string;
  nameKana: string;
  /** Alias conocido, si tiene mas de un nombre. Kuroneko es el caso obvio. */
  alias?: string;
  family: string;
  group: GroupId;
  universe: Universe;
  /** Opcional a proposito: casi ningun personaje tiene edad confirmada. */
  age?: number;
  tags: string[];
  seiyuu?: string;
  description: string;
  /** Como evoluciona el personaje a lo largo de la serie. */
  arc: string;
  relationships: Relationship[];
}

export const CHARACTERS: Character[] = [
  {
    id: "kyousuke",
    name: "Kyousuke Kosaka",
    nameKana: "高坂京介",
    family: "Kosaka",
    group: "familia-kosaka",
    universe: "realidad",
    age: 17,
    tags: ["protagonista", "hermano mayor", "universitario", "tsundere"],
    seiyuu: "Nakamura Yuichi",
    description:
      "Protagonista. Estudiante de secundaria que lleva anos con una relacion\n   distante con su hermana menor. Su vida da un vuelco cuando descubre el\n   secreto de Kirino.",
    arc:
      "Arranca aceptando que su hermana le es ajena y poco a poco pasa de la\n   distancia al vinculo: termina protegiendo su secreto y viviendo con las\n   consecuencias de haberlo hecho.",
    relationships: [
      { to: "kirino", type: "hermana menor" },
      { to: "yoshino", type: "madre" },
      { to: "daisuke", type: "padre" },
      { to: "manami", type: "amiga de la infancia" },
      { to: "saori", type: "consejero" },
      { to: "kouhei", type: "amigo de la familia" },
    ],
  },
  {
    id: "kirino",
    name: "Kirino Kosaka",
    nameKana: "高坂桐乃",
    family: "Kosaka",
    group: "familia-kosaka",
    universe: "realidad",
    age: 14,
    tags: ["protagonista", "modelo", "hermana menor", "tsundere"],
    seiyuu: "Taketatsu Ayana",
    description:
      "Hermana menor de Kyousuke. Modelo y aparentemente una estudiante ejemplar,\n   pero esconde que es una otaku fanatica de los juegos adultos.",
    arc:
      "Vive el conflicto entre la imagen publica que tiene que sostener y su\n   vida real. Su arco consiste en dejar de llevar la cuenta sola y aprender a\n   compartir lo que le gusta.",
    relationships: [
      { to: "kyousuke", type: "hermano mayor" },
      { to: "yoshino", type: "madre" },
      { to: "daisuke", type: "padre" },
      { to: "ayase", type: "mejor amiga" },
      { to: "ruri", type: "rival y amiga otaku" },
      { to: "saori", type: "amiga otaku" },
      { to: "kanako", type: "companera de clase" },
      { to: "manami", type: "rival" },
    ],
  },
  {
    id: "ruri",
    name: "Ruri Gokou",
    nameKana: "五更瑠璃",
    alias: "Kuroneko",
    family: "Gokou",
    group: "hermanas-gokou",
    universe: "realidad",
    // TODO (ejercicio 04): la edad de Ruri no aparece en las fuentes que
    // consulte. Rellénala si la conoces.
    tags: ["amiga otaku", "gothic lolita", "tsundere", "cuidadora"],
    seiyuu: "Hanazawa Kana",
    description:
      "Amiga otaku de Kirino. Fuera de casa viste de gothic lolita, con orejas\n   de gato y cola, todo basado en un personaje de su serie favorita. En el\n   instituto viste ropa normal y cuida de sus hermanas menores.",
    arc:
      "Su fachada de Kuroneko esconde a alguien que se ocupa de sus hermanas.\n   Empieza antagonista con Kyousuke y termina siendo su novia.",
    relationships: [
      { to: "kirino", type: "rival y amiga otaku" },
      { to: "saori", type: "amiga otaku" },
      { to: "hinata", type: "hermana mayor" },
      { to: "tamaki", type: "hermana menor" },
      { to: "kyousuke", type: "novia al final de la serie" },
    ],
  },
  {
    id: "ayase",
    name: "Ayase Aragaki",
    nameKana: "新垣あやせ",
    family: "Aragaki",
    group: "familia-kosaka",
    universe: "realidad",
    tags: ["modelo", "mejor amiga de Kirino", "tsundere", "yandere"],
    seiyuu: "Hayami Saori",
    description:
      "Mejor amiga y companera de clase de Kirino; tambien trabaja como modelo.\n   Es amable y educada, pero se altera mucho ante la idea de que le mientan.",
    arc:
      "Parte de desconfiar de Kyousuke por sospechar que este danandolo a Kirino,\n   y acaba cediendo a una obsesion romantica con el.",
    relationships: [
      { to: "kirino", type: "mejor amiga" },
      { to: "kanako", type: "amiga" },
      { to: "kyousuke", type: "interes romantico" },
    ],
  },
  {
    id: "saori",
    name: "Saori Makishima",
    nameKana: "槇島沙織",
    alias: "Saori Bajeena",
    family: "Makishima",
    group: "club-videojuegos",
    universe: "realidad",
    tags: ["doble personalidad", "gafas", "amiga otaku", "asesora"],
    seiyuu: "Nabatame Hitomi",
    description:
      "Se la ve de dos formas segun lleve o no gafas: Saori, timida, y Bajeena,\n   su otra personalidad, mucho mas despreocupada. Vive sola y tema perder a\n   sus amigos.",
    arc:
      "Su historia personal explica de donde viene esa desconfianza. Acaba\n   siguiendo siendo la que hace de asesora a los demas cuando no saben que\n   hacer.",
    relationships: [
      { to: "kirino", type: "amiga otaku" },
      { to: "ruri", type: "amiga otaku" },
      { to: "kaori", type: "companera de club" },
      { to: "kyousuke", type: "asesora sentimental" },
    ],
  },
  {
    id: "kanako",
    name: "Kanako Kurusu",
    nameKana: "来栖加奈子",
    family: "Kurusu",
    group: "familia-kurusu",
    universe: "realidad",
    tags: ["idol", "cosplayer", "cantante", "honestidad brutal"],
    seiyuu: "Tamura Yukari",
    description:
      "Companera de clase de Kirino y Ayase. Canta y baila bien y quiere ser\n   idol. Es arisca y muy directa, mas por honestidad que por maldad.",
    arc:
      "Entra como la rival que estorba a Kirino y termina siendo una amiga leal\n   que apoya el sueno de los demas.",
    relationships: [
      { to: "kirino", type: "companera de clase" },
      { to: "ayase", type: "amiga" },
      { to: "kanata", type: "hermana menor" },
    ],
  },
  {
    id: "kanata",
    name: "Kanata Kurusu",
    nameKana: "来栖香奈多",
    family: "Kurusu",
    group: "familia-kurusu",
    universe: "realidad",
    tags: ["hermana menor", "candidata a idol"],
    description:
      "Hermana menor de Kanako. Tambien suena con ser idol. La relacion con\n   Kyousuke es de familia, sin nada romantic.",
    arc: "Su sueno de ser idol es el motor de buena parte de su arco.",
    relationships: [
      { to: "kanako", type: "hermana mayor" },
      { to: "kyousuke", type: "conocido por la familia" },
    ],
  },
  {
    id: "manami",
    name: "Manami Tamura",
    nameKana: "田村麻奈実",
    family: "Tamura",
    group: "familia-tamura",
    universe: "realidad",
    tags: ["amiga de la infancia", "rival de Kirino", "segunda protagonista"],
    description:
      "Amiga de la infancia de Kyousuke. Se lleva mal con Kirino. Su pasado se\n   cuenta entero solo en la verdadera ruta de la historia.",
    arc:
      "Es uno de los casos mas claros de la serie: el aparente antagonista se\n   revela mucho mas cercano a Kyousuke de lo que parecia.",
    relationships: [
      { to: "kyousuke", type: "amiga de la infancia" },
      { to: "kouhei", type: "padre" },
      { to: "kirino", type: "rival" },
    ],
  },
  {
    id: "sena",
    name: "Sena Akagi",
    nameKana: "赤井せな",
    family: "Akagi",
    group: "familia-akagi",
    universe: "realidad",
    tags: ["hermana de Kouhei", "personalidad fuerte"],
    description:
      "Hermana de Kouhei Akagi. Tiene un caracter fuerte y choca con frecuencia con\n   Kyousuke.",
    arc: "Mantiene su propio pulso dentro del entorno de la familia Akagi.",
    relationships: [
      { to: "kouhei", type: "hermano" },
      { to: "manami", type: "prima" },
      { to: "kyousuke", type: "conocido" },
    ],
  },
  {
    id: "yoshino",
    name: "Yoshino Kosaka",
    nameKana: "高坂佳乃",
    family: "Kosaka",
    group: "familia-kosaka",
    universe: "realidad",
    tags: ["madre", "protectora"],
    seiyuu: "Watanabe Akeno",
    description:
      "Madre de Kyousuke y Kirino. Quiere mucho a sus hijos y nota antes que nadie\n   cuando algo no cuadra en casa.",
    arc:
      "Esta preocupada constantemente por el secreto de sus hijos, y eso genera\n   momentos de tension en la casa.",
    relationships: [
      { to: "kyousuke", type: "hijo" },
      { to: "kirino", type: "hija" },
      { to: "daisuke", type: "esposa" },
    ],
  },
  {
    id: "daisuke",
    name: "Daisuke Kosaka",
    nameKana: "高坂大助",
    family: "Kosaka",
    group: "familia-kosaka",
    universe: "realidad",
    tags: ["padre", "ausente por trabajo"],
    seiyuu: "Tachiki Fumihiko",
    description:
      "Padre de Kyousuke y Kirino. Pasa parte de la serie fuera de casa, por\n   trabajo.",
    arc:
      "Esta casi siempre ausente, lo que deja a Yoshino al mando de la casa.",
    relationships: [
      { to: "kyousuke", type: "hijo" },
      { to: "kirino", type: "hija" },
      { to: "yoshino", type: "esposa" },
    ],
  },
  {
    id: "kouhei",
    name: "Kouhei Akagi",
    nameKana: "赤甲公平",
    family: "Akagi",
    group: "familia-akagi",
    universe: "realidad",
    tags: ["padre de Manami", "amigo de la familia Kosaka"],
    seiyuu: "Majima Junji",
    description:
      "Padre de Manami y amigo de la familia Kosaka. Esta muy implicado en las\n   relaciones entre las dos familias.",
    arc: "Su presencia tira de Manami hacia Kyousuke.",
    relationships: [
      { to: "manami", type: "hija" },
      { to: "sena", type: "hermana" },
      { to: "kyousuke", type: "amigo de la familia" },
    ],
  },
  {
    id: "hinata",
    name: "Hinata Gokou",
    nameKana: "五更日向",
    family: "Gokou",
    group: "hermanas-gokou",
    universe: "realidad",
    tags: ["hermana de Ruri", "sensata"],
    description:
      "Hermana de Ruri. Se preocupa mucho cuando su hermana entra en modo\n   Kuroneko.",
    arc: "Es la voz de la sensatez dentro de la familia Gokou.",
    relationships: [
      { to: "ruri", type: "hermana menor" },
      { to: "tamaki", type: "hermana menor" },
    ],
  },
  {
    id: "tamaki",
    name: "Tamaki Gokou",
    nameKana: "五更黄昏",
    family: "Gokou",
    group: "hermanas-gokou",
    universe: "realidad",
    tags: ["hermana menor", "la mas pequena"],
    description:
      "La hermana menor de Ruri. Es a la que Ruri quiere cuidar por encima de\n   todo.",
    arc: "Es la hermana a la que Ruri dedica casi todo su tiempo libre.",
    relationships: [
      { to: "ruri", type: "hermana mayor" },
      { to: "hinata", type: "hermana mayor" },
    ],
  },
  {
    id: "kaori",
    name: "Kaori Makishima",
    nameKana: "真壁香織",
    family: "Makishima",
    group: "club-videojuegos",
    universe: "realidad",
    tags: ["club de videojuegos", "hermana de Saori"],
    description:
      "Miembro del Club de Investigacion de Videojuegos. Hermana de Saori, con la\n   que no siempre se lleva bien.",
    arc: "Su relacion con Saori se suaviza a medida que se entienden mejor.",
    relationships: [
      { to: "saori", type: "hermana mayor" },
      { to: "kirino", type: "conocida del club" },
    ],
  },
  {
    id: "meruru",
    name: "Meruru",
    nameKana: "メルル",
    family: "Meruru",
    group: "club-meruru",
    universe: "meruru",
    tags: ["magical girl", "protagonista de su serie", "favorita de Kirino"],
    description:
      "La protagonista magical girl titular de Stardust Witch Meruru, el anime que\n   ve Kirino. Existe dentro de la serie: no es una persona real en ella.",
    arc:
      "Su historia es el marco sentimental de la fandom de Kirino, y explica por\n   que Kirino reacciona como reacciona.",
    relationships: [
      { to: "kurara-hoshino", type: "su seiyu dentro de la serie" },
    ],
  },
  {
    id: "kurara-hoshino",
    name: "Kurara Hoshino",
    nameKana: "星野紅利",
    family: "Hoshino",
    group: "club-meruru",
    universe: "meruru",
    tags: ["seiyu dentro de la serie", "actor de doblaje"],
    description:
      "Dentro de Oreimo hace de voz de Meruru: es la seiyu de Meruru en el mundo de\n   la serie.",
    arc: "Vive en el mundo de la ficcion, no en el de los personajes reales.",
    relationships: [
      { to: "meruru", type: "personaje al que dabla" },
    ],
  },
];

/** Todos los tipos de relacion que aparecen en el dataset, sin repetir. */
export const RELATIONSHIP_TYPES: string[] = [
  ...new Set(
    CHARACTERS.flatMap((character) =>
      character.relationships.map((relationship) => relationship.type)
    ),
  ),
].sort();
