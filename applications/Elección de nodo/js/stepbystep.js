import {
    calcularUmbral,
    calcularEntropiaParaUmbral,
    calcularEntropiaDeGrupo,
    calcularGananciaInformacionParaUmbral
} from '../../lib/funcionesCalcAlgC45.js';

let currentStep = 0;
let datosTablaOriginal = null;

const pasos = [
    {
        titulo: "Cálculo de umbral",
        texto: "",
        atributo: "Valor",
        claseObjetivo: "Clase",
        columnasResultado: ["Umbral", "Umbral calculado", "Entropía"],
        render: renderPasoUmbral
    },
    {
        titulo: "Cálculo de ganancia de la información",
        texto: "Con los umbrales calculados, se puede medir cuánto reduce cada división la incertidumbre del dataset.",
        columnasResultado: ["Umbral", "Umbral calculado", "Entropía", "Ganancia de información"],
        render: renderPasoGananciaDeInformacion
    },
    {
        titulo: "Split Info",
        texto: "",
        columnasResultado: ["Umbral", "Umbral calculado", "Entropía", "Ganancia de información", "Split Info"],
        render: renderPasoSplitInfo
    },
    {
        titulo: "Gain Ratio",
        texto: "",
        columnasResultado: ["Umbral", "Umbral calculado", "Entropía", "Ganancia de información", "Split Info", "Gain Ratio"],
        render: renderPasoGainRatio
    },
    {
        titulo: "Nodo elegido",
        texto: "",
        columnasResultado: ["Umbral", "Umbral calculado", "Entropía", "Ganancia de información", "Split Info", "Gain Ratio"],
        render: renderPasoNodoElegido
    }
];

function mostrarPaso() {
    const paso = pasos[currentStep];

    actualizarBotonActivo(currentStep);

    const stepTitle = document.getElementById("stepTitle");
    if (stepTitle) {
        stepTitle.textContent = paso.titulo;
    }

    const stepText = document.getElementById("stepText");
    if (stepText) {
        stepText.textContent = paso.texto;
    }

    limpiarElementoPorId("infoCardContainer");
    limpiarElementoPorId("formulaUmbral");
    limpiarElementoPorId("stepTableContainer");
    limpiarElementoPorId("stepExtraContainer");
    limpiarElementoPorId("legendContainer");
    mostrarFilaLeyenda(false);
    actualizarLayoutResultados(false);

    const infoCardContainer = document.getElementById("infoCardContainer");
    if (infoCardContainer && currentStep === 0) {
        infoCardContainer.appendChild(crearInfoCardUmbral());
    }

    if (infoCardContainer && currentStep === 1) {
        infoCardContainer.appendChild(crearInfoCardGananciaInformacion());
    }

    if (infoCardContainer && currentStep === 2) {
        infoCardContainer.appendChild(crearInfoCardSplitInfo());
    }

    if (infoCardContainer && currentStep === 3) {
        infoCardContainer.appendChild(crearInfoCardGainRatio());
    }

    if (infoCardContainer && currentStep === 4) {
        infoCardContainer.appendChild(crearInfoCardNodoElegido());
    }

    const formulaUmbral = document.getElementById("formulaUmbral");
    if (formulaUmbral && currentStep === 0) {
        formulaUmbral.appendChild(crearCalculadoraUmbralManual());
    }

    if (formulaUmbral && currentStep === 1) {
        formulaUmbral.appendChild(crearCalculadoraGananciaInformacionManual());
    }

    if (formulaUmbral && currentStep === 2) {
        formulaUmbral.appendChild(crearCalculadoraSplitInfoManual());
    }

    if (formulaUmbral && currentStep === 3) {
        formulaUmbral.appendChild(crearCalculadoraGainRatioManual());
    }

    if (formulaUmbral && currentStep === 4) {
        formulaUmbral.appendChild(crearVisualizadorNodoElegido());
    }

    const tableContainer = document.getElementById("stepTableContainer");
    if (tableContainer) {
        paso.render(tableContainer, paso);
    }

    renderizarLeyendaPasoActual();

    renderizarMathJax();
}

function limpiarElementoPorId(idElemento) {
    const elemento = document.getElementById(idElemento);
    if (!elemento) return;

    while (elemento.firstChild) {
        elemento.removeChild(elemento.firstChild);
    }
}

function limpiarElemento(elemento) {
    while (elemento.firstChild) {
        elemento.removeChild(elemento.firstChild);
    }
}

function actualizarLayoutResultados(mostrarResultados) {
    const resultsContainer = document.getElementById("stepExtraContainer");
    const workspace = resultsContainer ? resultsContainer.parentElement : null;
    const row = workspace ? workspace.closest(".step-layout-row") : null;

    if (workspace) {
        workspace.classList.toggle("threshold-results-layout", mostrarResultados);
    }

    if (row) {
        row.classList.toggle("threshold-results-active", mostrarResultados);
    }
}

function crearCelda(texto, clases = []) {
    const celda = document.createElement("td");
    celda.textContent = texto;
    clases.forEach(clase => celda.classList.add(clase));
    return celda;
}

function crearCeldaCabecera(texto, clases = []) {
    const celda = document.createElement("th");
    celda.textContent = texto;
    clases.forEach(clase => celda.classList.add(clase));
    return celda;
}

function hacerCeldaInteractiva(celda, titulo, accion) {
    celda.classList.add("interactive-calculation-cell");
    celda.tabIndex = 0;
    celda.title = titulo;
    celda.setAttribute("role", "button");
    celda.addEventListener("click", accion);
    celda.addEventListener("keydown", event => {
        if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            accion();
        }
    });
    return celda;
}

function crearCabeceraInteractiva(nombreColumna) {
    const th = crearCeldaCabecera("");
    const boton = crearBoton(nombreColumna, ["interactive-header-btn"]);
    const info = obtenerInfoCabeceraInteractiva(nombreColumna);

    if (!info) {
        th.textContent = nombreColumna;
        return th;
    }

    boton.title = info.titulo;
    boton.addEventListener("click", info.accion);
    th.appendChild(boton);
    return th;
}

function obtenerInfoCabeceraInteractiva(nombreColumna) {
    const pasosPorColumna = {
        "Umbral": 0,
        "Umbral calculado": 0,
        "Ganancia de información": 1,
        "Split Info": 2,
        "Gain Ratio": 3
    };

    if (nombreColumna === "Entropía") {
        return {
            titulo: "Abrir la sección de Entropía.",
            accion: () => {
                window.location.href = "../entropia/index.html";
            }
        };
    }

    if (Object.prototype.hasOwnProperty.call(pasosPorColumna, nombreColumna)) {
        return {
            titulo: `Ir a la sección de ${nombreColumna}.`,
            accion: () => navegarAPasoConResultados(pasosPorColumna[nombreColumna])
        };
    }

    return null;
}

function crearBoton(texto, clases = []) {
    const boton = document.createElement("button");
    boton.type = "button";
    boton.textContent = texto;
    clases.forEach(clase => boton.classList.add(clase));
    return boton;
}

function crearInput(tipo, valor = "") {
    const input = document.createElement("input");
    input.type = tipo;
    input.value = valor;
    input.classList.add("form-control");
    return input;
}

function renderPasoUmbral(container) {
    container.appendChild(crearTablaEntradaUmbral());
    renderizarTablasResultadoUmbral(["Valor", "Clase"], [], [], pasos[0].columnasResultado, true);
    actualizarLayoutResultados(true);
}

function renderPasoGananciaDeInformacion(container, paso) {
    container.appendChild(crearTablaEntradaUmbral());
    renderizarTablasResultadoUmbral(["Valor", "Clase"], [], [], paso.columnasResultado, true);
    actualizarLayoutResultados(true);
}

function renderPasoSplitInfo(container, paso) {
    container.appendChild(crearTablaEntradaUmbral());
    renderizarTablasResultadoUmbral(["Valor", "Clase"], [], [], paso.columnasResultado, true);
    actualizarLayoutResultados(true);
}

function renderPasoGainRatio(container, paso) {
    container.appendChild(crearTablaEntradaUmbral());
    renderizarTablasResultadoUmbral(["Valor", "Clase"], [], [], paso.columnasResultado, true);
    actualizarLayoutResultados(true);
}

function renderPasoNodoElegido(container, paso) {
    container.appendChild(crearTablaEntradaUmbral());
    renderizarTablasResultadoUmbral(["Valor", "Clase"], [], [], paso.columnasResultado, true);
    actualizarLayoutResultados(true);
}

function crearTablaEntradaUmbral() {
    const bloque = document.createElement("div");
    bloque.classList.add("threshold-table-card");
    const textoAccion = obtenerTextoAccionCalculo();

    const encabezado = document.createElement("div");
    encabezado.classList.add("threshold-table-header");

    const titulo = document.createElement("h3");
    titulo.classList.add("threshold-table-title");
    titulo.textContent = "Tabla de datos";

    const intro = document.createElement("div");
    intro.classList.add("threshold-table-intro");

    const subtitulo = document.createElement("p");
    subtitulo.classList.add("threshold-table-description");
    subtitulo.textContent = `Genera valores aleatorios para completar la tabla y calcular ${textoAccion.descripcion}.`;

    encabezado.appendChild(titulo);
    intro.appendChild(subtitulo);

    const wrapper = document.createElement("div");
    wrapper.classList.add("table-responsive", "threshold-table-scroll");

    const table = document.createElement("table");
    table.id = "tabla-datos-umbral";
    table.classList.add("table", "align-middle", "text-center", "threshold-data-table");

    const thead = document.createElement("thead");
    const trHead = document.createElement("tr");

    const thValor = crearCeldaCabecera("Valor");
    const thClase = crearCeldaCabecera("Clase");

    trHead.appendChild(thValor);
    trHead.appendChild(thClase);
    thead.appendChild(trHead);

    const tbody = document.createElement("tbody");
    tbody.id = "cuerpo-tabla-umbral";

    table.appendChild(thead);
    table.appendChild(tbody); 
    bloque.appendChild(encabezado);
    bloque.appendChild(intro); 
    bloque.appendChild(crearGeneradorTablaUmbral());
    bloque.appendChild(crearAccionesTablaUmbral(textoAccion));
    wrapper.appendChild(table);
    bloque.appendChild(wrapper); 

    return bloque;
}

function obtenerTextoAccionCalculo() {
    if (currentStep === 1) {
        return {
            boton: "Calcular ganancia",
            descripcion: "la ganancia de información de cada umbral"
        };
    }

    if (currentStep === 2) {
        return {
            boton: "Calcular Split Info",
            descripcion: "el Split Info de cada umbral"
        };
    }

    if (currentStep === 3) {
        return {
            boton: "Calcular Gain Ratio",
            descripcion: "el Gain Ratio de cada umbral"
        };
    }

    if (currentStep === 4) {
        return {
            boton: "Elegir nodo",
            descripcion: "el nodo con mejor Gain Ratio"
        };
    }

    return {
        boton: "Calcular umbrales",
        descripcion: "los umbrales candidatos"
    };
}

function crearGeneradorTablaUmbral() {
    const generador = document.createElement("div");
    generador.classList.add("threshold-generator");

    const campos = [
        {
            id: "generador-min-umbral",
            label: "Mínimo",
            type: "number",
            value: "1",
            min: "0"
        },
        {
            id: "generador-max-umbral",
            label: "Máximo",
            type: "number",
            value: "20",
            min: "0"
        },
        {
            id: "generador-clases-umbral",
            label: "Clases posibles",
            type: "text",
            value: "Sí, No",
            placeholder: "Sí, No, Tal vez"
        },
        {
            id: "generador-filas-umbral",
            label: "Filas",
            type: "number",
            value: "8",
            min: "2"
        }
    ];

    campos.forEach(campo => {
        const grupo = document.createElement("label");
        grupo.classList.add("threshold-generator-field");

        const texto = document.createElement("span");
        texto.textContent = campo.label;

        const input = crearInput(campo.type, campo.value);
        input.id = campo.id;

        if (campo.min != null) {
            input.min = campo.min;
        }

        if (campo.placeholder != null) {
            input.placeholder = campo.placeholder;
        }

        if (campo.type === "number") {
            input.step = "1";
            input.addEventListener("input", () => {
                if (Number(input.value) < 0) {
                    input.value = "0";
                }
            });
        }

        grupo.appendChild(texto);
        grupo.appendChild(input);
        generador.appendChild(grupo);
    });

    return generador;
}

function crearAccionesTablaUmbral(textoAccion) {
    const acciones = document.createElement("div");
    acciones.classList.add("threshold-table-actions");

    const botonGenerar = crearBoton("", ["btn", "btn-outline-dark", "threshold-generate-btn"]);
    botonGenerar.innerHTML = '<i class="bi bi-shuffle" aria-hidden="true"></i><span>Generar tabla</span>';
    botonGenerar.addEventListener("click", generarTablaUmbralAleatoria);

    const botonCalcular = crearBoton("", ["btn", "btn-dark", "threshold-calc-btn"]);
    botonCalcular.innerHTML = `<i class="bi bi-calculator" aria-hidden="true"></i><span>${textoAccion.boton}</span>`;
    botonCalcular.addEventListener("click", calcularUmbralesDeTabla);

    acciones.appendChild(botonGenerar);
    acciones.appendChild(botonCalcular);

    return acciones;
}

function agregarFilaTablaUmbral(valor = "", clase = "") {
    const tbody = document.getElementById("cuerpo-tabla-umbral");
    if (!tbody) return;

    const tr = document.createElement("tr");

    const tdValor = document.createElement("td");
    const inputValor = crearInput("number", valor);
    inputValor.step = "any";
    inputValor.min = "0";
    inputValor.addEventListener("input", () => {
        if (Number(inputValor.value) < 0) {
            inputValor.value = "0";
        }
    });
    tdValor.appendChild(inputValor);

    const tdClase = document.createElement("td");
    const inputClase = crearInput("text", clase);
    inputClase.addEventListener("input", () => {
        inputClase.value = inputClase.value.replace(/[0-9]/g, "");
    });
    tdClase.appendChild(inputClase);

    tr.appendChild(tdValor);
    tr.appendChild(tdClase);
    tbody.appendChild(tr);
}

function generarTablaUmbralAleatoria() {
    const minInput = document.getElementById("generador-min-umbral");
    const maxInput = document.getElementById("generador-max-umbral");
    const clasesInput = document.getElementById("generador-clases-umbral");
    const filasInput = document.getElementById("generador-filas-umbral");
    const tbody = document.getElementById("cuerpo-tabla-umbral");
    const contenedorResultados = document.getElementById("stepExtraContainer");

    if (!minInput || !maxInput || !clasesInput || !filasInput || !tbody) return;

    if (contenedorResultados) {
        renderizarTablasResultadoUmbral(["Valor", "Clase"], [], [], pasos[currentStep].columnasResultado, true);
    }

    limpiarNodoElegido();
    actualizarLayoutResultados(true);

    const minimo = Number(minInput.value);
    const maximo = Number(maxInput.value);
    const numeroFilas = Number(filasInput.value);
    const clases = clasesInput.value
        .split(",")
        .map(clase => clase.trim())
        .filter(clase => clase !== "" && !/[0-9]/.test(clase));
    const clasesDemasiadoLargas = clases.filter(clase => clase.length > 6);

    if (!Number.isFinite(minimo) || !Number.isFinite(maximo) || minimo < 0 || maximo < 0) {
        mostrarErrorGenerador("El rango debe tener números válidos y positivos.");
        return;
    }

    if (minimo > maximo) {
        mostrarErrorGenerador("El mínimo no puede ser mayor que el máximo.");
        return;
    }

    if (!Number.isInteger(numeroFilas) || numeroFilas < 2) {
        mostrarErrorGenerador("El número de filas debe ser al menos 2.");
        return;
    }

    if (clases.length === 0) {
        mostrarErrorGenerador("Escribe al menos una clase sin números, separada por comas.");
        return;
    }

    if (clasesDemasiadoLargas.length > 0) {
        mostrarErrorGenerador("Cada clase separada por comas puede tener como máximo 6 caracteres.");
        return;
    }

    limpiarErrorGenerador();
    limpiarElemento(tbody);

    for (let i = 0; i < numeroFilas; i++) {
        const valor = generarEnteroAleatorio(minimo, maximo);
        const clase = clases[generarEnteroAleatorio(0, clases.length - 1)];
        agregarFilaTablaUmbral(String(valor), clase);
    }
}

function generarEnteroAleatorio(minimo, maximo) {
    return Math.floor(Math.random() * (maximo - minimo + 1)) + minimo;
}

function mostrarErrorGenerador(texto) {
    limpiarErrorGenerador();

    const generador = document.querySelector(".threshold-generator");
    if (!generador) return;

    const mensaje = crearAlertaError(texto);
    mensaje.id = "threshold-generator-error";
    mensaje.classList.add("threshold-generator-error");
    generador.appendChild(mensaje);
}

function limpiarErrorGenerador() {
    const mensaje = document.getElementById("threshold-generator-error");
    if (mensaje) {
        mensaje.remove();
    }
}

function calcularUmbralesDeTabla() {
    const contenedorResultados = document.getElementById("stepExtraContainer");
    if (!contenedorResultados) return;

    limpiarErrorCalculoPrincipal();

    try {
        datosTablaOriginal = obtenerDatosTablaUmbral();
        const resultado = obtenerDatosOrdenadosPorAtributo(datosTablaOriginal, datosTablaOriginal[0][0], datosTablaOriginal[0][1]);
        const cambios = obtenerCambiosDeClase(resultado.filas);

        renderizarTablasResultadoUmbral(resultado.cabecera, resultado.filas, cambios, pasos[currentStep].columnasResultado);
        if (currentStep === 4) {
            renderizarNodoElegido(resultado.cabecera[0], resultado.filas, cambios);
        }
        actualizarLayoutResultados(true);
    } catch (error) {
        const alerta = crearAlertaError(error.message);
        alerta.id = "threshold-calculation-error";
        contenedorResultados.appendChild(alerta);
    }
}

function limpiarErrorCalculoPrincipal() {
    const alerta = document.getElementById("threshold-calculation-error");
    if (alerta) {
        alerta.remove();
    }
}

function renderizarTablasResultadoUmbral(cabecera, filas, cambios, nombresColumnas, mostrarVacias = false) {
    const contenedorResultados = document.getElementById("stepExtraContainer");
    if (!contenedorResultados) return;

    limpiarElemento(contenedorResultados);
    contenedorResultados.appendChild(crearTablaOrdenada(cabecera, filas, cambios, mostrarVacias));
    contenedorResultados.appendChild(crearTablaUmbrales(cambios, filas, nombresColumnas, mostrarVacias));
}

function renderizarLeyendaPasoActual() {
    const contenedorLeyenda = document.getElementById("legendContainer");
    if (!contenedorLeyenda) return;

    const datosLeyenda = obtenerDatosLeyenda(currentStep);
    if (!datosLeyenda) return;

    mostrarFilaLeyenda(true);
    contenedorLeyenda.appendChild(crearLeyenda(datosLeyenda));
}

function mostrarFilaLeyenda(mostrar) {
    const filaLeyenda = document.getElementById("legendRow");
    if (filaLeyenda) {
        filaLeyenda.classList.toggle("d-none", !mostrar);
    }
}

function obtenerDatosLeyenda(stepIndex) {
    const itemsLeyendaUmbral = [
        {
            tipo: "swatch",
            titulo: "Cambio de clase",
            texto: "Las celdas amarillas de la tabla ordenada indican las filas donde cambia la clase entre valores consecutivos. Esos cambios permiten calcular los umbrales candidatos."
        },
        {
            icono: "bi-sort-numeric-down",
            titulo: "Tabla ordenada",
            texto: "Los datos se ordenan por valor como primer paso para identificar correctamente los umbrales."
        }
    ];
    const itemsLeyendaNodo = [
        ...itemsLeyendaUmbral,
        {
            tipo: "swatch",
            titulo: "Hoja definitiva",
            texto: "En la visualización del nodo elegido, una hoja amarilla indica que esa rama ya es definitiva. Esto significa que todos los valores de la columna de clase de esa rama coinciden con el valor mostrado dentro de la hoja."
        },
        {
            icono: "bi-signpost-split",
            titulo: "Condición de la rama",
            texto: "Las etiquetas <= umbral y > umbral indican qué valores siguen cada camino: una rama agrupa los valores menores o iguales al umbral y la otra agrupa los valores superiores al umbral."
        }
    ];

    const leyendas = [
        {
            id: "legendUmbralBody",
            items: itemsLeyendaUmbral
        },
        {
            id: "legendGainBody",
            items: itemsLeyendaUmbral
        },
        {
            id: "legendSplitInfoBody",
            items: itemsLeyendaUmbral
        },
        {
            id: "legendGainRatioBody",
            items: itemsLeyendaUmbral
        },
        {
            id: "legendNodeBody",
            items: itemsLeyendaNodo
        }
    ];

    return leyendas[stepIndex];
}

function obtenerDatosTablaUmbral() {
    const filas = document.querySelectorAll("#cuerpo-tabla-umbral tr");

    if (filas.length < 2) {
        throw new Error("Añade al menos dos filas para poder calcular umbrales.");
    }

    const datos = [["Valor", "Clase"]];

    filas.forEach(fila => {
        const valor = fila.cells[0].querySelector("input").value.trim();
        const clase = fila.cells[1].querySelector("input").value.trim();

        if (valor === "" || clase === "") {
            throw new Error("Completa todas las filas antes de calcular.");
        }

        const valorNumerico = Number(valor);

        if (!Number.isFinite(valorNumerico)) {
            throw new Error("Los valores numéricos deben ser válidos.");
        }

        if (valorNumerico < 0) {
            throw new Error("Los valores numéricos no pueden ser negativos.");
        }

        datos.push([valor, clase]);
    });

    return datos;
}

function crearCalculadoraUmbralManual() {
    const bloque = document.createElement("div");
    bloque.classList.add("border", "rounded", "p-3");

    const titulo = document.createElement("p");
    titulo.classList.add("fw-semibold", "mb-2");
    titulo.textContent = "Probar la ecuación del umbral";

    const formula = document.createElement("p");
    formula.classList.add("mb-3");
    formula.textContent = "\\(Umbral = \\frac{n_1 + n_2}{2}\\)";

    const fila = document.createElement("div");
    fila.classList.add("d-flex", "flex-wrap", "align-items-center", "gap-2");

    const valor1 = crearInput("number");
    valor1.id = "manual-threshold-value-1";
    valor1.placeholder = "n1";
    valor1.step = "any";

    const valor2 = crearInput("number");
    valor2.id = "manual-threshold-value-2";
    valor2.placeholder = "n2";
    valor2.step = "any";

    const boton = crearBoton("Calcular", ["btn", "btn-outline-secondary"]);
    boton.id = "manual-threshold-calculate";
    const resultado = document.createElement("div");
    resultado.id = "manual-threshold-result";
    resultado.classList.add("fw-semibold");

    boton.addEventListener("click", () => {
        const n1 = Number(valor1.value);
        const n2 = Number(valor2.value);

        if (valor1.value === "" || valor2.value === "" || Number.isNaN(n1) || Number.isNaN(n2)) {
            mostrarResultadoCalculadora(resultado, "Introduce dos números.", true);
            return;
        }

        mostrarResultadoCalculadora(resultado, `Umbral: ${calcularUmbral(n1, n2).toFixed(2)}`);
    });

    fila.appendChild(valor1);
    fila.appendChild(valor2);
    fila.appendChild(boton);
    fila.appendChild(resultado);

    bloque.appendChild(titulo);
    bloque.appendChild(formula);
    bloque.appendChild(fila);

    return bloque;
}

function crearCalculadoraGananciaInformacionManual() {
    const bloque = document.createElement("div");
    bloque.classList.add("border", "rounded", "p-3");

    const titulo = document.createElement("p");
    titulo.classList.add("fw-semibold", "mb-2");
    titulo.textContent = "Probar la ecuación de ganancia de información";

    const formula = document.createElement("p");
    formula.classList.add("mb-3");
    formula.textContent = "\\(Gain = H(S) - H(S \\mid A)\\)";

    const fila = document.createElement("div");
    fila.classList.add("d-flex", "flex-wrap", "align-items-center", "gap-2");

    const entropiaOriginal = crearInput("number");
    entropiaOriginal.id = "manual-gain-original";
    entropiaOriginal.placeholder = "H(S)";
    entropiaOriginal.step = "any";
    entropiaOriginal.min = "0";

    const entropiaDivision = crearInput("number");
    entropiaDivision.id = "manual-gain-division";
    entropiaDivision.placeholder = "H(S|A)";
    entropiaDivision.step = "any";
    entropiaDivision.min = "0";

    const boton = crearBoton("Calcular", ["btn", "btn-outline-secondary"]);
    boton.id = "manual-gain-calculate";
    const resultado = document.createElement("div");
    resultado.id = "manual-gain-result";
    resultado.classList.add("fw-semibold");

    boton.addEventListener("click", () => {
        const original = Number(entropiaOriginal.value);
        const division = Number(entropiaDivision.value);

        if (
            entropiaOriginal.value === "" ||
            entropiaDivision.value === "" ||
            Number.isNaN(original) ||
            Number.isNaN(division)
        ) {
            mostrarResultadoCalculadora(resultado, "Introduce dos números.", true);
            return;
        }

        mostrarResultadoCalculadora(resultado, `Ganancia: ${(original - division).toFixed(2)}`);
    });

    fila.appendChild(entropiaOriginal);
    fila.appendChild(entropiaDivision);
    fila.appendChild(boton);
    fila.appendChild(resultado);

    bloque.appendChild(titulo);
    bloque.appendChild(formula);
    bloque.appendChild(fila);

    return bloque;
}

function crearCalculadoraSplitInfoManual() {
    const bloque = document.createElement("div");
    bloque.classList.add("border", "rounded", "p-3");

    const titulo = document.createElement("p");
    titulo.classList.add("fw-semibold", "mb-2");
    titulo.textContent = "Probar la ecuación de Split Info";

    const formula = document.createElement("p");
    formula.classList.add("mb-2");
    formula.textContent = "\\(SplitInfo = - \\sum p_i \\log_2(p_i)\\)";

    const ayuda = document.createElement("p");
    ayuda.classList.add("small", "text-body-secondary", "mb-3");
    ayuda.textContent = "Cada grupo es el número de filas que caen en una rama de la división. Por ejemplo: filas con valor <= umbral y filas con valor > umbral.";

    const grupos = document.createElement("div");
    grupos.id = "manual-split-groups";
    grupos.classList.add("d-grid", "gap-2", "mb-3");
    grupos.appendChild(crearCampoGrupoSplitInfo(1, "Filas <= umbral"));
    grupos.appendChild(crearCampoGrupoSplitInfo(2, "Filas > umbral"));

    const acciones = document.createElement("div");
    acciones.classList.add("d-flex", "flex-wrap", "align-items-center", "gap-2");

    const botonAgregar = crearBoton("Añadir grupo", ["btn", "btn-outline-secondary"]);
    const boton = crearBoton("Calcular", ["btn", "btn-outline-secondary"]);
    boton.id = "manual-split-calculate";
    const resultado = document.createElement("div");
    resultado.id = "manual-split-result";
    resultado.classList.add("fw-semibold");

    botonAgregar.addEventListener("click", () => {
        grupos.appendChild(crearCampoGrupoSplitInfo(grupos.children.length + 1, "Filas del grupo"));
    });

    boton.addEventListener("click", () => {
        const valores = Array.from(grupos.querySelectorAll("input")).map(input => ({
            texto: input.value,
            valor: Number(input.value)
        }));

        if (
            valores.some(item => item.texto === "" || Number.isNaN(item.valor) || item.valor < 0) ||
            valores.reduce((total, item) => total + item.valor, 0) === 0
        ) {
            mostrarResultadoCalculadora(resultado, "Introduce tamaños de grupo válidos.", true);
            return;
        }

        mostrarResultadoCalculadora(resultado, `Split Info: ${calcularSplitInfoDeTamanos(...valores.map(item => item.valor)).toFixed(2)}`);
    });

    acciones.appendChild(botonAgregar);
    acciones.appendChild(boton);
    acciones.appendChild(resultado);

    bloque.appendChild(titulo);
    bloque.appendChild(formula);
    bloque.appendChild(ayuda);
    bloque.appendChild(grupos);
    bloque.appendChild(acciones);

    return bloque;
}

function crearCampoGrupoSplitInfo(indice, placeholder) {
    const etiqueta = document.createElement("label");
    etiqueta.classList.add("d-grid", "gap-1", "small", "fw-semibold");

    const texto = document.createElement("span");
    texto.textContent = `Grupo ${indice}`;

    const input = crearInput("number");
    input.placeholder = placeholder;
    input.step = "1";
    input.min = "0";

    etiqueta.appendChild(texto);
    etiqueta.appendChild(input);

    return etiqueta;
}

function crearCalculadoraGainRatioManual() {
    const bloque = document.createElement("div");
    bloque.classList.add("border", "rounded", "p-3");

    const titulo = document.createElement("p");
    titulo.classList.add("fw-semibold", "mb-2");
    titulo.textContent = "Probar la ecuación de Gain Ratio";

    const formula = document.createElement("p");
    formula.classList.add("mb-3");
    formula.textContent = "\\(GainRatio = \\frac{Gain}{SplitInfo}\\)";

    const fila = document.createElement("div");
    fila.classList.add("d-flex", "flex-wrap", "align-items-center", "gap-2");

    const ganancia = crearInput("number");
    ganancia.id = "manual-ratio-gain";
    ganancia.placeholder = "Gain";
    ganancia.step = "any";
    ganancia.min = "0";

    const splitInfo = crearInput("number");
    splitInfo.id = "manual-ratio-split";
    splitInfo.placeholder = "Split Info";
    splitInfo.step = "any";
    splitInfo.min = "0";

    const boton = crearBoton("Calcular", ["btn", "btn-outline-secondary"]);
    boton.id = "manual-ratio-calculate";
    const resultado = document.createElement("div");
    resultado.id = "manual-ratio-result";
    resultado.classList.add("fw-semibold");

    boton.addEventListener("click", () => {
        const valorGanancia = Number(ganancia.value);
        const valorSplitInfo = Number(splitInfo.value);

        if (
            ganancia.value === "" ||
            splitInfo.value === "" ||
            Number.isNaN(valorGanancia) ||
            Number.isNaN(valorSplitInfo) ||
            valorSplitInfo <= 0
        ) {
            mostrarResultadoCalculadora(resultado, "Introduce valores válidos.", true);
            return;
        }

        mostrarResultadoCalculadora(resultado, `Gain Ratio: ${(valorGanancia / valorSplitInfo).toFixed(2)}`);
    });

    fila.appendChild(ganancia);
    fila.appendChild(splitInfo);
    fila.appendChild(boton);
    fila.appendChild(resultado);

    bloque.appendChild(titulo);
    bloque.appendChild(formula);
    bloque.appendChild(fila);

    return bloque;
}

function crearVisualizadorNodoElegido() {
    const bloque = document.createElement("div");
    bloque.classList.add("border", "rounded", "p-3");

    const titulo = document.createElement("p");
    titulo.classList.add("fw-semibold", "mb-2");
    titulo.textContent = "Generar nodo elegido";

    const ayuda = document.createElement("p");
    ayuda.classList.add("small", "text-body-secondary", "mb-3");
    ayuda.textContent = "El nodo se construye con el umbral que tenga mayor Gain Ratio. La rama No contiene los valores menores o iguales al umbral; la rama Sí contiene los valores mayores.";

    const preview = document.createElement("div");
    preview.id = "selectedNodePreview";
    preview.classList.add("chosen-node-preview");

    bloque.appendChild(titulo);
    bloque.appendChild(ayuda);
    bloque.appendChild(preview);

    limpiarNodoElegido(preview);

    return bloque;
}

function limpiarNodoElegido(contenedor = document.getElementById("selectedNodePreview")) {
    if (!contenedor) return;

    limpiarElemento(contenedor);
    const mensaje = document.createElement("p");
    mensaje.classList.add("text-body-secondary", "mb-0");
    mensaje.textContent = "Genera datos y pulsa Elegir nodo para ver el resultado.";
    contenedor.appendChild(mensaje);
}

function renderizarNodoElegido(nombreAtributo, filasOrdenadas, cambios) {
    const contenedor = document.getElementById("selectedNodePreview");
    if (!contenedor) return;

    limpiarElemento(contenedor);

    if (cambios.length === 0) {
        const mensaje = document.createElement("p");
        mensaje.classList.add("text-body-secondary", "mb-0");
        mensaje.textContent = "No hay cambios de clase suficientes para elegir un nodo.";
        contenedor.appendChild(mensaje);
        return;
    }

    const mejorCambio = cambios.reduce((mejor, cambio) => {
        const gainRatioActual = calcularGainRatioParaUmbral(filasOrdenadas, cambio.umbral);
        const gainRatioMejor = calcularGainRatioParaUmbral(filasOrdenadas, mejor.umbral);
        return gainRatioActual > gainRatioMejor ? cambio : mejor;
    }, cambios[0]);

    const umbral = mejorCambio.umbral;
    const filasNo = filasOrdenadas.filter(fila => Number(fila[0]) <= umbral);
    const filasSi = filasOrdenadas.filter(fila => Number(fila[0]) > umbral);
    const datosNodo = {
        atributo: nombreAtributo,
        umbral,
        gananciaInformacion: calcularGananciaInformacionParaUmbral(filasOrdenadas, umbral),
        splitInfo: calcularSplitInfoParaUmbral(filasOrdenadas, umbral),
        gainRatio: calcularGainRatioParaUmbral(filasOrdenadas, umbral),
        ramaNo: obtenerEstadoRamaNodo(filasNo),
        ramaSi: obtenerEstadoRamaNodo(filasSi)
    };

    contenedor.appendChild(crearSvgNodoElegido(datosNodo));
}

function obtenerEstadoRamaNodo(filas) {
    const clases = [...new Set(filas.map(fila => fila[1]))];
    return clases.length === 1 ? clases[0] : "Pendiente";
}

function crearSvgNodoElegido(datosNodo) {
    const svg = crearElementoSvg("svg", {
        class: "chosen-node-svg",
        viewBox: "0 0 720 370",
        role: "img",
        "aria-label": "Vista previa del nodo elegido"
    });

    const defs = crearElementoSvg("defs");
    const marker = crearElementoSvg("marker", {
        id: "chosenNodeArrow",
        markerWidth: "10",
        markerHeight: "10",
        refX: "8",
        refY: "5",
        orient: "auto",
        markerUnits: "strokeWidth"
    });
    marker.appendChild(crearElementoSvg("path", {
        d: "M 0 0 L 10 5 L 0 10 z",
        fill: "#1f2933"
    }));
    defs.appendChild(marker);
    svg.appendChild(defs);

    svg.appendChild(crearTarjetaNodoElegido(datosNodo));
    svg.appendChild(crearLineaRamaNodo(360, 150, 165, 270));
    svg.appendChild(crearLineaRamaNodo(360, 150, 555, 270));
    svg.appendChild(crearEtiquetaRamaNodo("<= umbral", 245, 225));
    svg.appendChild(crearEtiquetaRamaNodo("> umbral", 475, 225));
    svg.appendChild(crearHojaNodoElegido(110, 270, datosNodo.ramaNo));
    svg.appendChild(crearHojaNodoElegido(500, 270, datosNodo.ramaSi));

    return svg;
}

function crearTarjetaNodoElegido(datosNodo) {
    const grupo = crearElementoSvg("g", { class: "chosen-node-svg-card" });
    const x = 220;
    const y = 20;
    const ancho = 280;

    grupo.appendChild(crearElementoSvg("rect", {
        x,
        y,
        width: ancho,
        height: 130,
        rx: "8",
        class: "chosen-node-svg-shell"
    }));
    grupo.appendChild(crearElementoSvg("rect", {
        x,
        y,
        width: ancho,
        height: 32,
        rx: "8",
        class: "chosen-node-svg-header"
    }));
    grupo.appendChild(crearTextoSvg(`${datosNodo.atributo} <= ${formatearNumeroNodo(datosNodo.umbral)}`, x + ancho / 2, y + 22, ["chosen-node-svg-title"], "middle"));
    grupo.appendChild(crearTextoSvg(`Ganancia de información = ${formatearNumeroNodo(datosNodo.gananciaInformacion)}`, x + 18, y + 62));
    grupo.appendChild(crearTextoSvg(`Split info = ${formatearNumeroNodo(datosNodo.splitInfo)}`, x + 18, y + 90));
    grupo.appendChild(crearTextoSvg(`Gain ratio = ${formatearNumeroNodo(datosNodo.gainRatio)}`, x + 18, y + 118));

    return grupo;
}

function crearLineaRamaNodo(x1, y1, x2, y2) {
    return crearElementoSvg("line", {
        x1,
        y1,
        x2,
        y2,
        class: "chosen-node-svg-branch-line",
        "marker-end": "url(#chosenNodeArrow)"
    });
}

function crearEtiquetaRamaNodo(condicion, x, y) {
    const grupo = crearElementoSvg("g", { class: "chosen-node-svg-branch-label" });
    grupo.appendChild(crearElementoSvg("rect", {
        x: x - 42,
        y: y - 19,
        width: 84,
        height: 28,
        rx: "6",
        class: "chosen-node-svg-label-bg"
    }));
    grupo.appendChild(crearTextoSvg(condicion, x, y, ["chosen-node-svg-branch-condition"], "middle"));
    return grupo;
}

function crearHojaNodoElegido(x, y, estado) {
    const grupo = crearElementoSvg("g", { class: "chosen-node-svg-leaf" });
    const claseEstado = estado === "Pendiente" ? "chosen-node-svg-leaf-pending" : "chosen-node-svg-leaf-defined";
    grupo.appendChild(crearElementoSvg("rect", {
        x,
        y,
        width: 110,
        height: 58,
        rx: "8",
        class: `chosen-node-svg-leaf-box ${claseEstado}`
    }));
    grupo.appendChild(crearTextoSvg(estado, x + 55, y + 36, ["chosen-node-svg-leaf-text"], "middle"));
    return grupo;
}

function crearTextoSvg(texto, x, y, clases = ["chosen-node-svg-text"], anchor = "start") {
    const elemento = crearElementoSvg("text", {
        x,
        y,
        class: clases.join(" "),
        "text-anchor": anchor
    });
    elemento.textContent = texto;
    return elemento;
}

function crearElementoSvg(nombre, atributos = {}) {
    const elemento = document.createElementNS("http://www.w3.org/2000/svg", nombre);
    Object.entries(atributos).forEach(([atributo, valor]) => {
        elemento.setAttribute(atributo, valor);
    });
    return elemento;
}

function formatearNumeroNodo(valor) {
    return Number.isFinite(valor) ? valor.toFixed(2) : "0.00";
}

function renderPasoPendiente(container, paso) {
    container.appendChild(crearMensaje(paso.texto));
}

function crearMensaje(texto) {
    const mensaje = document.createElement("div");
    mensaje.classList.add("alert", "alert-light", "border", "mb-0");
    mensaje.textContent = texto;
    return mensaje;
}

function crearAlertaError(texto) {
    const alerta = document.createElement("div");
    alerta.classList.add("alert", "alert-danger", "alert-dismissible", "mb-0");
    alerta.textContent = texto;

    const botonCerrar = document.createElement("button");
    botonCerrar.type = "button";
    botonCerrar.classList.add("btn-close");
    botonCerrar.addEventListener("click", () => alerta.remove());
    alerta.prepend(botonCerrar);

    return alerta;
}

function mostrarResultadoCalculadora(resultado, texto, esError = false) {
    limpiarElemento(resultado);
    resultado.className = esError ? "" : "fw-semibold";

    if (esError) {
        resultado.appendChild(crearAlertaError(texto));
        return;
    }

    resultado.textContent = texto;
}

function crearTablaOrdenada(cabecera, filas, cambios, mostrarVacia = false) {
    const wrapper = document.createElement("div");
    wrapper.classList.add("table-responsive", "mb-3");

    const table = document.createElement("table");
    table.classList.add("table", "caption-top", "table-bordered", "align-middle", "text-center");

    const caption = document.createElement("caption");
    caption.classList.add("threshold-results-caption");
    caption.textContent = "Tabla ordenada: paso 1";
    table.appendChild(caption);

    table.appendChild(crearCabeceraTabla(cabecera));

    const tbody = document.createElement("tbody");
    if (mostrarVacia && filas.length === 0) {
        const tr = document.createElement("tr");
        const td = crearCelda("Sin datos calculados.");
        td.colSpan = cabecera.length;
        tr.appendChild(td);
        tbody.appendChild(tr);
    } else {
        filas.forEach((fila, indice) => {
            const tr = document.createElement("tr");
            const cambioActual = cambios.find(cambio =>
                cambio.indiceAnterior === indice ||
                cambio.indiceSiguiente === indice
            );

            const tdValor = crearCelda(fila[0]);
            const tdClase = crearCelda(fila[1]);
            if (cambioActual) {
                tdClase.classList.add("umbral-highlight", "fw-semibold");
            }

            tr.appendChild(tdValor);
            tr.appendChild(tdClase);
            tbody.appendChild(tr);
        });
    }

    table.appendChild(tbody);
    wrapper.appendChild(table);
    return wrapper;
}

function crearCabeceraTabla(cabecera) {
    const thead = document.createElement("thead");
    const tr = document.createElement("tr");

    cabecera.forEach(nombreColumna => {
        tr.appendChild(crearCeldaCabecera(nombreColumna));
    });

    thead.appendChild(tr);
    return thead;
}

function crearCabeceraTablaInteractiva(cabecera) {
    const thead = document.createElement("thead");
    const tr = document.createElement("tr");

    cabecera.forEach(nombreColumna => {
        tr.appendChild(crearCabeceraInteractiva(nombreColumna));
    });

    thead.appendChild(tr);
    return thead;
}

function crearTablaUmbrales(cambios, filasOrdenadas, nombresColumnas, mostrarVacia = false) {
    const wrapper = document.createElement("div");
    wrapper.classList.add("table-responsive", "threshold-values-wrapper");

    const table = document.createElement("table");
    table.classList.add("table", "caption-top", "table-bordered", "align-middle", "text-center");

    const caption = document.createElement("caption");
    caption.classList.add("threshold-results-caption");
    caption.textContent = "Valores calculados: paso 2";
    table.appendChild(caption);

    table.appendChild(crearCabeceraTablaInteractiva(nombresColumnas));

    const tbody = document.createElement("tbody");

    if (cambios.length === 0) {
        const tr = document.createElement("tr");
        const td = crearCelda(mostrarVacia ? "Sin datos calculados." : "No se han encontrado cambios de clase.");
        td.colSpan = nombresColumnas.length;
        tr.appendChild(td);
        tbody.appendChild(tr);
    } else {
        cambios.forEach(cambio => {
            const tr = document.createElement("tr");
            const entropiaOriginal = calcularEntropiaDeGrupo(filasOrdenadas);
            const entropiaUmbral = calcularEntropiaParaUmbral(filasOrdenadas, cambio.umbral);
            const gananciaInformacion = calcularGananciaInformacionParaUmbral(filasOrdenadas, cambio.umbral);
            const splitInfo = calcularSplitInfoParaUmbral(filasOrdenadas, cambio.umbral);
            const gainRatio = calcularGainRatioParaUmbral(filasOrdenadas, cambio.umbral);
            const totalIzquierda = filasOrdenadas.filter(fila => Number(fila[0]) <= cambio.umbral).length;
            const totalDerecha = filasOrdenadas.length - totalIzquierda;

            const tdUmbral = crearCelda(`${cambio.valorAnterior} - ${cambio.valorSiguiente}`, ["fw-semibold", "umbral-highlight"]);
            const tdUmbralCalculado = crearCelda(cambio.umbral.toFixed(2), ["fw-semibold"]);
            const tdEntropia = crearCelda(entropiaUmbral.toFixed(2), ["fw-semibold"]);

            hacerCeldaInteractiva(
                tdUmbral,
                `Probar umbral con ${cambio.valorAnterior} y ${cambio.valorSiguiente}.`,
                () => rellenarCalculadoraUmbralDesdeCelda(cambio.valorAnterior, cambio.valorSiguiente)
            );
            hacerCeldaInteractiva(
                tdUmbralCalculado,
                `Umbral = (${cambio.valorAnterior} + ${cambio.valorSiguiente}) / 2 = ${cambio.umbral.toFixed(2)}.`,
                () => rellenarCalculadoraUmbralDesdeCelda(cambio.valorAnterior, cambio.valorSiguiente)
            );
            hacerCeldaInteractiva(
                tdEntropia,
                `Abrir Entropía. En esta fila H(S|A) = ${entropiaUmbral.toFixed(2)} para el umbral ${cambio.umbral.toFixed(2)}.`,
                () => {
                    window.location.href = "../entropia/index.html";
                }
            );

            tr.appendChild(tdUmbral);
            tr.appendChild(tdUmbralCalculado);
            tr.appendChild(tdEntropia);

            if (nombresColumnas.includes("Ganancia de información")) {
                const tdGanancia = crearCelda(gananciaInformacion.toFixed(2), ["fw-semibold"]);
                hacerCeldaInteractiva(
                    tdGanancia,
                    `Gain = H(S) - H(S|A) = ${entropiaOriginal.toFixed(2)} - ${entropiaUmbral.toFixed(2)} = ${gananciaInformacion.toFixed(2)}.`,
                    () => rellenarCalculadoraGananciaDesdeCelda(entropiaOriginal, entropiaUmbral)
                );
                tr.appendChild(tdGanancia);
            }

            if (nombresColumnas.includes("Split Info")) {
                const tdSplitInfo = crearCelda(splitInfo.toFixed(2), ["fw-semibold"]);
                hacerCeldaInteractiva(
                    tdSplitInfo,
                    `Split Info calculado con ${totalIzquierda} filas <= umbral y ${totalDerecha} filas > umbral.`,
                    () => rellenarCalculadoraSplitDesdeCelda(totalIzquierda, totalDerecha)
                );
                tr.appendChild(tdSplitInfo);
            }

            if (nombresColumnas.includes("Gain Ratio")) {
                const tdGainRatio = crearCelda(gainRatio.toFixed(2), ["fw-semibold"]);
                hacerCeldaInteractiva(
                    tdGainRatio,
                    `Gain Ratio = Gain / Split Info = ${gananciaInformacion.toFixed(2)} / ${splitInfo.toFixed(2)} = ${gainRatio.toFixed(2)}.`,
                    () => rellenarCalculadoraGainRatioDesdeCelda(gananciaInformacion, splitInfo)
                );
                tr.appendChild(tdGainRatio);
            }

            tbody.appendChild(tr);
        });
    }

    table.appendChild(tbody);
    wrapper.appendChild(table);
    return wrapper;
}

function navegarAPasoConResultados(stepIndex) {
    goToSpecificStep(stepIndex);
    renderizarResultadosDesdeDatosGuardados();
}

function renderizarResultadosDesdeDatosGuardados() {
    if (!datosTablaOriginal) return;

    try {
        const resultado = obtenerDatosOrdenadosPorAtributo(datosTablaOriginal, datosTablaOriginal[0][0], datosTablaOriginal[0][1]);
        const cambios = obtenerCambiosDeClase(resultado.filas);
        renderizarTablasResultadoUmbral(resultado.cabecera, resultado.filas, cambios, pasos[currentStep].columnasResultado);

        if (currentStep === 4) {
            renderizarNodoElegido(resultado.cabecera[0], resultado.filas, cambios);
        }

        actualizarLayoutResultados(true);
    } catch (error) {
        const contenedorResultados = document.getElementById("stepExtraContainer");
        if (contenedorResultados) {
            contenedorResultados.appendChild(crearAlertaError(error.message));
        }
    }
}

function rellenarCalculadoraUmbralDesdeCelda(valorAnterior, valorSiguiente) {
    navegarAPasoConResultados(0);
    asignarValorInput("manual-threshold-value-1", valorAnterior);
    asignarValorInput("manual-threshold-value-2", valorSiguiente);
    calcularPanelManual("manual-threshold-calculate");
}

function rellenarCalculadoraGananciaDesdeCelda(entropiaOriginal, entropiaUmbral) {
    navegarAPasoConResultados(1);
    asignarValorInput("manual-gain-original", entropiaOriginal);
    asignarValorInput("manual-gain-division", entropiaUmbral);
    calcularPanelManual("manual-gain-calculate");
}

function rellenarCalculadoraSplitDesdeCelda(totalIzquierda, totalDerecha) {
    navegarAPasoConResultados(2);

    const grupos = document.getElementById("manual-split-groups");
    const inputs = grupos ? Array.from(grupos.querySelectorAll("input")) : [];
    if (inputs[0]) inputs[0].value = totalIzquierda;
    if (inputs[1]) inputs[1].value = totalDerecha;
    inputs.slice(2).forEach(input => {
        input.value = "";
    });

    calcularPanelManual("manual-split-calculate");
}

function rellenarCalculadoraGainRatioDesdeCelda(gananciaInformacion, splitInfo) {
    navegarAPasoConResultados(3);
    asignarValorInput("manual-ratio-gain", gananciaInformacion);
    asignarValorInput("manual-ratio-split", splitInfo);
    calcularPanelManual("manual-ratio-calculate");
}

function asignarValorInput(id, valor) {
    const input = document.getElementById(id);
    if (input) {
        input.value = Number.isFinite(Number(valor)) ? Number(valor).toFixed(2) : valor;
    }
}

function calcularPanelManual(idBoton) {
    const boton = document.getElementById(idBoton);
    if (boton) {
        boton.click();
        boton.closest(".border")?.scrollIntoView({ behavior: "smooth", block: "center" });
    }
}

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

    const filasOrdenadas = [...datos.slice(1)].sort((a, b) => Number(a[indiceAtributo]) - Number(b[indiceAtributo]));

    return {
        cabecera: [atributo, claseObjetivo],
        filas: filasOrdenadas.map(fila => [
            fila[indiceAtributo],
            fila[indiceClase]
        ])
    };
}

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
                umbral: calcularUmbral(valorAnterior, valorSiguiente)
            });
        }
    }

    return cambios;
}

function calcularSplitInfoParaUmbral(filasOrdenadas, umbral) {
    const totalIzquierda = filasOrdenadas.filter(fila => Number(fila[0]) <= umbral).length;
    const totalDerecha = filasOrdenadas.length - totalIzquierda;
    return calcularSplitInfoDeTamanos(totalIzquierda, totalDerecha);
}

function calcularSplitInfoDeTamanos(...tamanosGrupo) {
    const total = tamanosGrupo.reduce((acumulado, tamanoGrupo) => acumulado + tamanoGrupo, 0);
    if (total === 0) return 0;

    return tamanosGrupo.reduce((acumulado, tamanoGrupo) => {
        if (tamanoGrupo === 0) return acumulado;

        const proporcion = tamanoGrupo / total;
        return acumulado - proporcion * Math.log2(proporcion);
    }, 0);
}

function calcularGainRatioParaUmbral(filasOrdenadas, umbral) {
    const splitInfo = calcularSplitInfoParaUmbral(filasOrdenadas, umbral);
    if (splitInfo === 0) return 0;

    return calcularGananciaInformacionParaUmbral(filasOrdenadas, umbral) / splitInfo;
}

function crearInfoCardUmbral() {
    const card = crearCardDesplegable();

    card.appendChild(crearSeccionCard(
        "generalInfoUmbral",
        "generalInfoUmbralBody",
        "Información general",
        [
            "El umbral permite dividir un atributo numérico en dos grupos. En C4.5 se buscan puntos donde cambia la clase, porque esos puntos pueden separar mejor los datos.",
            "Primero se ordenan los valores numéricos. Después se comparan las clases de filas consecutivas. Cuando la clase cambia, se calcula un candidato a umbral entre esos dos valores."
        ]
    ));

    card.appendChild(crearSeccionCard(
        "calculationUmbral",
        "calculationUmbralBody",
        "Cálculo",
        [
            "El umbral entre dos valores consecutivos se calcula con la media de ambos:",
            "\\(Umbral = \\frac{n_1 + n_2}{2}\\)",
            "Donde \\(n_1\\) es el último valor antes del cambio de clase y \\(n_2\\) es el primer valor donde aparece la clase nueva."
        ]
    ));

    return card;
}

function crearInfoCardGananciaInformacion() {
    const card = crearCardDesplegable();

    card.appendChild(crearSeccionCard(
        "generalInfoGain",
        "generalInfoGainBody",
        "Información general",
        [
            "La ganancia de información mide la reducción de la entropía después de dividir el conjunto de datos.",
            "C4.5 evalúa divisiones candidatas y favorece las que reducen más la incertidumbre."
        ]
    ));

    card.appendChild(crearSeccionCard(
        "calculationGain",
        "calcInfoGainBody",
        "Cálculo",
        [
            "La ganancia de información mide cuánto disminuye la incertidumbre del conjunto \\(S\\) al dividirlo con un atributo \\(A\\).",
            "\\(Gain(S, A) = H(S) - \\sum_{v \\in Valores(A)} \\frac{\\vert{}S_v\\vert{}}{\\vert{}S\\vert{}} H(S_v)\\)",
            "Donde \\(H(S)\\) es la entropía del conjunto original y \\(H(S_v)\\) es la entropía de cada subconjunto generado."
        ]
    ));

    return card;
}

function crearInfoCardSplitInfo() {
    const card = crearCardDesplegable();

    card.appendChild(crearSeccionCard(
        "generalInfoSplit",
        "generalInfoSplitBody",
        "Información general",
        [
            "Split Info mide cómo de repartida queda la división generada por un umbral.",
            "Una división muy desequilibrada tiene un Split Info bajo; una división más repartida tiene un valor mayor."
        ]
    ));

    card.appendChild(crearSeccionCard(
        "calculationSplit",
        "calcInfoSplitBody",
        "Cálculo",
        [
            "Para cada grupo generado por el umbral se calcula su proporción respecto al total:",
            "\\(SplitInfo = - \\sum p_i \\log_2(p_i)\\)",
            "Donde \\(p_i\\) es la proporción de ejemplos que caen en cada lado del umbral."
        ]
    ));

    return card;
}

function crearInfoCardGainRatio() {
    const card = crearCardDesplegable();

    card.appendChild(crearSeccionCard(
        "generalInfoGainRatio",
        "generalInfoGainRatioBody",
        "Información general",
        [
            "Gain Ratio ajusta la ganancia de información usando Split Info.",
            "C4.5 lo utiliza para comparar divisiones evitando favorecer atributos que separan demasiado los datos."
        ]
    ));

    card.appendChild(crearSeccionCard(
        "calculationGainRatio",
        "calcInfoGainRatioBody",
        "Cálculo",
        [
            "Gain Ratio se obtiene dividiendo la ganancia de información entre el Split Info:",
            "\\(GainRatio = \\frac{Gain}{SplitInfo}\\)",
            "Si el Split Info es cero, el resultado se toma como cero para evitar una división no válida."
        ]
    ));

    return card;
}

function crearInfoCardNodoElegido() {
    const card = crearCardDesplegable();

    card.appendChild(crearSeccionCard(
        "generalInfoNode",
        "generalInfoNodeBody",
        "Información general",
        [
            "El nodo elegido es el umbral con mejor Gain Ratio entre los candidatos calculados.",
            "La condición del nodo separa los datos en dos ramas: una para los valores menores o iguales al umbral y otra para los valores mayores."
        ]
    ));

    card.appendChild(crearSeccionCard(
        "calculationNode",
        "calcInfoNodeBody",
        "Resultado de las ramas",
        [
            "Si todos los datos de una rama tienen la misma clase, esa clase aparece como resultado final.",
            "Si en una rama hay mezcla de clases, se indica que hay que calcular el siguiente nodo."
        ]
    ));

    return card;
}

function crearLeyenda(datosLeyenda) {
    const card = crearCardDesplegable();
    card.classList.add("threshold-legend-card");

    const header = document.createElement("div");
    header.classList.add("card-header", "fs-6");

    const link = document.createElement("a");
    link.classList.add(
        "collapsed",
        "d-block",
        "link-body-emphasis",
        "link-offset-2",
        "link-offset-2-hover",
        "link-underline",
        "link-underline-opacity-0",
        "link-underline-opacity-50-hover"
    );
    link.setAttribute("data-bs-toggle", "collapse");
    link.setAttribute("href", `#${datosLeyenda.id}`);
    link.setAttribute("aria-expanded", "false");
    link.setAttribute("aria-controls", datosLeyenda.id);
    link.textContent = "Leyenda";
    header.appendChild(link);

    const collapse = document.createElement("div");
    collapse.classList.add("collapse");
    collapse.id = datosLeyenda.id;

    const body = document.createElement("div");
    body.classList.add("card-body", "threshold-legend-body");

    datosLeyenda.items.forEach(item => {
        body.appendChild(crearItemLeyenda(item));
    });
    collapse.appendChild(body);
    card.appendChild(header);
    card.appendChild(collapse);

    return card;
}

function crearItemLeyenda(item) {
    const contenedor = document.createElement("div");
    contenedor.classList.add("threshold-legend-item");

    const marcador = document.createElement("span");
    if (item.tipo === "swatch") {
        marcador.classList.add("threshold-legend-swatch", "umbral-highlight");
    } else {
        marcador.classList.add("threshold-legend-icon", "bi", item.icono);
    }
    marcador.setAttribute("aria-hidden", "true");

    const texto = document.createElement("p");
    texto.classList.add("card-text", "fw-light", "mb-0");
    texto.innerHTML = `<strong>${item.titulo}:</strong> ${item.texto}`;

    contenedor.appendChild(marcador);
    contenedor.appendChild(texto);

    return contenedor;
}

function crearCardDesplegable() {
    const card = document.createElement("div");
    card.classList.add("card", "bg-light", "mx-auto");
    return card;
}

function crearSeccionCard(idCabecera, idCuerpo, titulo, parrafos) {
    const fragmento = document.createDocumentFragment();

    const header = document.createElement("div");
    header.classList.add("card-header", "fs-6");
    header.id = idCabecera;

    const link = document.createElement("a");
    link.classList.add(
        "collapsed",
        "d-block",
        "link-body-emphasis",
        "link-offset-2",
        "link-offset-2-hover",
        "link-underline",
        "link-underline-opacity-0",
        "link-underline-opacity-50-hover"
    );
    link.setAttribute("data-bs-toggle", "collapse");
    link.setAttribute("href", `#${idCuerpo}`);
    link.setAttribute("aria-expanded", "false");
    link.setAttribute("aria-controls", idCuerpo);
    link.textContent = titulo;
    header.appendChild(link);

    const collapse = document.createElement("div");
    collapse.classList.add("collapse");
    collapse.id = idCuerpo;
    collapse.setAttribute("aria-labelledby", idCabecera);

    const body = document.createElement("div");
    body.classList.add("card-body");

    parrafos.forEach(texto => {
        const p = document.createElement("p");
        p.classList.add("card-text", "fw-light");
        p.textContent = texto;
        body.appendChild(p);
    });

    collapse.appendChild(body);
    fragmento.appendChild(header);
    fragmento.appendChild(collapse);

    return fragmento;
}

function renderizarMathJax() {
    setTimeout(() => {
        if (window.MathJax) {
            MathJax.typesetPromise();
        }
    }, 0);
}

function guardarDatosIniciales() {
    datosTablaOriginal = obtenerDatosTablaUmbral();
}

function initialStep() {
    currentStep = 0;
    mostrarPaso();
}

function stepForward() {
    if (currentStep >= pasos.length - 1) return;

    currentStep++;
    mostrarPaso();
}

function stepBack() {
    if (currentStep <= 0) return;

    currentStep--;
    mostrarPaso();
}

function lastStep() {
    currentStep = pasos.length - 1;
    mostrarPaso();
}

function goToSpecificStep(stepIndex) {
    if (stepIndex < 0 || stepIndex >= pasos.length) return;

    currentStep = stepIndex;
    mostrarPaso();
}

function actualizarBotonActivo(stepIndex) {
    const botones = [
        "btnPasoUmbral",
        "btnPasoGanancia",
        "btnPasoSplitInfo",
        "btnPasoGainRatio",
        "btnPasoNodo"
    ];

    botones.forEach(idBoton => {
        const boton = document.getElementById(idBoton);
        if (boton) {
            boton.classList.remove("active-step");
        }
    });

    const botonActivo = document.getElementById(botones[stepIndex]);
    if (botonActivo) {
        botonActivo.classList.add("active-step");
    }
}

function goToStep() {
    mostrarPaso();
}

export {
    initialStep,
    stepForward,
    stepBack,
    lastStep,
    goToStep,
    goToSpecificStep
};

export default initialStep;
