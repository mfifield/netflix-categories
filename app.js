// Simple server file that also generates the Netflix JSON data before starting
const gd = require('./backend/index'),
    express = require('express'),
    app = express();

gd.initialise().then(function () {
    // Serve up static files
    app.use('/', express.static(__dirname));
    app.listen(3000, () => {
        console.log('listening on port 3000');
    });
});