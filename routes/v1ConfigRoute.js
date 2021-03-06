"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var util_1 = require("util");
var express = require('express');
//TODO: get tenant from UserID
//module.exports = function (healthCheck: daHealthCheck) {
module.exports = function (tenantID, sequelize) {
    var Seq = require('sequelize');
    var returnRouter = express.Router();
    var model = sequelize['config'];
    returnRouter.get('/', function (req, res) {
        model.findAll({})
            .then(function (response) {
            res.json(response);
        })
            .catch(function (err) {
            res.json(err);
        });
    });
    returnRouter.get('/:id', function (req, res) {
        //config.find({where: {id: req.params.id, tenantID: tenantID}})
        model.find({ where: { id: req.params.id } })
            .then(function (response) {
            console.log('Account located for id ' + req.params.id);
            if (util_1.isNullOrUndefined(response)) {
                res.json({});
            }
            else {
                res.json(response);
            }
        })
            .catch(function (err) {
            console.log('An error occurred while searching for account ' + req.params.id);
            res.status(500).end();
        });
    });
    returnRouter.post('/', function (req, res) {
        var newConfig = {
            enabled: req.body.enabled,
            pollFrequencyInSeconds: req.body.pollFrequencyInSeconds,
            degradedResponseTimeMS: req.body.degradedResponseTimeMS,
            failedResponseTimeMS: req.body.failedResponseTimeMS,
            expectedResponseCode: req.body.expectedResponseCode,
            uri: req.body.uri,
            name: req.body.name,
            port: req.body.port,
            protocol: req.body.protocol,
            path: req.body.path
        };
        console.log(newConfig);
        model.create(newConfig)
            .then(function (response) {
            res.json(response);
        })
            .catch(Seq.ValidationError, function (err) {
            console.log('val error');
            for (var i = 0; i < err.errors.length; i++) {
                console.log(err.errors[i].path + ': ' + err.errors[i].message);
            }
            // responds with validation errors
            res.json({ success: false });
        })
            .catch(function (err) {
            console.log(err);
            res.json({ success: false });
        });
    });
    returnRouter.put('/:id', function (req, res) {
        var newConfig = {
            enabled: req.body.enabled,
            pollFrequencyInSeconds: req.body.pollFrequencyInSeconds,
            degradedResponseTimeMS: req.body.degradedResponseTimeMS,
            failedResponseTimeMS: req.body.failedResponseTimeMS,
            expectedResponseCode: req.body.expectedResponseCode,
            uri: req.body.uri,
            name: req.body.name,
            port: req.body.port,
            protocol: req.body.protocol,
            path: req.body.path
        };
        model.update(newConfig, { where: { id: req.params.id } })
            .then(function (response) {
            res.json(response);
        })
            .catch(function (err) {
            res.json(err);
        });
    });
    returnRouter.delete('/:id', function (req, res) {
        model.destroy({ where: { id: req.params.id } })
            .then(function (response) {
            res.json(response);
        })
            .catch(function (err) {
            res.json(err);
        });
    });
    returnRouter.patch('/:id', function (req, res) {
        var patchObjectProperties = require('./helperLibrary/patchObjectProperties');
        var patchObject = patchObjectProperties(req.body, model);
        model.update(patchObject, { where: { id: req.params.id } })
            .then(function (response) {
            res.json(response);
        })
            .catch(function (err) {
            res.json(err);
        });
    });
    return returnRouter;
};
