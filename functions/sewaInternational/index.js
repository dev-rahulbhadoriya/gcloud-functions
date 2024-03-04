//const axios = require("axios");
const cloudsql = require("../utils/cloudSql");
const { getFormData, getAllFields } = require("../utils/commonFunctions");

const {
  checkPrerakDataQaStatus,
  updatePrerakDataAirtable,
  checkPrerakDataPreviousData,
  insertToPrerakDataAirtable,
} = require("./utils/prerakDataAirtableFunctions");
const {
  updatePrerakDataSql,
  updatePrerakAirtableIdSql,
  insertPrerakDataSql,
} = require("./utils/prerakDataSqlFunctions");
const {
  checkSewaVillageDataQaStatus,
  updateSewaVillageDataAirtable,
  checkSewaVillageDataPreviousData,
  insertToSewaVillageDataAirtable,
} = require("./utils/villageDataAirtableFunctions");
const {
  updateSewaVillageDataSql,
  updateSewaVillageDataIdSql,
  insertSewaVillageDataSql,
} = require("./utils/villageDataSqlFunctions");

function sewaInternationalPrerakForm(_request, _response) {
  try {
    getFormData(_request.body.form.formId.toString())
      .then((formData) => {
        getAllFields(formData)
          .then((fields) => {
            fields.fields["FormId"] = formData.form.formId;
            fields.fields["Filled Time"] = formData.form.createdTime;
            fields.fields["Filled By"] = formData.form.filledByName;
            fields.fields["Modified By"] = formData.form.modifiedByName;
            fields.fields["Modified Time"] = formData.form.modifiedTime;
            cloudsql.query(
              `SELECT * FROM sewa_prerak_data WHERE FormId=${fields.fields.FormId};`,
              (err, result) => {
                if (err) {
                  _response.send(err).status(500);
                }
                if (result.length > 0) {
                  //if airtable id is not found
                  //current base
                  //update airtableId and
                  if (result[0].airtableId) {
                    checkPrerakDataQaStatus(
                      result[0].airtableId,
                      result[0].basechange
                    )
                      .then(() => {
                        updatePrerakDataSql(fields.fields)
                          .then(() => {
                            updatePrerakDataAirtable(
                              fields.fields.FormId,
                              result[0].airtableId,
                              result[0].basechange
                            ).then(() => {
                              console.info("PRERAK_DATA_DATA_UPDATED");
                              _response.status(200).end();
                            });
                          })
                          .catch((err) => {
                            console.error(
                              "PRERAK_DATA_DATA_UPDATE_ERROR",
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
                    checkPrerakDataPreviousData(
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
                          checkPrerakDataQaStatus(recId, result[0].basechange)
                            .then(() => {
                              console.log(
                                "QA status check",
                                result[0].basechange
                              );
                              updatePrerakDataAirtable(
                                fields.fields.FormId,
                                recId,
                                result[0].basechange
                              )
                                .then(() => {
                                  updatePrerakAirtableIdSql(
                                    fields.fields.FormId,
                                    recId
                                  )
                                    .then(() => {
                                      // console.info(" @@ PRERAK_DATA_DATA_INSERTED");
                                      _response
                                        .send("success")
                                        .status(200)
                                        .end();
                                    })
                                    .catch((err) => {
                                      console.log(
                                        "PRERAK_DATA_DATA_UPDATE_ERROR",
                                        new Error(err)
                                      );
                                      _response.send(err).end();
                                    });
                                })
                                .catch((err) => {
                                  console.log(
                                    "PRERAK_DATA_DATA_UPDATE_ERROR",
                                    new Error(err)
                                  );
                                  _response.send(err).end();
                                });
                            })
                            .catch((err) => {
                              console.log(
                                "PRERAK_DATA_DATA_QA_ERROR",
                                new Error(err)
                              );
                              _response.send(err).end();
                            });
                        }
                      })
                      .catch((err) => {
                        console.log(
                          "PRERAK_DATA_DATA_QA_ERROR",
                          new Error(err)
                        );
                        _response.send(err).end();
                      });
                  }
                } else {
                  const basechange = 1;
                  insertPrerakDataSql(fields.fields, basechange)
                    .then(() => {
                      insertToPrerakDataAirtable(
                        fields.fields.FormId,
                        basechange
                      )
                        .then((recordId) => {
                          updatePrerakAirtableIdSql(
                            fields.fields.FormId,
                            recordId
                          )
                            .then(() => {
                              console.log("PRERAK_DATA_DATA_INSERTED BASE");
                              _response.status(200).end();
                            })
                            .catch((err) => {
                              console.log(
                                "PRERAK_DATA_DATA_UPDATE_ERROR",
                                new Error(err)
                              );
                              _response.send(err).end();
                            });
                        })
                        .catch((err) => {
                          console.log(
                            "PRERAK_DATA_DATA_INSERT_ERROR",
                            new Error(err)
                          );
                          _response.send(err).end();
                        });
                      // }
                    })
                    .catch((err) => {
                      console.log("RERAK_DATA_INSERT_ERROR", new Error(err));
                      _response.send(err).end();
                    });
                }
              }
            );
          })
          .catch((err) => {
            console.log("PRERAK_DATA_GET_FIELDS_ERROR", new Error(err));
            _response.send(err).end();
          });
      })
      .catch((err) => {
        console.log("PRERAK_DATA_GET_DATA_ERROR", new Error(err));
        _response.send(err).end();
      });
  } catch (err) {
    console.error("PRERAK_DATA_SQLINSERT_FAILED", new Error(err));
    _response.send(err).end();
  }
}

function sewaInternationalVillagerSurveyForm(_request, _response) {
  try {
    getFormData(_request.body.form.formId.toString())
      .then((formData) => {
        let hasOrders = formData.sectionFields.length !== 0 ? true : false;
        getAllFields(formData, hasOrders)
          .then((fields, orders) => {
            let arrfield = [];
            let optionsValue = [];
            fields.orders.forEach((el) => {
              arrfield.push(
                el[
                  "सबसे प्रतिष्ठित सेवा क्या है जिसे आप अपने स्थानीय प्राथमिक देखभाल क्लिनिक में देखना चाहेंगे?"
                ]
              );
              optionsValue.push(el["Choose Options For Rank"]);
            });
            fields.fields["FormId"] = formData.form.formId;
            fields.fields["Filled Time"] = formData.form.createdTime;
            fields.fields["Filled By"] = formData.form.filledByName;
            fields.fields["Modified By"] = formData.form.modifiedByName;
            fields.fields["Modified Time"] = formData.form.modifiedTime;
            fields.fields[
              "सबसे प्रतिष्ठित सेवा क्या है जिसे आप अपने स्थानीय प्राथमिक देखभाल क्लिनिक में देखना चाहेंगे?"
            ] = arrfield;
            fields.fields["Choose Options For Rank"] = optionsValue.toString();
            cloudsql.query(
              `SELECT * FROM sewa_village_data WHERE FormId=${fields.fields.FormId};`,
              (err, result) => {
                if (err) {
                  _response.send(err).status(500);
                }
                ``;
                if (result.length > 0) {
                  if (result[0].airtableId) {
                    checkSewaVillageDataQaStatus(
                      result[0].airtableId,
                      result[0].basechange
                    )
                      .then(() => {
                        updateSewaVillageDataSql(fields.fields)
                          .then(() => {
                            updateSewaVillageDataAirtable(
                              fields.fields.FormId,
                              result[0].airtableId,
                              result[0].basechange
                            ).then(() => {
                              console.info("SEWA_VILLAGE_DATA_UPDATED");
                              _response.status(200).end();
                            });
                          })
                          .catch((err) => {
                            console.error(
                              "SEWA_VILLAGE_DATA_UPDATE_ERROR",
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
                    checkSewaVillageDataPreviousData(
                      fields.fields.FormId,
                      result[0].basechange
                    )
                      .then((recId) => {
                        if (recId == 0) {
                          console.log(
                            "Id Not Found In Base",
                            fields.fields.FormId
                          );
                          insertToSewaVillageDataAirtable(
                            fields.fields.FormId,
                            result[0].basechange
                          )
                            .then((recordId) => {
                              updateSewaVillageDataIdSql(
                                fields.fields.FormId,
                                recordId
                              )
                                .then(() => {
                                  console.log(
                                    "SEWA_VILLAGE_DATA_INSERTED BASE"
                                  );
                                  _response.status(200).end();
                                })
                                .catch((err) => {
                                  console.log(
                                    "SEWA_VILLAGE_DATA_UPDATE_ERROR",
                                    new Error(err)
                                  );
                                  _response.send(err).end();
                                });
                            })
                            .catch((err) => {
                              console.log(
                                "SEWA_VILLAGE_DATA_INSERT_ERROR",
                                new Error(err)
                              );
                              _response.send(err).end();
                            });
                        } else {
                          checkSewaVillageDataQaStatus(
                            recId,
                            result[0].basechange
                          )
                            .then(() => {
                              console.log(
                                "QA status check",
                                result[0].basechange
                              );
                              updateSewaVillageDataAirtable(
                                fields.fields.FormId,
                                recId,
                                result[0].basechange
                              )
                                .then(() => {
                                  updateSewaVillageDataIdSql(
                                    fields.fields.FormId,
                                    recId
                                  )
                                    .then(() => {
                                      // console.info(" @@ SEWA_VILLAGE_DATA_INSERTED");
                                      _response
                                        .send("success")
                                        .status(200)
                                        .end();
                                    })
                                    .catch((err) => {
                                      console.log(
                                        "SEWA_VILLAGE_DATA_UPDATE_ERROR",
                                        new Error(err)
                                      );
                                      _response.send(err).end();
                                    });
                                })
                                .catch((err) => {
                                  console.log(
                                    "SEWA_VILLAGE_DATA_UPDATE_ERROR",
                                    new Error(err)
                                  );
                                  _response.send(err).end();
                                });
                            })
                            .catch((err) => {
                              console.log(
                                "SEWA_VILLAGE_DATA_QA_ERROR",
                                new Error(err)
                              );
                              _response.send(err).end();
                            });
                        }
                      })
                      .catch((err) => {
                        console.log(
                          "SEWA_VILLAGE_DATA_QA_ERROR",
                          new Error(err)
                        );
                        _response.send(err).end();
                      });
                  }
                } else {
                  const basechange = 1;
                  insertSewaVillageDataSql(fields.fields, basechange)
                    .then(() => {
                      insertToSewaVillageDataAirtable(
                        fields.fields.FormId,
                        basechange
                      )
                        .then((recordId) => {
                          updateSewaVillageDataIdSql(
                            fields.fields.FormId,
                            recordId
                          )
                            .then(() => {
                              console.log("SEWA_VILLAGE_DATA_INSERTED BASE");
                              _response.status(200).end();
                            })
                            .catch((err) => {
                              console.log(
                                "SEWA_VILLAGE_DATA_UPDATE_ERROR",
                                new Error(err)
                              );
                              _response.send(err).end();
                            });
                        })
                        .catch((err) => {
                          console.log(
                            "SEWA_VILLAGE_DATA_INSERT_ERROR",
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
            console.log("SEWA_VILLAGE_GET_FIELDS_ERROR", new Error(err));
            _response.send(err).end();
          });
      })
      .catch((err) => {
        console.log("SEWA_VILLAGE_GET_DATA_ERROR", new Error(err));
        _response.send(err).end();
      });
  } catch (err) {
    console.error("SEWA_VILLAGE_SQLINSERT_FAILED", new Error(err));
    _response.send(err).end();
  }
}
module.exports = {
  sewaInternationalPrerakForm,
  sewaInternationalVillagerSurveyForm,
};
