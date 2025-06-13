"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Cluster = void 0;
const mongoose_1 = require("mongoose");
const clusterSchema = new mongoose_1.Schema({
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
}, {
    timestamps: true,
});
clusterSchema.index({ centroid: '2dsphere' });
exports.Cluster = (0, mongoose_1.model)('Cluster', clusterSchema);
