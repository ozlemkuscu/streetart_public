//A sample main js file. Use this as a starting point for your app.
const app = new cot_app("Graffiti Exemption");
const configURL = "//www1.toronto.ca/static_files/WebApps/CommonComponents/graffiti_exemption/JSONFeed.js";
let form, config, httpHost;
//let upload_selector = 'admin_dropzone';

const form_id = "graffiti_exemption";
let docDropzone;
let imageDropzone;
let cookie_SID = 'graffiti_exemption.sid';

let repo = "graffiti_exemption";

$(document).ready(function () {

  app.render(function () { initialize(); });
  function renderApp() {
    httpHost = detectHost();
    loadForm();
    app.setBreadcrumb(app.data['breadcrumbtrail']);
    app.addForm(form, 'top');
    docDropzone = new Dropzone("div#document_dropzone", $.extend(config.admin.docDropzonePublic, {
      "dz_id": "document_dropzone", "fid": "", "form_id": form_id,
      "url": config.api_public.upload + config.default_repo + '/' + repo,
    }));

    imageDropzone = new Dropzone("div#image_dropzone", $.extend(config.admin.imageDropzonePublic, {
      "dz_id": "image_dropzone", "fid": "", "form_id": form_id,
      "url": config.api_public.upload + config.default_repo + '/' + repo,
    }));

    initForm();

  }
  function initialize() {
    loadVariables();
  }
  function loadForm() {
    form = new CotForm({
      id: form_id,
      title: 'Request for Regularization for Art Mural/Graffiti Art under Municipal Code Chapter 485, Graffiti',
      useBinding: false,
      rootPath: config.httpHost.rootPath_public[httpHost],
      sections: $.merge(getSubmissionSections(), getAdminSectionsBottom()),
      success: function () {
      }
    });
  }
  function loadVariables() {
    $.ajax({
      url: configURL,
      type: "GET",
      cache: "true",
      dataType: "jsonp",
      jsonpCallback: "callback",
      success: function (data) {
        $.each(data.items, function (i, item) { app.data[item.title] = item.summary; });
        config = app.data.config;
        renderApp();
      },
      error: function () {
        alert("Error: The application was unable to load data.")
      }
    })
  }
  function detectHost() {
    switch (window.location.origin) {
      case config.httpHost.root_public.dev:
        return 'dev';
      case config.httpHost.root_public.qa:
        return 'qa';
      case config.httpHost.root_public.prod:
        return 'prod';
      default:
        console.log("Cannot find the server parameter in detectHost function. Please check with your administrator.");
        return 'dev';
    }
  }
});
function initForm() {

  var dataCreated = new Date();
  dataCreated = moment(dataCreated).format(config.dateTimeFormat);
  $("#recCreated").val(dataCreated);

  $("#lsteStatus").val("New");

  $("#closebtn").click(function () { window.close(); });
  $("#printbtn").click(function () { window.print(); });
  $("#savebtn").click(function () {
    let form_fv = $('#' + form_id).data('formValidation');
    form_fv.validate();
    if (form_fv.isValid()) { submitForm() }
  });

  $('#eNotice').on('click', function () {
    //  if(this.value == config.status.ApprovedHRC){
    $('#' + form_id).formValidation('revalidateField', $('#ComplianceDate'));
    //  }
  });

  $('#eMaintenance').on('change', function () {
    //  if(this.value == config.status.ApprovedHRC){
    $('#' + form_id).formValidation('revalidateField', $('#eMaintenanceAgreement'));
    //  }
  });

  $(".dz-hidden-input").attr("aria-hidden", "true");
  $(".dz-hidden-input").attr("aria-label", "File Upload Control");

  //$("h1").hide();

}
function submitForm() {
  //  $("#savebtn").prop('disabled', true);
  let payload = form.getData();
  payload.docUploads = processUploads(docDropzone, repo, false);
  payload.imageUploads = processUploads(imageDropzone, repo, false);
  console.log(JSON.stringify(payload));
  $.ajax({
    url: config.httpHost.app_public[httpHost] + config.api_public.post + repo + '?sid=' + getCookie(cookie_SID),
    type: 'POST',
    data: JSON.stringify(payload),
    headers: {
      'Content-Type': 'application/json; charset=utf-8;',
      'Cache-Control': 'no-cache'
    },
    dataType: 'json',
    success: function (data) {
      if ((data.EventMessageResponse.Response.StatusCode) == 200) {
        $('#app-content-top').html(config.messages.submit.done);
        //    $('#app-content-bottom').html(app.data["Success Message"]);
      }
    },
    error: function () {
      $('#successFailArea').html(config.messages.submit.fail);
    }
  }).done(function () {
  });
}
function processUploads(DZ, repo, sync) {
  let uploadFiles = DZ.existingUploads ? DZ.existingUploads : new Array;
  let _files = DZ.getFilesWithStatus(Dropzone.SUCCESS);
  let syncFiles = sync;
  if (_files.length == 0) {
    //empty
  } else {
    $.each(_files, function (i, row) {
      let json = JSON.parse(row.xhr.response);
      json.name = row.name;
      json.type = row.type;
      json.size = row.size;
      json.bin_id = json.BIN_ID[0];
      delete json.BIN_ID;
      uploadFiles.push(json);
      syncFiles ? '' : '';
    });
  }
  return uploadFiles;
}
function getSubmissionSections() {
  let section = [
    {
      id: "contactSec",
      title: app.data["Contact Details Section"],
      className: "panel-info",
      rows: [
        {
          fields: [
            //"required": true,
            {
              "id": "eFirstName", "title": app.data["First Name"],
              "required": true,
              "className": "col-xs-12 col-md-6"
            },
            {
              "id": "eLastName", "title": app.data["Last Name"],
              "required": true,
              "className": "col-xs-12 col-md-6"
            },
            {
              "id": "eAddress", "title": app.data["Address"],
              //  "required": true,
              "className": "col-xs-12 col-md-6"
            },
            { "id": "eCity", "title": app.data["City"], "value": "Toronto", "className": "col-xs-12 col-md-6" }
          ]
        },
        {
          fields: [{ "id": "ePostalCode", "title": app.data["Postal Code"], "className": "col-xs-12 col-md-6" },
          {
            "id": "ePrimaryPhone", "title": app.data["Phone"], "validationtype": "Phone",
            //  "required": true,
            "className": "col-xs-12 col-md-6"
          },
          { "id": "eFax", "title": app.data["Fax"], "validationtype": "Phone", "className": "col-xs-12 col-md-6" },
          { "id": "eEmail", "title": app.data["Email"], "validationtype": "Email", "validators": { regexp: { regexp: /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/, message: 'This field must be a valid email. (###@###.####)' } }, "className": "col-xs-12 col-md-6" }
          ]
        }
      ]
    },
    {
      id: "graffitiSec",
      title: app.data["Graffiti Section"],
      className: "panel-info",
      rows: [
        {
          fields: [
            {
              "id": "emSameAddress",
              "title": "",
              "type": "checkbox",
              "choices": config.sameAsAbove.choices,
              "class": "col-xs-12 col-md-12"
            },
            {
              "id": "emAddress", "title": app.data["Address"],
              //  "required": true, 
              "className": "col-xs-12 col-md-6"
            },
            { "id": "emCity", "title": app.data["City"], "value": "Toronto", "className": "col-xs-12 col-md-6" }
          ]
        },
        {
          fields: [{ "id": "emPostalCode", "title": app.data["Postal Code"], "className": "col-xs-12 col-md-6" },
          { "id": "emPrimaryPhone", "title": app.data["Phone"], "validationtype": "Phone", "className": "col-xs-12 col-md-6" },
          {
            "id": "emFacingStreet", "title": app.data["Facing Street"],
            //  "required": true, 
            "className": "col-xs-12 col-md-6"
          },
          {
            "id": "emDescriptiveLocation", "prehelptext": app.data["DescriptiveLocationText"], "title": app.data["graffitiDesLocation"],
            //  "required": true, 
            "type": "textarea", "className": "col-xs-12 col-md-12"
          }
          ]
        }
      ]
    },
    {
      id: "detailsSec",
      title: app.data["Details Section"],
      className: "panel-info",
      rows: [
        {
          fields: [
            {
              "id": "ePermission",
              "title": app.data["permission"],
              //  "required": true,
              "type": "radio",
              "className": "col-xs-12 col-md-12",
              "choices": config.choices.yesNoFull,
              "orientation": "horizontal"
            }, {
              "id": "eNotice",
              "title": app.data["notice"],
              //  "required": true,
              //  "type": "radio",
              "type": "dropdown",
              "value": "No",
              "className": "col-xs-12 col-md-12",
              "choices": config.choices.yesNoFull,
              "orientation": "horizontal"
            }, {
              "id": "ComplianceDate",
              "title": app.data["compliance"],
              //  "required": true,
              "type": "datetimepicker",
              "placeholder": config.dateFormat,
              "className": "col-xs-12 col-md-6",
              "options": { format: config.dateFormat },
              "validators": {
                callback: {
                  message: app.data["compliance"] + ' is required',
                  // this is added to formValidation
                  callback: function (value, validator, $field) {
                    var checkVal = $("#eNotice").val();
                    return (checkVal !== "Yes") ? true : (value !== '');
                  }
                }
              }
            }, {
              "id": "eMaintenance",
              "title": app.data["maintenance"],
              //  "required": true,
              //  "type": "radio",
              "type": "dropdown",
              "value": "No",
              "className": "col-xs-12 col-md-12",
              "choices": config.choices.yesNoFull,
              "orientation": "horizontal"
            },
            {
              "id": "eMaintenanceAgreement", "title": app.data["agreementDetails"],
              //  "required": true, 
              "className": "col-xs-12 col-md-12",
              "validators": {
                callback: {
                  message: app.data["agreementDetails"] + ' is required',
                  // this is added to formValidation
                  callback: function (value, validator, $field) {
                    var checkVal = $("#eMaintenance").val();
                    return (checkVal !== "Yes") ? true : (value !== '');
                  }
                }
              }
            },
            {
              "id": "eArtistInfo", "title": app.data["artistDetails"],
              //  "required": true, 
              "className": "col-xs-12 col-md-12"
            },
            {
              "id": "eArtSurfaceEnhance", "title": app.data["enhance"],
              //  "required": true, 
              "className": "col-xs-12 col-md-12"
            },
            {
              "id": "eArtLocalCharacter", "title": app.data["adhere"],
              //  "required": true, 
              "className": "col-xs-12 col-md-12"
            },
            { "id": "eAdditionalComments", "title": app.data["comments"], "className": "col-xs-12 col-md-12" },
          ]
        }]
    },
    {
      id: "attSec",
      title: app.data["Attachment Section"],
      className: "panel-info",
      rows: [
        {
          fields: [
            { "id": "AttachmentText", "title": "", "type": "html", "html": app.data["AttachmentText"], "className": "col-xs-12 col-md-12" },
            { "id": "Images", "prehelptext": app.data["ImagesText"], "title": app.data["Images"], "type": "html", "aria-label": "Dropzone File Upload Control Field for Images", "html": '<section aria-label="File Upload Control Field for Images" id="attachment"> <div class="dropzone" id="image_dropzone" aria-label="Dropzone File Upload Control for Images Section"></div></section>', "className": "col-xs-12 col-md-12" },
            { "id": "Documents", "prehelptext": app.data["DocumentsText"], "title": app.data["Documents"], "type": "html", "aria-label": "Dropzone File Upload Control Field for Documents", "html": '<section aria-label="File Upload Control Field for Documents" id="attachment"> <div class="dropzone" id="document_dropzone" aria-label="Dropzone File Upload Control for Document Section"></div></section>', "className": "col-xs-12 col-md-12" },
            { "id": "DeclarationText", "title": "", "type": "html", "html": app.data["DeclarationText"], "className": "col-xs-12 col-md-12" },
            {
              id: "actionBar",
              type: "html",
              html: `<div className="col-xs-12 col-md-12"> <button class="btn btn-success" id="closebtn"><span class="glyphicon glyphicon-remove-sign" aria-hidden="true"></span>Close</button> <button class="btn btn-success" id="savebtn"><span class="glyphicon glyphicon-send" aria-hidden="true"></span> ` + config.button.submitReport + `</button>
                 </div>`
              //<button class="btn btn-success" id="printbtn"><span class="glyphicon glyphicon-print" aria-hidden="true"></span>Print</button>
              //
            },
            {
              id: "successFailRow",
              type: "html",
              className: "col-xs-12 col-md-12",
              html: `<div id="successFailArea" className="col-xs-12 col-md-12"></div>`
            }]

        }
      ]
    }
  ]
  return section;
}
function getAdminSectionsBottom() {
  let section = [
    {
      id: "hiddenSec",
      title: "",
      className: "panel-info",
      rows: [
        {
          fields: [
            {
              "id": "fid",
              "type": "html",
              "html": "<input type=\"text\" id=\"fid\" aria-label=\"Document ID\" aria-hidden=\"true\" name=\"fid\">",
              "class": "hidden"
            }, {
              "id": "action",
              "type": "html",
              "html": "<input type=\"text\" id=\"action\" aria-label=\"Action\" aria-hidden=\"true\" name=\"action\">",
              "class": "hidden"
            }, {
              "id": "createdBy",
              "type": "html",
              "html": "<input type=\"text\" id=\"createdBy\" aria-label=\"Complaint Created By\" aria-hidden=\"true\" name=\"createdBy\">",
              "class": "hidden"
            }, {
              "id": "recCreated",
              "type": "html",
              "html": "<input type=\"text\" id=\"recCreated\" aria-label=\"Record Creation Date\" aria-hidden=\"true\" name=\"recCreated\">",
              "class": "hidden"
            }, {
              "id": "lsteStatus",
              "type": "html",
              "html": "<input type=\"hidden\" aria-label=\"Status\" aria-hidden=\"true\" value=\"New\" id=\"lsteStatus\" name=\"lsteStatus\">",
              "class": "hidden"
            }, {
              "id": "AddressGeoID",
              "type": "html",
              "html": "<input type=\"hidden\" aria-label=\"Address Geo ID\" aria-hidden=\"true\" id=\"AddressGeoID\" name=\"AddressGeoID\">",
              "class": "hidden"
            }, {
              "id": "MapAddress",
              "type": "html",
              "html": "<input type=\"hidden\" aria-label=\"Map Address\" aria-hidden=\"true\" id=\"MapAddress\" name=\"MapAddress\">",
              "class": "hidden"
            }, {
              "id": "ShowMap",
              "type": "html",
              "html": "<input type=\"hidden\" aria-label=\"Show Map\" aria-hidden=\"true\" id=\"ShowMap\" name=\"ShowMap\">",
              "class": "hidden"
            }]

        }
      ]
    }
  ]
  return section;
}


