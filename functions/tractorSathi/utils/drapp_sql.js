const mysql = require("mysql");

const drappSql = mysql.createPool({
    connectionLimit: 1,
    host: "35.200.145.194",
    user: "anaxee_user",
    password: "anaxee@123",
    database: "anaxee_db"
})

module.exports = drappSql;