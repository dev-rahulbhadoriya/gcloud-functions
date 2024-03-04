const airtable = require("airtable");

airtable.configure({
    endpointUrl: "https://api.airtable.com",
    apiKey: "airtable_api_key",
});

const blueStarInternalBase1 = airtable.base("app29R3q6DtAeJXLQ");

const blueStarInternalBases = {
    1: airtable.base("app29R3q6DtAeJXLQ")
}

module.exports = {
    blueStarInternalBase1,
    blueStarInternalBases
};