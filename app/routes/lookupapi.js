var jwt = require('jsonwebtoken');
var config = require('../../config');
var LookUpData = require('../models/lookup');
var LookUpType = require('../models/lookupType');
var mongoose = require('mongoose');
var _ = require('underscore');


module.exports = function(app, express) {

    var lookUpApi = express.Router();

    lookUpApi.use(function(req, res, next) {

        var TOKEN_SECRET_STRING = config.secret;

        console.log(req.url);
        console.log('call reached the node server for lookup api calls');

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

    lookUpApi.route('/:serviceprovider_id/:lookup_type')
        .get(function(req, res) {
            if (req.params.lookup_type === 'undefined') {

                LookUpData.find({
                    $or: [{ serviceProviderId: req.params.serviceprovider_id }, { serviceProviderId: null }],
                    // effectiveFrom: { $lt: new Date() },
                    // effectiveTo: { $gt: new Date() }
                }, function(err, values) {
                    if (err) {
                        res.send(err);
                    }
                    for (var i = 0; i < values.length; i++) {
                        if (values[i].subCategory.length != 0) {
                            for (var j = 0; j < values[i].subCategory.length; j++) {
                                values.push(values[i].subCategory[j]);
                            }
                        }
                    }

                    LookUpType.find({}).lean().exec(function(err, lookupTypes) {
                        

                        for (i = 0; i < lookupTypes.length; i++) {
                            for (j = 0; j < values.length; j++) {
                                if (values[j].type == lookupTypes[i].name) { console.log(lookupTypes[i].visible)
                                    values[j].visible = lookupTypes[i].visible;
                                }
                            }
                        }

                        console.log(values);

                        if (!req.decoded.corporateLogin) {
                            values = _.reject(values, function(obj) {
                                return obj.visible == false;
                            });
                        }


                        //console.log(values);
                        res.json(values);

                    });

                });
                return;
            }

            LookUpData.find({
                //$or:[{$and:[{serviceProviderId: req.params.serviceprovider_id},{type: req.params.lookup_type}]},{$and:[{serviceProviderId: null},{type: req.params.lookup_type}]}],
                $or: [{ serviceProviderId: req.params.serviceprovider_id }, { serviceProviderId: null }],
                type: req.params.lookup_type,
                isEnabled: true,
                $and: [{

                    $or: [
                        { effectiveFrom: { $lt: new Date() } },
                        { effectiveFrom: null }
                    ]

                }, {
                    $or: [
                        { effectiveTo: { $gt: new Date() } },
                        { effectiveTo: null }
                    ]

                }],

                //effectiveFrom: { $lt: new Date() },
                //effectiveTo: { $gt: new Date() }
            }, function(err, values) {
                console.log(values)
                if (err) {
                    res.send(err);
                }
                res.json(values);
            });

        })
        .post(function(req, res) {
            var entity = new LookUpData();
            if (req.params.serviceprovider_id == "null") {
                req.params.serviceprovider_id = null;
            }
            if (req.body.isSubcategory == "Yes") { 
                LookUpData.find({         
                    value: req.body.parentlookupValue,                          
                    type: req.params.lookup_type,
                    isEnabled: true,
                    $and:[{
                     $or: [{
                        effectiveFrom: { $lt: new Date() },
                        effectiveTo: { $gt: new Date() }
                        
                    }, {
                        effectiveFrom: null,
                        effectiveTo: null                           
                    }]
                    },{
                        $or:[{ serviceProviderId: req.params.serviceprovider_id},{ serviceProviderId: null}]
                    }] 
                }, function(err, values) {
                    if (err) {
                        res.send(err);
                    }
                    if (values.length != 0) {
                        LookUpData.find({
                            $or: [{
                                $and: [{ value: req.body.parentlookupValue }, {
                                    subCategory: {
                                        $elemMatch: {
                                            value: req.body.lookupValue
                                        }
                                    }
                                }]
                            }, { value: req.body.lookupValue, type: req.params.lookup_type }]

                        }, function(err, subValue) {
                            if (subValue.length == 0) {
                                var subentity = new LookUpData();
                                subentity.value = req.body.lookupValue;
                                subentity.type = req.body.ChildLookUp;
                                subentity.description = req.body.description;
                                subentity.serviceProviderId = req.params.serviceprovider_id;
                                subentity.isEnabled = req.body.isEnabled;
                                subentity.effectiveFrom = req.body.effectiveFrom;
                                subentity.effectiveTo = req.body.effectiveTo;
                                LookUpData.update({
                                    $or:[{serviceProviderId: req.params.serviceprovider_id},{serviceProviderId: null}],
                                   
                                    type: req.params.lookup_type,
                                    value: req.body.parentlookupValue
                                }, {
                                    $push: {
                                        subCategory: subentity
                                    }
                                }, function(err) {
                                    if (err) {
                                        console.log(err);
                                        if (err.code == 11000)
                                            return res.json({
                                                success: false,
                                                message: 'A lookup value already exists. '
                                            });
                                    }
                                    res.send({
                                        success: true,
                                        message: 'Child Lookup value Added'
                                    });
                                });
                            } else {
                                return res.json({
                                    success: false,
                                    message: 'A lookup value already exists. '
                                });
                            }

                        });


                    } else {
                        res.send({
                            success: false,
                            message: 'Please add Lookup Type value for Parent Lookup Type'
                        });
                    }
                });
            } else {
                console.log(req.params)
                LookUpData.find({
                    $or: [{ serviceProviderId: req.params.serviceprovider_id }, { serviceProviderId: null }],
                    type: req.params.lookup_type,
                    subCategory: {
                        $elemMatch: {
                            value: req.body.lookupValue
                        }
                    }
                }, function(err, value) {
                    if (err) {
                        if (err.code == 11000)
                            return res.json({
                                success: false,
                                message: 'A lookup value already exists. '
                            });
                    }

                    if (value.length == 0) {
                        entity.value = req.body.lookupValue;
                        entity.type = req.params.lookup_type;
                        entity.description = req.body.description;
                        entity.serviceProviderId = req.params.serviceprovider_id;
                        entity.isEnabled = req.body.isEnabled;
                        entity.effectiveFrom = req.body.effectiveFrom;
                        entity.effectiveTo = req.body.effectiveTo;
                        entity.save(function(err) {
                            if (err) {
                                if (err.code == 11000)
                                    return res.json({
                                        success: false,
                                        message: 'A lookup value already exists. '
                                    });
                            }
                            res.json({
                                success: true,
                                message: 'Lookup value created!'
                            });
                        });
                    } else {
                        res.json({
                            success: false,
                            message: 'A lookup value already exists.'
                        });
                    }
                });

            }


        }).put(function(req, res) {

            LookUpData.find({
                $or: [{ serviceProviderId: req.params.serviceprovider_id }, { serviceProviderId: null }],
                value: req.body.lookupValue,
                _id: { $ne: req.body.id }
            }, function(err, values) {
                if (err) {
                    res.send(err);
                }
                if (values.length == 0) {

                    LookUpData.find({
                        $or: [{ serviceProviderId: req.params.serviceprovider_id }, { serviceProviderId: null }],
                        _id: req.body.id
                    }, function(err, value) {
                        if (err) {
                            res.send(err);
                        }
                        if (value.length != 0) {
                            LookUpData.update({
                                $or: [{ serviceProviderId: req.params.serviceprovider_id }, { serviceProviderId: null }],
                                _id: req.body.id
                            }, {
                                $set: {
                                    value: req.body.lookupValue,
                                    type: req.params.lookup_type,
                                    description: req.body.description,
                                    isEnabled: req.body.isEnabled,
                                    effectiveFrom: req.body.effectiveFrom,
                                    effectiveTo: req.body.effectiveTo
                                }
                            }, function(err) {

                                if (err) {
                                    console.log(err);
                                    res.send(err);
                                }

                                res.send({
                                    success: true,
                                    message: 'Lookup Updated'
                                });
                            });
                        } else {
                            LookUpData.find({
                                subCategory: {
                                    $elemMatch: {
                                        "_id": { $ne: new mongoose.mongo.ObjectId(req.body.id) },
                                        serviceProviderId: req.params.serviceprovider_id,
                                        value: req.body.lookupValue
                                    }
                                }
                            }, function(err, subValues) {
                                if (err) {
                                    res.send(err);
                                }
                                if (subValues.length == 0) {
                                    LookUpData.find({
                                        subCategory: {
                                            $elemMatch: {
                                                "_id": new mongoose.mongo.ObjectId(req.body.id),
                                                serviceProviderId: req.params.serviceprovider_id
                                            }
                                        }
                                    }, function(err, subValue) {
                                        if (err) {
                                            res.send(err);
                                        }
                                        LookUpData.update({
                                            "_id": subValue[0]._id,
                                            "subCategory._id": new mongoose.mongo.ObjectId(req.body.id)
                                        }, {
                                            $set: {
                                                "subCategory.$.value": req.body.lookupValue,
                                                "subCategory.$.type": req.body.ChildLookUp,
                                                "subCategory.$.description": req.body.description,
                                                "subCategory.$.serviceProviderId": req.params.serviceprovider_id,
                                                "subCategory.$.isEnabled": req.body.isEnabled,
                                                "subCategory.$.effectiveFrom": req.body.effectiveFrom,
                                                "subCategory.$.effectiveTo": req.body.effectiveTo
                                            }
                                        }, function(err) {
                                            if (err) {
                                                res.send(err);
                                            }
                                            res.send({
                                                success: true,
                                                message: 'Lookup Updated'
                                            });
                                        });
                                    });
                                } else {
                                    res.json({
                                        success: false,
                                        message: 'A lookup value already exists. '
                                    });
                                }

                            });
                        }

                    });


                } else {
                    res.json({
                        success: false,
                        message: 'A lookup value already exists. '
                    });
                }
            });
        })


    lookUpApi.route('/appointmentDefinition/:serviceprovider_id/:id')
        .get(function(req, res) {
            LookUpData.find({
                $or: [{ $and: [{ _id: req.params.id }, { serviceProviderId: req.params.serviceprovider_id }] }, { $and: [{ _id: req.params.id }, { serviceProviderId: null }] }]

            }, function(err, subcategories) {
                if (err) {
                    res.send(err);
                }
                res.json(subcategories);
            });

        })

    lookUpApi.route('/:serviceprovider_id/:id')
        .delete(function(req, res) {

            LookUpData.find({
                subCategory: {
                    $elemMatch: {
                        "_id": new mongoose.mongo.ObjectId(req.params.id),
                        $or: [{ serviceProviderId: req.params.serviceprovider_id }, { serviceProviderId: null }]
                    }
                }
            }, function(err, subValue) {
                if (err) {
                    res.send(err);
                }
                if (subValue.length != 0) {
                    LookUpData.update({
                        _id: subValue[0]._id
                    }, {
                        $pull: { subCategory: { _id: new mongoose.mongo.ObjectId(req.params.id) } }
                    }, function(err) {
                        if (err) {
                            res.send(err)
                        }
                        res.send({ message: 'Lookup Deleted' })
                    });
                } else {
                    LookUpData.remove({
                            _id: req.params.id,
                            $or: [{ serviceProviderId: req.params.serviceprovider_id }, { serviceProviderId: null }],
                        },
                        function(err) {
                            if (err) {
                                res.send(err)
                            }
                            res.send({ message: 'Lookup Deleted' })
                        })
                }
            })
        });

    lookUpApi.route('/:serviceprovider_id/lookup/:id')
        .get(function(req, res) {

            LookUpData.find({

                $or: [{ $and: [{ serviceProviderId: req.params.serviceprovider_id }, { _id: req.params.id }] }, { $and: [{ serviceProviderId: null }, { _id: req.params.id }] }]

            }, function(err, values) {
                if (err) {
                    res.send(err);
                }
                if (values.length == 0) {
                    LookUpData.find({
                        subCategory: {
                            $elemMatch: {
                                "_id": new mongoose.mongo.ObjectId(req.params.id)
                                    //"value":"testdaaata"
                            }
                        }
                    }, function(err, subValues) {
                        if (err) {
                            res.send(err);
                        }

                        res.json(subValues);
                    });
                } else {
                    res.json(values);
                }
            });

        });

    return lookUpApi;
};
