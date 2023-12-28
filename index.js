import express from "express";
import bodyParser from "body-parser";
import pg from "pg";

const app = express();
const port = 3000;

const db = new pg.Client({
  user: "postgres",
  host: "localhost",
  database: "world",
  password: "1234",
  port: 5432,
});
db.connect();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));
let currentUserId = 1;
// let users = [
//   { id: 1, name: "Angela", color: "teal" },
//   { id: 2, name: "Jack", color: "powderblue" },
// ];

async function checkVisisted() {
  const user_details = await db.query('SELECT * FROM visited_countries JOIN users ON users.id = user_id');
  let countries = [];
  let color = "";
  user_details.rows.forEach((detail) => {
    if(detail.user_id==currentUserId){
      countries.push(detail.country_code);
      color = detail.color;
    }
  });
  return [countries,color];
}

async function total_users(){
  const result = await db.query("SELECT id,name, color FROM users");
  let users = [];
  result.rows.forEach((user)=>{users.push(user)});
  return users;
}
app.get("/", async (req, res) => {
  const details = await checkVisisted(1);
  const users = await total_users();
  res.render("index.ejs", {
    countries: details[0],
    total: details[0].length,
    users: users,
    color: details[1],
  });
});
app.post("/add", async (req, res) => {
  const input = req.body["country"];

  try {
    const result = await db.query(
      "SELECT country_code FROM countries WHERE LOWER(country_name) LIKE '%' || $1 || '%';",
      [input.toLowerCase()]
    );

    const data = result.rows[0];
    const countryCode = data.country_code;
    try {
      await db.query(
        "INSERT INTO visited_countries (country_code,user_id) VALUES ($1,$2)",
        [countryCode, currentUserId]
      );
      res.redirect("/");
    } catch (err) {
      console.log(err);
    }
  } catch (err) {
    console.log(err);
  }
});
app.post("/user", async (req, res) => {
  const user_id = req.body.user;
  if(req.body.add==='new'){
    res.render('new.ejs')
  }
  else{
    currentUserId = user_id;
    res.redirect('/');
  }
  
  
  
  
});

app.post("/new", async (req, res) => {
  const name = req.body["name"];
  const color = req.body["color"];
  console.log(req.body);
  await db.query(
    "INSERT INTO users (name,color) VALUES ($1,$2)",
    [name, color]
  );
  res.redirect('/')
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
