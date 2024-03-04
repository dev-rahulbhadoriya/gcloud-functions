const cloudsql = require("../utils/cloudSql");
const { getFormData, getAllFields } = require("../utils/commonFunctions");
const {
  insertToAttendanceDataAirtable,
  updateAttendanceDataAirtable,
  checkAttendanceDataPreviousData,
  checkAttendanceDataQaStatus,
} = require("./attendanceAirtableFunctions");
const {
  insertAttendanceDataSql,
  updateAttendanceDataSql,
  updateAttendanceDataIdSql,
} = require("./attendanceSqlFunctions");
function attendanceData(_request, _response) {
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
            fields["Modified Date"] = formData.form.modifiedTime;
            // fields["42. Extra Photo"] = orders;

            // console.log("Fields-------------->>>>>", fields);
            cloudsql.query(
              `SELECT * FROM attendance_data WHERE FormId=${fields.FormId};`,
              (err, result) => {
                console.log("result attendance_data ======", result.length);
                if (err) {
                  _response.send(err).status(500);
                }
                if (result.length > 0) {
                  //if airtable id is not found
                  //current base
                  //update airtableId and
                  if (result[0].airtableId) {
                    checkAttendanceDataQaStatus(
                      result[0].airtableId,
                      result[0].basechange
                    )
                      .then(() => {
                        updateAttendanceDataSql(fields)
                          .then(() => {
                            updateAttendanceDataAirtable(
                              fields.FormId,
                              result[0].airtableId,
                              result[0].basechange
                            ).then(() => {
                              console.info("Attendance_DATA_UPDATED");
                              _response.status(200).end();
                            });
                          })
                          .catch((err) => {
                            console.error(
                              "Attendance_DATA_UPDATE_ERROR",
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
                    checkAttendanceDataPreviousData(
                      fields.FormId,
                      result[0].basechange
                    )
                      .then((recId) => {
                        if (recId == 0) {
                          console.log("Id Not Found In Base", fields.FormId);
                          _response.status(500).end();
                        } else {
                          checkAttendanceDataQaStatus(
                            recId,
                            result[0].basechange
                          )
                            .then(() => {
                              console.log(
                                "QA status check",
                                result[0].basechange
                              );
                              updateAttendanceDataAirtable(
                                fields.FormId,
                                recId,
                                result[0].basechange
                              )
                                .then(() => {
                                  updateAttendanceDataIdSql(
                                    fields.FormId,
                                    recId
                                  )
                                    .then(() => {
                                      // console.info(" @@ Attendance_DATA_INSERTED");
                                      _response
                                        .send("success")
                                        .status(200)
                                        .end();
                                    })
                                    .catch((err) => {
                                      console.log(
                                        "Attendance_DATA_UPDATE_ERROR",
                                        new Error(err)
                                      );
                                      _response.send(err).end();
                                    });
                                })
                                .catch((err) => {
                                  console.log(
                                    "Attendance_DATA_UPDATE_ERROR",
                                    new Error(err)
                                  );
                                  _response.send(err).end();
                                });
                            })
                            .catch((err) => {
                              console.log(
                                "Attendance_DATA_QA_ERROR",
                                new Error(err)
                              );
                              _response.send(err).end();
                            });
                        }
                      })
                      .catch((err) => {
                        console.log("Attendance_DATA_QA_ERROR", new Error(err));
                        _response.send(err).end();
                      });
                  }
                } else {
                  const basechange = 1;
                  insertAttendanceDataSql(fields, basechange)
                    .then(() => {
                      insertToAttendanceDataAirtable(fields.FormId, basechange)
                        .then((recordId) => {
                          updateAttendanceDataIdSql(fields.FormId, recordId)
                            .then(() => {
                              console.log("Attendance_INSERTED BASE");
                              _response.status(200).end();
                            })
                            .catch((err) => {
                              console.log(
                                "Attendance_DATA_UPDATE_ERROR",
                                new Error(err)
                              );
                              _response.send(err).end();
                            });
                        })
                        .catch((err) => {
                          console.log(
                            "Attendance_DATA_INSERT_ERROR",
                            new Error(err)
                          );
                          _response.send(err).end();
                        });
                      // }
                    })
                    .catch((err) => {
                      console.log(
                        "Attendance_DATA_INSERT_ERROR",
                        new Error(err)
                      );
                      _response.send(err).end();
                    });
                }
              }
            );
          })
          .catch((err) => {
            console.log("Attendance_GET_FIELDS_ERROR", new Error(err));
            _response.send(err).end();
          });
      })
      .catch((err) => {
        console.log("Attendance_GET_DATA_ERROR", new Error(err));
        _response.send(err).end();
      });
  } catch (err) {
    console.error("Attendance_SQLINSERT_FAILED", new Error(err));
    _response.send(err).end();
  }
}

module.exports = {
  attendanceData,
};
