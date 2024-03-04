const airtable = require("airtable");
airtable.configure({
    endpointUrl: "https://api.airtable.com",
    apiKey: "airtable_api_key",
});

const backToSchoolBase1 = airtable.base("appH95EZWu9eQDfxc");

const backToSchoolBases = {
    1: airtable.base("appH95EZWu9eQDfxc"),

};
module.exports = {
    backToSchoolBase1,
    backToSchoolBases

};
