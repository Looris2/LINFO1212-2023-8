var express = require('express');
const session = require('express-session');
var app = express()

app.use(express.static('static'))

app.set('view engine', 'ejs')
app.set('views', './static')

app.get('/', function (req, res) {
    res.render("index")
});

app.listen(8080, () => {
    console.log('Serveur démarré sur le port 8080');
  });