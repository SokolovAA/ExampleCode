var helper = require("Helper");
var helper_DB = require("Helper_DB");
var _installer = require("_Installer").SingletonInstaller;
var m_params_handler = require("ParamsHandler");
var params = m_params_handler.global_param_groups;

var checks = require("Checks");
var custom_checks = require("CustomChecks");
var dialog_windows = require("DialogWindows");
var reboot = require("Reboot");
var actionControl = require("ActionControl");
var NVR = require("NVR");

/**
 * main for start installer test.
 * 
 * @returns 
 */
function Main() {
  BeforeTest();

  Test();

  AfterTest();
}

function BeforeTest() {
  Log.AppendFolder("[BeforeTest]");

  m_params_handler.Init();
  reboot.ClearRebootFile();
  actionControl.InitActionControlPathFile();
  helper_DB.GetGlobalDataFromDB();

  if(params.test_run.custom){
    custom_checks.SetCustomProperty();
  }

  if (params.test_run.test_after_reboot) {
    helper.GetRegistryInfo();
  }
  m_params_handler.SetParameter('test_run', 'localisation', helper.GetLocalization(params.paths.setup_file_UNC_path));

  Log.PopLogFolder();
}

function Test(){
  Log.AppendFolder("[Test]");
  try{
    let installer = new _installer().Init();

    if (params.test_run.numBranch < 908) {
      dialog_windows.SetupPrerequisitesWindow();
    }

    let page = installer.getPage();
    while (page.Exists) {		
      page.workPage.Refresh();
      if (page.workPage.Exists) {
        try {
          page.test();
        } catch (e) {
          Log.Error(e);
          break;
        }
      }

      let exists_installer = installer.checkExists();
      if(!exists_installer){
        Log.Message("Installer closed", "", 200, "", Sys.Desktop.Picture());
        break;
      }
      page = installer.getPage();
    }

  }
  catch(error) {
    Log.Warning("Failed Test:\r\n"+error.message, error.stack); 
  }

  Log.PopLogFolder();
}

function AfterTest(){
  Log.AppendFolder("[AfterTest]");
  checks.CheckExistsUnknownControls();

  if (!params.test_run.need_reboot_after_test) {
    if (params.test_run.custom && !params.test_run.this_remove) {
      Log.AppendFolder("[Custom after test checks]");
      NVR.StartCustomNVR();
      NVR.CompareLogoImg();
      Log.PopLogFolder();
    }
    helper.CancelTest();
  }
  helper.CollectAllData();
  Log.PopLogFolder();
}
