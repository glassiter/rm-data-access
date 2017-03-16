var debug = require("debug")('auth');

exports.auth = function(req, res) {
  res.send([{
    "id": 1,
    "name": "Max",
    "band": "Maximum Pain",
    "instrument": "guitar"
  }]);
};
   

exports.login = function(req, res) {
  var dataaccess = require('../data-access.js');  

  var dbConnection = {
      server: 'GLASSITER6530\\MSSQLSERVERR2',
      port: 49725,
      database: 'RM_PA_DuFast',
      proc: 'spFRGetHeadwayInformation',
      params: [
        {
          name: "Date",
          type: dataaccess.sqlType.Date,
          value: 'Date!dt!Tue Feb 28 2017 07:31:03 GMT-0500 (Eastern Standard Time)'
        },
        {
          name: "SubrouteIDs",
          type: dataaccess.sqlType.Table,
          value: ''
        }    
      ]
  };
  
//  dataaccess.rmSql('GLASSITER6530\\MSSQLSERVERR2',49725,'RM_PA_DuFast','spFRGetHeadwayInformation','Date!dt!Tue Feb 28 2017 07:31:03 GMT-0500 (Eastern Standard Time)|SubrouteIDs!t!')
  dataaccess.connection = dbConnection;
  dataaccess.rmSql()
  .then((results) => {
    res.send(results);    
    debug("Successful execution from data-access:  ");    
  })
  .catch((err) => {
    debug("Error received from data-access:  " + err);
  }); 
};
