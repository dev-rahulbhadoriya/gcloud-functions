const cloudsql = require("../utils/cloudSql");
const { getFormData, getAllFields } = require("./wealthyCommonFiles");
const {
    insertWealthyDataSql,
    updateWealthyDataSql,
    updateWealthyDataIdSql
      } = require("./wealthySqlFunctions");
const {
    insertToWealthyDataAirtable,
    updateWealthyDataAirtable,
    checkWealthyDataPreviousData,
    checkWealthyDataQaStatus
} = require("./wealthyAirtableFunctions");
function wealthyData(_request, _response) {
    try {
        getFormData(_request.body.form.formId.toString())
            .then((formData) => {
                // console.log("FormData ----------------->>>>", formData);
                let hasOrders = formData.sectionFields.length !== 0 ? true : false;
                // console.log("hasOrders outside the block", hasOrders);
                getAllFields(formData,hasOrders)
                    .then(({fields,orders}) => {
                        fields["FormId"] = formData.form.formId;
                        fields["Filled Date"] = formData.form.createdTime;
                        fields["Filled By"] = formData.form.filledByName;
                        fields["Modified By"] = formData.form.modifiedByName;
                        fields["Modified Date"] = formData.form.modifiedTime;
                        fields["Extra Photo"] = orders;

                        // console.log("Fields-------------->>>>>", fields);
                        cloudsql.query(
                            `SELECT * FROM wealthyData WHERE FormId=${fields.FormId};`,
                            (err, result) => {
                                // console.log("result blue star ======",result.length);
                                if (err) {
                                    _response.send(err).status(500);
                                }
                                if (result.length > 0) {
                                    //if airtable id is not found
                                    //current base
                                    //update airtableId and
                                    if (result[0].airtableId) {
                                        checkWealthyDataQaStatus(
                                            result[0].airtableId,
                                            result[0].basechange
                                        )
                                            .then(() => {
                                                updateWealthyDataSql(fields)
                                                    .then(() => {
                                                        updateWealthyDataAirtable(
                                                            fields.FormId,
                                                            result[0].airtableId,
                                                            result[0].basechange
                                                        ).then(() => {
                                                            console.info("Wealthy_DATA_UPDATED");
                                                            _response.status(200).end();
                                                        });
                                                    })
                                                    .catch((err) => {
                                                        console.error(
                                                            "Wealthy_DATA_UPDATE_ERROR",
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
                                        checkWealthyDataPreviousData(
                                            fields.FormId,
                                            result[0].basechange
                                        )
                                            .then((recId) => {
                                                if (recId == 0) {
                                                    console.log(
                                                        "Id Not Found In Base",
                                                        fields.FormId
                                                    );
                                                    _response.status(500).end();
                                                } else {
                                                    checkWealthyDataQaStatus(recId, result[0].basechange)
                                                        .then(() => {
                                                            console.log(
                                                                "QA status check",
                                                                result[0].basechange
                                                            );
                                                            updateWealthyDataAirtable(
                                                                fields.FormId,
                                                                recId,
                                                                result[0].basechange
                                                            )
                                                                .then(() => {
                                                                    updateWealthyDataIdSql(
                                                                        fields.FormId,
                                                                        recId
                                                                    )
                                                                        .then(() => {
                                                                            // console.info(" @@ Wealthy_DATA_INSERTED");
                                                                            _response
                                                                                .send("success")
                                                                                .status(200)
                                                                                .end();
                                                                        })
                                                                        .catch((err) => {
                                                                            console.log(
                                                                                "Wealthy_DATA_UPDATE_ERROR",
                                                                                new Error(err)
                                                                            );
                                                                            _response.send(err).end();
                                                                        });
                                                                })
                                                                .catch((err) => {
                                                                    console.log(
                                                                        "Wealthy_UPDATE_ERROR",
                                                                        new Error(err)
                                                                    );
                                                                    _response.send(err).end();
                                                                });
                                                        })
                                                        .catch((err) => {
                                                            console.log(
                                                                "Wealthy_DATA_QA_ERROR",
                                                                new Error(err)
                                                            );
                                                            _response.send(err).end();
                                                        });
                                                }
                                            })
                                            .catch((err) => {
                                                console.log(
                                                    "Wealthy_DATA_QA_ERROR",
                                                    new Error(err)
                                                );
                                                _response.send(err).end();
                                            });
                                    }
                                } else {
                                    const basechange = 1;
                                    insertWealthyDataSql(fields, basechange)
                                        .then(() => {
                                            insertToWealthyDataAirtable(
                                                fields.FormId,
                                                basechange
                                            )
                                            .then((recordId) => {
                                                    updateWealthyDataIdSql(
                                                        fields.FormId,
                                                        recordId
                                                    )
                                                        .then(() => {
                                                            console.log("Wealthy_INSERTED BASE");
                                                            _response.status(200).end();
                                                        })
                                                        .catch((err) => {
                                                            console.log(
                                                                "Wealthy_DATA_UPDATE_ERROR",
                                                                new Error(err)
                                                            );
                                                            _response.send(err).end();
                                                        });
                                                })
                                                .catch((err) => {
                                                    console.log(
                                                        "Wealthy_DATA_INSERT_ERROR",
                                                        new Error(err)
                                                    );
                                                    _response.send(err).end();
                                                });
                                            // }
                                        })
                                        .catch((err) => {
                                            console.log("WEALTHY_DATA_INSERT_ERROR", new Error(err));
                                            _response.send(err).end();
                                        });
                                }
                            }
                        );
                    })
                    .catch((err) => {
                        console.log("WEALTHY_GET_FIELDS_ERROR", new Error(err));
                        _response.send(err).end();
                    });
            })
            .catch((err) => {
                console.log("WEALTHY_GET_DATA_ERROR", new Error(err));
                _response.send(err).end();
            });
    } catch (err) {
        console.error("WEALTHY_SQLINSERT_FAILED", new Error(err));
        _response.send(err).end();
    }
}

module.exports = {
    wealthyData
}