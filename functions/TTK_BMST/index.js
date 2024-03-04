const { getFormData, getAllFields } = require("./ttk_commonFile");
const cloudsql = require("../utils/cloudSql");
const { checkBMSTDataQaStatus, updateBMSTDataAirtable, checkBMSTPreviousData, insertToBMSTDataAirtable } = require("./bmst_airtableFunctions");

const { updateBMSTDataSql, insertBMSTDataSql, updateBMSTDataIdSql } = require("./bmst_sqlFunctions");
function ttkBmstInternalData(_request, _response) {
    try {
        getFormData(_request.body.form.formId.toString()).then((formData) => {
            let hasOrders = formData.sectionFields.length !== 0 ? true : false;
            getAllFields(formData, hasOrders)
                .then(({ fields, orders }) => {
                    fields["FormId"] = _request.body.form.formId.toString();
                    fields["Filled Time"] = _request.body.form.createdTime;
                    fields["Modified By"] = _request.body.form.modifiedByName;
                    fields["Modified Time"] = _request.body.form.modifiedTime;
                    fields["Filled By"] = _request.body.form.filledByName;
                    fields["Extra Photo"] = orders
                    cloudsql.query(
                        `SELECT * From ttk_BMST WHERE FormId=${fields.FormId};`,
                        (err, result) => {
                            if (err) {
                                _response.send(err).status(500);
                            }
                            if (result.length > 0) {
                                if (result[0].airtableId) {
                                    checkBMSTDataQaStatus(
                                        result[0].airtableId,
                                        result[0].basechange
                                    )
                                        .then(() => {
                                            updateBMSTDataSql(fields)
                                                .then(() => {
                                                    updateBMSTDataAirtable(
                                                        fields.FormId,
                                                        result[0].airtableId,
                                                        result[0].basechange
                                                    ).then(() => {
                                                        console.info("BMST Data Updated");
                                                        _response.status(200).end();
                                                    });
                                                })
                                                .catch((err) => {
                                                    console.error(
                                                        "BMST_UPDATE_ERROR",
                                                        new Error(err)
                                                    );
                                                    _response.status(500).end();
                                                });

                                        })
                                        .catch(() => {
                                            console.log("NOT UPDATED AS QA APPROVED",
                                                fields.FormId
                                            );
                                            _response.status(500).end();
                                        });
                                } else {
                                    checkBMSTPreviousData(
                                        fields.FormId,
                                        result[0].basechange
                                    )

                                        .then((recId) => {
                                            if (recId == 0) {
                                                console.log("Id Not Found In Base",
                                                    fields.FormId
                                                );
                                                _response.status(500).end();
                                            } else {
                                                checkBMSTDataQaStatus(recId, result[0].basechange)
                                                    .then(() => {
                                                        console.log(
                                                            "QA status check",
                                                            result[0].basechange
                                                        );
                                                        updateBMSTDataAirtable(
                                                            fields.FormId,
                                                            recId,
                                                            result[0].basechange
                                                        )
                                                            .then(() => {
                                                                updateBMSTDataIdSql(
                                                                    fields.FormId,
                                                                    recId
                                                                )
                                                                    .then(() => {
                                                                        _response
                                                                            .send("success")
                                                                            .status(200)
                                                                            .end();
                                                                    })
                                                                    .catch((err) => {
                                                                        console.log(
                                                                            "BMST_DATA_UPDATE_ERROR",
                                                                            new Error(err)
                                                                        );
                                                                        _response.send(err).end();
                                                                    });
                                                            })
                                                            .catch((err) => {
                                                                console.log(
                                                                    "BMST_DATA_UPDATGE_ERROR",
                                                                    new Error(err)
                                                                );
                                                                _response.send(err).end();
                                                            });
                                                    })
                                                    .catch((err) => {
                                                        console.log(
                                                            "BMST_DATA_QA_ERROR",
                                                            new Error(err)
                                                        );
                                                        _response.send(err).end();
                                                    });
                                            }
                                        })
                                        .catch((err) => {
                                            console.log(
                                                "BMST_DATA_QA_ERROR",
                                                new Error(err)

                                            );
                                            _response.send(err).end();
                                        });
                                }
                            } else {
                                const basechange = 1;
                                insertBMSTDataSql(fields, basechange)
                                    .then(() => {

                                        insertToBMSTDataAirtable(fields.FormId,
                                            basechange
                                        )
                                            .then((recordId) => {
                                                console.log("@@@@@", recordId);
                                                updateBMSTDataIdSql(
                                                    fields.FormId,
                                                    recordId
                                                )
                                                    .then(() => {
                                                        console.log("BMST_INSERTED_BASE");
                                                        _response.status(200).end();
                                                    })
                                                    .catch((err) => {
                                                        console.log(
                                                            "BMST_UPDATE_ERROR",
                                                            new Error(err)
                                                        );
                                                        _response.send(err).end();
                                                    });
                                            })
                                            .catch((err) => {
                                                console.log(
                                                    "BMST_DATA_INSERT ERROR",
                                                    new Error(err)
                                                );
                                            });

                                    })
                                    .catch((err) => {
                                        console.log("RERAK_DATA_INSERT_ERROR", new Error(err));
                                        _response.send(err).end();

                                    });
                            }
                        }
                    );
                }).catch((err) => {
                    console.log("BMST_GET_FIELDS_ERROR", new Error(err));
                    _response.send(err).end();
                });
        }).catch((err) => {
            console.log("BMST_GET_DATA_ERROR_FROM_API", new Error(err));
            _response.send(err).end();
        });
    } catch (err) {
        console.error("BMST_SQL_INSERT_FAILED", new Error(err));
        _response.send(err).end();
    }
}



module.exports = {
    ttkBmstInternalData
}