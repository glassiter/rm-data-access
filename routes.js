module.exports = function(app) {
    var auth = require('./controllers/auth');
    var alert = require('./controllers/alert');    

    app.post('/auth', auth.auth);
    app.post('/login', auth.login);    
    app.post('/alert', alert.alerts);        
}