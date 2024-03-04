const mysql = require("mysql");


const cloudsqlPartnerApp = mysql.createPool({
    connectionLimit: 1,
    host: "34.93.65.88",
    // socketPath: "/cloudsql/android-mapping-backend:asia-south1:partner-app-sql",
    user: "root",
    password: "90iopklbnm",
    database: "partner_app"
  })

  module.exports = cloudsqlPartnerApp;
