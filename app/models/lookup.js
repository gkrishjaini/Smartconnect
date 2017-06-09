var mongoose = require('mongoose');

var lookUpSchema = mongoose.Schema({
    value: {
        type: String
    },
    type: String,
    description: String,
    isEnabled: Boolean,
    effectiveFrom: Date,
    effectiveTo: Date,
    serviceProviderId: String,

    subCategory: [this]
});

lookUpSchema.index({ value: 1, serviceProviderId: 1, type : 1 }, { unique: true });

module.exports = mongoose.model('LookupData', lookUpSchema);
