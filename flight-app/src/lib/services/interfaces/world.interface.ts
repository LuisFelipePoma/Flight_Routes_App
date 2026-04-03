export interface WorldFeature {
  id?: string
  type: string
  properties?: Record<string, unknown>
  geometry?: Geometry
}

export interface Geometry {
  type: string
  coordinates: Array<Array<number[]>>
}

export interface WorldResponseDTO {
  type: "FeatureCollection"
  features: WorldFeature[]
}

// Temporary compatibility alias during migration window.
export type WorlResponseDTO = WorldResponseDTO
