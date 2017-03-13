/*
 * data-access.js
 * 
 * Copyright 2016-2017, RouteMatch Software Inc.
 * 
 * A lightweight service (written in Node.js) that allows us to call stored procs directly from the client.
 *   -- Designed to connect to RouteMatch database (as of header creation date roughly ~29.845)
 *
 * Date     Who What
 * ======== === =================================================================================================
 *
 */

exports.rmSql = function (agency, spName, params) {
  var debug = require("debug")('data-access');

    debug('booting');
  
  return new Promise((resolve,reject) => {
    var sql = require('mssql');

    var SERVER = 'GLASSITER6530\\MSSQLSERVERR2';
    var PORT = 8001;

    var USERNAME = 'pmuser';
    var PASSWORD = 'pmtrip00';

    var RM_DB_CONTEXT = ':V:^RMDataAccess#0.00^:Z:^&N&#RMBus#&S&#L#&UID&#13#&AGN&#1#^';

    var INDEX_PARM_NAME = 0;
    var INDEX_PARM_TYPE = 1;
    var INDEX_PARM_VALUE = 2;

    var parmTypeLookupTable = {

      //"n": sql.Int,

      //"s": sql.VarChar(255),
      //"s50": sql.VarChar(50),
      //"s100": sql.VarChar(100),
      //"s255": sql.VarChar(255),

      //"d": sql.",

      "s": sql.NVarChar,
      "n": sql.Int,
      "b": sql.Bit,
      "dt": sql.DateTime,
      "d": sql.Float,
      "t": sql.TVP,

      "String": sql.NVarChar,
      "Number": sql.Int,
      "Boolean": sql.Bit,
      "Date": sql.DateTime,
      "Double": sql.Float,
      "Table": sql.TVP
    };

    var DATABASE = 'RM_' + agency;

    var dbConfig = {
        server: SERVER,
        database: DATABASE,
        user: USERNAME,
        password: PASSWORD,
        port: 49725,

        options: {
          encrypt: false
        }
    };

    // connect to database
    sql.connect(dbConfig).then(function () {
      debug('CONNECTED');
      debug('Stored Proc: ' + spName);

      // add Parametersa
      var sqlRequest = new sql.Request();
      sqlRequest.input('ContextStr', sql.VarChar(255), RM_DB_CONTEXT);
      if (params) {

        var parmList = params.split('|');
        for (var p in parmList) {
          debug('parm [' + p + ']: ' + parmList[p]);

          var parmData = parmList[p].split('!');

          var parmName = parmData[INDEX_PARM_NAME];
          var parmType = parmTypeLookupTable[parmData[INDEX_PARM_TYPE]];
          var parmValue = parmData[INDEX_PARM_VALUE];

          // special Case for Dates
          if (parmType == sql.DateTime) {
            parmValue = new Date(parmValue);
            debug('date parm value: ' + parmValue);
          }

          // special Case for Empty Numerical Input
          if (parmType == sql.Int) {
            if (!parmValue) {
              parmValue = NaN;
            }
          }

          if (parmType == sql.TVP) {
            debug('handling table ...');
            if (!parmValue) {
              debug('setting to empty table with on column [id] ... only supported implementation currently');

              var tvp = new sql.Table();
              tvp.columns.add('id', sql.Int);

              parmValue = tvp;
            }
          }

          sqlRequest.input(parmName, parmType, parmValue);
        }
      }

      debug('executing proc: ' + spName);

      // Execute the stored proc
      sqlRequest.execute(spName)
        .then(function (recordsets) {
        debug('success');

        var json;
        if (recordsets.length > 1) {
          // make 'features' the key for the data
          var recordSetList = [];
          for (var r = 0; r < recordsets.length; r++) {
            recordSetList.push({
              features: recordsets[r]
            });
          }

          json = {
            'recordSets': recordSetList
          };
        } 
        else {
          // Support for only the first recordset
          var resultRecordSet = recordsets[0];

          // // I want to add a query string argument that tells the server to only return particualr fields
          // // For now, only support the 'fields' param when returning only one recordset
          // if (queryData.fields) {

          //   debug('queryData.fields: ' + queryData.fields);
          //   var fieldsArray = queryData.fields.split('|');
          //   //debug('fieldsArray size: ' + fieldsArray.length);

          //   for (var recordIndex in resultRecordSet) {
          //     var record = resultRecordSet[recordIndex];
          //     //debug('record: ' + record);
          //     //debug(record);

          //     for (var key in record) {
          //       //if (fieldsArray.includes(key) == false) {		// new but apparently not yet supported ...
          //       if (fieldsArray.indexOf(key) == -1) {
          //         delete record[key];
          //       }
          //     }
          //     //debug(record);
          //   }
          // }

          json = {
            features: resultRecordSet
          };
        }

        resolve(JSON.stringify(json));
      })
      .catch(function (err) {
        // ... execute error checks
        debug('execution error');
        debug(err);

        reject(Error("Execution error in data-access.js:  " + err));
      });
    })
    .catch(function (err) {
      // ... connect error checks 
      debug('connection error');
      debug(err);

        reject(Error("Connection error in data-access.js:  " + err));
    });
  });
}
