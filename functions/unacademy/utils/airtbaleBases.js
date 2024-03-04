const airtable = require("airtable");
airtable.configure({
  endpointUrl: "https://api.airtable.com",
  apiKey: "airtable_api_key",
});

const unacademyBases1 = airtable.base("apptUqVlb3mTg34mg");

const unacademyBases = {
  1: airtable.base("apptUqVlb3mTg34mg"),

};
module.exports = {
  unacademyBases,
  unacademyBases1

};
