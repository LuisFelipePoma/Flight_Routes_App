import type { Airport } from "@/lib/types/flight"

const DATASET_URLS = {
  world:
    "https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/world.geojson",
  airports:
    "https://raw.githubusercontent.com/LuisFelipePoma/DataSetForFlightRoutesApp/main/datasets/airports.json",
  routes:
    "https://raw.githubusercontent.com/LuisFelipePoma/DataSetForFlightRoutesApp/main/datasets/routes.json",
} as const

type DatasetKey = keyof typeof DATASET_URLS

type DatasetErrorCode =
  | "network"
  | "timeout"
  | "http"
  | "parse"
  | "validation"
  | "unknown"

type RouteIdKey = "id_origin" | "origin_id" | "source_airport_id" | "source_id"

type RouteDestinationIdKey =
  | "id_destination"
  | "destination_id"
  | "dest_airport_id"
  | "target_airport_id"

export interface DatasetErrorMeta {
  dataset: DatasetKey
  code: DatasetErrorCode
  retryable: boolean
  statusCode?: number
  cause?: unknown
}

export class DatasetError extends Error {
  readonly dataset: DatasetKey
  readonly code: DatasetErrorCode
  readonly retryable: boolean
  readonly statusCode?: number
  override readonly cause?: unknown

  constructor(message: string, meta: DatasetErrorMeta) {
    super(message)
    this.name = "DatasetError"
    this.dataset = meta.dataset
    this.code = meta.code
    this.retryable = meta.retryable
    this.statusCode = meta.statusCode
    this.cause = meta.cause
  }
}

export interface WorldFeature {
  id?: string
  type: string
  properties?: Record<string, unknown>
  geometry?: unknown
}

export interface WorldDataset {
  type: "FeatureCollection"
  features: WorldFeature[]
}

export interface RouteDatasetRecord {
  id_origin: number
  id_destination: number
  origin_lat: number
  origin_lon: number
  destination_lat: number
  destination_lon: number
}

export interface RetryOptions {
  retries?: number
  delayMs?: number
  shouldRetry?: (error: unknown) => boolean
}

export interface FlightDatasets {
  world: WorldDataset
  airports: Airport[]
  routes: RouteDatasetRecord[]
}

const RETRYABLE_CODES: DatasetErrorCode[] = ["network", "timeout", "http"]

function parseNumber(value: unknown): number {
  if (typeof value === "number") {
    return value
  }

  if (typeof value === "string" && value.trim() !== "") {
    return Number(value)
  }

  return Number.NaN
}

function pickNumber(
  source: Record<string, unknown>,
  keys: readonly string[]
): number {
  for (const key of keys) {
    const value = parseNumber(source[key])
    if (Number.isFinite(value)) {
      return value
    }
  }

  return Number.NaN
}

function sleep(ms: number) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms)
  })
}

function mapDatasetError(error: unknown, dataset: DatasetKey): DatasetError {
  if (error instanceof DatasetError) {
    return error
  }

  if (error instanceof DOMException && error.name === "AbortError") {
    return new DatasetError(`Timed out loading ${dataset} dataset`, {
      dataset,
      code: "timeout",
      retryable: true,
      cause: error,
    })
  }

  if (error instanceof SyntaxError) {
    return new DatasetError(`Failed to parse ${dataset} dataset`, {
      dataset,
      code: "parse",
      retryable: false,
      cause: error,
    })
  }

  if (error instanceof Error) {
    return new DatasetError(
      error.message || `Failed loading ${dataset} dataset`,
      {
        dataset,
        code: "network",
        retryable: true,
        cause: error,
      }
    )
  }

  return new DatasetError(`Unknown error while loading ${dataset} dataset`, {
    dataset,
    code: "unknown",
    retryable: false,
    cause: error,
  })
}

function createHttpError(
  dataset: DatasetKey,
  statusCode: number
): DatasetError {
  return new DatasetError(
    `HTTP ${statusCode} while loading ${dataset} dataset`,
    {
      dataset,
      code: "http",
      statusCode,
      retryable: statusCode >= 500 || statusCode === 429,
    }
  )
}

export async function withRetry<T>(
  operation: (attempt: number) => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const retries = options.retries ?? 2
  const delayMs = options.delayMs ?? 400
  const shouldRetry =
    options.shouldRetry ??
    ((error: unknown) =>
      error instanceof DatasetError && RETRYABLE_CODES.includes(error.code))

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      return await operation(attempt)
    } catch (error) {
      if (attempt === retries || !shouldRetry(error)) {
        throw error
      }

      await sleep(delayMs * (attempt + 1))
    }
  }

  throw new Error("Retry loop exited unexpectedly")
}

export async function fetchDatasetJson<T>(
  dataset: DatasetKey,
  options: { timeoutMs?: number } = {}
): Promise<T> {
  const controller = new AbortController()
  const timeoutMs = options.timeoutMs ?? 9000
  const timeoutId = window.setTimeout(() => controller.abort(), timeoutMs)

  try {
    const response = await fetch(DATASET_URLS[dataset], {
      signal: controller.signal,
    })

    if (!response.ok) {
      throw createHttpError(dataset, response.status)
    }

    return (await response.json()) as T
  } catch (error) {
    throw mapDatasetError(error, dataset)
  } finally {
    window.clearTimeout(timeoutId)
  }
}

export function normalizeAirportRecord(record: unknown): Airport {
  if (!record || typeof record !== "object") {
    throw new DatasetError("Airport dataset row has invalid shape", {
      dataset: "airports",
      code: "validation",
      retryable: false,
    })
  }

  const source = record as Record<string, unknown>
  const id = parseNumber(source.id)
  const lat = parseNumber(source.lat)
  const lon = parseNumber(source.lon)

  if (!Number.isFinite(id) || !Number.isFinite(lat) || !Number.isFinite(lon)) {
    throw new DatasetError("Airport dataset row has invalid numeric fields", {
      dataset: "airports",
      code: "validation",
      retryable: false,
    })
  }

  return {
    id,
    airport_name: String(source.airport_name ?? ""),
    city: String(source.city ?? ""),
    country_code: String(source.country_code ?? ""),
		country: String(source.country ?? ""),
		code_airport: String(source.code_airport ?? ""),
    lat,
    lon,
  }
}

export function normalizeRouteRecord(record: unknown): RouteDatasetRecord {
  if (!record || typeof record !== "object") {
    throw new DatasetError("Route dataset row has invalid shape", {
      dataset: "routes",
      code: "validation",
      retryable: false,
    })
  }

  const source = record as Record<string, unknown>
  const idOrigin = pickNumber(source, [
    "id_origin",
    "origin_id",
    "source_airport_id",
    "source_id",
  ] as RouteIdKey[])
  const idDestination = pickNumber(source, [
    "id_destination",
    "destination_id",
    "dest_airport_id",
    "target_airport_id",
  ] as RouteDestinationIdKey[])

  const originLat = pickNumber(source, [
    "origin_lat",
    "source_lat",
    "lat_origin",
  ])
  const originLon = pickNumber(source, [
    "origin_lon",
    "source_lon",
    "lon_origin",
  ])
  const destinationLat = pickNumber(source, [
    "destination_lat",
    "dest_lat",
    "target_lat",
    "lat_destination",
  ])
  const destinationLon = pickNumber(source, [
    "destination_lon",
    "dest_lon",
    "target_lon",
    "lon_destination",
  ])

  if (
    !Number.isFinite(idOrigin) ||
    !Number.isFinite(idDestination) ||
    !Number.isFinite(originLat) ||
    !Number.isFinite(originLon) ||
    !Number.isFinite(destinationLat) ||
    !Number.isFinite(destinationLon)
  ) {
    throw new DatasetError("Route dataset row has invalid numeric fields", {
      dataset: "routes",
      code: "validation",
      retryable: false,
    })
  }

  return {
    id_origin: idOrigin,
    id_destination: idDestination,
    origin_lat: originLat,
    origin_lon: originLon,
    destination_lat: destinationLat,
    destination_lon: destinationLon,
  }
}

export function validateWorldDataset(data: unknown): WorldDataset {
  if (!data || typeof data !== "object") {
    throw new DatasetError("World dataset has invalid shape", {
      dataset: "world",
      code: "validation",
      retryable: false,
    })
  }

  const source = data as Partial<WorldDataset>
  if (source.type !== "FeatureCollection" || !Array.isArray(source.features)) {
    throw new DatasetError("World dataset must be a FeatureCollection", {
      dataset: "world",
      code: "validation",
      retryable: false,
    })
  }

  return {
    type: source.type,
    features: source.features,
  }
}

export async function loadWorldDataset(): Promise<WorldDataset> {
  return withRetry(async () => {
    const payload = await fetchDatasetJson<unknown>("world")
    return validateWorldDataset(payload)
  })
}

export async function loadAirportsDataset(): Promise<Airport[]> {
  return withRetry(async () => {
    const payload = await fetchDatasetJson<unknown>("airports")
    if (!Array.isArray(payload)) {
      throw new DatasetError("Airport dataset must be an array", {
        dataset: "airports",
        code: "validation",
        retryable: false,
      })
    }

    return payload.map(normalizeAirportRecord)
  })
}

export async function loadRoutesDataset(): Promise<RouteDatasetRecord[]> {
  return withRetry(async () => {
    const payload = await fetchDatasetJson<unknown>("routes")
    if (!Array.isArray(payload)) {
      throw new DatasetError("Route dataset must be an array", {
        dataset: "routes",
        code: "validation",
        retryable: false,
      })
    }

    return payload.map(normalizeRouteRecord)
  })
}

export async function loadFlightDatasets(): Promise<FlightDatasets> {
  const [world, airports, routes] = await Promise.all([
    loadWorldDataset(),
    loadAirportsDataset(),
    loadRoutesDataset(),
  ])

  return {
    world,
    airports,
    routes,
  }
}
