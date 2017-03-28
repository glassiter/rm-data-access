# rm-data-access
A simple module to access RM databases and stored prodedures.

Installation
=================
To install using npm.

    npm install rm-data-access --save-dev
    
Usage
=================
The steps to call a procedure is to:
1.  Create a data-access object

<code>var dataaccess = require('data-access');</code>

2.  Attach a prepopulated connection object with the parameters you require for the call.

<code>dataaccess.connection = {<connection properties>};</code>

3.  Call dataaccess.rmSql() <b>then</b> wait for the results or <b>catch</b> the error.

<code>dataaccess.rmSql()
  .then((results) =>{})
  .catch((error) => {})
</code>
    
Example
------------
The following will access the <b>RM_PA_DuFast</b> database on the <b>GLASSITER65530\\MSSQLSERVERR2</b> server, calling the <b>spAlertActualsGetByDateRange2</b>
with the following paramaters:
* @AgencyId INT = 1
* @StartDateTime  DATE = '2017-03-27 05:26:22'
* @EndDateTime    DATE = '2017-03-27 05:26:22'
* @ProfileTypeId  INT = 3

using default options:

    var debug = require("debug")('alert');

    exports.alerts = function(req, res) {
    var dataaccess = require('../data-access.js');  

      var dbConnection = {
          server: 'GLASSITER6530\\MSSQLSERVERR2',
          database: 'RM_PA_DuFast',
          proc: 'spAlertActualsGetByDateRange2',
          params: [
            {
              name: "AgencyID",
              type: dataaccess.sqlType.Number,
              value: 1
            },
            {
              name: "StartDateTime",
              type: dataaccess.sqlType.Date,
              value: new Date('2017-03-27 05:26:22')
            },
            {
              name: "EndDateTime",
              type: dataaccess.sqlType.Date,
              value: new Date('2017-03-27 13:26:22')
            },
            {
              name: "ProfileTypeId",
              type: dataaccess.sqlType.Number,
              value: 3
            }                     
          ]
      };

      dataaccess.connection = dbConnection;
      dataaccess.rmSql()
      .then((results) => {
        var json = JSON.parse(results);

        debug("Successful execution from data-access:  ");    
        debug("results:  " + results);

        res.send({"results" : json});        
      })
      .catch((err) => {
        debug("Error received from data-access:  " + err);
      }); 
    };
    
Defaults
-------------
The module uses these defaults when connecting to a database:

    exports.SERVER = 'GLASSITER6530\\MSSQLSERVERR2';
    exports.CONTEXT = ':V:^RMDataAccess#0.00^:Z:^&N&#RMBus#&S&#L#&UID&#13#&AGN&#1#^';
    exports.USERNAME = 'pmuser';
    exports.PASSWORD = 'pmtrip00';
    exports.PORT = 49725;
    
These exports can be overriden by modifying the exported property.

    exports.USERNAME = 'geemony';

Supplying a corresponding property to the connection object will use the connection object's property when making the call.

