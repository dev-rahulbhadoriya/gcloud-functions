const airtable = require("airtable");

airtable.configure({
    endpointUrl: "https://api.airtable.com",
    apiKey: "airtable_api_key",
});

const wealthyInternalBase1 = airtable.base("appbH1b7kqPBVLPou");

const wealthyInternalBases = {
    1: airtable.base("appbH1b7kqPBVLPou")
}

module.exports = {
    wealthyInternalBases,
    wealthyInternalBase1
};