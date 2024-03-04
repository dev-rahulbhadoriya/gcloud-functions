const airtable = require("airtable");
airtable.configure({
  endpointUrl: "https://api.airtable.com",
  apiKey: "airtable_api_key",
});

const PSInternalFieldForm = airtable.base("appYANdorBhY3Sv3i"); // psInternal Base 0
const PSInternalFieldForm2 = airtable.base("appW6TkoNL4Ed0IKY"); // psInternal Base 2
const PSInternalFieldForm3 = airtable.base("appHNrAdNmr8K6mWM"); // psInternal Base 3
const PSInternalFieldForm4 = airtable.base("appcpEC0uo9fcIzwN"); // psInternal Base 4
const PSInternalFieldForm5 = airtable.base("appKZxt1SueiPqMEg"); // psInternal Base 5
const PSInternalFieldForm6 = airtable.base("appfhfDRyRtDKLCYZ"); // psInternal Base 6
const PSInternalFieldForm7 = airtable.base("apph1Z7j7WTBTGMB3"); // psInternal Base 7
const PSInternalFieldForm8 = airtable.base("appLpppXOTPlCYKdb"); // psInternal Base 8
const PSInternalFieldForm9 = airtable.base("appVKYn2uVV96XSCt"); // psInternal Base 9
const PSInternalFieldForm10 = airtable.base("appbCEYx5sDtoQ3US"); // psInternal Base 10
const PSInternalFieldForm11 = airtable.base("appqvNvGMB7sSnsKF"); // psInternal Base 11
const PSInternalFieldForm12 = airtable.base("app3WvrNghwgUWumg"); // psInternal Base 12

const psInternalBases = {
  " ": airtable.base("appYANdorBhY3Sv3i"),
  2: airtable.base("appW6TkoNL4Ed0IKY"),
  3: airtable.base("appHNrAdNmr8K6mWM"),
  4: airtable.base("appcpEC0uo9fcIzwN"),
  5: airtable.base("appKZxt1SueiPqMEg"),
  6: airtable.base("appfhfDRyRtDKLCYZ"),
  7: airtable.base("apph1Z7j7WTBTGMB3"),
  8: airtable.base("appLpppXOTPlCYKdb"),
  9: airtable.base("appVKYn2uVV96XSCt"),
  10: airtable.base("appbCEYx5sDtoQ3US"),
  11: airtable.base("appqvNvGMB7sSnsKF"),
  12: airtable.base("app3WvrNghwgUWumg"),
  
};

module.exports = {
  psInternalBases,
  PSInternalFieldForm,
  PSInternalFieldForm2,
  PSInternalFieldForm3,
  PSInternalFieldForm4,
  PSInternalFieldForm5,
  PSInternalFieldForm6,
  PSInternalFieldForm7,
  PSInternalFieldForm8,
  PSInternalFieldForm9,
  PSInternalFieldForm10,
  PSInternalFieldForm11,
  PSInternalFieldForm12
  
};
