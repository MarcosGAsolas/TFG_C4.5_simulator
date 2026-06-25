const dataInfo = {
    "Leads inmobiliaria": "Dataset orientado a la predicción de cierre de venta en leads inmobiliarios. Combina atributos continuos, como presupuesto, visitas a la vivienda, días desde el contacto y edad del cliente, con atributos categóricos o booleanos, como tipo de vivienda, zona, hipoteca preaprobada y contacto rápido. La clase objetivo indica si se produce el cierre de venta.",
    "Mantenimiento": "Dataset orientado a la predicción de fallo próximo en máquinas. Incluye variables numéricas, como horas de uso, temperatura, vibración y revisiones anuales, junto con variables categóricas o booleanas, como tipo de máquina, turno, alarma reciente y lubricación correcta. La clase objetivo indica si se espera un fallo próximo.",
    "Conversión web": "Dataset orientado a la predicción de compra en una web. Incluye atributos de comportamiento, como visitas mensuales, tiempo de sesión, páginas vistas y edad de la cuenta, junto con variables categóricas o booleanas, como dispositivo, origen del tráfico, carrito activo y uso de cupón. La clase objetivo indica si se produce la compra.",
    "Préstamos": "Dataset orientado a la decisión de concesión de préstamos. Combina variables numéricas, como edad, ingresos mensuales, antigüedad laboral y deuda actual, con variables categóricas o booleanas, como historial de crédito, tipo de contrato, aval y vivienda propia. La clase objetivo indica si se concede el préstamo.",
    "Estudiantes": "Dataset orientado a la predicción de aprobados. Incluye atributos numéricos, como horas de estudio, faltas, nota media y tutorías semanales, junto con variables categóricas o booleanas, como participación, tipo de estudio, entrega completa y acceso a la plataforma. La clase objetivo indica si el estudiante aprueba."
};

const dataLinks = {
    "Leads inmobiliaria": "https://www.kaggle.com/datasets/mga1010/dataset-leads-inmobiliariac45",
    "Mantenimiento": "https://www.kaggle.com/datasets/mga1010/dataset-mantenimientoc45",
    "Conversión web": "https://www.kaggle.com/datasets/mga1010/dataset-conversionwebc45",
    "Préstamos": "https://www.kaggle.com/datasets/mga1010/dataset-prestamosc45",
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
