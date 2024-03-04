const { updateDataOrderFormTaskAirtable, checkOrderFormTaskPreviousData, insertToOrderFormTaskAirtable } = require("./utils/order_formAirtableFunction");
const { updateOrderFormTaskUpdate, updateOrderFormTaskUpdateAirtableId, insertOrderFormTaskUpdate } = require("./utils/order_formSQlFunctions");
const cloudsql = require("../utils/cloudSql");
const { getFormData, getAllFields } = require("../utils/commonFunctions");

//Order Taking Task Status Update Form data
function orderTakingTaskStatusform(_request, _response) {
    try {
      getFormData(_request.body.form.formId.toString())
        .then((formData) => {
          getAllFields(formData)
            .then((fields) => {
              fields.fields["formId"] = formData.form.formId.toString();
              fields.fields["Filled Date Time"] = formData.form.createdTime;
              fields.fields["Filled By"] = formData.form.filledByName;
              fields.fields["Modified By"] = formData.form.modifiedByName;
              fields.fields["Modified Time"] = formData.form.modifiedTime;
              cloudsql.query(
                `SELECT * FROM order_taking_task_status_form WHERE formId=${fields.fields.formId};`,
                (err, result) => {
                  if (err) {
                    _response.send(err).status(500);
                  }
                  if (result.length > 0) {
                    if (result[0].airtableId) {
                      updateOrderFormTaskUpdate(fields.fields)
                        .then(() => {
                          updateDataOrderFormTaskAirtable(
                            fields.fields.formId,
                            result[0].airtableId
                          ).then(() => {
                            console.info("ORDER_TAKING_TASK_STATUS_FORM_UPDATED");
                            _response.send("success").status(200);
                          });
                        })
                        .catch((err) => {
                          console.error(
                            "ORDER_TAKING_TASK_STATUS_FORM_ERROR",
                            new Error(err)
                          );
                          _response.send(err).status(500);
                        });
                    } else {
                      checkOrderFormTaskPreviousData(fields.fields.formId)
                        .then((recId) => {
                          if (recId == 0) {
                            console.log("Id Not Found In Base", fields.fields.formId);
                            _response.send("Not Found").status(500);
                          } else {
                            updateDataOrderFormTaskAirtable(
                              fields.fields.formId,
                              recId
                            )
                              .then(() => {
                                updateOrderFormTaskUpdateAirtableId(fields.fields.formId, recId)
                                  .then(() => {
                                    console.info("ORDER_TAKING_TASK_STATUS_FORM_INSERTED");
                                    _response.send("success").status(200);
                                  })
                                  .catch((err) => {
                                    console.log(
                                      "ORDER_TAKING_TASK_STATUS_FORM_ERROR",
                                      new Error(err)
                                    );
                                    _response.send(err).status(500);
                                  });
                              })
                              .catch((err) => {
                                console.log(
                                  "ORDER_TAKING_TASK_STATUS_FORM_ERROR",
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
                    insertOrderFormTaskUpdate(fields.fields)
                      .then(() => {
                        insertToOrderFormTaskAirtable(fields.fields.formId)
                          .then((recordId) => {
                            updateOrderFormTaskUpdateAirtableId(fields.fields.formId, recordId)
                              .then(() => {
                                console.info(
                                  "ORDER_TAKING_TASK_STATUS_FORM_IN_AIRTABLE_UPDATED"
                                );
                                _response.send("success").status(200);
                              })
                              .catch((err) => {
                                console.log(
                                  "ORDER_TAKING_TASK_STATUS_FORM_IN_AIRTABLE_UPDATE_ERROR",
                                  new Error(err)
                                );
                                _response.send(err).status(500);
                              });
                          })
                          .catch((err) => {
                            console.log(
                              "ORDER_TAKING_TASK_STATUS_FORM_INSERT_AIRTABLE_ERROR",
                              new Error(err)
                            );
                            _response.send(err).status(500);
                          });
                      })
                      .catch((err) => {
                        console.log(
                          "ORDER_TAKING_TASK_STATUS_FORMINSERT_ERROR",
                          new Error(err)
                        );
                        _response.send(err).status(500);
                      });
                  }
                }
              );
            })
            .catch((err) => {
              console.log("ORDER_TAKING_TASK_STATUS_FORM_GET_FIELDS_ERROR", new Error(err));
              _response.send(err).status(500);
            });
        })
        .catch((err) => {
          console.log("ORDER_TAKING_TASK_STATUS_FORM_DATA_ERROR", new Error(err));
          _response.send(err).status(500);
        });
    } catch (err) {
      console.error("ORDER_TAKING_TASK_STATUS_FORM_SQLINSERT_FAILED", new Error(err));
      _response.send(err).status(500);
    }
  }
  
module.exports ={
  orderTakingTaskStatusform
}