const cloudSql = require("../utils/cloudSql");
const { getFormData, getAllFields } = require("../utils/commonFunctions");
const {
  updateStellappsDataAirtable,
  checkStellappsDataPreviousData,
  checkStellappsDataQaStatus,
  sendAirtable,
} = require("./stellappsAirtableFunctions");
const {
  insertStellappsDataCheckDuplicate,
  updateDataIntoDb,
  updateStellappsDataSql,
  updateStellappsAirtableIdSql,
} = require("./stellappsSqlFunctions");
const stellappsData = (_req, _res) => {
  try {
    getFormData(_req.body.form.formId.toString())
      .then((formData) => {
        // console.log("FormData--------------->>>>", formData);
        let hasOrders = formData.sectionFields.length !== 0 ? true : false;
        getAllFields(formData, hasOrders)
          .then(({ fields, orders }) => {
            fields["FormId"] = _req.body.form.formId.toString();
            fields["Filled Time"] = formData.form.createdTime;
            fields["Modified By"] = formData.form.modifiedByName;
            fields["Modified Time"] = formData.form.modifiedTime;
            fields["Filled By"] = formData.form.filledByName;
            // console.log("Fields----------->>>>>>>", fields);
            let employees = _req.body.employees;

            insertDataIntoDb(fields, employees)
              .then((resp) => {
                // console.log(resp);
                _res.status(200).send("success");
              })
              .catch((err) => {
                console.log(err);
                _res.status(500).send(err);
              });
          })
          .catch((err) => {
            console.log("FAILED TO MAP FIELD", err);
            _res.status(500).send(err);
          });
      })
      .catch((err) => {
        console.log("FAILED TO GET DATA FROM API", new Error(err));
        _res.status(500).send("failed");
      });
  } catch (err) {
    console.log("DB_SQL_INSERT_FAILED", new Error(err));
    _res.status(500).send("failed");
  }
};

const insertDataIntoDb = (fields, employees) => {
  return new Promise((resp, rej) => {
    try {
      const FormId = fields["FormId"];
      const contact_number = fields["2. Mobile Number (किसान का मोबाइल नंबर)"];
      console.log(FormId, contact_number);

      cloudSql.query(
        `SELECT * FROM stellappsData WHERE FormId=${FormId};`,
        (err, result) => {
          if (err) {
            console.log(err);
            rej(err);
          }

          if (result.length > 0) {
            if (result[0].airtableId) {
              checkStellappsDataQaStatus(
                result[0].airtableId,
                result[0].airtableBaseNo
              )
                .then((recId) => {
                  updateStellappsDataSql(fields)
                    .then(() => {
                      updateStellappsDataAirtable(
                        FormId,
                        result[0].airtableId,
                        result[0].airtableBaseNo
                      )
                        .then((id) => {
                          console.log("Stellapps_DATA_UPDATED");
                          resp(id);
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
                        "FAILED TO UPDATE DATA IN DB",
                        new Error(err)
                      );
                      rej(err);
                    });
                })
                .catch((err) => {
                  console.log("NOT UPDATED AS QA APPROVED");
                  rej(FormId);
                });
            } else {
              checkStellappsDataPreviousData(FormId, result[0].airtableBaseNo)
                .then((recId) => {
                  console.log("idddd", recId);

                  if (recId != 0) {
                    checkStellappsDataQaStatus(recId, result[0].airtableBaseNo)
                      .then(() => {
                        updateStellappsDataAirtable(
                          FormId,
                          recId,
                          result[0].airtableBaseNo
                        )
                          .then(() => {
                            updateStellappsAirtableIdSql(FormId, recId)
                              .then((id) => {
                                console.info("Stellapps_AIRTABLEID_UPDATED");
                                resp(id);
                              })
                              .catch((err) => {
                                console.log(
                                  "STELLAPPS_UPDATE_ERROR",
                                  new Error(err)
                                );
                                rej(err);
                              });
                          })
                          .catch((err) => {
                            console.log(
                              "STELLAPPS UPDATE ERROR",
                              new Error(err)
                            );
                            rej(err);
                          });
                      })
                      .catch((err) => {
                        console.log("STELLAPPS_QA_ERROR", new Error(err));
                        rej(err);
                      });
                  } else {
                    console.log("ID NOT FOUND IN BASE");
                    rej();
                  }
                })
                .catch((err) => {
                  console.error("PREVIOUS DATA CHECK ERROR", new Error(err));
                });
            }
          } else {
            const airtableBaseNo = 1;
            insertStellappsDataCheckDuplicate(
              FormId,
              fields,
              contact_number,
              airtableBaseNo
            )
              .then(([is_duplicate, msg_send]) => {
                console.log(is_duplicate, msg_send);
                sendAirtable(fields, is_duplicate, airtableBaseNo)
                  .then((recId) => {
                    updateDataIntoDb(FormId, fields, contact_number, recId)
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
                console.log("insertion", err);
                rej(err);
              });
          }
        }
      );
    } catch (err) {
      rej(err);
    }
  });
};

module.exports = {
  stellappsData,
};
