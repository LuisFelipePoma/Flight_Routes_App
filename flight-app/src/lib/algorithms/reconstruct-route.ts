export function reconstructRoute(
  predecessors: Map<number, number>,
  originId: number,
  destinationId: number
): number[] {
  if (originId === destinationId) {
    return [originId]
  }

  const route: number[] = []
  let cursor: number | undefined = destinationId

  while (cursor !== undefined) {
    route.push(cursor)

    if (cursor === originId) {
      route.reverse()
      return route
    }

    cursor = predecessors.get(cursor)
  }

  return []
}
