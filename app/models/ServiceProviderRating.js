var mongoose = require('mongoose');

var ServiceProviderRating = new mongoose.Schema({
    serviceProviderId: String,
    customerId: String,
    rating: String
});


module.exports = mongoose.model('ServiceProviderRating', ServiceProviderRating);
