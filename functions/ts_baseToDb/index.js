const {
    processValue,
} = require("../utils/commonFunctions");
// const { getqafields } = require("./utils/fieldsMapping");
const {qaApprovetsData,updateRefenceIDIntsBase } = require("./utils/airtable");
const {
    qaApprovedDataInsertIntoDb,
} = require("./utils/db");
const {ts_sheet1Base,tsbase} = require("./utils/airtableBases");

// adding qa function
function tsDemoData(_req, _res) {
    const shortbase = _req.query.baseName;
    let base;
    let formId;
    switch (shortbase) {
        case "b1":
            base = ts_sheet1Base;
            break;
        default:
            _res.status(400).send("Base NOT Found");
            break;
    }
    let insertPromises = [];
    qaApprovetsData(base)
        .then((res) => {
            if (res.length < 0) {
                _res.status(500).send("No Data to send");
            }
            res.forEach((form) => {
               let formId = form.fields.Id
                insertPromises.push(
                    qaApprovedDataInsertIntoDb(formId, form.fields, form.id)
                );                     
            });
            Promise.allSettled(insertPromises)
                .then((recIds) => {
                    // console.log("recccccc", recIds)
                    data = [];
                    recIds.forEach((id) => {
                        if (id.value) {
                            data.push({
                                id: id.value,
                                fields: {
                                    "Data Pushed QA": true,
                                },
                            });
                        }
                    });
                    updateRefenceIDIntsBase(data, base)
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
    tsDemoData,
};
