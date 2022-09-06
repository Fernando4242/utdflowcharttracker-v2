const express = require("express");
require('dotenv').config()
const session = require("express-session");
const path = require("path");
const mongoUtil = require("./configs/db.config")
const exphbs = require("express-handlebars");
const cookieParser = require("cookie-parser");
const isAuthenticated = require("./middleware/isAuthenticated");
const profile = require("./configs/profile.icons");
const isNotAuthenticated = require("./middleware/isNotAuthenticated");

const app = express();
const port = 3000;

var hbs = exphbs.create({
  extname: '.hbs',
  helpers: {
    isEqual(a, b, options) {
      if(a == b){
        return options.fn(this);
      }else{
        return options.inverse(this);
      }
    }
  }
})

app.engine(".hbs", hbs.engine);
app.set("view engine", ".hbs");
app.set("views", "./views");

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("./public"));

app.use(cookieParser());
app.use(session({
  secret: process.env.SESSION_SECRET_KEY,
  saveUninitialized: true,
  name: "sessionID",
  resave: false,
  cookie: {
    maxAge: (1000 * 60 * 60 * 24) * 31 // one month
  }
}))

mongoUtil.connectToServer((err) => {
  if (err) {
    app.all("*", (req, res) => {
      res.send("Sorry! It appears something went wrong, please come back later or refresh the page.😥");
    });
  };

  // authentication routes
  app.use("/auth", require("./routes/auth.router"));

  // page routes
  app.use("/account", isAuthenticated, require("./routes/account.router"));
  app.use("/flowchart", isAuthenticated, require("./routes/flowchart.router"));
  app.get("/", (req, res) => {
    res.render("./pages/home", {user: req.session.user})
  });
})

app.listen(process.env.PORT || port, () => {
  console.log("Listening on port: " + port);
});