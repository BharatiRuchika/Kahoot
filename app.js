require('dotenv').config();
const express = require('express')
    ,session = require('express-session')
    ,jwt = require("jsonwebtoken")
    ,passport = require('passport')
    ,Auth0Stratagy = require('passport-auth0')
    ,massive = require('massive')
    ,bodyParser = require('body-parser')
    ,{Quiz} = require('./utils/quiz')
var createError = require('http-errors');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var cors = require("cors");
var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
var addQuizRouter = require('./routes/addQuiz');
var quizQuestionsRouter = require('./routes/quizQuestions');
// const http = require("http");
var mongo = require("./connection");
const { Socket } = require('socket.io');
mongo.connect();
var app = express();
app.use(cors({ credentials: true }));
// const socket = require('socket.io');
app.all('*', function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "X-Requested-With");
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  next();
});
app.use(function (req, res, next) {
  res.setHeader('Access-Control-Allow-Origin', "*");
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');
  res.setHeader('Access-Control-Allow-Credentials', true);
  next();
});
// const port = 5000;
const http = require("http").createServer();
const io = require("socket.io")(http);

var http_port = process.env.HTTP_PORT;
http.listen(http_port, () => {
  console.log("Server Is Running Port: " + http_port);
});
const users = {};
var clients = {};
var hosts={};
var socketArray=[];
var hostObject={};
var hostArray=[];
var host=0;
io.on('connection', socket => {
    console.log("socketid",socket.id);
//  currentConnections[socket.id] = { socket: socket };
    console.log("connection established");
    // io.sockets.emit('conn')
  socket.on('host-join', (data) => {
    host++;
    console.log("host",host);
    console.log("socketId",socket.id);
    // hostObject.hostId = socket.id;
    hostArray.push(socket.id);
    console.log("hostArray",hostArray);
    // hosts[socket.id] = socket.id;
    // socket["socketid"] = socket.id
    console.log("host join");
 
    console.log("data",data);
    var selectedPin = data.pin;
    io.sockets.emit('host-joined',{id:socket.id})
    // users[socket.id] = data.nickname;
   socket.join(selectedPin);  
  })
  
  socket.on('player-joined', (data) => {
  // users[socket.id] = data.nickname;
  // onlineUsers[username] = socket.id;
  users[socket.id] = socket.id;
  // socket["username"] = username;
  // socket["socketid"] = socket.id;
    console.log("player joined");
    console.log("data",data);
   console.log("player",socket.id);
  var nickname = data.nickname;
  console.log("nickname",nickname);
  var selectedPin = data.selectedPin;
  console.log("SelectedPin",selectedPin);
  
    socket.join(selectedPin);
   
    
  })
  //Add player to Quiz Object
 

socket.on('player-add', (data)=> {
  console.log("player add");
  // console.log("socket",socket);
  // const { error, user } = addUser(
  //   { id: socket.id, name:data.nickname, room :data.selectedPin});
  var pin = parseInt(data.selectedPin);
  console.log("selectedpin",typeof pin);
  console.log("player_data",data.nickname);
  console.log("player_data",socket.id);
 io.sockets.emit("hello");
//  socket.to(`${data.selectedPin}`).emit('room-joined', {name: data.nickname, id: socket.id});
 io.sockets.emit('room-joined', {name: data.nickname, id: socket.id,pin:data.selectedPin});
  
  
})

  socket.on('question-over', (data) => {
    console.log("question over call");
    console.log("pin",data.pin);
    io.sockets.emit('question-over');
  })
    socket.on('next-question', (data) => {
    console.log("next question called");
    console.log("pin",data);
    // socket.to(`${data.pin}`).emit('next-question');
    io.sockets.emit('next-question');
})
  socket.on('question-answered', (data) => {
    console.log("question answered called");
    console.log("pin",data.pin);
    console.log("data",data);
    io.sockets.emit('player-answer', {name : data.name, answer: data.answer})
  })
  socket.on('sent-info', (data) => {
    console.log("sent-info called");
    console.log("data",data);
    var new_id = data.id+""+data.pin;
    io.to(data.id).emit('sent-info', {answeredCorrect: data.answeredCorrect, score: data.score});
})
socket.on("game-over",()=>{
  io.sockets.emit('game-over')
})

socket.on('end', function (pin){
  console.log("socket disconnect");
  console.log("socketId",socket.id);
  const user = removeUser(socket.id);
  var getusers = getUsersInRoom(pin);
  console.log("users",getusers);
  socket.disconnect();
   
});
socket.on('destroy', function (data) {
  console.log("data",data);
  console.log('A user disconnected');
  io.sockets.emit('left', {id:socket.id});
  // delete currentConnections[socket.id];
  socket.leave(data); 
  // socket.disconnect();
});
socket.on("pin-entered",(pin)=>{
  console.log("pin entered called");
  console.log(hostArray);
  // console.log(hostArray["hostsocketid"]);
  // var id = socketArray["socketid"];
  console.log("pin",pin);
  socketArray.push(socket.id);
  var id = socketArray[0];
  if(host>=1){
    var i = 0;
  hostArray.map(hostId=>{
    console.log("im here");
    i++;
    console.log("i",i);
    console.log("lengty",hostArray.length);
      io.to(`${hostId}`).emit("pin-checked",{pin:pin,len:hostArray.length,clen:i});
  })
}else{
  console.log("im here");
  io.to(`${id}`).emit('host_presence');
}

})
  socket.on("valid",(valid)=>{
    console.log("valid called",valid);
    console.log("socketArray",socketArray);
    var id = socketArray[0];
    console.log("id",id);
  
      // var id =socketid;
      io.to(`${id}`).emit('valid',valid);
      socketArray=[];
   
  // var id = socketArray["socketid"];
  // console.log("socketArray",socketArray["socketid"]);
  // console.log("valid called");
 
})
socket.on("disconnect",function(){
  if(hosts[socket.id]==socket.id){
    host--;
  }
  io.sockets.emit('left',{id:socket.id})
})
 
 
})
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use('/', indexRouter);
app.use('/users', usersRouter);
// app.use((req,res,next)=>{
//   console.log("im here");
//   const token = req.headers["auth-token"];
//   console.log("token",token);
//   if(token){
//     console.log("im here also");
//     try{
//     req.user = jwt.verify(token,"GUvi!jdks");
   
//     next();
//     }catch(err){
//       res.sendStatus(401);
//     }
//   }else{
//     res.sendStatus(401);
//   }
  
// })
app.use('/quiz', addQuizRouter);
app.use('/quizquestions',quizQuestionsRouter);
app.use(express.static(path.resolve(__dirname, "./client/build")));
// Step 2:


app.use(express.static(path.join(__dirname, '../build')))
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../build'))
})

if(process.env.NODE_ENV==="production"){
app.use(express.static("my_final_project_front/build"));
  const path = require("path");
 app.get("*",(req,res)=>{
     res.sendFile(path.resolve,__dirname,'my_final_project_front','build','index.html');
   })
})
  // app.get("*",(req,res)=>{
  //   res.sendFile(path.resolve,__dirname,'my_final_project_front','build','index.html');
  // })
}
// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});
// if(process.env.NODE_ENV==="production"){
//   app.use(express.static("my_final_project_front/build"));
//   const path = require("path");
//   app.get("*",(req,res)=>{
//     res.sendFile(path.resolve,__dirname,'my_final_project_front','build','index.html');
//   })
// }
const PORT = process.env.PORT||3001;
app.listen(`${PORT}`,()=>console.log(`server started at ${PORT}`
));
module.exports = app;
