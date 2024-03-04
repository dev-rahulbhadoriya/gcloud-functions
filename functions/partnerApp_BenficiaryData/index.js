const { getFields } = require("./utils/commanFunction");
const cloudsql = require("../utils/cloudSql");
const {
  getdatafromdb,
  update2ndDose,
  updatedose1,
  insertIntoDB,
  updateIntoDB,
  insertIntoDB2,
  insertIntoLogsDB,
  getCountOfFormsFilled,
  updateRecordIdInSql,
  getparticulardatafromdb,
  getdatafromdbForTransfer,
  insertIntoDB3,
  updateDbSentStatus,
  updateMobileNumber,
  updateIntoDBFullyVaccinated,
  validateBeneficiaryIdFromDb
} = require("./utils/sqlfunctions");
const { insertToAirtable, updateToAirtable, insertToAirtableThroughPostman, insertToAirtableFirstTime, insertRunnerIssuesToAirtable, updateMobileNumberInAirtable } = require("./utils/airtableFunction");
const sleep = require("atomic-sleep");
const cloudsqlPartnerApp = require("./utils/cloudSql");
const { PartnerAppInternalBase02 } = require("./utils/apiAirtable");
const { base } = require("airtable");



function partnerAppBeneficiaryData(_request, _response) {
  try {
    const datafields = _request.body;
    let sqlData = {};

    //Change the base status here according to the latest base number
    var baseStatus = "6";
    const date = new Date();
    var time = date.toLocaleString('en-US', { hour: 'numeric', minute: 'numeric', second: 'numeric', hour12: true, timeZone: "Asia/Kolkata" })
    const str = date.getDate() + "/" + (date.getMonth() + 1) + "/" + date.getFullYear() + " " + time
    for (const key in datafields) {
      const value = datafields[key];
      const k = getFields[key];
      if (key === "vaccination_status") {
        var something = datafields[key];
        if (something === "Vaccinated" || something === "Not Found") {
          sqlData["update_dose1dt"] = str;
          sqlData["update_dose2_dt"] = str;
        } else if (
          something === "Partially Vaccinated" ||
          something === "Not Found"
        ) {
          sqlData["update_dose1dt"] = str;
        } else {
          console.log("Not vaccinated");
        }
      }
      sqlData["registration_time"] = str
      sqlData["beneficiary_Id_from_2nd_dose"] = datafields["beneficiary_reference_id"]
      sqlData["registration_name"] = datafields["name"]
      sqlData["mobile_number_copy"] = datafields["mobile_number"]
      sqlData["birth_year_copy"] = datafields["birth_year"]
      sqlData["gender_copy"] = datafields["gender"]
      sqlData["photo_id_type_copy"] = datafields["photo_id_type"]
      sqlData["photo_id_number_copy"] = datafields["photo_id_number"]
      sqlData["vaccination_status_copy"] = datafields["vaccination_status"]
      sqlData["vaccine_copy"] = datafields["vaccine"]
      sqlData["district"] = datafields["district"] + " (" + datafields["state"] + ")"
      sqlData["dose1_date_copy"] = datafields["dose1_date"]
      sqlData["data_cleaned"] = 1;
      sqlData["base_status"] = baseStatus;

      if (k) {
        sqlData[k] = value;
      }
    }
    let query = `INSERT INTO partnerApp_Beneficiary_Details SET ?`;
    insertIntoDB(query, [sqlData], datafields.form_Id)
      .then((rec) => {
        sqlData["form_Id"] = (rec.insertId).toString();
        _response.send("success").status(200);

        if (sqlData["submit_status"] === "Yes" || sqlData["submit_status"] === "Submitted From Partner App") {
          insertToAirtableFirstTime([sqlData]).then((resp) => {
            console.log("@@@@Rec ID", resp);
            updateRecordIdInSql(resp, sqlData["form_Id"], baseStatus).then((resp) => {
              console.log(resp);
            }).catch((err) => {
              console.log(err);
            })
          }).catch((err) => {
            console.log(err);
          })
        }
        //Send data to airtable
      })
      .catch((err) => {
        console.log("err", err);
        //Send data to airtable
        _response.send("failed").status(500);
      });
  } catch (err) {
    console.error("SQLINSERT_FAILED", new Error(err));
    _response.send(err).status(500);
  }
}
function checkMobileNumberAndBeneficiary(_request, _response) {
  try {
    const datafields = _request.body;
    let query = `Select * from partnerApp_Beneficiary_Details where form_Id=${datafields.form_Id} and runner_mobile<=>${datafields.runner_mobile} and beneficiary_reference_id<=>${datafields.beneficiary_reference_id} `;
    validateBeneficiaryIdFromDb(query, datafields.form_Id)
      .then((rec) => {
        // sqlData["form_Id"] = (rec.insertId).toString();
        console.log("@@@", rec.success);
        if (rec.success === true) {
          _response.send({
            success: true
          }).status(200);
        } else {

          _response.send({
            success: false,
            message: "This beneficiary already exists, Hence you cannot submit this data"
          }).status(200);
        }
      })
      .catch((err) => {
        console.log("err", err);
        _response.send("failed").status(500);
      });
  } catch (err) {
    console.error("SQL DATA FETCH FAILED", new Error(err));
    _response.send(err).status(500);
  }
}

// getting data from db using mobile no
function getDataFormMobileNo(_request, _response) {
  try {
    const mobile = _request.query.mobile;
    cloudsqlPartnerApp.query(
      `SELECT * FROM partnerApp_Beneficiary_Details WHERE runner_mobile="${mobile}" and (submit_status="Submitted From Partner App" or submit_status="Yes")`,
      (err, result) => {
        if (err) {
          _response.send(err).status(500);
        } else {

          result.forEach(result => {
            result["created_at"] = result["registration_time"];
            console.log(result["created_at"]);
          });
          _response.send(result).status(200);
        }
      }
    );
  } catch (err) {
    console.error("error in getting data", new Error(err));
    _response.send(err).status(500);
  }
}
function postDataToAirtable(_request, _response) {
  _request.body.forEach(element => {
    var form_id = element.form_Id.toString();
    element.form_Id = element.form_Id.toString()
    sleep(1000)
    insertToAirtableThroughPostman(element).then((result) => {
      updateRecordIdInSql(result, form_id.toString())
      _response.send(result).status(200)
    }).catch((err) => {
      _response.send(err).status(500)
    })
  });
}

function getCountOfFormsFilledOnBeneficiaryNo(_request, _response) {
  try {
    const mobile = _request.query.mobile;
    cloudsqlPartnerApp.query(
      `SELECT * FROM partnerApp_Beneficiary_Details WHERE mobile_number LIKE"%${mobile}" and (submit_status="Submitted From Partner App" or submit_status="Yes")`,
      (err, result) => {
        if (err) {
          _response.send(err).status(500);
        } else {
          console.log(mobile);
          _response.send(result).status(200);
        }
      }
    );
  } catch (err) {
    console.error("error in getting data", new Error(err));
    _response.send(err).status(500);
  }
}
function getAllData(_request, _response) {
  getdatafromdbForTransfer().then((res) => {

    let query = `INSERT INTO partnerApp_Beneficiary_Details SET ?`;
    res.forEach(element => {
      insertIntoDB3(query, element).then((res) => {
        updateDbSentStatus(element.form_Id).then((res) => {
          console.log("Bhg bsdk");
        }).catch((err) => {
          _response.send(err)
        })
      }).catch((err) => {
        _response.send(err)
      });

    });
    _response.send("Success")
  }).catch((err) => {
    _response.send(err);
  })
}

function sendRunnerIssueToAirtable(_request, _response) {
  try {

    insertRunnerIssuesToAirtable(_request.body).then((res) => {
      _response.send("success").status(200);
    }).catch((err) => {
      console.log(err);
      _response.send(err).status(500);
    });
  } catch (err) {

  }
}
function updateBeneficiaryMobileNumber(_request, _response) {
  try {
    const form_id = _request.body.form_Id;
    const number = _request.body.mobile_number;
    var baseStatus;
    getparticulardatafromdb(form_id).then((res) => {
      console.log(res[0].recId);
      baseStatus = res[0].base_status;
      if (res[0].recId === null || res[0].recId === undefined || res[0].recId === "") {
        console.log("Updating only sql");
        updateMobileNumber(form_id, number).then((res) => {
          _response.send("Success").status(200);
        }).catch((err) => {
          _response.send(err).status(500)

        })

      } else {
        updateMobileNumber(form_id, number).then((resp) => {
          if (resp) {
            const airtableFields = {}
            console.log("Updated SQL now updating on airtable");

            airtableFields.mobile_number = number;
            updateToAirtable(airtableFields, res[0].recId, baseStatus).then((res) => {
              _response.send("success").status(200);
            }).catch((err) => {
              _response.send(err).status(500);
            })
          } else {
            console.log(err);
          }
        }).catch((err) => {
          if (err) {
            _response.send(err).status(500)
          }
        })

      }

    }).catch((err) => {
      console.log(err);
    })

  } catch (err) {

  }
}
function updateDataformId(_request, _response) {

  //Add new base status here according to the latest base 
  var baseStatus = "6";
  
  try {
    const data = _request.body;
    const date = new Date();
    var time = date.toLocaleString('en-US', { hour: 'numeric', minute: 'numeric', second: 'numeric', hour12: true, timeZone: "Asia/Kolkata" })
    const str = date.getDate() + "/" + (date.getMonth() + 1) + "/" + date.getFullYear() + " " + time
    getdatafromdb(data.form_Id)
      .then((values) => {
        if (values === undefined) {
          _response.send("Id not found").status(500);
        } else {
          console.log(values[0]);
          if (data.vaccination_status === "Not Vaccinated") {
            data.vaccination_status_copy = data.vaccination_status;
            data.vaccine_copy = data.vaccine
            data.dose1_date_copy = data.dose1_date;
            updateIntoDB(data.form_Id, data, str)
              .then((r) => {
                data.update_TimeDate = str;
                getparticulardatafromdb(data.form_Id).then((result) => {
                  const airtableFields = {}
                  airtableFields.beneficiary_reference_id = result[0].beneficiary_reference_id;
                  airtableFields.name = result[0].name;
                  airtableFields.birth_year = result[0].birth_year;
                  airtableFields.photo_id_type = result[0].photo_id_type;
                  airtableFields.photo_id_number = result[0].photo_id_number;
                  airtableFields.type_of_person = result[0].type_of_person;
                  airtableFields.comorbidity_ind = result[0].comorbidity_ind;
                  airtableFields.vaccination_status = result[0].vaccination_status;
                  airtableFields.vaccine = result[0].vaccine;
                  var d1 = result[0].dose1_date;
                  d1 = d1.replace('-', '/');
                  d1 = d1.replace('-', '/');
                  d1 = d1.replace('-', '/');

                  var d2 = result[0].dose2_date;
                  d2 = d2.replace('-', '/');
                  d2 = d2.replace('-', '/');
                  d2 = d2.replace('-', '/');

                  airtableFields.dose1_date = d1;
                  airtableFields.dose2_date = d2;
                  airtableFields.lat_lng = result[0].lat_lng;
                  airtableFields.session_token = result[0].session_token;
                  airtableFields.update_TimeDate = result[0].update_TimeDate;
                  airtableFields.update_dose1dt = result[0].update_dose1dt;
                  airtableFields.update_dose2_dt = result[0].update_dose2_dt;
                  airtableFields.runner_email = result[0].runner_email;
                  airtableFields.runner_mobile = result[0].runner_mobile;
                  airtableFields.submit_status = result[0].submit_status;


                  //This if block is executed only if the data status is case assign
                  if (result[0].recId === null || result[0].recId === undefined) {
                    console.log("Record ID Not Found Inserting in airtable");
                    airtableFields.form_Id = result[0].form_Id.toString();
                    airtableFields.mobile_number = result[0].mobile_number;
                    airtableFields.mobile_number_copy = result[0].mobile_number;
                    airtableFields.gender = result[0].gender;
                    airtableFields.gender_copy = result[0].gender;
                    airtableFields.village = result[0].village;
                    airtableFields.base_status = baseStatus


                    //Insert the data in new base
                    //---> Go into this function and change the old base to new base by overwritting...
                    insertToAirtable(airtableFields).then((res) => {
                      console.log("Inserted To Airtable", res);
                      //If the data is going to insert in airtable then the 
                      //rec ID & base status are going to update through below function
                      //The base status which is getting updated here is going to be new base status
                      updateRecordIdInSql(res, result[0].form_Id, baseStatus).then((res) => {
                        console.log("Record ID Update in Sql");
                        _response.send("success").status(200);
                      }).catch((err) => {

                      })
                    }).catch((err) => {

                    });
                  } else {

                    // for (let i = 0; i < baseName.length; i++) {
                    //   let value = false;
                    //   console.log("BASENAME@@@", baseName[i]);
                    //   updateToAirtable(airtableFields, result[0].recId, baseName[i]).then((res) => {
                    //     value = true;
                    //     _response.send("success").status(200);
                    //     console.log(`Successfully updated in airtable base ${baseName[i]} and rec id is -`, res);
                    //   }).catch((err) => {
                    // console.log(err);
                    //     _response.send("success").status(200);
                    //   })
                    // }

                    //updateToAirtable will update the function according to base status
                    //---> Go into the function below for adding the condition of new base
                    updateToAirtable(airtableFields, result[0].recId, values[0].base_status).then((res) => {

                      _response.send("success").status(200);
                      console.log(`Successfully updated in airtable base ${values[0].base_status} and rec id is -`, res);
                    }).catch((err) => {
                      //console.log(err);
                    })
                  }
                }).catch((err) => {
                  console.log(err);
                })

              })
              .catch((e) => {
                _response.send(e).status(500);
              });
          } else if (data.vaccination_status === "Partially Vaccinated") {
            if (
              values[0].update_dose1dt === undefined ||
              values[0].update_dose1dt === null || values[0].update_dose2_dt === ""
            ) {

              data.vaccination_status_copy = data.vaccination_status;
              data.vaccine_copy = data.vaccine
              data.dose1_date_copy = data.dose1_date;

              updatedose1(data.form_Id, data, str)
                .then((r) => {
                  //update into airtable
                  data.update_TimeDate = str;
                  data.update_dose1dt = str;
                  const airtableFields = {}
                  getparticulardatafromdb(data.form_Id).then((result) => {
                    airtableFields.beneficiary_reference_id = result[0].beneficiary_reference_id;
                    airtableFields.beneficiary_Id_from_2nd_dose = result[0].beneficiary_reference_id;
                    airtableFields.name = result[0].name;
                    airtableFields.birth_year = result[0].birth_year;
                    airtableFields.photo_id_type = result[0].photo_id_type;
                    airtableFields.photo_id_number = result[0].photo_id_number;
                    airtableFields.type_of_person = result[0].type_of_person;
                    airtableFields.comorbidity_ind = result[0].comorbidity_ind;
                    airtableFields.vaccination_status = result[0].vaccination_status;
                    airtableFields.vaccine = result[0].vaccine;
                    airtableFields.vaccination_status_copy = result[0].vaccination_status;
                    airtableFields.vaccine_copy = result[0].vaccine;

                    var d1 = result[0].dose1_date;
                    d1 = d1.replace('-', '/');
                    d1 = d1.replace('-', '/');
                    d1 = d1.replace('-', '/');

                    var d2 = result[0].dose2_date;
                    d2 = d2.replace('-', '/');
                    d2 = d2.replace('-', '/');
                    d2 = d2.replace('-', '/');

                    airtableFields.dose1_date = d1;
                    airtableFields.dose1_date_copy = d1;

                    airtableFields.dose2_date = d2;
                    airtableFields.lat_lng = result[0].lat_lng;
                    airtableFields.session_token = result[0].session_token;
                    airtableFields.update_TimeDate = result[0].update_TimeDate;
                    airtableFields.update_dose1dt = result[0].update_dose1dt;
                    airtableFields.update_dose2_dt = result[0].update_dose2_dt;
                    airtableFields.runner_email = result[0].runner_email;
                    airtableFields.runner_mobile = result[0].runner_mobile;
                    airtableFields.submit_status = result[0].submit_status;
                    airtableFields.first_dose_beneficiary_name = result[0].name;

                    if (result[0].recId === null || result[0].recId === undefined) {
                      console.log("RecID Not Found Partially Vaccinated Insert in airtable");
                      airtableFields.form_Id = result[0].form_Id.toString();
                      airtableFields.mobile_number = result[0].mobile_number;
                      airtableFields.mobile_number_copy = result[0].mobile_number;
                      airtableFields.gender = result[0].gender;
                      airtableFields.gender_copy = result[0].gender_copy;

                      airtableFields.village = result[0].village;
                      airtableFields.runner_name = result[0].runner_name;
                      airtableFields.state = result[0].state;
                      airtableFields.district = result[0].district;
                      airtableFields.taluka = result[0].taluka;
                      airtableFields.first_dose_beneficiary_name = result[0].first_dose_beneficiary_name;
                      airtableFields.base_status = baseStatus

                      insertToAirtable(airtableFields).then((res) => {
                        console.log("Inserted To Airtable", res);
                        updateRecordIdInSql(res, result[0].form_Id, baseStatus).then((res) => {
                          console.log("Record ID Update in Sql");
                          _response.send("success").status(200);
                        }).catch((err) => {

                        })
                      }).catch((err) => {

                      });
                    } else {
                      // for (let i = 0; i < baseName.length; i++) {
                      //   let value = false;
                      //   console.log("BASENAME@@@", baseName[i]);
                      //   updateToAirtable(airtableFields, result[0].recId, baseName[i]).then((res) => {
                      //     console.log(res);
                      //     _response.send("success").status(200);
                      //   }).catch((err) => {
                      //     console.log(err);
                      //   })
                      // }

                      updateToAirtable(airtableFields, result[0].recId, values[0].base_status).then((res) => {
                        _response.send("success").status(200);
                        console.log(`Successfully updated in airtable base ${values[0].base_status} and rec id is -`, res);
                      }).catch((err) => {
                        //console.log(err);
                      })
                    }
                  }).catch((err) => {
                    console.log(err);
                  })
                })
                .catch((e) => {
                  _response.send(e).status(500);
                });

            } else {

              console.log("Inside Update Into DB (Partially)");
              data.vaccination_status_copy = data.vaccination_status;
              data.vaccine_copy = data.vaccine
              data.dose1_date_copy = data.dose1_date;

              console.log("data@@ " + data.vaccination_status_copy);

              updateIntoDB(data.form_Id, data, str)
                .then((r) => {
                  const airtableFields = {}
                  getparticulardatafromdb(data.form_Id).then((result) => {
                    airtableFields.beneficiary_reference_id = result[0].beneficiary_reference_id;
                    airtableFields.beneficiary_Id_from_2nd_dose = result[0].beneficiary_reference_id;

                    airtableFields.name = result[0].name;
                    airtableFields.birth_year = result[0].birth_year;
                    airtableFields.photo_id_type = result[0].photo_id_type;
                    airtableFields.photo_id_number = result[0].photo_id_number;
                    airtableFields.type_of_person = result[0].type_of_person;
                    airtableFields.comorbidity_ind = result[0].comorbidity_ind;
                    airtableFields.vaccination_status = result[0].vaccination_status;
                    airtableFields.vaccine = result[0].vaccine;
                    airtableFields.vaccination_status_copy = result[0].vaccination_status;
                    airtableFields.vaccine_copy = result[0].vaccine;

                    var d1 = result[0].dose1_date;
                    d1 = d1.replace('-', '/');
                    d1 = d1.replace('-', '/');
                    d1 = d1.replace('-', '/');

                    var d2 = result[0].dose2_date;
                    d2 = d2.replace('-', '/');
                    d2 = d2.replace('-', '/');
                    d2 = d2.replace('-', '/');

                    airtableFields.dose1_date = d1;
                    airtableFields.dose1_date_copy = d1;
                    airtableFields.dose2_date = d2;
                    airtableFields.lat_lng = result[0].lat_lng;
                    airtableFields.session_token = result[0].session_token;
                    airtableFields.update_TimeDate = result[0].update_TimeDate;
                    airtableFields.update_dose1dt = result[0].update_dose1dt;
                    airtableFields.update_dose2_dt = result[0].update_dose2_dt;
                    airtableFields.runner_email = result[0].runner_email;
                    airtableFields.runner_mobile = result[0].runner_mobile;
                    airtableFields.submit_status = result[0].submit_status;

                    if (result[0].first_dose_beneficiary_name === null | result[0].first_dose_beneficiary_name === undefined) {
                      airtableFields.first_dose_beneficiary_name = result[0].name;
                    } else {
                      airtableFields.first_dose_beneficiary_name = result[0].first_dose_beneficiary_name;
                    }

                    if (result[0].recId === null || result[0].recId === undefined) {
                      console.log("RecID Not Found Partially Vaccinated Insert in airtable");
                      airtableFields.form_Id = result[0].form_Id.toString();
                      airtableFields.mobile_number = result[0].mobile_number;
                      airtableFields.mobile_number_copy = result[0].mobile_number;
                      airtableFields.gender = result[0].gender;
                      airtableFields.gender_copy = result[0].gender;
                      airtableFields.village = result[0].village;
                      airtableFields.runner_name = result[0].runner_name;
                      airtableFields.state = result[0].state;
                      airtableFields.district = result[0].district;
                      airtableFields.taluka = result[0].taluka;
                      airtableFields.base_status = baseStatus

                      insertToAirtable(airtableFields).then((res) => {
                        console.log("Inserted To Airtable successfull", res);

                        updateRecordIdInSql(res, result[0].form_Id, baseStatus).then((res) => {
                          console.log("Record ID Update in Sql");
                          _response.send("success").status(200);
                        }).catch((err) => {

                        })
                      }).catch((err) => {

                      });
                    } else {
                      // for (let i = 0; i < baseName.length; i++) {
                      //   let value = false;
                      //   console.log("BASENAME@@@", baseName[i]);
                      //   updateToAirtable(airtableFields, result[0].recId, baseName[i]).then((res) => {
                      //     console.log(`Successfully updated in airtable base ${baseName[i]} and rec id is -`, res);
                      //     _response.send("success").status(200);
                      //   }).catch((err) => {
                      //     console.log(err);
                      //   })
                      // }

                      updateToAirtable(airtableFields, result[0].recId, values[0].base_status).then((res) => {
                        _response.send("success").status(200);
                        console.log(`Successfully updated in airtable base ${values[0].base_status} and rec id is -`, res);
                      }).catch((err) => {
                        //console.log(err);
                      })
                    }
                  }).catch((err) => {
                    console.log(err);
                  })

                  //update into airtable

                })
                .catch((e) => {
                  _response.send(e).status(500);
                });
            }
          } else if (data.vaccination_status === "Vaccinated") {
            if (
              values[0].update_dose2_dt === null ||
              values[0].update_dose2_dt === undefined ||
              values[0].update_dose2_dt === ""
            ) {
              var updateIt = false;
              if (values[0].update_dose1dt === null || values[0].update_dose1dt === undefined || values[0].update_dose1dt === "")
                updateIt = true;

              update2ndDose(data.form_Id, data, str, updateIt)
                .then((r) => {
                  console.log("Inside Update Into DB (Fully 1)");
                  data.update_TimeDate = str;
                  data.update_dose1dt = str;
                  data.update_dose2_dt = str;
                  getparticulardatafromdb(data.form_Id).then((result) => {
                    const airtableFields = {}

                    airtableFields.beneficiary_reference_id = result[0].beneficiary_reference_id;
                    airtableFields.name = result[0].name;
                    airtableFields.birth_year = result[0].birth_year;
                    airtableFields.photo_id_type = result[0].photo_id_type;
                    airtableFields.photo_id_number = result[0].photo_id_number;
                    airtableFields.type_of_person = result[0].type_of_person;
                    airtableFields.comorbidity_ind = result[0].comorbidity_ind;
                    airtableFields.vaccination_status = result[0].vaccination_status;
                    airtableFields.vaccine = result[0].vaccine;

                    var d1 = result[0].dose1_date;
                    d1 = d1.replace('-', '/');
                    d1 = d1.replace('-', '/');
                    d1 = d1.replace('-', '/');

                    var d2 = result[0].dose2_date;
                    d2 = d2.replace('-', '/');
                    d2 = d2.replace('-', '/');
                    d2 = d2.replace('-', '/');

                    airtableFields.dose1_date = d1;
                    airtableFields.dose2_date = d2;
                    airtableFields.lat_lng = result[0].lat_lng;
                    airtableFields.session_token = result[0].session_token;
                    airtableFields.update_TimeDate = result[0].update_TimeDate;
                    airtableFields.update_dose1dt = result[0].update_dose1dt;
                    airtableFields.update_dose2_dt = result[0].update_dose2_dt;
                    airtableFields.runner_email = result[0].runner_email;
                    airtableFields.runner_mobile = result[0].runner_mobile;
                    airtableFields.submit_status = result[0].submit_status;

                    if (result[0].recId === null || result[0].recId === undefined) {
                      console.log("RecID Not Found Fully Vaccinated Insert in airtable" + result[0].form_Id.toString());
                      airtableFields.form_Id = result[0].form_Id.toString();

                      airtableFields.manual_beneficiary_reference_id = result[0].beneficiary_id_push_field.toString()
                      airtableFields.first_dose_beneficiary_name = result[0].first_dose_beneficiary_name;
                      airtableFields.mobile_number_copy = result[0].mobile_number_copy;
                      airtableFields.birth_year_copy = result[0].birth_year_copy;
                      airtableFields.gender_copy = result[0].gender_copy;
                      airtableFields.photo_id_type_copy = result[0].photo_id_type_copy;
                      airtableFields.photo_id_number_copy = result[0].photo_id_number_copy;

                      if (result[0].vaccination_status_copy === "1st Dose Completed") {
                        airtableFields.vaccination_status_copy = "Partially Vaccinated";
                      }
                      airtableFields.vaccine_copy = result[0].vaccine_copy;
                      airtableFields.dose1_date_copy = result[0].dose1_date_copy;


                      airtableFields.gender = result[0].gender;
                      airtableFields.mobile_number = result[0].mobile_number;
                      airtableFields.village = result[0].village;
                      airtableFields.runner_name = result[0].runner_name;
                      airtableFields.state = result[0].state;
                      airtableFields.district = result[0].district;
                      airtableFields.taluka = result[0].taluka;
                      airtableFields.base_status = baseStatus

                      insertToAirtable(airtableFields).then((res) => {
                        console.log("Inserted To Airtable", res);
                        updateRecordIdInSql(res, result[0].form_Id, baseStatus).then((res) => {
                          console.log("Record ID Update in Sql");
                          _response.send("success").status(200);

                        }).catch((err) => {

                        })
                      }).catch((err) => {

                      });
                    } else {

                      // for (let i = 0; i < baseName.length; i++) {
                      //   let value = false;
                      //   console.log("BASENAME@@@", baseName[i]);
                      //   updateToAirtable(airtableFields, result[0].recId, baseName[i]).then((res) => {
                      //     _response.send("success").status(200);

                      //     console.log(`Successfully updated in airtable base ${baseName[i]} and rec id is -`, res);
                      //   }).catch((err) => {

                      //     console.log(err);
                      //   })
                      // }
                      updateToAirtable(airtableFields, result[0].recId, values[0].base_status).then((res) => {
                        _response.send("success").status(200);
                        console.log(`Successfully updated in airtable base ${values[0].base_status} and rec id is -`, res);
                      }).catch((err) => {
                        //console.log(err);
                      })
                    }
                  }).catch((err) => {
                    console.log(err);
                  })

                  //update into airtable

                })
                .catch((e) => {
                  console.log("@@@", e);
                  _response.send(e).status(500);
                });
            } else {
              console.log("Inside Update Into DB (Fully)");
              updateIntoDBFullyVaccinated(data.form_Id, data, str)
                .then((r) => {
                  data.update_TimeDate = str;
                  const airtableFields = {}
                  getparticulardatafromdb(data.form_Id).then((result) => {

                    airtableFields.beneficiary_reference_id = result[0].beneficiary_reference_id;
                    airtableFields.name = result[0].name;
                    airtableFields.birth_year = result[0].birth_year;
                    airtableFields.photo_id_type = result[0].photo_id_type;
                    airtableFields.photo_id_number = result[0].photo_id_number;
                    airtableFields.type_of_person = result[0].type_of_person;
                    airtableFields.comorbidity_ind = result[0].comorbidity_ind;
                    airtableFields.vaccination_status = result[0].vaccination_status;
                    airtableFields.vaccine = result[0].vaccine;

                    var d1 = result[0].dose1_date;
                    d1 = d1.replace('-', '/');
                    d1 = d1.replace('-', '/');
                    d1 = d1.replace('-', '/');

                    airtableFields.dose1_date = d1;

                    var d2 = result[0].dose2_date;
                    d2 = d2.replace('-', '/');
                    d2 = d2.replace('-', '/');
                    d2 = d2.replace('-', '/');

                    airtableFields.dose2_date = d2;
                    airtableFields.lat_lng = result[0].lat_lng;
                    airtableFields.session_token = result[0].session_token;
                    airtableFields.update_TimeDate = result[0].update_TimeDate;

                    airtableFields.update_dose1dt = result[0].update_dose1dt;
                    airtableFields.update_dose2_dt = result[0].update_dose2_dt;
                    airtableFields.runner_email = result[0].runner_email;
                    airtableFields.runner_mobile = result[0].runner_mobile;
                    airtableFields.submit_status = result[0].submit_status;

                    if (result[0].recId === null || result[0].recId === undefined) {
                      console.log("RecID Not Found Vaccinated Insert in airtable");

                      airtableFields.manual_beneficiary_reference_id = result[0].beneficiary_id_push_field.toString()
                      airtableFields.first_dose_beneficiary_name = result[0].first_dose_beneficiary_name;
                      airtableFields.mobile_number_copy = result[0].mobile_number_copy;
                      airtableFields.birth_year_copy = result[0].birth_year_copy;
                      airtableFields.gender_copy = result[0].gender_copy;
                      airtableFields.mobile_number = result[0].mobile_number;
                      airtableFields.photo_id_type_copy = result[0].photo_id_type_copy;
                      airtableFields.photo_id_number_copy = result[0].photo_id_number_copy;

                      if (result[0].vaccination_status_copy === "1st Dose Completed") {
                        airtableFields.vaccination_status_copy = "Partially Vaccinated";
                      }
                      airtableFields.vaccine_copy = result[0].vaccine_copy;
                      airtableFields.dose1_date_copy = result[0].dose1_date_copy;


                      airtableFields.form_Id = result[0].form_Id.toString();
                      airtableFields.gender = result[0].gender;
                      airtableFields.village = result[0].village;
                      airtableFields.runner_name = result[0].runner_name;
                      airtableFields.state = result[0].state;
                      airtableFields.district = result[0].district;
                      airtableFields.taluka = result[0].taluka;
                      airtableFields.base_status = baseStatus;

                      insertToAirtable(airtableFields).then((res) => {
                        console.log("Inserted To Airtable", res);
                        updateRecordIdInSql(res, result[0].form_Id, baseStatus).then((res) => {
                          console.log("Record ID Update in Sql");
                          _response.send("success").status(200);

                        }).catch((err) => {

                        })
                      }).catch((err) => {

                      });
                    } else {
                      // for (let i = 0; i < baseName.length; i++) {
                      //   let value = false;
                      //   console.log("BASENAME@@@", baseName[i]);

                      //   updateToAirtable(airtableFields, result[0].recId, baseName[i]).then((res) => {
                      //     console.log(`Successfully updated in airtable base ${baseName[i]} and rec id is -`, res);
                      //     _response.send("success").status(200);

                      //   }).catch((err) => {
                      //     console.log(err);
                      //   })
                      // }
                      updateToAirtable(airtableFields, result[0].recId, values[0].base_status).then((res) => {
                        _response.send("success").status(200);
                        console.log(`Successfully updated in airtable base ${values[0].base_status} and rec id is -`, res);
                      }).catch((err) => {
                        //console.log(err);
                      })
                    }
                  }).catch((err) => {
                    console.log(err);
                  })
                })
                .catch((e) => {
                  console.log("@@@", e);
                  _response.send(e).status(500);
                });
            }
          }
        }
      })
      .catch((err) => {
        _response.send(err).status(500);
      });
  } catch (err) {
    console.log("error in updating ", err);
    _response.send(err).status(500);
  }
}

function updateAccordingToBeneficiaryId(_request, _response) {
  try {
    const beneficiaryId = _request.query.bid
    const datafields = _request.body;
    let sqlData = {};
    const date = new Date();
    var time = date.toLocaleString('en-US', { hour: 'numeric', minute: 'numeric', second: 'numeric', hour12: true, timeZone: "Asia/Kolkata" })
    const str = date.getDate() + "-" + (date.getMonth() + 1) + "-" + date.getFullYear() + " " + time
    console.log(str);
    // const str = new Date().toLocaleString("en-US", {
    //   timeZone: "Asia/Kolkata",
    // });

    for (const key in datafields) {
      const value = datafields[key];
      const k = getFields[key];
      if (key === "vaccination_status") {
        var something = datafields[key];
        console.log("@@@Something", something);
        if (something === "Vaccinated" || something === "Not Found") {
          sqlData["update_dose1dt"] = str;
          sqlData["update_dose2_dt"] = str;
        } else if (
          something === "Partially Vaccinated" ||
          something === "Not Found"
        ) {
          sqlData["update_dose1dt"] = str;

        } else {
          console.log("Not vaccinated");
        }
      }
      if (k) {
        sqlData[k] = value;
      }
    }

    let query = `Select * from  partnerApp_Beneficiary_Details where submit_status="No" AND beneficiary_reference_id=` + beneficiaryId;
    sqlData["registration_time"] = str;
    insertIntoDB2(query, [sqlData])
      .then((rec) => {
        _response.send("success").status(200);
      })
      .catch((err) => {
        console.log("err", err);
        _response.send("failed").status(500);
      });
  } catch (err) {
    console.error("SQLINSERT_FAILED", new Error(err));
    _response.send(err).status(500);
  }
}


function checkNumberOfFormsFilled(_request, _response) {
  try {
    const number = _request.query.number
    const datafields = _request.body;
    let sqlData = {};
    const date = new Date();
    const time = date.toLocaleString('en-US', { hour: 'numeric', minute: 'numeric', second: 'numeric', hour12: true, timeZone: "Asia/Kolkata" })
    const str = date.getDate() + "-" + (date.getMonth() + 1) + "-" + date.getFullYear() + " " + time


    let query = `Select count(runner_mobile) as count from partnerApp_Beneficiary_Details where runner_mobile LIKE"%${number}" AND (submit_status="Submitted From Partner App" OR submit_status="Yes")`;
    getCountOfFormsFilled(query, number)
      .then((rec) => {
        console.log("@@@@", rec[0]["count"]);
        _response.status(200).json({
          count: rec[0]["count"],
        });
      })
      .catch((err) => {
        console.log("err", err);
        _response.send("failed").status(500);
      });
  } catch (err) {
    console.error("SQLINSERT_FAILED", new Error(err));
    _response.send(err).status(500);
  }
}


function insertApiLogsData(_request, _response) {
  try {
    const datafields = _request.body;
    console.log(JSON.stringify(datafields));
    const date = new Date();
    const time = date.toLocaleString('en-US', { hour: 'numeric', minute: 'numeric', second: 'numeric', hour12: true })
    var str = date.getDate() + "-" + (date.getMonth() + 1) + "-" + date.getFullYear() + " " + time
    console.log("@@Date", str);
    let sqlData = {};

    for (const key in datafields) {
      const value = datafields[key];
      const k = getFields[key];

      if (k) {
        sqlData[k] = value;
      }
      console.log("@@@@@@", sqlData);
    }
    let query = `INSERT INTO partner_app_cowin_logs SET ?`;
    insertIntoLogsDB(query, [sqlData])
      .then((rec) => {
        _response.send("success").status(200);
      })
      .catch((err) => {
        console.log("err", err);
        _response.send("failed").status(500);
      });
  } catch (err) {
    console.error("SQLINSERT_FAILED", new Error(err));
    _response.send(err).status(500);
  }
}


module.exports = {
  partnerAppBeneficiaryData,
  getDataFormMobileNo,
  getCountOfFormsFilledOnBeneficiaryNo,
  updateDataformId,
  updateAccordingToBeneficiaryId,
  insertApiLogsData,
  checkNumberOfFormsFilled,
  postDataToAirtable,
  getAllData,
  sendRunnerIssueToAirtable,
  updateBeneficiaryMobileNumber,
  checkMobileNumberAndBeneficiary
};
