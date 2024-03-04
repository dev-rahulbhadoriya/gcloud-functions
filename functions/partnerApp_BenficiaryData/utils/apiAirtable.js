const airtable = require("airtable");
airtable.configure({
    endpointUrl: "https://api.airtable.com",
    apiKey: "airtable_api_key"
});


const PartnerAppInternalBase01newBase = airtable.base("appPRScXOXGbUJgz6");
const PartnerAppInternalBase01 = airtable.base("appthrNMHuRPrkVq2");
const PartnerAppInternalBase02 = airtable.base("appJzKkD3ipg02VBM");
const PartnerAppInternalBase03 = airtable.base("appvfW0AcpTRe89gx");
const PartnerAppInternalBase04 = airtable.base("appjWodcWxdbu2wbh");
const PartnerAppInternalBase05 = airtable.base("appnfrpwVpYLdJ9ZK");
const PartnerAppInternalBase06 = airtable.base("appCvY3HizjpwxMPN");
const PartnerAppInternalBase07 = airtable.base("appKjyJNyDBOLv2wf");
const chatBotBase = airtable.base('appknaqIvb8pP7RSl')

module.exports = {
    PartnerAppInternalBase01,
    PartnerAppInternalBase01newBase,
    PartnerAppInternalBase02,
    PartnerAppInternalBase03,
    PartnerAppInternalBase04,
    PartnerAppInternalBase05,
    PartnerAppInternalBase06,
    PartnerAppInternalBase07,
    chatBotBase
}