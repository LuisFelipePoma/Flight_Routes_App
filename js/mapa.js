const { json, select, selectAll, geoOrthographic, geoPath,
    geoGraticule, csv, geoMercator, set, easeElastic,
    transition, forceSimulation, forceLink, forceManyBody,
    forceCenter } = d3;
const width = document.querySelector("#mapa").clientWidth;
const height = document.querySelector("#mapa").clientHeight - 10;
const globeSize = {
    w: width * 0.90,
    h: height * 0.90,
}

let globe, projection, path, graticule;
let geojson, airportjson, routesjson,linksjson;
let origin, infoPanel, destiny;

let nodes, links = [] ;

let choice = false;
let activateList = false;
let isMouseDown = false, rotation = { x: 0, y: 0 };


const worldURL = 'https://raw.githubusercontent.com/LuisFelipePoma/D3-graph-gallery/master/DATA/world.geojson';
const airportsURL = 'https://raw.githubusercontent.com/LuisFelipePoma/TF-Data/main/airports.json';
const routesURL = 'https://raw.githubusercontent.com/LuisFelipePoma/TF-Data/main/routes.json';
const linksURL = 'https://raw.githubusercontent.com/LuisFelipePoma/TF-Data/main/links.json'


var promises = [json(worldURL), json(airportsURL), json(routesURL),json(linksURL)]
myDataPromises = Promise.all(promises)

myDataPromises.then(function (data) {
    init(data[0],data[1],data[2],data[3]);
})
myDataPromises.catch(function () {
    console.log('Something has gone wrong. No load Data.')
})



//poner comentarios



const init = (worlds, airports, routes,coords) => {
    geojson = worlds
    airportjson = airports
    routesjson = routes
    linksjson = coords
    drawGlobe();
    // routesjson.forEach(function (row) {
    //     console.lo
    drawRoutes();
    // drawGraticule()
    renderInfo();
    createHoverEffect()
    createSelectionEvent()
    createDraggingEvents()
}
// DIBUJA MAPA Y RETICULAS
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
        .attr('class', 'country noSelected selected howerOff howerPass')
        .classed('selected', false).classed('howerPass', false)

};


const drawNodes = () => {

}
const drawRoutes = () => {
    routesjson.forEach(function (row) {
        source = [+row.origin_lon, + row.origin_la]
        target = [+row.destination_lon, +row.destination_la]
        topush = { type: "LineString", coordinates: [source, target] }
        links.push(topush)
    })
    links.push(linksjson)
    // Add the path
    globe.selectAll("myPath")
        .data(links)
        .enter()
        .append("path")
        .attr("class", "rutas")
        .attr("d", function (d) { return path(d) })
}

const drawGraticule = () => {

    graticule = geoGraticule()

    globe
        .append('path')
        .attr('class', 'graticule')
        .attr('d', path(graticule()))
};

// CREA ELEMENTOS(labels) PARA IMPRIMIR EN PANTALLA
const renderInfo = () => {
    infoPanel = select('#info')
    origin = select('#origin')
    destiny = select('#destiny')
};

// CREA LAS ANIMACIONES DE ARRASTRE Y COLOREO, tambien pasa datos a los labels
const createHoverEffect = () => {

    globe
        .selectAll('.country')
        .on('mouseover', function (e, d) {
            const { name } = d.properties
            infoPanel.html(`<h2>${name}</h2><hr>`)
            globe.selectAll('.country').classed('howerPass', false).classed('howerOff', true)
            select(this).classed('howerOff', false).classed("howerPass", true);
            // globe.selectAll('.links').attr('display', 'flex');
        })
        .on("mouseout", function (e, d) {
            globe.selectAll('.country').classed("howerPass", false).classed('howerOff', true)
        });
};

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
            }
        })
};

const createSelectionEvent = () => {

    globe
        .selectAll('.country')
        .on('mousedown', function (e, d) {
            const a = selectAll('.selected')
            var b = "";
            if (a.size() > 0) b = this.className.animVal
            if (a.size() < 2 && b.search('selected') == -1) {
                select(this).classed('noSelected', false);
                select(this).classed('selected', true);
                saveCountries(d);
            }
            if (b.search('selected') != -1) {
                select(this).classed('selected', false);
                select(this).classed('noSelected', true);
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

