var widgetId = Fliplet.Widget.getDefaultId();
var widgetData = Fliplet.Widget.getData(widgetId) || {};
var storeFeatures = widgetData.appFeatures.hasOwnProperty('appStores')
  && widgetData.appFeatures.appStores.google;
var mustReviewTos = widgetData.mustReviewTos;
var appName = '';
var organizationName = '';
var appIcon = '';
var appSettings = {};
var allAppData = [];
var appStoreSubmission = {};
var appStoreFirebaseFileField;
var enterpriseFirebaseFileField;
var previousAppStoreSubmission = {};
var enterpriseSubmission = {};
var previousEnterpriseSubmission = {};
var notificationSettings = {};
var appInfo;
var statusTableTemplate = $('#status-table-template').html();
var $statusAppStoreTableElement = $('.app-build-appstore-status-holder');
var $statusEnterpriseTableElement = $('.app-build-enterprise-status-holder');
var initLoad;
var userInfo;
var hasFolders = false;
var screenShotsMobile = [];
var screenShotsTablet = [];
var haveScreenshots = false;
var pushDataMap = {
  'fl-push-senderId': 'gcmSenderId',
  'fl-push-serverKey': 'gcmServerKey',
  'fl-push-projectId': 'gcmProjectId'
};
var formInputSelectors = [
  '#appStoreConfiguration :input',
  '#enterpriseConfiguration :input',
  '#pushConfiguration :input'
];

/* FUNCTIONS */

var createBundleId = function(bundleId) {
  return $.ajax({
    url: 'https://itunes.apple.com/lookup?bundleId=' + bundleId,
    dataType: 'jsonp'
  });
};

function incrementVersionNumber(versionNumber) {
  var splitNumber = versionNumber.split('.');
  var arrLength = splitNumber.length;

  while (arrLength--) {
    if (splitNumber[arrLength] < 99) {
      splitNumber[arrLength] = parseInt(splitNumber[arrLength], 10) + 1;
      break;
    }
  }

  return splitNumber.join('.');
}

function saveFirebaseSettings(origin) {
  var formData;

  if (origin === 'appStore' && appStoreFirebaseFileField && appStoreFirebaseFileField.files[0]) {
    formData = new FormData();

    formData.append('firebase', appStoreFirebaseFileField.files[0]);

    return setFirebaseConfigFile(appStoreSubmission.id, formData);
  }

  if (origin === 'enterprise' && enterpriseFirebaseFileField && enterpriseFirebaseFileField.files[0]) {
    formData = new FormData();

    formData.append('firebase', enterpriseFirebaseFileField.files[0]);

    return setFirebaseConfigFile(enterpriseSubmission.id, formData);
  }

  return Promise.resolve();
}

function setFirebaseConfigFile(id, file) {
  return Fliplet.API.request({
    method: 'PUT',
    url: 'v1/organizations/' + Fliplet.Env.get('organizationId') + '/credentials/submission-' + id + '?fileName=firebase',
    data: file,
    contentType: false,
    processData: false
  });
}

function incrementVersionCode(versionNumber) {
  var newVersionNumber = incrementVersionNumber(versionNumber);
  var splitNumber = newVersionNumber.split('.');
  var newVersionCode = splitNumber.join('') + '0';

  return newVersionCode;
}

function checkHasScreenshots() {
  haveScreenshots = hasFolders && screenShotsMobile.length && screenShotsTablet.length;
}

function addThumb(thumb) {
  var template = Fliplet.Widget.Templates['templates.thumbs'];

  return template(thumb);
}

function loadAppStoreData() {
  $('#appStoreConfiguration [name]').each(function(i, el) {
    var name = $(el).attr('name');

    /* APP SCREENSHOTS */
    if (name === 'fl-store-screenshots') {
      if (appStoreSubmission.data[name]) {
        $('[name="' + name + '"][value="' + appStoreSubmission.data[name] + '"]').prop('checked', true).trigger('change');
      } else {
        $('[name="' + name + '"][value="new"]').prop('checked', true).trigger('change');
      }

      return;
    }

    /* FEATURED GRAPHIC */
    if (name === 'fl-store-featuredGraphic') {
      $(el).parents('.fileUpload').next('.image-name').find('small').html((typeof appStoreSubmission.data[name] !== 'undefined') ? appStoreSubmission.data[name][0].name : '');

      return;
    }

    // Firebase
    if (name === 'fl-store-firebase') {
      return;
    }

    /* NOTIFICATION ICON */
    if (name === 'fl-store-notificationIcon') {
      if (appStoreSubmission.data[name]) {
        $(el).parents('.fileUpload').next('.image-name').find('small').html((typeof appStoreSubmission.data[name] !== 'undefined') ? appStoreSubmission.data[name][0].name : '');
      }

      return;
    }

    /* ADD BUNDLE ID */
    if (name === 'fl-store-bundleId' && typeof appStoreSubmission.data[name] === 'undefined') {
      var bundleId = 'com.' + _.camelCase(organizationName) + '.' + _.camelCase(appName);

      createBundleId(bundleId).then(function(response) {
        if (response.resultCount === 0) {
          $('.bundleId-store-text').html(bundleId);
          $('[name="' + name + '"]').val(bundleId);
        } else {
          $('.bundleId-store-text').html(bundleId + (response.resultCount + 1));
          $('[name="' + name + '"]').val(bundleId + (response.resultCount + 1));
        }
      });

      return;
    }

    if (name === 'fl-store-bundleId' && typeof appStoreSubmission.data[name] !== 'undefined') {
      $('.bundleId-store-text').html(appStoreSubmission.data[name]);
      $('[name="' + name + '"]').val(appStoreSubmission.data[name]);

      return;
    }

    if (name === 'fl-store-versionNumber') {
      if (typeof appStoreSubmission.data[name] !== 'undefined' && appStoreSubmission.data[name] !== '') {
        $('[name="' + name + '"]').val(appStoreSubmission.data[name]);
        $('[name="fl-store-versionNumber"]').data('validation-version-number', appStoreSubmission.data[name]);
      } else if (typeof appStoreSubmission.previousResults !== 'undefined' && typeof appStoreSubmission.previousResults.versionNumber !== 'undefined' && appStoreSubmission.previousResults.versionNumber !== '') {
        $('[name="' + name + '"]').val(appStoreSubmission.previousResults.versionNumber);
        $('[name="fl-store-versionNumber"]').data('validation-version-number', appStoreSubmission.previousResults.versionNumber);
      } else {
        $('[name="' + name + '"]').val('1.0.0');
      }

      return;
    }

    if (name === 'fl-store-versionCode') {
      if (typeof appStoreSubmission.data[name] !== 'undefined' && appStoreSubmission.data[name] !== '') {
        $('[name="' + name + '"]').val(appStoreSubmission.data[name]);
        $('[name="fl-store-versionCode"]').data('validation-version-code-type', appStoreSubmission.data[name]);
      } else if (typeof appStoreSubmission.previousResults !== 'undefined' && typeof appStoreSubmission.previousResults.versionCode !== 'undefined' && appStoreSubmission.previousResults.versionCode !== '') {
        $('[name="' + name + '"]').val(appStoreSubmission.previousResults.versionCode);
        $('[name="fl-store-versionCode"]').data('validation-version-code-type', enterpriseSubmission.previousResults.versionCode);
      } else {
        $('[name="' + name + '"]').val('1000');
      }

      return;
    }

    $('[name="' + name + '"]').val((typeof appStoreSubmission.data[name] !== 'undefined') ? appStoreSubmission.data[name] : '');
  });

  if (appIcon) {
    if (appSettings.splashScreen && appSettings.splashScreen.size && (appSettings.splashScreen.size[0] && appSettings.splashScreen.size[1]) < 2732) {
      $('.app-details-appStore .app-splash-screen').addClass('has-warning');
    }

    allAppData.push('appStore');
  } else {
    $('.app-details-appStore').addClass('required-fill');

    if (!appIcon) {
      $('.app-details-appStore .app-icon-name').addClass('has-error');
    }

    if (appSettings.splashScreen && appSettings.splashScreen.size && (appSettings.splashScreen.size[0] && appSettings.splashScreen.size[1]) < 2732) {
      $('.app-details-appStore .app-splash-screen').addClass('has-warning');
    }
  }

  checkHasScreenshots();

  if (!haveScreenshots) {
    $('[data-item="fl-store-screenshots-new-warning"]').addClass('show');
    $('[data-item="fl-store-screenshots-new"]').removeClass('show');

    return;
  }

  if (haveScreenshots) {
    $('[data-item="fl-store-screenshots-new-warning"]').removeClass('show');
    $('[data-item="fl-store-screenshots-new"]').addClass('show');

    _.take(screenShotsMobile, 4).forEach(function(thumb) {
      $('.mobile-thumbs').append(addThumb(thumb));
    });

    _.take(screenShotsTablet, 4).forEach(function(thumb) {
      $('.tablet-thumbs').append(addThumb(thumb));
    });

    return;
  }
}

function checkFileExtension(fileName, element) {
  var regexp = /[^.]+$/;
  var fileExtension = fileName.match(regexp);
  var isCorrectExtension = fileExtension ? fileExtension[0] : undefined;

  if (isCorrectExtension !== 'json') {
    $(element).val('');
    Fliplet.Modal.alert({
      title: 'Wrong file extension',
      message: 'Please select a .json file',
      size: 'small'
    });

    return false;
  }

  return true;
}

function loadEnterpriseData() {
  $('#enterpriseConfiguration [name]').each(function(i, el) {
    var name = $(el).attr('name');

    /* ADD BUNDLE ID */
    if (name === 'fl-ent-bundleId' && typeof enterpriseSubmission.data[name] === 'undefined') {
      var bundleId = 'com.' + _.camelCase(organizationName) + '.' + _.camelCase(appName);

      createBundleId(bundleId).then(function(response) {
        if (response.resultCount === 0) {
          $('.bundleId-apk-text').html(bundleId);
          $('[name="' + name + '"]').val(bundleId);
        } else {
          $('.bundleId-apk-text').html(bundleId + (response.resultCount + 1));
          $('[name="' + name + '"]').val(bundleId + (response.resultCount + 1));
        }
      });

      return;
    }

    if (name === 'fl-ent-bundleId' && typeof enterpriseSubmission.data[name] !== 'undefined') {
      $('.bundleId-apk-text').html(enterpriseSubmission.data[name]);
      $('[name="' + name + '"]').val(enterpriseSubmission.data[name]);

      return;
    }

    // Firebase
    if (name === 'fl-ent-firebase') {
      return;
    }

    /* NOTIFICATION ICON */
    if (name === 'fl-ent-notificationIcon') {
      if (enterpriseSubmission.data[name]) {
        $(el).parents('.fileUpload').next('.image-name').find('small').html((typeof enterpriseSubmission.data[name] !== 'undefined') ? enterpriseSubmission.data[name][0].name : '');
      }

      return;
    }

    if (name === 'fl-ent-versionNumber') {
      if (typeof enterpriseSubmission.data[name] !== 'undefined' && enterpriseSubmission.data[name] !== '') {
        $('[name="' + name + '"]').val(enterpriseSubmission.data[name]);
        $('[name="fl-ent-versionNumber"]').data('validation-version-number', enterpriseSubmission.data[name]);
      } else if (typeof enterpriseSubmission.previousResults !== 'undefined' && typeof enterpriseSubmission.previousResults.versionNumber !== 'undefined' && enterpriseSubmission.previousResults.versionNumber !== '') {
        $('[name="' + name + '"]').val(enterpriseSubmission.previousResults.versionNumber);
        $('[name="fl-ent-versionNumber"]').data('validation-version-number', enterpriseSubmission.previousResults.versionNumber);
      } else {
        $('[name="' + name + '"]').val('1.0.0');
      }

      return;
    }

    if (name === 'fl-ent-versionCode') {
      if (typeof enterpriseSubmission.data[name] !== 'undefined' && enterpriseSubmission.data[name] !== '') {
        $('[name="' + name + '"]').val(enterpriseSubmission.data[name]);
        $('[name="fl-ent-versionCode"]').data('validation-version-code-type', enterpriseSubmission.data[name]);
      } else if (typeof enterpriseSubmission.previousResults !== 'undefined' && typeof enterpriseSubmission.previousResults.versionCode !== 'undefined' && enterpriseSubmission.previousResults.versionCode !== '') {
        $('[name="' + name + '"]').val(enterpriseSubmission.previousResults.versionCode);
        $('[name="fl-ent-versionCode"]').data('validation-version-code-type', enterpriseSubmission.previousResults.versionCode);
      } else {
        $('[name="' + name + '"]').val('1000');
      }

      return;
    }

    $('[name="' + name + '"]').val((typeof enterpriseSubmission.data[name] !== 'undefined') ? enterpriseSubmission.data[name] : '');
  });

  if (appIcon) {
    if (appSettings.splashScreen && appSettings.splashScreen.size && (appSettings.splashScreen.size[0] && appSettings.splashScreen.size[1]) < 2732) {
      $('.app-details-ent .app-splash-screen').addClass('has-warning');
    }

    allAppData.push('enterprise');
  } else {
    $('.app-details-ent').addClass('required-fill');

    if (!appIcon) {
      $('.app-details-ent .app-icon-name').addClass('has-error');
    }

    if (appSettings.splashScreen && appSettings.splashScreen.size && (appSettings.splashScreen.size[0] && appSettings.splashScreen.size[1]) < 2732) {
      $('.app-details-ent .app-splash-screen').addClass('has-warning');
    }
  }
}

function loadPushNotesData() {
  $('#pushConfiguration [name]').each(function(i, el) {
    var name = $(el).attr('name');

    if (!pushDataMap.hasOwnProperty(name)) {
      return;
    }

    /* ADDING NOTIFICATIONS SETTINGS */
    $(this).val(notificationSettings[pushDataMap[name]] || '');
  });
}

function submissionBuild(appSubmission, origin) {
  var newVersionNumber;
  var newVersionCode;

  saveFirebaseSettings(origin).then(function() {
    return Fliplet.App.Submissions.build(appSubmission.id);
  }).then(function(builtSubmission) {
    if (origin === 'appStore') {
      appStoreSubmission = builtSubmission.submission;

      // Auto increments the version number and saves the submission
      newVersionNumber = incrementVersionNumber(appStoreSubmission.data['fl-store-versionNumber']);

      $('[name="fl-store-versionNumber"]').val(newVersionNumber);

      newVersionCode = incrementVersionCode(appStoreSubmission.data['fl-store-versionNumber']);

      $('[name="fl-store-versionCode"]').val(newVersionCode);
      saveAppStoreData();
    }

    if (origin === 'enterprise') {
      enterpriseSubmission = builtSubmission.submission;

      // Auto increments the version number and saves the submission
      newVersionNumber = incrementVersionNumber(enterpriseSubmission.data['fl-ent-versionNumber']);

      $('[name="fl-ent-versionNumber"]').val(newVersionNumber);

      newVersionCode = incrementVersionCode(enterpriseSubmission.data['fl-ent-versionNumber']);

      $('[name="fl-ent-versionCode"]').val(newVersionCode);
      saveEnterpriseData();
    }

    Fliplet.Studio.emit('refresh-app-submissions');
    Fliplet.Studio.emit('app-launch', {
      platform: 'android',
      submissionType: origin
    });

    Fliplet.Modal.alert({
      title: 'Your request was sent successfully!',
      message: 'Your app is building!'
    }).then(function() {
      document.getElementById('nav-tabs').scrollIntoView({ behavior: 'smooth', block: 'start' });
    });

    $('.button-' + origin + '-request').html('Request App <i class="fa fa-paper-plane"></i>');
    $('.button-' + origin + '-request').prop('disabled', false);

    clearTimeout(initLoad);
    initialLoad(false, 0);

    Fliplet.Widget.autosize();
  }, function(err) {
    $('.button-' + origin + '-request').html('Request App <i class="fa fa-paper-plane"></i>');
    $('.button-' + origin + '-request').prop('disabled', false);
    Fliplet.Modal.alert({
      message: Fliplet.parseError(err)
    });
  });
}

function save(origin, submission) {
  return Fliplet.App.Submissions.get()
    .then(function(submissions) {
      var savedSubmission = _.find(submissions, function(sub) {
        return sub.id === submission.id;
      });

      submission = _.extend(savedSubmission, submission);

      return Promise.resolve();
    })
    .then(function() {
      if (submission.status !== 'started') {
        return Fliplet.App.Submissions.create({
          platform: 'android',
          data: $.extend(true, submission.data, {
            previousResults: submission.result
          })
        })
          .then(function(newSubmission) {
            if (origin === 'appStore') {
              appStoreSubmission = newSubmission;
            }

            if (origin === 'enterprise') {
              enterpriseSubmission = newSubmission;
            }

            Fliplet.App.Submissions.update(newSubmission.id, newSubmission.data).then(function() {
              $('.save-' + origin + '-progress').addClass('saved').hide().fadeIn(250);
              Fliplet.Widget.autosize();

              setTimeout(function() {
                $('.save-' + origin + '-progress').fadeOut(250, function() {
                  $('.save-' + origin + '-progress').removeClass('saved');
                  Fliplet.Widget.autosize();
                });
              }, 4000);
            });
          });
      }

      Fliplet.App.Submissions.update(submission.id, submission.data).then(function() {
        $('.save-' + origin + '-progress').addClass('saved').hide().fadeIn(250);
        Fliplet.Widget.autosize();

        setTimeout(function() {
          $('.save-' + origin + '-progress').fadeOut(250, function() {
            $('.save-' + origin + '-progress').removeClass('saved');
            Fliplet.Widget.autosize();
          });
        }, 4000);
      });
    })
    .catch(function(err) {
      Fliplet.Modal.alert({
        message: Fliplet.parseError(err)
      });
    });
}

function requestBuild(origin, submission) {
  $('.button-' + origin + '-request').html('Requesting <i class="fa fa-spinner fa-pulse fa-fw"></i>');

  if (origin === 'appStore') {
    submission.data.folderStructure = appSettings.folderStructure;
  }

  var defaultSplashScreenData = {
    'url': $('[data-' + origin.toLowerCase() + '-default-splash-url]').data(origin.toLowerCase() + '-default-splash-url')
  };

  submission.data.splashScreen = appSettings.splashScreen ? appSettings.splashScreen : defaultSplashScreenData;
  submission.data.appIcon = appIcon;
  submission.data.legacyBuild = appSettings.legacyBuild || false;

  return Fliplet.App.Submissions.get()
    .then(function(submissions) {
      var savedSubmission = _.find(submissions, function(sub) {
        return sub.id === submission.id;
      });

      submission = _.extend(savedSubmission, submission);

      return Promise.resolve();
    })
    .then(function() {
      if (submission.status !== 'started') {
        return Fliplet.App.Submissions.create({
          platform: 'android',
          data: $.extend(true, submission.data, {
            previousResults: submission.result
          })
        })
          .then(function(newSubmission) {
            if (origin === 'appStore') {
              appStoreSubmission = newSubmission;
            }

            if (origin === 'enterprise') {
              enterpriseSubmission = newSubmission;
            }

            submissionBuild(newSubmission, origin);
          });
      }

      Fliplet.App.Submissions.update(submission.id, submission.data).then(function() {
        submissionBuild(submission, origin);
      });
    })
    .catch(function(err) {
      $('.button-' + origin + '-request').html('Request App <i class="fa fa-paper-plane"></i>');
      $('.button-' + origin + '-request').prop('disabled', false);
      Fliplet.Modal.alert({
        message: Fliplet.parseError(err)
      });
    });
}

function saveAppStoreData(request) {
  var data = appStoreSubmission.data || {};
  var pushData = notificationSettings;
  var uploadFilePromise = Promise.resolve();

  $('#appStoreConfiguration [name]').each(function(idx, el) {
    var name = $(el).attr('name');
    var value = $(el).val();

    if (typeof value === 'string') {
      value = value.trim();
    }

    if (name === 'fl-store-bundleId') {
      pushData.gcmPackageName = value;
      data[name] = value;

      return;
    }

    if ($(el).attr('type') === 'file') {
      var fileList = el.files;
      var file = new FormData();

      if (fileList.length > 0) {
        for (var i = 0; i < fileList.length; i++) {
          file.append(name, fileList[i]);
        }

        uploadFilePromise = Fliplet.Media.Files.upload({
          data: file,
          appId: Fliplet.Env.get('appId')
        }).then(function(files) {
          data[name] = files;

          return Promise.resolve();
        });
      }

      return;
    }

    data[name] = value;
  });

  if (!_.isUndefined(previousAppStoreSubmission)) {
    data['previousResults'] = previousAppStoreSubmission.result;
  }

  return uploadFilePromise.then(function() {
    appStoreSubmission.data = data;
    notificationSettings = pushData;

    savePushData(true);

    if (request) {
      if (!storeFeatures.public) {
        Fliplet.Studio.emit('overlay', {
          name: 'app-settings',
          options: {
            size: 'large',
            title: 'App Settings',
            appId: Fliplet.Env.get('appId'),
            section: 'appBilling',
            helpLink: 'https://help.fliplet.com/app-settings/'
          }
        });
  
        Fliplet.Studio.emit('track-event', {
          category: 'app_billing',
          action: 'open',
          context: 'google_launch'
        });

        return;
      } else {
        return requestBuild('appStore', appStoreSubmission);
      }
    }
    
    return save('appStore', appStoreSubmission);
  });
}

function saveEnterpriseData(request) {
  var data = enterpriseSubmission.data || {};
  var uploadFilePromise = Promise.resolve();

  $('#enterpriseConfiguration [name]').each(function(idx, el) {
    var name = $(el).attr('name');
    var value = $(el).val();

    if (typeof value === 'string') {
      value = value.trim();
    }

    if ($(el).attr('type') === 'file') {
      var fileList = el.files;
      var file = new FormData();

      if (fileList.length > 0) {
        for (var i = 0; i < fileList.length; i++) {
          file.append(name, fileList[i]);
        }

        uploadFilePromise = Fliplet.Media.Files.upload({
          data: file,
          appId: Fliplet.Env.get('appId')
        }).then(function(files) {
          data[name] = files;

          return Promise.resolve();
        });
      }

      return;
    }

    data[name] = value;
  });

  if (!_.isUndefined(previousEnterpriseSubmission)) {
    data['previousResults'] = previousEnterpriseSubmission.result;
  }

  return uploadFilePromise.then(function() {
    enterpriseSubmission.data = data;

    savePushData(true);

    if (request) {
      if (!storeFeatures.private) {
        Fliplet.Studio.emit('overlay', {
          name: 'app-settings',
          options: {
            size: 'large',
            title: 'App Settings',
            appId: Fliplet.Env.get('appId'),
            section: 'appBilling',
            helpLink: 'https://help.fliplet.com/app-settings/'
          }
        });
  
        Fliplet.Studio.emit('track-event', {
          category: 'app_billing',
          action: 'open',
          context: 'google_launch'
        });

        return;
      } else {
        return requestBuild('enterprise', enterpriseSubmission);
      }
    }

    return save('enterprise', enterpriseSubmission);
  });
}

function savePushData(silentSave) {
  var data = notificationSettings || {};

  $('#pushConfiguration [name]').each(function(i, el) {
    var name = $(el).attr('name');

    if (!pushDataMap.hasOwnProperty(name)) {
      return;
    }

    var value = $(el).val();

    if (typeof value === 'string') {
      value = value.trim();
    }

    data[pushDataMap[name]] = value;
  });

  data.gcm = !!((data.gcmSenderId && data.gcmSenderId !== '') && (data.gcmServerKey && data.gcmServerKey !== ''));

  notificationSettings = data;

  Fliplet.API.request({
    method: 'PUT',
    url: 'v1/widget-instances/com.fliplet.push-notifications?appId=' + Fliplet.Env.get('appId'),
    data: notificationSettings
  }).then(function() {
    $('.save-push-progress').addClass('saved');

    if (!silentSave && (typeof appStoreSubmission.data['fl-store-bundleId'] === 'undefined' || typeof enterpriseSubmission.data['fl-ent-bundleId'] === 'undefined')) {
      Fliplet.Modal.alert({
        message: 'For notifications to work, you will need to fill in the Bundle ID field and request an app.'
      });
    }

    setTimeout(function() {
      $('.save-push-progress').removeClass('saved');
    }, 4000);
  });
}

function saveProgressOnClose() {
  var savingFunctions = {
    'appstore-control': saveAppStoreData,
    'fliplet-signed-control': saveEnterpriseData
  };

  // Finding out active tab to use correct save method
  var activeTabId = $('.nav.nav-tabs li.active').prop('id');

  return savingFunctions[activeTabId]();
}

function init() {
  Fliplet.Apps.get().then(function(apps) {
    appInfo = _.find(apps, function(app) {
      return app.id === Fliplet.Env.get('appId');
    });
  });

  $('#fl-store-keywords').tokenfield();

  /* APP ICON */
  if (appIcon) {
    $('.setting-app-icon.userUploaded').attr('src', appIcon);
    $('.setting-app-icon.userUploaded').removeClass('hidden');
    $('.setting-app-icon.default').addClass('hidden');
  }

  /* APP SPLASH SCREEN */
  if (appSettings.splashScreen) {
    $('.setting-splash-screen.userUploaded').css('background-image', 'url(' + appSettings.splashScreen.url + ')');
    $('.setting-splash-screen.userUploaded').removeClass('hidden');
    $('.setting-splash-screen.default').addClass('hidden');
  }

  loadAppStoreData();
  loadEnterpriseData();
  loadPushNotesData();
  Fliplet.Widget.autosize();
}

/* AUX FUNCTIONS */
function checkGroupErrors() {
  $('.has-error').each(function(i, el) {
    $(el).parents('.panel-default').addClass('required-fill');
  });

  $('.panel-default').each(function(i, el) {
    var withError = $(el).find('.has-error').length;

    if (withError === 0) {
      $(el).not('.app-details-appStore, .app-details-ent, .app-details-ent').removeClass('required-fill');
    }
  });
}

/* ATTACH LISTENERS */

$('[data-toggle="tooltip"]').tooltip({
  title: function() {
    var tooltipText = $(this).text();

    if (tooltipText.length < 41) {
      return;
    }

    return tooltipText;
  },
  delay: { show: 500, hide: 300 }
});

$('[name="submissionType"]').on('change', function() {
  var selectedOptionId = $(this).attr('id');

  $('.fl-sb-panel').removeClass('show');
  $('.' + selectedOptionId).addClass('show');

  Fliplet.Widget.autosize();
});

$('#fl-store-firebase').on('change', function() {
  var fileName = this.value.replace(/\\/g, '/').replace(/.*\//, '');
  var fileExtension = checkFileExtension(fileName, this);

  if (!fileExtension) {
    return;
  }

  appStoreFirebaseFileField = this;

  if (this.files && this.files[0]) {
    $('#fl-store-firebase-uploaded').html('File uploaded: <strong>' + fileName + '</strong>').removeClass('hidden');
    $('#fl-store-firebase-status').html('Enabled').addClass('analytic-enabled');
  }
});

$('#fl-ent-firebase').on('change', function() {
  var fileName = this.value.replace(/\\/g, '/').replace(/.*\//, '');
  var fileExtension = checkFileExtension(fileName, this);

  if (!fileExtension) {
    return;
  }

  enterpriseFirebaseFileField = this;

  if (this.files && this.files[0]) {
    $('#fl-ent-firebase-uploaded').html('File uploaded: <strong>' + fileName + '</strong>').removeClass('hidden');
    $('#fl-ent-firebase-status').html('Enabled').addClass('analytic-enabled');
  }
});

$('.fl-sb-appStore [change-bundleid], .fl-sb-fliplet-signed [change-bundleid]').on('click', function() {
  Fliplet.Modal.confirm({
    message: 'Are you sure you want to change the unique Bundle ID?'
  }).then(function(confirmed) {
    if (!confirmed) {
      return;
    }

    $('.fl-bundleId-holder').addClass('hidden');
    $('.fl-bundleId-field').addClass('show');

    Fliplet.Widget.autosize();
  });
});

$('.panel-group').on('shown.bs.collapse', '.panel-collapse', function() {
  Fliplet.Widget.autosize();
})
  .on('hidden.bs.collapse', '.panel-collapse', function() {
    Fliplet.Widget.autosize();
  });

$('a[data-toggle="tab"]').on('shown.bs.tab', function() {
  Fliplet.Widget.autosize();
})
  .on('hidden.bs.tab', function() {
    Fliplet.Widget.autosize();
  });

$('[name="fl-store-keywords"]').on('tokenfield:createtoken', function(e) {
  var currentValue = e.currentTarget.value.replace(/,\s+/g, ',');
  var newValue = e.attrs.value;
  var oldAndNew = currentValue + ',' + newValue;

  if (oldAndNew.length > 100) {
    e.preventDefault();
  }
});

$('input[type="file"]').on('change', function() {
  // To avoid console error added check for the needed key
  var $element = $(this);
  var file = $element[0].files[0];

  $element.parents('.fileUpload').next('.image-name').find('small').html(file ? file.name : '');
});

$('.redirectToSettings, [data-change-settings]').on('click', function(event) {
  event.preventDefault();

  saveProgressOnClose().then(function() {
    Fliplet.Studio.emit('close-overlay', {
      name: 'publish-google'
    });

    Fliplet.Studio.emit('overlay', {
      name: 'app-settings',
      options: {
        size: 'large',
        title: 'App Settings',
        section: 'appSettingsGeneral',
        appId: Fliplet.Env.get('appId')
      }
    });
  }).catch(function(error) {
    Fliplet.Modal.alert({
      message: Fliplet.parseError(error)
    });
  });
});

$('[data-change-assets]').on('click', function(event) {
  event.preventDefault();

  saveProgressOnClose().then(function() {
    Fliplet.Studio.emit('close-overlay', {
      name: 'publish-google'
    });

    Fliplet.Studio.emit('overlay', {
      name: 'app-settings',
      options: {
        size: 'large',
        title: 'App Settings',
        section: 'launchAssets',
        appId: Fliplet.Env.get('appId')
      }
    });
  }).catch(function(error) {
    Fliplet.Modal.alert({
      message: Fliplet.parseError(error)
    });
  });
});

$('[name="fl-store-type"]').on('change', function() {
  if ($(this).val() === 'Games') {
    $('[for="fl-store-category-application"]').addClass('hidden');
    $('[for="fl-store-category-application"]').find('select').prop('required', false);
    $('[for="fl-store-category-games"]').removeClass('hidden');
    $('[for="fl-store-category-games"]').find('select').prop('required', true);
  } else {
    $('[for="fl-store-category-games"]').addClass('hidden');
    $('[for="fl-store-category-games"]').find('select').prop('required', false);
    $('[for="fl-store-category-application"]').removeClass('hidden');
    $('[for="fl-store-category-application"]').find('select').prop('required', true);
  }
});

$('#appStoreConfiguration, #enterpriseConfiguration').on('validated.bs.validator', function() {
  checkGroupErrors();
  Fliplet.Widget.autosize();
});

$('form').validator({
  custom: {
    'validation-version-number': function($el) {
      var previosVersion = $el.data('validation-version-number');
      var newVersion = $el.val();
      var versionRegExp = /^\d{1,}\.\d{1,}\.\d{1,}$/;

      if (!previosVersion || !$el.val() || !versionRegExp.test(newVersion)) {
        return false;
      }

      var segmentedOldVersion = previosVersion.split('.');
      var segmentedNewVersion = newVersion.split('.');

      for (var i = 0; i < segmentedNewVersion.length; i++) {
        var a = parseInt(segmentedNewVersion[i], 10) || 0;
        var b = parseInt(segmentedOldVersion[i], 10) || 0;

        if (a > b) {
          return false;
        }

        if (a < b) {
          $el.attr('data-validation-version-number-error', 'Please make sure the version number is higher than ' + $el.data('validation-version-number'));

          return true;
        }
      }

      $el.attr('data-validation-version-number-error', 'Please make sure the version number is higher than ' + $el.data('validation-version-number'));

      return true;
    },
    'validation-version-number-type': function($el) {
      var newVersion = $el.val();
      var versionRegExp = /[^\d\.]/;

      if (versionRegExp.test(newVersion) && newVersion.length > 4) {
        $el.attr('data-validation-version-number-type-error', 'Please make sure the app version is a number');

        return true;
      }

      return false;
    },
    'validation-version-code': function($el) {
      var newCode = $el.val();
      var codeRegExp = /[^\d]/;

      if (codeRegExp.test(newCode)) {
        $el.attr('data-validation-version-code-error', 'Please make sure the app version code is a number');

        return true;
      }

      return false;
    },
    'validation-version-code-type': function($el) {
      var previosVersionCode = $el.data('validation-version-code-type');
      var newVersionCode = $el.val();
      var versionRegExp = /[^\d]/;

      if (!previosVersionCode || !$el.val() || versionRegExp.test(newVersionCode)) {
        return false;
      }

      if (previosVersionCode < newVersionCode) {
        return false;
      }

      if (previosVersionCode > newVersionCode) {
        $el.attr('data-validation-version-code-type-error', 'Please make sure the version code is higher than ' + $el.data('validation-version-code-type'));

        return true;
      }

      $el.attr('data-validation-version-code-type-error', 'Please make sure the version code is higher than ' + $el.data('validation-version-code-type'));

      return true;
    }
  }
});

$('#appStoreConfiguration').validator().on('submit', function(event) {
  if (!storeFeatures.public) {
    Fliplet.Studio.emit('overlay', {
      name: 'app-settings',
      options: {
        size: 'large',
        title: 'App Settings',
        appId: Fliplet.Env.get('appId'),
        section: 'appBilling',
        helpLink: 'https://help.fliplet.com/app-settings/'
      }
    });

    Fliplet.Studio.emit('track-event', {
      category: 'app_billing',
      action: 'open',
      context: 'google_launch'
    });

    return;
  }

  if (event.isDefaultPrevented()) {
    // Gives time to Validator to apply classes
    setTimeout(checkGroupErrors, 0);
    Fliplet.Modal.alert({
      message: 'Please fill in all the required information.'
    });

    return;
  }

  event.preventDefault();

  if (mustReviewTos) {
    Fliplet.Studio.emit('onMustReviewTos');

    return;
  }

  if (appInfo && appInfo.productionAppId) {
    if (allAppData.indexOf('appStore') > -1) {
      var message = 'Are you sure you wish to update your published app?';

      if (appStoreSubmission.status === 'started') {
        message = 'Are you sure you wish to request your app to be published?';
      }

      Fliplet.Modal.confirm({
        message: message
      }).then(function(confirmed) {
        if (!confirmed) {
          return;
        }

        saveAppStoreData(true);
      });
    } else {
      Fliplet.Modal.alert({
        message: 'Please configure your App Settings to contain the required information.'
      });
    }
  } else {
    $('.button-appStore-request').html('Please wait <i class="fa fa-spinner fa-pulse fa-fw"></i>');
    $('.button-appStore-request').prop('disabled', true);
    publishApp('appStore');
  }

  // Gives time to Validator to apply classes
  setTimeout(checkGroupErrors, 0);
});

$('#enterpriseConfiguration').validator().on('submit', function (event) {
  if (!storeFeatures.private) {
    Fliplet.Studio.emit('overlay', {
      name: 'app-settings',
      options: {
        size: 'large',
        title: 'App Settings',
        appId: Fliplet.Env.get('appId'),
        section: 'appBilling',
        helpLink: 'https://help.fliplet.com/app-settings/'
      }
    });

    Fliplet.Studio.emit('track-event', {
      category: 'app_billing',
      action: 'open',
      context: 'google_launch'
    });

    return;
  }

  if (event.isDefaultPrevented()) {
    // Gives time to Validator to apply classes
    setTimeout(checkGroupErrors, 0);
    Fliplet.Modal.alert({
      message: 'Please fill in all the required information.'
    });

    return;
  }

  event.preventDefault();

  if (mustReviewTos) {
    Fliplet.Studio.emit('onMustReviewTos');

    return;
  }

  if (appInfo && appInfo.productionAppId) {
    if (allAppData.indexOf('enterprise') > -1) {
      var message = 'Are you sure you wish to update your published app?';

      if (enterpriseSubmission.status === 'started') {
        message = 'Are you sure you wish to request your app to be published?';
      }

      Fliplet.Modal.confirm({
        message: message
      }).then(function(confirmed) {
        if (!confirmed) {
          return;
        }

        saveEnterpriseData(true);
      });
    } else {
      Fliplet.Modal.alert({
        message: 'Please configure your App Settings to contain the required information.'
      });
    }
  } else {
    $('.button-enterprise-request').html('Please wait <i class="fa fa-spinner fa-pulse fa-fw"></i>');
    $('.button-enterprise-request').prop('disabled', true);
    publishApp('enterprise');
  }

  // Gives time to Validator to apply classes
  setTimeout(checkGroupErrors, 0);
});

/* SAVE PROGRESS CLICK */
$('[data-app-store-save]').on('click', function() {
  saveAppStoreData();
});
$('[data-enterprise-save]').on('click', function() {
  saveEnterpriseData();
});
$('[data-push-save]').on('click', function() {
  savePushData();
});

// Scroll accordion tab to the top
$('.panel-collapse').on('shown.bs.collapse', function() {
  var $panel = $(this).closest('.panel');

  if (!$panel || !$panel.offset()) {
    return;
  }

  Fliplet.Studio.emit('scrollOverlayTo', $panel.offset().top);
});

$(document).on('click', '[data-cancel-build-id]', function() {
  var buildId = $(this).data('cancel-build-id');

  Fliplet.API.request({
    method: 'DELETE',
    url: 'v1/apps/' + Fliplet.Env.get('appId') + '/submissions/' + buildId
  })
    .then(function() {
      clearTimeout(initLoad);
      initialLoad(false, 0);
    });
});

$('.browse-files').on('click', function(e) {
  e.preventDefault();

  Fliplet.Studio.emit('overlay', {
    name: 'widget',
    options: {
      size: 'large',
      package: 'com.fliplet.file-manager',
      title: 'File Manager',
      classes: 'data-source-overlay',
      data: {
        context: 'overlay',
        appId: Fliplet.Env.get('appId')
      }
    }
  });
});

/* INIT */
$('#appStoreConfiguration, #enterpriseConfiguration').validator().off('change.bs.validator input.bs.validator change.bs.validator focusout.bs.validator');
$('[name="submissionType"][value="appStore"]').prop('checked', true).trigger('change');

function publishApp(context) {
  var options = {
    release: {
      type: 'silent',
      changelog: 'Initial version'
    }
  };

  return Fliplet.API.request({
    method: 'POST',
    url: 'v1/apps/' + Fliplet.Env.get('appId') + '/publish',
    data: options
  }).then(function(response) {
    // Update appInfo
    appInfo.productionAppId = response.app.id;

    switch (context) {
      case 'appStore':
        $('.button-appStore-request').html('Request App <i class="fa fa-paper-plane"></i>');
        $('.button-appStore-request').prop('disabled', false);
        $('#appStoreConfiguration').validator().trigger('submit');
        break;
      case 'enterprise':
        $('.button-enterprise-request').html('Request App <i class="fa fa-paper-plane"></i>');
        $('.button-enterprise-request').prop('disabled', false);
        $('#enterpriseConfiguration').validator().trigger('submit');
        break;
      default:
        break;
    }
  }).catch(function(err) {
    $('.button-appStore-request, .button-enterprise-request').prop('disabled', false);

    Fliplet.Modal.alert({ message: Fliplet.parseError(err) });

    return Promise.reject(err);
  });
}

function compileStatusTable(withData, origin, buildsData) {
  if (withData) {
    var template = Handlebars.compile(statusTableTemplate);
    var html = template(buildsData);

    if (origin === 'appStore') {
      $statusAppStoreTableElement.html(html);
    }

    if (origin === 'enterprise') {
      $statusEnterpriseTableElement.html(html);
    }
  } else {
    if (origin === 'appStore') {
      $statusAppStoreTableElement.html('');
    }

    if (origin === 'enterprise') {
      $statusEnterpriseTableElement.html('');
    }
  }

  Fliplet.Widget.autosize();
}

function fileIsBundle(file) {
  return file.contentType === 'application/x-authorware-bin';
}

function fileIsAPK(file) {
  return file.contentType === 'application/vnd.android.package-archive';
}

function checkSubmissionStatus(origin, googleSubmissions) {
  var submissionsToShow = _.filter(googleSubmissions, function(submission) {
    return submission.status === 'queued' || submission.status === 'submitted' || submission.status === 'processing' || submission.status === 'completed' || submission.status === 'failed' || submission.status === 'cancelled' || submission.status === 'ready-for-testing' || submission.status === 'tested';
  });

  var buildsData = [];

  if (submissionsToShow.length) {
    submissionsToShow.forEach(function(submission) {
      var build = {};
      var appBuild;
      var appBundle;
      var debugApp;

      // Default copy for testing status for different users
      if (submission.status === 'ready-for-testing') {
        if (userInfo && userInfo.user && (userInfo.user.isAdmin || userInfo.user.isImpersonating)) {
          // Fliplet users
          build.testingStatus = 'Ready for testing';
          build.testingMessage = 'App is ready for testing';
        } else {
          // Normal users
          build.testingStatus = 'In testing';
          build.testingMessage = 'Your app is being tested by Fliplet';
        }
      }

      if (submission.result.appBuild && submission.result.appBuild.files) {
        appBuild = _.find(submission.result.appBuild.files, function(file) {
          return fileIsAPK(file);
        });
      } else if (submission.data.previousResults && submission.data.previousResults.appBuild && submission.data.previousResults.appBuild.files) {
        appBuild = _.find(submission.data.previousResults.appBuild.files, function(file) {
          return fileIsAPK(file);
        });
      }

      if (submission.result.appBundle && submission.result.appBundle.files) {
        appBundle = _.find(submission.result.appBundle.files, function(file) {
          return fileIsBundle(file);
        });
      }

      if (submission.result.debugApp && submission.result.debugApp.files) {
        debugApp = _.find(submission.result.debugApp.files, function(file) {
          return fileIsAPK(file);
        });
      } else if (submission.data.previousResults && submission.data.previousResults.debugApp && submission.data.previousResults.debugApp.files) {
        debugApp = _.find(submission.data.previousResults.debugApp.files, function(file) {
          return fileIsAPK(file);
        });
      }

      build.id = submission.id;
      build.updatedAt = ((submission.status === 'completed' || submission.status === 'failed' || submission.status === 'cancelled' || submission.status === 'ready-for-testing' || submission.status === 'tested') && submission.updatedAt) ?
        moment(submission.updatedAt).format('MMM Do YYYY, h:mm:ss a') :
        '';
      build.submittedAt = ((submission.status === 'queued' || submission.status === 'submitted') && submission.submittedAt) ?
        moment(submission.submittedAt).format('MMM Do YYYY, h:mm:ss a') :
        '';
      build[submission.status] = true;
      build.fileUrl = appBuild ? appBuild.url : '';
      build.bundleUrl = appBundle ? appBundle.url : '';

      if (userInfo && userInfo.user && (userInfo.user.isAdmin || userInfo.user.isImpersonating)) {
        build.debugFileUrl = debugApp ? debugApp.url : '';
      }

      buildsData.push(build);
    });

    compileStatusTable(true, origin, buildsData);
  } else {
    compileStatusTable(false, origin);
  }
}

function submissionChecker(submissions) {
  var asub = _.filter(submissions, function(submission) {
    return submission.data.submissionType === 'appStore' && submission.platform === 'android';
  });

  var completedSubs = _.filter(asub, function(submission) {
    return submission.status === 'completed';
  });

  // Ordering
  asub = _.orderBy(asub, function(submission) {
    return new Date(submission.createdAt).getTime();
  }, ['desc']);
  checkSubmissionStatus('appStore', asub);

  appStoreSubmission = _.maxBy(asub, function(el) {
    return el.id;
  });

  previousAppStoreSubmission = _.minBy(completedSubs, function(el) {
    return el.id;
  });

  var esub = _.filter(submissions, function(submission) {
    return submission.data.submissionType === 'enterprise' && submission.platform === 'android';
  });

  var completedEnterpriseSubs = _.filter(esub, function(submission) {
    return submission.status === 'completed';
  });

  // Ordering
  esub = _.orderBy(esub, function(submission) {
    return new Date(submission.createdAt).getTime();
  }, ['desc']);
  checkSubmissionStatus('enterprise', esub);

  enterpriseSubmission = _.maxBy(esub, function(el) {
    return el.id;
  });

  previousEnterpriseSubmission = _.minBy(completedEnterpriseSubs, function(el) {
    return el.id;
  });

  if (_.isUndefined(appStoreSubmission)) {
    appStoreSubmission = {};
  }

  if (_.isUndefined(enterpriseSubmission)) {
    enterpriseSubmission = {};
  }

  if (_.isEmpty(appStoreSubmission)) {
    Fliplet.App.Submissions.create({
      platform: 'android',
      data: {
        submissionType: 'appStore'
      }
    })
      .then(function(submission) {
        appStoreSubmission = submission;
      });
  }

  if (_.isEmpty(enterpriseSubmission)) {
    Fliplet.App.Submissions.create({
      platform: 'android',
      data: {
        submissionType: 'enterprise'
      }
    })
      .then(function(submission) {
        enterpriseSubmission = submission;
      });
  }
}

function googleSubmissionChecker(submissions) {
  var asub = _.filter(submissions, function(submission) {
    return submission.data.submissionType === 'appStore' && submission.platform === 'android';
  });

  var esub = _.filter(submissions, function(submission) {
    return submission.data.submissionType === 'enterprise' && submission.platform === 'android';
  });

  // Ordering
  asub = _.orderBy(asub, function(submission) {
    return new Date(submission.createdAt).getTime();
  }, ['desc']);
  esub = _.orderBy(esub, function(submission) {
    return new Date(submission.createdAt).getTime();
  }, ['desc']);

  checkSubmissionStatus('appStore', asub);
  checkSubmissionStatus('enterprise', esub);
}

function getSubmissions() {
  return Fliplet.App.Submissions.get();
}

function initialLoad(initial, timeout) {
  if (!initial) {
    initLoad = setTimeout(function() {
      getSubmissions()
        .then(function(submissions) {
          googleSubmissionChecker(submissions);
          initialLoad(false, 15000);
        });
    }, timeout);
  } else {
    getSubmissions()
      .then(function(submissions) {
        if (!submissions.length) {
          return Promise.all([
            Fliplet.App.Submissions.create({
              platform: 'android',
              data: {
                submissionType: 'appStore'
              }
            })
              .then(function(submission) {
                appStoreSubmission = submission;
              }),
            Fliplet.App.Submissions.create({
              platform: 'android',
              data: {
                submissionType: 'enterprise'
              }
            })
              .then(function(submission) {
                enterpriseSubmission = submission;
              })
          ]);
        }

        submissions.forEach(function(submission) {
          var environment = submission.data.submissionType === 'appStore' ? 'store' : 'ent';

          if (submission.data['fl-' + environment + '-firebase'] && submission.platform === 'android') {
            $('#fl-' + environment + '-firebase-status').html('Enabled').addClass('analytic-enabled');
          }
        });


        return Fliplet.API.request({
          cache: true,
          url: 'v1/user'
        })
          .then(function(user) {
            userInfo = user;
            submissionChecker(submissions);

            return Promise.resolve();
          });
      })
      .then(function() {
        // Fliplet.Env.get('appId')
        // Fliplet.Env.get('appName')
        // Fliplet.Env.get('appSettings')

        return Promise.all([
          Fliplet.API.request({
            cache: true,
            url: 'v1/apps/' + Fliplet.Env.get('appId')
          })
            .then(function(result) {
              appName = result.app.name;
              appIcon = result.app.icon;
              appSettings = result.app.settings;
            }),
          Fliplet.API.request({
            cache: true,
            url: 'v1/organizations/' + Fliplet.Env.get('organizationId')
          })
            .then(function(org) {
              organizationName = org.name;
            }),
          Fliplet.API.request({
            cache: true,
            url: 'v1/widgets?include_instances=true&tags=type:appComponent&appId=' + Fliplet.Env.get('appId') + '&package=com.fliplet.analytics'
          })
            .then(function(res) {
              var isEnabled = !_.isEmpty(res.widgets[0].instances);

              if (isEnabled) {
                $('[data-fl-analytics-status]').each(function(index, item) {
                  $(item).html('Enabled').addClass('analytic-enabled');
                });
              }
            })
        ]);
      })
      .then(function() {
        if (appSettings.folderStructure) {
          var structure = [];

          hasFolders = true;

          var appleOnly = _.filter(appSettings.folderStructure, function(obj) {
            return obj.platform === 'apple';
          });

          return Promise.all(appleOnly.map(function(obj) {
            return Fliplet.Media.Folders.get({ folderId: obj.folderId })
              .then(function(result) {
                var tempObject = {
                  type: obj.type,
                  folderContent: result
                };

                structure.push(tempObject);

                return Promise.resolve(structure);
              });
          }))
            .then(function() {
              structure.forEach(function(el) {
                if (el.type === 'mobile') {
                  screenShotsMobile = el.folderContent.files;
                }

                if (el.type === 'tablet') {
                  screenShotsTablet = el.folderContent.files;
                }
              });
            });
        }

        hasFolders = false;

        return;
      })
      .then(function() {
        return Fliplet.API.request({
          method: 'GET',
          url: 'v1/widget-instances/com.fliplet.push-notifications?appId=' + Fliplet.Env.get('appId')
        });
      })
      .then(function(response) {
        if (response.widgetInstance.settings && response.widgetInstance.settings) {
          notificationSettings = response.widgetInstance.settings;
        } else {
          notificationSettings = {};
        }

        init();
        initialLoad(false, 5000);
      }).catch(function() {
        init();
        initialLoad(false, 5000);
      });
  }
}

// Start
initLoad = initialLoad(true, 0);
