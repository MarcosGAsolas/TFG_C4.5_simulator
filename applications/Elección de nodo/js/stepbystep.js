// stepbystep.js

import { agregarFilaDataset, activarBotonesEliminarFila } from './classNumHandler.js';
import { calcularUmbral, calcularEntropiaParaUmbral, calcularGananciaInformacionParaUmbral  } from '../../lib/funcionesCalcAlgC45.js'; 

let currentStep = 0;
let datosTablaOriginal = null;
let primerValorUmbral = null;
let segundoValorUmbral = null;
let formulaUmbral = null;


const pasos = [
    {
        tituloPagina: "Elección de nodos",
        textoPagina: `La elección de nodos se consigue determinando qué subconjunto del conjunto que estamos analizando
                tiene el Gain Ratio más alto, para poder elegir el mejor candidato y seguir formando nuestro árbol
                de decisión.`,
        titulo: "Paso 1: Dataset inicial",
        textoPagina: `La elección de nodos se consigue determinando qué subconjunto del conjunto que estamos analizando tiene el Gain Ratio más alto, para poder elegir el mejor candidato y seguir formando nuestro árbol de decisión.`,
        texto: `
            Tenemos este dataset inicial de ejemplo para ver cómo se selecciona un nodo dentro de este dataset
            y poder explicar de manera adecuada el algoritmo. En este primer paso, puedes añadir o eliminar filas
            antes de iniciar el cálculo.
        `,
        render: renderPasoDatasetInicial
    },
    {
        tituloPagina: "Elección de Nodos: Umbral",
        textoPagina: `Como en el subconjunto no tenemos separaciónes claras de datos, 
                        necesitamos poner un umbral, para poder sacar nodos y dividirlo en una decisión binaria, 
                        es decir, el nodo se convertirá, en vez de un número, en si es menor o igual que ese umbral o no. `,
        titulo: "Paso 2: Ordenación del atributo Horas Estudio y obtención de Umbrales y su Entropia",
        texto: () => `
                Como vemos, al ordenar el subconjunto de Horas Estudio, se ordenan también las otras columnas.
                En este caso nos interesa la columna Aprueba, porque queremos observar cuándo cambia el resultado
                según recorremos el atributo Horas Estudio.

                Para calcular los umbrales, se escoge el último registro antes del cambio y el primero donde cambia
                el valor de la clase Aprueba.

                En este ejemplo, uno de los cambios se produce entre los valores
                ${primerValorUmbral} y ${segundoValorUmbral}.
            `,
        atributo: "Horas Estudio",
        claseObjetivo: "Aprueba",
        NombreColumnasAñadirTabla: ["Umbral","Umbral calculado","Entropía"],
        render: renderPasoOrdenacionHoras
    },
    {
        tituloPagina: "Elección de Nodos: Ganancia de información",
        textoPagina: `Una vez que tenemos tanto la entropia calculada de cada umbral, ahora lo que nos toca saber es cuanto mejora cada umbral la entropia inicial del conjunto.`,
        titulo: "Paso 3: Obtención de la Ganancia de la información de cada Umbral",
        texto: () => ` Ya que tenemos calculada la entropia de los dos umbrales, vamos a ver el siguiente atributo a calcular, que es la:`,
        atributo: "Horas Estudio",
        claseObjetivo: "Aprueba",
        NombreColumnasAñadirTabla: ["Umbral","Umbral calculado","Entropía","Ganancia Información"],
        render: renderPasoGananciaDeInformacion
    }
];

/**
 * Muestra el paso actual.
 */
function mostrarPaso() {
    const paso = pasos[currentStep];

    const tituloPagina = document.getElementById("titulo-pagina");
    if (tituloPagina) {

        if(currentStep === 2){
            tituloPagina.classList.remove("display-1")
            tituloPagina.classList.add("display-3")
        }else{
            tituloPagina.classList.add("display-1")
        }

        tituloPagina.textContent = paso.tituloPagina;
    }
   

    const textoPagina = document.getElementById("texto-pagina");
    if (textoPagina) {
        textoPagina.textContent = paso.textoPagina;
    }

    const stepTitle = document.getElementById("stepTitle");
    if (stepTitle) {
        stepTitle.textContent = paso.titulo;
    }
    const stepExtraContainer = document.getElementById("stepExtraContainer");
    if (stepExtraContainer) {
        limpiarElemento(stepExtraContainer);
    }

    const tableContainer = document.getElementById("stepTableContainer");
    if (tableContainer) {
        limpiarElemento(tableContainer);
        paso.render(tableContainer, paso);
    }

    const stepText = document.getElementById("stepText");
    if (stepText) {
        stepText.textContent =
            typeof paso.texto === "function"
                ? paso.texto()
                : paso.texto;
    }

    const formulaUmbral = document.getElementById("formulaUmbral");
    if(currentStep !== 1){
        limpiarElemento(formulaUmbral);
        formulaUmbral.classList.remove("bg-warning")
    }

    
    if(currentStep === 1){
        
        if (formulaUmbral) {
            formulaUmbral.classList.add("bg-warning")
            formulaUmbral.textContent = "Formula para calcular el Umbral: n1 + n2 / 2";
        }
    }

    const infoCardContainer = document.getElementById("infoCardContainer");
    if (infoCardContainer) {
        limpiarElemento(infoCardContainer);

        if (currentStep === 2) {
            infoCardContainer.appendChild(crearInfoCardGananciaInformacion());
        }
    }
}

/**
 * Limpia todo el contenido de un elemento.
 */
function limpiarElemento(elemento) {
    while (elemento.firstChild) {
        primerValorUmbral = null;
        segundoValorUmbral = null;
        formulaUmbral = null;
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

    const stepExtraContainer = document.getElementById("stepExtraContainer");
    if (stepExtraContainer) {
        limpiarElemento(stepExtraContainer);
        stepExtraContainer.appendChild(crearTablaUmbrales(cambios, resultado.filas, paso.NombreColumnasAñadirTabla));
    }
}


/**
 * Crea una tabla con los umbrales candidatos.
 */
function crearTablaUmbrales(cambios, filasOrdenadas, nombresColumnas) {
    const wrapper = document.createElement("div");
    wrapper.classList.add("table-responsive");

    const table = document.createElement("table");
    table.classList.add(
        "table",
        "table-bordered",
        "table-hover",
        "align-middle",
        "text-center",
        "mt-3"
    );

    const thead = document.createElement("thead");
    thead.classList.add("table-dark");

    const trHead = document.createElement("tr");

    nombresColumnas.forEach(nombreColumna => {
        const th = crearCeldaCabecera(nombreColumna);
        trHead.appendChild(th);
    });

    thead.appendChild(trHead);
    table.appendChild(thead);

    const tbody = document.createElement("tbody");

    if (cambios.length === 0) {
        const tr = document.createElement("tr");
        const td = crearCelda("No se han encontrado cambios de clase.");
        td.colSpan = 3;
        tr.appendChild(td);
        tbody.appendChild(tr);
    } else {
        cambios.forEach(cambio => {
            const tr = document.createElement("tr");

            const tdUmbral = crearCelda(`${cambio.valorAnterior} - ${cambio.valorSiguiente}`);
            const tdUmbralCalculado = crearCelda(cambio.umbral.toFixed(2));
            

            const entropiaUmbral = calcularEntropiaParaUmbral(
                filasOrdenadas,
                cambio.umbral
            );

            const tdEntropia = crearCelda(entropiaUmbral.toFixed(2));

            if(currentStep === 1){
                tdUmbralCalculado.style.backgroundColor = cambio.color;
                tdEntropia.style.backgroundColor = cambio.color;
            }
            
            tdUmbral.classList.add("fw-bold");
            tdUmbralCalculado.classList.add("fw-bold");
            tdEntropia.classList.add("fw-bold");
            

            tr.appendChild(tdUmbral);
            tr.appendChild(tdUmbralCalculado);
            tr.appendChild(tdEntropia);

            if(currentStep === 2){
                const gananciaInformacion = calcularGananciaInformacionParaUmbral(
                    filasOrdenadas,
                    cambio.umbral
                );
                const tdGananciaInformacion = crearCelda(gananciaInformacion.toFixed(2))
                tdGananciaInformacion.classList.add("fw-bold")
                tdGananciaInformacion.style.backgroundColor = cambio.color;
                tr.appendChild(tdGananciaInformacion);
            }
            tbody.appendChild(tr);
        });
    }

    table.appendChild(tbody);
    wrapper.appendChild(table);

    return wrapper;
}

/**
 * Paso 3: Ganancia de la información.
 */
function renderPasoGananciaDeInformacion(container, paso) {
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

    const stepExtraContainer = document.getElementById("stepExtraContainer");
    if (stepExtraContainer) {
        limpiarElemento(stepExtraContainer);
        stepExtraContainer.appendChild(crearTablaUmbrales(cambios, resultado.filas, paso.NombreColumnasAñadirTabla));
    }
}

function crearInfoCardGananciaInformacion() {
    const card = document.createElement("div");
    card.classList.add("card", "bg-light", "mx-auto");

    // GENERAL INFO HEADER
    const generalHeader = document.createElement("div");
    generalHeader.classList.add("card-header", "fs-6");
    generalHeader.setAttribute("id", "generalInfoGain");

    const generalLink = document.createElement("a");
    generalLink.classList.add(
        "collapsed",
        "d-block",
        "link-body-emphasis",
        "link-offset-2",
        "link-offset-2-hover",
        "link-underline",
        "link-underline-opacity-0",
        "link-underline-opacity-50-hover"
    );
    generalLink.setAttribute("data-bs-toggle", "collapse");
    generalLink.setAttribute("href", "#generalInfoGainBody");
    generalLink.setAttribute("aria-expanded", "false");
    generalLink.setAttribute("aria-controls", "generalInfoGainBody");
    generalLink.textContent = "Información General de la Ganancia de la Información";

    generalHeader.appendChild(generalLink);
    card.appendChild(generalHeader);

    const generalCollapse = document.createElement("div");
    generalCollapse.classList.add("collapse");
    generalCollapse.setAttribute("id", "generalInfoGainBody");
    generalCollapse.setAttribute("aria-labelledby", "generalInfoGain");

    const generalBody = document.createElement("div");
    generalBody.classList.add("card-body");

    const generalText = document.createElement("p");
    generalText.classList.add("card-text", "fw-light");
    generalText.textContent = "La ganancia de información mide la reducción de la entropía después de dividir el conjunto de datos. C4.5 selecciona inicialmente el atributo con la mayor ganancia de información.";

    generalBody.appendChild(generalText);
    generalCollapse.appendChild(generalBody);
    card.appendChild(generalCollapse);

    // CALCULATION HEADER
    const calcHeader = document.createElement("div");
    calcHeader.classList.add("card-header", "fs-6");
    calcHeader.setAttribute("id", "calculationGain");

    const calcLink = document.createElement("a");
    calcLink.classList.add(
        "collapsed",
        "d-block",
        "link-body-emphasis",
        "link-offset-2",
        "link-offset-2-hover",
        "link-underline",
        "link-underline-opacity-0",
        "link-underline-opacity-50-hover"
    );
    calcLink.setAttribute("data-bs-toggle", "collapse");
    calcLink.setAttribute("href", "#calcInfoGainBody");
    calcLink.setAttribute("aria-expanded", "false");
    calcLink.setAttribute("aria-controls", "calcInfoGainBody");
    calcLink.textContent = "Cálculo";

    calcHeader.appendChild(calcLink);
    card.appendChild(calcHeader);

    const calcCollapse = document.createElement("div");
    calcCollapse.classList.add("collapse");
    calcCollapse.setAttribute("id", "calcInfoGainBody");
    calcCollapse.setAttribute("aria-labelledby", "calculationGain");

    const calcBody = document.createElement("div");
    calcBody.classList.add("card-body");

    const calcTextIntro = document.createElement("p");
    calcTextIntro.classList.add("card-text", "fw-light");
    calcTextIntro.textContent =
        "La ganancia de información mide cuánto disminuye la incertidumbre del conjunto S al dividirlo basándose en un atributo A.";

    const formula = document.createElement("ul");
    formula.classList.add("card-text", "fw-light", "text-center", "fw-bold");
    formula.textContent =
        "\\(Gain(S, A) = E(S) - \\sum_{v \\in Valores(A)} \\frac{\\vert{}S_v\\vert{}}{\\vert{}S\\vert{}} E(S_v)\\)";

    const whereText = document.createElement("p");
    whereText.classList.add("card-text", "fw-light");
    whereText.textContent = "Donde:";

    const ul = document.createElement("ul");
    ul.classList.add("card-text", "fw-light");

    const variables = [
        "\\(S\\) es el conjunto de datos que estamos analizando.",
        "\\(A\\) es el atributo que usamos para dividir el conjunto.",
        "\\(Valores(A)\\) representa los valores posibles del atributo A.",
        "\\(v\\) es cada valor concreto del atributo A.",
        "\\(S_v\\) es el subconjunto de S formado por los ejemplos donde el atributo A toma el valor v.",
        "\\(\\vert{}S_v\\vert{} / \\vert{}S\\vert{}\\) es el peso o proporción de ese subconjunto.",
        "\\(E(S)\\) es la entropía del conjunto original.",
        "\\(E(S_v)\\) es la entropía del subconjunto generado por el valor v."
    ];

    variables.forEach(texto => {
        const li = document.createElement("li");
        li.textContent = texto;
        ul.appendChild(li);
    });

    calcBody.appendChild(calcTextIntro);
    calcBody.appendChild(formula);
    calcBody.appendChild(whereText);
    calcBody.appendChild(ul);
    calcCollapse.appendChild(calcBody);
    card.appendChild(calcCollapse);

    setTimeout(() => {
        if (window.MathJax) {
            MathJax.typesetPromise();
        }
    }, 0);

    return card;
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
 * Lee la tabla HTML del paso 1 y la transforma en formato parecido a CSV.
 */
function obtenerDatosTabla(idTabla) {
    const tabla = document.getElementById(idTabla);

    if (!tabla) {
        throw new Error(`No existe ninguna t
            abla con el id "${idTabla}"`);
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
function obtenerCambiosDeClase(filas, entropiaConjuntoOriginal) {
    const cambios = [];

    for (let i = 0; i < filas.length - 1; i++) {
        const claseActual = filas[i][1];
        const claseSiguiente = filas[i + 1][1];

        if (claseActual !== claseSiguiente) {
            const valorAnterior = Number(filas[i][0]);
            const valorSiguiente = Number(filas[i + 1][0]);

            if(primerValorUmbral == null && segundoValorUmbral == null){
                primerValorUmbral = valorAnterior;
                segundoValorUmbral = valorSiguiente;
            }

            cambios.push({
                indiceAnterior: i,
                indiceSiguiente: i + 1,
                valorAnterior,
                valorSiguiente,
                umbral: calcularUmbral(valorAnterior, valorSiguiente),
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