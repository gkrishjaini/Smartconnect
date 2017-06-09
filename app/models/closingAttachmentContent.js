var mongoose = require('mongoose');

var closingAttachmentContent = new mongoose.Schema({
    url: String,
    fileName: String,
    employeeId: String,
    appointmentId: String,
    type: String
});

module.exports = mongoose.model('closingAttachmentContent', closingAttachmentContent);