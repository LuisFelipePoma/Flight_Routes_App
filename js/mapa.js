const { json, select, selectAll, geoOrthographic, geoPath, geoGraticule, csv, geoMercator, set } = d3

var geojson, globe, projection, path, graticule, isMouseDown = false, rotation = { x: 0, y: 0 }, link = [], routescsv, route

const width = document.querySelector("#mapa").clientWidth
const height = document.querySelector("#mapa").clientHeight - 25;

let origin, infoPanel, destiny;
let choice = false;

const globeSize = {
    w: width * 0.90,
    h: height * 0.90,
}

json('https://assets.codepen.io/911796/custom.geo.json').then(data => init(data))


const init = (data) => {
    console.log(width, height);
    geojson = data
    csv("https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/data_connectionmap.csv").then(routes => DrawRoutes(routes))
    drawGlobe()
    drawGraticule()
    renderInfo()
    createHoverEffect()
    createSelectionEvent()
    createDraggingEvents()
}
// DIBUJA MAPA Y RETICULAS
const drawGlobe = () => {

    globe = select('#mapa')
        .append('svg')
        .attr('width', height)
        .attr('height', height)

    projection = geoOrthographic()
        .fitSize([globeSize.w, globeSize.h], geojson)
        .translate([height - globeSize.w / 2, height / 2])

    path = geoPath().projection(projection)

    globe
        .selectAll('path')
        .data(geojson.features)
        .enter().append('path')
        .attr('d', path)
        .attr('class', 'country noSelected selected howerOff howerPass')
        .classed('selected', false).classed('howerPass', false)
}
const drawGraticule = () => {

    graticule = geoGraticule()

    globe
        .append('path')
        .attr('class', 'graticule')
        .attr('d', path(graticule()))
        .attr('fill', 'none')
        .attr('stroke', '#232323')

}

// CREA ELEMENTOS(labels) PARA IMPRIMIR EN PANTALLA
const renderInfo = () => {
    infoPanel = select('#info')
    origin = select('#origin')
    destiny = select('#destiny')
}

// CREA LAS ANIMACIONES DE ARRASTRE Y COLOREO, tambien pasa datos a los labels
const createHoverEffect = () => {

    globe
        .selectAll('.country')
        .on('mouseover', function (e, d) {
            const { formal_en } = d.properties
            infoPanel.html(`<h2>${formal_en}</h2><hr>`)
            globe.selectAll('.country').classed('howerPass', false).classed('howerOff', true)
            select(this).classed('howerOff', false).classed("howerPass", true)
        })
        .on("mouseout", function (e, d) {
            globe.selectAll('.country').classed("howerPass", false).classed('howerOff', true)
        });
}
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
                selectAll('.Links').attr("d", function (d) { return path(d) })
            }
        })
}
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
}

const saveCountries = (d) => {
    const { formal_en, type, economy, income_grp } = d.properties
    let tipos = `<ul><li>${type}</li><li>${economy}</li><li>${income_grp}</li></ul>`
    if (choice == false) {
        let dates = `<p>Origen : ${formal_en}</p>`;
        document.getElementById("origen").innerHTML = dates
        document.getElementById("origen-list").innerHTML = tipos
        choice = true;
    }
    else {
        let dates = `<p>Destino : ${formal_en}</p>`;
        document.getElementById("destino").innerHTML = dates
        document.getElementById("destino-list").innerHTML = tipos
        choice = false;
    }
}

const DrawRoutes = (routes) => {
    routes.forEach(function (row) {
        source = [+row.long1, +row.lat1]
        target = [+row.long2, +row.lat2]
        topush = { type: "LineString", coordinates: [source, target] }
        link.push(topush)
    })
    console.log(link)
    globe.selectAll("myPath")
        .data(link)
        .enter()
        .append("path")
        .attr("d", function (d) { return path(d) })
        .attr("class","Links")
        .style("fill", "none")
        .style("stroke", "#69b3a2")
        .style("stroke-width", 2)
};