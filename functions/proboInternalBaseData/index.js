const cloudsql = require("../utils/cloudSql");
const { getFormData, getAllFields, processValue } = require("../utils/commonFunctions");
const { checkProboDataQaStatus, updateProboDataAirtable, checkProboDataPreviousData, sendAirtable } = require("./proboAirtableFunction");
const { updateProboDataSql, updateProboAirtableIdSql, updateDataIntoDb, insertProboDataCheckDuplicate } = require("./proboSqlFunctions");


function proboInternalData(_req, _res) {
    try {
        getFormData(_req.body.form.formId.toString())
            .then((formData) => {
                let hasOrders = formData.sectionFields.length !== 0 ? true : false;
                getAllFields(formData, hasOrders)
                    .then(({ fields, orders }) => {
                        fields["FormId"] = _req.body.form.formId.toString();
                        fields["Filled Time"] = formData.form.createdTime;
                        fields["Modified By"] = formData.form.modifiedByName;
                        fields["Modified Time"] = formData.form.modifiedTime;
                        fields["Filled By"] = formData.form.filledByName;
                        let employees = _req.body.employees;
                        //console.log(employees);
                        insertDataIntoDb(fields, employees)
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
                        console.log("FAILED TO MAP FIELD", err);
                        _res.status(500).send("failed");
                    });
            })
            .catch((err) => {
                console.log("FAILED TO GET DATA FROM API ", new Error(err));
                _res.status(500).send("failed");
            });
    } catch (err) {
        console.error("DB_SQL_INSERT_FAILED", new Error(err));
        _res.send(err).status(500);
    }
}

function insertDataIntoDb(fields, employees) {
    return new Promise((resp, rej) => {
        try {
            const FormId = fields["FormId"];
            const contact_number = fields["5. Met Person Mobile Number (जो व्यक्ति मिला उसका मोबाइल नंबर)"];
            console.log(FormId, contact_number);
            cloudsql.query(
                `SELECT * FROM proboData WHERE FormId=${FormId};`,
                (err, result) => {
                    if (err) {
                        console.log(err);
                        rej(err);
                    }
                    if (result.length > 0) {
                        if (result[0].airtableId) {
                            checkProboDataQaStatus(
                                result[0].airtableId,
                                result[0].airtableBaseNo
                            )
                                .then((recId) => {
                                    updateProboDataSql(fields)
                                        .then(() => {
                                            updateProboDataAirtable(
                                                FormId,
                                                result[0].airtableId,
                                                result[0].airtableBaseNo
                                            )
                                                .then((id) => {
                                                    console.info("Probo_DATA_UPDATED");
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
                                                "FAILD TO UPDATE DATA IN DB",
                                                new Error(err)
                                            );
                                            rej(err);
                                        });
                                })
                                .catch((err) => {
                                    console.log("NOT UPDATED AS QA APPROVED");
                                    rej(FormId);
                                });
                        } else {
                            checkProboDataPreviousData(FormId, result[0].airtableBaseNo)
                                .then((recId) => {
                                    console.log("iddddd", recId);
                                    if (recId != 0) {
                                        checkProboDataQaStatus(recId, result[0].airtableBaseNo)
                                            .then(() => {
                                                updateProboDataAirtable(
                                                    FormId,
                                                    recId,
                                                    result[0].airtableBaseNo
                                                )
                                                    .then(() => {
                                                        updateProboAirtableIdSql(FormId, recId)
                                                            .then((id) => {
                                                                console.info("Probo_AIRTABLEID_UPDATED");
                                                                resp(id);
                                                            })
                                                            .catch((err) => {
                                                                console.log(
                                                                    "Probo_UPDATE_ERROR",
                                                                    new Error(err)
                                                                );
                                                                rej(err);
                                                            });
                                                    })
                                                    .catch((err) => {
                                                        console.log(
                                                            "Probo_UPDATE_ERROR",
                                                            new Error(err)
                                                        );
                                                        rej(err);
                                                    });
                                            })
                                            .catch((err) => {
                                                console.log("Probo_QA_ERROR", new Error(err));
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
                        insertProboDataCheckDuplicate(
                            FormId,
                            fields,
                            contact_number,
                            airtableBaseNo
                        )
                            .then(([is_duplicate, msg_send]) => {
                                console.log(is_duplicate, msg_send);
                                sendAirtable(fields, is_duplicate, airtableBaseNo)
                                    .then((recId) => {
                                        //console.log("insert ho gya hai",JSON.stringify(fields));
                                        updateDataIntoDb(
                                            FormId,
                                            fields,
                                            contact_number,
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
                                console.log("insertion", err);
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

module.exports = {
    proboInternalData
} 