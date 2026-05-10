const idTablaDataset = 'table-dataset';
const indiceColumnaId = 0;
const claseFilaPendiente = 'pending-dataset-row';

function obtenerSiguienteId(cuerpoTabla) {
    if (cuerpoTabla.rows.length === 0) {
        return 1;
    }

    var ultimaFila = cuerpoTabla.rows[cuerpoTabla.rows.length - 1];
    return Number(ultimaFila.cells[indiceColumnaId].textContent) + 1;
}

function crearInputNumerico(textoGuia) {
    var inputNumerico = document.createElement('input');
    inputNumerico.type = 'number';
    inputNumerico.min = '0';
    inputNumerico.step = '1';
    inputNumerico.placeholder = textoGuia;
    inputNumerico.classList.add('form-control');
    return inputNumerico;
}

function crearSelectAprobado() {
    var selectAprobado = document.createElement('select');
    selectAprobado.classList.add('form-select');

    var opcionVacia = document.createElement('option');
    opcionVacia.value = '';
    opcionVacia.textContent = 'Selecciona';
    selectAprobado.appendChild(opcionVacia);

    var opcionSi = document.createElement('option');
    opcionSi.value = 'Si';
    opcionSi.textContent = 'Si';
    selectAprobado.appendChild(opcionSi);

    var opcionNo = document.createElement('option');
    opcionNo.value = 'No';
    opcionNo.textContent = 'No';
    selectAprobado.appendChild(opcionNo);

    return selectAprobado;
}

function crearBotonEliminar(fila) {
    var boton = document.createElement('button');
    boton.type = 'button';
    boton.classList.add('btn', 'btn-outline-danger', 'btn-sm');
    boton.setAttribute('aria-label', 'Eliminar fila');
    boton.innerHTML = '<i class="bi bi-trash-fill"></i>';

    boton.addEventListener('click', function () {
        fila.remove();
    });

    return boton;
}

function crearValorConEliminar(fila, valor) {
    var contenedor = document.createElement('div');
    var texto = document.createElement('span');

    contenedor.classList.add('d-flex', 'align-items-center', 'justify-content-center', 'gap-2');
    texto.textContent = valor;
    contenedor.appendChild(texto);
    contenedor.appendChild(crearBotonEliminar(fila));

    return contenedor;
}

function activarBotonesEliminarFila() {
    var tabla = document.getElementById(idTablaDataset);
    var cuerpoTabla = tabla.getElementsByTagName('tbody')[0];

    for (var fila of cuerpoTabla.rows) {
        var celdaAprobado = fila.cells[3];

        if (celdaAprobado.querySelector('button')) {
            continue;
        }

        var valorAprobado = celdaAprobado.textContent.trim();
        celdaAprobado.textContent = '';
        celdaAprobado.appendChild(crearValorConEliminar(fila, valorAprobado));
    }
}

function crearBotonConfirmar(fila, inputs, selectAprobado) {
    var boton = document.createElement('button');
    boton.type = 'button';
    boton.classList.add('btn', 'btn-primary');
    boton.textContent = 'Añadir';

    boton.addEventListener('click', function () {
        var horasEstudio = inputs.horasEstudio.value;
        var notaSimulacro = inputs.notaSimulacro.value;
        var aprobado = selectAprobado.value;

        if (horasEstudio === '' || notaSimulacro === '' || aprobado === '' || notaSimulacro >= 10) {
            inputs.horasEstudio.classList.toggle('is-invalid', horasEstudio === '');
            inputs.notaSimulacro.classList.toggle('is-invalid', notaSimulacro === '' || notaSimulacro >= 10);
            selectAprobado.classList.toggle('is-invalid', aprobado === '');
            return;
        }

        fila.classList.remove(claseFilaPendiente);
        fila.cells[1].textContent = horasEstudio;
        fila.cells[2].textContent = notaSimulacro;
        fila.cells[3].textContent = '';
        fila.cells[3].appendChild(crearValorConEliminar(fila, aprobado));
    });

    return boton;
}

function agregarFilaDataset() {
    var tabla = document.getElementById(idTablaDataset);
    var cuerpoTabla = tabla.getElementsByTagName('tbody')[0];
    var filaPendiente = cuerpoTabla.querySelector('.' + claseFilaPendiente);

    if (filaPendiente) {
        filaPendiente.scrollIntoView({ behavior: 'smooth', block: 'center' });
        return;
    }

    var siguienteId = obtenerSiguienteId(cuerpoTabla);
    var nuevaFila = cuerpoTabla.insertRow();
    var celdaId = nuevaFila.insertCell();
    var celdaHorasEstudio = nuevaFila.insertCell();
    var celdaNotaSimulacro = nuevaFila.insertCell();
    var celdaAprobado = nuevaFila.insertCell();
    var inputHorasEstudio = crearInputNumerico('Horas');
    var inputNotaSimulacro = crearInputNumerico('Nota');
    var selectAprobado = crearSelectAprobado();
    var grupoAprobado = document.createElement('div');

    nuevaFila.classList.add(claseFilaPendiente);
    celdaId.textContent = siguienteId;
    celdaHorasEstudio.appendChild(inputHorasEstudio);
    celdaNotaSimulacro.appendChild(inputNotaSimulacro);

    grupoAprobado.classList.add('input-group');
    grupoAprobado.appendChild(selectAprobado);
    grupoAprobado.appendChild(crearBotonConfirmar(nuevaFila, {
        horasEstudio: inputHorasEstudio,
        notaSimulacro: inputNotaSimulacro
    }, selectAprobado));
    celdaAprobado.appendChild(grupoAprobado);
}

export { agregarFilaDataset };
export { activarBotonesEliminarFila };
export default agregarFilaDataset;
