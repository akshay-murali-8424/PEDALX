const mongodb = require("mongodb");

const dotenv = require("dotenv");

dotenv.config({ path: "./config.env" });

const db = process.env.DATABASE.replace("<password>", process.env.DATABASE_PASS);

const MongoClient = mongodb.MongoClient;

const mongoDbUrl = db;


let _db;

const initDb = (callback) => {
  if (_db) {
    console.log("Database is already initialized!");
    return callback(null, _db);
  }
  MongoClient.connect(mongoDbUrl)
    .then((client) => {
      _db = client.db("PEDELX");
      callback(null, _db);
    })
    .catch((err) => {
      callback(err);
    });
};

const getDb = () => {
  if (!_db) {
    throw Error("Database not initialzed");
  }
  return _db;
};

module.exports = {
  initDb,
  getDb,
};
