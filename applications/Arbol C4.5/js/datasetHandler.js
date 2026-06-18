import { getDataInfo, getDataLink } from "../datasets/dataInfo.js";

const selectExampleDataset = document.getElementById("selectExampleDataset");
const csvFileInput = document.getElementById("csvFileInput");
const clearDatasetButton = document.getElementById("clearDatasetButton");
const uploadValidationStatus = document.getElementById("uploadValidationStatus");
const datasetPreview = document.getElementById("datasetPreview");
const dataInfoContainer = document.getElementById("dataInfoContainer");
const currentDatasetSpan = document.getElementById("currentDatasetSpan");
const datasetCardText = document.getElementById("datasetCardText");
const datasetCardLink = document.getElementById("datasetCardLink");

const exampleDatasets = {
    "Leads inmobiliaria": "datasets/leads_inmobiliaria_c45_mixto_booleano_45.csv",
    "Mantenimiento": "datasets/mantenimiento_c45_mixto_booleano_60.csv",
    "Conversion web": "datasets/conversion_web_c45_mixto_booleano_90.csv",
    "Prestamos": "datasets/prestamos_c45_mixto_booleano_150.csv",
    "Estudiantes": "datasets/estudiantes_c45_mixto_booleano_150.csv"
};

let currentDataset = null;

csvFileInput.addEventListener("change", handleCsvUpload);
clearDatasetButton.addEventListener("click", clearDataset);
selectExampleDataset.addEventListener("change", event => {
    loadExampleDataset(event.target.value);
});

async function loadExampleDataset(name) {
    clearUploadValidationStatus();

    const path = exampleDatasets[name];
    if (!path) return;

    try {
        const response = await fetch(path);
        if (!response.ok) {
            throw new Error("No se ha podido cargar el dataset de ejemplo.");
        }

        const rows = parseCsv(await response.text());
        const validation = validateDataset(rows);
        if (!validation.isValid) {
            throw new Error(validation.messages.join("\n"));
        }

        setDataset({
            name,
            rows,
            isExample: true
        });
    } catch (error) {
        showUploadValidationErrors([error.message]);
        setDataset(null);
    }
}

function handleCsvUpload(event) {
    clearUploadValidationStatus();

    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
        const rows = parseCsv(String(reader.result));

        const validation = validateDataset(rows);
        if (!validation.isValid) {
            showUploadValidationErrors(validation.messages);
            setDataset(null);
            return;
        }

        setDataset({
            name: file.name,
            rows,
            isExample: false
        });
        clearUploadValidationStatus();
    };
    reader.onerror = () => {
        showUploadValidationErrors(["No se ha podido leer el archivo CSV."]);
        setDataset(null);
    };
    reader.readAsText(file);
}

function parseCsv(content) {
    return content
        .trim()
        .split(/\r?\n/)
        .map(line => line.split(",").map(value => value.trim()))
        .filter(row => row.some(value => value !== ""));
}

function validateDataset(rows) {
    const messages = [];

    if (rows.length < 2) {
        return {
            isValid: false,
            messages: ["El CSV debe contener una cabecera y al menos una fila de datos."]
        };
    }

    const header = rows[0];
    if (header.length > 10) {
        messages.push("El dataset no puede tener más de 10 columnas.");
    }

    if (header.some(column => column === "")) {
        messages.push("La cabecera no puede contener columnas vacías.");
    }

    const dataRows = rows.slice(1);
    const expectedLength = header.length;
    const invalidRows = dataRows
        .map((row, index) => ({ row, rowNumber: index + 2 }))
        .filter(({ row }) => row.length !== expectedLength || row.some(value => value === ""));
    invalidRows.forEach(({ rowNumber }) => {
        messages.push(`La fila ${rowNumber} no tiene el mismo número de columnas o contiene valores vacíos.`);
    });

    const validShapeRows = dataRows.filter(row => row.length === expectedLength && row.every(value => value !== ""));
    const classValues = new Set(validShapeRows.map(row => normalizeValue(row[expectedLength - 1])));
    if (classValues.size !== 2 || !classValues.has("si") || !classValues.has("no")) {
        messages.push("La última columna debe ser categórica binaria y contener únicamente valores Si y No.");
    }

    for (let columnIndex = 0; columnIndex < expectedLength; columnIndex++) {
        const columnValues = validShapeRows.map(row => row[columnIndex]);
        if (columnValues.length === 0) continue;

        const columnTypes = new Set(columnValues.map(getValueType));
        if (columnTypes.size > 1) {
            messages.push(`La columna "${header[columnIndex]}" contiene datos mezclados. Cada columna debe tener todos los datos del mismo formato.`);
        }
    }

    return {
        isValid: messages.length === 0,
        messages
    };
}

function getValueType(value) {
    const normalizedValue = normalizeValue(value);
    if (normalizedValue === "true" || normalizedValue === "false") {
        return "boolean";
    }

    if (isNumericValue(normalizedValue)) {
        return "numeric";
    }

    return "categorical";
}

function normalizeValue(value) {
    return value.trim().toLowerCase();
}

function isNumericValue(value) {
    return value !== "" && !Number.isNaN(Number(value));
}

function setDataset(dataset) {
    currentDataset = dataset;
    clearDatasetButton.disabled = !dataset;

    if (!dataset) {
        renderEmptyPreview();
        hideDatasetInfo();
        return;
    }

    renderDatasetPreview(dataset.name, dataset.rows);
    renderDatasetInfo(dataset);
}

function clearDataset() {
    currentDataset = null;
    selectExampleDataset.selectedIndex = 0;
    csvFileInput.value = "";
    clearUploadValidationStatus();
    clearDatasetButton.disabled = true;
    renderEmptyPreview();
    hideDatasetInfo();
}

function renderDatasetInfo(dataset) {
    dataInfoContainer.classList.remove("d-none");
    currentDatasetSpan.textContent = dataset.name;

    if (dataset.isExample) {
        datasetCardText.textContent = getDataInfo(dataset.name) || "";
        datasetCardLink.href = getDataLink(dataset.name) || "#";
        datasetCardLink.classList.remove("d-none");
        return;
    }

    datasetCardText.textContent = "Dataset cargado desde un archivo CSV local.";
    datasetCardLink.classList.add("d-none");
}

function hideDatasetInfo() {
    dataInfoContainer.classList.add("d-none");
    currentDatasetSpan.textContent = "";
    datasetCardText.textContent = "";
    datasetCardLink.href = "#";
}

function showUploadValidationErrors(messages) {
    if (!uploadValidationStatus) return;

    clearElement(uploadValidationStatus);
    uploadValidationStatus.className = "alert alert-danger mt-3 mb-0";

    const title = document.createElement("p");
    title.classList.add("fw-semibold", "mb-2");
    title.textContent = "El dataset no cumple las siguientes validaciones:";

    const list = document.createElement("ul");
    list.classList.add("mb-0");
    messages.forEach(message => {
        const item = document.createElement("li");
        item.textContent = message;
        list.appendChild(item);
    });

    uploadValidationStatus.appendChild(title);
    uploadValidationStatus.appendChild(list);
}

function clearUploadValidationStatus() {
    if (!uploadValidationStatus) return;

    clearElement(uploadValidationStatus);
    uploadValidationStatus.className = "mt-3 d-none";
}

function renderDatasetPreview(datasetName, rows) {
    clearElement(datasetPreview);

    const table = document.createElement("table");
    table.classList.add("table", "caption-top", "table-bordered", "align-middle", "text-center", "tree-data-table");

    const caption = document.createElement("caption");
    caption.classList.add("tree-results-caption");
    caption.textContent = `Vista del dataset: ${datasetName}`;
    table.appendChild(caption);

    const thead = document.createElement("thead");
    const headerRow = document.createElement("tr");
    rows[0].forEach(header => {
        const th = document.createElement("th");
        th.textContent = header;
        headerRow.appendChild(th);
    });
    thead.appendChild(headerRow);

    const tbody = document.createElement("tbody");
    rows.slice(1).forEach(row => {
        const tr = document.createElement("tr");
        rows[0].forEach((_, index) => {
            const td = document.createElement("td");
            td.textContent = row[index] || "";
            if (index === rows[0].length - 1) {
                td.classList.add("fw-semibold");
            }
            tr.appendChild(td);
        });
        tbody.appendChild(tr);
    });

    table.appendChild(thead);
    table.appendChild(tbody);
    datasetPreview.appendChild(table);

    if (rows.length > 8) {
        const note = document.createElement("p");
        note.classList.add("small", "text-body-secondary", "mt-2", "mb-0");
        note.textContent = `Mostrando ${rows.length - 1} filas. Desplaza la tabla para recorrer el dataset.`;
        datasetPreview.appendChild(note);
    }
}

function renderEmptyPreview() {
    clearElement(datasetPreview);
    const message = document.createElement("p");
    message.classList.add("text-body-secondary", "mb-0");
    message.textContent = "Todavia no hay datos cargados.";
    datasetPreview.appendChild(message);
}

function clearElement(element) {
    while (element.firstChild) {
        element.removeChild(element.firstChild);
    }
}
