const express = require("express");
const bodyParser = require("body-parser");
const mongoose=require("mongoose");
const ejs=require("ejs");
const passport=require("passport");
const session=require("express-session");
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const moment=require("moment");
const nodemailer = require('nodemailer');
const GridFsStorage = require('multer-gridfs-storage');
const Grid = require('gridfs-stream');
const path = require('path');
const crypto = require('crypto');
const methodOverride = require('method-override');

const app = express();

var Rol;
let gfs;

if (process.env.NODE_ENV !== 'production') {
  const dotenv = require('dotenv');
  dotenv.config();
}

app.set('view engine', 'ejs');
app.use(methodOverride('_method'));

app.use(session({
  secret: 'keyboard cat',
  resave: false,
  saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));


const transporter = nodemailer.createTransport({
service: 'Gmail',
host: 'smtp.gmail.com',
    port: 465,
auth: {
    user: "ashukla1_be19@thapar.edu",
    pass: 'Severus_24@',
},
secure: true
});


mongoose.connect("mongodb://localhost:27017/ConstructionDB", {useNewUrlParser: true});

passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  User.findById(id, function(err, user) {
    done(err, user);
  });
});

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required:true
  },
  email: {
    type: String,
    required:true
  },
  role:{
    type:String,
    required:true
  },
});

const User=mongoose.model("User",UserSchema);

var temp=new User({
  name:"",
  email:"",
  role:""
});

app.get("/", function(req, res){
  currentUser=null;
  clientType=null;
/*  const user=new User({
    name:"Arinjay Shukla",
    email:"baba1938baba@gmail.com",
    role:"super"
  });
  console.log(currentUser);
  user.save();*/
  res.render("home",{currentUser:currentUser,clientType:clientType});
});

passport.use(new GoogleStrategy({
    clientID:process.env.CLIENT_ID ,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/home"
  },
  function(accessToken, refreshToken, profile, done) {

    User.findOne({email: profile.emails[0].value}, function(err, user) {
        console.log(user);
        temp.role=user.role;
        temp.name=user.name;
        temp.email=user.email;
        return done(err, user);
     });
  }
));

app.get('/auth/google',
  passport.authenticate('google', { scope: ['profile','email'] }));

app.get('/auth/google/home',
  passport.authenticate('google', { failureRedirect: '/auth/google'}),
  function(req, res) {
    // Successful authentication, redirect home.
     res.redirect("/home");
  });

app.get("/home",function(req,res){
    if(temp.role==="worker")
    {
      res.redirect("/worker");
    }
    else if(temp.role==="admin")
    {
      res.redirect("/admin");
    }
    else
    res.redirect('/super');
  });

app.get("/super",async(req,res)=>{
    if(temp.role==="super")
    {
        const found_user = await User.find({});
        res.render("super",{currentUser:temp,clientType:temp.role,admins:found_user,workers:found_user});
    }
    else res.redirect("/");
  });

  app.get("/admin",async(req,res)=>{
    if(temp.role==="admin")
    {
        const found_user = await User.find({});
        res.render("admin",{currentUser:temp,clientType:temp.role,admins:found_user,workers:found_user});
    }
    else res.redirect("/");
  });

  app.get("/graphs",async(req,res)=>{
    const email = req.query.email ? req.query.email : "baba1938baba@gmail.com";
    const found_user = await User.find({email:email});
    res.render("graphs",{worker:found_user,clientType:temp.role,currentUser:temp});
  });

  app.get("/superuser/worker/remove/:id",function(req,res){

    User.deleteOne({ _id: req.params.id }).then(result => {
    console.log(result);
    });
    res.redirect("/super");
  });

  app.get("/superuser/admin/remove/:id",function(req,res){

    User.deleteOne({ _id: req.params.id }).then(result => {
    console.log(result);
    });
    res.redirect("/super");
  });


  app.get('/auth/logout', function (req, res) {
   // req.logout();
    res.redirect("/");
  });


  app.post("/superuser/admin/add",function(req,res){

 //console.log(req.body);
  var teacher_name=req.body.main.name;
  var teacher_email=req.body.main.email;

  const user=new User({
    name:teacher_name,
    email:teacher_email,
    role:"admin"
  });

  user.save();
  res.redirect("/super");

});

app.post("/superuser/worker/add",function(req,res){

// console.log(req.body);
  var teacher_name=req.body.mains.name;
  var teacher_email=req.body.mains.email;

  const user=new User({
    name:teacher_name,
    email:teacher_email,
    role:"worker"
  });

  user.save();
  res.redirect("/super");
});

app.listen(3000, function() {
  console.log("Server started on port 3000");
});
