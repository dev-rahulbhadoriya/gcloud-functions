//const axios = require("axios");
const cloudsql = require("../utils/cloudSql");
const { getFormData, getAllFields, processValue, runQuery } = require("../utils/commonFunctions");

const {
  sendAirtable,
  updateToAirtable,
  checkVyaparDataQaStatus,
  checkVyaparPreviousData,
  updateVyaparDataAirtable,
} = require("./utils/vyaparDataAirtable");
const { updateAirtableIdIntoDB, insertDataCheckDuplicate, updateDataIntoDb, getRow, changeCleanedStatus, getRowsByStatus, updateStatusRawData, qaApprovedDataInsertIntoDb, updateIntoVyaparDataDB } = require("./utils/vyaparDataSql");
const { checkVyaparOnbordingQaStatus, updateDataVyaparOnbordingAirtable, checkVyaparOnbordingPreviousData, insertToVyaparOnbordingAirtable } = require("./utils/vyaparOnbordingAirtable");
const { updateVyaparOnbordingDataSql, updateVyaparOnbordingAirtableIdSql, insertVyaparOnbordingDataSql } = require("./utils/vyaparOnbordingSql");

function vayparData(_req, _res) {
  try {
    getFormData(_req.body.form.formId.toString())
      .then((formData) => {
        let hasOrders = formData.sectionFields.length !== 0 ? true : false;
        getAllFields(formData, hasOrders)
          .then(({ fields, orders }) => {
            fields["FormId"] = _req.body.form.formId.toString();
            fields["Filled Date"] = _req.body.form.createdTime;
            fields["Modified By"] = _req.body.form.modifiedByName;
            fields["Modified Date"] = _req.body.form.modifiedTime;
            fields["Filled By"] = _req.body.form.filledByName;
            let employees = _req.body.employees;
            insertDataIntoDB(fields, employees)
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
            console.log("failed to map fields", err);
            _res.status(500).send("failed");
          });
      })
      .catch((err) => {
        console.log("failed get data from api ", new Error(err));
        _res.status(500).send("failed");
      });
  } catch (err) {
    console.error("VYAPAR_DATA_SQLINSERT_FAILED", new Error(err));
    _res.send(err).status(500);
  }
}

function insertDataIntoDB(fields, employees) {
  return new Promise((resp, rej) => {
    try {
      const FormId = fields["FormId"];
      const state = fields["2. State Name (राज्य का नाम)"];
      const mobile_number = fields["7. Shopkeeper Number (दुकानदार का नंबर)"];
      console.log(FormId, state, mobile_number);
      cloudsql.query(
        `SELECT * FROM vyapar_data WHERE FormId=${FormId};`,
        (err, result) => {
          if (err) {
            console.log(err);
            rej(err);
          }
          if (result.length > 0) {
            if (result[0].airtableId) {
              checkVyaparDataQaStatus(
                result[0].airtableId,
                result[0].airtableBaseNo
              )
                .then((recId) => {
                  updateIntoVyaparDataDB(fields, mobile_number, state)
                    .then(() => {
                      updateVyaparDataAirtable(
                        FormId,
                        result[0].airtableId,
                        result[0].airtableBaseNo
                      )
                        .then((id) => {
                          console.info("VYAPRA_DATA_UPDATED");
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
              checkVyaparPreviousData(FormId, result[0].airtableBaseNo)
                .then((recId) => {
                  if (recId != 0) {
                    checkVyaparDataQaStatus(recId, result[0].airtableBaseNo)
                      .then(() => {
                        updateVyaparDataAirtable(
                          FormId,
                          recId,
                          result[0].airtableBaseNo
                        )
                          .then(() => {
                            updateAirtableIdIntoDB(FormId, recId)
                              .then((id) => {
                                console.info("VYAPRA_AIRTABLEID_UPDATED");
                                resp(id);
                              })
                              .catch((err) => {
                                console.log(
                                  "VYAPRA_UPDATE_ERROR",
                                  new Error(err)
                                );
                                rej(err);
                              });
                          })
                          .catch((err) => {
                            console.log(
                              "VYAPRA_UPDATE_ERROR",
                              new Error(err)
                            );
                            rej(err);
                          });a
                      })
                      .catch((err) => {
                        console.log("VYAPRA_QA_ERROR", new Error(err));
                        rej(err);
                      });
                  } else {
                    console.log("ID NOT FOUND IN BASE");
                    rej();
                  }
                })
                .catch((err) => {
                  console.error("PREVIOUS_DATA_CHECK ERROR", new Error(err));
                });
            }
          } else {
            const airtableBaseNo = 1;
            insertDataCheckDuplicate(
              FormId,
              fields,
              mobile_number,
              state,
              employees,
              airtableBaseNo
            )
              .then(([is_duplicate, msg_send]) => {
                console.log(is_duplicate, msg_send);
                sendAirtable(
                  fields,
                  is_duplicate,
                  employees,
                  airtableBaseNo
                )
                  .then((recId) => {
                    //console.log("insert ho gya hai",JSON.stringify(fields));
                    updateDataIntoDb(
                      FormId,
                      fields,
                      mobile_number,
                      state,
                      0,
                      recId
                    )
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

function vyparOnboradingfun(_request, _response){
  try {
    getFormData(_request.body.form.formId.toString())
      .then((formData) => {
        getAllFields(formData)
          .then((fields) => {
            fields.fields["FormId"] = formData.form.formId;
            fields.fields["Filled Date"] = formData.form.createdTime;
            fields.fields["Filled By"] = formData.form.filledByName;
            fields.fields["Modified By"] = formData.form.modifiedByName;
            fields.fields["Modified Date"] = formData.form.modifiedTime;
            cloudsql.query(
              `SELECT * FROM vyaparOnbording_data WHERE FormId=${fields.fields.FormId};`,
              (err, result) => {
                if (err) {
                  _response.send(err).status(500);
                }
                if (result.length > 0) {
                  //if airtable id is not found
                  //current base
                  //update airtableId and
                  if (result[0].airtableId) {
                    checkVyaparOnbordingQaStatus(
                      result[0].airtableId,
                      result[0].basechange
                    )
                      .then(() => {
                        updateVyaparOnbordingDataSql(fields.fields)
                          .then(() => {
                            updateDataVyaparOnbordingAirtable(
                              fields.fields.FormId,
                              result[0].airtableId,
                              result[0].basechange
                            ).then(() => {
                              console.info("VYAPAR_ONBORDING_DATA_UPDATED");
                              _response.status(200).end();
                            });
                          })
                          .catch((err) => {
                            console.error(
                              "VYAPAR_ONBORDING_DATA_UPDATE_ERROR",
                              new Error(err)
                            );
                            _response.status(500).end();
                          });
                      })
                      .catch(() => {
                        console.log(
                          "NOT UPDATED AS QA APPROVED",
                          fields.fields.FormId
                        );
                        _response.status(500).end();
                      });
                  } else {
                    //  console.log(fields.fields.Id, result[0].basechange);
                    checkVyaparOnbordingPreviousData(
                      fields.fields.FormId,
                      result[0].basechange
                    )
                      .then((recId) => {
                        if (recId == 0) {
                          console.log(
                            "Id Not Found In Base",
                            fields.fields.FormId
                          );
                          _response.status(500).end();
                        } else {
                          checkVyaparOnbordingQaStatus(recId, result[0].basechange)
                            .then(() => {
                              console.log(
                                "QA status check",
                                result[0].basechange
                              );
                              updateDataVyaparOnbordingAirtable(
                                fields.fields.FormId,
                                recId,
                                result[0].basechange
                              )
                                .then(() => {
                                  updateVyaparOnbordingAirtableIdSql(
                                    fields.fields.FormId,
                                    recId
                                  )
                                    .then(() => {
                                      // console.info(" @@ VYAPAR_ONBORDING_DATA_INSERTED");
                                      _response
                                        .send("success")
                                        .status(200)
                                        .end();
                                    })
                                    .catch((err) => {
                                      console.log(
                                        "VYAPAR_ONBORDING_DATA_UPDATE_ERROR",
                                        new Error(err)
                                      );
                                      _response.send(err).end();
                                    });
                                })
                                .catch((err) => {
                                  console.log(
                                    "VYAPAR_ONBORDING_DATA_UPDATE_ERROR",
                                    new Error(err)
                                  );
                                  _response.send(err).end();
                                });
                            })
                            .catch((err) => {
                              console.log(
                                "VYAPAR_ONBORDING_DATA_QA_ERROR",
                                new Error(err)
                              );
                              _response.send(err).end();
                            });
                        }
                      })
                      .catch((err) => {
                        console.log(
                          "VYAPAR_ONBORDING_DATA_QA_ERROR",
                          new Error(err)
                        );
                        _response.send(err).end();
                      });
                  }
                } else {
                  const basechange = 1;
                  insertVyaparOnbordingDataSql(fields.fields, basechange)
                    .then(() => {
                      insertToVyaparOnbordingAirtable(fields.fields.FormId, basechange)
                        .then((recordId) => {
                          updateVyaparOnbordingAirtableIdSql(
                            fields.fields.FormId,
                            recordId
                          )
                            .then(() => {
                              console.log(
                                "VYAPAR_ONBORDING_DATA_INSERTED BASE"
                              );
                              _response.status(200).end();
                            })
                            .catch((err) => {
                              console.log(
                                "VYAPAR_ONBORDING_DATA_UPDATE_ERROR",
                                new Error(err)
                              );
                              _response.send(err).end();
                            });
                        })
                        .catch((err) => {
                          console.log(
                            "VYAPAR_ONBORDING_DATA_INSERT_ERROR",
                            new Error(err)
                          );
                          _response.send(err).end();
                        });
                      // }
                    })
                    .catch((err) => {
                      console.log("CORONA_DATA_INSERT_ERROR", new Error(err));
                      _response.send(err).end();
                    });
                }
              }
            );
          })
          .catch((err) => {
            console.log("VYAPAR_ONBORDING_GET_FIELDS_ERROR", new Error(err));
            _response.send(err).end();
          });
      })
      .catch((err) => {
        console.log("VYAPAR_ONBORDING_GET_DATA_ERROR", new Error(err));
        _response.send(err).end();
      });
  } catch (err) {
    console.error("VYAPAR_ONBORDING_SQLINSERT_FAILED", new Error(err));
    _response.send(err).end();
  }
}


module.exports = {
  vayparData,
  vyparOnboradingfun
};
