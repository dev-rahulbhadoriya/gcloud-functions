const sleep = require("atomic-sleep");
const { proboDataInternalBases, misscallbase } = require("./airtableBases")

const { getProboDataSql } = require("./proboSqlFunctions");

function insertToProboDataAirtable(formId, airtableBaseNo) {
    return new Promise((resp, rej) => {
        getProboDataSql(formId)
            .then((result) => {
                console.log(
                    "INSERT",
                    JSON.stringify([{ fields: JSON.parse(result[0].data) }])
                );
                // sleep(1000);
                let base = proboDataInternalBases[airtableBaseNo];
                let table = base("Probo Field Data");
                table.create(
                    [{ fields: JSON.parse(result[0].data) }],
                    { typecast: true },
                    function (err, records) {
                        if (err) {
                            console.error(new Error(err));
                            rej(err);
                        }
                        records.forEach(function (record) {
                            resp(record.getId());
                        });
                    }
                );
            })
            .catch((err) => {
                console.error(new Error(err));
                rej(err);
            });
    });
}

//Updating data in airtable
function updateProboDataAirtable(formId, recordId, status) {
    return new Promise((resp, rej) => {
        getProboDataSql(formId)
            .then((result) => {
                console.log(
                    "UPDATE",
                    JSON.stringify([{ fields: JSON.parse(result[0].data) }])
                );
                sleep(1000);
                let base = proboDataInternalBases[status];
                let table = base("Probo Field Data");
                table.update(
                    [
                        {
                            id: recordId,
                            fields: JSON.parse(result[0].data),
                        },
                    ],
                    { typecast: true },
                    function (err, records) {
                        if (err) {
                            console.error(new Error(err));
                            rej(err);
                        }
                        records.forEach(function (record) {
                            resp(record.getId());
                        });
                    }
                );
            })
            .catch((err) => {
                console.error(new Error(err));
                rej(err);
            });
    });
}

//checking previous base
function checkProboDataPreviousData(formId, status) {
    console.log("checkProboDataPreviousDATA", formId, status);
    return new Promise((resp, rej) => {
        let base = proboDataInternalBases[status];
        console.log("base", base);
        let table = base("Probo Field Data");
        table
            .select({
                fields: ["FormId"],
                filterByFormula: `{FormId}=${formId}`,
            })
            .eachPage(
                function page(records, fetchNextPage) {
                    var recid = 0;
                    if (records.length) {
                        resp(records[0].id);
                    } else {
                        resp(recid);
                    }
                },
                function done(err) {
                    if (err) {
                        console.error(err);
                        return;
                    }
                }
            );
    });
}

function checkProboDataQaStatus(recId, status) {
    //  console.log("base status", recId, status);
    return new Promise((resp, rej) => {
        sleep(1000);
        let base = proboDataInternalBases[status];
        let table = base("Probo Field Data");
        table.find(recId, function (err, record) {
            if (err) {
                console.error(err);
                return;
            }
            if (record.get("QA Status-2") !== "QA Approved") {
                resp();
            } else {
                rej();
            }
        });
    });
}


function sendAirtable(fields, is_duplicate, airtableBaseNo) {
    return new Promise((resp, rej) => {
        try {
            let base = proboDataInternalBases[airtableBaseNo];
            let table;
            if (is_duplicate) {
                table = base("Duplicate Data");

            } else {
                table = base("Probo Field Data");

            }
            table.create(
                [{ fields }],
                { typecast: true },
                function (err, records) {
                    if (err) {
                        //  console.log("@@", err);
                        console.error(new Error(err));
                        rej(err);
                    }
                    if (records && records.length) {
                        resp(records[0].getId());
                    } else {
                        resp();
                    }
                }
            );
        } catch (err) {
            rej(err);
        }
    });
}


module.exports = {
    sendAirtable,
    insertToProboDataAirtable,
    updateProboDataAirtable,
    checkProboDataPreviousData,
    checkProboDataQaStatus,

};