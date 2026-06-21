import assert from "node:assert/strict";
import test from "node:test";

import {
    buildC45FromRows,
    entropy,
    gainRatio,
    isNumericValue,
    splitInformation,
    validateC45Rows
} from "../applications/Arbol C4.5/js/c45.mjs";

test("entropy returns 0 for pure labels and 1 for a balanced binary split", () => {
    assert.equal(entropy(["Yes", "Yes", "Yes"]), 0);
    assert.equal(entropy(["Yes", "No"]), 1);
});

test("split information and gain ratio are calculated from group proportions", () => {
    const groups = [{ rows: [1, 2] }, { rows: [3, 4] }];
    const splitInfo = splitInformation(groups, 4);
    assert.equal(splitInfo, 1);
    assert.equal(gainRatio(1, 0.5, splitInfo), 0.5);
});

test("numeric values accept point and comma decimal separators", () => {
    assert.equal(isNumericValue("12.5"), true);
    assert.equal(isNumericValue("12,5"), true);
    assert.equal(isNumericValue("alto"), false);
});

test("validation accepts any pair of class labels and rejects more than two classes", () => {
    const valid = [
        ["Edad", "Resultado"],
        ["18", "Aprobado"],
        ["21", "Suspenso"]
    ];
    const invalid = [
        ["Edad", "Resultado"],
        ["18", "A"],
        ["21", "B"],
        ["22", "C"]
    ];
    assert.equal(validateC45Rows(valid).isValid, true);
    assert.equal(validateC45Rows(invalid).isValid, false);
});

test("numeric thresholds are generated only where consecutive class labels change", () => {
    const rows = [
        ["Horas", "Clase"],
        ["1", "No"],
        ["2", "No"],
        ["3", "Si"],
        ["4", "Si"]
    ];
    const model = buildC45FromRows(rows);
    const root = model.root;
    assert.equal(root.attribute, "Horas");
    assert.equal(root.attributeType, "numeric");
    assert.equal(root.threshold, 2.5);
});

test("categorical attributes are removed after being selected", () => {
    const rows = [
        ["Color", "Tamano", "Clase"],
        ["Rojo", "Grande", "Si"],
        ["Rojo", "Pequeno", "Si"],
        ["Azul", "Grande", "No"],
        ["Azul", "Pequeno", "No"]
    ];
    const model = buildC45FromRows(rows);
    assert.equal(model.root.attribute, "Color");
    assert.equal(model.root.children.every(child => child.isLeaf), true);
});

test("mixed numeric categorical and boolean datasets build without pruning", () => {
    const rows = [
        ["Edad", "Interes", "AceptaEmail", "Compra"],
        ["20", "Alto", "true", "Si"],
        ["22", "Alto", "false", "Si"],
        ["45", "Bajo", "true", "No"],
        ["48", "Bajo", "false", "No"],
        ["35", "Medio", "true", "Si"],
        ["50", "Medio", "false", "No"]
    ];
    const model = buildC45FromRows(rows);
    assert.equal(model.steps.length > 1, true);
    assert.equal(model.root.isLeaf, false);
});

test("pure datasets create a leaf", () => {
    const rows = [
        ["Edad", "Clase"],
        ["18", "Si"],
        ["19", "Si"]
    ];
    const model = buildC45FromRows(rows);
    assert.equal(model.root.isLeaf, true);
    assert.equal(model.root.predictedLabel, "Si");
});
