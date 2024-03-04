const cloudsql = require("../../utils/cloudSql");
const axios = require("axios");

function insertIntoUnacademyDB(fields) {
  console.log(fields);
  return new Promise((resp, rej) => {
    cloudsql.query(
      "INSERT INTO unacademy_data (FormId, data) VALUES (?, ?);",
      [fields.Id, JSON.stringify(fields)],
      (err, result) => {
        if (err) {
          console.log("FAILED_INSERT", JSON.stringify(err));
          rej(err);
        }
        console.log(result);
        resp();
      }
    );
  });
}

function updateIntoUnacademyDB(fields, mobile_number, state) {
  return new Promise((resp, rej) => {
    cloudsql.query(
      `UPDATE unacademy_data SET data = ?, mobile_number=?, state_Name=? WHERE FormId=${fields.FormId};`,
      [JSON.stringify(fields), mobile_number, state],
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

function getDataFromDB(formId) {
  return new Promise((resp, rej) => {
    cloudsql.query(
      `SELECT data, airtableId FROM unacademy_data WHERE FormId=${formId};`,
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

function updateAirtableIdIntoDB(formId, airtableID) {
  return new Promise((resp, rej) => {
    cloudsql.query(
      `UPDATE unacademy_data SET airtableId = ? WHERE FormId=${formId};`,
      [airtableID],
      (err, result) => {
        if (err) {
          console.log("FAILED_UPDATE", JSON.stringify(err));
          rej(err);
        }
        resp(formId);
      }
    );
  });
}

// function cheackId(id) {
//   console.log("check kia id", id);
//   return new Promise((resp, rej) => {
//     cloudsql.query(
//       `SELECT id from getDataFromDB WHERE id="${id}"`,
//       (err, result) => {
//         if (err) {
//           rej(err);
//         }
//         if (result.length > 0) {
//           resp(true);
//         } else {
//           resp(false);
//         }
//       }
//     );
//   });
// }

function insertDataCheckDuplicate(
  FormId,
  fields,
  mobile_number,
  state,
  airtableBaseNo
) {
  return new Promise((resp, rej) => {
    cloudsql.query(
      "INSERT INTO unacademy_data (FormId,data,mobile_number,state_Name,airtableBaseNo)VALUES(?,?,?,?,? );",
      [FormId, JSON.stringify(fields), mobile_number, state, airtableBaseNo],
      (err, result) => {
        if (err) {
          if (err && err.code === "ER_DUP_ENTRY") {
            console.log("duplicate data")
            cloudsql.query(
              "INSERT INTO unacademy_duplicate (FormId,data,mobile_number,state_Name,airtableBaseNo) VALUES (?, ?, ?,?,?);",
              [
                FormId,
                JSON.stringify(fields),
                phone_number,
                state,
                airtableBaseNo
              ],
              (err, _result) => {
                if (err) {
                  console.log("DATA INSERTED IN DUPLICATE BASE")
                  rej();
                } else {
                  resp([true, true]);
                  console.log("dup-num", FormId);
                }
              }
            );
          } else {
            rej(err);
          }
        } else {
          resp([false, false]);
        }
      }
    );
  });
}


function updateDataIntoDb(FormId, recId) {
  return new Promise((resp, rej) => {
    cloudsql.query(
      `UPDATE  unacademy_data SET airtableId=? WHERE FormId=${FormId};`,
      [recId],
      (err, _result) => {
        if (err) {
          console.log("Faild to update sql row", err);
          rej(err);
        }
        resp(recId);
      }
    );
  });
}

module.exports = {
  insertDataCheckDuplicate,
  updateAirtableIdIntoDB,
  updateDataIntoDb,
  insertIntoUnacademyDB,
  updateIntoUnacademyDB,
  getDataFromDB

};
