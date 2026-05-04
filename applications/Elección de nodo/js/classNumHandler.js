const datasetTableId = 'table-dataset';
const idColumnIndex = 0;
const pendingRowClass = 'pending-dataset-row';

function getNextId(tBodyRef) {
    if (tBodyRef.rows.length === 0) {
        return 1;
    }

    var lastRow = tBodyRef.rows[tBodyRef.rows.length - 1];
    return Number(lastRow.cells[idColumnIndex].textContent) + 1;
}

function createNumberInput(placeholder) {
    var input = document.createElement('input');
    input.type = 'number';
    input.min = '0';
    input.step = '1';
    input.placeholder = placeholder;
    input.classList.add('form-control');
    return input;
}

function createApprovalSelect() {
    var select = document.createElement('select');
    select.classList.add('form-select');

    var emptyOption = document.createElement('option');
    emptyOption.value = '';
    emptyOption.textContent = 'Selecciona';
    select.appendChild(emptyOption);

    var yesOption = document.createElement('option');
    yesOption.value = 'Si';
    yesOption.textContent = 'Si';
    select.appendChild(yesOption);

    var noOption = document.createElement('option');
    noOption.value = 'No';
    noOption.textContent = 'No';
    select.appendChild(noOption);

    return select;
}

function createDeleteButton(row) {
    var button = document.createElement('button');
    button.type = 'button';
    button.classList.add('btn', 'btn-outline-danger', 'btn-sm');
    button.setAttribute('aria-label', 'Eliminar fila');
    button.innerHTML = '<i class="bi bi-trash-fill"></i>';

    button.addEventListener('click', function () {
        row.remove();
    });

    return button;
}

function createValueWithDelete(row, value) {
    var wrapper = document.createElement('div');
    var text = document.createElement('span');

    wrapper.classList.add('d-flex', 'align-items-center', 'justify-content-center', 'gap-2');
    text.textContent = value;
    wrapper.appendChild(text);
    wrapper.appendChild(createDeleteButton(row));

    return wrapper;
}

function enableRowDeleteButtons() {
    var table = document.getElementById(datasetTableId);
    var tBodyRef = table.getElementsByTagName('tbody')[0];

    for (var row of tBodyRef.rows) {
        var approvalCell = row.cells[3];

        if (approvalCell.querySelector('button')) {
            continue;
        }

        var approvalValue = approvalCell.textContent.trim();
        approvalCell.textContent = '';
        approvalCell.appendChild(createValueWithDelete(row, approvalValue));
    }
}

function createConfirmButton(row, inputs, select) {
    var button = document.createElement('button');
    button.type = 'button';
    button.classList.add('btn', 'btn-primary');
    button.textContent = 'Añadir';

    button.addEventListener('click', function () {
        var studyHours = inputs.studyHours.value;
        var mockExam = inputs.mockExam.value;
        var approval = select.value;

        if (studyHours === '' || mockExam === '' || approval === '' || mockExam >= 10) {
            inputs.studyHours.classList.toggle('is-invalid', studyHours === '');
            inputs.mockExam.classList.toggle('is-invalid', mockExam === '' || mockExam >= 10);
            select.classList.toggle('is-invalid', approval === '');
            return;
        }

        row.classList.remove(pendingRowClass);
        row.cells[1].textContent = studyHours;
        row.cells[2].textContent = mockExam;
        row.cells[3].textContent = '';
        row.cells[3].appendChild(createValueWithDelete(row, approval));
    });

    return button;
}

function addDatasetRow() {
    var table = document.getElementById(datasetTableId);
    var tBodyRef = table.getElementsByTagName('tbody')[0];
    var pendingRow = tBodyRef.querySelector('.' + pendingRowClass);

    if (pendingRow) {
        pendingRow.scrollIntoView({ behavior: 'smooth', block: 'center' });
        return;
    }

    var nextId = getNextId(tBodyRef);
    var newRow = tBodyRef.insertRow();
    var idCell = newRow.insertCell();
    var studyHoursCell = newRow.insertCell();
    var mockExamCell = newRow.insertCell();
    var approvalCell = newRow.insertCell();
    var studyHoursInput = createNumberInput('Horas');
    var mockExamInput = createNumberInput('Nota');
    var approvalSelect = createApprovalSelect();
    var approvalGroup = document.createElement('div');

    newRow.classList.add(pendingRowClass);
    idCell.textContent = nextId;
    studyHoursCell.appendChild(studyHoursInput);
    mockExamCell.appendChild(mockExamInput);

    approvalGroup.classList.add('input-group');
    approvalGroup.appendChild(approvalSelect);
    approvalGroup.appendChild(createConfirmButton(newRow, {
        studyHours: studyHoursInput,
        mockExam: mockExamInput
    }, approvalSelect));
    approvalCell.appendChild(approvalGroup);
}

export { addDatasetRow };
export { addDatasetRow as addClass };
export { enableRowDeleteButtons };
export default addDatasetRow;
