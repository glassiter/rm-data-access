var debug = require("debug")('alert');

exports.alerts = function(req, res) {
  var dataaccess = require('../data-access.js');  

  var dbConnection = {
      server: 'GLASSITER6530\\MSSQLSERVERR2',
      database: 'RM_PA_DuFast',
      port: 49725,      
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
