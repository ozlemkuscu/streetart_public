const app = new cot_app("Walking Tour Submission");
const configURL = "//www1.toronto.ca/static_files/WebApps/CommonComponents/walking_tours/JSONFeed.js";
const form_id = "walking_tour";
let form, config, httpHost,repo,myDropzone, doc_id;
let photoDropzone, pdfDropzone, audioDropzone;
$(document).ready(function () {
  let hash  = window.location.hash.substring(1,window.location.hash.length);
  doc_id = hash.length==32?hash:null;

  app.render(function () {initialize();});
  function renderApp(){
    repo = config.default_repo;
    httpHost = detectHost();
    loadForm();
    app.setBreadcrumb(app.data['breadcrumbtrail']);

    $.get("html/walking_tour.html #fh-steps", function(template) {
      const rendered = Mustache.render(template, app.data);
      app.setContent({"top":rendered})
      $('#btn_back').click(function(){navigatetoStep(1);});
      $('#btn_back_2').click(function(){navigatetoStep(2);});
      $('#btn_forward').click(function(){showForm();});
      $(".fv-hidden-submit").addClass(".hidden").text("system button");

      showTerms();

    }).fail(function() {
      $("#app-content-top").empty();
      console.log('Failed to load template: ' + "html/cot_pt_calc.html #fh-steps");
    });
  }
  function initialize(){
    loadVariables();
  }
  function loadForm(){
    form = new CotForm({
      id: form_id,
      title: '',
      useBinding: false,
      rootPath:"",
      sections:getSubmissionSections()
    });
  }
  function loadVariables(){
    $.ajax({
      url: configURL,
      type: "GET",
      cache: "true",
      dataType:"jsonp",
      jsonpCallback: "callback",
      success: function(data) {
        $.each(data.items, function(i, item) {app.data[item.title] = item.summary;});
        config = app.data.config;
        renderApp();
      },
      error: function() {
        alert("Error: The application was unable to load data.")
      }
    });
  }
  function detectHost() {
    switch (window.location.origin) {
      case config.httpHost.root_public.local:
        return 'local';
      case config.httpHost.root_public.dev:
        return 'dev';
      case config.httpHost.root_public.qa:
        return 'qa';
      case config.httpHost.root_public.prod:
        return 'prod';
      default:
        return 'local';
    }
  }
});
function initForm(){
  photoDropzone = new Dropzone("div#photo_dz",
    {
      "init":function(){
        let fieldname = "txtPicName";
        this
          .on("addedfile", function(file){validateUpload("addedfile",fieldname, file.name);})
          .on("success", function(file){validateUpload("success",fieldname, file.name);})
          .on("removedfile", function(){validateUpload("removedFile",fieldname, "");})
          .on("error", function(){validateUpload("error",fieldname, "");});
      },
      "dz_id":"photo_dz", "form_id":form_id ,
      "url": config.api_public.upload + config.default_repo + '/' + repo,
      "acceptedFiles":"image/*",
      "maxFiles": 1,
      "dictDefaultMessage":"Drop image file here or<button class='btn-link' aria-label='File Upload - Drop files here or click to upload' type='button'>click</button>to upload",
      "maxFilesize":5,
      "dictFileTooBig":"Maximum photo size for file attachment is 5 MB",
      "addRemoveLinks":true,
      "dictMaxFilesExceeded": "Maximum  1 uploaded files"
    });

  pdfDropzone = new Dropzone("div#pdf_dz",
    {
      "init":function(){
        let fieldname = "txtPDFName";
        this
          .on("addedfile", function(file){validateUpload("addedfile",fieldname, file.name);})
          .on("success", function(file){validateUpload("success",fieldname, file.name);})
          .on("removedfile", function(){validateUpload("removedFile",fieldname, "");})
          .on("error", function(){validateUpload("error",fieldname, "");});
      },
      "dz_id":"pdf_dz", "form_id":form_id ,
      "url": config.api_public.upload +config.default_repo + '/' + repo,
      "acceptedFiles":"application/pdf",
      "maxFiles": 1,
      "dictDefaultMessage":"Drop pdf file here or<button class='btn-link' aria-label='File Upload - Drop files here or click to upload' type='button'>click</button>to upload",
      "maxFilesize":5,
      "dictFileTooBig":"Maximum pdf size for file attachment is 5 MB",
      "addRemoveLinks":true,
      "dictMaxFilesExceeded": "Maximum  2 uploaded files"
    });

  audioDropzone = new Dropzone("div#audio_dz",
    {
      "dz_id":"audio_dz", "form_id":form_id ,
      "url": config.api_public.upload +config.default_repo + '/' + repo,
      "acceptedFiles":".mp3, .mp4, .wma",
      "maxFiles": 1,
      "dictDefaultMessage":"Drop audio file here or<button class='btn-link' aria-label='File Upload - Drop files here or click to upload' type='button'>click</button>to upload",
      "maxFilesize":50,
      "dictFileTooBig":"Maximum pdf size for file attachment is 50 MB",
      "addRemoveLinks":true,
      "dictMaxFilesExceeded": "Maximum 1 uploaded files"
    });

  $("#closebtn").click(function(){window.close();});
  $("#printbtn").click(function(){window.print();});
  $("#savebtn").click(function(){
    let form_fv = $('#'+ form_id).data('formValidation');
    form_fv.validate();
    if(form_fv.isValid()){submitForm()}
  });

  $(".dz-hidden-input").attr("aria-hidden","true");
  $(".dz-hidden-input").attr("aria-label","File Upload Control");
  $('#walking_tour').data('formValidation')
    .addField('txtPicName', { excluded: false,  validators: {notEmpty: {message: 'Please upload one photo for your walking tour' }}})
    .addField('txtPDFName', { excluded: false,  validators: {notEmpty: {message: 'Please upload one PDF for your walking tour' }}});
}
function submitForm(){
  let payload = form.getData();


  payload.photo_uploads = processUploads(photoDropzone, repo, false);
  payload.pdf_uploads = processUploads(pdfDropzone, repo, false);
  payload.audio_uploads = processUploads(audioDropzone, repo, false);
  let keepFiles = "";
  if(payload.photo_uploads[0])  {keepFiles +=       payload.photo_uploads[0].bin_id}
  if(payload.pdf_uploads[0])    {keepFiles += "," + payload.pdf_uploads[0].bin_id}
  if(payload.audio_uploads[0])  {keepFiles += "," + payload.audio_uploads[0].bin_id}
  let queryString = payload.photo_uploads[0] ? "?KeepFiles="+ keepFiles : "";
  $.removeCookie(doc_id);
  $.cookie(doc_id, JSON.stringify(form.getData()), { expires: 1 , path: '/' });
  $.ajax({
    url: config.httpHost.app_public[httpHost] + config.api_public.post +repo + queryString,
    type: 'POST',
    data: JSON.stringify(payload),
    headers: {
      'Content-Type': 'application/json; charset=utf-8;',
      'Cache-Control': 'no-cache'
    },
    dataType: 'json',
    success : function(data) {


      if((data.EventMessageResponse.Response.StatusCode)==200) {
        /*
      if(myDropzone.getQueuedFiles().length===1){
        console.log(config.httpHost.app_public[httpHost] + config.api_public.upload +data._id)
        myDropzone.options.url = config.httpHost.app_public[httpHost] + config.api_public.upload +data._id,
        myDropzone.processQueue()
      }
*/
        $('.dz-input').hide();
        $('.dropzone, .dropzone *').css("cursor","not-allowed");
        $('.dz-remove').hide();
        $(":input").prop("disabled",true);
        $("#printbtn").prop('disabled', false);
        $("#closebtn").prop('disabled', false);
        $('#successFailArea').html(config.messages.submit.done);
      }
    },
    error: function () {
      $('#successFailArea').html(config.messages.submit.fail);
      //console.log('error',jqXHR, exception);
    }
  }).done(function() {});

}
function getSubmissionSections(){
  return section =    [
    {
      id:"introSection",
      rows:[
        {
          fields:[
            { "id": "introText", "title": "", "type": "html", "html": app.data["IntroText"], "className": "col-xs-12 col-md-12" }
          ]
        }
      ]
    },
    {
      "id":"tourBasics",
      "title":"Tour Basics",
      "rows":[
        {
          "fields":
            [
              {"id": "TourName", "title": "Name", "required": true, "className": "col-xs-12 col-md-6"},
              {"id": "TourURL", "title": "Website", "required": false, validators: {uri: { message: 'The website address is not valid',allowEmptyProtocol:true}},"className": "col-xs-12 col-md-6"}
            ]
        },
        {
          "fields":
            [
              {
                "id": "TourDuration",
                "type":"multiselect",
                "multiple":false,
                "choices":app.data.tourDurationOptions,
                "title": "Duration",
                "required": true
              },
              {
                "id": "TourFeatures",
                "type":"multiselect",
                "multiple":true,
                "choices":app.data.tourFeaturesOptions,
                "title": "Interest",
                "required": true,
                "options": {
                  "includeSelectAllOption": false,
                  "numberDisplayed": 3,
                  "selectAllValue": "ALL",
                  "nonSelectedText": "None Selected",
                  "allSelectedText": "All"
                }
              },
              {"id": "TourLocation","type":"multiselect", "multiple":false, "choices":app.data.tourLocationOptions, "title": "Location", "required": true}
            ]
        }
      ]
    },
    {
      "id":"description",
      "title":"Description",
      "rows":[
        {
          "fields":[
            {"id": "TourDesc1", "type":"textarea", "title": "Paragraph 1", "required": true, "className": "col-xs-12 col-md-12"},
          ]
        },
        {
          "fields":[
            {"id": "TourDesc2", "type":"textarea", "title": "Paragraph 2", "required": false, "className": "col-xs-12 col-md-12"}
          ]
        },
        {
          "fields":[
            {"id": "TourDesc3", "type":"textarea", "title": "Paragraph 3", "required": false, "className": "col-xs-12 col-md-12"}
          ]
        }
      ]
    },
    {
      "id":"ttc",
      "title":"Nearest TTC",
      "rows":[
        {
          "fields":[
            {"id": "TourSubway", "title": "Subway station", "required": true, "className": "col-xs-12 col-md-6"},
            {"id": "TourStreetcar", "title": "Bus/streetcar", "required": true, "className": "col-xs-12 col-md-6"}
          ]
        }
      ]
    },
    {
      "id":"contactInfo",
      "title":"Contact: (if applicable)",
      "rows":[
        {
          "fields":[
            {"id": "TourContact", "title": "Name", "required": false, "className": "col-xs-12 col-md-6"},
            {"id": "TourConEmail", "title": "E-Mail","validationtype": "Email", "required": false, "className": "col-xs-12 col-md-6"}
          ]
        },
        {
          "fields":[
            {"id": "TourConTitle", "title": "Position/title", "required": false, "className": "col-xs-12 col-md-6"},
            {"id": "TourConOrg", "title": "Organization", "required": false, "className": "col-xs-12 col-md-6"}
          ]
        },
        {
          "fields":[
            {"id": "TourConAddr", "title": "Mailing Address", "required": false, "className": "col-xs-12 col-md-6"},
            {"id": "TourConCity", "title": "City", "required": false, "className": "col-xs-12 col-md-6"}
          ]
        },
        {
          "fields":[
            {"id": "TourConPostal", "title": "Postal Code", "required": false, "className": "col-xs-12 col-md-6"},
            {"id": "TourConProv", "title": "Province", "required": false, "className": "col-xs-12 col-md-6"}
          ]
        },
        {
          "fields":[
            {"id": "TourConPhone", "title": "Phone", "required": false, "className": "col-xs-12 col-md-6"},
            {"id": "TourConPhoneExt", "title": "Extension", "required": false, "className": "col-xs-12 col-md-6"}
          ]
        }

      ]
    },
    {
      "id": "photo_section",
      "title": "Photo Upload",
      "rows": [
        {
          "fields":[
            {
              "id": "docsIntro", "title": "File Attachments", "type": "html", "html": `
                <section id="photo_attachment" className="col-xs-12 col-md-4">
                  <div class="dropzone" id="photo_dz"></div>
                </section>
                <input type="hidden" name="txtPicName" id="txtPicName" value="" />`
            }
          ]
        }
      ]
    },
    {
      "id": "pdf_section",
      "title": "PDF File Upload",
      "rows": [
        {
          "fields":[
            {
              "id": "docsIntro", "title": "File Attachments", "type": "html", "html": `
                <section id="pdf_attachment" className="col-xs-12 col-md-4">
                  <div class="dropzone" id="pdf_dz"></div>
                </section>
                <input type="hidden" name="txtPDFName" id="txtPDFName" value="" />`
            },
          ]
        }
      ]
    },
    {
      "id":"audio_sec",
      "title":"Audio File Upload (Optional)",
      "rows":[
        {
          "fields":[
            {
              "id": "docsIntro", "title": "File Attachments", "type": "html", "html": `
                <section id="audio_attachment" className="col-xs-12 col-md-4">
                  <div class="dropzone" id="audio_dz"></div>
                </section>
                <input type="hidden" name="txtMP3Name" id="txtMP3Name" value="" />`
            },
          ]
        }
      ]
    },
    {
      id:"MPHIPPASec",
      title:"",
      className: "panel-info",
      rows: [
        {
          fields:[
            { "id": "cdText5", "title": "", "type": "html", "html": app.data['MPHIPPA'] }
          ]
        }
      ]
    },
    {
      id:"secActions",
      rows:[
        {
          fields:[
            {
              id:"submitHelp",
              title:"",
              type:"html",
              html:"Please review your information before submitting.  Once you click submit, you will not be able to edit."
            }
          ]
        },
        {
          fields:[
            {
              id:"actionBar",
              type:"html",
              html:`<div className="col-xs-12 col-md-12"><button class="btn btn-success" id="savebtn"><span class="glyphicon glyphicon-floppy-disk" aria-hidden="true"></span> ` + config.button.saveReport + `</button>
                    <button class="btn btn-success" id="closebtn"><span class="glyphicon glyphicon-remove-sign" aria-hidden="true"></span>Close</button>
                    <button class="btn btn-success" id="printbtn"><span class="glyphicon glyphicon-print" aria-hidden="true"></span>Print</button>
                  </div>`
            },
            {
              id:"successFailRow",
              type:"html",
              className:"col-xs-12 col-md-12",
              html:`<div id="successFailArea" className="col-xs-12 col-md-12"></div>`
            }
          ]
        },
        {
          fields:[
            /*
             {
             "id": "form_name",
             "type": "html",
             "html": "<input type='hidden'  name='form' value='HOTEats'>",
             "class": "hidden"
             },
             */
            {
              "id": "ReturnPage",
              "type": "html",
              "html": "<input type='hidden'  name='$$Return' value='[//www.toronto.ca]'>",
              "class": "hidden"
            },
            {
              "id":"SubmissionStatus",
              "type": "html",
              "html": "<input type='hidden'  name='eventStatus' value='Unapproved'>",
              "class": "hidden"
            }
            ,
            {
              "id":"SubmissionState",
              "type": "html",
              "html": "<input type='hidden'  name='WCMForms_Name' value=''>",
              "class": "hidden"
            }
          ]
        }
      ]
    }
  ]
}
function processUploads(DZ, repo, sync){
  let  uploadFiles = DZ.existingUploads?DZ.existingUploads:new Array;
  let _files = DZ.getFilesWithStatus(Dropzone.SUCCESS);
  let syncFiles = sync;
  if (_files.length == 0) {
    //empty
  }else {
    $.each(_files, function (i, row) {
      let json = JSON.parse(row.xhr.response);
      json.name = row.name;
      json.type = row.type;
      json.size = row.size;
      json.bin_id = json.BIN_ID[0];
      delete json.BIN_ID;
      uploadFiles.push(json);
      syncFiles ? '':'';
    });
  }
  return uploadFiles;
}
function validateUpload(event, field, value){
  console.log(event);


//placeholder for additional logic based on the event
  switch(event) {
    case "addedfile":
      break;
    case "success":
      break;
    case "removedfile":
      break;
    case "error":
      console.log("custom error code")
      $('#'+ form_id).data('formValidation').updateMessage(field, 'notEmpty', app.data.uploadServerErrorMessage)
      break;
    default:
  }
  $('#' + field).val(value);
  $('#'+ form_id).data('formValidation').revalidateField(field);
}
function showForm() {
  if(form && !form._isRendered){
    form.render({target:"#step2Content"});
    initForm();
  }
  $("#fh-step1, #fh-step3").addClass("hide");
  $("#fh-step2").removeClass("hide");
}
function showTerms() {
  $.each( $("div[data-wcm-title]"), function(i, item) {
    $(item).html(app.data[$(item).attr("data-wcm-title")]);
  });

  app.showTerms(app.data["Terms of Use Agreement"],app.data["Terms of Use - Unable to Proceed"],"cot-terms-cot_pt_calc","#app-content-left",function() {termsAgree()});
}
function termsAgree() {
console.log('termsAgree');
  //navigatetoStep(2);
  $("#cot-template-terms").addClass("hide");
  $("#fh-steps").removeClass("hide");

}
function navigatetoStep(stepNo) {
  console.log('navigatetoStep',stepNo);
  let terms = $("#cot-template-terms");
  switch(stepNo) {
    case 1:
      console.log('case 1')
      $.removeCookie("cot-terms-cot_pt_calc", { path: '/' });
      $("#fh-steps").addClass("hide");
      if (terms.length> 0) {
        terms.removeClass("hide");
      } else {
        showTerms();
      }
      break;
    case 2:
      $("#fh-step2").addClass("hide");
      $("#fh-step1").removeClass("hide");
      break;
    default:
  }
}
Contact GitHub API Training Shop Blog About
© 2017 GitHub, Inc. Terms Privacy Security Status Help