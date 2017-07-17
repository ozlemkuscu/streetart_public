//A sample main js file. Use this as a starting point for your app.
const app = new cot_app("StreetARToronto Artist Directory");
const configURL = "//www1.toronto.ca/static_files/WebApps/CommonComponents/streetart/JSONFeed.js";
const mailSend = false;

let form, config, httpHost;
//let upload_selector = 'admin_dropzone';

const form_id = "streetart";
let resumeDropzone;
let imageDropzone;

let repo = "streetart";

$(document).ready(function () {

  app.render(function () { initialize(); });
  function renderApp() {
    httpHost = detectHost();
    loadForm();
    app.setBreadcrumb(app.data['breadcrumbtrail']);
    app.addForm(form, 'top');
    resumeDropzone = new Dropzone("div#resume_dropzone", $.extend(config.admin.resumeDropzonePublic, {
      "dz_id": "resume_dropzone", "fid": fid, "form_id": form_id,
      "url": config.api_public.upload + config.default_repo + '/' + repo,
    }));

    imageDropzone = new Dropzone("div#image_dropzone", $.extend(config.admin.imageDropzonePublic, {
      "dz_id": "image_dropzone", "fid": fid, "form_id": form_id,
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
      title: 'Online Artist Application',
      useBinding: false,
      rootPath: config.httpHost.rootPath_public[httpHost],
      sections: getSubmissionSections(),
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

  $("#Status").val("New");

  $("#closebtn").click(function () { window.close(); });
  $("#printbtn").click(function () { window.print(); });
  $("#savebtn").click(function () {

    let form_fv = $('#' + form_id).data('formValidation');
    form_fv.validate();
    if (form_fv.isValid()) { submitForm() }
  });

  $(".dz-hidden-input").attr("aria-hidden", "true");
  $(".dz-hidden-input").attr("aria-label", "File Upload Control");

  //$("h1").hide();

}
function submitForm() {
  //  $("#savebtn").prop('disabled', true);
  let payload = form.getData();
  payload.resumeUploads = processUploads(resumeDropzone, repo, false);
  payload.imageUploads = processUploads(imageDropzone, repo, false);

  // let queryString = payload.resumeUploads[0] ? "?KeepFiles=" + payload.resumeUploads[0].bin_id : "";

  $.ajax({
    //   url: config.httpHost.app_public[httpHost] + config.api_public.post + repo + queryString,
    url: config.httpHost.app_public[httpHost] + config.api_public.post + repo + '?sid=' + getCookie('streetart.sid'),
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
        if (mailSend) {
          emailNotice(data.EventMessageResponse.Event.EventID, 'notify');
        }
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
            { "id": "FirstName", "title": app.data["First Name"], "className": "col-xs-12 col-md-6" },
            { "id": "LastName", "title": app.data["Last Name"], "className": "col-xs-12 col-md-6" },
            { "id": "ArtistAlias", "title": app.data["Artist Alias"], "className": "col-xs-12 col-md-6" },
            { "id": "Organization", "title": app.data["Organization"], "className": "col-xs-12 col-md-6" },
            {
              "id": "PreferredContactName",
              "title": app.data["Preferred Name"],
              "type": "radio",
              "className": "col-xs-12 col-md-6",
              "choices": config.preferredName.choices,
              "orientation": "horizontal",
              "prehelptext": app.data["PreferredNameText"]
            },
            { "id": "OrganizationDescription", "title": app.data["Artist Bio"], "type": "textarea", "className": "col-xs-12 col-md-12" },
            { "id": "Address", "title": app.data["Address"], "className": "col-xs-12 col-md-6" },
            { "id": "City", "title": app.data["City"], "className": "col-xs-12 col-md-6" },
            { "id": "Province", "title": app.data["Province"], "className": "col-xs-12 col-md-6" },
            { "id": "PostalCode", "title": app.data["Postal Code"], "className": "col-xs-12 col-md-6" },
            { "id": "PrimaryPhone", "title": app.data["Primary Phone"], "validationtype": "Phone", "className": "col-xs-12 col-md-6" },
            { "id": "OtherPhone", "title": app.data["Other Phone"], "validationtype": "Phone", "className": "col-xs-12 col-md-6" },
            { "id": "Email", "title": app.data["Email"], "validationtype": "Email", "validators": { regexp: { regexp: /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/, message: 'This field must be a valid email. (###@###.####)' } }, "className": "col-xs-12 col-md-6" },
            { "id": "URL", "title": app.data["URL"], "value": "http://", "className": "col-xs-12 col-md-6" }
          ]
        }, {
          fields: [
            {
              "id": "ContactMethod",
              "title": app.data["preferredMethod"],
              "type": "radio",
              "choices": config.preferredMethod.choices,
              "orientation": "horizontal",
              "className": "col-xs-12 col-md-6"
            }
          ]
        }
      ]
    },

    {
      id: "workSec",
      title: app.data["Work Details Section"],
      className: "panel-info",
      rows: [
        {
          fields: [
            { "id": "workToPublicText", "title": "", "type": "html", "html": app.data["WorkToPublicText"], "className": "col-xs-12 col-md-12" },
            {
              "id": "WorkToPublic",
              "orientation": "horizontal",
              "title": app.data["Work To Public"],
              "type": "radio",
              "value": "",
              "choices": config.choices.yesNoFull,
              "className": "col-xs-12 col-md-6"
            },
            { "id": "Profile", "prehelptext": app.data["ProfileText"], "title": app.data["Profile"], "type": "textarea", "className": "col-xs-12 col-md-12" },
            { "id": "IntNavail", "title": app.data["Availability"], "type": "textarea", "className": "col-xs-12 col-md-12" },
            { "id": "Exp", "title": app.data["Experience"], "type": "textarea", "className": "col-xs-12 col-md-12" },
            { "id": "WorkHistory", "title": app.data["Work History"], "type": "textarea", "className": "col-xs-12 col-md-12" }
          ]
        }
      ]
    },
    {
      id: "cvSec",
      title: app.data["CV Section"],
      className: "panel-info",
      rows: [
        {
          fields: [
            { "id": "chkCV", "title": "", "type": "checkbox", "choices": config.chkCVAvailable.choices, "orientation": "horizontal", "class": "col-xs-12 col-md-4", "className": "col-xs-12 col-md-12" },
            { "id": "CV", "title": app.data["CV"], "type": "html", "aria-label": "Dropzone File Upload Control Field for Resume", "html": '<section aria-label="File Upload Control Field for Resume" id="attachment"> <div class="dropzone" id="resume_dropzone" aria-label="Dropzone File Upload Control for Resume Section"></div></section>', "className": "col-xs-12 col-md-12" }
          ]
        }]
    },
    {
      id: "imageSec",
      title: app.data["Images Section"],
      className: "panel-info",
      rows: [
        {
          fields: [
            { "id": "Images", "prehelptext": app.data["ImagesText"], "title": app.data["Images"], "type": "html", "aria-label": "Dropzone File Upload Control Field for Images", "html": '<section aria-label="File Upload Control Field for Images" id="attachment"> <div class="dropzone" id="image_dropzone" aria-label="Dropzone File Upload Control for Images Section"></div></section>', "className": "col-xs-12 col-md-12" },
            { "id": "FooterText", "title": "", "type": "html", "html": app.data["FooterText1"], "className": "col-xs-12 col-md-12" },
            { "id": "FooterText", "title": "", "type": "html", "html": app.data["FooterText2"], "className": "col-xs-12 col-md-12" },
            { "id": "FooterText", "title": "", "type": "html", "html": app.data["FooterText3"], "className": "col-xs-12 col-md-12" },
            { "id": "chkDeclaration", "title": "", "type": "checkbox", "choices": config.chkDeclaration.choices, "orientation": "horizontal", "class": "col-xs-12 col-md-4", "className": "col-xs-12 col-md-12" },
            {
              id: "actionBar",
              type: "html",
              html: `<div className="col-xs-12 col-md-12"><button class="btn btn-success" id="savebtn"><span class="glyphicon glyphicon-send" aria-hidden="true"></span> ` + config.button.submitReport + `</button>
                 <button class="btn btn-success" id="printbtn"><span class="glyphicon glyphicon-print" aria-hidden="true"></span>Print</button></div>`
              //<button class="btn btn-success" id="printbtn"><span class="glyphicon glyphicon-print" aria-hidden="true"></span>Print</button>
              //
            },
            {
              id: "successFailRow",
              type: "html",
              className: "col-xs-12 col-md-12",
              html: `<div id="successFailArea" className="col-xs-12 col-md-12"></div>`
            },
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
              "html": "<input type=\"text\" id=\"complaintCreated\" aria-label=\"Complaint Creation Date\" aria-hidden=\"true\" name=\"complaintCreated\">",
              "class": "hidden"
            }, {
              "id": "lstStatus",
              "type": "html",
              "html": "<input type=\"hidden\" aria-label=\"Status\" aria-hidden=\"true\" id=\"lstStatus\" name=\"lstStatus\">",
              "class": "hidden"
            }]

        }
      ]
    }
  ]
  return section;
}
function emailNotice(fid, action) {
  let emailTo = {};
  let emailCaptain = config.captain_emails;
  let emailAdmin = config.admin_emails;
  if (typeof emailCaptain !== 'undefined' && emailCaptain != "") {
    $.extend(emailTo, emailCaptain);
  }
  if (typeof emailAdmin !== 'undefined' && emailAdmin != "") {
    //  $.extend(emailTo, emailAdmin);
  }

  var emailRecipients = $.map(emailTo, function (email) {
    return email;
  }).filter(function (itm, i, a) {
    return i === a.indexOf(itm);
  }).join(',');

  var payload = JSON.stringify({
    'emailTo': emailRecipients,
    'emailFrom': (config.messages.notify.emailFrom ? config.messages.notify.emailFrom : 'wmDev@toronto.ca'),
    'id': fid,
    'status': action,
    'body': (config.messages.notify.emailBody ? config.messages.notify.emailBody : 'New submission has been received.'),
    'emailSubject': (config.messages.notify.emailSubject ? config.messages.notify.emailSubject : 'New submission')
  });

  $.ajax({
    url: config.httpHost.app[httpHost] + config.api.email,
    type: 'POST',
    data: payload,
    headers: {
      'Content-Type': 'application/json; charset=utf-8;',
      'Cache-Control': 'no-cache'
    },
    dataType: 'json'
  }).done(function (data, textStatus, jqXHR) {
    if (action === 'notify') {
      hasher.setHash(fid + '?alert=success&msg=notify.done&ts=' + new Date().getTime());
    }
  }).fail(function (jqXHR, textStatus, error) {
    console.log("POST Request Failed: " + textStatus + ", " + error);
    if (action === 'notify') {
      hasher.setHash(fid + '?alert=danger&msg=notify.fail&ts=' + new Date().getTime());
    }
  });
}

CotForm.prototype.getData = function () {
  var data = {}, blanks = {}, rowIndexMap = {}; // {stringIndex: intIndex}
  $.each($('#' + this.cotForm.id).serializeArray(), function (i, o) {
    if (o.name.indexOf('row[') !== -1) {
      var sRowIndex = o.name.substring(o.name.indexOf('[') + 1, o.name.indexOf(']'));
      if (sRowIndex !== 'template') {
        var rows = data['rows'] || [];
        var iRowIndex = rowIndexMap[sRowIndex];
        if (iRowIndex === undefined) {
          rows.push({});
          iRowIndex = rows.length - 1;
          rowIndexMap[sRowIndex] = iRowIndex;
        }
        rows[iRowIndex][o.name.split('.')[1]] = o.value;
        data['rows'] = rows;
      }
    } else {
      if (data.hasOwnProperty(o.name)) {
        data[o.name] = $.makeArray(data[o.name]);
        data[o.name].push(o.value);
      } else {
        data[o.name] = o.value;
      }
    }
  });

  var _blanks = $('#' + this.cotForm.id + ' [name]')
  $.each(_blanks, function () {
    if (!data.hasOwnProperty(this.name)) {
      blanks[this.name] = '';
    }
  });
  return $.extend(data, blanks);
};
