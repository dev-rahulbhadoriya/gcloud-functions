const cloudsql = require("../utils/cloudSql");

function insertBMSTDataSql(fields, basechange) {
    console.log("basechange inside function ", basechange);
    return new Promise((resp, rej) => {
        cloudsql.query(
            `INSERT INTO ttk_BMST (FormId, data, basechange) VALUES (?, ? ,?);`,
            [fields.FormId, JSON.stringify(fields), basechange],
            (err, result) => {
                if (err) {
                    console.log("FAILED_INSERT", JSON.stringify(err));
                    rej(err);
                }
                resp();
            }
        );
    });
}

function updateBMSTDataSql(fields) {
    return new Promise((resp, rej) => {
        cloudsql.query(
            `UPDATE ttk_BMST SET data=? WHERE FormId=${fields.FormId};`,
            [JSON.stringify(fields)],
            (err, result) => {
                if (err) {
                    console.log("FAILED_UPDATE", JSON.stringify(err));
                    rej(err);
                }
                resp();
            }
        );
    });
}

function getBMSTDataSql(formId) {
    return new Promise((resp, rej) => {
        cloudsql.query(
            `SELECT data, airtableId FROM ttk_BMST WHERE FormId =${formId}`,
            (err, result) => {
                if (err) {
                    console.log("FAILED_UPDATE", JSON.stringify(err));
                    rej(err);
                }
                resp(result);
            }
        );
    });
}

function updateBMSTDataIdSql(formId, airtableID) {
    return new Promise((resp, rej) => {
        cloudsql.query(
            `UPDATE ttk_BMST SET airtableId=? WHERE FormId=${formId};`,
            [airtableID],
            (err, result) => {
                if (err) {
                    console.log("FAILED_UPDATE", JSON.stringify(err));
                    rej(err);
                    process.exit(16);
                }
                console.log("INSERT AIRTABLE ID IN DB");
                resp();
            }
        );
    });
}

function runQuery(query, values) {
    return new Promise((resp, rej) => {
        try {
            cloudsql.query(query, values, (err, result) => {
                if (err) {
                    console.log(err);
                    rej(err);
                }
                resp(result);
            });
        } catch (error) {
            rej(error);
        }
    });
}

//SELECT data FROM ttk_BMST WHERE data_cleaned IS NULL ORDER BY Id DESC LIMIT 250
function getRow() {
    return new Promise((resp, rej) => {
        try {
            cloudsql.query(
                `SELECT data FROM ttk_BMST WHERE data_cleaned IS NULL ORDER BY FormId DESC LIMIT 250;`,
                (err, result) => {
                    if (err) {
                        console.log(err);
                        rej(err);
                    }
                    resp(result);
                }
            );
        } catch (error) {
            rej(error);
        }
    });
}

function changeCleanedStatus(id) {
    console.log(id);
    return new Promise((resp, rej) => {
        try {
            cloudsql.query(
                `UPDATE ttk_BMST SET data_cleaned=? WHERE Id=${id};`,
                [2],
                (err, result) => {
                    if (err) {
                        console.log(err);
                        rej(err);
                    }
                    resp(result);
                }
            );
        } catch (error) {
            rej(error);
        }
    });
}

module.exports = {
    insertBMSTDataSql,
    updateBMSTDataSql,
    getBMSTDataSql,
    updateBMSTDataIdSql,
    runQuery,
    getRow,
    changeCleanedStatus,
};