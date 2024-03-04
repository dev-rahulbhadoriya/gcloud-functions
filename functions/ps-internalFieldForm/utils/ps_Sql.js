const cloudsql = require("../../utils/cloudSql");

function insertPSFormData(fields,basechange) {
  return new Promise((resp, rej) => {
    cloudsql.query(
      "INSERT INTO ps_internalfieldform (id, data, basechange) VALUES (?, ?, ?);",
      [fields.Id, JSON.stringify(fields), basechange],
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

function updatePSFormData(fields) {
  return new Promise((resp, rej) => {
    cloudsql.query(
      `UPDATE ps_internalfieldform SET data=? WHERE id=${fields.Id};`,
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

function getPSFormData(formId) {
  return new Promise((resp, rej) => {
    cloudsql.query(
      `SELECT data, airtableId FROM ps_internalfieldform WHERE id=${formId};`,
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



function updatePSFormAirtableId(formId, airtableID) {
  return new Promise((resp, rej) => {
    cloudsql.query(
      `UPDATE ps_internalfieldform SET airtableId=? WHERE id=${formId};`,
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
  insertPSFormData,
  updatePSFormData,
  getPSFormData,
  updatePSFormAirtableId
};
