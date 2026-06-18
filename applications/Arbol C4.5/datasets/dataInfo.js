const dataInfo = {
    "Leads inmobiliaria": "Dataset orientado a la prediccion de cierre de venta en leads inmobiliarios. Combina atributos continuos, como presupuesto, visitas a la vivienda, dias desde el contacto y edad del cliente, con atributos categoricos o booleanos, como tipo de vivienda, zona, hipoteca preaprobada y contacto rapido. La clase objetivo indica si se produce el cierre de venta.",
    "Mantenimiento": "Dataset orientado a la prediccion de fallo proximo en maquinas. Incluye variables numericas, como horas de uso, temperatura, vibracion y revisiones anuales, junto con variables categoricas o booleanas, como tipo de maquina, turno, alarma reciente y lubricacion correcta. La clase objetivo indica si se espera un fallo proximo.",
    "Conversion web": "Dataset orientado a la prediccion de compra en una web. Incluye atributos de comportamiento, como visitas mensuales, tiempo de sesion, paginas vistas y edad de la cuenta, junto con variables categoricas o booleanas, como dispositivo, origen del trafico, carrito activo y uso de cupon. La clase objetivo indica si se produce la compra.",
    "Prestamos": "Dataset orientado a la decision de concesion de prestamos. Combina variables numericas, como edad, ingresos mensuales, antiguedad laboral y deuda actual, con variables categoricas o booleanas, como historial de credito, tipo de contrato, aval y vivienda propia. La clase objetivo indica si se concede el prestamo.",
    "Estudiantes": "Dataset orientado a la prediccion de aprobados. Incluye atributos numericos, como horas de estudio, faltas, nota media y tutorias semanales, junto con variables categoricas o booleanas, como participacion, tipo de estudio, entrega completa y acceso a la plataforma. La clase objetivo indica si el estudiante aprueba."
};

const dataLinks = {
    "Leads inmobiliaria": "https://www.kaggle.com/datasets/mga1010/dataset-leads-inmobiliariac45",
    "Mantenimiento": "https://www.kaggle.com/datasets/mga1010/dataset-mantenimientoc45",
    "Conversion web": "https://www.kaggle.com/datasets/mga1010/dataset-conversionwebc45",
    "Prestamos": "https://www.kaggle.com/datasets/mga1010/dataset-prestamosc45",
    "Estudiantes": "https://www.kaggle.com/datasets/mga1010/dataset-estudiantesc45"
};

function getDataInfo(datasetName) {
    return dataInfo[datasetName];
}

function getDataLink(datasetName) {
    return dataLinks[datasetName];
}

export { getDataInfo, getDataLink };
export default getDataInfo;
