import { Schema, model } from 'mongoose'
import { ClusterModel, ICluster } from './cluster.interface'

const clusterSchema = new Schema<ICluster, ClusterModel>(
  {
    centroid: {
      type: {
        type: String,
        enum: ['Point'],
        required: true,
      },
      coordinates: {
        type: [Number],
        required: true,
      },
    },
    businessCount: {
      type: Number,
      required: true,
    },
    lastUpdated: {
      type: Date,
      required: true,
    },
  },
  {
    timestamps: true,
  },
)

clusterSchema.index({ centroid: '2dsphere' })
export const Cluster = model<ICluster, ClusterModel>('Cluster', clusterSchema)
