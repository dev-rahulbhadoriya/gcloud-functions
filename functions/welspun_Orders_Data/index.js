const cloudsql = require("../utils/cloudSql");
const { getFormData, getAllFields } = require("../utils/commonFunctions");
const { getrawfields } = require("./utils/fieldMapping");
const {
  updateDataWelspunOrderAirtable,
  checkWelspunOrderPreviousData,
  insertToWelspunOrderAirtable,
} = require("./utils/wo_airtableFunctions");
const {
  updateWOFormData,
  updateWOFormAirtableId,
  insertWOFormData,
  getRow,
  changeCleanedStatus,
  runQuery,
} = require("./utils/wo_SqlFunctions");

function welspunOrderData(_request, _response) {
  try {
    getFormData(_request.body.form.formId.toString())
      .then((formData) => {
        getAllFields(formData)
          .then((fields) => {
            fields.fields["Id"] = formData.form.formId.toString();
            fields.fields["Filled Date Time"] = formData.form.createdTime;
            fields.fields["Filled By"] = formData.form.filledByName;
            fields.fields["Modified By"] = formData.form.modifiedByName;
            fields.fields["Modified Time"] = formData.form.modifiedTime;
            cloudsql.query(
              `SELECT * FROM welspun_orders_data WHERE id=${fields.fields.Id};`,
              (err, result) => {
                if (err) {
                  _response.send(err).status(500);
                }
                if (result.length > 0) {
                  if (result[0].airtableId) {
                    updateWOFormData(fields.fields)
                      .then(() => {
                        updateDataWelspunOrderAirtable(
                          fields.fields.Id,
                          result[0].airtableId
                        ).then(() => {
                          console.info("WELSPUN_ORDERS_DATA_UPDATED");
                          _response.send("success").status(200);
                        });
                      })
                      .catch((err) => {
                        console.error(
                          "WELSPUN_ORDERS_DATA_ERROR",
                          new Error(err)
                        );
                        _response.send(err).status(500);
                      });
                  } else {
                    checkWelspunOrderPreviousData(fields.fields.Id)
                      .then((recId) => {
                        if (recId == 0) {
                          console.log("Id Not Found In Base", fields.fields.Id);
                          _response.send("Not Found").status(500);
                        } else {
                          updateDataWelspunOrderAirtable(
                            fields.fields.Id,
                            recId
                          )
                            .then(() => {
                              updateWOFormAirtableId(fields.fields.Id, recId)
                                .then(() => {
                                  console.info("WELSPUN_ORDERS_DATA_INSERTED");
                                  _response.send("success").status(200);
                                })
                                .catch((err) => {
                                  console.log(
                                    "WELSPUN_ORDERS_UPDATE_ERROR",
                                    new Error(err)
                                  );
                                  _response.send(err).status(500);
                                });
                            })
                            .catch((err) => {
                              console.log(
                                "WELSPUN_ORDERS_UPDATE_ERROR",
                                new Error(err)
                              );
                              _response.send(err).status(500);
                            });
                        }
                      })
                      .catch((err) => {
                        console.error("PREVIOUS_DATA_CHECK", new Error(err));
                      });
                  }
                } else {
                  insertWOFormData(fields.fields)
                    .then(() => {
                      insertToWelspunOrderAirtable(fields.fields.Id)
                        .then((recordId) => {
                          updateWOFormAirtableId(fields.fields.Id, recordId)
                            .then(() => {
                              console.info(
                                "WELSPUN_ORDERS_IN_AIRTABLE_UPDATED"
                              );
                              _response.send("success").status(200);
                            })
                            .catch((err) => {
                              console.log(
                                "WELSPUN_ORDERS_IN_AIRTABLE_UPDATE_ERROR",
                                new Error(err)
                              );
                              _response.send(err).status(500);
                            });
                        })
                        .catch((err) => {
                          console.log(
                            "WELSPUN_ORDERS_INSERT_AIRTABLE_ERROR",
                            new Error(err)
                          );
                          _response.send(err).status(500);
                        });
                    })
                    .catch((err) => {
                      console.log(
                        "WELSPUN_ORDERS_INSERT_ERROR",
                        new Error(err)
                      );
                      _response.send(err).status(500);
                    });
                }
              }
            );
          })
          .catch((err) => {
            console.log("WELSPUN_ORDERS_DATA_GET_FIELDS_ERROR", new Error(err));
            _response.send(err).status(500);
          });
      })
      .catch((err) => {
        console.log("WELSPUN_ORDERS_GET_DATA_ERROR", new Error(err));
        _response.send(err).status(500);
      });
  } catch (err) {
    console.error("WELSPUN_ORDERS_SQLINSERT_FAILED", new Error(err));
    _response.send(err).status(500);
  }
}

// raw function

function putrawWelpunData(_req, _res) {
  let insertPromises = [];
  let changeStatus = [];
  getRow().then((result) => {
    // console.log(result);
    result.forEach((form) => {
      let sqlData = {};
      let parsedData = JSON.parse(form.data);
      // console.log("cheack data",parsedData);
      for (const key in parsedData) {
        const value = parsedData[key];
        const k = getrawfields[key];
        let data = processValue(value);
        // console.log(k,"-----",data,"---",key);
        if (k) {
          sqlData[k] = data;
        }
      }
      //  console.log("data",sqlData);
      let query = `INSERT INTO welspun_raw_data SET ?`;
      insertPromises.push(runQuery(query, [sqlData]));
      changeStatus.push(changeCleanedStatus(parsedData["Id"]));
    });
    Promise.all(insertPromises)
      .then(() => {
        _res.status(200).send("Success");
      })
      .catch(() => {
        _res.status(500).send("Failed");
      });
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
  welspunOrderData,
  putrawWelpunData
};
