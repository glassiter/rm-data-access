/*
 * RMDataServer.js
 * 
 * Copyright 2016-2017, RouteMatch Software Inc.
 * 
 * A lightweight service (written in Node.js) that allows us to call stored procs directly from the client.
 *   -- Designed to connect to RouteMatch database (as of header creation date roughly ~29.845)
 *
 * Date     Who What
 * ======== === =================================================================================================
 * 08-09-16 MCF Iniital header creation.
 * 02-27-17 MCF Add basic support for multiple record sets 
 *            
 *
 */


// Load the http module to create an http server.
var http = require('http');
var url = require('url');
var sql = require('mssql');


//var SERVER = 'MFAULCON6540\\SQL_2008_R2';
var SERVER = 'GLASSITER6530\\MSSQLSERVERR2';
var PORT = 8001;

var USERNAME = 'pmuser';
var PASSWORD = 'pmtrip00';

// var USERNAME = 'glassiter';
// var PASSWORD = 'gl';

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


// Configure our HTTP server to handle input web requests.
    var server = http.createServer(function (request, response) {

    console.log('Incoming Request! -- url: ' + request.url);

    if (request.url === '/favicon.ico') {
        console.log(".ico file requested--ignored.");
        response.writeHead(200, { 'Content-Type': 'text/plain' });
        response.end(errMsg + '\n');        
        return;
    }

    var queryData = url.parse(request.url, true).query;

    if (queryData.agency == undefined || queryData.agency == '') {
        var errMsg = 'Agency Key not provided';
        console.log(errMsg);
        response.writeHead(400, { 'Content-Type': 'text/plain' });
        response.end(errMsg + '\n');
        return;
    }
    console.log('Agency: ' + queryData.agency);

    //-----------------------------------------------------------------
    // I am ONLY going to support Stored Procedures (at least at first)
    //-----------------------------------------------------------------

    // For now, this "sp" query param is required.
    if (queryData.sp == undefined || queryData.sp == '') {
        var errMsg = 'No Stored Proc provided';
        console.log(errMsg);
        response.writeHead(400, { 'Content-Type': 'text/plain' });
        response.end(errMsg + '\n');
        return;
    }
    
    // Build the database name (oversimplified)
    // Perhaps there should be some lookup table.
    var DATABASE = 'RM_' + queryData.agency;
    
    //var connectStr = 'mssql://' + USERNAME + ':' + PASSWORD + '@' + SERVER + '/' + DATABASE;
    //console.log('connectStr: ' + connectStr);

    var dbConfig = {
        server: SERVER,
        database: DATABASE,
        user: USERNAME,
        password: PASSWORD,
        // port: 1433,     
        port: 49725,
		
		// not needed
		options: {
		//   encrypt: true  // Use this if you're on Windows Azure 
             encrypt: false
		}
    };
        
    //var connection = new sql.Connection(dbConfig);
    //connection.connect().then(function () {
    //sql.connect(connectStr).then(function () {
    sql.connect(dbConfig).then(function () {
        console.log('CONNECTED');
        console.log('Stored Proc: ' + queryData.sp);

        // Create the Request object
        var sqlRequest = new sql.Request();

            // Add Parameters
       
            // ** This one is required for ALL **
        sqlRequest.input('ContextStr', sql.VarChar(255), RM_DB_CONTEXT);

            // ....... More Params (optional) ..........
        if (queryData.parms && queryData.parms != '') {

			//console.log('queryData.parms: ' + queryData.parms);
            // {paramName!paramType!paramValue}|{paramName!paramType!paramValue}|...

            var parmList = queryData.parms.split('|');
            for (var p in parmList) {
                console.log('parm [' + p + ']: ' + parmList[p]);

                var parmData = parmList[p].split('!');
				
                var parmName = parmData[INDEX_PARM_NAME];
                var parmType = parmTypeLookupTable[parmData[INDEX_PARM_TYPE]];
                var parmValue = parmData[INDEX_PARM_VALUE];
				
                // ** Special Case for Dates **
                if (parmType == sql.DateTime) {
					//console.log('date parmValue: ' + parmValue);
                    parmValue = new Date(parmValue);
					console.log('date parm value: ' + parmValue);
                }

                // ** Special Case for Empty Numerical Input **
                if (parmType == sql.Int) {
					if (!parmValue) {						
                        parmValue = NaN;
                    }
                }

                if (parmType == sql.TVP) {
                    console.log('handling table ...');
                    if (!parmValue) {
                        console.log('setting to empty table with on column [id] ... only supported implementation currently');
                        
                        var tvp = new sql.Table();                        
                        // Columns must correspond with type we have created in database.
                        tvp.columns.add('id', sql.Int);

                        parmValue = tvp;
                    }
                }

                //console.log('parmName: ' + parmName);
                //console.log('parmType: ' + parmType);
                //console.log('parmValue: ' + parmValue);
                sqlRequest.input(parmName, parmType, parmValue);
            }
        }
		
		console.log('executing proc: ' + queryData.sp);
        
        // Execute the stored proc
        //.execute('spGetStopTypes').then(function (recordsets) {
        sqlRequest.execute(queryData.sp).then(function (recordsets) {
		
           console.log('success');
           //console.dir(recordsets);

           var json;
     
           if (recordsets.length > 1) {

               // I now require support for multiple recordsets

              //    json = {
              //        'recordSets' : recordsets
              //    }

               // make 'features' the key for the data
               var recordSetList = [];

               for (var r = 0; r < recordsets.length; r++) {
                   recordSetList.push({ features: recordsets[r] });
               }

               json = { 'recordSets' : recordSetList };
           }
           else {

                // Support for only the first recordset
                var resultRecordSet = recordsets[0];
                
                // I want to add a query string argument that tells the server to only return particualr fields
                // For now, only support the 'fields' param when returning only one recordset
                if (queryData.fields) {
                
                    console.log('queryData.fields: ' + queryData.fields);			   
                    var fieldsArray = queryData.fields.split('|');
                    //console.log('fieldsArray size: ' + fieldsArray.length);
                    
                    for (var recordIndex in resultRecordSet) {
                        var record = resultRecordSet[recordIndex];
                        //console.log('record: ' + record);
                        //console.log(record);
                        
                        for (var key in record) {
                            //if (fieldsArray.includes(key) == false) {		// new but apparently not yet supported ...
                            if (fieldsArray.indexOf(key) == -1) {
                                delete record[key];
                            }
                        }
                        //console.log(record);
                    }
                }

                json = { features: resultRecordSet };
           }
            
           if (queryData.src) {
               console.log('queryData.src: ' + queryData.src);
               json.src = queryData.src;
           }

           // Perhaps there is a way that I can avoid this step (not sure how expensive it is ...)
           var jsonResponse = JSON.stringify(json);

            // Do I need this here?
           //console.log('request: ' + request);
           //console.log('request.headers: ' + request.headers);
           var originHeader = request.headers.origin;
           //console.log('originHeader: ' + originHeader);
           if (originHeader != undefined && originHeader != '') {
               console.log('Origin Header value: ' + originHeader);
               response.setHeader('Access-Control-Allow-Origin', originHeader);
           }

           response.writeHead(200, { 'Content-Type': 'application/json' });
           response.end(jsonResponse);

       }).catch(function (err) {
           // ... execute error checks
           console.log('execution error');
           console.log(err);

           response.writeHead(400, { 'Content-Type': 'text/plain' });
           response.end('Execution Problem\n\n' + err);
       });

    }).catch(function (err) {
        // ... connect error checks 
        console.log('connection error');
        console.log(err);

        response.writeHead(400, { 'Content-Type': 'text/plain' });
        response.end('Connection Problem\n\n' + err);
    });

});

// Listen on specified port, IP defaults to 127.0.0.1 (localhost)
server.listen(PORT);

// Put a friendly message on the terminal
console.log('Server running at http://127.0.0.1:' + PORT + '/');