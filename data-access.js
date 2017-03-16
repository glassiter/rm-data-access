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

var sql = require('mssql');

// config
exports.SERVER = 'GLASSITER6530\\MSSQLSERVERR2';
exports.CONTEXT = ':V:^RMDataAccess#0.00^:Z:^&N&#RMBus#&S&#L#&UID&#13#&AGN&#1#^';
exports.USERNAME = 'pmuser';
exports.PASSWORD = 'pmtrip00';
exports.PORT = 49725;

Object.freeze(exports.sqlType = {
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
    }); 

exports.connection = {
      server: exports.SERVER,
      database: null,    
      port: exports.PORT,
      proc: null,
      params: null,
      user: exports.USERNAME,
      password: exports.PASSWORD,
      context: exports.CONTEXT,

      options: {
        encrypt: false
      }
  };

exports.rmSql = function (server,port,database,proc,params,username,password,context) {
  var debug = require("debug")('data-access');  

  var options = Object.assign({
      server: server,      
      database: database,
      port: port,
      proc: proc,
      params: params,
      user: username,
      password: password,
      context: context
    }, arguments.length == 0 ? exports.connection : typeof server === "object" ? server : {});
  
  // default db config
  var dbConfig = {
      server: options.server,
      database: options.database,    
      port: options.port || PORT,
      proc: options.proc,
      params: options.params,
      user: options.user || exports.USERNAME,
      password: options.password || exports.PASSWORD,
      context: options.context || exports.CONTEXT,     

      options: {
        encrypt: false
      }
  };

  debug('dbConfig:  ',dbConfig);
  
  return new Promise((resolve,reject) => {
    var INDEX_PARM_NAME = 0;
    var INDEX_PARM_TYPE = 1;
    var INDEX_PARM_VALUE = 2;

    // connect to database
    sql.connect(dbConfig).then(function () {
      debug('CONNECTED');
      debug('Stored Proc: ' + dbConfig.proc);

      // add Parameters
      var sqlRequest = new sql.Request();
      sqlRequest.input('ContextStr', sql.VarChar(255), dbConfig.context);
      if (dbConfig.params) {
          for (let param of dbConfig.params) {
          var parmName = param.name;
          var parmType = param.type;
          var parmValue = param.value;
          debug('parm [' + parmName + '] (' + parmType + ') = ' + parmValue);          

          // special Case for Dates
          if (parmType === sql.DateTime) {
            parmValue = new Date(parmValue);
            debug('date parm value: ' + parmValue);
          }

          // special Case for Empty Numerical Input
          if (parmType == sql.Int) {
            if (!parmValue) {
              parmValue = NaN;
            }
          }

          if (parmType === sql.TVP) {
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

      debug('executing proc: ' + dbConfig.proc);

      // Execute the stored proc
      sqlRequest.execute(dbConfig.proc)
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
};