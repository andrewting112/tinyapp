const express = require("express");
const app = express();
const PORT = 8080;
const bodyParser = require("body-parser");
const bcrypt = require('bcrypt');
var cookieSession = require('cookie-session');

function generateRandomString() {
  //thanks Kenton Varda from stackverflow
  return Math.random().toString(36).substr(2, 6)
}

app.use(cookieSession({
  name: 'session',
  keys: ["efj349rejowds"],
  maxAge: 24 * 60 * 60 * 1000
}))

app.set("view engine", "ejs");

// URL Database
const urlDatabase = {
  b6UTxQ: {
    longURL: "https://www.tsn.ca",
    userID: "aJ48lW"
  },
  i3BoGr: {
    longURL: "https://www.google.ca",
    userID: "aJ48lW"
  }
};

// User Database
const users = {
  "userRandomID": {
    id: "userRandomID",
    email: "user@example.com",
    password: "purple-monkey-dinosaur"
  },
  "user2RandomID": {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "dishwasher-funk"
  }
}


app.use(bodyParser.urlencoded({
  extended: true
}));

//========================

// setting user templates for pages
app.get("/", (req, res) => {
  res.send("Hello!");
});

app.get("/urls", (req, res) => {
  let userId = req.session.user_id;
  let user = users[userId];
  let templateVars = {
    urls: urlDatabase,
    username: user
  };
  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
  let userId = req.session.user_id;
  let user = users[userId];
  if (!req.session.user_id) {
    res.redirect("/login");
  } else {
    let templateVars = {
      username: user,
      shortURL: req.params.shortURL,
      longURL: urlDatabase[req.params.shortURL]
    };
    res.render("urls_new", templateVars);
  }
});

app.get("/urls/:shortURL", (req, res) => {
  let templateVars = {
    shortURL: req.params.shortURL,
    longURL: urlDatabase[req.params.shortURL].longURL,
    username: req.session.user_id
  };
  res.render("urls_show", templateVars);
});

//creating mini json database

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/register.json", (req, res) => {
  res.json(users);
});

app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

app.get("/register", (req, res) => {
  let templateVars = {
    urls: urlDatabase,
    username: req.session.user_id
  };
  res.render("urls_register", templateVars);
});

app.get("/login", (req, res) => {
  let templateVars = {
    urls: urlDatabase,
    username: req.session.user_id
  };
  res.render("urls_login", templateVars);
});

app.get("/u/:shortURL", (req, res) => {
  const longURL = urlDatabase[req.params.shortURL].longURL
  res.redirect(longURL);
});

//========================

app.post("/urls", (req, res) => {
  let a = generateRandomString();

  urlDatabase[a] = {};
  urlDatabase[a].longURL = req.body.longURL;
  urlDatabase[a].userID = req.session.user_id;
  res.redirect(`/urls/${a}`);
});

// create a new user and stores information in database

app.post("/register", (req, res) => {
  let user_id = generateRandomString();
  let getEmail = req.body.email;
  let password = req.body.password;
  let hashedPassword = bcrypt.hashSync(password, 10);

  if (getEmail === '' || password === '') {
    console.log("error");
    return res.status(400).send("Error");
  }

  for (let keys in users) {
    if (users[keys].email === getEmail) {
      return res.status(400).send("email already exitsts");
    }
  }
  users[user_id] = {
    id: req.session.user_id,
    email: getEmail,
    password: hashedPassword
  };

  res.redirect("/urls")
});

// checks if userID matches with cookies ID.
// deletes post if ID matches.

app.post("/urls/:shortURL/delete", (req, res) => {
  let cookieId = req.session.user_id
  const urlObj = urlDatabase[req.params.shortURL];
  if (urlObj.userID === cookieId) {
    delete urlDatabase[req.params.shortURL];
    res.redirect('/urls');
  } else {
    res.status(403).send('You may only delete your own urls.');
  }
});

// checks if userID matches with cookies ID.
// edits post if ID matches.
app.post("/urls/:shortURL/add", (req, res) => {
  let cookieId = req.session.user_id
  const urlObj = urlDatabase[req.params.shortURL];
  if (urlObj.userID === cookieId) {
    urlObj.longURL = req.body.newURL;
    res.redirect("/urls");
  } else {
    res.status(403).send('You may only edit your own urls.');
  }
});

// clears cookies 
app.post("/logout", (req, res) => {
  req.session.user_id = null
  res.redirect("/urls");
});

// checks if email is already in database.
// logs in if password matches password in database.
app.post('/login', (req, res) => {
  for (let keys in users) {
    console.log(keys)
    if (users[keys].email === req.body.email) {
      if (bcrypt.compareSync(req.body.password, users[keys].password)) {
        req.session.user_id = keys;
        res.redirect("/urls");
      }
    }
  }
  return res.status(403).send("Error");
});

//========================


app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});