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
let globe, projection, path, graticule;

// Varibales para las rutas y aeropuertos
let nodes, links = [];

// Variables para guardar los dataSets
let geojson, airportjson, routesjson, linksjson;

// Variables pára crear elementos en el HTML
let origin, infoPanel, destiny;

// Variables para las animaciones
let choice = false;
let activateList = false;
let isMouseDown = false, rotation = { x: 0, y: 0 };

// Variables para guardar los links de las datasets
const worldURL = 'https://raw.githubusercontent.com/LuisFelipePoma/D3-graph-gallery/master/DATA/world.geojson';
const airportsURL = 'https://raw.githubusercontent.com/LuisFelipePoma/TF-Data/main/datasets/V3/airports.json';
const routesURL = 'https://raw.githubusercontent.com/LuisFelipePoma/TF-Data/main/datasets/LITE/router.json';
const linksURL = 'https://raw.githubusercontent.com/LuisFelipePoma/TF-Data/main/datasets/V2/links.json'

// <------------------------------------------------------------------- Verificacion de la lectura de los datos ------------------------------------>//


var promises = [json(worldURL), json(airportsURL), json(routesURL), json(linksURL)]
myDataPromises = Promise.all(promises)
myDataPromises.then(function (data) {
    init(data[0], data[1], data[2], data[3]);
})
myDataPromises.catch(function () {
    console.log('Something has gone wrong. No load Data.')
})

// <---------------------------------------------------------------- Funcion Init ---------------------------------------------------------------->//

const init = (worlds, airports, routes, coords) => {
    geojson = worlds
    airportjson = airports
    routesjson = routes
    linksjson = coords
    drawGlobe();
    // drawRoutes();
    drawNodes();
    // drawGraticule()
    renderInfo();
    createHoverEffect()
    createSelectionEvent()
    createDraggingEvents()
}
// <------------------------------------------------------------------ Funciones ------------------------------------------------------------------>//
// Obtener los datos de los aeropuertos del pais seleccionado
const getAirports = (e) => {
    // let airportsArray = []
    addLi(e);
}
function addLi(e) {
    var contenido;
    var li = document.createElement("li");
    var p = document.createElement("p");
    let list = []
    let airportsArray = selectAll(`.${e.id}`);
    airportsArray["_groups"][0].forEach(function (e) { list.push(e) })
    list.forEach((e) => {
        var elementos = e["__data__"]
        contenido = "Aeropuerto:" + elementos.airport_name + "\nCity: " + elementos.city;
        p.appendChild(document.createTextNode(contenido));
        document.querySelector("#lista_aeropuertos").appendChild(li).appendChild(p);
    })
}
function cleanLists(){
    document.querySelector("#lista_aeropuertos").innerHTML ="";
}



// DIBUJA MAPA 
const drawGlobe = () => {

    globe = select('#mapa')
        .append('svg')
        .attr('width', width)
        .attr('height', height)

    projection = geoOrthographic()
        .fitSize([globeSize.w, globeSize.h], geojson)
        .translate([height - width / 2, height / 2])
        .rotate([0, 0])

    path = geoPath().projection(projection)

    globe
        .selectAll('path')
        .data(geojson.features)
        .enter().append('path')
        .attr('d', path)
        .attr('id', (e) => { return e.id })
        .attr('class', 'country noSelected selected howerOff howerPass')
        .classed('selected', false).classed('howerPass', false)

};

// DIBUJA RETICULA
const drawGraticule = () => {

    graticule = geoGraticule()

    globe
        .append('path')
        .attr('class', 'graticule')
        .attr('d', path(graticule()))
};

// DIBUJA LOS AEROUPUERTOS
const drawNodes = () => {
    nodes = globe.selectAll('g')
        .data(airportjson)
        .join('g')
        .append('g')

        .attr('class', (e) => { return `${e.country_code} airport` })
        .attr('transform', ({ lon, lat }) => `translate(${projection([lon, lat]).join(",")})`)
        .append("circle")
        .attr('r', 1.5)
}

//DIBUJA LAS RUTAS
const drawRoutes = () => {

    routesjson.forEach(function (row) {
        source = [+row.origin_lon, +row.origin_lat]
        target = [+row.destination_lon, +row.destination_lat]
        topush = { type: "LineString", coordinates: [source, target] }
        links.push(topush)
    })
    console.log(routesjson)
    console.log(links)
    globe.selectAll("myPath")
        .data(links)
        .enter()
        .append("path")
        .attr("class", "rutas")
        .attr("d", function (d) { return path(d) })
}


// CREA ELEMENTOS(labels) PARA IMPRIMIR EN PANTALLA
const renderInfo = () => {
    infoPanel = select('#info')
    origin = select('#origin')
    destiny = select('#destiny')
};

// CREA LAS ANIMACIONES DE MOUSE Y COLOREO, tambien pasa datos a los labels
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

// CREA LAS ANIMACIONES DE ARRASTRE Y COLOREO, tambien pasa datos a los labels
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
                // selectAll('.graticule').attr('d', path(graticule()))
                selectAll('.rutas').attr("d", function (d) { return path(d) })
                selectAll('.airport').attr('transform', ({ lon, lat }) => `translate(${projection([lon, lat]).join(",")})`)
            }
        })
};

// CREA EVENTOS PARA PODER SELECCIONAR PAISES
const createSelectionEvent = () => {

    globe
        .selectAll('.country')
        .on('mousedown', function (e) {
            const a = selectAll('.selected')
            var b = "";
            if (a.size() > 0) b = this.className.animVal
            if (a.size() < 2 && b.search('selected') == -1) {
                select(this).classed('noSelected', false);
                select(this).classed('selected', true);
                getAirports(this);
                // saveCountries(d);
            }
            if (b.search('selected') != -1) {
                select(this).classed('selected', false);
                select(this).classed('noSelected', true);
                cleanLists()
            }
        })
};
const saveCountries = (d) => {
    const { name, type, economy, income_grp } = d.properties
    let tipos = `<ul><li class = "options ">${type}</li ><li class = "options ">${economy}</li><li class = "options ">${income_grp}</li></ul>`
    if (choice == false) {
        let dates = `<p>Origen : ${name}</p>`;
        document.getElementById("origen").innerHTML = dates
        document.getElementById("origen-list").innerHTML = tipos
        choice = true;
    }
    else {
        let dates = `<p>Destino : ${name}</p>`;
        document.getElementById("destino").innerHTML = dates
        document.getElementById("destino-list").innerHTML = tipos
        choice = false;
    }
};

