window.addEventListener('DOMContentLoaded', function () {

  currentHardware = Wallace.getSystemProperty('ro.hardware'),
    enableNokiaActions = (Wallace.getSystemProperty('ro.product.brand') === 'Nokia'),
    enableSim2Actions = (Wallace.getSystemProperty('persist.radio.multisim.config') === 'dsds'),
    enableQualcommActions = (currentHardware === 'qcom'),
    enableMtkActions = (currentHardware === 'mt6572' || currentHardware.slice(0, 5) === 'mt673'),
    currentKaiosVersion = Wallace.getSystemPreference('b2g.version'),
    enableCallRecordingActions = (parseInt(currentKaiosVersion.replace(/[^\d]/g, '')) >= 252),
    enableImeiActions = enableNokiaActions || enableMtkActions

  navigator.mozL10n.ready(function () {
    translate = navigator.mozL10n.get;



    var overclockScript = [
      'echo 96 > /sys/devices/system/cpu/cpufreq/interactive/target_loads',
      'echo 1094400 > /sys/devices/system/cpu/cpufreq/interactive/hispeed_freq',
      'echo 24 > /sys/devices/system/cpu/cpufreq/interactive/go_hispeed_load',
      'echo 0 > /sys/module/msm_thermal/core_control/enabled'
    ].join(' && ')

    var rootingScript = [
      'mount -o remount,rw /',
      'sleep 0.5',
      'stop adbd',
      'mv /sbin/adbd /sbin/adbd.orig',
      'cp /data/local/tmp/adbd /sbin/adbd',
      'chown root:root /sbin/adbd && chmod 750 /sbin/adbd',
      'mount -o remount,ro /',
      'rm /data/local/tmp/adbd',
      'sleep 0.5',
      'start adbd'
    ].join(';')
    if (Wallace.getSystemProperty("persist.net.tcp.buffersize.lte") == "524288,1048576,2097152,524288,1048576,2097152") {
      document.querySelector("#buffer-text").innerText = "Boosted! ✨"
    }

    function utilityIncreaseBufferSize() {
      if (Wallace.getSystemProperty("persist.net.tcp.buffersize.lte")) return;
      if (confirm("Increase Data Traffic Buffersize and reboot?")) {
        Wallace.setSystemProperty("persist.net.tcp.buffersize.wifi", "524288,1048576,2097152,524288,1048576,2097152");
        Wallace.setSystemProperty("persist.net.tcp.buffersize.umts", "6144,87380,1048576,6144,87380,524288");
        Wallace.setSystemProperty("persist.net.tcp.buffersize.gprs", "6144,87380,1048576,6144,87380,524288");
        Wallace.setSystemProperty("persist.net.tcp.buffersize.edge", "6144,87380,524288,6144,16384,262144");
        Wallace.setSystemProperty("persist.net.tcp.buffersize.hspa", "6144,87380,524288,6144,16384,262144");
        Wallace.setSystemProperty("persist.net.tcp.buffersize.lte", "524288,1048576,2097152,524288,1048576,2097152");
        Wallace.setSystemProperty("persist.net.tcp.buffersize.evdo", "6144,87380,1048576,6144,87380,1048576");
        Wallace.reboot()
      }
    };

    if (enableSim2Actions) {
      document.querySelector("#multisim-title").innerText = "Disable SIM 2"
    } else {
      document.querySelector("#multisim-title").innerText = "Enable SIM 2"
    }

    function utilityMultiSim() {
      if (Wallace.getSystemProperty("persist.radio.multisim.config") === "dsds") {
        if (confirm(translate("multisim_tosingle"))) {
          Wallace.setSystemProperty("persist.radio.multisim.config", "none");
          Wallace.reboot()
        }
      } else {
        if (confirm(translate("singlesim_tomulti"))) {
          Wallace.setSystemProperty("persist.radio.multisim.config", "dsds");
          Wallace.setSystemProperty("persist.moz.ril.0.network_types", "gsm,wcdma,lte");
          Wallace.setSystemProperty("persist.moz.ril.1.network_types", "gsm,wcdma,lte");
          Wallace.reboot()
        }
      }

    };

    Wallace.getSystemSetting('callrecording.mode', function (curMode) {
      var msgs = {
        'on': 'Manual',
        'auto': 'Automatic',
        'off': 'Disabled'
      }
      document.querySelector("#call-rec-text").innerText = msgs[curMode]
    })

    function utilityCallRecording() {
      if (enableCallRecordingActions) {
        Wallace.getSystemSetting('callrecording.mode', function (curMode) {
          var nextMode = 'on'
          if (curMode === 'auto') nextMode = 'off'
          else if (curMode === 'on') nextMode = 'auto'
          Wallace.enableCallRecording(nextMode, 'wav', function (flag) {
            var msgs_ = {
              'on': translate("callrec_on"),
              'auto': translate("callrec_auto"),
              'off': translate("callrec_off")
            }
            document.querySelector("#call-rec-text").innerText = msgs_[flag]
            return msgs_[flag] // Set Secondary Text on call recording button
          }, function (e) {
            return window.alert(translate("err_message") + e)
          })
        }, function (e) {
          window.alert(translate("err_message") + e)
        })
      } else window.alert(translate("callrec_outdated") + currentKaiosVersion)
    };
    //  if (localStorage.getItem("bloatware-removable") == "true") {document.querySelector("#bloatware-text").innerText = "Removable! 💡"}
    function utilityRemovablePreInstalledApps() {
      // if (localStorage.getItem("bloatware-removable")) return;
      if (window.confirm(translate("rem_app_confirm"))) {
        Wallace.runCmd('busybox sed -i \'s#"removable": false#"removable": true#g\' /data/local/webapps/webapps.json', function () {
          localStorage.setItem("bloatware-removable", true)
          Wallace.reboot()
        }, function (e) {
          window.alert(translate("err_message") + e)
        })
      }
    };

    function utilityToggleProxy() {
      Wallace.getSystemSetting('browser.proxy.enabled', function (res) {
        var newVal = !(res === true)
        Wallace.setSystemSetting('browser.proxy.enabled', newVal, function () {
          window.alert('Proxy ' + (newVal ? translate("enabled") : translate("disabled")) + ' successfully')
        }, function (e) {
          window.alert('Error ' + (newVal ? translate("enabling") : translate("disabling")) + ' proxy: ' + e)
        })
      }, function (e) {
        window.alert(translate("err_message") + e)
      })
    };

    function utilitySetProxyPort() {

      Wallace.getSystemSetting('browser.proxy.host', function (oldHost) {
        Wallace.getSystemSetting('browser.proxy.port', function (oldPort) {
          var newHost = window.prompt('Proxy host', oldHost || '')
          var newPort = Number(window.prompt('Proxy port', oldPort || ''))
          if (newHost && newPort) {
            Wallace.setSystemSetting('browser.proxy.host', newHost, function () {
              Wallace.setSystemSetting('browser.proxy.port', newPort, function () {
                window.alert('Proxy set successfully')

              }, function (e) {
                window.alert(translate("proxy_perror") + e)

              })
            }, function (e) {
              window.alert(translate("proxy_herror") + e)

            })
          } else {
            window.alert(translate("proxy_empty"))

          }
        }, function (e) {
          window.alert(translate("err_message") + e)

        })
      }, function (e) {
        window.alert(translate("err_message") + e)

      })
    };


    /* case '4': //override TTL
          if(enableQualcommActions) {
            
            var newTTL = parseInt(window.prompt('New TTL value', 64))
            if(newTTL && newTTL < 256) {
              Wallace.fixTTL(newTTL, function() {
                window.alert('TTL fixed at the value ' + newTTL + ' until reboot')
                
              }, function(e) {
                window.alert('Error: ' + e)
                
              }, enableMtkActions ? 'ccmni0' : 'rmnet_data0')
            }
            else {
              window.alert('Invalid TTL value')
              
            }
          }
          else window.alert('Error: TTL can be overridden on Qualcomm platform only')
          return
      
    */
    function dangerChangeIMEI1() {
      if (enableNokiaActions) {
        if (window.confirm(translate("imei1_confirm"))) {
          var newIMEI = window.prompt(translate("imei1_prompt"), Wallace.generateRandomIMEI())
          if (newIMEI) {

            Wallace.setNokiaIMEI(1, newIMEI, function () {
              if (window.confirm(translate("imei1_changed") + newIMEI + translate("imei_apply")))
                Wallace.reboot()

            }, function (e) {
              window.alert(translate("imei1_invalid"))

            })
          }
        }
        return
      } else if (enableMtkActions) {
        if (window.confirm(translate("imei1_confirm"))) {
          var newIMEI = window.prompt(translate("imei1_prompt"), Wallace.generateRandomIMEI())
          if (newIMEI) {

            Wallace.setMtkIMEI(1, newIMEI, function () {
              if (window.confirm(translate("imei1_changed") + newIMEI + translate("imei_apply")))
                Wallace.reboot()

            }, function (e) {
              window.alert(translate("imei1_invalid"))

            })
          }
        }
        return
      } else return window.alert(translate("imei_incompatible"))
    };

    function dangerChangeIMEI2() {
      if (enableNokiaActions) {
        if (enableSim2Actions) {
          if (window.confirm(translate("imei2_confirm"))) {
            var newIMEI = window.prompt(translate("imei2_prompt"), Wallace.generateRandomIMEI())
            if (newIMEI) {

              Wallace.setNokiaIMEI(2, newIMEI, function () {
                if (window.confirm(translate("imei2_changed") + newIMEI + translate("imei_apply")))
                  Wallace.reboot()

              }, function (e) {
                window.alert(translate("imei2_invalid"))

              })
            }
          }
          return
        } else return window.alert(translate("imei2_single"))
      } else if (enableMtkActions) {
        if (enableSim2Actions) {
          if (window.confirm(translate("imei2_confirm"))) {
            var newIMEI = window.prompt(translate("imei2_prompt"), Wallace.generateRandomIMEI())
            if (newIMEI) {

              Wallace.setMtkIMEI(2, newIMEI, function () {
                if (window.confirm(translate("imei2_changed") + newIMEI + translate("imei_apply")))
                  Wallace.reboot()

              }, function (e) {
                window.alert(translate("imei2_invalid"))

              })
            }
          }
          return
        } else return window.alert(translate("imei2_single"))
      } else return window.alert(translate("imei_incompatible"))
    };

    function dangerOverrideUserAgent() {
      if (window.confirm(translate("ua_confirm"))) {

        var newUA = window.prompt(translate("ua_prompt"), navigator.userAgent)
        if (newUA === '' || newUa === null || newUa === undefined) newUA = navigator.userAgent
        Wallace.setUserAgent(newUA)

      }
    };

    function dangerPrivilegedFactoryReset() {
      if (window.confirm(translate("pfr_confirm"))) {
        if (window.confirm(translate("pfr_confirm2"))) {
          Wallace.privilegedFactoryReset()
        }
      }


    }

    function dangerChangeWifiMac() {
      if (enableNokiaActions) {
        var newMAC = window.prompt(translate("mac_wifi_prompt"), Wallace.generateRandomMAC())
        if (newMAC) {

          Wallace.setNokiaWlanMAC(newMAC, function () {
            if (window.confirm(translate("mac_wifi_changed") + newMAC + translate("mac_wifi_qcom_toggle")))
              Wallace.reboot()

          }, function (e) {
            window.alert(translate("mac_invalid"))

          })
        }
      } else if (enableMtkActions) {
        var newMAC = window.prompt(translate("mac_wifi_prompt"), Wallace.generateRandomMAC())
        if (newMAC) {

          Wallace.setMtkWlanMAC(newMAC, function () {
            window.alert(translate("mac_wifi_changed") + newMAC + translate("mac_wifi_mtk_toggle"))

          }, function (e) {
            window.alert(translate("mac_invalid"))

          })
        }
      } else window.alert(translate("mac_wifi_incompatible"))
    };

    function dangerChangeBTMac() {
      if (enableNokiaActions) {
        var newMAC = window.prompt(translate("mac_bt_prompt"), Wallace.generateRandomMAC())
        if (newMAC) {

          Wallace.setNokiaBluetoothMAC(newMAC, function () {
            if (window.confirm(translate("mac_bt_changed") + newMAC + translate("mac_bt_toggle")))
              Wallace.reboot()

          }, function (e) {
            window.alert(translate("mac_invalid"))

          })
        }
      } else window.alert(translate("mac_bt_incompatible"))
    };





    let BusyboxTelnet = false

    function developerBusyboxTelnet() {
      let port = 23;
      let cmd = 'busybox telnetd -p ' + port + ' -l /system/bin/sh';
      let kill = "busybox pkill -f '" + cmd + "'";
      if (BusyboxTelnet == false) {
        document.querySelector("#busyboxt-text").innerText = "..."
        Wallace.runCmd(cmd, function () {
          BusyboxTelnet = true;
          document.querySelector("#busyboxt-text").innerText = (BusyboxTelnet ? navigator.mozWifiManager.connectionInformation.ipAddress + (port != 23 ? ":" + port : ":" + port) : "Offline/Unavailable")
        }, function () {
          document.querySelector("#busyboxt-text").innerText = translate("error")
          alert(translate("err_message") + this.error.name)
        })
      } else {
        document.querySelector("#busyboxt-text").innerText = "..."
        Wallace.runCmd(kill, function () {
          BusyboxTelnet = false;
          document.querySelector("#busyboxt-text").innerText = translate("offline")
        }, function () {
          document.querySelector("#busyboxt-text").innerText = translate("error")
          alert(translate("err_message") + this.error.name)
        });

      }
    }


    appOrigin = 'kairoot.bananahackers.net',
      internalWebappPath = '/data/local/webapps/' + appOrigin + '/application.zip',
      internalStoragePath = '/sdcard',
      tempName = 'tmpbin.bin',
      internalPath = internalStoragePath + '/' + tempName,
      linearScript = [
        '',
        'mount -o remount,rw /',
        'sleep 0.5',
        'chmod -R 755 /sbin',
        'cp ' + internalPath + ' /sbin/busybox',
        'chown root:root /sbin/busybox && chmod -R 0755 /sbin && chmod 4755 /sbin/busybox',
        'sleep 0.5',
        'mount -o remount,ro /',
        'rm ' + internalPath
      ].join(' && ')


    function resourceLoader(resourcePath, done) {
      var req = new XMLHttpRequest(),
        segmentLength = 400;
      console.log('Fetching resource:', resourcePath)
      req.open('GET', resourcePath, true)
      req.responseType = 'blob'
      req.overrideMimeType('application/octet-stream')
      req.onload = function (e) {
        var buf = req.response
        console.log('Resource fetched:', resourcePath)
        if (buf) {
          var sdcard = navigator.getDeviceStorage("sdcard")
          var request = sdcard.addNamed(buf, tempName)
          request.onsuccess = function () {
            console.log('Buffer written')
            done(true)
          }
          request.onerror = function (e) {
            window.alert('Resource write failed: ' + this.error.name)
            Wallace.runCmd('rm ' + internalPath, true)
            done(false)
          }
        } else {
          window.alert('Resource fetching failed: ' + resourcePath)
          done(false)
        }
      }
      req.send(null)
    }

    function developerInstallBusybox() {

      resourceLoader('/rsrc/busybox.bin', function (status) {
        if (status) {
          Wallace.runCmd(linearScript, function () {
            alert(translate("bb_installed"))
          }, function () {
            alert(translate("err_message") + this.error.name)
          })
        }
      })


    }

    let ADBRooted = false;

    function developerADBRoot() { // For some reason this doesn't seem to work for me, 
      //and just makes ADB not find the device, while the ADBRoot application works for me.
      /*  Wallace.extractAppAsset('wallace-toolbox.bananahackers.net', 'rsrc/adbd.bin', '/data/local/tmp/adbd', function() {  
            Wallace.runCmd(rootingScript, function() {
              window.alert('Rooted ADB access until reboot')
            }, function() {
              window.alert('Something went wrong: ' + this.error.name)
            })
          })*/

      check_insecure = '[ -e /sbin/adbd ] && [ "$(md5sum /sbin/adbd | cut -d\' \' -f1)" == "c3b682720bc74eb72d5002200f9db9e7" ]';
      check_secure = '[ -e /sbin/adbd ] && [ "$(md5sum /sbin/adbd | cut -d\' \' -f1)" != "c3b682720bc74eb72d5002200f9db9e7" ]';

      mount_rw = 'mount -o remount,rw / && sleep 0.25';
      mount_ro = 'mount -o remount,ro / && sleep 0.25';
      adapt_permissions = 'chown root:root /sbin/adbd && chmod 750 /sbin/adbd';
      unzip_adbd = 'mv /sbin/adbd /sbin/adbd_bak && busybox unzip -p /data/local/webapps/kairoot.bananahackers.net/application.zip rsrc/adbd > /sbin/adbd';
      reset_adbd = '[ -e /sbin/adbd_bak ] && mv -f /sbin/adbd_bak /sbin/adbd';

      cmd = check_secure + ' && stop adbd && ' + mount_rw + ' && ' + unzip_adbd + ' && ' + adapt_permissions + ' && ' + mount_ro + ' && start adbd';
      kill = check_insecure + ' && stop adbd &&' + mount_rw + ' && ' + reset_adbd + ' && ' + mount_ro + ' && start adbd ';

      if (ADBRooted == false) {
        Wallace.runCmd(cmd, function () {
          ADBRooted = true
          document.querySelector("#adbroot-text").innerText = translate("enabled")
          //  document.querySelector('[data-map="adbroot"]').classList.remove("disabled");document.querySelector('[data-map="adbroot"]').classList.add("enabled");

        }, function () {
          window.alert(translate("err_message") + this.error.name)
        })
      } else {
        Wallace.runCmd(kill, function () {
          ADBRooted = false
          document.querySelector("#adbroot-text").innerText = translate("disabled")
          //document.querySelector('[data-map="adbroot"]').classList.remove("enabled");document.querySelector('[data-map="adbroot"]').classList.add("disabled");     

        }, function () {
          window.alert(translate("err_message") + this.error.name)
        })
      }

    };

    function developerOverclock() {
      if (enableQualcommActions) {

        Wallace.runCmd(overclockScript, function () {
          window.alert(translate("ovkl_success"))

        }, function (e) {
          window.alert(translate("err_message") + e)

        })
      } else alert(translate("ovkl_onlyqcom"))
    };


    if (Wallace.getSystemProperty('sys.usb.config') === 'diag,serial_smd,rmnet_qti_bam,adb') {
      document.querySelector("#diagport-text").innerText = translate("enabled");
      // document.querySelector('[data-map="diagport"]').classList.remove("disabled");document.querySelector('[data-map="diagport"]').classList.add("enabled");    
    } else {
      document.querySelector("#diagport-text").innerText = translate("disabled")
      // document.querySelector('[data-map="diagport"]').classList.remove("enabled"); document.querySelector('[data-map="diagport"]').classList.add("disabled");
    }

    function developerDiagnostics() {
      if (enableQualcommActions) {

        Wallace.toggleDiagPort(function () {
          document.querySelector("#diagport-text").innerText = translate("enabled")
          //  document.querySelector('[data-map="diagport"]').classList.remove("disabled");document.querySelector('[data-map="diagport"]').classList.add("enabled");
        }, function () {
          document.querySelector("#diagport-text").innerText = translate("disabled")
          //  document.querySelector('[data-map="diagport"]').classList.remove("enabled"); document.querySelector('[data-map="diagport"]').classList.add("disabled");

        }, function (e) {
          window.alert('Error toggling diag port: ' + e)
        })
      } else window.alert(translate("diag_onlyqcom"))
    };

    function developerTestbox() {
      return new MozActivity({
        name: "engmode"
      });
    }

    function developerMenu() {
      // MODES:
      // "a" Open Developer Menu via MozActivity (TEMP)
      // "b" Set developer.menu.enabled to true
      // "c" Cache injection
      let mode = window.prompt('Which method do you want to use to enable the Developer Menu? \n"a": Open Developer Menu via MozActivity (TEMP)\n"b": Set developer.menu.enabled to true \n"c": Cache injection')
      switch (mode) {
        case 'a':
          return new MozActivity({
            name: "configure",
            data: {
              target: "device",
              section: "developer"
            }
          })
          break;
        case 'b':
          return Wallace.setSystemSetting('developer.menu.enabled', true, function () {
            window.alert('Developer Menu successfully enabled')
          }, function (e) {
            window.alert('Error: ' + e)
          })

          break;
        case 'c':
          Wallace.runCmd('echo -n root > /cache/__post_reset_cmd__;cp /cache/__post_reset_cmd__ /persist/__post_reset_cmd__', function () {
            Wallace.reboot()
          }, function (e) {
            window.alert('Error: ' + e)
          })
          break;
        default:
          alert("Invalid Choice! Valid Choices: (a,b,c)")
        break;
      }

    };

    function developerSetSystemSetting() {
      var setting = window.prompt('Enter SystemSetting to modify')
      if (setting) {
        Wallace.getSystemSetting(setting, function (value) {
          if (value instanceof Blob) {
            window.alert('The setting ' + setting + ' has a Blob value, CrossTweak cannot view it')
          } else {
            if (window.confirm('Current ' + setting + ' value is:\n' + value + '\nDo you want to modify it?')) {
              var newVal = window.prompt('Enter new value: ', value || '')
              var vtl = newVal.toLowerCase().trim()
              if (vtl === 'true') newVal = true
              else if (vtl === 'false') newVal = false
              CrossTweak.setSystemSetting(setting, newVal, function () {
                window.alert('Setting ' + setting + ' updated successfully!')
              }, function (e) {
                window.alert('Error: ' + e)
              })
            }
          }
        }, function (e) {
          window.alert('Error: ' + e)
        })
      }else{
        alert("SystemSetting is invalid/unavailable!")
      }

    }

    function developerSideload() {

      var pickPackage = new MozActivity({
        name: 'KaiRoot.SelectPkg',
      })
      pickPackage.onsuccess = function () {
        internalSideload(pickPackage.result, function () {

        })
      }
      pickPackage.onerror = function (e) {
        if (e.name == undefined) return;
        window.alert(translate("pick_error") + e.name)

      }
    };

    function internalSideload(blob, callback) {
      console.log(blob)
      try {
        Wallace.installPkg(blob, function () {
          window.alert(translate("app_successfullinstall") + blob.name)
          callback(true)
        }, function (e) {
          if (e.toString() === 'InvalidPrivilegeLevel')
            window.alert(translate("app_insufficentpriviledges"))
          else if (e.toString() === 'AppAlreadyInstalled')
            window.alert(translate("app_alreadyinstalled"))
          else
            window.alert(translate("install_error") + e)
          callback(false, e.name, e.message)
        })
      } catch (error) {
        console.error(error)
      }
    }

    window.KaiRoot = {
      Developer: {
        ADBRoot: developerADBRoot,
        ToggleDiagPort: developerDiagnostics,
        Menu: developerMenu,
        Overclock: developerOverclock,
        Sideload: developerSideload,
        InstallBusyBox: developerInstallBusybox,
        BusyboxTelnet: developerBusyboxTelnet,
        Textbox: developerTestbox,
      },
      Utility: {
        IncreaseBufferSize: utilityIncreaseBufferSize,
        CallRecording: utilityCallRecording,
        RemovableBloatware: utilityRemovablePreInstalledApps,
        ToggleProxy: utilityToggleProxy,
        ProxyPort: utilitySetProxyPort,
        ToggleMultiSim: utilityMultiSim,
      },
      Risky: {
        PrivFactoryReset: dangerPrivilegedFactoryReset,
        ChangeBTMac: dangerChangeBTMac,
        ChangeWIFIMac: dangerChangeWifiMac,
        ChangeIMEI1: dangerChangeIMEI1,
        ChangeIMEI2: dangerChangeIMEI2,
        ChangeUserAgent: dangerOverrideUserAgent,
      },
      internal: {
        // !! WARNING !!
        // Internal functions should never be called if you don't know what you are doing! External functions (Developer, Utility, Risky)
        // wrap internals around confirmations and prompts, such as privileged factory reset, etc.
        // Be careful!
        sideload: internalSideload,

      },

    }


  })
});