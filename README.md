# Simulador C4.5

Aplicación web educativa para estudiar la construcción de árboles de decisión con el algoritmo C4.5. El proyecto incluye módulos teóricos y simulaciones paso a paso para entender la entropía, la entropía condicional, la elección de nodos, la construcción del árbol y la poda.

## Características

- Explicación interactiva de la entropía y la entropía condicional.
- Simulación del cálculo de umbrales, ganancia de información, Split Info y Gain Ratio.
- Construcción paso a paso de árboles de decisión C4.5.
- Opción para seleccionar nodos usando Gain Ratio, como en C4.5 original, o ganancia de información.
- Visualización SVG del árbol con zoom general, lupa opcional y controles de navegación.
- Simulación de poda del árbol con evaluación paso a paso de subárboles.
- Carga de datasets CSV propios y selección de datasets de ejemplo.
- Validación de formato para archivos CSV.
- Despliegue preparado para GitHub Pages.

## Estructura del Proyecto

```text
.
├── applications/
│   ├── index.html
│   ├── Arbol C4.5/
│   │   ├── index.html
│   │   ├── poda.html
│   │   ├── styles.css
│   │   ├── datasets/
│   │   └── js/
│   │       ├── c45.mjs
│   │       ├── datasetHandler.js
│   │       └── workspacePanels.js
│   ├── Elección de nodo/
│   ├── entropia/
│   ├── entropia condicional/
│   └── lib/
├── tests/
│   └── c45.test.mjs
└── .github/
    └── workflows/
        └── github-actions-deploy.yml
```

## Módulos

### Entropía

Permite calcular y visualizar la entropía de un conjunto de clases. Incluye explicación teórica, fórmula y una calculadora interactiva.

### Entropía Condicional

Muestra cómo se calcula la entropía condicional de un atributo respecto a una clase. Permite añadir categorías y modificar los valores de cada clase.

### Elección de Nodo

Simula el proceso de selección de un atributo como nodo del árbol. Incluye:

- cálculo de umbrales para atributos numéricos;
- ganancia de información;
- Split Info;
- Gain Ratio;
- representación del nodo elegido.

### Árbol C4.5

Construye el árbol completo paso a paso a partir de un dataset. El usuario puede avanzar por los pasos de la simulación y ver:

- el árbol generado hasta el momento;
- los datos usados en cada paso;
- la tabla de cálculos del nodo evaluado;
- el criterio de selección del atributo.

### Poda

Parte del árbol completo y evalúa los subárboles candidatos desde las hojas hacia la raíz. Para cada nodo interno compara:

- el error estimado del subárbol;
- el error estimado de sustituirlo por una hoja con la clase mayoritaria.

Si la hoja simplificada no empeora el error estimado, el subárbol se poda.

## Formato de Datasets CSV

Los datasets deben cumplir estas condiciones:

- Archivo CSV separado por comas.
- La primera fila debe contener los nombres de los atributos.
- La última columna debe ser la clase objetivo.
- La clase objetivo debe tener exactamente dos valores distintos.
- No puede haber celdas vacías.
- Todas las filas deben tener el mismo número de columnas.
- Cada columna debe mantener un formato coherente: numérico, booleano o categórico.
- El dataset no puede superar 150 filas de datos ni 25 columnas.

Ejemplo:

```csv
Edad,Ingresos,AceptaEmail,Compra
25,Alto,true,Si
43,Bajo,false,No
31,Medio,true,Si
```

## Uso Local

No es necesario instalar dependencias para usar la aplicación. Basta con abrir:

```text
applications/index.html
```

También se puede servir el directorio con un servidor local, por ejemplo:

```bash
python -m http.server 8000
```

Después, acceder a:

```text
http://localhost:8000/applications/
```

## Pruebas

El proyecto incluye pruebas para la lógica principal del algoritmo C4.5.

Para ejecutarlas:

```bash
node --test tests/c45.test.mjs
```

## Despliegue

El repositorio incluye un workflow de GitHub Actions para desplegar automáticamente la carpeta `applications` en GitHub Pages cuando se hace push a la rama `main`.

Archivo de despliegue:

```text
.github/workflows/github-actions-deploy.yml
```

## Tecnologías

- HTML
- CSS
- JavaScript
- SVG
- Bootstrap
- MathJax
- D3.js en el módulo de entropía
- Node.js para pruebas

## Autores

- Marcos Guzmán Asolas
- Carlos López Nozal
- Gadea Lucas Pérez
