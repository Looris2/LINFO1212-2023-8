var express = require('express'); 
var app = express();

app.set('view engine', 'ejs');
app.set('views', './static')

app.get('/', function (req, res) {
    res.render("index")
}); 

app.use(express.static('content')); 
app.listen(8080);
