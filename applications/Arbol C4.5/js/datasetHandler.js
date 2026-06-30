import { getDataInfo, getDataLink } from "../datasets/dataInfo.js";
import { buildC45FromRows, formatNumber, validateC45Rows } from "./c45.mjs";
import { initWorkspacePanels } from "./workspacePanels.js";

const selectExampleDataset = document.getElementById("selectExampleDataset");
const csvFileInput = document.getElementById("csvFileInput");
const clearDatasetButton = document.getElementById("clearDatasetButton");
const uploadValidationStatus = document.getElementById("uploadValidationStatus");
const datasetPreview = document.getElementById("dataTable");
const treeStepContainer = document.getElementById("valueTable");
const treeSvgContainer = document.getElementById("treeSvgContainer");
const treePanel = document.getElementById("treePanel");
const treeStepControls = document.getElementById("treeStepControls");
const treeStepTitle = document.getElementById("treeStepTitle");
const treeStepButtonsContainer = document.getElementById("treeStepButtons");
const dataInfoContainer = document.getElementById("dataInfoContainer");
const currentDatasetSpan = document.getElementById("currentDatasetSpan");
const datasetCardText = document.getElementById("datasetCardText");
const datasetCardLink = document.getElementById("datasetCardLink");

const exampleDatasets = {
    "Leads inmobiliaria": "datasets/leads_inmobiliaria_c45_mixto_booleano_45.csv",
    "Mantenimiento": "datasets/mantenimiento_c45_mixto_booleano_60.csv",
    "Conversión web": "datasets/conversion_web_c45_mixto_booleano_90.csv",
    "Préstamos": "datasets/prestamos_c45_mixto_booleano_150.csv",
    "Estudiantes": "datasets/estudiantes_c45_mixto_booleano_150.csv"
};

let currentDataset = null;
let currentTreeStep = 0;
const DATASET_PREVIEW_BATCH_SIZE = 50;
const CALCULATION_TABLE_BATCH_SIZE = 50;
const MIN_ZOOM = 0.6;
const MAX_ZOOM = 2.5;
const ZOOM_STEP = 0.2;
const MAGNIFIER_ZOOM = 2.25;

let treeZoomScale = 1;
let treeZoomState = null;
let treeMagnifierEnabled = false;
const isPruningPage = window.location.pathname.toLowerCase().endsWith("/poda.html");

csvFileInput.addEventListener("change", handleCsvUpload);
clearDatasetButton.addEventListener("click", clearDataset);
selectExampleDataset.addEventListener("change", event => {
    loadExampleDataset(event.target.value);
});
initWorkspacePanels(refreshTreeLayout);

if ("ResizeObserver" in window && treePanel) {
    let lastTreeWidth = 0;
    let lastTreeHeight = 0;
    let pendingRefresh = false;

    const treePanelObserver = new ResizeObserver(([entry]) => {
        const { width, height } = entry.contentRect;
        const roundedWidth = Math.round(width);
        const roundedHeight = Math.round(height);

        if (roundedWidth === lastTreeWidth && roundedHeight === lastTreeHeight) return;
        lastTreeWidth = roundedWidth;
        lastTreeHeight = roundedHeight;

        if (roundedWidth < 120 || roundedHeight < 120 || pendingRefresh) return;

        pendingRefresh = true;
        requestAnimationFrame(() => {
            pendingRefresh = false;
            refreshTreeLayout();
        });
    });
    treePanelObserver.observe(treePanel);
}

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
        const validation = validateC45Rows(rows);
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

        const validation = validateC45Rows(rows);
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
    const rows = [];
    let row = [];
    let value = "";
    let inQuotes = false;

    for (let index = 0; index < content.length; index++) {
        const char = content[index];
        const next = content[index + 1];

        if (char === "\"" && inQuotes && next === "\"") {
            value += "\"";
            index++;
            continue;
        }
        if (char === "\"") {
            inQuotes = !inQuotes;
            continue;
        }
        if (char === "," && !inQuotes) {
            row.push(value.trim());
            value = "";
            continue;
        }
        if ((char === "\n" || char === "\r") && !inQuotes) {
            if (char === "\r" && next === "\n") index++;
            row.push(value.trim());
            if (row.some(cell => cell !== "")) rows.push(row);
            row = [];
            value = "";
            continue;
        }
        value += char;
    }

    row.push(value.trim());
    if (row.some(cell => cell !== "")) rows.push(row);
    return rows;
}

function setDataset(dataset) {
    currentDataset = dataset
        ? { ...dataset, model: buildC45FromRows(dataset.rows) }
        : null;
    clearDatasetButton.disabled = !dataset;

    if (!currentDataset) {
        renderEmptyPreview();
        renderEmptyTreeStep();
        hideTreeStepControls();
        hideDatasetInfo();
        return;
    }

    renderDatasetPreview(currentDataset.name, currentDataset.rows);
    renderDatasetInfo(currentDataset);
    showTreeStepControls();
    renderTreeStepButtons();
    if (isPruningPage) {
        goToPruningStep(0);
    } else {
        goToTreeStep(0);
    }
}

function clearDataset() {
    currentDataset = null;
    selectExampleDataset.selectedIndex = 0;
    csvFileInput.value = "";
    clearUploadValidationStatus();
    clearDatasetButton.disabled = true;
    renderEmptyPreview();
    renderEmptyTreeStep();
    hideTreeStepControls();
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

function renderDatasetPreview(datasetName, rows, activeStep = null) {
    clearElement(datasetPreview);

    const title = document.createElement("p");
    title.classList.add("tree-results-caption");
    title.textContent = activeStep
        ? activeStep.caption || formatActiveRulesCaption(activeStep.activeConditions)
        : `Vista del dataset: ${datasetName}`;
    datasetPreview.appendChild(title);

    const tableScroll = document.createElement("div");
    tableScroll.classList.add("tree-table-scroll");

    const table = document.createElement("table");
    table.classList.add("table", "table-bordered", "align-middle", "text-center", "tree-data-table");

    const thead = document.createElement("thead");
    const headerRow = document.createElement("tr");
    const rowNumberHeader = document.createElement("th");
    rowNumberHeader.textContent = "#";
    headerRow.appendChild(rowNumberHeader);
    rows[0].forEach(header => {
        const th = document.createElement("th");
        th.textContent = formatAttributeLabel(header);
        th.title = header;
        headerRow.appendChild(th);
    });
    thead.appendChild(headerRow);

    const activeIndexes = activeStep ? new Set(activeStep.dataRowIndexes) : null;
    const conditionColumns = activeStep ? new Set(activeStep.activeConditions.map(condition => condition.attributeIndex)) : new Set();
    const dataRows = rows.slice(1);
    const tbody = document.createElement("tbody");
    let renderedRows = 0;

    const renderNextRows = () => {
        const nextRenderedRows = Math.min(renderedRows + DATASET_PREVIEW_BATCH_SIZE, dataRows.length);
        appendDatasetPreviewRows({
            tbody,
            rows,
            dataRows,
            startIndex: renderedRows,
            endIndex: nextRenderedRows,
            activeIndexes,
            conditionColumns
        });
        renderedRows = nextRenderedRows;
    };

    renderNextRows();

    table.appendChild(thead);
    table.appendChild(tbody);
    tableScroll.appendChild(table);
    datasetPreview.appendChild(tableScroll);

    const note = document.createElement("p");
    note.classList.add("small", "text-body-secondary", "mt-2", "mb-0");
    datasetPreview.appendChild(note);

    const updatePreviewNote = () => {
        note.textContent = activeStep?.note
            ? activeStep.note(renderedRows, dataRows.length)
            : activeStep
            ? `Mostrando ${renderedRows} de ${dataRows.length} filas; las filas atenuadas no cumplen la regla actual.`
            : `Mostrando ${renderedRows} de ${dataRows.length} filas.`;
    };
    updatePreviewNote();

    if (dataRows.length > DATASET_PREVIEW_BATCH_SIZE) {
        tableScroll.addEventListener("scroll", () => {
            const nearBottom = tableScroll.scrollTop + tableScroll.clientHeight >= tableScroll.scrollHeight - 40;
            if (!nearBottom || renderedRows >= dataRows.length) return;

            renderNextRows();
            updatePreviewNote();
        });
    }
}

function appendDatasetPreviewRows({ tbody, rows, dataRows, startIndex, endIndex, activeIndexes, conditionColumns }) {
    const fragment = document.createDocumentFragment();

    for (let rowIndex = startIndex; rowIndex < endIndex; rowIndex++) {
        const row = dataRows[rowIndex];
        const tr = document.createElement("tr");
        if (activeIndexes && !activeIndexes.has(rowIndex)) {
            tr.classList.add("table-secondary");
        }

        const rowNumberCell = document.createElement("td");
        rowNumberCell.textContent = String(rowIndex + 1);
        rowNumberCell.classList.add("fw-semibold");
        tr.appendChild(rowNumberCell);

        rows[0].forEach((_, index) => {
            const td = document.createElement("td");
            td.textContent = row[index] || "";
            if (conditionColumns.has(index)) {
                td.classList.add("table-warning");
            }
            if (index === rows[0].length - 1) {
                td.classList.add("fw-semibold");
            }
            tr.appendChild(td);
        });
        fragment.appendChild(tr);
    }

    tbody.appendChild(fragment);
}

function formatActiveRulesCaption(conditions) {
    if (!conditions || conditions.length === 0) return "Regla actual: raíz";
    const rules = conditions.map(condition => `${condition.attribute}${condition.operator}${formatConditionValue(condition.value)}`);
    return `${rules.length === 1 ? "Regla actual" : "Reglas actuales"}: ${rules.join(" & ")}`;
}

function formatConditionValue(value) {
    return typeof value === "number" ? formatNumber(value) : value;
}

function renderEmptyPreview() {
    clearElement(datasetPreview);
    const message = document.createElement("p");
    message.classList.add("text-body-secondary", "mb-0");
    message.textContent = "Todavía no hay datos cargados.";
    datasetPreview.appendChild(message);
}

function renderEmptyTreeStep() {
    clearElement(treeStepContainer);
    destroyTreeZoom();
    clearElement(treeSvgContainer);
    const message = document.createElement("p");
    message.classList.add("text-body-secondary", "text-center", "mb-0");
    message.textContent = "Selecciona un dataset para calcular el primer nodo.";
    treeStepContainer.appendChild(message);
}

function goToTreeStep(stepIndex) {
    if (!currentDataset) return;

    currentTreeStep = Math.max(0, Math.min(stepIndex, currentDataset.model.steps.length - 1));
    updateTreeStepButtons();

    const step = currentDataset.model.steps[currentTreeStep];
    const node = step.node;
    treeStepTitle.textContent = `Paso ${currentTreeStep + 1}: ${node.isLeaf ? "Hoja" : "Nodo"} ${node.id}`;
    renderDatasetPreview(currentDataset.name, currentDataset.rows, step);
    renderStepValueTable(step);
    renderProgressiveTree(step.stepNumber);
}

function goToPruningStep(stepIndex) {
    if (!currentDataset) return;

    const pruningSteps = currentDataset.model.pruning.processSteps;
    currentTreeStep = Math.max(0, Math.min(stepIndex, pruningSteps.length - 1));
    updateTreeStepButtons();

    const step = pruningSteps[currentTreeStep];
    treeStepTitle.textContent = step.title;
    renderDatasetPreview(currentDataset.name, currentDataset.rows, createPruningDatasetStep(step));
    renderPruningValuePanel(step);
    renderTreeSnapshot(step.root, step.evaluation?.nodeId ?? null);
}

function createPruningDatasetStep(step) {
    if (!step?.evaluation) return null;
    return {
        dataRowIndexes: step.evaluation.dataRowIndexes,
        activeConditions: [],
        caption: `Registros usados para calcular el error del nodo ${step.evaluation.nodeId}`,
        note: (renderedRows, totalRows) => `Mostrando ${renderedRows} de ${totalRows} filas; las filas atenuadas no llegan al nodo evaluado.`
    };
}

function renderPruningValuePanel(step) {
    clearElement(treeStepContainer);
    if (step?.evaluation) {
        treeStepContainer.appendChild(createPruningCalculationView(step));
        return;
    }

    const message = document.createElement("p");
    message.classList.add("text-body-secondary", "text-center", "mb-0", "p-3");
    message.textContent = "La poda parte del arbol completo. Avanza paso a paso para evaluar los subarboles candidatos.";
    treeStepContainer.appendChild(message);
}

function createPruningCalculationView(step) {
    const wrapper = document.createElement("div");
    wrapper.classList.add("tree-node-values-wrapper", "pruning-calculation-view");

    const caption = document.createElement("p");
    caption.classList.add("tree-results-caption", "mb-2");
    caption.textContent = `Subarbol evaluado del nodo ${step.evaluation.nodeId}`;
    wrapper.appendChild(caption);

    const subTreeRoot = findNodeInTree(step.root, step.evaluation.nodeId);
    if (subTreeRoot) {
        wrapper.appendChild(createPruningSubtreeSvg(subTreeRoot, step.evaluation.nodeId));
    }

    const summary = document.createElement("p");
    summary.classList.add("small", "text-body-secondary", "mt-2", "mb-2", "text-center");
    if (step.action === "evaluate") {
        summary.textContent = step.evaluation.pruned
            ? "La comparacion indica que este subarbol se podara en el siguiente paso."
            : "La comparacion indica que este subarbol se conservara en el siguiente paso.";
    } else if (step.action === "pruned") {
        summary.textContent = `Poda aplicada: el nodo ${step.evaluation.nodeId} queda como hoja y predice la clase ${step.evaluation.predictedLabel}.`;
    } else {
        summary.textContent = `Decision aplicada: el subarbol del nodo ${step.evaluation.nodeId} se conserva.`;
    }
    wrapper.appendChild(summary);

    wrapper.appendChild(createPruningCalculationTable(step.evaluation));
    return wrapper;
}

function createPruningSubtreeSvg(subTreeRoot, currentNodeId) {
    const nodes = cloneSubtreeForPreview(subTreeRoot);
    assignPreviewTreePositions(nodes.root);
    const visibleNodes = [];
    collectVisibleNodes(nodes.root, Infinity, visibleNodes, false);
    const maxX = Math.max(...visibleNodes.map(node => node.x)) + 80;
    const maxY = Math.max(...visibleNodes.map(node => node.y)) + 70;

    const svg = createSvgElement("svg", {
        class: "chosen-node-svg c45-tree-svg pruning-subtree-svg",
        viewBox: `0 0 ${Math.max(360, maxX)} ${Math.max(180, maxY)}`,
        role: "img",
        "aria-label": `Subarbol evaluado del nodo ${currentNodeId}`
    });

    visibleNodes.forEach(node => {
        node.children.forEach(child => svg.appendChild(createTreeBranch(node, child)));
    });
    visibleNodes.forEach(node => {
        svg.appendChild(createTreeNodeGraphic(node, node.id === currentNodeId));
    });

    const preview = document.createElement("div");
    preview.classList.add("chosen-node-preview", "pruning-subtree-preview");
    preview.appendChild(svg);
    return preview;
}

function createPruningCalculationTable(evaluation) {
    const table = document.createElement("table");
    table.classList.add("table", "caption-top", "table-bordered", "align-middle", "text-center", "tree-node-values-table");

    const caption = document.createElement("caption");
    caption.classList.add("tree-results-caption");
    caption.textContent = "Valores de poda";
    table.appendChild(caption);

    const thead = document.createElement("thead");
    const headerRow = document.createElement("tr");
    ["Elemento", "N", "Errores", "Peso", "Error estimado"].forEach(text => {
        const th = document.createElement("th");
        th.scope = "col";
        th.textContent = text;
        headerRow.appendChild(th);
    });
    thead.appendChild(headerRow);
    table.appendChild(thead);

    const tbody = document.createElement("tbody");
    evaluation.leafStats.forEach(leaf => {
        const tr = document.createElement("tr");
        tr.appendChild(createCell(`Hoja ${leaf.nodeId} -> ${leaf.predictedLabel}`));
        tr.appendChild(createCell(String(leaf.n)));
        tr.appendChild(createCell(String(leaf.errors)));
        tr.appendChild(createCell(formatNumber(leaf.weight)));
        tr.appendChild(createCell(formatNumber(leaf.estimatedError)));
        tbody.appendChild(tr);
    });

    const subtreeRow = document.createElement("tr");
    subtreeRow.classList.add("table-warning");
    subtreeRow.appendChild(createCell(`Subarbol nodo ${evaluation.nodeId}`, { classes: ["fw-semibold"] }));
    subtreeRow.appendChild(createCell(String(evaluation.dataRowIndexes.length)));
    subtreeRow.appendChild(createCell(String(evaluation.subtreeErrors)));
    subtreeRow.appendChild(createCell("1.00"));
    subtreeRow.appendChild(createCell(formatNumber(evaluation.subtreeEstimatedError), { classes: ["fw-semibold"] }));
    tbody.appendChild(subtreeRow);

    const leafRow = document.createElement("tr");
    leafRow.classList.add(evaluation.pruned ? "table-success" : "table-secondary");
    leafRow.appendChild(createCell(`Hoja simplificada -> ${evaluation.predictedLabel}`, { classes: ["fw-semibold"] }));
    leafRow.appendChild(createCell(String(evaluation.dataRowIndexes.length)));
    leafRow.appendChild(createCell(String(evaluation.simplifiedLeafErrors)));
    leafRow.appendChild(createCell("1.00"));
    leafRow.appendChild(createCell(formatNumber(evaluation.simplifiedLeafEstimatedError), { classes: ["fw-semibold"] }));
    tbody.appendChild(leafRow);

    const decisionRow = document.createElement("tr");
    const decisionCell = createCell(evaluation.pruned
        ? "Decision: podar el subarbol"
        : "Decision: conservar el subarbol", { classes: ["fw-bold"] });
    decisionCell.colSpan = 5;
    decisionRow.appendChild(decisionCell);
    tbody.appendChild(decisionRow);

    table.appendChild(tbody);
    return table;
}

function updateTreeStepButtons() {
    const buttons = treeStepButtonsContainer.querySelectorAll("button");
    buttons.forEach(button => button.classList.remove("active-step"));
    const [firstButton, previousButton, nextButton, lastButton] = buttons;
    const lastStepIndex = getCurrentStepCount() - 1;
    firstButton.disabled = currentTreeStep === 0;
    previousButton.disabled = currentTreeStep === 0;
    nextButton.disabled = currentTreeStep === lastStepIndex;
    lastButton.disabled = currentTreeStep === lastStepIndex;
}

function showTreeStepControls() {
    treeStepControls.classList.remove("d-none");
}

function hideTreeStepControls() {
    treeStepControls.classList.add("d-none");
    treeStepTitle.textContent = "";
    currentTreeStep = 0;
    updateTreeStepButtons();
}

function renderTreeStepButtons() {
    clearElement(treeStepButtonsContainer);
    const goToStep = isPruningPage ? goToPruningStep : goToTreeStep;
    const controls = [
        { label: "|<", title: "Ir al primer paso", action: () => goToStep(0) },
        { label: "<", title: "Ir al paso anterior", action: () => goToStep(currentTreeStep - 1) },
        { label: ">", title: "Ir al paso siguiente", action: () => goToStep(currentTreeStep + 1) },
        { label: ">|", title: "Ir al ultimo paso", action: () => goToStep(getCurrentStepCount() - 1) }
    ];

    controls.forEach(control => {
        const button = document.createElement("button");
        button.classList.add("step-btn");
        button.type = "button";
        button.textContent = control.label;
        button.title = control.title;
        button.setAttribute("aria-label", control.title);
        button.addEventListener("click", control.action);
        treeStepButtonsContainer.appendChild(button);
    });
}

function getCurrentStepCount() {
    if (!currentDataset) return 0;
    return isPruningPage
        ? currentDataset.model.pruning.processSteps.length
        : currentDataset.model.steps.length;
}

function renderStepValueTable(step) {
    clearElement(treeStepContainer);

    if (step.type === "leaf") {
        treeStepContainer.appendChild(createLeafValueTable(step.node, currentDataset.model.classLabels));
        return;
    }

    treeStepContainer.appendChild(createC45ValueTable(step.node.evaluation));
}

function createC45ValueTable(evaluation) {
    const wrapper = document.createElement("div");
    wrapper.classList.add("table-responsive", "threshold-values-wrapper", "tree-node-values-wrapper");

    const table = document.createElement("table");
    table.classList.add("table", "caption-top", "table-bordered", "align-middle", "text-center", "tree-node-values-table");

    const caption = document.createElement("caption");
    caption.classList.add("tree-results-caption");
    caption.textContent = "Valores calculados";
    table.appendChild(caption);
    table.appendChild(createC45ValueTableHead());

    const tbody = document.createElement("tbody");
    const totalRows = countCalculationRows(evaluation);
    const nextRow = createCalculationRowFactory(evaluation);
    let renderedRows = 0;

    const renderNextRows = () => {
        const addedRows = appendNextCalculationRows(tbody, nextRow, CALCULATION_TABLE_BATCH_SIZE);
        renderedRows += addedRows;
    };

    renderNextRows();

    table.appendChild(tbody);
    wrapper.appendChild(table);

    const note = document.createElement("p");
    note.classList.add("small", "text-body-secondary", "mt-2", "mb-0");
    wrapper.appendChild(note);

    const updateNote = () => {
        note.textContent = `Mostrando ${renderedRows} de ${totalRows} filas calculadas.`;
    };
    updateNote();

    if (totalRows > CALCULATION_TABLE_BATCH_SIZE) {
        wrapper.addEventListener("scroll", () => {
            const nearBottom = wrapper.scrollTop + wrapper.clientHeight >= wrapper.scrollHeight - 40;
            if (!nearBottom || renderedRows >= totalRows) return;

            renderNextRows();
            updateNote();
        });
    }

    return wrapper;
}

function createC45ValueTableHead() {
    const thead = document.createElement("thead");
    const firstRow = document.createElement("tr");
    const secondRow = document.createElement("tr");
    const staticHeaders = ["Atributo", "División / Valor"];
    staticHeaders.forEach(text => {
        const th = document.createElement("th");
        th.scope = "col";
        th.rowSpan = 2;
        th.textContent = text;
        firstRow.appendChild(th);
    });

    const classHeader = document.createElement("th");
    classHeader.colSpan = currentDataset.model.classLabels.length;
    classHeader.textContent = "Clases";
    firstRow.appendChild(classHeader);

    ["Proporción", "E", "CE", "Ganancia de información", "Split Info", "Gain Ratio"].forEach(text => {
        const th = document.createElement("th");
        th.scope = "col";
        th.rowSpan = 2;
        th.textContent = text;
        firstRow.appendChild(th);
    });

    currentDataset.model.classLabels.forEach(label => {
        const th = document.createElement("th");
        th.scope = "col";
        th.textContent = label;
        secondRow.appendChild(th);
    });

    thead.appendChild(firstRow);
    thead.appendChild(secondRow);
    return thead;
}

function countCalculationRows(evaluation) {
    return evaluation.reduce((total, attributeData) => {
        return total + (attributeData.type === "numeric"
            ? attributeData.candidates.length * 2
            : attributeData.candidates.length);
    }, 0);
}

function appendNextCalculationRows(tbody, nextRow, batchSize) {
    const fragment = document.createDocumentFragment();
    let addedRows = 0;

    while (addedRows < batchSize) {
        const row = nextRow();
        if (!row) break;
        fragment.appendChild(row);
        addedRows++;
    }

    tbody.appendChild(fragment);
    return addedRows;
}

function createCalculationRowFactory(evaluation) {
    let attributeIndex = 0;
    let candidateIndex = 0;
    let groupIndex = 0;

    return function nextRow() {
        while (attributeIndex < evaluation.length) {
            const attributeData = evaluation[attributeIndex];
            const row = attributeData.type === "numeric"
                ? createNextNumericCalculationRow(attributeData, candidateIndex, groupIndex)
                : createNextCategoricalCalculationRow(attributeData, candidateIndex);

            if (attributeData.type === "numeric") {
                groupIndex++;
                if (groupIndex >= 2) {
                    groupIndex = 0;
                    candidateIndex++;
                }
                if (candidateIndex >= attributeData.candidates.length) {
                    candidateIndex = 0;
                    attributeIndex++;
                }
            } else {
                candidateIndex++;
                if (candidateIndex >= attributeData.candidates.length) {
                    candidateIndex = 0;
                    attributeIndex++;
                }
            }

            if (row) return row;
        }

        return null;
    };
}

function createNextCategoricalCalculationRow(attributeData, index) {
    const rows = attributeData.candidates;
    const candidate = rows[index];
    const tr = document.createElement("tr");
    if (index === 0) tr.classList.add("table-group-divider");
    const selectedClass = attributeData.selected ? "table-warning" : "";

    if (index === 0) {
        tr.appendChild(createCell(attributeData.attribute, { rowSpan: rows.length, classes: ["fw-semibold", selectedClass] }));
    }

    tr.appendChild(createCell(candidate.value));
    appendClassCountCells(tr, candidate.classCounts);
    tr.appendChild(createCell(formatNumber(candidate.ratio)));
    tr.appendChild(createCell(formatNumber(candidate.entropy)));

    if (index === 0) {
        tr.appendChild(createCell(formatNumber(attributeData.conditionalEntropy), { rowSpan: rows.length, classes: [selectedClass] }));
        tr.appendChild(createCell(formatNumber(attributeData.informationGain), { rowSpan: rows.length, classes: [selectedClass] }));
        tr.appendChild(createCell(formatNumber(attributeData.splitInfo), { rowSpan: rows.length, classes: [selectedClass] }));
        const gainRatioText = `${formatNumber(attributeData.gainRatio)}${attributeData.selected ? " Seleccionado" : ""}`;
        tr.appendChild(createCell(gainRatioText, { rowSpan: rows.length, classes: ["fw-semibold", selectedClass] }));
    }

    return tr;
}

function createNextNumericCalculationRow(attributeData, candidateIndex, groupIndex) {
    const totalRows = attributeData.candidates.length * 2;
    const candidate = attributeData.candidates[candidateIndex];
    const group = candidate.groups[groupIndex];
    const tr = document.createElement("tr");
    const selected = attributeData.selected && candidate.selectedForAttribute;
    const selectedClass = selected ? "table-warning" : "";

    if (candidateIndex === 0 && groupIndex === 0) {
        tr.classList.add("table-group-divider");
        tr.appendChild(createCell(attributeData.attribute, { rowSpan: totalRows, classes: ["fw-semibold", selectedClass] }));
    }

    tr.appendChild(createCell(`${attributeData.attribute} ${group.label}`, { classes: [selectedClass] }));
    appendClassCountCells(tr, group.classCounts, selectedClass);
    tr.appendChild(createCell(formatNumber(group.ratio), { classes: [selectedClass] }));
    tr.appendChild(createCell(formatNumber(group.entropy), { classes: [selectedClass] }));

    if (groupIndex === 0) {
        tr.appendChild(createCell(formatNumber(candidate.conditionalEntropy), { rowSpan: 2, classes: [selectedClass] }));
        tr.appendChild(createCell(formatNumber(candidate.informationGain), { rowSpan: 2, classes: [selectedClass] }));
        tr.appendChild(createCell(formatNumber(candidate.splitInfo), { rowSpan: 2, classes: [selectedClass] }));
        const gainRatioText = `${formatNumber(candidate.gainRatio)}${selected ? " Seleccionado" : ""}`;
        tr.appendChild(createCell(gainRatioText, { rowSpan: 2, classes: ["fw-semibold", selectedClass] }));
    }

    return tr;
}

function appendClassCountCells(row, classCounts, extraClass = "") {
    currentDataset.model.classLabels.forEach(label => {
        row.appendChild(createCell(String(classCounts[label] || 0), { classes: [extraClass] }));
    });
}

function createLeafValueTable(node, classLabels) {
    const wrapper = document.createElement("div");
    wrapper.classList.add("table-responsive", "tree-node-values-wrapper");
    const table = document.createElement("table");
    table.classList.add("table", "caption-top", "table-bordered", "align-middle", "text-center", "tree-node-values-table");

    const caption = document.createElement("caption");
    caption.classList.add("tree-results-caption");
    caption.textContent = node.stopReason === "pure"
        ? "Todas las etiquetas tienen el mismo valor"
        : "No quedan atributos o umbrales válidos, por lo que se elige la clase más frecuente";
    table.appendChild(caption);

    const thead = document.createElement("thead");
    const headerRow = document.createElement("tr");
    ["Clase", "Conteo"].forEach(text => {
        const th = document.createElement("th");
        th.textContent = text;
        headerRow.appendChild(th);
    });
    thead.appendChild(headerRow);
    table.appendChild(thead);

    const tbody = document.createElement("tbody");
    classLabels.forEach(label => {
        const tr = document.createElement("tr");
        tr.appendChild(createCell(label, { classes: ["fw-semibold"] }));
        tr.appendChild(createCell(String(node.classCounts[label] || 0)));
        tbody.appendChild(tr);
    });
    const predicted = document.createElement("tr");
    predicted.classList.add("table-warning");
    predicted.appendChild(createCell("Clase predicha", { classes: ["fw-semibold"] }));
    predicted.appendChild(createCell(node.predictedLabel, { classes: ["fw-semibold"] }));
    tbody.appendChild(predicted);

    table.appendChild(tbody);
    wrapper.appendChild(table);
    return wrapper;
}

function createCell(text, options = {}) {
    const cell = document.createElement("td");
    cell.textContent = text;
    if (options.rowSpan) cell.rowSpan = options.rowSpan;
    (options.classes || []).filter(Boolean).forEach(className => cell.classList.add(className));
    return cell;
}

function renderProgressiveTree(maxStepNumber) {
    renderTree({
        root: currentDataset.model.root,
        maxStepNumber,
        currentNodeId: null,
        progressive: true
    });
}

function renderTreeSnapshot(root, currentNodeId = null) {
    renderTree({
        root,
        maxStepNumber: Infinity,
        currentNodeId,
        progressive: false
    });
}

function renderTree({ root, maxStepNumber, currentNodeId, progressive }) {
    destroyTreeZoom();
    clearElement(treeSvgContainer);
    const nodes = [];
    collectVisibleNodes(root, maxStepNumber, nodes, progressive);
    if (nodes.length === 0) return;

    const maxX = Math.max(...nodes.map(node => node.x)) + 80;
    const maxY = Math.max(...nodes.map(node => node.y)) + 70;
    const svg = createSvgElement("svg", {
        id: "svgDT",
        class: "chosen-node-svg c45-tree-svg",
        viewBox: `0 0 ${Math.max(720, maxX)} ${Math.max(370, maxY)}`,
        role: "img",
        "aria-label": "Árbol de decisión C4.5"
    });

    nodes.forEach(node => {
        node.children
            .filter(child => !progressive || child.stepNumber <= maxStepNumber)
            .forEach(child => {
                svg.appendChild(createTreeBranch(node, child));
            });
    });

    nodes.forEach(node => {
        svg.appendChild(createTreeNodeGraphic(node, node.stepNumber === maxStepNumber || node.id === currentNodeId));
    });

    const wrapper = document.createElement("div");
    wrapper.classList.add("chosen-node-preview");
    wrapper.appendChild(svg);

    const controls = createTreeZoomControls();
    const treeZoomContainer = document.createElement("div");
    treeZoomContainer.id = "treeZoomContainer";
    treeZoomContainer.classList.add("tree-zoom-container");

    const scaleShell = document.createElement("div");
    scaleShell.classList.add("tree-zoom-scale-shell");
    wrapper.classList.add("tree-zoom-content");
    scaleShell.appendChild(wrapper);
    treeZoomContainer.appendChild(scaleShell);

    treeSvgContainer.appendChild(controls);
    treeSvgContainer.appendChild(treeZoomContainer);
    initializeTreeZoom(treeZoomContainer, scaleShell, wrapper, controls);
}

export function refreshTreeLayout() {
    if (!currentDataset) return;
    if (isPruningPage) {
        const step = currentDataset.model.pruning.processSteps[currentTreeStep];
        renderTreeSnapshot(step.root, step.evaluation?.nodeId ?? null);
        return;
    }
    renderProgressiveTree(currentDataset.model.steps[currentTreeStep].stepNumber);
}

function createTreeZoomControls() {
    const controls = document.createElement("div");
    controls.classList.add("tree-zoom-controls");

    const thresholdLegend = document.createElement("div");
    thresholdLegend.classList.add("tree-threshold-legend");
    thresholdLegend.setAttribute("aria-label", "Leyenda de ramas con umbrales");
    thresholdLegend.append(
        createThresholdLegendItem("<=", "datos por debajo o igual que el umbral"),
        createThresholdLegendItem(">", "datos por encima del umbral")
    );

    const treeMagnifierButton = createTreeZoomButton("Lupa", "Activar lupa del árbol", toggleTreeMagnifier);
    treeMagnifierButton.id = "treeMagnifierButton";
    treeMagnifierButton.setAttribute("aria-pressed", "false");

    const zoomOutButton = createTreeZoomButton("-", "Reducir zoom del árbol", () => setTreeZoomScale(treeZoomScale - ZOOM_STEP));
    zoomOutButton.id = "zoomOutButton";

    const resetZoomButton = createTreeZoomButton("100%", "Restaurar zoom del árbol", () => setTreeZoomScale(1));
    resetZoomButton.id = "resetZoomButton";

    const zoomInButton = createTreeZoomButton("+", "Aumentar zoom del árbol", () => setTreeZoomScale(treeZoomScale + ZOOM_STEP));
    zoomInButton.id = "zoomInButton";

    const zoomIndicator = document.createElement("span");
    zoomIndicator.classList.add("tree-zoom-indicator");
    zoomIndicator.setAttribute("aria-live", "polite");

    controls.append(thresholdLegend, treeMagnifierButton, zoomOutButton, resetZoomButton, zoomInButton, zoomIndicator);
    controls.treeMagnifierButton = treeMagnifierButton;
    controls.zoomOutButton = zoomOutButton;
    controls.resetZoomButton = resetZoomButton;
    controls.zoomInButton = zoomInButton;
    controls.zoomIndicator = zoomIndicator;
    return controls;
}

function createThresholdLegendItem(operator, description) {
    const item = document.createElement("span");
    item.classList.add("tree-threshold-legend-item");

    const symbol = document.createElement("span");
    symbol.classList.add("tree-threshold-legend-symbol");
    symbol.textContent = operator;

    const text = document.createElement("span");
    text.textContent = description;

    item.append(symbol, text);
    return item;
}

function createTreeZoomButton(text, ariaLabel, action) {
    const button = document.createElement("button");
    button.type = "button";
    button.classList.add("tree-zoom-button");
    button.textContent = text;
    button.setAttribute("aria-label", ariaLabel);
    button.title = ariaLabel;
    button.addEventListener("click", action);
    return button;
}

function initializeTreeZoom(treeZoomContainer, scaleShell, treeZoomContent, controls) {
    const treeMagnifier = document.createElement("div");
    treeMagnifier.id = "treeMagnifier";
    treeMagnifier.classList.add("tree-magnifier");
    treeZoomContainer.appendChild(treeMagnifier);

    treeZoomState = {
        treeZoomContainer,
        scaleShell,
        treeZoomContent,
        treeMagnifier,
        controls,
        baseWidth: 0,
        baseHeight: 0,
        isPointerInside: false,
        lastPointer: null
    };

    const syncLens = () => syncTreeMagnifierContent();
    const handleMouseEnter = event => {
        if (!canShowTreeMagnifier()) return;
        treeZoomState.isPointerInside = true;
        treeMagnifier.classList.add("is-visible");
        updateTreeMagnifier(event);
    };
    const handleMouseMove = event => updateTreeMagnifier(event);
    const handleMouseLeave = () => hideTreeMagnifier();
    const handleScroll = () => {
        if (treeZoomState?.isPointerInside && treeZoomState.lastPointer) {
            updateTreeMagnifier(treeZoomState.lastPointer);
        }
    };

    treeZoomState.listeners = [
        [treeZoomContainer, "mouseenter", handleMouseEnter],
        [treeZoomContainer, "mousemove", handleMouseMove],
        [treeZoomContainer, "mouseleave", handleMouseLeave],
        [treeZoomContainer, "scroll", handleScroll],
        [window, "resize", syncLens]
    ];
    treeZoomState.listeners.forEach(([target, type, listener]) => target.addEventListener(type, listener));

    applyTreeZoomScale();
    requestAnimationFrame(() => {
        updateTreeZoomShellSize();
        syncTreeMagnifierContent();
        updateTreeZoomControls();
    });
}

function destroyTreeZoom() {
    if (!treeZoomState) return;
    treeZoomState.listeners?.forEach(([target, type, listener]) => target.removeEventListener(type, listener));
    treeZoomState = null;
}

function setTreeZoomScale(nextScale) {
    treeZoomScale = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, Number(nextScale.toFixed(2))));
    applyTreeZoomScale();
}

function toggleTreeMagnifier() {
    treeMagnifierEnabled = !treeMagnifierEnabled;
    if (!treeMagnifierEnabled) hideTreeMagnifier();
    updateTreeZoomControls();
}

function applyTreeZoomScale() {
    if (!treeZoomState) return;

    treeZoomState.treeZoomContent.style.transform = `scale(${treeZoomScale})`;
    updateTreeZoomControls();
    requestAnimationFrame(() => {
        updateTreeZoomShellSize();
        syncTreeMagnifierContent();
        if (treeZoomState?.isPointerInside && treeZoomState.lastPointer) {
            updateTreeMagnifier(treeZoomState.lastPointer);
        }
    });
}

function updateTreeZoomShellSize() {
    if (!treeZoomState) return;

    const { scaleShell, treeZoomContent } = treeZoomState;
    const rect = treeZoomContent.getBoundingClientRect();
    const baseWidth = treeZoomContent.scrollWidth || rect.width / treeZoomScale;
    const baseHeight = treeZoomContent.scrollHeight || rect.height / treeZoomScale;
    treeZoomState.baseWidth = baseWidth;
    treeZoomState.baseHeight = baseHeight;
    scaleShell.style.width = `${baseWidth * treeZoomScale}px`;
    scaleShell.style.height = `${baseHeight * treeZoomScale}px`;
}

function updateTreeZoomControls() {
    if (!treeZoomState) return;

    const { treeMagnifierButton, zoomInButton, zoomOutButton, resetZoomButton, zoomIndicator } = treeZoomState.controls;
    const canUseMagnifier = canUseTreeMagnifier();
    treeMagnifierButton.disabled = !canUseMagnifier;
    treeMagnifierButton.classList.toggle("is-active", treeMagnifierEnabled && canUseMagnifier);
    treeMagnifierButton.setAttribute("aria-pressed", String(treeMagnifierEnabled && canUseMagnifier));
    treeMagnifierButton.setAttribute(
        "aria-label",
        treeMagnifierEnabled && canUseMagnifier ? "Desactivar lupa del árbol" : "Activar lupa del árbol"
    );
    treeMagnifierButton.title = treeMagnifierButton.getAttribute("aria-label");
    zoomOutButton.disabled = treeZoomScale <= MIN_ZOOM;
    zoomInButton.disabled = treeZoomScale >= MAX_ZOOM;
    resetZoomButton.disabled = treeZoomScale === 1;
    resetZoomButton.textContent = "100%";
    zoomIndicator.textContent = `${Math.round(treeZoomScale * 100)}%`;
}

function canUseTreeMagnifier() {
    return window.matchMedia("(hover: hover) and (pointer: fine)").matches;
}

function canShowTreeMagnifier() {
    return treeMagnifierEnabled && canUseTreeMagnifier();
}

function hideTreeMagnifier() {
    if (!treeZoomState) return;
    treeZoomState.isPointerInside = false;
    treeZoomState.lastPointer = null;
    treeZoomState.treeMagnifier.classList.remove("is-visible");
}

function syncTreeMagnifierContent() {
    if (!treeZoomState) return;

    const { treeMagnifier, treeZoomContent } = treeZoomState;
    clearElement(treeMagnifier);
    const magnifiedContent = treeZoomContent.cloneNode(true);
    magnifiedContent.classList.add("tree-magnifier-content");
    magnifiedContent.style.width = `${treeZoomState.baseWidth || treeZoomContent.scrollWidth}px`;
    magnifiedContent.style.height = `${treeZoomState.baseHeight || treeZoomContent.scrollHeight}px`;
    magnifiedContent.style.transform = "none";
    magnifiedContent.removeAttribute("id");
    treeMagnifier.appendChild(magnifiedContent);
}

function updateTreeMagnifier(event) {
    if (!treeZoomState || !canShowTreeMagnifier()) {
        hideTreeMagnifier();
        return;
    }

    const { treeZoomContainer, treeMagnifier } = treeZoomState;
    const rect = treeZoomContainer.getBoundingClientRect();
    const pointerX = event.clientX - rect.left;
    const pointerY = event.clientY - rect.top;

    if (pointerX < 0 || pointerY < 0 || pointerX > rect.width || pointerY > rect.height) {
        hideTreeMagnifier();
        return;
    }

    treeZoomState.lastPointer = event;

    const size = treeMagnifier.offsetWidth || 200;
    const radius = size / 2;
    const left = clamp(pointerX - radius, 0, Math.max(0, treeZoomContainer.clientWidth - size));
    const top = clamp(pointerY - radius, 0, Math.max(0, treeZoomContainer.clientHeight - size));
    const sourceX = treeZoomContainer.scrollLeft + pointerX;
    const sourceY = treeZoomContainer.scrollTop + pointerY;
    const magnifiedContent = treeMagnifier.firstElementChild;

    treeMagnifier.style.left = `${treeZoomContainer.scrollLeft + left}px`;
    treeMagnifier.style.top = `${treeZoomContainer.scrollTop + top}px`;

    if (magnifiedContent) {
        const scale = treeZoomScale * MAGNIFIER_ZOOM;
        const translateX = radius - (sourceX / treeZoomScale) * scale;
        const translateY = radius - (sourceY / treeZoomScale) * scale;
        magnifiedContent.style.transform = `matrix(${scale}, 0, 0, ${scale}, ${translateX}, ${translateY})`;
    }
}

function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
}

function collectVisibleNodes(node, maxStepNumber, nodes, progressive = true) {
    if (progressive && node.stepNumber > maxStepNumber) return;
    nodes.push(node);
    node.children.forEach(child => collectVisibleNodes(child, maxStepNumber, nodes, progressive));
}

function findNodeInTree(root, nodeId) {
    let found = null;
    const visit = node => {
        if (node.id === nodeId) {
            found = node;
            return;
        }
        node.children.forEach(visit);
    };
    visit(root);
    return found;
}

function cloneSubtreeForPreview(node) {
    const clone = {
        ...node,
        parent: null,
        classCounts: { ...node.classCounts },
        dataRowIndexes: [...node.dataRowIndexes],
        branchCondition: node.branchCondition ? { ...node.branchCondition } : null,
        children: []
    };

    clone.children = node.children.map(child => {
        const childClone = {
            ...child,
            parent: clone,
            classCounts: { ...child.classCounts },
            dataRowIndexes: [...child.dataRowIndexes],
            branchCondition: child.branchCondition ? { ...child.branchCondition } : null,
            children: []
        };
        return childClone;
    });

    return { root: clone };
}

function assignPreviewTreePositions(root) {
    let leafIndex = 0;
    const spacingX = 112;
    const spacingY = 128;

    const assign = node => {
        node.y = 60 + node.depth * spacingY;
        if (node.children.length === 0) {
            node.x = 56 + leafIndex * spacingX;
            leafIndex++;
            return node.x;
        }
        const childXs = node.children.map(assign);
        node.x = (Math.min(...childXs) + Math.max(...childXs)) / 2;
        return node.x;
    };

    const resetDepth = (node, depth) => {
        node.depth = depth;
        node.children.forEach(child => resetDepth(child, depth + 1));
    };

    resetDepth(root, 0);
    assign(root);
}

function createTreeBranch(parent, child) {
    const group = createSvgElement("g");
    const parentBottomOffset = parent.isLeaf ? 32 : 39;
    const childTopOffset = child.isLeaf ? 32 : 39;
    group.appendChild(createSvgElement("line", {
        x1: parent.x,
        y1: parent.y + parentBottomOffset,
        x2: child.x,
        y2: child.y - childTopOffset,
        class: "chosen-node-svg-branch-line"
    }));

    const labelX = (parent.x + child.x) / 2;
    const labelY = (parent.y + child.y) / 2;
    const fullBranchLabel = child.branchCondition?.label || formatBranchLabel(child.branchCondition);
    group.appendChild(createBranchLabel(shortenText(formatBranchLabel(child.branchCondition), 16), fullBranchLabel, labelX, labelY));
    return group;
}

function formatBranchLabel(condition) {
    if (!condition) return "";
    return condition.operator === "<=" || condition.operator === ">"
        ? condition.operator
        : condition.label;
}

function createTreeNodeGraphic(node, isCurrent) {
    const group = createSvgElement("g", { class: "chosen-node-svg-card" });
    const width = node.isLeaf ? 96 : 118;
    const height = node.isLeaf ? 66 : 78;
    const x = node.x - width / 2;
    const y = node.y - height / 2;
    const boxClass = node.isLeaf
        ? `chosen-node-svg-leaf-box ${["pure", "pruned"].includes(node.stopReason) ? "chosen-node-svg-leaf-defined" : "chosen-node-svg-leaf-pending"}`
        : "chosen-node-svg-shell";

    const fullTitle = node.isLeaf
        ? `Hoja ${node.id}`
        : (node.attributeType === "numeric" ? `${node.attribute} <= ${formatNumber(node.threshold)}` : node.attribute);
    const displayedTitle = node.isLeaf
        ? fullTitle
        : (node.attributeType === "numeric" ? `${formatAttributeLabel(node.attribute)} <= ${formatNumber(node.threshold)}` : formatAttributeLabel(node.attribute));

    appendSvgTitle(group, fullTitle);

    group.appendChild(createSvgElement("rect", {
        x,
        y,
        width,
        height,
        rx: "8",
        class: `${boxClass} ${isCurrent ? "c45-current-node" : ""}`
    }));

    if (!node.isLeaf) {
        group.appendChild(createSvgElement("rect", {
            x,
            y,
            width,
            height: 22,
            rx: "8",
            class: "chosen-node-svg-header"
        }));
    }

    const title = createSvgText(shortenText(displayedTitle, 15), node.x, y + 16, ["chosen-node-svg-title"], "middle", fullTitle);
    group.appendChild(title);
    if (node.isLeaf) {
        group.appendChild(createSvgText(`N = ${node.n}`, x + 8, y + 33, ["chosen-node-svg-text"]));
        group.appendChild(createSvgText(`E = ${formatNumber(node.entropy)}`, x + 8, y + 49, ["chosen-node-svg-text"]));
        group.appendChild(createSvgText(`Clase: ${node.predictedLabel}`, x + 8, y + 63, ["chosen-node-svg-text"]));
    } else {
        group.appendChild(createSvgText(`N = ${node.n}`, x + 9, y + 34, ["chosen-node-svg-text"]));
        group.appendChild(createSvgText(`E = ${formatNumber(node.entropy)}`, x + 9, y + 50, ["chosen-node-svg-text"]));
        group.appendChild(createSvgText(`GR = ${formatNumber(node.gainRatio)}`, x + 9, y + 64, ["chosen-node-svg-text"]));
        group.appendChild(createSvgText(`Nodo ${node.id}`, x + 9, y + 76, ["chosen-node-svg-text"]));
    }

    return group;
}

function createBranchLabel(text, fullText, x, y) {
    const group = createSvgElement("g");
    const paddingX = 8;
    const estimatedTextWidth = Math.max(18, text.length * 7);
    const width = estimatedTextWidth + paddingX * 2;
    appendSvgTitle(group, fullText);
    group.appendChild(createSvgElement("rect", {
        x: x - width / 2,
        y: y - 14,
        width,
        height: 20,
        rx: 6,
        class: "chosen-node-svg-label-bg"
    }));
    group.appendChild(createSvgText(text, x, y, ["chosen-node-svg-branch-condition"], "middle", fullText));
    return group;
}

function createSvgText(text, x, y, classes = ["chosen-node-svg-text"], anchor = "start", titleText = "") {
    const element = createSvgElement("text", {
        x,
        y,
        class: classes.join(" "),
        "text-anchor": anchor
    });
    if (titleText && titleText !== text) appendSvgTitle(element, titleText);
    element.appendChild(document.createTextNode(text));
    return element;
}

function appendSvgTitle(element, text) {
    if (!text) return;
    const title = createSvgElement("title");
    title.textContent = text;
    element.appendChild(title);
}

function createSvgElement(name, attributes = {}) {
    const element = document.createElementNS("http://www.w3.org/2000/svg", name);
    Object.entries(attributes).forEach(([attribute, value]) => {
        element.setAttribute(attribute, value);
    });
    return element;
}

function shortenText(text, maxLength) {
    return text.length > maxLength ? `${text.slice(0, maxLength - 1)}...` : text;
}

function formatAttributeLabel(attribute) {
    const normalized = String(attribute).trim();
    if (normalized.length <= 6) return normalized;

    const words = normalized
        .split(/[\s_-]+/)
        .map(word => word.replace(/[^\p{L}\p{N}]/gu, ""))
        .filter(Boolean)
        .filter(word => !["de", "del", "la", "las", "el", "los"].includes(word.toLocaleLowerCase("es")));

    if (words.length >= 2) {
        return `${words[0].slice(0, 3)}_${words[words.length - 1].slice(0, 2)}`;
    }

    return normalized.slice(0, 6);
}

function clearElement(element) {
    while (element.firstChild) {
        element.removeChild(element.firstChild);
    }
}
