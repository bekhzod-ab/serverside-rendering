require("dotenv").config();
const express = require("express")
const mongoose = require("mongoose");
const app = express()
const jwt = require("jsonwebtoken")
const path = require("path")
const cookieParser = require("cookie-parser")
const sassMiddleware = require("node-sass-middleware")
const axios = require("axios")
const {PrintAll} = require("./productsmodel.js")
const {login, addUser} = require("./usersmodel.js")
const port = process.env.PORT
mongoose.connect(process.env.MONGODB_URI, {
    useUnifiedTopology: true,
    useNewUrlParser: true,
})
.then(() => {
    console.log("Connected to DB")
})

app.listen(port, ()=> {
    console.log(`Server is running on http://localhost:${port}`)
})



app.use(sassMiddleware({
    src: path.join(__dirname, 'public'),
    dest: path.join(__dirname, 'public'),
    indentedSyntax: false,
    sourceMap: true,
    outputStyle: "compressed",
}));
app.use(cookieParser())
app.use(express.urlencoded({extended:true}))
app.set("view engine", "ejs");
app.use(express.static(path.join(__dirname, "public")));

app.use((req,res,next) => {
    next()
})

function validator(req,res,next) {
    res.locals.loggedIn = false;
    
    if (req.cookies.cookieToken && jwt.verify(req.cookies.cookieToken, process.env.SECRET)) {
        res.locals.loggedIn = true;    
    } 
        
    next()
    
}


app.post("/signout", (req,res) => {
    res.clearCookie("cookieToken")
    res.status(200).send()
})


app.get("/", validator, (req,res) => {
    // function signOut() {
    //     return window.location = "/login"
    // }  
    res.render("homepage", {
        title: "My dynamic title!"
    });
    
})




app.get("/products", validator, async (req,res) => {

    const laptops = await PrintAll()
    
    res.render("products", { laptops })
})




app.get("/login", validator, (req,res) => {
    res.render("login")
})

app.post("/login", validator, async (req,res) => {
    
    if (await login(req.body.userName,req.body.passName)){
        res.locals.loggedIn = true;
        const jwToken = jwt.sign(req.body.userName, process.env.SECRET)
        res.cookie("cookieToken", jwToken, {httpOnly:true} )
        res.redirect("/products")
    }else {
        res.status(400).send()
    }
})




app.get("/register", validator, (req,res) => {
    res.render("register")
})

app.post("/register",validator, async (req,res) => {
    await addUser(req.body.bodyname, req.body.bodyemail, req.body.bodypass)
    res.status(200).send("new user has been added")
    res.redirect("/login")
})