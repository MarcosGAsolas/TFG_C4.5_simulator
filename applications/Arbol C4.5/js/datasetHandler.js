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
    "Conversion web": "datasets/conversion_web_c45_mixto_booleano_90.csv",
    "Prestamos": "datasets/prestamos_c45_mixto_booleano_150.csv",
    "Estudiantes": "datasets/estudiantes_c45_mixto_booleano_150.csv"
};

let currentDataset = null;
let currentTreeStep = 0;

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
    goToTreeStep(0);
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
        ? formatActiveRulesCaption(activeStep.activeConditions)
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
        th.textContent = header;
        headerRow.appendChild(th);
    });
    thead.appendChild(headerRow);

    const tbody = document.createElement("tbody");
    const activeIndexes = activeStep ? new Set(activeStep.dataRowIndexes) : null;
    const conditionColumns = activeStep ? new Set(activeStep.activeConditions.map(condition => condition.attributeIndex)) : new Set();
    rows.slice(1).forEach((row, rowIndex) => {
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
        tbody.appendChild(tr);
    });

    table.appendChild(thead);
    table.appendChild(tbody);
    tableScroll.appendChild(table);
    datasetPreview.appendChild(tableScroll);

    if (rows.length > 8) {
        const note = document.createElement("p");
        note.classList.add("small", "text-body-secondary", "mt-2", "mb-0");
        note.textContent = `Mostrando ${rows.length - 1} filas. Desplaza la tabla para recorrer el dataset.`;
        datasetPreview.appendChild(note);
    }
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
    message.textContent = "Todavia no hay datos cargados.";
    datasetPreview.appendChild(message);
}

function renderEmptyTreeStep() {
    clearElement(treeStepContainer);
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

function updateTreeStepButtons() {
    const buttons = treeStepButtonsContainer.querySelectorAll("button");
    buttons.forEach(button => button.classList.remove("active-step"));
    const [firstButton, previousButton, nextButton, lastButton] = buttons;
    firstButton.disabled = currentTreeStep === 0;
    previousButton.disabled = currentTreeStep === 0;
    nextButton.disabled = currentTreeStep === currentDataset.model.steps.length - 1;
    lastButton.disabled = currentTreeStep === currentDataset.model.steps.length - 1;
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
    const controls = [
        { label: "|<", title: "Ir al primer paso", action: () => goToTreeStep(0) },
        { label: "<", title: "Ir al paso anterior", action: () => goToTreeStep(currentTreeStep - 1) },
        { label: ">", title: "Ir al paso siguiente", action: () => goToTreeStep(currentTreeStep + 1) },
        { label: ">|", title: "Ir al último paso", action: () => goToTreeStep(currentDataset.model.steps.length - 1) }
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
    evaluation.forEach(attributeData => {
        if (attributeData.type === "numeric") {
            appendNumericRows(tbody, attributeData);
        } else {
            appendCategoricalRows(tbody, attributeData);
        }
    });

    table.appendChild(tbody);
    wrapper.appendChild(table);
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

function appendCategoricalRows(tbody, attributeData) {
    const rows = attributeData.candidates;
    rows.forEach((candidate, index) => {
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

        tbody.appendChild(tr);
    });
}

function appendNumericRows(tbody, attributeData) {
    const totalRows = attributeData.candidates.length * 2;
    attributeData.candidates.forEach((candidate, candidateIndex) => {
        candidate.groups.forEach((group, groupIndex) => {
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

            tbody.appendChild(tr);
        });
    });
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
    clearElement(treeSvgContainer);
    const nodes = [];
    collectVisibleNodes(currentDataset.model.root, maxStepNumber, nodes);
    if (nodes.length === 0) return;

    const maxX = Math.max(...nodes.map(node => node.x)) + 120;
    const maxY = Math.max(...nodes.map(node => node.y)) + 110;
    const svg = createSvgElement("svg", {
        id: "svgDT",
        class: "chosen-node-svg c45-tree-svg",
        viewBox: `0 0 ${Math.max(720, maxX)} ${Math.max(370, maxY)}`,
        role: "img",
        "aria-label": "Árbol de decisión C4.5"
    });

    const defs = createSvgElement("defs");
    const marker = createSvgElement("marker", {
        id: "chosenNodeArrowC45",
        markerWidth: "10",
        markerHeight: "10",
        refX: "8",
        refY: "5",
        orient: "auto",
        markerUnits: "strokeWidth"
    });
    marker.appendChild(createSvgElement("path", {
        d: "M 0 0 L 10 5 L 0 10 z",
        fill: "#1f2933"
    }));
    defs.appendChild(marker);
    svg.appendChild(defs);

    nodes.forEach(node => {
        node.children
            .filter(child => child.stepNumber <= maxStepNumber)
            .forEach(child => {
                svg.appendChild(createTreeBranch(node, child));
            });
    });

    nodes.forEach(node => {
        svg.appendChild(createTreeNodeGraphic(node, node.stepNumber === maxStepNumber));
    });

    const wrapper = document.createElement("div");
    wrapper.classList.add("chosen-node-preview");
    wrapper.appendChild(svg);
    treeSvgContainer.appendChild(wrapper);
}

export function refreshTreeLayout() {
    if (!currentDataset) return;
    renderProgressiveTree(currentDataset.model.steps[currentTreeStep].stepNumber);
}

function collectVisibleNodes(node, maxStepNumber, nodes) {
    if (node.stepNumber > maxStepNumber) return;
    nodes.push(node);
    node.children.forEach(child => collectVisibleNodes(child, maxStepNumber, nodes));
}

function createTreeBranch(parent, child) {
    const group = createSvgElement("g");
    group.appendChild(createSvgElement("line", {
        x1: parent.x,
        y1: parent.y + 45,
        x2: child.x,
        y2: child.y - 35,
        class: "chosen-node-svg-branch-line",
        "marker-end": "url(#chosenNodeArrowC45)"
    }));

    const labelX = (parent.x + child.x) / 2;
    const labelY = (parent.y + child.y) / 2;
    group.appendChild(createBranchLabel(shortenText(child.branchCondition?.label || "", 16), labelX, labelY));
    return group;
}

function createTreeNodeGraphic(node, isCurrent) {
    const group = createSvgElement("g", { class: "chosen-node-svg-card" });
    const width = 150;
    const height = node.isLeaf ? 98 : 120;
    const x = node.x - width / 2;
    const y = node.y - height / 2;
    const boxClass = node.isLeaf
        ? `chosen-node-svg-leaf-box ${node.stopReason === "pure" ? "chosen-node-svg-leaf-defined" : "chosen-node-svg-leaf-pending"}`
        : "chosen-node-svg-shell";

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
            height: 28,
            rx: "8",
            class: "chosen-node-svg-header"
        }));
    }

    const title = node.isLeaf
        ? `Hoja ${node.id}`
        : (node.attributeType === "numeric" ? `${node.attribute} <= ${formatNumber(node.threshold)}` : node.attribute);
    group.appendChild(createSvgText(shortenText(title, 18), node.x, y + 20, ["chosen-node-svg-title"], "middle"));
    group.appendChild(createSvgText(`N = ${node.n}`, x + 12, y + 48, ["chosen-node-svg-text"]));
    group.appendChild(createSvgText(`E = ${formatNumber(node.entropy)}`, x + 12, y + 68, ["chosen-node-svg-text"]));

    if (node.isLeaf) {
        group.appendChild(createSvgText(`Clase: ${node.predictedLabel}`, x + 12, y + 88, ["chosen-node-svg-text"]));
    } else {
        group.appendChild(createSvgText(`GR = ${formatNumber(node.gainRatio)}`, x + 12, y + 88, ["chosen-node-svg-text"]));
        group.appendChild(createSvgText(`Nodo ${node.id}`, x + 12, y + 108, ["chosen-node-svg-text"]));
    }

    return group;
}

function createBranchLabel(text, x, y) {
    const group = createSvgElement("g");
    group.appendChild(createSvgElement("rect", {
        x: x - 54,
        y: y - 18,
        width: 108,
        height: 26,
        rx: 6,
        class: "chosen-node-svg-label-bg"
    }));
    group.appendChild(createSvgText(text, x, y, ["chosen-node-svg-branch-condition"], "middle"));
    return group;
}

function createSvgText(text, x, y, classes = ["chosen-node-svg-text"], anchor = "start") {
    const element = createSvgElement("text", {
        x,
        y,
        class: classes.join(" "),
        "text-anchor": anchor
    });
    element.textContent = text;
    return element;
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

function clearElement(element) {
    while (element.firstChild) {
        element.removeChild(element.firstChild);
    }
}
