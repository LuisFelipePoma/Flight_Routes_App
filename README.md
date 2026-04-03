# Flight Routes App

Aplicación académica y técnica para explorar rutas aéreas entre aeropuertos usando algoritmos de grafos.

Este repositorio contiene dos implementaciones del proyecto:

- **Nueva versión**: frontend moderno en React + TypeScript + Vite.
- **Versión antigua (`old_version`)**: aplicación web en Flask + Python.

## Demo en Producción

- Nueva versión (React): https://flight-routes-app-puce.vercel.app/
- Versión antigua (Flask): https://felipe03.pythonanywhere.com/

## Resumen del Proyecto

El sistema permite seleccionar aeropuerto de origen y destino, ejecutar algoritmos de búsqueda/trazado de rutas y visualizar el resultado.

### Objetivos

- Comparar aproximaciones algorítmicas sobre un grafo de rutas aéreas.
- Visualizar resultados de forma clara y accesible.
- Mostrar evolución arquitectónica entre una versión monolítica inicial y una versión moderna modular.

## Estructura del Repositorio

```text
Flight_Routes_App/
|-- flight-app/      # Nueva versión (React + TypeScript)
|-- old_version/     # Implementación legacy (Flask + Python)
`-- README.md
```

## Nueva Versión: `flight-app`

### Stack técnico

- React 19 + TypeScript
- Vite
- Tailwind CSS 4
- Zustand (estado global)
- TanStack React Query (datos remotos)
- Vitest + Testing Library (tests)

### Funcionalidades principales

- Selección de origen y destino con validaciones.
- Cálculo de rutas usando:
  - Dijkstra
  - DFS
  - Prim (ruta derivada de frontera MST)
- Visualización en globo 3D con overlays de nodos y arcos.
- Resumen accesible de resultados de ruta.

### Ejecutar localmente

Requisitos:

- Node.js 20+ (recomendado)
- npm

Pasos:

```bash
cd flight-app
npm install
npm run dev
```

Scripts útiles:

```bash
npm run test       # modo watch
npm run test:run   # corrida única
npm run typecheck
npm run lint
npm run build
```

## Versión Antigua: `old_version`

### Stack técnico

- Python 3.11
- Flask
- Pandas / NumPy
- Gunicorn (despliegue)

### Funcionalidades

- Formulario de selección de aeropuertos.
- Cálculo de ruta desde backend Python.
- Render server-side con plantillas HTML (`templates/`).

### Ejecutar localmente

Requisitos:

- Python 3.11
- pip

Pasos:

```bash
cd old_version
python -m venv .venv
# Windows
.venv\Scripts\activate
# macOS/Linux
# source .venv/bin/activate
pip install -r requirements.txt
python app.py
```

## Diferencias Clave Entre Versiones

| Aspecto | Nueva versión (`flight-app`) | Antigua (`old_version`) |
|---|---|---|
| Arquitectura | Frontend SPA modular | Backend monolítico con render de servidor |
| UI/UX | Interactiva, componente-driven | Plantillas HTML/CSS/JS tradicionales |
| Estado y datos | Zustand + React Query | Manejo directo en Flask |
| Testing | Vitest + Testing Library | Sin suite formal de tests |
| Despliegue | Vercel | PythonAnywhere |

## Propósito Académico

Este repositorio evidencia la evolución de una solución de **complejidad algorítmica aplicada**: desde una implementación inicial funcional en Flask hasta una arquitectura moderna, tipada y testeable en React.

## Autor

Desarrollado por **Luis Felipe Poma**.