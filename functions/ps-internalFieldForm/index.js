const {
  insertPSFormData,
  updatePSFormAirtableId,
  updatePSFormData,
} = require("./utils/ps_Sql");
const {
  insertToPSInternalFieldFormAirtable,
  updatePSInternalFieldFormAirtable,
  checkPSInternalFieldFormPreviousData,
  getpsInternalFieldDataAirtable,
  runApprovedQuery,
  updateRefenceID,
} = require("./utils/psAirtbale");

const cloudsql = require("../utils/cloudSql");
const { getFormData, getAllFields } = require("../utils/commonFunctions");

function psInternalFieldData(_request, _response) {
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
              `SELECT * FROM ps_internalfieldform WHERE id LIKE "%${fields.fields.Id}%"`,
              (err, result) => {
                if (err) {
                  _response.send(err).status(500);
                }
                if (result.length > 0) {
                  if (result[0].airtableId) {
                    updatePSFormData(fields.fields)
                      .then(() => {
                        updatePSInternalFieldFormAirtable(
                          fields.fields.Id,
                          result[0].airtableId,
                          result[0].basechange
                        ).then(() => {
                          console.info("PS_INTERNAL_FIELD_DATA_UPDATED");
                          _response.send("success").status(200);
                        });
                      })
                      .catch((err) => {
                        console.error(
                          "PS_INTERNAL_FIELD_DATA_ERROR",
                          new Error(err)
                        );
                        _response.send(err).status(500);
                      });
                  } else {
                    checkPSInternalFieldFormPreviousData(
                      fields.fields.Id,
                      result[0].basechange
                    )
                      .then((recId) => {
                        if (recId == 0) {
                          console.log("Id Not Found In Base", fields.fields.Id);
                          _response.send("Not Found").status(500);
                        } else {
                          updatePSInternalFieldFormAirtable(
                            fields.fields.Id,
                            recId,
                            result[0].basechange
                          )
                            .then(() => {
                              updatePSFormAirtableId(fields.fields.Id, recId)
                                .then(() => {
                                  console.info(
                                    "PS_INTERNAL_FIELD_DATA_INSERTED"
                                  );
                                  _response.send("success").status(200);
                                })
                                .catch((err) => {
                                  console.log(
                                    "PS_INTERNAL_FIELD_UPDATE_ERROR",
                                    new Error(err)
                                  );
                                  _response.send(err).status(500);
                                });
                            })
                            .catch((err) => {
                              console.log(
                                "PS_INTERNAL_FIELD_UPDATE_ERROR",
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
                  const basechange = 12;
                  insertPSFormData(fields.fields, basechange)
                    .then(() => {
                      insertToPSInternalFieldFormAirtable(
                        fields.fields.Id,
                        basechange
                      )
                        .then((recordId) => {
                          updatePSFormAirtableId(fields.fields.Id, recordId)
                            .then(() => {
                              console.info(
                                "PS_INTERNAL_FIELD_IN_AIRTABLE_UPDATED"
                              );
                              _response.send("success").status(200);
                            })
                            .catch((err) => {
                              console.log(
                                "PS_INTERNAL_FIELD_IN_AIRTABLE_UPDATE_ERROR",
                                new Error(err)
                              );
                              _response.send(err).status(500);
                            });
                        })
                        .catch((err) => {
                          console.log(
                            "PS_INTERNAL_FIELD_INSERT_AIRTABLE_ERROR",
                            new Error(err)
                          );
                          _response.send(err).status(500);
                        });
                    })
                    .catch((err) => {
                      console.log(
                        "PS_INTERNAL_FIELD_INSERT_ERROR",
                        new Error(err)
                      );
                      _response.send(err).status(500);
                    });
                }
              }
            );
          })
          .catch((err) => {
            console.log("PS_INTERNAL_FIELD_GET_FIELDS_ERROR", new Error(err));
            _response.send(err).status(500);
          });
      })
      .catch((err) => {
        console.log("PS_INTERNAL_FIELD_GET_DATA_ERROR", new Error(err));
        _response.send(err).status(500);
      });
  } catch (err) {
    console.error("PS_INTERNAL_FIELD_SQLINSERT_FAILED", new Error(err));
    _response.send(err).status(500);
  }
}

//get InternalFieldData function ----> Not
const {
  PSInternalFieldForm,
  PSInternalFieldForm2,
  PSInternalFieldForm3,
  PSInternalFieldForm4,
  PSInternalFieldForm5,
  PSInternalFieldForm6,
  PSInternalFieldForm7,
  PSInternalFieldForm8,
  PSInternalFieldForm9,
  PSInternalFieldForm10,
  PSInternalFieldForm11,
  PSInternalFieldForm12,
} = require("../ps-internalFieldForm/utils/ps_airtableBase");

const { psInternalFields } = require("./utils/fields_mapping");
const {
  runApprovedQueryWithTehsil,
} = require("../coronaSurvey/utils/coronaSql");
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

function getInternalFieldDataQA(_req, _res) {
  const shortbase = _req.query.basename;
  let base;
  let bNo;
  switch (shortbase) {
    case "b1":
      base = PSInternalFieldForm;
      bNo = 1;
      break;
    case "b2":
      base = PSInternalFieldForm2;
      bNo = 2;
      break;
    case "b3":
      base = PSInternalFieldForm3;
      bNo = 3;
      break;
    case "b4":
      base = PSInternalFieldForm4;
      bNo = 4;
      break;
    case "b5":
      base = PSInternalFieldForm5;
      bNo = 5;
      break;
    case "b6":
      base = PSInternalFieldForm6;
      bNo = 6;
      break;
    case "b7":
      base = PSInternalFieldForm7;
      bNo = 7;
      break;
    case "b8":
      base = PSInternalFieldForm8;
      bNo = 8;
      break;
    case "b9":
      base = PSInternalFieldForm9;
      bNo = 9;
      break;
    case "b10":
      base = PSInternalFieldForm10;
      bNo = 10;
      break;
    case "b11":
      base = PSInternalFieldForm11;
      bNo = 11;
      break;
    case "b12":
      base = PSInternalFieldForm12;
      bNo = 12;
      break;
    default:
      _res.status(400).send("Base NOT Found");
      break;
  }

  let insertPromises = [];
  let refdata = [];
  getpsInternalFieldDataAirtable(base)
    .then((res) => {
      if (res.length <= 0) {
        _res.status(200).send("No Data to send");
      }
      res.forEach((form) => {
        let sqlData = {};
        let parsedData = form.fields;
        for (const key in parsedData) {
          const k = psInternalFields[key];

          if (key === "filledBy") {
            filled = parsedData[key];
            //console.log("@@", filled);
          }

          if (key === "OCR for 2nd Certificate Photo") {
            something = parsedData[key];
            var str = JSON.stringify(something);
            // console.log("####",str)
            var arr = [];
            var NA = "NotProperId";
            try {
              str
                .match(/[^stop (.\dA-Z0#]([1-9])\d+[0-9]{9,17}/g)
                .forEach((element) => {
                  if (element != null) {
                    if (element.includes("n")) {
                      var ref = element.split("n");
                      arr.push(ref[1]);
                    } else {
                      arr.push(element);
                    }
                  }
                });
              parsedData[key] = arr[0].toString();
              // console.log("@@@@@",parsedData[key])
            } catch (err) {
              arr.push(NA);
              parsedData[key] = arr[0].toString();
              // console.log("####",parsedData[key])
            }
          }
          if (key === "OCR Data for Vaccination Certificate") {
            something = parsedData[key];
            var str = JSON.stringify(something);
            // console.log("####",str)
            var arr = [];
            var NA = "NotProperId";
            try {
              str
                .match(/[^stop (.\dA-Z0#]([1-9])\d+[0-9]{9,17}/g)
                .forEach((element) => {
                  if (element != null) {
                    if (element.includes("n")) {
                      var ref = element.split("n");
                      arr.push(ref[1]);
                    } else {
                      arr.push(element);
                    }
                  }
                });
              parsedData[key] = arr[0].toString();
              // console.log("@@@@@",parsedData[key])
            } catch (err) {
              arr.push(NA);
              parsedData[key] = arr[0].toString();
              // console.log("####",parsedData[key])
            }
          }
          const value = parsedData[key];
          let data = processValue(value);

          //console.log(data);
          if (k) {
            sqlData[k] = data;
          }
          sqlData["BaseNo"] = bNo;
        }
        if (form.id) {
          refdata.push({
            id: form.id,
            fields: {
              BeneficiaryReferenceID2ndDose:
                sqlData.BeneficiaryReferenceID2nddose,
              BeneficiaryReferenceID1stDose:
                sqlData.BeneficiaryReferenceID1stDose,
            },
          });
        }
        updateRefenceID(refdata, base);
        console.log("Sql Data", JSON.stringify(sqlData), bNo);
        let query = `INSERT INTO psInternalFieldQA SET ?`;
        insertPromises.push(runApprovedQuery(query, [sqlData], form.id, bNo));
      });
      Promise.allSettled(insertPromises)
        .then((recIds) => {
          data = [];
          recIds.forEach((id) => {
            if (id.value) {
              data.push({
                id: id.value,
                fields: {
                  "Data Pushed db": true,
                },
              });
            }
          });
          updateRefenceID(data, base)
            .then((res) => {
              //console.log(res);
              _res.status(200).send("success");
            })
            .catch((err) => {
              console.log(err);
              _res.status(500).send("failed To update Airtable");
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

// function getPsinternalDataNotQA(_req, _res) {
//   const shortbase = _req.query.basename;
//   let base;
//   let bNo;
//   switch (shortbase) {
//     case "b1":
//       base = PSInternalFieldForm;
//       bNo = 1;
//       break;
//     case "b2":
//       base = PSInternalFieldForm2;
//       bNo = 2;
//       break;
//     case "b3":
//       base = PSInternalFieldForm3;
//       bNo = 3;
//       break;
//     case "b4":
//       base = PSInternalFieldForm4;
//       bNo = 4;
//       break;
//     case "b5":
//       base = PSInternalFieldForm5;
//       bNo = 5;
//       break;
//     case "b6":
//       base = PSInternalFieldForm6;
//       bNo = 6;
//       break;
//     case "b7":
//       base = PSInternalFieldForm7;
//       bNo = 7;
//       break;
//     case "b8":
//       base = PSInternalFieldForm8;
//       bNo = 8;
//       break;
//     case "b9":
//       base = PSInternalFieldForm9;
//       bNo = 9;
//       break;
//     default:
//       _res.status(400).send("Base NOT Found");
//       break;
//   }
//   let insertPromises = [];
//   getPsNotQAData(base)
//     .then((res) => {
//       if (res.length <= 0) {
//         _res.status(200).send("No Data to send");
//       }
//       res.forEach((form) => {
//         let sqlData = {};
//         let parsedData = form.fields;
//         console.log("formid", parsedData["Id"]);
//         for (const key in parsedData) {
//           const k = psInternalFields[key];
//           if (key === "filledBy") {
//             filled = parsedData[key];
//             //console.log("@@", filled);
//           }
//           const value = parsedData[key];
//           let data = processValue(value);

//           //console.log(data);
//           if (k) {
//             sqlData[k] = data;
//           }
//           sqlData["BaseNo"] = bNo;
//         }
//         console.log("Sql Data", JSON.stringify(sqlData), bNo);
//         let query = `INSERT INTO Corona_QADone_Data SET ?`;
//         insertPromises.push(
//           runApprovedQueryWithTehsil(query, [sqlData], form.id, bNo)
//         );
//       });
//     })
//     .catch((err) => {
//       console.log(err);
//       console.log(err);
//       _res.send(err);
//     });
// }

module.exports = {
  psInternalFieldData,
  getInternalFieldDataQA,
};
