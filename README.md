# Flight Routes App

Academic and technical application to explore airline routes between airports using graph algorithms.

This repository contains two implementations of the project:

- **New version**: modern frontend built with React + TypeScript + Vite.
- **Legacy version (`old_version`)**: web application built with Flask + Python.

## Production Demo

- New version (React): https://flight-routes-app-puce.vercel.app/
- Legacy version (Flask): https://felipe03.pythonanywhere.com/

## Project Overview

The system allows users to select origin and destination airports, run route-finding algorithms, and visualize the computed result.

### Goals

- Compare algorithmic approaches over an airline route graph.
- Visualize results in a clear and accessible way.
- Show the architectural evolution from an initial monolithic version to a modern modular version.

## Repository Structure

```text
Flight_Routes_App/
|-- flight-app/      # New version (React + TypeScript)
|-- old_version/     # Legacy implementation (Flask + Python)
`-- README.md
```

## New Version: `flight-app`

### Tech stack

- React 19 + TypeScript
- Vite
- Tailwind CSS 4
- Zustand (global state)
- TanStack React Query (remote data)
- Vitest + Testing Library (tests)

### Main features

- Origin and destination selection with validations.
- Route computation using:
  - Dijkstra
  - DFS
  - Prim (MST frontier-derived path)
- 3D globe visualization with node and arc overlays.
- Accessible route summary output.

### Run locally

Requirements:

- Node.js 20+ (recommended)
- npm

Steps:

```bash
cd flight-app
npm install
npm run dev
```

Useful scripts:

```bash
npm run test       # watch mode
npm run test:run   # single run
npm run typecheck
npm run lint
npm run build
```

## Legacy Version: `old_version`

### Tech stack

- Python 3.11
- Flask
- Pandas / NumPy
- Gunicorn (deployment)

### Features

- Airport selection form.
- Route computation in the Python backend.
- Server-side rendering using HTML templates (`templates/`).

### Run locally

Requirements:

- Python 3.11
- pip

Steps:

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

## Key Differences Between Versions

| Aspect | New version (`flight-app`) | Legacy version (`old_version`) |
|---|---|---|
| Architecture | Modular SPA frontend | Monolithic backend with server-side rendering |
| UI/UX | Interactive, component-driven | Traditional HTML/CSS/JS templates |
| State and data | Zustand + React Query | Direct handling in Flask |
| Testing | Vitest + Testing Library | No formal test suite |
| Deployment | Vercel | PythonAnywhere |

## Academic Purpose

This repository demonstrates the evolution of an **applied algorithmic complexity** solution: from an initial functional Flask implementation to a modern, typed, and testable React architecture.

## Author

Developed by **Luis Felipe Poma**.