var express = require('express');
var cors = require("cors");

var app = express();
app.use(cors());

// confifure the server to parse the body
app.configure(function(){
    app.use(express.bodyParser());
});

// set up routing
require('./routes')(app);

// generic GET endpoint
app.get('/', function(req, res,next) {
  res.send('Hello VA!\n');
});

// start the server
app.listen(3001);
console.log('Listening on port 3001...');