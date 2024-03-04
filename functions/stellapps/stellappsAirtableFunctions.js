const sleep = require("atomic-sleep");
const {stellappsInternalBases} = require("./airtableBases")
const {getStellappsDataSql} = require("./stellappsSqlFunctions")

const insertStellappsDataAirtable = (formId, airtableBaseNo) => {
    return new Promise((resp, rej) => {
        getStellappsDataSql(formId)
            .then((result) => {
                console.log(
                    "INSERT",
                    JSON.stringify([{ fields: JSON.parse(result[0].data) }])
                );
                // sleep(1000);
                let base = stellappsInternalBases[airtableBaseNo];
                let table = base("Field Data");
                table.create(
                    [{ fields: JSON.parse(result[0].data) }],
                    { typecast: true },
                    function (err, records) {
                        if (err) {
                            console.log("errors and records", err, records);
                            console.error(new Error(err));
                            rej(err);
                        }
                        console.log("records------------->>>>", records);
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
const updateStellappsDataAirtable = (formId, recordId, status) => {
    return new Promise((resp, rej) => {
        getStellappsDataSql(formId)
            .then((result) => {
                console.log(
                    "UPDATE",
                    JSON.stringify([{ fields: JSON.parse(result[0].data) }])
                );
                sleep(1000);
                let base = stellappsInternalBases[status];
                let table = base("Field Data");
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

const checkStellappsDataPreviousData = (formId, status) => {
    console.log("checkStellappsDataPreviousData", formId, status);
    return new Promise((resp, rej) => {
        let base = stellappsInternalBases[status];
        console.log("base", base);
        let table = base("Field Data");
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

const checkStellappsDataQaStatus = (recId, status) => {
    //  console.log("base status", recId, status);
    return new Promise((resp, rej) => {
        sleep(1000);
        let base = stellappsInternalBases[status];
        let table = base("Field Data");
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

const sendAirtable = (fields, is_duplicate, airtableBaseNo) => {
    return new Promise((resp, rej) => {
        try {
            let base = stellappsInternalBases[airtableBaseNo];
            let table;
            if (is_duplicate) {
                table = base("Duplicate Data");

            } else {
                table = base("Field Data");
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
    insertStellappsDataAirtable,
    updateStellappsDataAirtable,
    checkStellappsDataPreviousData,
    checkStellappsDataQaStatus,
    sendAirtable
}