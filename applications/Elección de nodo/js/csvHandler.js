import { buildTree, destroyTree } from './tree.js';
import { createDataTable } from './dataTable.js';
import { createValueTable, loadData } from './valueTable.js';
import { initialStep } from './stepbystep.js';
import { getDataInfo, getDataLink } from "../exampledata/dataInfo.js";

const svgId = 'svgDT';

// Example dataset names
const dataset1 = "Play Golf 1";
const dataset2 = "Play Golf 2";
const dataset3 = "Iris";
const dataset4 = "Mushrooms";
const dataset5 = "Lenses";

/**
 * Gets all each attribute's distinct categories/values
 * @param {*} data The dataset
 * @param {*} attributes Array of the attribute names
 * @returns Array of arrays that contain each attribute's distinct categories/values
 */
function getAttributes(data, attributes) { // data, que son los datos que llegna a la clase, atributes, la lista de atrubitos
    const attributeValues = attributes.map((key, index) => { // usa map para recorrer el array, el valor de key es el valor que toma el atributo, e index es la posicion en la que esta ese atributo 
        const values = new Set(); // crea un array pero el set lo que hace es que no duplica datos, si existe un dato ya metido, no lo vuelve a meter 
        for (let i = 1; i < data.length; i++) { // recorre desde i hasta la longitud del data que nos pasa, es decir, si el data tiene 4 valores, lenght es 4, 
            values.add(data[i][index]);// añade el valor que se encuentra en la posicion i index del data, es decir, i va a ser la posición de la fila e index la posición de la columna
        }
        return Array.from(values); // devuelve el array formado con los valores distintos de cada atributo
    });

    return attributeValues; // devuelve el array formado de antes
}

/**
 * Gets all the distinct label values and data rows
 * @param {*} data The dataset
 * @param {*} attributes Array of the attribute names
 * @returns An array of all distinct label values and all data rows as an array of objects
 */
function getLabelValsDataRows(data, attributes) {
    const labelValues = new Set(); // crea una lista de valores que no se pueden repetir
    const dataRows = data.slice(1).map(row => { // con el slice(1), lo que hace es coger todas las filas de la tabla menos la primera, es decir, la de la cabecera
        const attributeObj = {}; // objeto para guardar los atributos de una fila
        attributes.forEach((key, index) => { // por cada atributo de la tabla, guarda un objeto en atributeObj para indicar que valores diferentes tiene ese atributo
            attributeObj[key] = row[index];
        });
        const label = row[row.length - 1]; // obtiene el valor que toma esa elección de atributo valor en la tabla, es decir, por ejemplo, {atributes: { Tiempo= "Soleado", Temperatura = "Hot"}, valor = "No"}
        labelValues.add(label);
        return { attributes: attributeObj, label: label }; // devuelve la estructura 
    });

    return [Array.from(labelValues), dataRows]; // devuelve dos cosas, uno, los valores posibles que puede tomar, y cada fila de la tabla en el formato atributo, valor
}
 /**
 * Función que obtiene el tipo de datos de cada atributo de una tabla. Los atributos pueden ser numéricos o categóricos.
 * @param {*} datos  Datos obtenidos del archivo CSV.
 * @param {*} atributos Lista de atributos de la tabla que se van a evaluar.
 * @returns {Object} Devuelve un objeto indicando el tipo de cada atributo.
 * Ejemplo:
 * {
 *   Nota: "numerico",
 *   Clase: "categorico"
 * }
 * @throws {Error} Lanza un error si un atributo contiene valores de distintos tipos o si alguna fila contiene valores vacíos.
 */
function obtenerTiposAtributos(datos, atributos) {

    // Objeto donde guardaremos el tipo de cada atributo
    const tipos = {};
    atributos.forEach((atributo, indice) => {

        // Variables para detectar tipos
        let tieneNumeros = false;
        let tieneTexto = false;
        let tieneValoresVacios = false;

        // Recorremos todas las filas del dataset
        for (let i = 1; i < datos.length; i++) {
          
            const valor = datos[i][indice];
         
            if (valor === "") {
                tieneValoresVacios = true;
            }
            if (!isNaN(Number(valor))) { // Si el valor puede convertirse a número: es decir, que cuando el valor lo convertimos a número no sale NaN.
                tieneNumeros = true;
            } else {
                tieneTexto = true;
            }
            // Si encontramos mezcla de tipos o el atributo tiene valores vacios
            if ((tieneNumeros && tieneTexto) || tieneValoresVacios) {
                throw new Error(
                    `Los datos del atributo "${atributo}" deben ser todos del mismo tipo y no debe de haber ninguna fila con datos vacíos`
                );
            }
        }

        // Guardamos el tipo del atributo
        tipos[atributo] = tieneNumeros ? "numerico" : "categorico";
    });

    return tipos;
}
/**
 * 
 * @param {*} idTabla 
 * @returns 
 */
function obtenerDatosTabla(idTabla) {

    // Obtener la tabla
    const tabla = document.getElementById(idTabla);

    // Array final
    const datos = [];
    const cabeceda = [];
    const celdasCabecera = tabla.querySelectorAll('thead th');

    celdasCabecera.forEach((celda,indice) =>{
        if(indice === 0) return;
        cabeceda.push(celda.textContent.trim());
    });

    datos.push(cabeceda);

    const filas = tabla.querySelectorAll('tbody tr');

    filas.forEach(fila => {

        const filaDatos = [];

        const celdas = fila.querySelectorAll('tb');

        celdas.forEach((celda, indiceCelda) => {
            if(indiceCelda === 0) return;
            datosFila.push(obtenerValorCelda(celda));
        });

        const filaTieneDatos = datosFila.some(valor => valor !== "");

        if(filaTieneDatos){
            datos.push(datosFila);
        }
    });

    return datos;
}

/**
 * Funcion para obtener los valores de la celda independientemente de que hayan sido metidos por un input o porque esten en el códgio puestos
 * @param {*} celda celda de la tabla
 * @returns devuelve el valor de la celda
 */
function obtenerValorCelda(celda){
    const input = celda.querySelector('input');
    if(input){
        return input.value.trim();
    }else{
        return celda.textContent.trim();
    }
}

/**
 * Transform the parsed data into a form that can be used by the program
 * @param {*} data The dataset
 */
function transformData(data) {
    const headers = data[0]; // guarda la primera fila de toda la tabla, es decir, los encabezados
    const attributes = headers.slice(0, -1); // Obtiene todos los encabezados, menos el último.
    const label = headers[headers.length - 1]; // Obtiene el nombre del último valor del encabezado.

    const attributeValues = getAttributes(data, attributes); // llama a la función de obtener atributos, es decir, obtiene los posibles valores de cada atributo
    const tipoDeAtributos = obtenerTiposAtributos(data, attributes); // llama a la función de obtener tipos de atributos
    const labelValsDataRows = getLabelValsDataRows(data, attributes); // cada fila de la tabla la transforma en objetos del tipo {atributo{clave:valor}, valor: si} y tambien devuelve el conjunto de valores posibles que puede tomar la fila
    const labelValuesArray = labelValsDataRows[0]; // guarda el primer valor que devuelve la funcion que son los posibles valores resultantes de cada fila
    const dataRows = labelValsDataRows[1]; // guarda el segundo valor del metodo, que es la lista de filas formateadas para poder trabajar con ellas

    let dataCsv = {};
    dataCsv['csvAttributes'] = attributes;
    dataCsv['csvAttributeValues'] = attributeValues;
    dataCsv['csvLabel'] = label;
    dataCsv['csvLabelValues'] = labelValuesArray;
    dataCsv['csvDataRows'] = dataRows;
    dataCsv['csvTipoDeAtributos'] = tipoDeAtributos;

    // Save to local storage
    sessionStorage.setItem('csvData', JSON.stringify(dataCsv)); // Convierte el valor DataCsv en string y lo guarda en una variable local para poder usarla

    // Reset everything and build the tree and tables based on the new data 
    var svgEl = document.getElementById(svgId); // obtiene el SVG del árbol en el HTML
    destroyTree(svgEl); // Lo destruye para construir el nuevo árbol.
    buildTree(); // Construye el nuevo arbol usando los datos guardados en sesionStorage

    createDataTable(); // Crea la tabla 
    loadData(); // Carga los datos
    createValueTable(1); // Crea la tabla de cálculos para el paso 1
    initialStep(); // muestra solo el primer nodo 
}

/**
 * Parses the example data and displays the right information about the dataset
 * @param {*} selectedExample The name of the selected example dataset
 */
function loadExampleData(selectedExample) {
    var filePath = null;
    switch (selectedExample) {
        case dataset1:
            filePath = "exampledata/playgolf_1.csv";
            break;
        case dataset2:
            filePath = "exampledata/playgolf_2.csv";
            break;
        case dataset3:
            filePath = "exampledata/iris.csv";
            break;
        case dataset4:
            filePath = "exampledata/mushrooms.csv";
            break;
        case dataset5:
            filePath = "exampledata/lenses.csv";
            break;
    }
    if (filePath != null) {
        $.ajax({
            type: "GET",
            url: filePath,
            dataType: "text",
            success: function (data) {
                var parsedData = Papa.parse(data, { skipEmptyLines: true });
                transformData(parsedData.data);
            }
        });


        let dataInfoContainer = document.getElementById("dataInfoContainer");
        if (dataInfoContainer.style.display == "none") {
            dataInfoContainer.style.display = "block";
        }
        let stepByStepContainer = document.getElementById("stepByStepContainer");
        if (stepByStepContainer.style.display == "none") {
            stepByStepContainer.style.display = "block";
        }

        var currentDatasetSpan = document.getElementById('currentDatasetSpan');
        currentDatasetSpan.textContent = selectedExample;

        var datasetCardBody = document.getElementById('datasetCardBody');
        if (datasetCardBody.style.display == "none") {
            datasetCardBody.style.display = "block";
        }

        var datasetCardText = document.getElementById('datasetCardText');
        datasetCardText.textContent = getDataInfo(selectedExample);

        var datasetCardLink = document.getElementById('datasetCardLink');
        datasetCardLink.href = getDataLink(selectedExample);
    }
}

export { loadExampleData, transformData, getAttributes, getLabelValsDataRows }
export default loadExampleData;
