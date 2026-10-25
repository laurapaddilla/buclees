// Tutoriales de los puntos básicos para el seed. Texto provisional que la autora revisará.
// Las imágenes (image_url) se añadirán cuando estén las ilustraciones o GIF propios.
export const tutorials = [
  {
    slug: 'cadeneta', abbreviation: 'cad', name: 'Cadeneta',
    description: 'La base de casi todo: con ella empiezas las labores en filas y haces los arcos.',
    steps: [
      { title: 'Nudo corredizo', instructions: 'Haz un nudo corredizo y mételo en el ganchillo. Ajústalo sin apretar.' },
      { title: 'Lazada', instructions: 'Pasa el hilo por encima del ganchillo, de atrás hacia delante.' },
      { title: 'Saca el hilo', instructions: 'Gira el ganchillo y saca la lazada por el bucle que tienes en él. Ya tienes 1 cadeneta.' },
      { title: 'Repite', instructions: 'Repite la lazada y el paso por el bucle hasta tener las cadenetas que pide el patrón.' },
    ],
  },
  {
    slug: 'anillo-magico', abbreviation: 'am', name: 'Anillo mágico',
    description: 'El comienzo de los amigurumis: un centro cerrado, sin agujero.',
    steps: [
      { title: 'Forma el anillo', instructions: 'Enrolla el hilo dos veces alrededor de dos dedos, con la hebra corta delante.' },
      { title: 'Entra en el anillo', instructions: 'Mete el ganchillo por dentro del anillo, haz una lazada y sácala.' },
      { title: 'Fija con una cadeneta', instructions: 'Haz 1 cadeneta para sujetar el anillo. Esta cadeneta no cuenta como punto.' },
      { title: 'Teje dentro', instructions: 'Teje dentro del anillo los puntos que pida el patrón, normalmente 6 pb.' },
      { title: 'Cierra', instructions: 'Tira de la hebra corta hasta que el anillo se cierre del todo.' },
    ],
  },
  {
    slug: 'punto-raso', abbreviation: 'pr', name: 'Punto raso',
    description: 'El punto más bajo: sirve para cerrar vueltas y desplazarte sin ganar altura.',
    steps: [
      { title: 'Entra en el punto', instructions: 'Mete el ganchillo en el punto que indica el patrón.' },
      { title: 'Lazada', instructions: 'Haz una lazada.' },
      { title: 'Saca por todo', instructions: 'Saca la lazada por el punto y por el bucle del ganchillo a la vez.' },
    ],
  },
  {
    slug: 'punto-bajo', abbreviation: 'pb', name: 'Punto bajo',
    description: 'El punto más usado en amigurumis: firme, apretado y fácil de contar.',
    steps: [
      { title: 'Entra en el punto', instructions: 'Mete el ganchillo en el punto, por debajo de las dos hebras de arriba.' },
      { title: 'Saca una lazada', instructions: 'Haz una lazada y sácala por el punto. Tienes 2 bucles en el ganchillo.' },
      { title: 'Cierra el punto', instructions: 'Haz otra lazada y pásala por los 2 bucles a la vez.' },
    ],
  },
  {
    slug: 'punto-medio-alto', abbreviation: 'pma', name: 'Punto medio alto',
    description: 'A medio camino entre el bajo y el alto: crece rápido sin dejar huecos.',
    steps: [
      { title: 'Lazada antes de entrar', instructions: 'Haz una lazada antes de meter el ganchillo en el punto.' },
      { title: 'Entra y saca', instructions: 'Mete el ganchillo en el punto, haz una lazada y sácala. Tienes 3 bucles.' },
      { title: 'Cierra de una vez', instructions: 'Haz una lazada y pásala por los 3 bucles a la vez.' },
    ],
  },
  {
    slug: 'punto-alto', abbreviation: 'pa', name: 'Punto alto',
    description: 'Un punto alto y abierto, el de las granny squares y los calados.',
    steps: [
      { title: 'Lazada y entra', instructions: 'Haz una lazada y mete el ganchillo en el punto.' },
      { title: 'Saca una lazada', instructions: 'Haz una lazada y sácala por el punto. Tienes 3 bucles.' },
      { title: 'Primera pasada', instructions: 'Haz una lazada y pásala por los 2 primeros bucles. Te quedan 2.' },
      { title: 'Segunda pasada', instructions: 'Haz otra lazada y pásala por los 2 bucles que quedan.' },
    ],
  },
  {
    slug: 'aumento', abbreviation: 'aum', name: 'Aumento',
    description: 'Dos puntos en el mismo punto: así crece una pieza redonda.',
    steps: [
      { title: 'Primer punto', instructions: 'Teje un punto, por ejemplo 1 pb, en el punto que toca.' },
      { title: 'Segundo punto en el mismo', instructions: 'Teje otro punto en ese mismo punto de la vuelta anterior.' },
      { title: 'Cuenta', instructions: 'Has convertido 1 punto en 2. En el recuento del patrón, cada aumento suma uno.' },
    ],
  },
  {
    slug: 'disminucion', abbreviation: 'dism', name: 'Disminución',
    description: 'Dos puntos tejidos juntos: así se cierra una pieza.',
    steps: [
      { title: 'Empieza en el primer punto', instructions: 'Mete el ganchillo en el punto, haz una lazada y sácala. Tienes 2 bucles.' },
      { title: 'Sigue en el siguiente', instructions: 'Mete el ganchillo en el punto siguiente, haz una lazada y sácala. Tienes 3 bucles.' },
      { title: 'Únelos', instructions: 'Haz una lazada y pásala por los 3 bucles a la vez. Dos puntos se han convertido en uno.' },
    ],
  },
];
