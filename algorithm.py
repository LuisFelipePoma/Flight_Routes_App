import json
import random as r
import math
import heapq as hq
import pandas as pd
from haversine import haversine, Unit

path = "https://raw.githubusercontent.com/LuisFelipePoma/TF-Data/main/datasets/V3/routes.json"

def transformGraph():
    df = pd.read_json(path)
    #print(df)
    rows = len(df)
    #columns = len(df.columns)
    G = [[] for _ in range(3241)]
    id_origin = pd.Series(df._get_column_array(1))
    id_destination = pd.Series(df._get_column_array(3))
    origin_lat = pd.Series(df._get_column_array(6))
    origin_lon = pd.Series(df._get_column_array(7))
    destination_lat = pd.Series(df._get_column_array(9))
    destination_lon = pd.Series(df._get_column_array(10))

    id_origin = id_origin.tolist()
    id_destination = id_destination.tolist()
    origin_lat = origin_lat.tolist()
    origin_lon = origin_lon.tolist()
    destination_lat = destination_lat.tolist()
    destination_lon = destination_lon.tolist()

    for i in range(rows):
        a = (origin_lat[i], origin_lon[i])
        b = (destination_lat[i], destination_lon[i])
        distance = haversine(a, b)
        d = int(id_destination[i])
        G[id_origin[i]].append([d, distance])

    return G

def dijkstra(G, s):
    n= len(G)
    visited= [False]*n
    path= [-1]*n
    cost= [math.inf]*n

    cost[s]= 0
    pqueue= [(0, s)]
    while pqueue:
        g, u= hq.heappop(pqueue)
        if not visited[u]:
            visited[u]= True
            for v, w in G[u]:
                if not visited[v]:
                    f= g + w
                    if f < cost[v]:
                        cost[v]= f
                        path[v]= u
                        hq.heappush(pqueue, (f, v))

    return path, cost

def dfs(G, s):
  n = len(G)
  path = [-1]*n
  visited = [False]*n

  def _dfs(u):
    visited[u] = True
    for v, w in G[u]:
      if not visited[v]:
        path[v] = u
        _dfs(v)

  _dfs(s)
  return path

G = transformGraph()

def paths(origen, destino):
    bestpath, _= dijkstra(G, origen)
    camino = []
    nodo = bestpath[destino]
    while nodo != -1:
        camino.append(nodo)
        nodo = bestpath[nodo]
    #path1= bfs(G, s)
    #path2= dfs(G, s)
    #    return json.dumps({"bestpath": bestpath, "path1": path1, "path2": path2})
    return json.dumps({"bestpath": camino})