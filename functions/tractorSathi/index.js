const { getFormData, getAllFields } = require("../utils/commonFunctions");
const {
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
  updateStatusRawDataFE,
  getRowsByStatusFE,
  getAllStates,
  getDist,
  getTehsil,
  getVillage,
} = require("./utils/sqlFunctions");
const {
  sendToAirtable,
  updateToAirtable,
  sendToAirtableNew,
  sendToAirtableDataTollFree,
  getQAApprovedDataAirtable,
  updateAllToAirtable,
  updateToAirtableFE,
  addToAirtableFE,
  sendToAirtableDataVillage,
  manualPushedDataLog,
  sendLeadToCustomer,
} = require("./utils/airtableUtil");
const { autocall } = require("../utils/apis");
const {
  username,
  token,
  plan_id,
  tsId,
  caller_id,
  retry_json,
  feFollowUp,
} = require("./utils/sarv-cred");
const {
  fields,
  nonQ,
  esmsFields,
  qaFinalFields,
} = require("./utils/fieldsMapping");
const axios = require("axios");
const cloudsql = require("../utils/cloudSql");

function tractorSaathiMain(_req, _res) {
  getFormData(_req.body.form.formId.toString())
    .then((formData) => {
      let hasOrders = formData.sectionFields.length !== 0 ? true : false;
      getAllFields(formData, hasOrders)
        .then(({ fields, orders }) => {
          fields["Form Id"] = _req.body.form.formId.toString();
          fields["Filled Time"] = _req.body.form.createdTime;
          fields["Modified By"] = _req.body.form.modifiedByName;
          fields["Modified Time"] = _req.body.form.modifiedTime;
          fields["Filled By"] = _req.body.form.filledByName;
          let employees = _req.body.employees;
          insertRawDataToSql(fields, employees)
            .then(() => {
              _res.status(200).send("Success");
            })
            .catch((err) => {
              let data = {
                formId: fields["Form Id"],
                log: JSON.stringify(err),
                type: "Error",
              };
              manualPushedDataLog(data)
                .then(() => {
                  _res.status(500).send(`Failed > ${err}`);
                })
                .catch((err) => {
                  _res.sendStatus(500);
                  console.log("LOG ERROR", JSON.stringify(data));
                });
            });
        })
        .catch((err) => {
          let data = {
            formId: fields["Form Id"],
            log: JSON.stringify(err),
            type: "Error",
          };
          manualPushedDataLog(data)
            .then(() => {
              _res.status(500).send(`Failed > ${err}`);
            })
            .catch((err) => {
              _res.sendStatus(500);
              console.log("LOG ERROR", JSON.stringify(data));
            });
        });
    })
    .catch((err) => {
      let data = {
        formId: fields["Form Id"],
        log: JSON.stringify(err),
        type: "Error",
      };
      manualPushedDataLog(data)
        .then(() => {
          _res.status(500).send(`Failed > ${err}`);
        })
        .catch((err) => {
          _res.sendStatus(500);
          console.log("LOG ERROR", JSON.stringify(data));
        });
    });
}

function insertRawDataToSql(fields, employees) {
  return new Promise((resp, rej) => {
    try {
      const Id = fields["Form Id"];
      const state = fields["State Name (राज्य का नाम)"];
      const phone_number =fields["Met Person Mobile Number (जो व्यक्ति मिला उसका मोबाइल नंबर )"];
      console.log(Id, state, phone_number);
      checkId(Id)
        .then((result) => {
          if (result) {
            console.log("DUPLICATE ID");
            rej(`DUP_FOUND_FOR: ${formid}`);
          } else {
            insertRawData(Id, fields, phone_number, state, employees)
              .then(([is_duplicate, msg_send]) => {
                console.log(is_duplicate, msg_send);
                sendToAirtable(fields, is_duplicate, state, employees)
                  .then((recId) => {
                    updateRawData(Id, fields, phone_number, state, 0, recId)
                      .then(() => {
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
                rej(err);
              });
          }
        })
        .catch((err) => {
          rej(err);
        });
    } catch (error) {
      console.log("HERE", error);
      rej(error);
    }
  });
}
function mapAndInsertDataToSql(fields) {
  return true;
}

function makeAutoCall(_req, _res, type) {
  let curStatus = 0;
  let finalStatus = 1;
  switch (type) {
    case "1":
      curStatus = 0;
      finalStatus = 1;
      break;
    case "2":
      curStatus = 3;
      finalStatus = 4;
      break;
    case "3":
      curStatus = 6;
      finalStatus = 7;
      break;
    case "4":
      curStatus = 9;
      finalStatus = 10;
      break;
    default:
      break;
  }
  getRowsByStatus(curStatus).then((result) => {
    let contact_numbers = [];
    result.forEach((element) => {
      contact_numbers.push(element.phone_number);
    });
    console.log(contact_numbers);
    if (contact_numbers.length > 0) {
      axios
        .post(autocall.autocallapi, null, {
          params: {
            username: username,
            token: token,
            plan_id: plan_id,
            announcement_id: tsId,
            caller_id: caller_id,
            retry_json: retry_json,
            contact_numbers: contact_numbers.join(","),
          },
        })
        .then((resp) => {
          let status = resp.data.status;
          let desc = resp.data.desc;
          let obd_Data = resp.data.data;

          console.log(status, desc, contact_numbers.join(","));

          if (status == "success") {
            let updateRow = [];
            let updateRecord = [];
            for (let i = 0; i < result.length; i++) {
              const element = result[i];
              for (let j = 0; j < obd_Data.length; j++) {
                const el = obd_Data[j];
                if (element.phone_number == el.contact_number) {
                  let unique_id = el.unique_id;
                  let recId = element.recId;
                  updateRow.push(
                    updateStatusRawData(recId, finalStatus, unique_id)
                  );
                  let fields = {};
                  if (type === "1") {
                    fields["AutoCall_UniqueId"] = el.unique_id;
                    fields["AutoCall_Done"] = true;
                  } else {
                    fields[`AutoCall_UniqueId_Day${type}`] = el.unique_id;
                  }
                  let data = {
                    id: recId,
                    fields,
                  };
                  updateRecord.push(updateToAirtable(data, result[i].state));
                  break;
                }
              }
            }
            Promise.all(updateRecord)
              .then((res) => {
                Promise.all(updateRow)
                  .then((res) => {
                    _res.status(200).send("Success");
                  })
                  .catch((err) => {
                    console.log("ERROR SQL", JSON.stringify(err));
                    _res.status(500).send("Failed");
                  });
              })
              .catch((err) => {
                console.log("ERROR AIRTABLE", JSON.stringify(err));
                _res.status(500).send("Failed");
              });
          }
        });
    } else {
      _res.status(200).send("No Numbers To call");
    }
  });
}

function getAutoCallReport(_req, _res, type) {
  let curStatus = 0;
  let finalStatus = 1;
  switch (type) {
    case "1":
      curStatus = 1;
      break;
    case "2":
      curStatus = 4;
      break;
    case "3":
      curStatus = 7;
      break;
    case "4":
      curStatus = 10;
      break;
    default:
      break;
  }
  getRowsByStatus(curStatus)
    .then((result) => {
      let uniqueids = [];
      let rawdata = [];
      console.log(result);
      result.forEach((row) => {
        console.log(row);
        uniqueids.push(row.call_id);
        rawdata.push({
          id: row.recId,
          unique_id: row.call_id,
          state: row.state,
        });
      });
      console.log(JSON.stringify(uniqueids), JSON.stringify(rawdata));
      axios
        .get(autocall.getreportapi, {
          params: {
            username: username,
            token: token,
            unique_ids: uniqueids.join(","),
          },
        })
        .then((response) => {
          let respData = response.data.data;
          let updateRecord = [];
          let updateRow = [];
          for (let key in respData) {
            if (respData[key].status == "error") {
              rawdata.forEach((e) => {
                if (e.unique_id == key) {
                  let fields = {};
                  if (type === "1") {
                    fields[`AutoCall_Report`] = "Error";
                  } else {
                    fields[`AutoCall_Report_Day${type}`] = "Error";
                  }
                  let data = {
                    id: e.id,
                    fields,
                  };
                  console.log(fields);
                  updateRow.push(
                    updateStatusRawData(
                      e.id,
                      getStatusFromreport(type, "error"),
                      e.unique_id
                    )
                  );
                  updateRecord.push(updateToAirtable(data, e.state));
                }
              });
            } else {
              rawdata.forEach((e) => {
                if (e.unique_id == key) {
                  let fields = {};
                  if (type === "1") {
                    fields[`AutoCall_Report`] = respData[key].data.report;
                  } else {
                    fields[`AutoCall_Report_Day${type}`] =
                      respData[key].data.report;
                  }
                  let data = {
                    id: e.id,
                    fields,
                  };
                  console.log(fields);
                  updateRow.push(
                    updateStatusRawData(
                      e.id,
                      getStatusFromreport(type, respData[key].data.report),
                      e.unique_id
                    )
                  );
                  updateRecord.push(updateToAirtable(data, e.state));
                }
              });
            }
          }
          Promise.all(updateRecord)
            .then((ers) => {
              Promise.all(updateRow)
                .then((res) => {
                  _res.status(200).send("Success");
                })
                .catch((err) => {
                  console.error(err);
                  _res.status(500).send("Failed");
                });
            })
            .catch((err) => {
              console.error(err);
              _res.status(500).send("Failed");
            });
        });
    })
    .catch((err) => {
      console.error(err);
      _res.status(500).send("Failed");
    });
}

function getStatusFromreport(type, report) {
  let result;
  switch (type) {
    case "1":
      if (
        report === "error" ||
        report === "Failed" ||
        report === "Congestion"
      ) {
        result = 3;
      } else {
        result = 2;
      }
      break;
    case "2":
      if (
        report === "error" ||
        report === "Failed" ||
        report === "Congestion"
      ) {
        result = 6;
      } else {
        result = 5;
      }
      break;
    case "3":
      if (
        report === "error" ||
        report === "Failed" ||
        report === "Congestion"
      ) {
        result = 9;
      } else {
        result = 8;
      }
      break;
    case "4":
      if (
        report === "error" ||
        report === "Failed" ||
        report === "Congestion"
      ) {
        result = 12;
      } else {
        result = 11;
      }
      break;
    default:
      break;
  }
  return result;
}

function getData(_req, _res) {
  let airtableData = [];
  _req.body.data.forEach((el) => {
    airtableData.push({ fields: el });
  });
  sendToAirtableNew(airtableData)
    .then(() => {
      _res.status(200).send("Success");
    })
    .catch(() => {
      _res.status(500).send("failed");
    });
}

function getFilledFromsCount(_req, _res) {
  console.log(_req.body);
  const ph_no = _req.body.phone_number;
  getPhoneNumber(ph_no)
    .then((result) => {
      _res.status(200).json({
        count: result[0]["count"],
      });
    })
    .catch((err) => {
      _res.status(500).send("Get Count Failed");
    });
}

function getDataTollFree(_req, _res) {
  let params = _req.query;
  console.log("GET DATA", params);
  let airtableData = [];
  let fields = {};
  for (const key in params) {
    if (Object.hasOwnProperty.call(params, key)) {
      const element = params[key];
      fields[key] = element;
    }
  }
  airtableData.push({ fields });
  console.log("TOLL_FREE_NUMBER DATA: ", JSON.stringify(airtableData));
  sendToAirtableDataTollFree(airtableData)
    .then(() => {
      if (airtableData[0].fields.did_no === "18001237199") {
        cloudsql.query(
          `Select recId, state from tractor_sathi_raw where phone_number like "%${
            airtableData[0].fields.caller_number.length > 10
              ? airtableData[0].fields.caller_number.substr(3)
              : airtableData[0].fields.caller_number
          }%"`,
          (err, result) => {
            if (err) {
              console.log(
                "COULDNOT UPDATE MISCALL DATA ON MAIN BASE",
                JSON.stringify(err)
              );
              let msgBody = {
                sender: "ANAXEE",
                route: "4",
                country: "91",
                sms: [
                  {
                    message: `🙏 | नया/पुराना ट्रेक्टर खरीदने के लिए कॉल 1800 123 7199 | TractorSathi`,
                    to: [
                      airtableData[0].fields.caller_number.length > 10
                        ? airtableData[0].fields.caller_number.substr(3)
                        : airtableData[0].fields.caller_number,
                    ],
                  },
                ],
              };
              // console.log(JSON.stringify(msgBody));
              // axios.post("https://api.msg91.com/api/v2/sendsms?country=91", msgBody, {
              //         headers: {
              //             "Content-Type": "application/json",
              //             "authkey": "103801ASIjpSVep5dadb6b2"
              //         }
              //     })
              //     .then(() => {
              _res.status(200).send("Success");
              // })
              // .catch(err => {
              //   console.log(`couldn't sedn sms to ${(airtableData[0].fields.caller_number.length>10)?airtableData[0].fields.caller_number.substr(3):airtableData[0].fields.caller_number}`)
              //   _res.status(200).send("Success");
              // })
            } else {
              let data = [];
              data.push({
                id: result[0].recId,
                fields: {
                  "Missed Call Received on Toll Free Number?": true,
                },
              });
              updateAllToAirtable(data, result[0].state)
                .then(() => {
                  let msgBody = {
                    sender: "ANAXEE",
                    route: "4",
                    country: "91",
                    sms: [
                      {
                        message: `🙏 | नया/पुराना ट्रेक्टर खरीदने के लिए कॉल 1800 123 7199 | TractorSathi`,
                        to: [
                          airtableData[0].fields.caller_number.length > 10
                            ? airtableData[0].fields.caller_number.substr(3)
                            : airtableData[0].fields.caller_number,
                        ],
                      },
                    ],
                  };
                  // axios.post("https://api.msg91.com/api/v2/sendsms?country=91", msgBody, {
                  //         headers: {
                  //             "Content-Type": "application/json",
                  //             "authkey": "103801ASIjpSVep5dadb6b2"
                  //         }
                  //     })
                  //     .then(() => {
                  _res.status(200).send("Success");
                  // })
                  // .catch(err => {
                  //   console.log(`couldn't sedn sms to ${(airtableData[0].fields.caller_number.length>10)?airtableData[0].fields.caller_number.substr(3):airtableData[0].fields.caller_number}`)
                  //   _res.status(200).send("Success");
                  // })
                })
                .catch((err) => {
                  console.log(
                    "COULDNOT UPDATE MISCALL DATA ON MAIN BASE",
                    JSON.stringify(err)
                  );
                  _res.status(200).send("Success");
                });
            }
          }
        );
      } else if (airtableData[0].fields.did_no === "9610705007") {
        cloudsql.query(
          "Insert into fe_missed_call_numbers (phone_number, date_time, called_number) values (?, ?, ?)",
          [
            `91${
              airtableData[0].fields.caller_number.length > 10
                ? airtableData[0].fields.caller_number.substr(3)
                : airtableData[0].fields.caller_number
            }`,
            new Date(),
            "9610705007",
          ],
          (err, result) => {
            if (err && err.code === "ER_DUP_ENTRY") {
              console.log(err);
              _res.status("200").send("DUPLICATE NUMBER WHATSAPP MSG NOT SEND");
            } else {
              try {
                axios
                  .post(
                    "https://beta.tellephant.com/api/v2/messaging/send-message",
                    {
                      apikey:
                        "gZWp67Fk1tqQGi7C9p0GnbKjDVQOMULBOzmsxObglppMvTAgFBSRe2Ryb6Un",
                      to: `91${
                        airtableData[0].fields.caller_number.length > 10
                          ? airtableData[0].fields.caller_number.substr(3)
                          : airtableData[0].fields.caller_number
                      }`,
                      channels: ["whatsapp"],
                      whatsapp: {
                        contentType: "template",
                        template: {
                          templateId: "ts_misscall_1_with_3button",
                          language: "hi",
                          components: [
                            {
                              type: "header",
                              parameters: [
                                {
                                  type: "media",
                                  media: {
                                    type: "image",
                                    url: "https://sites.google.com/a/anaxeetech.com/bot-files/home/Runner-Feb-Poster-TractorSathi.jpeg",
                                  },
                                },
                              ],
                            },
                          ],
                        },
                      },
                    }
                  )
                  .then((res) => {
                    console.log(
                      `WHATSAPP MSG SEND TO 91${
                        airtableData[0].fields.caller_number.length > 10
                          ? airtableData[0].fields.caller_number.substr(3)
                          : airtableData[0].fields.caller_number
                      } msgId: ${_res.messageId}`
                    );
                    _res
                      .status(200)
                      .send(
                        `WHATSAPP MSG SEND TO 91${
                          airtableData[0].fields.caller_number.length > 10
                            ? airtableData[0].fields.caller_number.substr(3)
                            : airtableData[0].fields.caller_number
                        } msgId: ${_res.messageId}`
                      );
                  })
                  .catch((err) => {
                    console.log(
                      `PROBLEM SENDING WHATSAPP MSG TO 91${
                        airtableData[0].fields.caller_number.length > 10
                          ? airtableData[0].fields.caller_number.substr(3)
                          : airtableData[0].fields.caller_number
                      } err: ${_res.error}`
                    );
                    _res
                      .status(200)
                      .send(
                        `PROBLEM SENDING WHATSAPP MSG TO 91${
                          airtableData[0].fields.caller_number.length > 10
                            ? airtableData[0].fields.caller_number.substr(3)
                            : airtableData[0].fields.caller_number
                        } err: ${_res.error}`
                      );
                  });
              } catch (error) {
                console.log(
                  `PROBLEM SENDING WHATSAPP MSG TO 91${
                    airtableData[0].fields.caller_number.length > 10
                      ? airtableData[0].fields.caller_number.substr(3)
                      : airtableData[0].fields.caller_number
                  } err: ${_res.error}`
                );
                _res
                  .status(200)
                  .send(
                    `PROBLEM SENDING WHATSAPP MSG TO 91${
                      airtableData[0].fields.caller_number.length > 10
                        ? airtableData[0].fields.caller_number.substr(3)
                        : airtableData[0].fields.caller_number
                    } err: ${_res.error}`
                  );
              }
            }
          }
        );
      }  else {
        _res.status(200).send("Success");
      }
    })
    .catch((err) => {
      console.log(err);
      _res.status(500).send("failed");
    });
}

function putRawData(_req, _res) {
  let insertPromises = [];
  let changeStatus = [];
  getRow().then((result) => {
    result.forEach((form) => {
      let keys = "";
      let values = [];
      let valueHolder = ``;
      let obj = JSON.parse(form.fields);
      for (const key in obj) {
        if (Object.hasOwnProperty.call(obj, key)) {
          const value = obj[key];
          if (value && fields[key]) {
            keys = `${keys}, ${fields[key]}`;
            values.push(processValue(value));
            valueHolder = `${valueHolder}, ?`;
          }
        }
      }
      keys = keys.substr(2);
      let query = `INSERT INTO ts_raw_data (${keys}) VALUES (${valueHolder.substr(
        2
      )});`;
      insertPromises.push(runQuery(query, values));
      changeStatus.push(changeCleanedStatus(obj["Form Id"]));
    });
    Promise.all(insertPromises)
      .then(() => {
        Promise.all(changeStatus)
          .then(() => {
            _res.status(200).send("Success");
          })
          .catch((err) => {
            _res.status(500).send("Failed");
          });
      })
      .catch((err) => {
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

function getQAApprovedData(_req, _res) {
  const shortstate = _req.query.short_state;
  let state;
  switch (shortstate) {
    case "MP":
      state = "Madhya Pradesh";
      break;
    case "UP":
      state = "Uttar Pradesh";
      break;
    case "MP1":
      state = "Madhya Pradesh1";
      break;
    case "UP1":
      state = "Uttar Pradesh1";
      break;
    case "RJ":
      state = "Rajasthan";
      break;
    case "BH":
      state = "Bihar";
      break;
    case "HR":
      state = "Haryana";
      break;
    case "GJ":
      state = "Gujarat";
      break;
    default:
      _res.status(400).send("State Not Found");
      break;
  }
  getQAApprovedDataAirtable(state)
    .then((res) => {
      let insertPromises = [];
      if (res.length <= 0) {
        _res.status(200).send("No Data to send");
      }
      res.forEach((form) => {
        let keys = "";
        let values = [];
        let valueHolder = ``;
        let obj = form.fields;
        for (const key in obj) {
          if (Object.hasOwnProperty.call(obj, key)) {
            let value = obj[key];
            if (key === "Filled By") {
              value = obj["Name (from Filled By)"];
            }
            if (value && qaFinalFields[key]) {
              keys = `${keys}, ${qaFinalFields[key]}`;
              values.push(processValue(value));
              valueHolder = `${valueHolder}, ?`;
            }
          }
        }
        keys = keys.substr(2);
        let query = `INSERT INTO ts_qa_done_data (${keys}) VALUES (${valueHolder.substr(
          2
        )});`;
        insertPromises.push(runApprovedQuery(query, values, form.id));
      });
      Promise.allSettled(insertPromises)
        .then((recIds) => {
          data = [];
          recIds.forEach((id) => {
            if (id.value) {
              data.push({
                id: id.value,
                fields: {
                  "Data Pushed to QA Done Table": true,
                },
              });
            }
          });
          updateAllToAirtable(data, state)
            .then((res) => {
              _res.status(200).send("success");
            })
            .catch((err) => {
              console.log(err);
              _res.status(500).send("failed To Update Airtable");
            });
        })
        .catch((err) => {
          console.log(err);
          _res.status(500).send("failed to insert data");
        });
    })
    .catch((err) => {
      console.log(err);
      _res.status(500).send("failed");
    });
}

function getFES(_req, _res) {
  const insertPromises = [];
  getRunnersAndManagers()
    .then((res) => {
      cloudsql.query("DELETE FROM active_fe_in_last_5_days", (err, _result) => {
        if (err) {
          console.log(err);
          _res.status(500).send("ERROR CLEARING TABLE");
        } else {
          res.forEach((row) => {
            let keys = "";
            let values = [];
            let valueHolder = ``;
            for (const key in row) {
              if (Object.hasOwnProperty.call(row, key)) {
                let value = row[key];
                if (value) {
                  keys = `${keys}, ${key}`;
                  values.push(processValue(value));
                  valueHolder = `${valueHolder}, ?`;
                }
              }
            }
            keys = keys.substr(2);
            let query = `INSERT INTO active_fe_in_last_5_days (${keys}) VALUES (${valueHolder.substr(
              2
            )});`;
            insertPromises.push(runQuery(query, values));
          });
          Promise.all(insertPromises)
            .then(() => {
              _res.status(200).send("Success");
            })
            .catch((err) => {
              console.log(err);
              _res.status(500).send("ERROR INSERTING FES");
            });
        }
      });
    })
    .catch((err) => {
      console.log(err);
      _res.status(500).send("ERROR GETTING FES");
    });
}

function makeAutoCallFE(_req, _res, type) {
  let curStatus = 0;
  let finalStatus = 1;
  switch (type) {
    case "1":
      curStatus = 0;
      finalStatus = 1;
      break;
    case "2":
      curStatus = 3;
      finalStatus = 4;
      break;
    case "3":
      curStatus = 6;
      finalStatus = 7;
      break;
    default:
      break;
  }
  getRowsByStatusFE(curStatus).then((result) => {
    let contact_numbers = [];
    result.forEach((element) => {
      contact_numbers.push(element.empPhone);
      // contact_numbers.push(element.managerPhone);
    });
    console.log(contact_numbers);
    contact_numbers = [...new Set(contact_numbers)];
    if (contact_numbers.length > 0) {
      axios
        .post(autocall.autocallapi, null, {
          params: {
            username: username,
            token: token,
            plan_id: plan_id,
            announcement_id: feFollowUp,
            caller_id: caller_id,
            retry_json: retry_json,
            contact_numbers: contact_numbers.join(","),
          },
        })
        .then((resp) => {
          let status = resp.data.status;
          let desc = resp.data.desc;
          let obd_Data = resp.data.data;

          console.log(status, desc, contact_numbers.join(","));

          if (status == "success") {
            let updateRow = [];
            let updateRecord = [];
            for (let i = 0; i < result.length; i++) {
              const element = result[i];
              for (let j = 0; j < obd_Data.length; j++) {
                const el = obd_Data[j];
                if (
                  element.empPhone == el.contact_number ||
                  element.managerPhone == el.contact_number
                ) {
                  let unique_id = el.unique_id;
                  let empPhone = element.empPhone;
                  updateRow.push(
                    updateStatusRawDataFE(empPhone, finalStatus, unique_id)
                  );
                  let fields = { ...element };
                  delete fields.call_id;
                  delete fields.recId;
                  if (type === "1") {
                    fields["AutoCall_UniqueId"] = el.unique_id;
                  } else {
                    fields[`AutoCall_UniqueId_${type}`] = el.unique_id;
                  }
                  fields["call_DateTime"] = new Date();
                  let data = {
                    fields,
                  };
                  updateRecord.push(addToAirtableFE(data));
                  break;
                }
              }
            }
            Promise.all(updateRecord)
              .then((res) => {
                Promise.all(updateRow)
                  .then((res) => {
                    _res.status(200).send("Success");
                  })
                  .catch((err) => {
                    console.log("ERROR SQL", JSON.stringify(err));
                    _res.status(500).send("Failed");
                  });
              })
              .catch((err) => {
                console.log("ERROR AIRTABLE", JSON.stringify(err));
                _res.status(500).send("Failed");
              });
          }
        });
    } else {
      _res.status(200).send("No Numbers To call");
    }
  });
}

function getAutoCallReportFE(_req, _res, type) {
  let curStatus = 0;
  let finalStatus = 1;
  switch (type) {
    case "1":
      curStatus = 1;
      break;
    case "2":
      curStatus = 4;
      break;
    case "3":
      curStatus = 7;
      break;
    default:
      break;
  }
  getRowsByStatusFE(curStatus)
    .then((result) => {
      let uniqueids = [];
      let rawdata = [];
      result.forEach((row) => {
        uniqueids.push(row.call_id);
        rawdata.push({
          id: row.recId,
          unique_id: row.call_id,
          empPhone: row.empPhone,
        });
      });
      console.log(JSON.stringify(uniqueids), JSON.stringify(rawdata));
      axios
        .get(autocall.getreportapi, {
          params: {
            username: username,
            token: token,
            unique_ids: uniqueids.join(","),
          },
        })
        .then((response) => {
          let respData = response.data.data;
          let updateRecord = [];
          let updateRow = [];
          for (let key in respData) {
            if (respData[key].status == "error") {
              rawdata.forEach((e) => {
                if (e.unique_id == key) {
                  let fields = {};
                  if (type === "1") {
                    fields[`AutoCall_Report`] = "Error";
                  } else {
                    fields[`AutoCall_Report_${type}`] = "Error";
                  }
                  let data = {
                    id: e.id,
                    fields,
                  };
                  console.log(fields);
                  updateRow.push(
                    updateStatusRawDataFE(
                      e.empPhone,
                      getStatusFromreport(type, "error"),
                      e.unique_id
                    )
                  );
                  updateRecord.push(updateToAirtableFE(data));
                }
              });
            } else {
              rawdata.forEach((e) => {
                if (e.unique_id == key) {
                  let fields = {};
                  if (type === "1") {
                    console.log(respData[key].data);
                    fields[`AutoCall_Report`] = respData[key].data.report;
                    fields["dtmf"] = respData[key].data.dtmf;
                  } else {
                    fields[`AutoCall_Report_${type}`] =
                      respData[key].data.report;
                    fields["dtmf"] = respData[key].data.dtmf;
                  }
                  let data = {
                    id: e.id,
                    fields,
                  };
                  console.log(fields);
                  updateRow.push(
                    updateStatusRawDataFE(
                      e.empPhone,
                      getStatusFromreport(type, respData[key].data.report),
                      e.unique_id
                    )
                  );
                  updateRecord.push(updateToAirtableFE(data, e.state));
                }
              });
            }
          }
          Promise.all(updateRecord)
            .then((ers) => {
              Promise.all(updateRow)
                .then((res) => {
                  _res.status(200).send("Success");
                })
                .catch((err) => {
                  console.error(err);
                  _res.status(500).send("Failed");
                });
            })
            .catch((err) => {
              console.error(err);
              _res.status(500).send("Failed");
            });
        });
    })
    .catch((err) => {
      console.error(err);
      _res.status(500).send("Failed");
    });
}

function getAllState(_req, _res) {
  getAllStates().then((result) => {
    console.log(result);
    _res.status(200).send(result);
  });
}

function getDistrictByState(_req, _res) {
  const state = _req.body.state;
  getDist(state).then((result) => {
    console.log(result);
    _res.status(200).send(result);
  });
}

function getTehsilByDist(_req, _res) {
  const state = _req.body.state;
  const dist = _req.body.dist;
  getTehsil(state, dist).then((result) => {
    console.log(result);
    _res.status(200).send(result);
  });
}
function getVillByTehsil(_req, _res) {
  const state = _req.body.state;
  const dist = _req.body.dist;
  const tehsil = _req.body.tehsil;
  getVillage(state, dist, tehsil).then((result) => {
    console.log(result);
    _res.status(200).send(result);
  });
}

function saveVillageData(_req, _res) {
  sendToAirtableDataVillage(_req.body)
    .then(() => {
      _res.header("Access-Control-Allow-Origin", "*");
      _res.header("Access-Control-Allow-Headers", "Content-Type");
      _res.status(200).send("success");
    })
    .catch((err) => {
      _res.header("Access-Control-Allow-Origin", "*");
      _res.header("Access-Control-Allow-Headers", "Content-Type");
      _res.status(500).send("failed");
    });
  console.log(_req.body);
}

//pushing data to airtable
function pushToairtable(_req, _res) {
  cloudsql.query(
    'select * from tractor_sathi_raw where isnull(recId) and not isnull(state) and not state="Demo State" and not status=99 limit 1',
    (err, result) => {
      result.forEach((el) => {
        console.log(el.Id, el.state);
        sendToAirtable(JSON.parse(el.fields), false, el.state)
          .then((recId) => {
            updateRawData(
              el.Id,
              JSON.parse(el.fields),
              el.phone_number,
              el.state,
              0,
              recId
            )
              .then(() => {
                console.log(el.recId);
                let data = {
                  formId: el.Id,
                  log: JSON.stringify({ type: "success", rec_id: recId }),
                  type: "Success",
                };
                manualPushedDataLog(data)
                  .then(() => {
                    _res.sendStatus(200);
                  })
                  .catch((err) => {
                    _res.sendStatus(500);
                    console.log("LOG ERROR", JSON.stringify(data));
                  });
              })
              .catch((err) => {
                console.log(err);
                let data = {
                  formId: el.Id,
                  log: JSON.stringify(err),
                  type: "Error",
                };
                manualPushedDataLog(data)
                  .then(() => {
                    _res.sendStatus(200);
                  })
                  .catch((err) => {
                    console.log("LOG ERROR", JSON.stringify(data));
                    _res.sendStatus(500);
                  });
              });
          })
          .catch((err) => {
            updateRawData(
              el.Id,
              JSON.parse(el.fields),
              el.phone_number,
              el.state,
              99,
              ""
            ).then(() => {
              console.log(err);
              let data = {
                formId: el.Id,
                log: JSON.stringify(err),
                type: "Error",
              };
              manualPushedDataLog(data)
                .then(() => {
                  _res.sendStatus(200);
                })
                .catch((err) => {
                  console.log("LOG ERROR", JSON.stringify(data));
                  _res.sendStatus(500);
                });
            });
          })
          .catch((err) => {
            console.log("UNABLE TO UPDATE ROW");
          });
      });
    }
  );
}



module.exports = {
  tractorSaathiMain,
  makeAutoCall,
  getAutoCallReport,
  getData,
  getDataTollFree,
  putRawData,
  getFilledFromsCount,
  getQAApprovedData,
  getFES,
  makeAutoCallFE,
  getAutoCallReportFE,
  getAllState,
  getDistrictByState,
  getTehsilByDist,
  getVillByTehsil,
  saveVillageData,
  pushToairtable,
};
