const { getFormData, getAllFields } = require("../utils/commonFunctions");
const cloudsql = require("../utils/cloudSql");
const {
  checkTSLeadDataQaStatus,
  updateTSLeadDataAirtable,
  checkTSLeadDataPreviousData,
  insertToTSLeadDataAirtable,
  sendAirtable,
  getQAApproveTsLeadAirtable,
  updateRefenceIDTS,
} = require("../tractorSathiLeadData/utils/leadDataAirtable");
const {
  updateTSLeadDataDB,
  updateTSLeadDataDBAirtableId,
  insertLeadData,
  updateLeadData,
  insertTSLeadDataDB,
  qaApprovedDataInsertIntoDb,
} = require("../tractorSathiLeadData/utils/leadQuerySql");
const { getTsLeadQaFields } = require("./utils/fieldsMapping");
const { TSLeadData1, TsLeadData2 } = require("./utils/airtbaleBases");

function ts_Lead_data(_req, _res) {
  try {
    getFormData(_req.body.form.formId.toString())
      .then((formData) => {
        let hasOrders = formData.sectionFields.length !== 0 ? true : false;
        getAllFields(formData, hasOrders)
          .then(({ fields, orders }) => {
            fields["Id"] = _req.body.form.formId.toString();
            fields["Filled Date"] = _req.body.form.createdTime;
            fields["Modified By"] = _req.body.form.modifiedByName;
            fields["Modified Date"] = _req.body.form.modifiedTime;
            fields["Filled By"] = _req.body.form.filledByName;
            let employees = _req.body.employees;
            insertIntoDb(fields, employees)
              .then((resp) => {
                //console.log(resp);
                _res.status(200).send("success");
              })
              .catch((err) => {
                console.log(err);
                _res.status(500).send(err);
              });
          })
          .catch((err) => {
            console.log("failed to mapp fields", err);
            _res.status(500).send("failed");
          });
      })
      .catch((err) => {
        console.log("failed get data from api ", new Error(err));
        _res.status(500).send("failed");
      });
  } catch (err) {
    console.error("TS_LEAD_SQLINSERT_FAILED", new Error(err));
    _res.send(err).status(500);
  }
}

function insertIntoDb(fields, employees) {
  return new Promise((resp, rej) => {
    try {
      const Id = fields["Id"];
      const state = fields["State Name (राज्य का नाम)"];
      const met_person_no =
        fields["Met Person Mobile Number (जो व्यक्ति मिला उसका मोबाइल नंबर )"];
      console.log(Id, state, met_person_no);
      cloudsql.query(
        `SELECT * FROM ts_Lead_Data WHERE Id=${Id};`,
        (err, result) => {
          if (err) {
            console.log(err);
            rej(err);
          }
          if (result.length > 0) {
            if (result[0].airtableId) {
              checkTSLeadDataQaStatus(
                result[0].airtableId,
                result[0].airtableBaseNo
              )
                .then(() => {
                  updateTSLeadDataDB(fields, met_person_no, state)
                    .then(() => {
                      updateTSLeadDataAirtable(
                        Id,
                        result[0].airtableId,
                        result[0].airtableBaseNo
                      )
                        .then(() => {
                          console.info("TS_Lead_DATA_UPDATED");
                          resp(Id);
                        })
                        .catch((err) => {
                          console.error(
                            "Failed to update data in airtable",
                            new Error(err)
                          );
                          rej(err);
                        });
                    })
                    .catch((err) => {
                      console.error(
                        "Failed to update data in db",
                        new Error(err)
                      );
                      rej(err);
                    });
                })
                .catch((err) => {
                  console.log("NOT UPDATED AS QA APPROVED");
                  rej(Id);
                });
            } else {
              checkTSLeadDataPreviousData(Id, result[0].airtableBaseNo)
                .then((recId) => {
                  if (recId != 0) {
                    checkTSLeadDataQaStatus(recId, result[0].airtableBaseNo)
                      .then(() => {
                        updateTSLeadDataAirtable(
                          Id,
                          recId,
                          result[0].airtableBaseNo
                        )
                          .then(() => {
                            updateTSLeadDataDBAirtableId(Id, recId)
                              .then((id) => {
                                console.info("TS_LEAD_DATA_AIRTABLEID_UPDATED");
                                resp(id);
                              })
                              .catch((err) => {
                                console.log(
                                  "TS_LEAD_DATA_UPDATE_ERROR",
                                  new Error(err)
                                );
                                rej(err);
                              });
                          })
                          .catch((err) => {
                            console.log(
                              "TS_LEAD_DATA_UPDATE_ERROR",
                              new Error(err)
                            );
                            rej(err);
                          });
                      })
                      .catch((err) => {
                        console.log("TS_LEAD_DATA_QA_ERROR", new Error(err));
                        rej(err);
                      });
                  } else {
                    console.log("ID NOT FOUND IN BASE");
                    rej(Id);
                  }
                })
                .catch((err) => {
                  console.error("PREVIOUS_DATA_CHECK ERROR", new Error(err));
                });
            }
          } else {
            const airtableBaseNo = 2;
            insertLeadData(
              Id,
              fields,
              met_person_no,
              state,
              employees,
              airtableBaseNo
            )
              .then(([is_duplicate, msg_send]) => {
                console.log(is_duplicate, msg_send);
                sendAirtable(
                  Id,
                  fields,
                  is_duplicate,
                  state,
                  employees,
                  airtableBaseNo
                )
                  .then((recId) => {
                    //console.log("insert ho gya hai",JSON.stringify(fields));
                    updateLeadData(Id, fields, met_person_no, state, 0, recId)
                      .then(() => {
                        console.log("INSERTED IN AIRTABLE");
                        resp(recId);
                      })
                      .catch((err) => {
                        rej(err);
                      });
                  })
                  .catch((err) => {
                    rej(err);
                  });
              })
              .catch((err) => {
                console.log("insertion error", err);
                rej(err);
              });
          }
        }
      );
    } catch (err) {
      rej(err);
    }
  });
}

// adding qa function
function ts_Lead_qa_done_data(_req, _res) {
  const shortbase = _req.query.tsLeadBase;
  // console.log("@@@@", shortbase);
  let base;
  let bNo;
  switch (shortbase) {
    case "b1":
      base = TSLeadData1;
      bNo = 1;
      break;
    case "b2":
      base = TsLeadData2;
      bNo = 2;
      break;
    default:
      _res.status(400).send("Base NOT Found");
      break;
  }
  let insertPromises = [];
  let refdata = [];
  getQAApproveTsLeadAirtable(base)
    .then((res) => {
      if (res.length < 0) {
        _res.status(500).send("No Data to send");
      }
      res.forEach((form) => {
        // console.log("ressposne", form)
        let sqlData = {};
        let parsedData = form.fields;
        //  console.log("dataaaaaa", parsedData);

        for (const key in parsedData) {
          const k = getTsLeadQaFields[key];
          const value = parsedData[key];
          let data = processValue(value);
          //console.log(data);
          if (k) {
            sqlData[k] = data;
          }
          sqlData["TSBaseNo"] = bNo;
        }
        console.log("Sql Data", JSON.stringify(sqlData), sqlData.BaseNo);
        let query = `INSERT INTO ts_Lead_QA_Data SET ?`;
        insertPromises.push(
          qaApprovedDataInsertIntoDb(query, [sqlData], form.id, bNo)
        );
      });
      Promise.allSettled(insertPromises)
        .then((recIds) => {
          data = [];
          recIds.forEach((id) => {
            if (id.value) {
              data.push({
                id: id.value,
                fields: {
                  "Data Pushed": true,
                },
              });
            }
          });
          updateRefenceIDTS(data, base)
            .then((res) => {
              console.log("update in airtable");
              _res.status(200).send("success");
            })
            .catch((err) => {
              console.log("failed to update");
              _res.status(500).send("failed");
              // process.exit.bind(process, 16);
            });
        })
        .catch((err) => {
          console.log("Promise not fullfilled", new Error(err));
          _res.status(500).send("Failed to insert");
        });
    })
    .catch((err) => {
      console.log("Failed to get data from airtable", new Error(err));
      _res.status(500).send("Fail to fetch");
    });
}

function processValue(value) {
  let result = ``;
  if (Array.isArray(value)) {
    value.forEach((el) => {
      if (
        Object.prototype.toString.call(el) === "[object Object]" &&
        Object.prototype.toString.call(el.url) === "[object String]"
      ) {
        result = `${result}${el.url},`;
      } else {
        result = `${result}${el},`;
      }
    });
  } else {
    return value;
  }
  return result;
}
module.exports = {
  ts_Lead_data,
  ts_Lead_qa_done_data,
};
