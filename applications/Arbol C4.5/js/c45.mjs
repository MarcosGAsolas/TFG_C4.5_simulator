const EPSILON = 1e-12;

/**
 * Build a C4.5 decision tree without pruning from CSV rows.
 * @param {string[][]} rows Header row plus data rows.
 * @returns {{root: object, steps: object[], headers: string[], classLabels: string[]}}
 */
export function buildC45FromRows(rows) {
    const headers = rows[0];
    const classIndex = headers.length - 1;
    const data = rows.slice(1).map((values, index) => ({ values, index }));
    const classLabels = [...new Set(data.map(row => row.values[classIndex]))];
    const attributeTypes = inferAttributeTypes(data, classIndex);
    const attributes = headers.slice(0, -1).map((name, index) => ({
        name,
        index,
        type: attributeTypes[index]
    }));

    let nextNodeId = 1;
    const root = buildNode({
        rows: data,
        parent: null,
        branchCondition: null,
        depth: 0,
        attributes,
        headers,
        classIndex,
        classLabels,
        getNextId: () => nextNodeId++
    });

    assignTreePositions(root);
    const steps = collectSteps(root);

    return { root, steps, headers, classLabels };
}

/**
 * Validate C4.5 CSV rows according to the simulator requirements.
 * @param {string[][]} rows Header row plus data rows.
 * @returns {{isValid: boolean, messages: string[]}}
 */
export function validateC45Rows(rows) {
    const messages = [];
    if (!rows || rows.length < 2) {
        return {
            isValid: false,
            messages: ["El CSV debe contener una cabecera y al menos una fila de datos."]
        };
    }

    const header = rows[0];
    const dataRows = rows.slice(1);
    if (header.some(column => column === "")) {
        messages.push("La cabecera no puede contener columnas vacías.");
    }
    if (dataRows.length > 150) {
        messages.push("El dataset no puede tener más de 150 filas de datos.");
    }
    if (header.length > 25) {
        messages.push("El dataset no puede tener más de 25 columnas.");
    }

    const expectedLength = header.length;
    dataRows.forEach((row, index) => {
        if (row.length !== expectedLength) {
            messages.push(`La fila ${index + 2} no tiene el mismo número de columnas que la cabecera.`);
        }
        if (row.some(value => value === "")) {
            messages.push(`La fila ${index + 2} contiene valores vacíos.`);
        }
    });

    const validRows = dataRows.filter(row => row.length === expectedLength && row.every(value => value !== ""));
    const classValues = new Set(validRows.map(row => row[expectedLength - 1]));
    if (classValues.size !== 2) {
        messages.push("La última columna debe contener exactamente dos valores de clase distintos.");
    }

    return {
        isValid: messages.length === 0,
        messages
    };
}

export function parseNumericValue(value) {
    const normalized = String(value).trim().replace(",", ".");
    if (normalized === "") return NaN;
    return Number(normalized);
}

export function isNumericValue(value) {
    return Number.isFinite(parseNumericValue(value));
}

export function entropy(labels) {
    if (labels.length === 0) return 0;
    const counts = countLabels(labels);
    return Object.values(counts).reduce((sum, count) => {
        const p = count / labels.length;
        return p === 0 ? sum : sum - p * Math.log2(p);
    }, 0);
}

export function splitInformation(groups, total) {
    return groups.reduce((sum, group) => {
        if (group.rows.length === 0) return sum;
        const p = group.rows.length / total;
        return sum - p * Math.log2(p);
    }, 0);
}

export function gainRatio(baseEntropy, conditionalEntropy, splitInfo) {
    if (splitInfo <= EPSILON) return 0;
    return (baseEntropy - conditionalEntropy) / splitInfo;
}

function buildNode(context) {
    const { rows, parent, branchCondition, depth, attributes, headers, classIndex, classLabels, getNextId } = context;
    const id = getNextId();
    const labels = rows.map(row => row.values[classIndex]);
    const counts = countLabels(labels, classLabels);
    const nodeEntropy = entropy(labels);
    const majority = majorityLabel(counts);
    const base = createBaseNode({ id, rows, parent, branchCondition, depth, counts, nodeEntropy, majority });

    if (rows.length === 0 || Object.values(counts).filter(Boolean).length <= 1) {
        return {
            ...base,
            isLeaf: true,
            stopReason: rows.length === 0 ? "empty" : "pure"
        };
    }

    const evaluation = evaluateAttributes(rows, attributes, classIndex, classLabels, nodeEntropy);
    const selected = evaluation.find(item => item.selected);
    if (!selected || selected.gainRatio <= EPSILON) {
        return {
            ...base,
            isLeaf: true,
            stopReason: "no-valid-split",
            evaluation
        };
    }

    const node = {
        ...base,
        attribute: selected.attribute,
        attributeIndex: selected.attributeIndex,
        attributeType: selected.type,
        threshold: selected.type === "numeric" ? selected.bestCandidate.threshold : null,
        entropy: nodeEntropy,
        conditionalEntropy: selected.bestCandidate.conditionalEntropy,
        gain: selected.bestCandidate.informationGain,
        splitInfo: selected.bestCandidate.splitInfo,
        gainRatio: selected.bestCandidate.gainRatio,
        evaluation,
        isLeaf: false,
        children: []
    };

    const childAttributes = selected.type === "categorical"
        ? attributes.filter(attribute => attribute.index !== selected.attributeIndex)
        : attributes;

    selected.bestCandidate.groups.forEach(group => {
        if (group.rows.length === rows.length) return;
        const child = buildNode({
            rows: group.rows,
            parent: node,
            branchCondition: {
                attribute: selected.attribute,
                attributeIndex: selected.attributeIndex,
                operator: group.operator,
                value: group.value,
                label: group.label
            },
            depth: depth + 1,
            attributes: childAttributes,
            headers,
            classIndex,
            classLabels,
            getNextId
        });
        node.children.push(child);
    });

    if (node.children.length === 0) {
        return {
            ...base,
            isLeaf: true,
            stopReason: "no-reducing-split",
            evaluation
        };
    }

    return node;
}

function createBaseNode({ id, rows, parent, branchCondition, depth, counts, nodeEntropy, majority }) {
    return {
        id,
        attribute: null,
        attributeType: null,
        threshold: null,
        gain: 0,
        splitInfo: 0,
        gainRatio: 0,
        conditionalEntropy: 0,
        entropy: nodeEntropy,
        n: rows.length,
        classCounts: counts,
        isLeaf: false,
        predictedLabel: majority,
        parent,
        children: [],
        branchCondition,
        dataRowIndexes: rows.map(row => row.index),
        depth,
        x: 0,
        y: 0,
        mod: 0
    };
}

function evaluateAttributes(rows, attributes, classIndex, classLabels, baseEntropy) {
    const evaluations = attributes
        .map((attribute, csvOrder) => {
            const result = attribute.type === "numeric"
                ? evaluateNumericAttribute(rows, attribute, classIndex, classLabels, baseEntropy)
                : evaluateCategoricalAttribute(rows, attribute, classIndex, classLabels, baseEntropy);
            return result ? { ...result, csvOrder } : null;
        })
        .filter(Boolean);

    const selected = [...evaluations].sort(compareEvaluation)[0] || null;
    return evaluations.map(item => ({ ...item, selected: item === selected }));
}

function evaluateCategoricalAttribute(rows, attribute, classIndex, classLabels, baseEntropy) {
    const groupsByValue = new Map();
    rows.forEach(row => {
        const value = row.values[attribute.index];
        if (!groupsByValue.has(value)) groupsByValue.set(value, []);
        groupsByValue.get(value).push(row);
    });

    const groups = Array.from(groupsByValue.entries()).map(([value, groupRows]) => createGroup({
        label: value,
        operator: "=",
        value,
        rows: groupRows,
        classIndex,
        classLabels,
        total: rows.length
    }));

    const candidate = createSplitCandidate({ groups, rows, baseEntropy, threshold: null });
    return {
        type: "categorical",
        attribute: attribute.name,
        attributeIndex: attribute.index,
        candidates: groups.map(group => ({
            kind: "categorical-value",
            value: group.value,
            classCounts: group.classCounts,
            ratio: group.ratio,
            entropy: group.entropy
        })),
        bestCandidate: candidate,
        conditionalEntropy: candidate.conditionalEntropy,
        informationGain: candidate.informationGain,
        splitInfo: candidate.splitInfo,
        gainRatio: candidate.gainRatio
    };
}

function evaluateNumericAttribute(rows, attribute, classIndex, classLabels, baseEntropy) {
    const sortedRows = rows
        .map(row => ({ row, value: parseNumericValue(row.values[attribute.index]), label: row.values[classIndex] }))
        .filter(item => Number.isFinite(item.value))
        .sort((a, b) => a.value - b.value);

    if (sortedRows.length !== rows.length) return null;

    const candidates = [];
    for (let index = 0; index < sortedRows.length - 1; index++) {
        const current = sortedRows[index];
        const next = sortedRows[index + 1];
        if (current.value === next.value || current.label === next.label) continue;

        const threshold = (current.value + next.value) / 2;
        const leftRows = rows.filter(row => parseNumericValue(row.values[attribute.index]) <= threshold);
        const rightRows = rows.filter(row => parseNumericValue(row.values[attribute.index]) > threshold);
        if (leftRows.length === 0 || rightRows.length === 0) continue;

        const groups = [
            createGroup({ label: `<= ${formatNumber(threshold)}`, operator: "<=", value: threshold, rows: leftRows, classIndex, classLabels, total: rows.length }),
            createGroup({ label: `> ${formatNumber(threshold)}`, operator: ">", value: threshold, rows: rightRows, classIndex, classLabels, total: rows.length })
        ];
        candidates.push(createSplitCandidate({ groups, rows, baseEntropy, threshold }));
    }

    if (candidates.length === 0) return null;
    candidates.sort(compareCandidate);
    const bestCandidate = candidates[0];

    return {
        type: "numeric",
        attribute: attribute.name,
        attributeIndex: attribute.index,
        candidates: candidates.map((candidate, index) => ({
            ...candidate,
            selectedForAttribute: index === 0
        })),
        bestCandidate,
        conditionalEntropy: bestCandidate.conditionalEntropy,
        informationGain: bestCandidate.informationGain,
        splitInfo: bestCandidate.splitInfo,
        gainRatio: bestCandidate.gainRatio
    };
}

function createSplitCandidate({ groups, rows, baseEntropy, threshold }) {
    const conditionalEntropy = groups.reduce((sum, group) => sum + group.ratio * group.entropy, 0);
    const informationGain = baseEntropy - conditionalEntropy;
    const splitInfo = splitInformation(groups, rows.length);
    const ratio = gainRatio(baseEntropy, conditionalEntropy, splitInfo);
    return {
        kind: threshold === null ? "categorical-split" : "numeric-threshold",
        threshold,
        groups,
        conditionalEntropy,
        informationGain,
        splitInfo,
        gainRatio: ratio
    };
}

function createGroup({ label, operator, value, rows, classIndex, classLabels, total }) {
    const labels = rows.map(row => row.values[classIndex]);
    return {
        label,
        operator,
        value,
        rows,
        classCounts: countLabels(labels, classLabels),
        ratio: rows.length / total,
        entropy: entropy(labels)
    };
}

function inferAttributeTypes(rows, classIndex) {
    const types = {};
    for (let index = 0; index < classIndex; index++) {
        types[index] = rows.every(row => isNumericValue(row.values[index])) ? "numeric" : "categorical";
    }
    return types;
}

function compareEvaluation(a, b) {
    return compareCandidate(
        { ...a.bestCandidate, csvOrder: a.csvOrder },
        { ...b.bestCandidate, csvOrder: b.csvOrder }
    );
}

function compareCandidate(a, b) {
    const gr = b.gainRatio - a.gainRatio;
    if (Math.abs(gr) > EPSILON) return gr;
    const gain = b.informationGain - a.informationGain;
    if (Math.abs(gain) > EPSILON) return gain;
    if (a.csvOrder !== undefined && b.csvOrder !== undefined && a.csvOrder !== b.csvOrder) {
        return a.csvOrder - b.csvOrder;
    }
    if (a.threshold !== null && b.threshold !== null) return a.threshold - b.threshold;
    return 0;
}

function collectSteps(root) {
    const steps = [];
    walkTree(root, node => {
        node.stepNumber = steps.length + 1;
        steps.push({
            stepNumber: node.stepNumber,
            treeElementId: node.isLeaf ? `leaf-${node.id}` : `node-${node.id}`,
            type: node.isLeaf ? "leaf" : "node",
            node,
            dataRowIndexes: node.dataRowIndexes,
            activeConditions: getActiveConditions(node),
            valueTableData: node.evaluation || null
        });
    });
    return steps;
}

function getActiveConditions(node) {
    const conditions = [];
    let current = node;
    while (current && current.branchCondition) {
        conditions.unshift(current.branchCondition);
        current = current.parent;
    }
    return conditions;
}

function walkTree(node, callback) {
    callback(node);
    node.children.forEach(child => walkTree(child, callback));
}

function assignTreePositions(root) {
    let leafIndex = 0;
    const spacingX = 112;
    const spacingY = 128;
    const minCanvasWidth = 720;

    function assign(node) {
        node.y = 60 + node.depth * spacingY;
        if (node.children.length === 0) {
            node.x = 56 + leafIndex * spacingX;
            leafIndex++;
            return node.x;
        }
        const childXs = node.children.map(assign);
        node.x = (Math.min(...childXs) + Math.max(...childXs)) / 2;
        return node.x;
    }

    assign(root);
    centerCompactTree(root, minCanvasWidth);
}

function centerCompactTree(root, minCanvasWidth) {
    const nodes = [];
    walkTree(root, node => nodes.push(node));

    const minX = Math.min(...nodes.map(node => node.x));
    const maxX = Math.max(...nodes.map(node => node.x));
    const treeWidth = maxX - minX;
    if (treeWidth >= minCanvasWidth) return;

    const shiftX = minCanvasWidth / 2 - root.x;
    nodes.forEach(node => {
        node.x += shiftX;
    });
}

function countLabels(labels, knownLabels = []) {
    const counts = {};
    knownLabels.forEach(label => counts[label] = 0);
    labels.forEach(label => counts[label] = (counts[label] || 0) + 1);
    return counts;
}

function majorityLabel(counts) {
    return Object.entries(counts).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0]?.[0] || "";
}

export function formatNumber(value) {
    return Number.isFinite(value) ? Number(value).toFixed(2) : "0.00";
}
