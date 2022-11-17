from flask import Flask, render_template, request, send_from_directory
import algorithm

app = Flask(__name__)

@app.route('/')
def root():
    return render_template('index.html')

@app.route("/css/<path:path>")
def serveCSS(path):
    return send_from_directory('static/css', path)
    
@app.route("/js/<path:path>")
def serveJS(path):
    return send_from_directory('static/js', path)

@app.route('/', methods=['GET', 'POST'])
def aver():
    if request.method == 'POST':
        origen = request.form['airportO']
        destino = request.form['airportD']
        origen = int(origen)
        destino = int(destino)
        #return destino + " " + origen
        path = algorithm.paths(origen, destino)
        #return app.send_static_file('/no/index3.html')
        return render_template('index2.html', data = {'path':path})
    
@app.route("/paths/<int:s>/<int:t>")
def paths(s, t):
    return app.response_class(response=algorithm.paths(s, t),
                              status=200,
                              mimetype='application/json')
                              
if __name__ == '__main__':
    app.run(debug = True)