const { getqafields } = require("../backToSchoolFormData/utils/fieldMapping");
const { getAllFields, processValue } = require("../utils/commonFunctions");
const { backToSchoolBase1 } = require("./utils/airtableBase");
const { getDataFromAirtable, updateRefenceIDInBackToSchool, insertToBackToSchoolFieldAirtable } = require("./utils/schoolAirtableFunction");
const { insertDataInDb, insertBackToSchoolData } = require("./utils/schoolSqlFunction");

function backToSchool(_request, _response) {
    try {
        let hasOrders = _request.body.sectionFields.length !== 0 ? true : false;
        getAllFields(_request.body, hasOrders)
            .then(({ fields, orders }) => {
                fields["Id"] = _request.body.form.formId.toString();
                fields["Form ID"] = _request.body.form.formId.toString();
                fields["Filled Time"] = _request.body.form.modifiedTime;
                fields["Filled By"] = _request.body.form.filledByName;
                fields["Modified By"] = _request.body.form.modifiedByName;
                fields["Modified Time"] = _request.body.form.modifiedTime;
                insertBackToSchoolData(fields, orders)
                    .then((duplicate) => {
                        console.log("DUPLICATE", duplicate);
                        console.log("FIELDS", JSON.stringify(fields));
                        if (!duplicate) {
                            insertToBackToSchoolFieldAirtable(fields, orders)
                                .then((rec) => {
                                    console.log("RECORDS", JSON.stringify(rec));
                                    _response.send("success").status(200);
                                })
                                .catch((err) => {
                                    _response.send(JSON.stringify(err)).status(500);
                                });
                        }
                    })
                    .catch((err) => {
                        _response.send(err).status(500);
                    });
            })
            .catch((err) => {
                console.error("GET FIELDS ERROR", new Error(err));
            });
    } catch (err) {
        console.error("SQLINSERT_FAILED", new Error(err));
        _response.send(err).status(500);
    }
}



function backToSchoolQa(_req, _res) {
    const shortbase = _req.query.baseName;
    let base;
    let bNo;
    switch (shortbase) {
        case "b1":
            base = backToSchoolBase1;
            bNo = 1;
            break;
        default:
            _response.status(400).send("Base Not Found");
            break;
    }
    let insertPromises = [];
    let refdata = [];
    getDataFromAirtable(base)
        .then((res) => {
            if (res.length < 0) {
                _res.status(500).send("No Data to send");
            }
            res.forEach((form) => {
                let sqlData = {};
                let parsedData = form.fields;
                for (const key in parsedData) {
                    const k = getqafields[key]
                    const value = parsedData[key];
                    let data = processValue(value);

                    if (k) {
                        sqlData[k] = data;
                    }
                    sqlData["Base_Name"] = bNo;
                }
                console.log("Sql Data", JSON.stringify(sqlData), bNo);
                let query = `INSERT INTO back_to_school SET ?`;
                insertPromises.push(
                    insertDataInDb(query, [sqlData], form.id, bNo)
                );
            });
            Promise.allSettled(insertPromises)
                .then((recIds) => {
                    data = [];
                    recIds.forEach((id) => {
                        //     console.log("ress", id)
                        if (id.value) {
                            // console.log("valueeeeeeeeeeeeeeee value", id.value)
                            data.push({
                                id: id.value,
                                fields: {
                                    "Data Pushed QA": true,
                                },
                            });
                        }
                    });
                    updateRefenceIDInBackToSchool(data, base)
                        .then((res) => {
                            _res.status(200).send("success");
                        })
                        .catch((err) => {
                            console.log("failed to update");
                            _res.status(500).send("failed");
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
    backToSchool,
    backToSchoolQa
}