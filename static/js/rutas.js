//<----------------------------------------------------------   Variables globales -------------------------------------------------------------------->//

// Variables para manera la liberia D3.js
const { json, select, selectAll, geoOrthographic, geoPath,
    geoGraticule, csv, geoMercator, set, easeElastic,
    transition, forceSimulation, forceLink, forceManyBody,
    forceCenter } = d3;

// Variables para las medidas del navegador y del div donde estara el mapa
const width = document.querySelector("#mapa").clientWidth;
const height = document.querySelector("#mapa").clientHeight - 10;
const globeSize = {
    w: width * 0.90,
    h: height * 0.90,
}
// Variables necesarias para graficar en el svg el mapa
let globe, projection, path, graticule, nodes;


// Varibales para las rutas y aeropuertos
let aristas;
let airports;

// Variables para guardar los dataSets
let geojson, airportjson, routesjson;

// Variables pára crear elementos en el HTML
let infoPanel;

// Variables para las animaciones

let isMouseDown = false, rotation = { x: 0, y: 0 };

// Variables para guardar los links de las datasets
const worldURL = 'https://raw.githubusercontent.com/LuisFelipePoma/D3-graph-gallery/master/DATA/world.geojson';
const airportsURL = 'https://raw.githubusercontent.com/LuisFelipePoma/TF-Data/main/datasets/V3/airports.json';
const routesURL = 'https://raw.githubusercontent.com/LuisFelipePoma/TF-Data/main/datasets/V3/routes.json';

// <------------------------------------------------------------------- Verificacion de la lectura de los datos ------------------------------------>//


var promises = [json(worldURL), json(airportsURL), json(routesURL)]
myDataPromises = Promise.all(promises)
myDataPromises.then(function (data) {
    init(data[0], data[1], data[2]);
})
myDataPromises.catch(function () {
    console.log('Something has gone wrong. No load Data.')
})


// <---------------------------------------------------------------- Funcion Init ---------------------------------------------------------------->//

const init = (worlds, airports, routes) => {
    geojson = worlds
    airportjson = airports
    routesjson = routes
    drawGlobe();
    getDataPath()
    drawRoutes();
    drawNodes();
    drawGraticule()
    renderInfo();
    createHoverEffect()
    createDraggingEvents()
}
// <------------------------------------------------------------------ Funciones ------------------------------------------------------------------>//

// ----------> Funcion que genera las projecciones y svg para el mapa -- es invocado en init (main) 
const drawGlobe = () => {
    // Se hace uso de las variables globales previamente creadas

    // Se asigna las medidas del mapa y crea el svg
    globe = select('#mapa')
        .append('svg')
        .attr('width', width)
        .attr('height', height)

    // Se asigna a la projeccion las medidas acordes al div del cual pertenece
    projection = geoOrthographic()
        .fitSize([globeSize.w, globeSize.h], geojson)
        .translate([height - width / 2, height / 2])

    // Se asigna al path la projeccion
    path = geoPath().projection(projection)

    // Se asignan la data del geojson y las clases para las animaciones
    globe
        .selectAll('path')
        .data(geojson.features)
        .enter().append('path')
        .attr('d', path)
        .attr('id', (e) => { return e.id })
        .attr('class', 'country noSelected selected howerOff howerPass')
        .classed('selected', false).classed('howerPass', false)

};

// ----------> Funcion que genera la reticula del mapa -- es invocado en init (main) 
const drawGraticule = () => {
    // A la variable global se le asigna d3.geoGraticule
    graticule = geoGraticule()

    // Se le inserta el path, la clase para los ajustes y la data mediante el atributo 'd' 
    globe
        .append('path')
        .attr('class', 'graticule')
        .attr('d', path(graticule()))
};

// ----------> Funcion que genera los areopuertos(nodos) -- es invocado en init (main)
const drawNodes = () => {
    nodes = globe.selectAll('g')
        .data(airports)
        .join('g')
        .append('g')
        .attr('class', (e) => { return `${e.country_code} airport` })
        .attr('transform', ({ lon, lat }) => `translate(${projection([lon, lat]).join(",")})`)
        .append("circle")
        .attr('r', 10)
}
// ----------> Funcion que obtiene la data de la API y la convierte en informacion
const getDataPath = () => {
    [aristas, airports] = getJsonRoutesNodes()
    console.log(aristas)
    console.log(airports)
}

// ----------> Funcion que genera las rutas de los aeropuertos(aristas) -- es invocado en init (main)
const drawRoutes = () => {
    //Se asignan los valores determinados y clases
    globe.selectAll("myPath")
        .data(aristas)
        .enter()
        .append("path")
        .attr("class", "rutas")
        .attr("d", function (d) { return path(d) })
}

// ----------> Funcion que genera las rutas de los aeropuertos(aristas) -- es invocado en init (main)
function getJsonRoutesNodes() {
    let caminosElement = document.querySelector("#rutas").textContent;
    let aristasString = JSON.parse(caminosElement);
    let aristas = aristasString["bestpaths"]
    let aeropuertos = airportjson;
    let rutas = [];
    aristas = aristas.reverse();
    for (let i = 0; i < aristas.length; ++i) {
        let x = parseInt(aristas[i]);
        let node = aeropuertos[x];
        rutas.push(node);
    }
    let conexiones = []
    for (let i = 1; i < aristas.length; ++i) {
        let elemen = { type: "LineString", coordinates: [[+rutas[i - 1].lon, +rutas[i - 1].lat], [+rutas[i].lon, +rutas[i].lat]] }
        conexiones.push(elemen)
    }
    return [conexiones, rutas]
}

// ----------> Funcion que se le asigna los objetos a las respectivas variables globales que se usara el otra funciones -- es invocado en init (main)
const renderInfo = () => {
    infoPanel = select('#info') // "infoPanel" -- mostrara el pais que esta seleccionando
};

// ----------> Funcion que crea la animacion de cuando se pasa el mouse por el mapa -- es invocado en init (main)
const createHoverEffect = () => {

    globe
        .selectAll('.country')
        .on('mouseover', function (e, d) {
            const { name } = d.properties
            infoPanel.html(`<h2>${name}</h2><hr>`)
            globe.selectAll('.country').classed('howerPass', false).classed('howerOff', true)
            select(this).classed('howerOff', false).classed("howerPass", true);
        })
        .on("mouseout", function (e, d) {
            globe.selectAll('.country').classed("howerPass", false).classed('howerOff', true)
        });
};

// ----------> Funcion que permite rotar el mapa -- es invocado en init (main)
const createDraggingEvents = () => {

    globe
        .on('mousedown', () => isMouseDown = true)
        .on('mouseup', () => isMouseDown = false)
        .on('mousemove', e => {

            if (isMouseDown) {
                const { movementX, movementY } = e

                rotation.x += movementX / 2
                rotation.y -= movementY / 2

                projection.rotate([rotation.x, rotation.y])
                selectAll('.country').attr('d', path)
                selectAll('.graticule').attr('d', path(graticule()))
                selectAll('.rutas').attr("d", function (d) { return path(d) })
                selectAll('.airport').attr('transform', ({ lon, lat }) => `translate(${projection([lon, lat]).join(",")})`)
            }
        })
};
