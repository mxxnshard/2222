const express = require("express");
const MongoClient = require("mongodb").MongoClient;
const objectId = require("mongodb").ObjectID;
const bodyParser = require("body-parser");
const hbs = require("express-handlebars");
const app = express();
const jsonParser = express.json();
 
const mongoClient = new MongoClient("mongodb://localhost:27017/", { useUnifiedTopology: true });
const urlencodedParser = bodyParser.urlencoded({extended: false});
 
let dbClient;
 
app.engine("hbs", hbs(
    {
        layoutsDir: "build", 
        defaultLayout: null,
        extname: "hbs"
    }
))

app.set('views', './build');
app.set("view engine", "hbs");
app.use(express.static(__dirname + "/src"));
 
mongoClient.connect(function(err, client){
    if(err) return console.log(err);
    dbClient = client;
    app.locals.collection = client.db("clientsdb").collection("clients");
    app.listen(9000, function(){
        console.log("Сервер ожидает подключения на 9000...");
    });
});

app.use('/assets', express.static('build/assets'));

app.get("/", function (request, response) {
    response.render("main.hbs");
});

app.get("/signin", function (request, response) {
    response.render("signin.hbs");
});

app.get("/main", function (request, response) {
    response.render("main.hbs");
});

app.get("/about", function (request, response) {
    response.render("about.hbs");
});

app.get("/admin", function (request, response) {
    response.render("admin.hbs");
});


app.post("/signin", urlencodedParser, function (request, response) {
    if(!request.body) return response.sendStatus(400);
    const db = mongoClient.db("clientsdb");
    const collection = db.collection("clients");
    collection.findOne({name: request.body.userName, password: request.body.userPassword}, function(err, results){
        if(results != null){
            response.render(__dirname+"/build/lk.hbs", {
                name: request.body.userName,
                password: request.body.userPassword,
        email: results.email, 
        surname: results.surname, 
        phone: results.phone, 
        itn: results.itn
            });
        }
        else{
            response.sendFile(__dirname+"/build/signin.hbs");
        }
    });
});

app.get("/api/users", function(req, res){
        
    const collection = req.app.locals.collection;
    collection.find({}).toArray(function(err, users){
         
        if(err) return console.log(err);
        res.send(users)
    });
     
});
app.get("/api/users/:id", function(req, res){
        
    const id = new objectId(req.params.id);
    const collection = req.app.locals.collection;
    collection.findOne({_id: id}, function(err, user){
               
        if(err) return console.log(err);
        res.send(user);
    });
});
   
app.post("/api/users", jsonParser, function (req, res) {
       
    if(!req.body) return res.sendStatus(400);
       
    const userName = req.body.name;
    const userPassword = req.body.password;
    const userEmail = req.body.email;
    const userSurname = req.body.surname;
    const userPhone = req.body.phone;
    const userInn = req.body.inn;
    const user = {name: userName, password: userPassword, email: userEmail, surname: userSurname, phone: userPhone, inn: userInn};
       
    const collection = req.app.locals.collection;
    collection.insertOne(user, function(err, result){
               
        if(err) return console.log(err);
        res.send(user);
    });
});
    
app.delete("/api/users/:id", function(req, res){
        
    const id = new objectId(req.params.id);
    const collection = req.app.locals.collection;
    collection.findOneAndDelete({_id: id}, function(err, result){
               
        if(err) return console.log(err);    
        let user = result.value;
        res.send(user);
    });
});
   
app.put("/api/users", jsonParser, function(req, res){
        
    if(!req.body) return res.sendStatus(400);
    const id = new objectId(req.body.id);
    const userName = req.body.name;
    const userPassword = req.body.password;
    const userEmail = req.body.email;
    const userSurname = req.body.surname;
    const userPhone = req.body.phone;
    const userInn = req.body.inn;
       
    const collection = req.app.locals.collection;
    collection.findOneAndUpdate({_id: id}, { $set: {password: userPassword, name: userName, email: userEmail, surname: userSurname, phone: userPhone, inn: userInn}},
         {returnOriginal: false },function(err, result){
               
        if(err) return console.log(err);     
        const user = result.value;
        res.send(user);
    });
});

app.get("/exh", function(request, response){
    const db = mongoClient.db("newsDB");
    const collection = db.collection("news");
    collection.find({}).toArray(function(err, news){
    response.render("exh.hbs", {
            news: news
      });
    });
});

app.get("/admin-exh", function (request, response) {
    response.render("admin-exh.hbs");
});

app.post("/admin-exh", urlencodedParser, function (request, response) {
    const userPos = request.body.pos;
    const userName = request.body.name;
    const userText = request.body.text;

    const user = {pos: userPos, name: userName, text: userText};
    const db = mongoClient.db("newsDB");
    const collection = db.collection("news");
    collection.insertOne(user, function(err, result){
        if(err) return console.log(err);
        response.render(__dirname+"/src/admin-exh.hbs", {
        });
    });
});


// прослушиваем прерывание работы программы (ctrl-c)
process.on("SIGINT", () => {
    dbClient.close();
    process.exit();
});
