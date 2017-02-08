import {Tenant} from "./models/Tenant";
import {Promise} from 'es6-promise';
//import {Moment} from 'moment';
const mysql = require('mysql');
const moment = require('moment');

const acctDetails = require('./acctDetails.json');

const pool = mysql.createPool({
    connectionLimit: acctDetails.connectionLimit,
    host: acctDetails.host,
    user: acctDetails.user,
    password: acctDetails.password,
    database: acctDetails.database
});

import {Config} from './models/Config';
import {StatusDetail} from './models/StatusDetail';
import {StatusEnum} from './models/StatusEnum';
import {User} from './models/User';
import {isNullOrUndefined} from "util";
import {StatusSummaryDaily} from "./models/StatusSummaryDaily";
import {stat} from "fs";

export class daHealthCheck {

    constructor() {
        this.init();
    }

    init() {

    }

    closePool() {
        pool.end(function (err) {
            // all connections in the pool have ended
        });
    };

    addTenant(tenant: Tenant): Promise<Number> {
        return new Promise(function (resolve, reject) {

            let query = 'INSERT INTO Tenants ';
            query += 'SET TNTName = ?, TNTCode = ?, TNTPrimaryUserID = ?, ';

            pool.query(query,
                [tenant.name,
                    tenant.code,
                    isNullOrUndefined(tenant.primaryUserID) ? null : tenant.primaryUserID],
                function (error, results, fields) {
                    if (error) {
                        reject(error);
                    } else {
                        resolve(results.insertId)
                    }
                });
        });
    };


    getTenantByID(tenantID: number): Promise<Tenant> {
        return new Promise(function (resolve, reject) {

            let query = 'SELECT TNTTenantID, TNTName, TNTCode, TNTPrimaryUserID ';
            query += 'FROM Tenants ';
            query += 'WHERE TNTTenantID = ?';

            pool.query(query,
                [tenantID],
                function (error, results, fields) {
                    if (error) {
                        reject(error);
                    } else {
                        resolve(results)
                    }
                });
        });
    };

    //TODO: CFGEmergencyContactGroupID
    addConfig(config: Config): Promise<Number> {
        return new Promise(function (resolve, reject) {

            let query = 'INSERT INTO Configs ';
            query += 'SET CFGTenantID = ?, CFGName = ?, CFGURI = ?, CFGEnabled = ?, ';
            query += 'CFGPollFrequencyInSeconds = ?, CFGMaxResponseTimeMS = ? ';

            pool.query(query,
                [config.tenantID,
                    config.name,
                    config.uri,
                    config.enabled,
                    config.pollFrequencyInSeconds,
                    config.maxResponseTimeMS
                ],
                function (error, results, fields) {
                    if (error) {
                        reject(error);
                    } else {
                        resolve(results.insertId)
                    }
                });
        });
    };

    updateConfig(config: Config) {
        return new Promise(function (resolve, reject) {

            let query = 'UPDATE Configs SET CFGName = ?, CFGURI = ?, CFGEnabled = ?, ';
            query += 'CFGPollFrequencyInSeconds = ?, CFGMaxResponseTimeMS = ? ';
            query += 'WHERE CFGConfigID = ? ';

            pool.query(query, [
                config.name,
                config.uri,
                config.enabled,
                config.pollFrequencyInSeconds,
                config.maxResponseTimeMS,
                config.configID
            ], function (error, results, fields) {
                if (error) {
                    reject(error);
                } else {
                    resolve(results)
                }
            });
        });
    };

    getConfigAll(): Promise<Config[]> {
        return new Promise(function (resolve, reject) {

            let query = 'SELECT CFGConfigID, CFGTenantID, CFGName, CFGURI, ';
            query += 'CFGEnabled, CFGPollFrequencyInSeconds, CFGMaxResponseTimeMS, ';
            query += 'CFGEmergencyContactGroupID ';
            query += 'FROM Configs ';

            pool.query(query,
                function (error, results, fields) {
                    if (error) {
                        reject(error);
                    } else {
                        let returnConfigs: Config[] = new Array<Config>();
                        for (let i = 0; i < results.length; i++) {
                            returnConfigs.push(daHealthCheck.mapMySQLResultsToConfig(results[i]));
                        }
                        resolve(returnConfigs);
                    }
                });
        });
    };

    getConfigByTenantID(tenantID: number): Promise <Config[]> {

        let query = 'SELECT CFGConfigID, CFGTenantID, CFGName, CFGURI, ';
        query += 'CFGEnabled, CFGPollFrequencyInSeconds, CFGMaxResponseTimeMS, ';
        query += 'CFGEmergencyContactGroupID ';
        query += 'FROM Configs ';
        query += 'WHERE CFGTenantID = ?';

        return new Promise(function (resolve, reject) {
            pool.query(query,
                tenantID,
                function (error, results, fields) {
                    if (error) {
                        reject(error);
                    } else {
                        let returnConfigs = [];
                        for (let i = 0; i < results.length; i++) {
                            returnConfigs.push(daHealthCheck.mapMySQLResultsToConfig(results[i]));
                        }
                        resolve(returnConfigs);
                    }
                });
        });
    };


    getConfigByName(tenantID: number, name: string): Promise <Config[]> {

        let query = 'SELECT CFGConfigID, CFGTenantID, CFGName, CFGURI, ';
        query += 'CFGEnabled, CFGPollFrequencyInSeconds, CFGMaxResponseTimeMS, ';
        query += 'CFGEmergencyContactGroupID ';
        query += 'FROM Configs ';
        query += 'WHERE CFGTenantID = ? AND CFGName LIKE ?';

        return new Promise(function (resolve, reject) {
            pool.query(query,
                [tenantID,
                    '%' + name + '%'],
                function (error, results, fields) {
                    if (error) {
                        reject(error);
                    } else {
                        let returnConfigs = [];
                        for (let i = 0; i < results.length; i++) {
                            returnConfigs.push(daHealthCheck.mapMySQLResultsToConfig(results[i]));
                        }
                        resolve(returnConfigs);
                    }
                });
        });
    };


    getConfigByID(tenantID: number, config: number): Promise <Config> {

        let query = 'SELECT CFGConfigID, CFGTenantID, CFGName, CFGURI, ';
        query += 'CFGEnabled, CFGPollFrequencyInSeconds, CFGMaxResponseTimeMS, ';
        query += 'CFGEmergencyContactGroupID ';
        query += 'FROM Configs ';
        query += 'WHERE CFGTenantID = ? AND CFGConfigID LIKE ?';

        return new Promise(function (resolve, reject) {
            pool.query(query,
                [tenantID, config],
                function (error, results, fields) {
                    if (error) {
                        reject(error);
                    } else {
                        resolve(daHealthCheck.mapMySQLResultsToConfig(results[0]));
                    }
                });
        });
    };

    addStatusDetail(statusDetail: StatusDetail): Promise<Number> {
        if (statusDetail.configID == null || statusDetail.configID < 1) {
            throw new Error('Invalid ConfigID');
        }
        return new Promise(function (resolve, reject) {

            let query = 'INSERT INTO StatusDetails SET ?';

            pool.query(query,
                {
                    DTAConfigID: statusDetail.configID,
                    DTADateTime: statusDetail.dateTime == null ? moment.now() : statusDetail.dateTime,
                    DTAPingResponseMS: statusDetail.pingResponseMS == null ? 1000 : statusDetail.pingResponseMS,
                    DTAStatus: statusDetail.status == null ? StatusEnum.Unknown : statusDetail.status
                },
                function (error, results, fields) {
                    if (error) {
                        reject(error);
                    } else {
                        resolve(results.insertId)
                    }
                });
        });
    };

    getStatusDetailsByTenantID(tenantID: number): Promise <StatusDetail[]> {

        return new Promise(function (resolve, reject) {

            let query = 'SELECT DTADataID, DTAConfigID, DTADateTime, DTAPingResponseMS, ';
            query += 'DTAStatus ';
            query += 'FROM StatusDetails ';
            query += 'JOIN Configs ON StatusDetails.DTAConfigID = Configs.CFGConfigID ';
            query += 'WHERE Configs.CFGTenantID = ?';

            pool.query(query,
                [tenantID],
                function (error, results, fields) {
                    if (error) {
                        reject(error);
                    } else {
                        let returnStatusDetails = [];
                        for (let i = 0; i < results.length; i++) {
                            returnStatusDetails.push(daHealthCheck.mapMySQLResultsToStatusDetail(results[i]));
                        }
                        resolve(returnStatusDetails);
                    }
                });
        });
    };

    getStatusDetailsByID(configID: number): Promise<StatusDetail[]> {

        return new Promise(function (resolve, reject) {

            let query = 'SELECT DTADataID, DTAConfigID, DTADateTime, DTAPingResponseMS, ';
            query += 'DTAStatus ';
            query += 'FROM StatusDetails ';
            query += 'WHERE DTAConfigID = ?';

            pool.query(query,
                [configID],
                function (error, results, fields) {
                    if (error) {
                        reject(error);
                    } else {
                        let returnStatusDetails = [];
                        for (let i = 0; i < results.length; i++) {
                            returnStatusDetails.push(daHealthCheck.mapMySQLResultsToStatusDetail(results[i]));
                        }
                        resolve(returnStatusDetails);
                    }
                });
        });
    };

    addStatusSummary(statusSummary: StatusSummaryDaily): Promise<Number> {
        return new Promise(function (resolve, reject) {
            if (isNullOrUndefined(statusSummary.configID)
                || isNullOrUndefined(statusSummary.date)
                || isNullOrUndefined(statusSummary.averagePingResponseMS)
                || isNullOrUndefined(statusSummary.status)
                || isNullOrUndefined(statusSummary.uptimePercent)
            ) {
                reject('Missing required information!');
            }

            let query = 'INSERT INTO StatusSummaryDaily SET ?';

            pool.query(query,
                {
                    SSDConfigID: statusSummary.configID,
                    SSDDate: statusSummary.date,
                    SSDAveragePingResponseMS: statusSummary.averagePingResponseMS,
                    SSDStatus: statusSummary.status,
                    SSDUptimePercent: statusSummary.uptimePercent
                },
                function (error, results, fields) {
                    if (error) {
                        reject(error);
                    } else {
                        resolve(results.insertId)
                    }
                });
        });
    };


    getStatusSummaryByTenantID(tenantID: number): Promise<StatusSummaryDaily[]> {
        return new Promise(function (resolve, reject) {

            let query = 'SELECT SSDStatusSummaryDailyID, SSDConfigID, SSDDate, SSDAveragePingResponseMS ';
            query += 'SSDStatus, SSDUptimePercent ';
            query += 'FROM StatusSummaryDaily ';
            query += 'JOIN Configs ON StatusSummaryDaily.SSDConfigID = Configs.CFGConfigID ';
            query += 'WHERE CFGTenantID = ? ';

            pool.query(query,
                [tenantID],
                function (error, results, fields) {
                    if (error) {
                        reject(error);
                    } else {
                        let returnStatusSummaryDaily = [];
                        for (let i = 0; i < results.length; i++) {
                            returnStatusSummaryDaily.push(daHealthCheck.mapMySQLResultsToStatusSummaryDaily(results[i]));
                        }
                        resolve(returnStatusSummaryDaily);
                    }
                });
        });
    }

    getStatusSummaryByConfigID(configID: number): Promise<StatusSummaryDaily[]> {
        return new Promise(function (resolve, reject) {

            let query = 'SELECT SSDStatusSummaryDailyID, SSDConfigID, SSDDate, SSDAveragePingResponseMS ';
            query += 'SSDStatus, SSDUptimePercent ';
            query += 'FROM StatusSummaryDaily ';
            query += 'WHERE SSDConfigID = ?';

            pool.query(query,
                [configID],
                function (error, results, fields) {
                    if (error) {
                        reject(error);
                    } else {
                        let returnStatusSummaryDaily = [];
                        for (let i = 0; i < results.length; i++) {
                            returnStatusSummaryDaily.push(daHealthCheck.mapMySQLResultsToStatusSummaryDaily(results[i]));
                        }
                        resolve(returnStatusSummaryDaily);
                    }
                });
        });
    }

    static mapMySQLResultsToConfig(val): Config {
        let newConfig = new Config;
        if (val) {
            newConfig.configID = val.CFGConfigID;
            newConfig.tenantID = val.CFGTenantID;
            newConfig.name = val.CFGName;
            newConfig.uri = val.CFGURI;
            newConfig.enabled = (val.CFGEnabled === 'true' || val.CFGEnabled === 1 || val.CFGEnabled) ? true : false;
            newConfig.pollFrequencyInSeconds = val.CFGPollFrequencyInSeconds;
            newConfig.maxResponseTimeMS = val.CFGMaxResponseTimeMS;
            newConfig.emergencyContactGroupID = val.CFGEmergencyContactGroupID;
        } else {
            return null;
        }
        return newConfig;
    }


    static mapMySQLResultsToStatusDetail(val): StatusDetail {
        let newStatusDetail = new StatusDetail();
        if (val) {
            newStatusDetail.dataID = val.DTADataID;
            newStatusDetail.configID = val.DTAConfigID;
            newStatusDetail.dateTime = val.DTADateTime;
            newStatusDetail.pingResponseMS = val.DTAPingResponseMS;
            newStatusDetail.status = val.DTAStatus;

        } else {
            return null;
        }
        return newStatusDetail;
    }


    static mapMySQLResultsToStatusSummaryDaily(val): StatusSummaryDaily {

        let newStatusSummaryDaily = new StatusSummaryDaily();
        if (val) {
            newStatusSummaryDaily.summaryID = Number(val.SSDStatusSummaryDailyID);
            newStatusSummaryDaily.configID = Number(val.SSDConfigID);
            newStatusSummaryDaily.date = val.SSDDate;
            newStatusSummaryDaily.averagePingResponseMS = val.SSDAveragePingResponseMS;
            newStatusSummaryDaily.status = val.SSDStatus;
            newStatusSummaryDaily.uptimePercent = val.SSDUptimePercent;
        } else {
            return null;
        }

        return newStatusSummaryDaily;
    }


}
