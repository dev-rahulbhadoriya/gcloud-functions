const airtable = require("airtable");
airtable.configure({
  endpointUrl: "https://api.airtable.com",
  apiKey: "airtable_api_key",
});

const sewaInternationalbase1 = airtable.base("applQXDnidPWFGtBF");


const sewaInternationalBases =  {
  1: airtable.base("applQXDnidPWFGtBF"),
}
module.exports = {
    sewaInternationalbase1,
    sewaInternationalBases
};
