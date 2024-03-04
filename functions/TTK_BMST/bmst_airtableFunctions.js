const sleep = require("atomic-sleep");
const {bmstDataInternalBase1,bmstDataInternalBases} = require("./airtableBases");
const {getBMSTDataSql} = require("./bmst_sqlFunctions");

function insertToBMSTDataAirtable(formId, status) {
    return new Promise((resp, rej) => {
        getBMSTDataSql(formId)
            .then((result) => {
                console.log(
                    "INSERT",
                    JSON.stringify([{ fields: JSON.parse(result[0].data) }])
                );
                // sleep(1000);
                let base = bmstDataInternalBases[status];
                let table = base("Internal Data");
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
function updateBMSTDataAirtable(formId, recordId, status){
    return new Promise((resp, rej) => {
        getBMSTDataSql(formId)
            .then((result) => {
                console.log(
                    "UPDATE",
                    JSON.stringify([{ fields: JSON.parse(result[0].data) }])
                );
                sleep(1000);
                let base = bmstDataInternalBases[status];
                let table = base("Internal Data");
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
function checkBMSTPreviousData(formId, status) {
    console.log("checkBMSTPreviousData", formId);
    return new Promise((resp, rej) => {
        let base = bmstDataInternalBases[status];
        let table = base("Internal Data");
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

function checkBMSTDataQaStatus(recId, status) {
    // console.log("base status", recid, status);

    return new Promise((resp, rej) => {
        sleep(1000);
        let base = bmstDataInternalBases[status];
        let table = base("Internal Data");
        table.find(recId, function (err, record) {
            if(err) {
                console.error(err);
                return;
            }
            if(record.get("QA Status-2") !== "QA Approved") {
                resp();
            }else {
                rej();
            }
        });
    });
}



module.exports = { 
    checkBMSTDataQaStatus,
    insertToBMSTDataAirtable,
    updateBMSTDataAirtable,
    checkBMSTPreviousData
};