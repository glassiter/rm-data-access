var express = require('express');

var app = express();
// confifure the server to parse the body
app.configure(function(){
    app.use(express.bodyParser());
});

// set up routing
require('./routes')(app);

// generic GET endpoint
app.get('/', function(req, res) {
  res.send('Hello VA!\n');
});

// start the server
app.listen(3001);
console.log('Listening on port 3001...');