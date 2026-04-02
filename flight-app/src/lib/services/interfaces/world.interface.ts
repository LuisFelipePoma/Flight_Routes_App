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

export interface WorlResponseDTO {
  type: "FeatureCollection"
  features: WorldFeature[]
}
