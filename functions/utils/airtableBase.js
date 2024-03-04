const airtable = require("airtable");
airtable.configure({
    endpointUrl: "https://api.airtable.com",
    apiKey: "airtable_api_key"
});

const bgvbase = airtable.base("app1C5TVoophmmr8M");
const swiftInternationalSurveyBase = airtable.base("appxd9OVUZVELd9bw");
const assetVerificationBase = airtable.base('app2yjW8gqZijoDX5')
const sonyBase = airtable.base("appRXxfuZUl16igQc");
const welspunBase = airtable.base("appgQ8UZWJAxRFgIi");
const udaanBase = airtable.base("appd0jEmUkIMCKaPv");
const vivoBase = airtable.base("app67HkeM09l3Hz3o");
const salesbeeBase = airtable.base("appuOfNPUOrRW2SC6");
const projectInfoBase = airtable.base("appQX1snWru1ngyTs");
const agrostarBase = airtable.base("appGqz1pZvj9VVDzV");
const thyrocareBase = airtable.base("appNlEohNQGdq8ZzD");

const retailerBase = airtable.base("applKkMMQ77ZwdZcm");

// const finovabase = airtable.base("appbBjg7wrnWmPBsH");
const availBase = airtable.base("appZAOr2yULJgKaxK");
// const availFinovaBase = airtable.base("appPMKdmMfLfP1OTy");

const vidarbhaBase = airtable.base("appns7ot4ZY0nfJhZ");
const vidarbhaCustomerBase = airtable.base("applXmuD8LeX90zL8");
const vidarbhaABBase = airtable.base("appqOmSRptrFq6RZQ");
const mpSurveyBase = airtable.base("appYLaTFzHrfp5jsr");
const feRatingBase = airtable.base("appfLQZQ8fd2Y0r4F");
const udaanPoolBBase = airtable.base("appHgVt4qPnn8S8Wf");
const okraBase = airtable.base('appMkdEbuuKmMUMKH');
const sonyPromoBase = airtable.base('appukaofkUdW80Y5W');

const vidarbhaCustomerBaseV2 = airtable.base('appGxcwwzVG5gDMSt');
const apiTestBase = airtable.base('appACN91hqdg4ZNcK')
const welspunAuditBase = airtable.base('appZR8aIRHy33FOAZ')
const tractorSurveyBase = airtable.base('app1AtASQTD2W88v6')
const depalpurBase = airtable.base('app65bcLpTefCFMmf')
const tmcBase = airtable.base('appGo86iYlrheMyJm');
const medcordSurveyBase = airtable.base('app6ukhqd7e86iGmS')
const svAgriSurveyBase = airtable.base('app8FWf3ytXyf3Sl1')
const techBase = airtable.base('appybRBnDbjhPnwvq')


const CoronaFormBase = airtable.base('appupRMPrZoSMKNOg'); //Project Swaraksha Internal Base 1 key base full
const CoronaFormInternalBase2 = airtable.base('appBEPbW8pCkYlRZA'); // Project Swaraksha Internal Base 2 

const PSInternalFieldForm = airtable.base("appYANdorBhY3Sv3i");

module.exports = {
    tractorSurveyBase,
    svAgriSurveyBase,
    medcordSurveyBase,
    apiTestBase,
    bgvbase,
    udaanBase,
    // finovabase,
    thyrocareBase,
    retailerBase,
    availBase,
    vidarbhaBase,
    // availFinovaBase,
    mpSurveyBase,
    vidarbhaCustomerBase,
    udaanPoolBBase,
    vidarbhaABBase,
    okraBase,
    sonyPromoBase,
    vidarbhaCustomerBaseV2,
    welspunAuditBase,
    depalpurBase,
    tmcBase,
    swiftInternationalSurveyBase,
    assetVerificationBase,
    techBase,
    CoronaFormBase,
    CoronaFormInternalBase2,
    PSInternalFieldForm,
};