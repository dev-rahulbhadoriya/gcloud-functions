const cloudsql = require("../../utils/cloudSql");

function insertOrderFormTaskUpdate(fields) {
  return new Promise((resp, rej) => {
    cloudsql.query(
      "INSERT INTO order_taking_task_status_form (formId, data) VALUES (?, ?);",
      [fields.formId, JSON.stringify(fields)],
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

function updateOrderFormTaskUpdate(fields) {
  return new Promise((resp, rej) => {
    cloudsql.query(
      `UPDATE order_taking_task_status_form SET data=? WHERE formId=${fields.formId};`,
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

function getOrderFormTaskUpdate(formId) {
  return new Promise((resp, rej) => {
    cloudsql.query(
      `SELECT data, airtableId FROM order_taking_task_status_form WHERE formId=${formId};`,
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

function updateOrderFormTaskUpdateAirtableId(formId, airtableID) {
  return new Promise((resp, rej) => {
    cloudsql.query(
      `UPDATE order_taking_task_status_form SET airtableId=? WHERE formId=${formId};`,
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

module.exports = {
   insertOrderFormTaskUpdate,
   updateOrderFormTaskUpdate,
   updateOrderFormTaskUpdateAirtableId,
   getOrderFormTaskUpdate
  };
  