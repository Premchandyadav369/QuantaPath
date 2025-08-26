import type { DeliveryStop } from "@/lib/types"

export class ClusteringService {
  private static instance: ClusteringService

  static getInstance(): ClusteringService {
    if (!ClusteringService.instance) {
      ClusteringService.instance = new ClusteringService()
    }
    return ClusteringService.instance
  }

  /**
   * Partitions a set of delivery stops into k clusters using the k-means algorithm.
   * @param stops The array of delivery stops to cluster.
   * @param k The number of clusters (vehicles).
   * @returns An array of clusters, where each cluster is an array of stops.
   */
  public groupIntoClusters(stops: DeliveryStop[], k: number): DeliveryStop[][] {
    if (k <= 0 || stops.length === 0) {
      return []
    }
    if (k >= stops.length) {
      // If k is more than or equal to stops, each stop is its own cluster
      return stops.map(stop => [stop])
    }

    // 1. Initialize centroids by picking k random stops
    let centroids = this.getRandomCentroids(stops, k)
    let assignments: number[] = []
    let clusters: DeliveryStop[][] = []

    for (let iter = 0; iter < 100; iter++) { // Max 100 iterations to prevent infinite loops
      // 2. Assign stops to the nearest centroid
      const newAssignments = stops.map(stop => this.getNearestCentroidIndex(stop, centroids))

      // If assignments haven't changed, we've converged
      if (this.haveAssignmentsChanged(assignments, newAssignments)) {
        assignments = newAssignments
      } else {
        break
      }

      // 3. Recalculate centroids
      centroids = this.recalculateCentroids(stops, assignments, k)
    }

    // 4. Group stops into clusters based on final assignments
    for (let i = 0; i < k; i++) {
      clusters.push([])
    }
    stops.forEach((stop, i) => {
      clusters[assignments[i]].push(stop)
    })

    return clusters.filter(cluster => cluster.length > 0) // Return only non-empty clusters
  }

  private getRandomCentroids(stops: DeliveryStop[], k: number): { lat: number; lng: number }[] {
    const shuffled = [...stops].sort(() => 0.5 - Math.random())
    return shuffled.slice(0, k).map(stop => ({ lat: stop.lat, lng: stop.lng }))
  }

  private getNearestCentroidIndex(stop: DeliveryStop, centroids: { lat: number; lng: number }[]): number {
    let minDistance = Infinity
    let nearestIndex = -1

    centroids.forEach((centroid, i) => {
      const distance = this.haversineDistance(stop, centroid)
      if (distance < minDistance) {
        minDistance = distance
        nearestIndex = i
      }
    })
    return nearestIndex
  }

  private haveAssignmentsChanged(oldAssignments: number[], newAssignments: number[]): boolean {
    if (oldAssignments.length !== newAssignments.length) return true
    return oldAssignments.some((a, i) => a !== newAssignments[i])
  }

  private recalculateCentroids(stops: DeliveryStop[], assignments: number[], k: number): { lat: number; lng: number }[] {
    const newCentroids: { lat: number; lng: number, count: number }[] = Array(k).fill(0).map(() => ({ lat: 0, lng: 0, count: 0 }))

    stops.forEach((stop, i) => {
      const assignment = assignments[i]
      newCentroids[assignment].lat += stop.lat
      newCentroids[assignment].lng += stop.lng
      newCentroids[assignment].count++
    })

    return newCentroids.map((centroid, i) => {
      if (centroid.count === 0) {
        // If a cluster becomes empty, re-initialize its centroid randomly
        return this.getRandomCentroids(stops, 1)[0]
      }
      return {
        lat: centroid.lat / centroid.count,
        lng: centroid.lng / centroid.count,
      }
    })
  }

  private haversineDistance(
    p1: { lat: number; lng: number },
    p2: { lat: number; lng: number },
  ): number {
    const R = 6371 // Radius of the Earth in km
    const dLat = this.toRad(p2.lat - p1.lat)
    const dLon = this.toRad(p2.lng - p1.lng)
    const lat1 = this.toRad(p1.lat)
    const lat2 = this.toRad(p2.lat)

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return R * c
  }

  private toRad(value: number): number {
    return (value * Math.PI) / 180
  }
}
