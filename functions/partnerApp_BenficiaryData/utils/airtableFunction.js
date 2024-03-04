const { PartnerAppInternalBase01, PartnerAppInternalBase01newBase, chatBotBase, PartnerAppInternalBase02, PartnerAppInternalBase05, PartnerAppInternalBase06, PartnerAppInternalBase07, PartnerAppInternalBase03, PartnerAppInternalBase04 } = require('./apiAirtable')

function insertToAirtable(fields) {
    //Change newest base here - Overwrite 
    //As this function is going to insert the data and insert functionality is going to be on 
    //newest base only and not on old base
    return new Promise((resp, rej) => {
        //Overwrite the base name and table name here accordingly
        PartnerAppInternalBase03("Partner App Cowin Internal Base").create(
            [{ fields: fields }],
            { typecast: true },
            function (err, records) {
                if (err) {
                    console.error(err);
                    rej(err);
                }
                records.forEach(function (record) {
                    resp(record.getId());
                });
            }
        );
    });
}

function insertRunnerIssuesToAirtable(fields) {
    console.log("fieldsData@@", fields);
    return new Promise((resp, rej) => {
        chatBotBase("Partner App Issue Tickets")
            .create(
                [{ fields: fields }],
                { typecast: true },
                function (err, records) {
                    if (err) {
                        console.error(err);
                        rej(err);
                    }
                    records.forEach(function (record) {
                        resp(record.getId());
                    });
                }
            );
    });
}
function insertToAirtableFirstTime(fields) {
    return new Promise((resp, rej) => {

        //Change the base here accordingly
        //As this is the insertion process and it is very clear that data insertion will always be done
        //on new base only, please overwrite the base name and table name here
        PartnerAppInternalBase06("Partner App Cowin Internal Base").create(
            [{ fields: fields[0] }],
            { typecast: true },
            function (err, records) {
                if (err) {
                    console.error(err);
                    rej(err);
                }
                records.forEach(function (record) {
                    resp(record.getId());
                });
            }
        );
    });
}
function insertToAirtableThroughPostman(fields) {
    console.log("fieldsData@@", fields);
    return new Promise((resp, rej) => {
        PartnerAppInternalBase06("Partner App Cowin Internal Base").create(
            [{ fields: fields }],
            { typecast: true },

            function (err, records) {
                if (err) {
                    console.error(err);
                    rej(err);
                }
                records.forEach(function (record) {
                    resp(record.getId());
                });
            }
        );
    });
}

function updateToAirtable(fields, recId, baseStatus) {
    if (baseStatus === "1") {
        return new Promise((resp, rej) => {
            PartnerAppInternalBase01newBase("Partner App Cowin Internal Base").update(
                [
                    {
                        id: recId,
                        fields: fields,
                    },
                ],
                { typecast: true },

                function (err, records) {
                    if (err) {
                        // console.error(new Error(err));
                        rej(err);
                    }
                    records.forEach(function (record) {
                        resp(record.getId());
                    });
                }
            );
        });
    } else if (baseStatus === "2") {
        return new Promise((resp, rej) => {
            PartnerAppInternalBase02("Partner App Cowin Internal Base").update(
                [
                    {
                        id: recId,
                        fields: fields,
                    },
                ],
                { typecast: true },
                function (err, records) {
                    if (err) {
                        // console.error(new Error(err));
                        rej(err);
                    }
                    records.forEach(function (record) {
                        resp(record.getId());
                    });
                }
            );
        });

    } else if (baseStatus === "3") {
        return new Promise((resp, rej) => {
            PartnerAppInternalBase03("Partner App Cowin Internal Base").update(
                [
                    {
                        id: recId,
                        fields: fields,
                    },
                ],
                { typecast: true },
                function (err, records) {
                    if (err) {
                        // console.error(new Error(err));
                        rej(err);
                    }
                    records.forEach(function (record) {
                        resp(record.getId());
                    });
                }
            );
        });

    } else if (baseStatus === "4") {
        return new Promise((resp, rej) => {
            PartnerAppInternalBase04("Partner App Cowin Internal Base").update(
                [
                    {
                        id: recId,
                        fields: fields,
                    },
                ],
                { typecast: true },
                function (err, records) {
                    if (err) {
                        // console.error(new Error(err));
                        rej(err);
                    }
                    records.forEach(function (record) {
                        resp(record.getId());
                    });
                }
            );
        });

    }else if (baseStatus === "5") {
        return new Promise((resp, rej) => {
            PartnerAppInternalBase05("Partner App Cowin Internal Base").update(
                [
                    {
                        id: recId,
                        fields: fields,
                    },
                ],
                { typecast: true },
                function (err, records) {
                    if (err) {
                        // console.error(new Error(err));
                        rej(err);
                    }
                    records.forEach(function (record) {
                        resp(record.getId());
                    });
                }
            );
        });

    }else if (baseStatus === "6") {
        return new Promise((resp, rej) => {
            PartnerAppInternalBase06("Partner App Cowin Internal Base").update(
                [
                    {
                        id: recId,
                        fields: fields,
                    },
                ],
                { typecast: true },
                function (err, records) {
                    if (err) {
                        // console.error(new Error(err));
                        rej(err);
                    }
                    records.forEach(function (record) {
                        resp(record.getId());
                    });
                }
            );
        });

    }else if (baseStatus === "7") {
        return new Promise((resp, rej) => {
            PartnerAppInternalBase07("Partner App Cowin Internal Base").update(
                [
                    {
                        id: recId,
                        fields: fields,
                    },
                ],
                { typecast: true },
                function (err, records) {
                    if (err) {
                        // console.error(new Error(err));
                        rej(err);
                    }
                    records.forEach(function (record) {
                        resp(record.getId());
                    });
                }
            );
        });

    }

}
function updateMobileNumberInAirtable(fields, recId) {
    console.log("#@#@@", fields);
    return new Promise((resp, rej) => {
        PartnerAppInternalBase01newBase("Partner App Cowin Internal Base").update(
            [
                {
                    id: recId,
                    fields: fields,
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
    });
}


module.exports = {
    insertToAirtable,
    updateToAirtable,
    insertToAirtableThroughPostman,
    insertToAirtableFirstTime,
    insertRunnerIssuesToAirtable,
    updateMobileNumberInAirtable
}