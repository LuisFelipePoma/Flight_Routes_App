export const DATASET_URLS = {
  world:
    "https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/world.geojson",
  airports:
    "https://raw.githubusercontent.com/LuisFelipePoma/DataSetForFlightRoutesApp/main/datasets/airports.json",
  routes:
    "https://raw.githubusercontent.com/LuisFelipePoma/DataSetForFlightRoutesApp/main/datasets/routes.json",
} as const

export type DatasetKey = keyof typeof DATASET_URLS
