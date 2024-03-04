const cloudsql = require("../utils/cloudSql");
const {
    getFormData, getAllFields,
} = require("../utils/commonFunctions");

const { checkUnacademyDataQaStatus, updateUnacademyAirtable, checkUnacademyPreviousData, sendAirtable } = require("./utils/unacademyAirtable");
const { updateIntoUnacademyDB, updateAirtableIdIntoDB, insertDataCheckDuplicate, updateDataIntoDb } = require("./utils/unacademySql");


function unacademyData(_req, _res) {
    try {
        getFormData(_req.body.form.formId.toString())
            .then((formData) => {
                let hasOrders = formData.sectionFields.length !== 0 ? true : false;
                getAllFields(formData, hasOrders)
                    .then(({ fields, orders }) => {
                        console.log(orders);
                        fields["FormId"] = _req.body.form.formId.toString();
                        fields["Filled Time"] = _req.body.form.createdTime;
                        fields["Modified By"] = _req.body.form.modifiedByName;
                        fields["Modified Time"] = _req.body.form.modifiedTime;
                        fields["Filled By"] = _req.body.form.filledByName;
                        let name = []
                        let number = []
                        orders.forEach((res) => {
                            name.push(res["Reference Name (नाम)"])
                            number.push(res["Reference Number (नंबर)"])
                        });
                        fields["Reference Name (नाम)"] = name.toString()
                        fields["Reference Number (नंबर)"] = number.toString()
                        fields["Extra Photos"] = orders
                        let employees = _req.body.employees;
                        insertDataIntoDB(fields, employees)
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
                        console.log("failed to map fields", err);
                        _res.status(500).send("failed");
                    });
            })
            .catch((err) => {
                console.log("failed get data from api ", new Error(err));
                _res.status(500).send("failed");
            });
    } catch (err) {
        console.error("UNACADEMY_DB_SQLINSERT_FAILED", new Error(err));
        _res.send(err).status(500);
    }
}

function insertDataIntoDB(fields, employees) {
    return new Promise((resp, rej) => {
        try {
            const FormId = fields["FormId"];
            const state = fields["22. State Name (राज्य का नाम)"];
            const mobile_number = fields["2. Student Mobile Number (छात्र का मोबाइल नंबर)"];
            cloudsql.query(
                `SELECT * FROM unacademy_data WHERE FormId=${FormId};`,
                (err, result) => {
                    if (err) {
                        console.log(err);
                        rej(err);
                    }
                    if (result.length > 0) {
                        if (result[0].airtableId) {
                            checkUnacademyDataQaStatus(
                                result[0].airtableId,
                                result[0].airtableBaseNo
                            )
                                .then((recId) => {
                                    updateIntoUnacademyDB(fields, mobile_number, state)
                                        .then(() => {
                                            updateUnacademyAirtable(
                                                FormId,
                                                result[0].airtableId,
                                                result[0].airtableBaseNo
                                            )
                                                .then((id) => {
                                                    console.info("UNACADEMY_DATA_UPDATED");
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
                                                "Failed to update data in db",
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
                            checkUnacademyPreviousData(FormId, result[0].airtableBaseNo)
                                .then((recId) => {
                                    if (recId != 0) {
                                        checkUnacademyDataQaStatus(recId, result[0].airtableBaseNo)
                                            .then(() => {
                                                updateUnacademyAirtable(
                                                    FormId,
                                                    recId,
                                                    result[0].airtableBaseNo
                                                )
                                                    .then(() => {
                                                        updateAirtableIdIntoDB(FormId, recId)
                                                            .then((id) => {
                                                                console.info("UNACADEMY_DATA_AIRTABLEID_UPDATED");
                                                                resp(id);
                                                            })
                                                            .catch((err) => {
                                                                console.log(
                                                                    "UNACADEMY_DATA_UPDATE_ERROR",
                                                                    new Error(err)
                                                                );
                                                                rej(err);
                                                            });
                                                    })
                                                    .catch((err) => {
                                                        console.log(
                                                            "UNACADEMY_DATA_UPDATE_ERROR",
                                                            new Error(err)
                                                        );
                                                        rej(err);
                                                    });
                                            })
                                            .catch((err) => {
                                                console.log("UNACADEMY_DATA_QA_ERROR", new Error(err));
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
                        insertDataCheckDuplicate(
                            FormId,
                            fields,
                            mobile_number,
                            state,
                            airtableBaseNo
                        )
                            .then(([is_duplicate, msg_send]) => {
                                console.log(is_duplicate, msg_send);
                                sendAirtable(fields, is_duplicate, employees, airtableBaseNo)
                                    .then((recId) => {
                                        //  console.log("insert ho gya hai", JSON.stringify(fields), recId);
                                        updateDataIntoDb(
                                            FormId,
                                            recId
                                        )
                                            .then((upateres) => {
                                                console.log("INSERTED IN AIRTABLE", upateres);
                                                resp();
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
    unacademyData,

};
