var mongoose = require('mongoose');

var knowledgebaseContent = new mongoose.Schema({
    url: String,
    fileName: String,
    serviceProviderId: String,
    appointmentId: String,
    type: String
});

module.exports = mongoose.model('KnowledgebaseContents', knowledgebaseContent);