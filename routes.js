module.exports = function(app) {
    var auth = require('./controllers/auth');

    app.post('/auth', auth.auth);
    app.post('/login', auth.login);    
}