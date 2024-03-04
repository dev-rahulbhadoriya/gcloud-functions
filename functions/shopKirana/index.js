const cloudsql = require("../utils/cloudSql");
const crmsql = require("../utils/crmswl");
const { getFormData, getAllFields } = require("../utils/commonFunctions");
const {
  insertToShopKiranaDataAirtable,
  updateShopKiranaDataAirtable,
  checkShopKiranaDataPreviousData,
  checkShopKiranaDataQaStatus,
  updateCRMStatusInAirtable,
  getDataFromAllomentBase,
  updateCheckStatusAirtable,
} = require("./airtableFunc");
const {
  insertShopKiranaDataSql,
  updateShopKiranaDataSql,
  updateShopKiranaDataIdSql,
} = require("./sqlFunc");

const {
  updateCRMStatus,
  getBGVStatus,
  updateBGVStatus,
} = require("./crmSqlFunctions");
const { reportReceivedMessage } = require("./utils/bgvStatusArray");
const { shopKiranaAllotmentBase1 } = require("./airtableBases");
function shopKiranaData(_request, _response) {
  try {
    getFormData(_request.body.form.formId.toString())
      .then((formData) => {
        // console.log("FormData ----------------->>>>", formData);
        let hasOrders = formData.sectionFields.length !== 0 ? true : false;
        // console.log("hasOrders outside the block", hasOrders);
        getAllFields(formData, hasOrders)
          .then(({ fields, orders }) => {
            fields["FormId"] = formData.form.formId;
            fields["Filled Time"] = formData.form.createdTime;
            fields["Filled By"] = formData.form.filledByName;
            fields["Modified By"] = formData.form.modifiedByName;
            fields["Modified Time"] = formData.form.modifiedTime;
            // console.log("formData", formData);
            let reportReceivedFromFe = formData.form.modifiedTime.slice(0, 10);
            console.log(
              "reportReceivedMessage----------",
              reportReceivedMessage
            );
            const bgvCheckId = fields["BGV CheckID"];

            // console.log("bgv CheckId--------", bgvCheckId);

            cloudsql.query(
              `SELECT * FROM shopKiranaData WHERE FormId=${fields.FormId};`,
              (err, result) => {
                //console.log("result shopKirana ======", result.length);
                if (err) {
                  _response.send(err).status(500);
                }
                if (result.length > 0) {
                  //if airtable id is not found
                  //current base
                  //update airtableId and
                  if (result[0].airtableId) {
                    checkShopKiranaDataQaStatus(
                      result[0].airtableId,
                      result[0].basechange
                    )
                      .then(() => {
                        updateShopKiranaDataSql(fields)
                          .then(() => {
                            updateShopKiranaDataAirtable(
                              fields.FormId,
                              result[0].airtableId,
                              result[0].basechange
                            ).then(() => {
                              console.info("ShopKirana_DATA_UPDATED");
                              _response.status(200).end();
                            });
                          })
                          .catch((err) => {
                            console.error(
                              "ShopKirana_DATA_UPDATE_ERROR",
                              new Error(err)
                            );
                            _response.status(500).end();
                          });
                      })
                      .catch(() => {
                        console.log(
                          "NOT UPDATED AS QA APPROVED",
                          fields.FormId
                        );
                        _response.status(500).end();
                      });
                  } else {
                    //  console.log(fields.fields.Id, result[0].basechange);
                    checkShopKiranaDataPreviousData(
                      fields.FormId,
                      result[0].basechange
                    )
                      .then((recId) => {
                        if (recId == 0) {
                          console.log("Id Not Found In Base", fields.FormId);
                          _response.status(500).end();299649
                        } else {
                          checkShopKiranaDataQaStatus(
                            recId,
                            result[0].basechange
                          )
                            .then(() => {
                              console.log(
                                "QA status check",
                                result[0].basechange
                              );
                              updateShopKiranaDataAirtable(
                                fields.FormId,
                                recId,
                                result[0].basechange
                              )
                                .then(() => {
                                  updateShopKiranaDataIdSql(
                                    fields.FormId,
                                    recId
                                  )
                                    .then(() => {
                                      // console.info(" @@ ShopKirana_DATA_INSERTED");
                                      _response
                                        .send("success")
                                        .status(200)
                                        .end();
                                    })
                                    .catch((err) => {
                                      console.log(
                                        "ShopKirana_DATA_UPDATE_ERROR",
                                        new Error(err)
                                      );
                                      _response.send(err).end();
                                    });
                                })
                                .catch((err) => {
                                  console.log(
                                    "ShopKirana_DATA_UPDATE_ERROR",
                                    new Error(err)
                                  );
                                  _response.send(err).end();
                                });
                            })
                            .catch((err) => {
                              console.log(
                                "ShopKirana_DATA_QA_ERROR",
                                new Error(err)
                              );
                              _response.send(err).end();
                            });
                        }
                      })
                      .catch((err) => {
                        console.log("ShopKirana_DATA_QA_ERROR", new Error(err));
                        _response.send(err).end();
                      });
                  }
                } else {
                  const basechange = 1;
                  insertShopKiranaDataSql(fields, basechange)
                    .then(() => {
                      insertToShopKiranaDataAirtable(fields.FormId, basechange)
                        .then((recordId) => {
                          updateShopKiranaDataIdSql(fields.FormId, recordId)
                            .then(() => {
                              updateCRMStatus(
                                bgvCheckId,
                                reportReceivedMessage,
                                reportReceivedFromFe
                              )
                                .then(() => {
                                  console.log("CRM_STATUS_UPDATED");
                                  // To Update bgv status in allotment table of airtable
                                  updateCRMStatusInAirtable(bgvCheckId)
                                    .then(() => {
                                      console.log(
                                        "AIRTABLE_ALLOTMENT_TABLE_STATUS_UPDATED"
                                      );
                                    })
                                    .catch((err) => {
                                      console.log(
                                        "AIRTABLE_ALLOTMENT_STATUS_ERROR",
                                        err
                                      );
                                    });
                                })
                                .catch((err) => {
                                  console.log(
                                    "CRM_STATUS_UPDATE_ERROR",
                                    new Error(err)
                                  );
                                });
                              console.log("ShopKirana_INSERTED BASE");
                              _response.status(200).end();
                            })
                            .catch((err) => {
                              console.log(
                                "ShopKirana_DATA_UPDATE_ERROR",
                                new Error(err)
                              );
                              _response.send(err).end();
                            });
                        })
                        .catch((err) => {
                          console.log(
                            "ShopKirana_DATA_INSERT_ERROR",
                            new Error(err)
                          );
                          _response.send(err).end();
                        });
                      // }
                    })
                    .catch((err) => {
                      console.log(
                        "ShopKirana_DATA_INSERT_ERROR",
                        new Error(err)
                      );
                      _response.send(err).end();
                    });
                }
              }
            );
          })
          .catch((err) => {
            console.log("ShopKirana_GET_FIELDS_ERROR", new Error(err));
            _response.send(err).end();
          });
      })
      .catch((err) => {
        console.log("ShopKirana_GET_DATA_ERROR", new Error(err));
        _response.send(err).end();
      });
  } catch (err) {
    console.error("ShopKirana_SQLINSERT_FAILED", new Error(err));
    _response.send(err).end();
  }
}

function shopKiranaAllotment(_req, _res) {
  const shortbase = _req.query.basename;
  let base;
  let formId;
  switch (shortbase) {
    case "b1":
      base = shopKiranaAllotmentBase1;
      break;
    default:
      _res.status(400).send("Base NOT Found");
      break;
  }
  let insertPromises = [];
  getDataFromAllomentBase(base)
    .then((res) => {
      // console.log("@@",res);
      if (res.length < 0) {
        _res.status(500).send("No Data to send");
      }
      res.forEach((form) => {
        let bgvId = form.fields["BGV CheckID"];
        // let bgvStatus = form.fields["BGV Status"]
        insertPromises.push(updateBGVStatus(bgvId, form.fields, form.id));
      });
      Promise.allSettled(insertPromises)
        .then((recIds) => {
          console.log("recccccc", recIds);
          data = [];
          recIds.forEach((id) => {
            if (id.value) {
              data.push({
                id: id.value,
                fields: {
                  "Check Status": true,
                },
              });
            }
          });
          updateCheckStatusAirtable(data, base)
            .then((res) => {
              _res.status(200).send("success");
            })
            .catch((err) => {
              console.log("failed to update", err);
              _res.status(200).send(err);
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

module.exports = {
  shopKiranaData,
  shopKiranaAllotment,
};
