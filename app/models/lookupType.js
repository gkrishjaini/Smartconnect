var mongoose = require('mongoose');

var lookupType = mongoose.Schema({
    name: {
        type: String
        // index: {
        //     unique: false
        // }
    },
    isSubcategory: Boolean,
    serviceProviderId : String,
    parentLookupTypeId : String,
    parentLookupType : String,
    default: Boolean,
    visible : Boolean
});
lookupType.index({ name: 1, serviceProviderId: 1 }, { unique: true });
module.exports = mongoose.model('LookupTypes', lookupType);
