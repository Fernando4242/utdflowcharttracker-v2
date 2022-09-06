const { MongoClient } = require("mongodb");
const DATABASE_NAME = "flowchart-project";
const COURSEBOOK_COLLECTION = "coursebook";
const USER_FLOWCHARTS_COLLECTION = "user-flowcharts";
const ACCOUNTS_COLLECTIONS = "accounts";

let _db;

module.exports = {
  connectToServer: function (callback) {
    MongoClient.connect(process.env.DATABASE_URI, { useNewUrlParser: true }, function (err, client) {
      if(!err){
        _db = client.db(DATABASE_NAME);
      }
      return callback(err);
    });
  },

  getDb: function () {
    return _db;
  },
  DATABASE_NAME,
  COURSEBOOK_COLLECTION,
  USER_FLOWCHARTS_COLLECTION,
  ACCOUNTS_COLLECTIONS,
};
