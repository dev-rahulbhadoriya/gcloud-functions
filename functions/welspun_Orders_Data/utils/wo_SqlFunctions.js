const cloudsql = require("../../utils/cloudSql");

function insertWOFormData(fields) {
  return new Promise((resp, rej) => {
    cloudsql.query(
      "INSERT INTO welspun_orders_data (id, data) VALUES (?, ?);",
      [fields.Id, JSON.stringify(fields)],
      (err, result) => {
        if (err) {
          console.log("FAILED_INSERT", JSON.stringify(err));
          rej(err);
        }
        resp();
      }
    );
  });
}

function updateWOFormData(fields) {
  return new Promise((resp, rej) => {
    cloudsql.query(
      `UPDATE welspun_orders_data SET data=? WHERE id=${fields.Id};`,
      [JSON.stringify(fields)],
      (err, result) => {
        if (err) {
          console.log("FAILED_UPDATE", JSON.stringify(err));
          rej(err);
        }
        resp();
      }
    );
  });
}

function getWOFormData(formId) {
  return new Promise((resp, rej) => {
    cloudsql.query(
      `SELECT data, airtableId FROM welspun_orders_data WHERE id=${formId};`,
      (err, result) => {
        if (err) {
          console.log("FAILED_UPDATE", JSON.stringify(err));
          rej(err);
        }
        resp(result);
      }
    );
  });
}

function updateWOFormAirtableId(formId, airtableID) {
  return new Promise((resp, rej) => {
    cloudsql.query(
      `UPDATE welspun_orders_data SET airtableId=? WHERE id=${formId};`,
      [airtableID],
      (err, result) => {
        if (err) {
          console.log("FAILED_UPDATE", JSON.stringify(err));
          rej(err);
        }
        resp();
      }
    );
  });
}

function getRow() {
  return new Promise((resp, rej) => {
    try {
      cloudsql.query(
        `SELECT data FROM welspun_orders_data WHERE data_cleaned IS NULL ORDER BY Id DESC LIMIT 250;`,
        (err, result) => {
          if (err) {
            console.log(err);
            rej(err);
          }
          resp(result);
        }
      );
    } catch (error) {
      rej(error);
    }
  });
}

function changeCleanedStatus(id) {
  console.log(id);
  return new Promise((resp, rej) => {
    try {
      cloudsql.query(
        `UPDATE welspun_orders_data SET data_cleaned=? WHERE Id=${id};`,
        [2],
        (err, result) => {
          if (err) {
            console.log(err);
            rej(err);
          }
          resp(result);
        }
      );
    } catch (error) {
      rej(error);
    }
  });
}

function runQuery(query, values) {
  return new Promise((resp, rej) => {
    try {
      cloudsql.query(query, values, (err, result) => {
        if (err) {
          console.log(err);
          rej(err);
        }
        resp(result);
      });
    } catch (error) {
      rej(error);
    }
  });
}

module.exports = {
  insertWOFormData,
  updateWOFormData,
  updateWOFormAirtableId,
  getWOFormData,
  getRow,
  changeCleanedStatus,
  runQuery,
};
