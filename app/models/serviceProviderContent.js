var mongoose = require('mongoose');

var serviceProviderContent = new mongoose.Schema({
    url: String,
    fileName: String,
    serviceProviderId: String,
    type: String
});

module.exports = mongoose.model('ServiceProviderContents', serviceProviderContent);