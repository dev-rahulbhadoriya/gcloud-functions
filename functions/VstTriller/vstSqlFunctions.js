const cloudsql = require("../utils/cloudSql");
const axios = require("axios");
// function insertVSTDataCheckDuplicate(FormId, fields, contact_number, airtableBaseNo) {
const insertVSTDataCheckDuplicate = (
  FormId,
  fields,
  contact_number,
  airtableBaseNo
) => {
  return new Promise((resp, rej) => {
    try {
      cloudsql.query(
        "INSERT INTO VSTData (FormId, data, contact_number,airtableBaseNo) VALUES (?, ? ,?, ?);",
        [FormId, JSON.stringify(fields), contact_number, airtableBaseNo],
        (err, result) => {
          if (err) {
            if (err && err.code === "ER_DUP_ENTRY") {
              console.log("Duplicate data", contact_number);
              cloudsql.query(
                "INSERT INTO VSTData_duplicate (FormId,data,contact_number,airtableBaseNo) VALUES (?, ?, ?, ?);",
                [
                  fields.FormId,
                  JSON.stringify(fields),
                  contact_number,
                  airtableBaseNo,
                ],
                (err, result) => {
                  if (err) {
                    console.log("Data inserted in duplicate base");
                    rej();
                  } else {
                    let farmername = fields["Filled by"];
                    let fenumber = fields["Filled by Mobile Number"];
                    let managernumber = "1111111111";
                    if (typeof employees != "undefined" && employees != null) {
                      let isManagerAdded = false;
                      employees.forEach((item) => {
                        if (!isManagerAdded && item.manager == true) {
                          managernumber = item.empPhone;
                          isManagerAdded = true;
                        } else {
                          fenumber = item.empPhone;
                        }
                      });
                    }
                    console.log("DUPLICATE Data", contact_number, fenumber);
                    let msgBody = {
                      sender: "ANAXEE",
                      route: "4",
                      country: "91",
                      DLT_TE_ID: "1307165459010606620",
                      sms: [
                        {
                          message: `Mob-No. ${contact_number} | Duplicate Number Found | Register new Customer | Ask Customer before Registration | Duplicate data will be rejected. Thank you. Anaxee`,
                          to: [fenumber, managernumber],
                        },
                      ],
                    };
                    axios
                      .post(
                        "https://api.msg91.com/api/v2/sendsms?country=91",
                        msgBody,
                        {
                          headers: {
                            "Content-Type": "application/json",
                            authkey: "103801ASIjpSVep5dadb6b2",
                          },
                        }
                      )
                      .then(() => {
                        resp([true, true]);
                        console.log("dup-num-msg-send", FormId, fenumber);
                      })
                      .catch((err) => {
                        resp([true, false]);
                        console.log(
                          "dup-num-msg-err",
                          FormId,
                          err.response.data
                        );
                      });
                  }
                }
              );
            } else {
              console.log("FAILED_INSERT", JSON.stringify(err));
              rej(err);
            }
          } else {
            resp([false, false]);
          }
        }
      );
    } catch (err) {
      rej(err);
    }
  });
};

const updateDataIntoDb = (FormId, fields, mobile_number, recId) => {
  return new Promise((resp, rej) => {
    cloudsql.query(
      `UPDATE VSTData SET data=?, contact_number=?,  airtableId=? WHERE FormId=${FormId};`,
      [JSON.stringify(fields), mobile_number, recId],
      (err, _result) => {
        if (err) {
          console.log("Faild to update sql row", err);
          rej(err);
        }
        resp(false);
      }
    );
  });
};

const updateVSTDataSql = (fields) => {
  return new Promise((resp, rej) => {
    cloudsql.query(
      `UPDATE VSTData SET data=? WHERE FormId=${fields.FormId};`,
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
};

const getVSTDataSql = (formId) => {
  return new Promise((resp, rej) => {
    cloudsql.query(
      `SELECT data, airtableId FROM VSTData WHERE FormId =${formId}`,
      (err, result) => {
        if (err) {
          console.log("FAILED_UPDATE", JSON.stringify(err));
          rej(err);
        }
        resp(result);
      }
    );
  });
};

const updateVSTAirtableIdSql = (formId, airtableID) => {
  return new Promise((resp, rej) => {
    cloudsql.query(
      `UPDATE VSTData SET airtableId=? WHERE FormId=${formId};`,
      [airtableID],
      (err, result) => {
        if (err) {
          console.log("FAILED_UPDATE", JSON.stringify(err));
          rej(err);
          process.exit(16);
        }
        console.log("INSERT AIRTABLE ID IN DB");
        resp();
      }
    );
  });
};

const runQuery = (query, values) => {
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
};

//SELECT data FROM VSTData WHERE data_cleaned IS NULL ORDER BY Id DESC LIMIT 250
function getRow() {
  return new Promise((resp, rej) => {
    try {
      cloudsql.query(
        `SELECT data FROM VSTData WHERE data_cleaned IS NULL ORDER BY FormId DESC LIMIT 250;`,
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
        `UPDATE VSTData SET data_cleaned=? WHERE Id=${id};`,
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

module.exports = {
  insertVSTDataCheckDuplicate,
  updateDataIntoDb,
  updateVSTDataSql,
  updateVSTAirtableIdSql,
  getVSTDataSql,
  runQuery,
  getRow,
  changeCleanedStatus,
};
