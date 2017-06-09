var jwt = require('jsonwebtoken');
var config = require('../../config');
var LookUpData = require('../models/lookup');
var LookUpType = require('../models/lookupType');
var _ = require('underscore');

module.exports = function(app, express) {

    var TOKEN_SECRET_STRING = config.secret;

    var lookUpTypeApi = express.Router();

    lookUpTypeApi.use(function(req, res, next) {

        console.log('call reached the node server for lookup type api calls');

        var token = req.body.token || req.params.token || req.headers['x-access-token'];
        console.log(token);
        if (token) {
            jwt.verify(token, TOKEN_SECRET_STRING, function(err, decoded) {

                if (err) {
                    return res.status(403).send({
                        success: true,
                        message: 'Token authentication failed, please login again'
                    });
                } else {
                    req.decoded = decoded;
                    next();
                }
            });
        } else {
            return res.status(403).send({
                success: true,
                message: 'No token provied!!'
            });
        }
    });

    lookUpTypeApi.route('/:parent_id/:provider_id')
        .get(function(req, res) {
            LookUpType.find({ $or: [{ $and: [{ "parentLookupTypeId": req.params.parent_id }, { "serviceProviderId": req.params.provider_id }] }, { $and: [{ "parentLookupTypeId": req.params.parent_id }, { "serviceProviderId": null }] }] }, function(err, lookupTypes) {
                res.json(lookupTypes);
            });
        });

    lookUpTypeApi.route('/:id')
        .get(function(req, res) {
            //LookUpType.find({ $or:[{ $and:[{"serviceProviderId" : req.params.id},{"isSubcategory" : false}]  },{$and:[{"serviceProviderId" : null},{"parentLookupTypeId" : null}] }]}, function (err, lookupTypes) {
            LookUpType.find({}).lean().exec(function(err, lookupTypes) {

                LookUpData.find({}, function(err, lookupData) {

                    for (i = 0; i < lookupTypes.length; i++) {
                        for (j = 0; j < lookupData.length; j++) {
                            if (lookupData[j].type == lookupTypes[i].name || lookupTypes[i].default) {
                                lookupTypes[i].inUse = true;
                            }
                        }

                    }
                    if (!req.decoded.corporateLogin) {
                        lookupTypes = _.reject(lookupTypes, function(obj) {
                            return obj.visible == false;
                        });
                    }
                    res.json(lookupTypes);

                });
            });
        }).delete(function(req, res) {
            LookUpData.find({}, function(err, lookupData) {
                var flag = false;
                LookUpType.find({ _id: req.params.id }).lean().exec(function(err, lookupTypes) {
                    console.log(lookupTypes)
                    LookUpData.find({}, function(err, lookupData) {

                        for (i = 0; i < lookupTypes.length; i++) {
                            for (j = 0; j < lookupData.length; j++) {
                                if (lookupData[j].type == lookupTypes[i].name || lookupTypes[i].default) {
                                    flag = true;
                                }
                            }

                        }

                        if (flag)
                            return res.json({ success: false });

                        LookUpType.remove({
                                _id: req.params.id,
                            },
                            function(err) {
                                if (err) {
                                    res.send(err)
                                }
                                res.send({ success: true, message: 'LookupType Deleted' })
                            })

                    });
                });
            });
        })



    lookUpTypeApi.route('/')
        .get(function(req, res) {
            LookUpType.find(function(err, lookupTypes) {
                res.json(lookupTypes);
            });
        })
        .post(function(req, res) {
            LookUpType.find({
                serviceProviderId: null,
                name: req.body.type
            }, function(err, value) {
                if (err) {
                    res.send(err);
                }
                if (value.length == 0) {
                    var lookupType = new LookUpType();
                    lookupType.name = req.body.type;
                    lookupType.isSubcategory = req.body.hasSubCategory;
                    lookupType.serviceProviderId = req.body.serviceProviderId;
                    if (req.body.parentLookupType != null) {
                        lookupType.parentLookupTypeId = JSON.parse(req.body.parentLookupType)._id;
                        lookupType.parentLookupType = JSON.parse(req.body.parentLookupType).name;
                    }


                    lookupType.save(function(err) {
                        if (err) {
                            if (err.code == 11000)
                                return res.json({
                                    success: false,
                                    message: 'A lookup type already exists. '
                                });
                        }

                        res.json({
                            success: true,
                            message: 'Lookup value created!'
                        });
                    })
                } else {
                    res.json({
                        success: false,
                        message: 'A lookup type already exists.'
                    });
                }
            });

        });

    return lookUpTypeApi;

};
