"use strict";
var express = require("express");
var bodyParser = require("body-parser");
var jwt = require("express-jwt");
var acctDetails = require('./devHelper/acctDetails.json');
var sequelize = require('./dataAccess/createDBSequelize');
var jwtCheck = jwt({
    secret: acctDetails.auth0Secret,
    audience: acctDetails.auth0ClientID
});
var port = process.env.PORT || 3000;
var deploymentType = process.env.NODE_ENV || 'development';
var app = express();
var authRouter = express.Router();
var publicRouter = express.Router();
app.use(bodyParser.json({ type: "application/json" }));
var corsConfig = require('./corsConfig');
app.use(corsConfig);
//region Routes
var v1ConfigRoute = require('./routes/v1ConfigRoute');
authRouter.use('/v1/config', v1ConfigRoute('abc', sequelize));
//authRouter.use('/v1/config', v1HealthCheckRoute(healthCheck));
//endregion
//app.use('/api', jwtCheck);
app.use('/api', authRouter);
//app.use('/api', publicRouter);
app.listen(port);
console.log('Magic happens on port ' + port);
module.exports = app;
