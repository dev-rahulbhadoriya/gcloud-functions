const airtable = require("airtable");

airtable.configure({
    endpointUrl: "https://api.airtable.com",
    apiKey: "airtable_api_key",
});


const bmstDataInternalBase1 = airtable.base("appMmeLl8846fIBL2");

const bmstDataInternalBases = {
    1: airtable.base("appMmeLl8846fIBL2"),
};

module.exports = {
    bmstDataInternalBases,
    bmstDataInternalBase1
};