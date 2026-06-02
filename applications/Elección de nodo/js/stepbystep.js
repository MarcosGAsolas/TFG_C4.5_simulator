import {
    calcularUmbral,
    calcularEntropiaParaUmbral,
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
    valor1.placeholder = "n1";
    valor1.step = "any";

    const valor2 = crearInput("number");
    valor2.placeholder = "n2";
    valor2.step = "any";

    const boton = crearBoton("Calcular", ["btn", "btn-outline-secondary"]);
    const resultado = document.createElement("div");
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
    formula.textContent = "\\(Gain = E(S) - E(S \\mid A)\\)";

    const fila = document.createElement("div");
    fila.classList.add("d-flex", "flex-wrap", "align-items-center", "gap-2");

    const entropiaOriginal = crearInput("number");
    entropiaOriginal.placeholder = "E(S)";
    entropiaOriginal.step = "any";
    entropiaOriginal.min = "0";

    const entropiaDivision = crearInput("number");
    entropiaDivision.placeholder = "E(S|A)";
    entropiaDivision.step = "any";
    entropiaDivision.min = "0";

    const boton = crearBoton("Calcular", ["btn", "btn-outline-secondary"]);
    const resultado = document.createElement("div");
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
    grupos.classList.add("d-grid", "gap-2", "mb-3");
    grupos.appendChild(crearCampoGrupoSplitInfo(1, "Filas <= umbral"));
    grupos.appendChild(crearCampoGrupoSplitInfo(2, "Filas > umbral"));

    const acciones = document.createElement("div");
    acciones.classList.add("d-flex", "flex-wrap", "align-items-center", "gap-2");

    const botonAgregar = crearBoton("Añadir grupo", ["btn", "btn-outline-secondary"]);
    const boton = crearBoton("Calcular", ["btn", "btn-outline-secondary"]);
    const resultado = document.createElement("div");
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
    ganancia.placeholder = "Gain";
    ganancia.step = "any";
    ganancia.min = "0";

    const splitInfo = crearInput("number");
    splitInfo.placeholder = "Split Info";
    splitInfo.step = "any";
    splitInfo.min = "0";

    const boton = crearBoton("Calcular", ["btn", "btn-outline-secondary"]);
    const resultado = document.createElement("div");
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
    ayuda.textContent = "El nodo se construye con el umbral que tenga mayor Gain Ratio. La rama Sí contiene los valores menores o iguales al umbral; la rama No contiene los valores mayores.";

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
    const filasSi = filasOrdenadas.filter(fila => Number(fila[0]) <= umbral);
    const filasNo = filasOrdenadas.filter(fila => Number(fila[0]) > umbral);

    const nodo = document.createElement("div");
    nodo.classList.add("chosen-node-box");
    nodo.textContent = `${nombreAtributo} <= ${umbral.toFixed(1)} ?`;

    const ramas = document.createElement("div");
    ramas.classList.add("chosen-node-branches");

    ramas.appendChild(crearRamaNodoElegido("Sí", "left", obtenerResultadoRamaNodo(filasSi)));
    ramas.appendChild(crearRamaNodoElegido("No", "right", obtenerResultadoRamaNodo(filasNo)));

    contenedor.appendChild(nodo);
    contenedor.appendChild(ramas);
}

function crearRamaNodoElegido(etiqueta, direccion, resultado) {
    const rama = document.createElement("div");
    rama.classList.add("chosen-node-branch", `chosen-node-branch-${direccion}`);

    const flecha = document.createElement("div");
    flecha.classList.add("chosen-node-arrow");

    const textoFlecha = document.createElement("span");
    textoFlecha.textContent = etiqueta;
    flecha.appendChild(textoFlecha);

    const hoja = document.createElement("div");
    hoja.classList.add("chosen-node-leaf");
    hoja.textContent = resultado;

    rama.appendChild(flecha);
    rama.appendChild(hoja);

    return rama;
}

function obtenerResultadoRamaNodo(filas) {
    const clases = [...new Set(filas.map(fila => fila[1]))];
    return clases.length === 1 ? clases[0] : "Calcular siguiente nodo";
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
    table.classList.add("table", "table-bordered", "align-middle", "text-center");

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
            if (cambioActual) {
                tdValor.classList.add("umbral-highlight", "fw-semibold");
            }

            tr.appendChild(tdValor);
            tr.appendChild(crearCelda(fila[1]));
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

function crearTablaUmbrales(cambios, filasOrdenadas, nombresColumnas, mostrarVacia = false) {
    const wrapper = document.createElement("div");
    wrapper.classList.add("table-responsive");

    const table = document.createElement("table");
    table.classList.add("table", "table-bordered", "align-middle", "text-center");

    table.appendChild(crearCabeceraTabla(nombresColumnas));

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

            const tdUmbral = crearCelda(`${cambio.valorAnterior} - ${cambio.valorSiguiente}`, ["fw-semibold", "umbral-highlight"]);
            const tdUmbralCalculado = crearCelda(cambio.umbral.toFixed(2), ["fw-semibold"]);
            const entropiaUmbral = calcularEntropiaParaUmbral(filasOrdenadas, cambio.umbral);
            const tdEntropia = crearCelda(entropiaUmbral.toFixed(2), ["fw-semibold"]);

            tr.appendChild(tdUmbral);
            tr.appendChild(tdUmbralCalculado);
            tr.appendChild(tdEntropia);

            if (nombresColumnas.includes("Ganancia de información")) {
                const gananciaInformacion = calcularGananciaInformacionParaUmbral(filasOrdenadas, cambio.umbral);
                tr.appendChild(crearCelda(gananciaInformacion.toFixed(2), ["fw-semibold"]));
            }

            if (nombresColumnas.includes("Split Info")) {
                const splitInfo = calcularSplitInfoParaUmbral(filasOrdenadas, cambio.umbral);
                tr.appendChild(crearCelda(splitInfo.toFixed(2), ["fw-semibold"]));
            }

            if (nombresColumnas.includes("Gain Ratio")) {
                const gainRatio = calcularGainRatioParaUmbral(filasOrdenadas, cambio.umbral);
                tr.appendChild(crearCelda(gainRatio.toFixed(2), ["fw-semibold"]));
            }

            tbody.appendChild(tr);
        });
    }

    table.appendChild(tbody);
    wrapper.appendChild(table);
    return wrapper;
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
            "\\(Gain(S, A) = E(S) - \\sum_{v \\in Valores(A)} \\frac{\\vert{}S_v\\vert{}}{\\vert{}S\\vert{}} E(S_v)\\)",
            "Donde \\(E(S)\\) es la entropía del conjunto original y \\(E(S_v)\\) es la entropía de cada subconjunto generado."
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
