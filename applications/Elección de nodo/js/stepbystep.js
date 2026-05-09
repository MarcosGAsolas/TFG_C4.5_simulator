// stepbystep.js

import { agregarFilaDataset, activarBotonesEliminarFila } from './classNumHandler.js';

let currentStep = 0;
let datosTablaOriginal = null;

const pasos = [
    {
        titulo: "Paso 1: Dataset inicial",
        texto: `
            Tenemos este dataset inicial de ejemplo para ver cómo se selecciona un nodo dentro de este dataset
            y poder explicar de manera adecuada el algoritmo. En este primer paso, puedes añadir o eliminar filas
            antes de iniciar el cálculo.
        `,
        render: renderPasoDatasetInicial
    },
    {
        titulo: "Paso 2: Ordenación del atributo Horas Estudio y obtención de Umbrales",
        texto: `
            Como vemos, al ordenar el subconjunto de Horas Estudio, se ordenan también las otras columnas.
            En este caso nos interesa la columna Aprueba, porque queremos observar cuándo cambia el resultado
            según recorremos el atributo Horas Estudio.

            Para calcular los umbrales, se escoge el último registro antes del cambio y el primero donde cambia
            el valor de la clase Aprueba. En este ejemplo, uno de los cambios se produce entre los valores 3 y 4.
        `,
        atributo: "Horas Estudio",
        claseObjetivo: "Aprueba",
        render: renderPasoOrdenacionHoras
    }
];

/**
 * Muestra el paso actual.
 */
function mostrarPaso() {
    const paso = pasos[currentStep];

    const stepCount = document.getElementById("stepCount");
    if (stepCount) {
        stepCount.textContent = `Paso: ${currentStep + 1}`;
    }

    const stepTitle = document.getElementById("stepTitle");
    if (stepTitle) {
        stepTitle.textContent = paso.titulo;
    }

    const stepText = document.getElementById("stepText");
    if (stepText) {
        stepText.textContent = paso.texto;
    }

    const tableContainer = document.getElementById("stepTableContainer");
    if (tableContainer) {
        limpiarElemento(tableContainer);
        paso.render(tableContainer, paso);
    }
}

/**
 * Limpia todo el contenido de un elemento.
 */
function limpiarElemento(elemento) {
    while (elemento.firstChild) {
        elemento.removeChild(elemento.firstChild);
    }
}

/**
 * Crea una celda td.
 */
function crearCelda(texto, clases = []) {
    const celda = document.createElement("td");
    celda.textContent = texto;

    clases.forEach(clase => {
        celda.classList.add(clase);
    });

    return celda;
}

/**
 * Crea una celda th.
 */
function crearCeldaCabecera(texto, clases = []) {
    const celda = document.createElement("th");
    celda.textContent = texto;

    clases.forEach(clase => {
        celda.classList.add(clase);
    });

    return celda;
}

/**
 * Crea botón.
 */
function crearBoton(texto, clases = []) {
    const boton = document.createElement("button");
    boton.type = "button";
    boton.textContent = texto;

    clases.forEach(clase => {
        boton.classList.add(clase);
    });

    return boton;
}

/**
 * Paso 1: tabla inicial editable.
 */
function renderPasoDatasetInicial(container) {
    const wrapper = document.createElement("div");
    wrapper.classList.add("table-responsive");

    const table = document.createElement("table");
    table.setAttribute("id", "table-dataset");
    table.classList.add(
        "table",
        "table-striped",
        "table-hover",
        "align-middle",
        "text-center"
    );

    const thead = crearCabeceraDatasetInicial();
    const tbody = crearCuerpoDatasetInicial();
    const tfoot = crearPieDatasetInicial();

    table.appendChild(thead);
    table.appendChild(tbody);
    table.appendChild(tfoot);

    wrapper.appendChild(table);
    container.appendChild(wrapper);

    const btnAdd = document.getElementById("btnAddDatasetRow");
    if (btnAdd) {
        btnAdd.addEventListener("click", agregarFilaDataset);
    }

    activarBotonesEliminarFila();
}

/**
 * Crea la cabecera de la tabla inicial.
 */
function crearCabeceraDatasetInicial() {
    const thead = document.createElement("thead");
    thead.classList.add("table-dark");

    const row = document.createElement("tr");

    const columnas = [
        "ID",
        "Horas Estudio",
        "Nota Simulacro",
        "Aprueba"
    ];

    columnas.forEach(nombreColumna => {
        const th = crearCeldaCabecera(nombreColumna);
        th.setAttribute("scope", "col");
        row.appendChild(th);
    });

    thead.appendChild(row);

    return thead;
}

/**
 * Crea el cuerpo de la tabla inicial con los datos de ejemplo.
 */
function crearCuerpoDatasetInicial() {
    const tbody = document.createElement("tbody");

    const filas = [
        [1, 6, 7, "Si"],
        [2, 2, 4, "No"],
        [3, 5, 6, "Si"],
        [4, 3, 5, "No"],
        [5, 7, 8, "Si"],
        [6, 4, 5, "Si"],
        [7, 1, 3, "No"],
        [8, 8, 9, "No"]
    ];

    filas.forEach(fila => {
        const tr = crearFilaDatasetInicial(fila);
        tbody.appendChild(tr);
    });

    return tbody;
}

/**
 * Crea una fila de la tabla inicial.
 */
function crearFilaDatasetInicial(fila) {
    const tr = document.createElement("tr");

    fila.forEach(valor => {
        const td = crearCelda(valor);
        tr.appendChild(td);
    });

    return tr;
}

/**
 * Crea el pie de la tabla inicial.
 */
function crearPieDatasetInicial() {
    const tfoot = document.createElement("tfoot");
    const tr = document.createElement("tr");

    const td = document.createElement("td");
    td.colSpan = 5;

    const boton = crearBoton("+ fila", [
        "btn",
        "btn-outline-primary"
    ]);

    boton.setAttribute("id", "btnAddDatasetRow");

    td.appendChild(boton);
    tr.appendChild(td);
    tfoot.appendChild(tr);

    return tfoot;
}

/**
 * Paso 2: tabla ordenada por Horas Estudio.
 */
function renderPasoOrdenacionHoras(container, paso) {
    const datos = datosTablaOriginal;

    const resultado = obtenerDatosOrdenadosPorAtributo(
        datos,
        paso.atributo,
        paso.claseObjetivo
    );

    const cambios = obtenerCambiosDeClase(resultado.filas);

    const wrapper = document.createElement("div");
    wrapper.classList.add("table-responsive");

    const table = document.createElement("table");
    table.classList.add(
        "table",
        "table-striped",
        "table-hover",
        "align-middle",
        "text-center"
    );

    const thead = crearCabeceraTablaOrdenada(resultado.cabecera);
    const tbody = crearCuerpoTablaOrdenada(resultado.filas, cambios);

    table.appendChild(thead);
    table.appendChild(tbody);

    wrapper.appendChild(table);
    container.appendChild(wrapper);

    const alerta = crearAlertaUmbrales(cambios);
    container.appendChild(alerta);
}

/**
 * Crea la cabecera de la tabla ordenada.
 */
function crearCabeceraTablaOrdenada(cabecera) {
    const thead = document.createElement("thead");
    thead.classList.add("table-dark");

    const tr = document.createElement("tr");

    cabecera.forEach(nombreColumna => {
        const th = crearCeldaCabecera(nombreColumna);
        tr.appendChild(th);
    });

    thead.appendChild(tr);

    return thead;
}

/**
 * Crea el cuerpo de la tabla ordenada.
 */
function crearCuerpoTablaOrdenada(filas, cambios) {
    const tbody = document.createElement("tbody");

    filas.forEach((fila, indice) => {
        const tr = document.createElement("tr");

        const cambioActual = cambios.find(cambio =>
            cambio.indiceAnterior === indice ||
            cambio.indiceSiguiente === indice
        );

        const tdValor = crearCelda(fila[0]);

        if (cambioActual) {
            tdValor.style.backgroundColor = cambioActual.color;
            tdValor.classList.add("fw-bold");
        }
        const tdClase = crearCelda(fila[1]);

        tr.appendChild(tdValor);
        tr.appendChild(tdClase);

        tbody.appendChild(tr);
    });

    return tbody;
}

/**
 * Crea la alerta con los umbrales candidatos.
 */
function crearAlertaUmbrales(cambios) {
    const alerta = document.createElement("div");
    alerta.classList.add("alert", "alert-info", "mt-3");

    const titulo = document.createElement("strong");
    titulo.textContent = "Umbrales candidatos:";

    alerta.appendChild(titulo);
    alerta.appendChild(document.createElement("br"));

    if (cambios.length === 0) {
        const texto = document.createTextNode("No se han encontrado cambios de clase.");
        alerta.appendChild(texto);
        return alerta;
    }

    cambios.forEach((cambio, indice) => {
        const texto = document.createTextNode(
            `${cambio.valorAnterior} y ${cambio.valorSiguiente} → umbral = ${cambio.umbral}`
        );

        alerta.appendChild(texto);

        if (indice < cambios.length - 1) {
            alerta.appendChild(document.createElement("br"));
        }
    });

    return alerta;
}

/**
 * Lee la tabla HTML del paso 1 y la transforma en formato parecido a CSV.
 */
function obtenerDatosTabla(idTabla) {
    const tabla = document.getElementById(idTabla);

    if (!tabla) {
        throw new Error(`No existe ninguna tabla con el id "${idTabla}"`);
    }

    const datos = [];

    const cabecera = [];
    const celdasCabecera = tabla.querySelectorAll("thead th");

    celdasCabecera.forEach((celda, indice) => {
        if (indice === 0) return;

        cabecera.push(celda.textContent.trim());
    });

    datos.push(cabecera);

    const filas = tabla.querySelectorAll("tbody tr");

    filas.forEach(fila => {
        const datosFila = [];
        const celdas = fila.querySelectorAll("td");

        celdas.forEach((celda, indiceCelda) => {
            if (indiceCelda === 0) return;

            datosFila.push(obtenerValorCelda(celda));
        });

        const filaTieneDatos = datosFila.some(valor => valor !== "");

        if (filaTieneDatos) {
            datos.push(datosFila);
        }
    });

    return datos;
}

/**
 * Obtiene el valor de una celda.
 */
function obtenerValorCelda(celda) {
    const input = celda.querySelector("input");

    if (input) {
        return input.value.trim();
    }

    return celda.textContent.trim();
}

/**
 * Ordena los datos por un atributo y devuelve solo:
 * atributo + clase objetivo.
 */
function obtenerDatosOrdenadosPorAtributo(datos, atributo, claseObjetivo) {
    const cabecera = datos[0];

    const indiceAtributo = cabecera.indexOf(atributo);
    const indiceClase = cabecera.indexOf(claseObjetivo);

    if (indiceAtributo === -1) {
        throw new Error(`No existe el atributo "${atributo}"`);
    }

    if (indiceClase === -1) {
        throw new Error(`No existe la clase objetivo "${claseObjetivo}"`);
    }

    const filas = datos.slice(1);

    const filasOrdenadas = [...filas].sort((a, b) => {
        return Number(a[indiceAtributo]) - Number(b[indiceAtributo]);
    });

    return {
        cabecera: [atributo, claseObjetivo],
        filas: filasOrdenadas.map(fila => [
            fila[indiceAtributo],
            fila[indiceClase]
        ])
    };
}

/**
 * Detecta en qué posiciones cambia la clase.
 */
function obtenerCambiosDeClase(filas) {
    const cambios = [];

    for (let i = 0; i < filas.length - 1; i++) {
        const claseActual = filas[i][1];
        const claseSiguiente = filas[i + 1][1];

        if (claseActual !== claseSiguiente) {
            const valorAnterior = Number(filas[i][0]);
            const valorSiguiente = Number(filas[i + 1][0]);

            cambios.push({
                indiceAnterior: i,
                indiceSiguiente: i + 1,
                valorAnterior,
                valorSiguiente,
                umbral: (valorAnterior + valorSiguiente) / 2,
                color: generarColorAleatorioSuave()
            });
        }
    }

    return cambios;
}

/**
 * Genera colores aleatorios para mostrar los diferentes umbrales
 * @returns devuelve un color aleatorio
 */
function generarColorAleatorioSuave() {
    const r = Math.floor(180 + Math.random() * 75);
    const g = Math.floor(180 + Math.random() * 75);
    const b = Math.floor(180 + Math.random() * 75);

    return `rgb(${r}, ${g}, ${b})`;
}

/**
 * Guarda los datos del paso 1 antes de pasar al paso 2.
 */
function guardarDatosIniciales() {
    datosTablaOriginal = obtenerDatosTabla("table-dataset");
}

/**
 * Ir al primer paso.
 */
function initialStep() {
    currentStep = 0;
    mostrarPaso();
}

/**
 * Ir un paso hacia delante.
 */
function stepForward() {
    if (currentStep >= pasos.length - 1) return;

    if (currentStep === 0) {
        try {
            guardarDatosIniciales();
        } catch (error) {
            alert(error.message);
            return;
        }
    }

    currentStep++;
    mostrarPaso();
}

/**
 * Ir un paso hacia atrás.
 */
function stepBack() {
    if (currentStep <= 0) return;

    currentStep--;
    mostrarPaso();
}

/**
 * Ir al último paso.
 */
function lastStep() {
    if (currentStep === 0) {
        try {
            guardarDatosIniciales();
        } catch (error) {
            alert(error.message);
            return;
        }
    }

    currentStep = pasos.length - 1;
    mostrarPaso();
}

/**
 * Volver a pintar el paso actual.
 */
function goToStep() {
    mostrarPaso();
}

export {
    initialStep,
    stepForward,
    stepBack,
    lastStep,
    goToStep
};

export default initialStep;