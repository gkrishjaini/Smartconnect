var mongoose = require('mongoose');
var LookUpData = require('./models/lookup');
var LookupTypes = require('./models/lookupType');
var user = require('./models/user');
var SeriveProviders = require('./models/serviceprovider');
var userCollection = mongoose.model('User', user);


module.exports = function() {

    var createLookupType = function(typeName, hasChild, visible) {
        LookupTypes.findOne({
            "name": typeName
        }, function(err, data) {
            if (!data) {

                console.log('creating lookup type ' + typeName);

                var lookupType = new LookupTypes();
                lookupType.name = typeName;
                lookupType.hasSubcategory = hasChild ? true : false;
                lookupType.serviceProviderId = null;
                lookupType.default = true;
                lookupType.visible = visible;
                lookupType.save(function(err) {
                    if (err) {
                        console.log(err);
                    }
                    console.log('success');
                });
            }
        });
    }

    var createLookUpData = function(value, type) {

        LookUpData.findOne({
            'type': type,
            value: value
        }, function(err, data) {

            if (!data) {
                var documentSet = new LookUpData();
                documentSet.isEnabled = true;
                documentSet.serviceProviderId = null;
                documentSet.type = type;
                documentSet.subCategory = [];
                documentSet.value = value;

                documentSet.save(function(err) {
                    if (err) {
                        console.log('Error');
                    }
                })
            }

        })


    }

    var createCorporate = function() {
        var data = {
            firstName: "Admin",
            lastName: "User",
            companyName: "SmartConnect",
            userName: "admin@smartconnect.com",
            password: "Admin@123",
            termsAndConditions: "true",
            isAdmin: "true"
        }

        userCollection.findOne({
            "userName": data.userName
        }, function(err, corporatedata) {
            if (!corporatedata) {
                console.log('creating Corporate user ' + data.userName);
                var model = new SeriveProviders();
                model.firstName = data.firstName;
                model.lastName = data.lastName;
                model.lastName = data.lastName;
                model.userName = data.userName;
                model.password = data.password;
                model.companyName = data.companyName;
                model.termsAndConditions = data.termsAndConditions;
                model.isAdmin = data.isAdmin;
                model.EmailVerified = true;
                model.save(function(err) {
                    if (err) {
                        console.log(err);
                    }
                    console.log('Corporate created');
                })
            }

        });
    }

    return {
        init: function() {
            createCorporate();
            createLookupType('Role');
            createLookupType('Security Question', false, false);
            createLookupType('Business Area', false, false);
            createLookupType('Business Category', true, false);
            createLookupType('Appointment Options', false, false);
            createLookupType('Appointment Category', true);
            createLookupType('Appointment Type');  
            createLookupType('Country', false, false); 

            createLookUpData("Regular", "Appointment Options");
            createLookUpData("Default", "Appointment Options");
            createLookUpData("Contact", "Appointment Options");
        }
    }
}();
