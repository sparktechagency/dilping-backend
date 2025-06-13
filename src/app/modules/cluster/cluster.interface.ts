import { Model } from 'mongoose'

export interface ICluster {
  _id: string
  centroid: {
    type: 'Point'
    coordinates: [number, number]
  }
  businessCount: number
  lastUpdated: Date
  createdAt: Date
  updatedAt: Date
}

export type ClusterModel = Model<ICluster>
