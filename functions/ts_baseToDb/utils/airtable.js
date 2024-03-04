const sleep = require("atomic-sleep");

function qaApprovetsData(selectBase) {
    return new Promise((resp, rej) => {
        let base = selectBase;
        let table = base("Escorts Tractor Survey");
        let totalRecords = [];
        table
            .select({
                maxRecords: 10,
                filterByFormula: "NOT({Data Pushed QA})",
            })
            .eachPage(
                function page(records, fetchNextPage) {
                    totalRecords = [...records];
                    fetchNextPage();

                },
                function done(err) {
                    if (err) {
                        console.error(err);
                        rej();
                    }
                    resp(totalRecords);
                }
            );
    });
}

function updateRefenceIDIntsBase(data, selectBase) {
    return new Promise((resp, rej) => {
        let base = selectBase;
        let table = base("Escorts Tractor Survey");
        table.update([...data], { typecast: true }, function (err) {
            if (err) {
                console.log("recd nhi h", err);
                rej(err);
            } else {
                console.log("update in airtable");
                resp();
            }
        });
    });
}
module.exports = {
    qaApprovetsData,
    updateRefenceIDIntsBase
};
