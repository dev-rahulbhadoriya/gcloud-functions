const spoorsapi = {
    spoorsgcpapi: "https://us-central1-anaxee-spoors-backend.cloudfunctions.net/spoorsapi",
    formdataapi: "https://Govind:Govind@api.spoors.in/effort6/api/form/data/",
    mediaapi: "https://Govind:Govind@api.spoors.in/effort6/api/media/get/",
    uploadpictos3: "https://us-central1-anaxee-spoors-backend.cloudfunctions.net/uploadPicToS3",
    uploadziptos3: 'https://us-central1-anaxee-spoors-backend.cloudfunctions.net/uploadZipToS3',
    anaxeeformdataapi: 'https://Govind:Govind@drapp.anaxee.com/effortx/api/form/data/',
    anaxeemediaapi: 'https://Govind:Govind@drapp.anaxee.com/effortx/api/media/get/',
    jsonPlaceholder: 'https://jsonplaceholder.typicode.com/'
}

const autocall = {
    "autocallapi": "http://obd37.sarv.com/api/voice/voice_broadcast.php",
    "getreportapi": "http://obd37.sarv.com/api/voice/fetch_report.php"
}

module.exports = {spoorsapi, autocall};