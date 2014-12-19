var express    = require('express');
var app        = express();
var bodyParser = require('body-parser');
var qr         = require('qr-image');
var mongoose   = require('mongoose');
var uuid       = require('node-uuid');

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

var port = 8124; 		// set our port

var router = express.Router(); 				// get an instance of the express Router

mongoose.connect('mongodb://localhost:27017/docStore', function (error) {
  if (error) {
    console.log(error);
  }
});

var DocumentSchema = new mongoose.Schema({
  documentId: String,
  documentType: String,
  documentFields: [{
  "fieldName": String,
  "fieldValue": mongoose.Schema.Types.Mixed
}]
});
var Document = mongoose.model('documents', DocumentSchema);

router.post('/documents', function(req, res) {
  var document = new Document();
  document.documentId = uuid.v4();
  document.documentType = req.body.documentType;
  document.documentFields = req.body.documentFields;
  document.save(function(err, document){
    var hostname = req.headers.host;
    var url = "http://"+hostname+"/documents/"+document.documentId;
    var img = qr.image(url, {type:'png'});
    var buffers = [];
    var encodedData;
    img.on('data', function(data){buffers.push(data);});
    img.on('end', function(){
      encodedData = Buffer.concat(buffers);
      var data = "data:image/png;base64," + 
                 encodedData.toString('base64');
      res.status(201).set("image/png").send(data).end();      
    });
  });
});

router.get('/documents/:documentId', function(req, res) {
  Document.findOne({"documentId": req.params.documentId},"documentType documentFields", function(err, document){
    res.status(200).json(document).end();
  });
});

// more routes for our API will happen here
// REGISTER OUR ROUTES -------------------------------
// all of our routes will be prefixed with /api
app.use('/api', router);

// START THE SERVER
// =============================================================================
app.listen(port);
