const cloudsql = require("../../utils/cloudSql");
const cloudsqlPartnerApp = require("./cloudSql");

function insertIntoDB(query, values) {
  console.log(values)
  return new Promise((resp, rej) => {
    cloudsqlPartnerApp.query(query, values, (err, result) => {
      if (err) {
        console.log(err);
        rej(err);
      } else {
        resp(result);
      }
    });
  });
}
function validateBeneficiaryIdFromDb(query, values) {
  return new Promise((resp, rej) => {
    cloudsqlPartnerApp.query(query, values, (err, result) => {
      if (err) {
        console.log(err);
        rej(err);
      } else {
        console.log(result.length);
        if (result.length >= 1) {
          resp({
            success: true,
          });
        } else {
          resp({
            success: false,
          });
        }
      }
    });
  });
}
function insertIntoDB3(query, values) {
  // console.log(values, formid)
  return new Promise((resp, rej) => {
    cloudsql.query(query, values, (err, result) => {
      if (err) {
        console.log(err);
        rej(err);
      } else {
        resp(result);
      }
    });
  });
}

function insertIntoLogsDB(query, values) {
  return new Promise((resp, rej) => {
    cloudsql.query(query, values, (err, result) => {
      if (err) {
        console.log(err);
        rej(err);
      } else {
        resp();
      }
    });
  });
}



function updateIntoDB(form_Id, fields, update_dt) {
  return new Promise((resp, rej) => {
    try {
      cloudsqlPartnerApp.query(
        `UPDATE partnerApp_Beneficiary_Details SET beneficiary_reference_id=?, name=?, birth_year=?, photo_id_type=?, photo_id_number=?, comorbidity_ind=?, vaccination_status=?,vaccination_status_copy=?, vaccine=?, vaccine_copy=?,dose1_date=?,dose1_date_copy=?, dose2_date=?, lat_lng=?, session_token=?, update_TimeDate=?, submit_status=?, runner_mobile=?, runner_email=? WHERE form_Id="${form_Id}";`,
        [
          fields.beneficiary_reference_id,
          fields.name,
          fields.birth_year,
          fields.photo_id_type,
          fields.photo_id_number,
          fields.comorbidity_ind,
          fields.vaccination_status,
          fields.vaccination_status_copy,
          fields.vaccine,
          fields.vaccine_copy,
          fields.dose1_date,
          fields.dose1_date_copy,
          fields.dose2_date,
          fields.lat_lng,
          fields.session_token,
          update_dt,
          fields.submit_status,
          fields.runner_mobile,
          fields.runner_email
        ],
        (err, result) => {
          if (err) {
            console.log(err);
            rej(err);
          } else {
            console.log("update", form_Id);
            resp(form_Id);
          }
        }
      );
    } catch (error) {
      rej(error);
    }
  });
}
function updateIntoDBFullyVaccinated(form_Id, fields, update_dt) {
  return new Promise((resp, rej) => {
    try {
      cloudsqlPartnerApp.query(
        `UPDATE partnerApp_Beneficiary_Details SET beneficiary_reference_id=?, name=?, birth_year=?, photo_id_type=?, photo_id_number=?, comorbidity_ind=?, vaccination_status=?, vaccine=?, dose1_date=?, dose2_date=?, lat_lng=?, session_token=?, update_TimeDate=?, submit_status=?, runner_mobile=?, runner_email=? WHERE form_Id="${form_Id}";`,
        [
          fields.beneficiary_reference_id,
          fields.name,
          fields.birth_year,
          fields.photo_id_type,
          fields.photo_id_number,
          fields.comorbidity_ind,
          fields.vaccination_status,
          fields.vaccine,
          fields.dose1_date,
          fields.dose2_date,
          fields.lat_lng,
          fields.session_token,
          update_dt,
          fields.submit_status,
          fields.runner_mobile,
          fields.runner_email
        ],
        (err, result) => {
          if (err) {
            console.log(err);
            rej(err);
          } else {
            console.log("update", form_Id);
            resp(form_Id);
          }
        }
      );
    } catch (error) {
      rej(error);
    }
  });
}

function getCountOfFormsFilled(query, phone_number) {
  console.log(phone_number);
  return new Promise((resp, rej) => {
    try {
      cloudsqlPartnerApp.query(query, (err, result) => {
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



function updateRecordIdInSql(recId, form_Id,baseStatus) {
  return new Promise((resp, rej) => {
    try {
      cloudsqlPartnerApp.query(
        `UPDATE partnerApp_Beneficiary_Details SET recId=?,base_status=? WHERE form_Id="${form_Id}";`,
        [
          recId,
          baseStatus
        ],
        (err, result) => {
          if (err) {
            console.log(err);
            rej(err);
          } else {
            console.log("update", form_Id);
            resp(form_Id);
          }
        }
      );
    } catch (error) {
      rej(error);
    }
  });
}

function updatedose1(form_Id, fields, update_dt) {
  console.log("updatingdose1", form_Id);
  return new Promise((resp, rej) => {
    try {
      cloudsqlPartnerApp.query(
        `UPDATE partnerApp_Beneficiary_Details SET beneficiary_reference_id=?, name=?, birth_year=?, photo_id_type=?, photo_id_number=?, comorbidity_ind=?, vaccination_status=?, vaccine=?, dose1_date=?,vaccination_status_copy=? ,vaccine_copy=?,dose1_date_copy=?,dose2_date=?, lat_lng=?, session_token=?, update_TimeDate=? , update_dose1dt=?, submit_status=?, runner_mobile=?, runner_email=? WHERE form_Id="${form_Id}";`,
        [
          fields.beneficiary_reference_id,
          fields.name,
          fields.birth_year,
          fields.photo_id_type,
          fields.photo_id_number,
          fields.comorbidity_ind,

          fields.vaccination_status,
          fields.vaccine,
          fields.dose1_date,
          fields.vaccination_status_copy,
          fields.vaccine_copy,
          fields.dose1_date_copy,

          fields.dose2_date,
          fields.lat_lng,
          fields.session_token,
          update_dt,
          update_dt,
          fields.submit_status,
          fields.runner_mobile,
          fields.runner_email
        ],
        (err, result) => {
          if (err) {
            console.log(err);
            rej(err);
          } else {
            console.log("update form_Id", form_Id);
            resp();
          }
        }
      );
    } catch (error) {
      rej(error);
    }
  });
}
function updateDbSentStatus(form_Id) {
  console.log("updatingdose1", form_Id);
  return new Promise((resp, rej) => {
    try {
      cloudsql.query(
        `UPDATE partnerApp_Beneficiary_Details SET datasenttodb=? WHERE form_Id="${form_Id}";`,
        [
          1
        ],
        (err, result) => {
          if (err) {
            console.log(err);
            rej(err);
          } else {
            console.log("update form_Id", form_Id);
            resp();
          }
        }
      );
    } catch (error) {
      rej(error);
    }
  });
}

function update2ndDose(form_Id, fields, update_dt, updateIt) {
  console.log("updatingDose2nd");
  return new Promise((resp, rej) => {
    try {
      if (updateIt) {
        cloudsqlPartnerApp.query(

          `UPDATE partnerApp_Beneficiary_Details SET beneficiary_reference_id=?, name=?, birth_year=?, photo_id_type=?, photo_id_number=?, comorbidity_ind=?, vaccination_status=?,vaccine=?, dose1_date=?, dose2_date=?, lat_lng=?, session_token=?, update_TimeDate=?,update_dose1dt=?, update_dose2_dt=?, submit_status=?, runner_mobile=?, runner_email=? WHERE form_Id="${form_Id}";`,
          [
            fields.beneficiary_reference_id,
            fields.name,
            fields.birth_year,
            fields.photo_id_type,
            fields.photo_id_number,
            fields.comorbidity_ind,
            fields.vaccination_status,
            fields.vaccine,
            fields.dose1_date,
            fields.dose2_date,
            fields.lat_lng,
            fields.session_token,
            update_dt,
            update_dt,
            update_dt,
            fields.submit_status,
            fields.runner_mobile,
            fields.runner_email
          ],
          (err, result) => {
            if (err) {
              console.log(err);
              rej(err);
            } else {
              console.log("update form_Id", form_Id);
              resp();
            }
          }
        );
      } else {
        cloudsqlPartnerApp.query(

          `UPDATE partnerApp_Beneficiary_Details SET beneficiary_reference_id=?, name=?, birth_year=?, photo_id_type=?, photo_id_number=?, comorbidity_ind=?, vaccination_status=?,vaccine=?, dose1_date=?, dose2_date=?, lat_lng=?, session_token=?, update_TimeDate=?, update_dose2_dt=?, submit_status=?, runner_mobile=?, runner_email=? WHERE form_Id="${form_Id}";`,
          [
            fields.beneficiary_reference_id,
            fields.name,
            fields.birth_year,
            fields.photo_id_type,
            fields.photo_id_number,
            fields.comorbidity_ind,
            fields.vaccination_status,
            fields.vaccine,
            fields.dose1_date,
            fields.dose2_date,
            fields.lat_lng,
            fields.session_token,
            update_dt,
            update_dt,
            fields.submit_status,
            fields.runner_mobile,
            fields.runner_email
          ],
          (err, result) => {
            if (err) {
              console.log(err);
              rej(err);
            } else {
              console.log("update form_Id", form_Id);
              resp();
            }
          }
        );
      }

    } catch (error) {
      rej(error);
    }
  });
}
function updateMobileNumber(form_Id, number) {
  console.log("updating beneficiary mobile number");
  return new Promise((resp, rej) => {
    try {
      cloudsqlPartnerApp.query(
        `UPDATE partnerApp_Beneficiary_Details SET mobile_number=?,has_updated_number=? WHERE form_Id="${form_Id}";`,
        [
          number,
          "Yes"
        ],
        (err, result) => {
          if (err) {
            console.log(err);
            rej(err);
          } else {
            console.log("update form_Id", form_Id);
            resp("success");
          }
        }
      );

    } catch (error) {
      rej(error);
    }
  });
}

function getdatafromdb(form_Id) {
  return new Promise((resp, rej) => {
    try {
      cloudsqlPartnerApp.query(
        `select * from partnerApp_Beneficiary_Details where form_Id="${form_Id}"`,
        (err, result) => {
          if (err) {
            console.log(err);
            rej(err);
          }
          resp(result);
        }
      );
    } catch (err) {
      rej(error);
    }
  });
}
function getdatafromdbForTransfer() {
  return new Promise((resp, rej) => {
    try {
      cloudsql.query(
        `select * from partnerApp_Beneficiary_Details where datasenttodb is null ORDER BY form_Id ASC LIMIT 50 `,
        (err, result) => {
          if (err) {
            console.log(err);
            rej(err);
          }
          resp(result);
          // let query = `INSERT INTO partnerApp_Beneficiary_Details SET ?`;
          // insertIntoDB3(query,result).then((res)=>{
          //     resp(res)
          // }).catch((err)=>{
          //   rej(err)
          // })

        }
      );
    } catch (err) {
      rej(err);
    }
  });
}
function getparticulardatafromdb(form_Id) {
  return new Promise((resp, rej) => {
    try {
      cloudsqlPartnerApp.query(
        `select recId,form_Id,beneficiary_reference_id,name,birth_year,photo_id_type,photo_id_number,type_of_person,comorbidity_ind,vaccination_status,vaccine,dose1_date,dose2_date,lat_lng,session_token,update_TimeDate,update_dose1dt,update_dose2_dt,runner_email,runner_mobile,runner_name,submit_status,beneficiary_Id_from_2nd_dose,mobile_number,gender,village,beneficiary_id_push_field,first_dose_beneficiary_name,mobile_number_copy,birth_year_copy,gender_copy,photo_id_type_copy,photo_id_number_copy,vaccination_status_copy,vaccine_copy,dose1_date_copy,first_dose_beneficiary_name,state,district,taluka,app_version from partnerApp_Beneficiary_Details where form_Id="${form_Id}"`,
        (err, result) => {
          if (err) {
            console.log(err);
            rej(err);
          }
          resp(result);
        }
      );
    } catch (err) {
      rej(error);
    }
  });
}

function insertIntoDB2(query, values) {
  return new Promise((resp, rej) => {
    cloudsqlPartnerApp.query(query, values, (err, result) => {

      console.log("@@Value", JSON.stringify(values[0]));
      console.log("@@@@@@", result[0]);
      if (err) {
        console.log("@@ERR" + err);
        rej(err)
      }
      if (result[0] != undefined) {
        const str = new Date().toLocaleString("en-US", {
          timeZone: "Asia/Kolkata",
        });
        if (values[0].vaccination_status === "Not Vaccinated") {
          updateIntoDB(result[0].form_Id, values[0], str)
            .then((r) => {
              resp(result[0].form_Id);
            })
            .catch((e) => {
              console.log("error in updating ", e);
              rej(err);
            });
        } else if (values[0].vaccination_status === "Partially Vaccinated") {
          console.log("@Form ID1", result[0].form_Id);

          if (result[0].update_dose1dt === undefined || result[0].update_dose1dt === null) {
            console.log("@Form ID", result[0].form_Id);
            updatedose1(result[0].form_Id, values[0], str)
              .then((r) => {
                resp(values[0].form_Id);
              })
              .catch((e) => {
                console.log("error in updating ", e);
                rej(err);
              });
          } else {
            updateIntoDB(result[0].form_Id, values[0], str)
              .then((r) => {
                resp(result[0].form_Id);
              })
              .catch((e) => {
                console.log("error in updating ", e);
                rej(err);
              });
          }
        } else if (values[0].vaccination_status === "Vaccinated") {
          console.log("condition vaccinated");
          console.log("@@@V", result[0].update_dose2_dt);
          if (
            result[0].update_dose2_dt === null ||
            result[0].update_dose2_dt === undefined
          ) {
            var updateIt = false;
            if (result[0].update_dose1dt === null || result[0].update_dose1dt === undefined || result[0].update_dose1dt === "") {
              updateIt = true;
            }
            update2ndDose(result[0].form_Id, values[0], str, updateIt)
              .then((r) => {
                resp(result[0].form_Id);
              })
              .catch((e) => {
                console.log("error in updating ", e);
                rej(err);
              });
          } else {
            updateIntoDB(result[0].form_Id, values[0], str)
              .then((r) => {
                resp(result[0].form_Id);
              })
              .catch((e) => {
                console.log("error in updating ", e);
                rej(err);
              });
          }
        }
      } else {
        console.log("Data ni h");
        let query = `INSERT INTO partnerApp_Beneficiary_Details SET ?`;
        console.log([values]);

        insertIntoDBafterchecking(query, [values]).then((result) => {
          resp(result)
        }).catch((err) => {
          rej(err)
        })
      }

    });

  });
}



function getDataFromDb(query, values) {
  return new Promise((resp, rej) => {
    cloudsql.query(query, values, (err, result) => {

      console.log("@@Value", JSON.stringify(values[0]));
      console.log("@@@@@@", result[0]);
      if (err) {
        rej(err)
      }
      if (result[0] != undefined) {
        const str = new Date().toLocaleString("en-US", {
          timeZone: "Asia/Kolkata",
        });

      } else {
        console.log("Data ni h");
        let query = `INSERT INTO partnerApp_Beneficiary_Details SET ?`;
        insertIntoDBafterchecking(query, [values]).then((result) => {
          resp(result)
        }).catch((err) => {
          rej(err)
        })
      }

    });

  });
}
function insertIntoDBafterchecking(query, values) {
  console.log("@@,,@@" + values[0])
  return new Promise((resp, rej) => {
    cloudsqlPartnerApp.query(query, values[0], (err, result) => {
      if (err) {
        console.log(err);
        rej(err);
      } else {
        resp("success");
      }
    });
  });
}



module.exports = {
  insertIntoDB,
  updateIntoDB,
  updateIntoDBFullyVaccinated,
  updatedose1,
  update2ndDose,
  getdatafromdb,
  insertIntoDB2,
  insertIntoLogsDB,
  insertIntoDBafterchecking,
  updateRecordIdInSql,
  getparticulardatafromdb,
  getCountOfFormsFilled,
  getdatafromdbForTransfer,
  insertIntoDB3,
  updateDbSentStatus,
  updateMobileNumber,
  validateBeneficiaryIdFromDb
};
