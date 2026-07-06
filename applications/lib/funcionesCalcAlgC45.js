import { entropy } from './entropy-calculator.js';

/**
 * Calcula el umbral de dos valores
 * @param {*} valor1 primer valor para calcular el umbral
 * @param {*} valor2 segundo valor para calcular el umbral
 * @returns el valor del umbral
 */
export function calcularUmbral(valor1, valor2) {
    if(Number.isNaN(valor1) || Number.isNaN(valor2))
        return 0;

    return (valor1 + valor2) / 2;
}


/**
 * Calculadora de la entropía de un umbral.
 * 
 * El umbral divide las filas en dos grupos:
 * - grupo izquierdo: valores menores o iguales al umbral
 * - grupo derecho: valores mayores que el umbral
 * 
 * @param {*} filasOrdenadas Las fila de números ordenada del un conjunto de datos
 * @param {*} umbral El umbral del que queremos calcular la entropía.
 * @returns Devuelve la entropía calculada de un umbral en un conjunto de datos.
 */
export function calcularEntropiaParaUmbral(filasOrdenadas, umbral) {
    const grupoIzquierdo = [];
    const grupoDerecho = [];

    filasOrdenadas.forEach(fila => {
        const valor = Number(fila[0]);

        if (valor <= umbral) {
            grupoIzquierdo.push(fila);
        } else {
            grupoDerecho.push(fila);
        }
    });

    const total = filasOrdenadas.length;

    const entropiaIzquierda = calcularEntropiaDeGrupo(grupoIzquierdo);
    const entropiaDerecha = calcularEntropiaDeGrupo(grupoDerecho);

    return (grupoIzquierdo.length / total) * entropiaIzquierda
         + (grupoDerecho.length / total) * entropiaDerecha;
}

/**
 * Calculamos la entropía de un grupo de datos.
 * @param {*} grupo conjunto de filas pertenecientes a un grupo, cada fila tiene que tener la forma: [valorAtributo, clase]
 * @returns Devuelve la entropía del grupo de datos.
 */
export function calcularEntropiaDeGrupo(grupo) {
    if (grupo.length === 0) return 0;

    const conteos = {};

    grupo.forEach(fila => {
        const clase = fila[1];
        conteos[clase] = conteos[clase] ? conteos[clase] + 1 : 1;
    });

    const total = grupo.length;

    const probabilidades = Object.values(conteos).map(conteo => conteo / total);

    return entropy(probabilidades);
}

/**
 * Calcula la ganancia de información de un umbral.
 *
 * Fórmula:
 * Gain(S, A) = E(S) - E(S | A)
 *
 * En este caso:
 * - E(S) es la entropía del conjunto original.
 * - E(S | A) es la entropía ponderada generada por el umbral.
 *
 * @param {*} filasOrdenadas Conjunto de datos ordenado con forma [valorAtributo, clase]
 * @param {*} umbral Umbral que se quiere evaluar
 * @returns devuelve la ganancia de información del umbral
 */
export function calcularGananciaInformacionParaUmbral(filasOrdenadas, umbral) {
    const entropiaConjuntoOriginal = calcularEntropiaDeGrupo(filasOrdenadas);

    const entropiaUmbral = calcularEntropiaParaUmbral(filasOrdenadas, umbral);

    return entropiaConjuntoOriginal - entropiaUmbral;
}
