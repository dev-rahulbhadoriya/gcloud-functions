const cloudsql = require("../../utils/cloudSql");
const drappSql = require("./drapp_sql");
const axios = require("axios");

function insertRawData(Id, fields, phone_number, state, employees) {
  return new Promise((resp, rej) => {
    cloudsql.query(
      "INSERT INTO tractor_sathi_raw (Id, fields, phone_number, status, state) VALUES (?, ?, ?, ?, ?);",
      [Id, JSON.stringify(fields), phone_number, 0, state],
      (err, _result) => {
        if (err) {
          if (err.code === "ER_DUP_ENTRY") {
            cloudsql.query(
              "INSERT INTO tractor_sathi_raw_duplicate (Id, fields, phone_number, status, state) VALUES (?, ?, ?, ?, ?);",
              [Id, JSON.stringify(fields), phone_number, 0, state],
              (err, _result) => {
                if (err) {
                  rej(err);
                }
                let farmername =fields["Met Person Name (जो व्यक्ति मिला उसका नाम)"];
                let fenumber = "1111111111";
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
                console.log("DUPLICATE Data", farmername, fenumber);
                let msgBody = {
                  sender: "ANAXEE",
                  route: "4",
                  country: "91",
                  DLT_TE_ID: "1307161518717340829",
                  sms: [
                    {
                      message: `${phone_number} | Duplicate Number Found (TS) | Register new farmer | Ask Farmer before Registration | Duplicate data will be rejected. Thank you.`,
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
                    console.log("dup-num-msg-send", Id, fenumber);
                  })
                  .catch((err) => {
                    resp([true, false]);
                    console.log("dup-num-msg-err", Id, err.response.data);
                  });
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

function updateRawData(Id, fields, phone_number, state, status, recId) {
  return new Promise((resp, rej) => {
    cloudsql.query(
      `UPDATE tractor_sathi_raw SET fields=?, phone_number=?, status=?, state=?, recId=? WHERE Id LIKE "%${Id}%";`,
      [JSON.stringify(fields), phone_number, status, state, recId],
      (err, _result) => {
        if (err) {
          console.log("Faild to update sql row", err);
          rej(err);
        }
        resp(false);
      }
    );
  });
}
function updateStatusRawData(recId, status, call_id) {
  return new Promise((resp, rej) => {
    cloudsql.query(
      `UPDATE tractor_sathi_raw SET status=?, call_id=? WHERE recId LIKE "%${recId}%";`,
      [status, call_id],
      (err, _result) => {
        if (err) {
          rej(err);
        }
        resp(false);
      }
    );
  });
}

function updateStatusRawDataFE(empPhone, status, call_id) {
  console.log(empPhone, status, call_id);
  return new Promise((resp, rej) => {
    cloudsql.query(
      `UPDATE active_fe_in_last_5_days SET status=?, call_id=? WHERE empPhone LIKE "%${empPhone}%";`,
      [status, call_id],
      (err, _result) => {
        if (err) {
          rej(err);
        }
        resp(false);
      }
    );
  });
}

function updateRecIdFE(empPhone, recId) {
  return new Promise((resp, rej) => {
    cloudsql.query(
      `UPDATE active_fe_in_last_5_days SET recId=? WHERE empPhone LIKE "%${empPhone}%";`,
      [recId],
      (err, _result) => {
        if (err) {
          rej(err);
        }
        resp(false);
      }
    );
  });
}

function checkId(Id) {
  return new Promise((resp, rej) => {
    try {
      cloudsql.query(
        `SELECT * FROM tractor_sathi_raw WHERE Id LIKE "%${Id}%";`,
        (err, result) => {
          if (err) {
            console.log(err);
            rej(err);
          }
          if (result.length > 0) {
            resp(true);
          } else {
            resp(false);
          }
        }
      );
    } catch (error) {
      console.log("HERE > checkId", error);
      rej(error);
    }
  });
}

function getRowsByStatus(status) {
  return new Promise((resp, rej) => {
    try {
      cloudsql.query(
        `SELECT phone_number, recId, state, call_id FROM tractor_sathi_raw WHERE status=${status} and not isnull(recId) LIMIT 10;`,
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

function getRowsByStatusFE(status) {
  return new Promise((resp, rej) => {
    try {
      cloudsql.query(
        `SELECT empPhone, empFirstName, managerFirstName, managerPhone, call_id, recId FROM active_fe_in_last_5_days WHERE status=${status} LIMIT 10;`,
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

function getRow() {
  return new Promise((resp, rej) => {
    try {
      cloudsql.query(
        `SELECT fields FROM tractor_sathi_raw WHERE data_cleaned IS NULL ORDER BY Id DESC LIMIT 250;`,
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
        `UPDATE tractor_sathi_raw SET data_cleaned=? WHERE Id=${id};`,
        [1],
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

function runApprovedQuery(query, values, id) {
  console.log("@@@",id);
  return new Promise((resp, rej) => {
    try {
      cloudsql.query(query, values, (err, result) => {
        if (err) {
          console.log(err);
          rej(err);
        }
        resp(id);
      });
    } catch (error) {
      rej(error);
    }
  });
}

function getPhoneNumber(phone_number) {
  console.log(phone_number);
  return new Promise((resp, rej) => {
    try {
      let something = `SELECT count(Form_Id) as count FROM corona_raw_data where Filled_by LIKE '%${phone_number}%'`;
    //  console.log("som", something);
      cloudsql.query(something, (err, result) => {
        if (err) {
          console.log(err);
          rej(err);
        }
        console.log(result);
        resp(result);
      });
    } catch (error) {
      rej(error);
    }
  });
}

function getRunnersAndManagers() {
  return new Promise((resp, rej) => {
    try {
      const date = new Date();
      let dateStr =
        date.getFullYear() +
        "-" +
        ("0" + (date.getMonth() + 1)).slice(-2) +
        "-" +
        ("0" + (date.getDate() - 5)).slice(-2);
      console.log(
        "QUERY",
        `select distinct(Forms.filledBy), Employees.empFirstName, Employees.empLastName, Employees.empPhone, Employees.managerId, man.empFirstName as managerFirstname, man.empLastName as managerLastname, man.empPhone as managerPhone from Forms right join Employees On Forms.filledBy=Employees.empId right join Employees man on Employees.managerId=man.empId where Forms.formSpecId in (107901, 107900, 107899, 107896) and createdTime >= '${dateStr}'`
      );
      drappSql.query(
        `select distinct(Forms.filledBy), Employees.empFirstName, Employees.empLastName, Employees.empPhone, Employees.managerId, man.empFirstName as managerFirstname, man.empLastName as managerLastname, man.empPhone as managerPhone from Forms right join Employees On Forms.filledBy=Employees.empId right join Employees man on Employees.managerId=man.empId where Forms.formSpecId in (107901, 107900, 107899, 107896) and createdTime >= '${dateStr}'`,
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

// function getRunnersAndManagers(){
//     return new Promise((resp, rej)=>{
//         try {
//             const date = new Date()
//             let dateStr = ('0'+(date.getDate()-5)).slice(-2)+'-'+('0'+date.getMonth()).slice(-2)+'-'+date.getFullYear()
//             drappSql.query(`select Employees.empFirstName, Employees.empLastName, Employees.empPhone, Employees.managerId, man.empFirstName as managerFirstname, man.empLastName as managerLastname, man.empPhone as managerPhone from Employees right join Employees man on Employees.managerId=man.empId `, (err, result)=>{
//                 if(err){
//                     console.log(err)
//                     rej(err)
//                 }
//                 resp(result)
//             })
//         } catch (error) {
//             rej(error)
//         }
//     })
// }

function getAllStates() {
  return new Promise((resp, rej) => {
    cloudsql.query(
      "select distinct(state_name) from villageData",
      (err, result) => {
        if (err) {
          console.log(err);
          rej(err);
        }
        resp(result);
      }
    );
  });
}

function getDist(state) {
  return new Promise((resp, rej) => {
    cloudsql.query(
      `select distinct(district_name) from villageData where state_name='${state}'`,
      (err, result) => {
        if (err) {
          console.log(err);
          rej(err);
        }
        resp(result);
      }
    );
  });
}

function getTehsil(state, dist) {
  return new Promise((resp, rej) => {
    cloudsql.query(
      `select distinct(tehsil_name) from villageData where state_name='${state}' and district_name='${dist}'`,
      (err, result) => {
        if (err) {
          console.log(err);
          rej(err);
        }
        resp(result);
      }
    );
  });
}
function getVillage(state, dist, tehsil) {
  return new Promise((resp, rej) => {
    cloudsql.query(
      `select distinct(village_id) from villageData where state_name='${state}' and district_name='${dist}' and tehsil_name='${tehsil}'`,
      (err, result) => {
        if (err) {
          console.log(err);
          rej(err);
        }
        resp(result);
      }
    );
  });
}

module.exports = {
  insertRawData,
  updateRawData,
  checkId,
  getRowsByStatus,
  updateStatusRawData,
  getRow,
  runQuery,
  changeCleanedStatus,
  getPhoneNumber,
  runApprovedQuery,
  getRunnersAndManagers,
  getRowsByStatusFE,
  updateStatusRawDataFE,
  updateRecIdFE,
  getAllStates,
  getDist,
  getTehsil,
  getVillage,
};
