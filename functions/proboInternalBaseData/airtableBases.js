const airtable = require("airtable");
airtable.configure({
    endpointUrl: "https://api.airtable.com",
    apiKey: "airtable_api_key",
});

const proboDataInternalBase1 = airtable.base("appxe8Q6GJJWBpJQ5");



const proboDataInternalBases = {
    1: airtable.base("appxe8Q6GJJWBpJQ5")
}
module.exports = {
    proboDataInternalBase1,
    proboDataInternalBases
};
