const mysql = require("mysql");
const cloudsql = mysql.createPool({
  connectionLimit: 10,
  host: "host_ip",
  socketPath:
    "/cloudsql/project-name:asia-south1:project-name",
  user: "user_name",
  password: "123456***",
  database: "databaseName",
});

module.exports = cloudsql;
