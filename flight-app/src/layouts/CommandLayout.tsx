import React from 'react'

export default function CommandLayout() {
	return (
		<div className="inline-block bg-card flex-1">
			<div className="w-100 p-3">
				<div>
					<article>
						<h1>Seleccione que Pais desea ver
						</h1>
					</article>
					<article id="info"></article>
				</div>
			</div>
			<div className="aeropuertos_title w-auto p-3">
				<article id="origen_label"> </article>
				<article id="destino_label"></article>
			</div>
			<div className="w-auto p-3">
				<h4>Ruta de Vuelos : </h4>
				<article id="data_algorith"></article>
			</div>
			<div className="w-auto p-3 btn-group col-md-8 text-center" role="group">
				<button className="buttons buttonShow btn  btn-lg" type="submit" id="showDjk">Ver Dijkstra</button>
				<button className="buttons buttonShow btn  btn-lg" type="submit" id="showDfs">Ver DFS (Depth Find
					Path)</button>
				<button className="buttons buttonShow btn  btn-lg" type="submit" id="showPrim">Ver Prim</button>
			</div>
			<div className=" w-auto p-3">
				<a className="button" type="submit" id="sendData" href="{{url_for('root')}}">Volver</a>
			</div>
		</div>
	)
}
