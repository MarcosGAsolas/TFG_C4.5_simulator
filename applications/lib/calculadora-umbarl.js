/**
 * Calcula el umbral de dos valores
 * @param {*} valor1 primer valor para calcular el umbral
 * @param {*} valor2 segundo valor para calcular el umbral
 * @returns 
 */
export function Umbral(valor1, valor2) {
    if(valor1 == 0 || valor2 == 0)
        return 0;

    return valor1/valor2;
}

/**
 * Obtiene un diccionario para clave valor y calcular más facilmente el umbral
 * @param {*} datos conjunto de datos donde tenemos la lista de la columna a la que le queremos asociar el valor 
 * @param {*} atributo atributo que queremos asociar
 * @returns 
 */
export function MapearDatos(datos, atributo){

    if(datos == null){
        throw new Error ("No hay valores para mapear")
    }
    else{
        return datos.map(fila => ({
            valor: Number(fila.attributes[atributo]),
            label: fila.label
        }))
    }
}


