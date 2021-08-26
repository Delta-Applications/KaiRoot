/**
 * LibWallace: toolbox library for Qualcomm-based and MTK-based phones running KaiOS
 *
 * Full support: KaiOS 2.5+ Nokias (Nokia 8110 4G, Nokia 2720 Flip, Nokia 800 Tough)
 * Partial support: CAT B35, KaiOS 1.0 devices (Alcatel OT-4044O), MTK devices (Sigma S3500 sKai)
 * 
 * Needs "certified" level in the app manifest.
 * Requires additional manifest permissions:
 * 
 * "power" - enable power management and privileged factory reset;
 * "jrdextension" - support oldest devices in legacy mode;
 * "kaiosextension" - support KaiOS 2.5 devices with unprotected extension;
 * "engmode-extension" - support KaiOS 2.5.1+ devices with protected extension;
 * "external-api" - support KaiOS 2.5.1+ devices with non-standard protected extension (addition to "engmode-extension");
 * "device-storage:apps":{ "access": "readwrite" } - support package installation;
 * "webapps-manage" - support package installation (via navigator.mozApps interface);
 * "settings":{ "access": "readwrite" } - support hidden settings manipulation.
 *
 * Library functions marked as [EXPERIMENTAL] may work or fail to work on a particular device
 * and/or with particular parameters.
 * Library functions marked as [DANGEROUS] may cause system damage on a particular device.
 *
 * Current version: 0.6
 *
 * Version history:
 *
 * 2020-07-05: Added two new MediaTek-specific methods: setMtkBluetoothMAC and setMtkWlanMAC
 * 2020-06-18: Added the first MediaTek-specific method: setMtkIMEI
 * 2020-04-21: Added generateRandomMAC, setNokiaBluetoothMAC and setNokiaWlanMAC methods
 * 2019-12-07: Added enableCallRecording method
 * 2019-11-30: Updated generateRandomIMEI method to optionally use a particular TAC
 * for generating the IMEIs of a particular device model
 * 2019-10-08: Initial release (v0.1)
 *
 * @license
 * -----------------------------------------------------------------------
 * This is free and unencumbered software released into the public domain.
 *
 * Anyone is free to copy, modify, publish, use, compile, sell, or
 * distribute this software, either in source code form or as a compiled
 * binary, for any purpose, commercial or non-commercial, and by any
 * means.
 *
 * In jurisdictions that recognize copyright laws, the author or authors
 * of this software dedicate any and all copyright interest in the
 * software to the public domain. We make this dedication for the benefit
 * of the public at large and to the detriment of our heirs and
 * successors. We intend this dedication to be an overt act of
 * relinquishment in perpetuity of all present and future rights to this
 * software under copyright law.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
 * EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
 * MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
 * IN NO EVENT SHALL THE AUTHORS BE LIABLE FOR ANY CLAIM, DAMAGES OR
 * OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE,
 * ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
 * OTHER DEALINGS IN THE SOFTWARE.
 *
 * For more information, please refer to <http://unlicense.org/>
 **/

;(function(global, nav) {
  var masterExt = nav.engmodeExtension || nav.jrdExtension || nav.kaiosExtension

  /**
   * Run a system command as root (wrapper for extension methods)
   * @param {string} cmd Command to run
   * @param {function} successCb The callback that gets called on success
   * @param {function} errorCb The callback that gets called on error
   */
  function runCmd(cmd, successCb, errorCb) {
    if(!successCb) successCb = function(){}
    if(!errorCb) errorCb = function(){}
    var executor = masterExt.startUniversalCommand(cmd, true)
    executor.onsuccess = successCb
    executor.onerror = errorCb
  }

  /**
   * Extract a file from application archive to the specified system path
   * Requires Busybox on the system
   * @param {string} appId Application ID (origin) to extract from
   * @param {string} sourcePath The relative path to the file within the application
   * @param {string} destPath The absolute path in the FS (with the filename) to extract to
   * @param {function} successCb The callback that gets called on success
   * @param {function} errorCb The callback that gets called on error 
   */
  function extractAppAsset(appId, sourcePath, destPath, successCb, errorCb) {
    var zipPath = '/data/local/webapps/' + appId + '/application.zip',
        unzipCmd = 'busybox unzip -p ' + zipPath + ' ' + sourcePath + ' > ' + destPath
    runCmd(unzipCmd, successCb, errorCb)
  }

  /**
   * Start the privileged factory reset procedure
   */
  function privilegedFactoryReset() {
    if (confirm("Execute Priviliged Factory Reset?") == true)  {
        nav.mozPower.factoryReset('root')
    } 
  }

  /**
   * Get a property from the system Android property set
   * (equivalent to getprop command)
   * @param {string} key The name of the property to retrieve
   */
  function getSystemProperty(key) {
    return masterExt.getPropertyValue(key)
  }

  /**
   * Set a property in the system Android property set
   * (equivalent to setprop command)
   * @param {string} key The name of the property to set
   * @param {string} value The value of the property to set
   */
  function setSystemProperty(key, value) {
    masterExt.setPropertyValue(key, value)
  }

  /**
   * Get a property from the system preference configuration
   * @param {string} key The name of the preference to retrieve
   * @param {string} defVal Optional default value to use if the preference is not set
   */
  function getSystemPreference(key, defVal = null) {
    return masterExt.getPrefValue(key, defVal)
  }

  /**
   * [EXPERIMENTAL] Set a property in the system preference configuration
   * @param {string} key The name of the preference to set
   * @param {string} value The value of the preference to set
   */
  function setSystemPreference(key, value) {
    masterExt.setPrefValue(key, value)
  }

  /**
   * Get a property from the system settings database
   * @param {string} key The name of the property to retrieve
   * @param {function} successCb The callback to which the value gets returned
   * @param {function} errorCb The callback that gets called on error
   */
  function getSystemSetting(key, successCb, errorCb) {
    var e = nav.mozSettings.createLock().get(key)
    e.onsuccess = function() {
      successCb(e.result[key])
    }
    e.onerror = errorCb
  }
  
  /**
   * Set a property in the system settings database
   * @param {string} key The name of the property to set
   * @param {string} value The value of the property to set
   * @param {function} successCb The callback that gets called on success
   * @param {function} errorCb The callback that gets called on error
   */
  function setSystemSetting(key, value, successCb, errorCb) {
    var setting = {}
    setting[key] = value
    var e = nav.mozSettings.createLock().set(setting)
    e.onsuccess = successCb
    e.onerror = errorCb
  }

  /*
   * Toggle Qualcomm Diagnostics port in USB configuration until reboot
   * (bypassing all launcher-side code protection)
   * @param {function} successOnCb The callback that gets called on successful enabling
   * @param {function} successOffCb The callback that gets called on successful disabling
   * @param {function} errorCb The callback that gets called on error
   */
  function toggleDiagPort(successOnCb, successOffCb, errorCb) {
    var status = getSystemProperty('sys.usb.config'), 
        sysProp = 'persist.sys.usb.config',
        inactiveState = 'mtp,adb',
        activeState = 'diag,serial_smd,rmnet_qti_bam,adb'
    if(status === activeState) { //diag enabled, disabling
      setSystemProperty(sysProp, inactiveState)
      successOffCb()
    }
    else { //diag disabled, enabling
      setSystemProperty(sysProp, activeState)
      setSystemSetting('ums.enabled', false, successOnCb, errorCb) //diag is incompatible with mass storage, so disabling it
    }
  }


  /**
   * [EXPERIMENTAL] Set system-wide proxy configuration (requires reboot or b2g process restart)
   * @param {object} config Configuration object
   *
   * Implementation is still incomplete and relies upon Mozilla docs, not real KaiOS environment state.
   * For the time being, it's recommended to use setBrowserProxy/unsetBrowserProxy methods instead whenever possible.
   *
   * Available fields:
   *
   * - type: 0 - direct (no proxy), 1 - manual, 2 - PAC
   * - http: hostname or IP of plain HTTP proxy
   * - http_port: 1-65535, 0 to ignore for HTTP URLs
   * - ftp: hostname or IP of FTP proxy   
   * - ftp_port: 1-65535, 0 to ignore for FTP URLs
   * - ssl: hostname or IP of HTTPS proxy
   * - ssl_port: 1-65535, 0 to ignore for HTTPS URLs 
   * - socks: hostname or IP of SOCKS proxy
   * - socks_port: 1-65535, 0 to ignore
   * - socks_remote_dns: if using SOCKS 5, this flag controls whether lookups are done locally (default) or on the SOCKS server
   * - socks_version: 4 or 5, default is 5
   * - no_proxies_on: comma-separated list of IPs or hostnames to ignore proxying
   * - autoconfig_url: absolute PAC url if set
   * - failover_timeout: timeout in minutes for primary proxy connection
   *
   *  See this article for details: https://developer.mozilla.org/en-US/docs/Mozilla/Preferences/Mozilla_networking_preferences
   */
  function setSystemProxyConfig(config) {
    var allowedPrefs = ['type', 'http', 'http_port', 'ftp', 'ftp_port', 'ssl', 'ssl_port', 'socks',
        'socks_port', 'socks_remote_dns', 'socks_version', 'no_proxies_on', 'autoconfig_url', 'failover_timeout'],
        pref
    for(pref in config) {
      if(allowedPrefs.indexOf(pref) > -1)
        setSystemPreference('network.proxy.' + pref, config[pref])
    }
  }

  /**
   * Set browser-wide HTTP/HTTPS proxy configuration
   * @param {string} host Proxy hostname or IP
   * @param {number} port Proxy port number
   * @param {function} successCb The callback that gets called on success
   * @param {function} errorCb The callback that gets called on error
   */
  function setBrowserProxy(host, port, successCb, errorCb) {
    setSystemSetting('browser.proxy.host', host, function() {
      setSystemSetting('browser.proxy.port', port, function() {
        setSystemSetting('browser.proxy.enabled', true, successCb, errorCb)
      }, errorCb)
    }, errorCb)
  }

  /**
   * Disable browser-wide HTTP/HTTPS proxy
   */
  function unsetBrowserProxy(successCb, errorCb) {
    setSystemSetting('browser.proxy.enabled', false, successCb, errorCb)
  }

  /**
   * [EXPERIMENTAL] Set browser engine user agent
   * Cautions:
   * 1) affects stock KaiStore access
   * 2) there's no way to reset it other than through WebIDE, factory reset or setting a new one
   * @param {string} newUA The new user agent to set
   */
  function setUserAgent(newUA) {
    setSystemPreference('general.useragent.override', newUA)
  }

  /**
   * Calculate Luhn checksum of an IMEI number string (takes first 14 digits and computes the 15th)
   * @param {string|array} IMEI digit string or numeric array
   * @returns {number} Luhn checksum digit
   */
  function calcIMEIChecksum(imei) {
    if(imei === '' + imei) //split the digits if we passed the string
      imei = imei.split('').map(Number)
    var revmap = [0, 2, 4, 6, 8, 1, 3, 5, 7, 9],
        oddsum = imei[0] + imei[2] + imei[4] + imei[6] + imei[8] + imei[10] + imei[12],
        evensum = revmap[imei[1]] + revmap[imei[3]] + revmap[imei[5]] + revmap[imei[7]] + revmap[imei[9]] + revmap[imei[11]] + revmap[imei[13]],
        luhn = 10 - (oddsum + evensum) % 10
    return luhn > 9 ? 0 : luhn
  }

  /**
   * Generate a random 15-digit IMEI that passes Luhn checksum
   * @param {string} tac Optional TAC variable length (typically 8-digit) string
   * @returns {string} random valid IMEI number
   */
  function generateRandomIMEI(tac='') {
    tac += ''
    var imei = new Uint8Array(14 - tac.length).map(x=>(Math.random()*1000|0)%10)
    imei = tac.split('').map(Number).concat(Array.from(imei))
    return imei.join('') + calcIMEIChecksum(imei)
  }

  /**
   * Generate a random 6-byte MAC address string
   * @param {string} pref Optional hex vendor prefix string (can be colon-separated)
   * @returns {string} random colon-separated MAC address
   */
  function generateRandomMAC(pref='') {
    pref = pref.toLowerCase().replace(/[^0-9a-f]/g, '')
    var mac = new Uint8Array(12 - pref.length).map(x=>(Math.random()*1000|0)&15)
    mac = pref.split('').map(x => parseInt(x, 16)).concat(Array.from(mac))
    return mac.map(x => x.toString(16)).join('').match(/.{2}/g).join(':')
  }

  /**
   * [EXPERIMENTAL] [DANGEROUS] IMEI editor - Nokias only!
   * Requires reboot. Any error will lead to radio failure until EFS is restored.
   * @param {number} sim SIM number (1 or 2)
   * @param {string} imei New IMEI 15-digit string
   * @param {function} successCb The callback that gets called on success
   * @param {function} errorCb The callback that gets called on error
   */

  function setNokiaIMEI(sim, imei, successCb, errorCb) {
    if(Number(imei[14]) !== calcIMEIChecksum(imei)) {
      errorCb() //call the error callback if IMEI has invalid checksum
      return
    }
    var targetFile = sim === 2 ? 'nvm/context1/550' : 'nvm/num/550',
        qPayload = '\\x' + ('80a' + imei).match(/.{2}/g).map(function(c){return c[1] + c[0]}).join('\\x'),
        blkPref = '/dev/block/bootdevice/by-name',
        tunPart = blkPref + '/tunning',
        efs1 = blkPref + '/modemst1',
        efs2 = blkPref + '/modemst2',
        cmdbatch = [
          'cd $(mktemp -d)',
          'busybox tar xf ' + tunPart,
          'echo -ne "' + qPayload + '" > ' + targetFile,
          'busybox tar cf - . > ' + tunPart,
          'dd if=/dev/zero of=' + efs1 + '; dd if=/dev/zero of=' + efs2
        ].join(' && ')
    runCmd(cmdbatch, successCb, errorCb)
  }

  /**
   * [EXPERIMENTAL] [DANGEROUS] WLAN MAC address editor - Nokias only!
   * Requires reboot. Any error will lead to radio failure until EFS is restored.
   * @param {string} mac New MAC 6-byte string (can be just hex or colon separated)
   * @param {function} successCb The callback that gets called on success
   * @param {function} errorCb The callback that gets called on error
   */

  function setNokiaWlanMAC(mac, successCb, errorCb) {
    var targetFile = 'nvm/num/4678',
        qPayload = '\\x' + mac.toLowerCase().replace(/[^0-9a-f]/g, '').match(/.{2}/g).join('\\x'),
        blkPref = '/dev/block/bootdevice/by-name',
        tunPart = blkPref + '/tunning',
        efs1 = blkPref + '/modemst1',
        efs2 = blkPref + '/modemst2',
        cmdbatch = [
          'cd $(mktemp -d)',
          'busybox tar xf ' + tunPart,
          'echo -ne "' + qPayload + '" > ' + targetFile,
          'busybox tar cf - . > ' + tunPart,
          'dd if=/dev/zero of=' + efs1 + '; dd if=/dev/zero of=' + efs2
        ].join(' && ')
    runCmd(cmdbatch, successCb, errorCb)
  }

  /**
   * [EXPERIMENTAL] [DANGEROUS] Bluetooth MAC address editor - Nokias only!
   * Requires reboot. Any error will lead to radio failure until EFS is restored.
   * @param {string} mac New MAC 6-byte string (can be just hex or colon separated)
   * @param {function} successCb The callback that gets called on success
   * @param {function} errorCb The callback that gets called on error
   */

  function setNokiaBluetoothMAC(mac, successCb, errorCb) {
    var targetFile = 'nvm/num/447',
        persistFile = '/persist/bluetooth/.bt_nv.bin',
        qPayload = '\\x' + mac.toLowerCase().replace(/[^0-9a-f]/g, '').match(/.{2}/g).join('\\x'),
        pPayload = '\\x01\\x01\\x06' + qPayload,
        blkPref = '/dev/block/bootdevice/by-name',
        tunPart = blkPref + '/tunning',
        efs1 = blkPref + '/modemst1',
        efs2 = blkPref + '/modemst2',
        cmdbatch = [
          'cd $(mktemp -d)',
          'busybox tar xf ' + tunPart,
          'echo -ne "' + qPayload + '" > ' + targetFile,
          'busybox tar cf - . > ' + tunPart,
          'echo -ne "' + pPayload + '" > ' + persistFile,
          'dd if=/dev/zero of=' + efs1 + '; dd if=/dev/zero of=' + efs2
        ].join(' && ')
    runCmd(cmdbatch, successCb, errorCb)
  }

  /**
   * [EXPERIMENTAL] [DANGEROUS] IMEI editor - MediaTeks only!
   * Requires reboot. Any error will lead to radio failure until NVRAM is restored.
   * @param {number} sim SIM number (1 or 2)
   * @param {string} imei New IMEI 15-digit string
   * @param {function} successCb The callback that gets called on success
   * @param {function} errorCb The callback that gets called on error
   */

  function setMtkIMEI(sim, imei, successCb, errorCb) {
    if(Number(imei[14]) !== calcIMEIChecksum(imei)) {
      errorCb() //call the error callback if IMEI has invalid checksum
      return
    }
    var targetEgmrIndex = sim === 2 ? 10 : 7,
        egmrCommand = 'echo -e \'AT\\r\\nAT+EGMR=1,' + targetEgmrIndex + ',"' + imei + '"\\r\\n\' >> /dev/radio/pttycmd1'
    runCmd(egmrCommand, successCb, errorCb)
  }

  /**
   * [EXPERIMENTAL] [DANGEROUS] WLAN MAC address editor - MediaTeks only!
   * Requires reboot. Any error will lead to radio failure until NVRAM is restored.
   * @param {string} mac New MAC 6-byte string (can be just hex or colon separated)
   * @param {function} successCb The callback that gets called on success
   * @param {function} errorCb The callback that gets called on error
   */

  function setMtkWlanMAC(mac, successCb, errorCb) {
    var targetFile = '/data/nvram/APCFG/APRDEB/WIFI', tmpFile='/cache/mac',
        startOffset=4,
        dPayload = '\\x' + mac.toLowerCase().replace(/[^0-9a-f]/g, '').match(/.{2}/g).join('\\x'),
        cmdbatch = [
          'echo -ne "' + dPayload + '" > ' + tmpFile,
          'dd if=' + tmpFile + ' of=' + targetFile + ' bs=1 seek=' + startOffset + ' conv=notrunc',
          'rm ' + tmpFile
        ].join(';')
    runCmd(cmdbatch, successCb, errorCb)
  }

  /**
   * [EXPERIMENTAL] [DANGEROUS] Bluetooth MAC address editor - MediaTeks only!
   * Requires reboot. Any error will lead to radio failure until NVRAM is restored.
   * @param {string} mac New MAC 6-byte string (can be just hex or colon separated)
   * @param {function} successCb The callback that gets called on success
   * @param {function} errorCb The callback that gets called on error
   */

  function setMtkBluetoothMAC(mac, successCb, errorCb) {
    var targetFile = '/data/nvram/APCFG/APRDEB/BT_Addr', tmpFile='/cache/mac',
        dPayload = '\\x' + mac.toLowerCase().replace(/[^0-9a-f]/g, '').match(/.{2}/g).join('\\x'),
        cmdbatch = [
          'echo -ne "' + dPayload + '" > ' + tmpFile,
          'dd if=' + tmpFile + ' of=' + targetFile + ' bs=1 conv=notrunc',
          'rm ' + tmpFile
        ].join(';')
    runCmd(cmdbatch, successCb, errorCb)
  }

  /**
   * Fix outgoing packet TTL for tethering purposes (until reboot)
   * Currently there is Qualcomm support only!
   * @param {number} ttlval New fixed TTL value (64 recommended)
   * @param {function} successCb The callback that gets called on success
   * @param {function} errorCb The callback that gets called on error
   */

  function fixTTL(ttlval, successCb, errorCb, iface) {
    if(!iface) iface = 'rmnet_data0'
    var ttlprev = ttlval - 1,
      cmdbatch = [
        'iptables -t filter -N sort_out_interface',
        'iptables -t filter -A sort_out_interface -m ttl --ttl-lt ' + ttlprev + ' -j REJECT',
        'iptables -t filter -A sort_out_interface -m ttl --ttl-eq ' + ttlprev + ' -j RETURN',
        'iptables -t filter -A sort_out_interface -j CONNMARK --set-mark ' + ttlval,
        'iptables -t filter -I FORWARD -o ' + iface + ' -j sort_out_interface',
        'iptables -t filter -I OUTPUT -o ' + iface + ' -j sort_out_interface',
        'ip rule add fwmark ' + ttlval + ' table 164',
        'ip route add default dev lo table 164',
        'ip route flush cache'
      ].join(' && ')
    runCmd(cmdbatch, successCb, errorCb)
  }

  /**
   * Install an app package via the stock B2G API
   * @param {File|Blob} packageFile The File or Blob object of the zip package to install
   * @param {function} successCb The callback that gets called on success
   * @param {function} errorCb The callback that gets called on error
   */
  function installPkg(packageFile, successCb, errorCb) {
    nav.mozApps.mgmt.import(packageFile).then(function(){
      successCb()
    }).catch(function(e){
      errorCb(e.name, e.message)
    })
  }

  /**
   * Reboot the phone
   * @param {function} errorCb The callback that gets called on error
   */
  function reboot(errorCb) {
    runCmd('reboot', function(){}, errorCb)
  }
  
  /**
  * Enable/disable call recording in the main callscreen (KaiOS 2.5.2+ only)
  * (toggled by Camera button on the devices that have it and Left arrow on all others)
  * @param {string} flag (on|auto|off)
  * @param {string} format Recording format (wav, 3gpp, ogg or opus)
  * @param {function} successCb The callback that gets called on success
  * @param {function} errorCb The callback that gets called on error
  */
  function enableCallRecording(flag='on', format='wav', successCb, errorCb) {
    setSystemSetting('callrecording.mode', flag, function() {
      setSystemSetting('callrecording.file.format', format, function() {
        setSystemSetting('callrecording.notification.enabled', false, function() {
          setSystemSetting('callrecording.vibration.enabled', false, function(){
            successCb(flag)
          }, errorCb)
        }, errorCb)
      }, errorCb)
    }, errorCb)
  }

  global.Wallace = {
    runCmd: runCmd,
    extractAppAsset: extractAppAsset,
    privilegedFactoryReset: privilegedFactoryReset,
    getSystemProperty: getSystemProperty,
    setSystemProperty: setSystemProperty,
    getSystemPreference: getSystemPreference,
    setSystemPreference: setSystemPreference,
    getSystemSetting: getSystemSetting,
    setSystemSetting: setSystemSetting,
    toggleDiagPort: toggleDiagPort,
    setSystemProxyConfig: setSystemProxyConfig,
    setBrowserProxy: setBrowserProxy,
    unsetBrowserProxy: unsetBrowserProxy,
    setUserAgent: setUserAgent,
    calcIMEIChecksum: calcIMEIChecksum,
    generateRandomIMEI: generateRandomIMEI,
    generateRandomMAC: generateRandomMAC,
    setNokiaIMEI: setNokiaIMEI,
    setNokiaWlanMAC: setNokiaWlanMAC,
    setNokiaBluetoothMAC: setNokiaBluetoothMAC,
    setMtkIMEI: setMtkIMEI,
    setMtkWlanMAC: setMtkWlanMAC,
    setMtkBluetoothMAC: setMtkBluetoothMAC,
    fixTTL: fixTTL,
    installPkg: installPkg,
    reboot: reboot,
    enableCallRecording: enableCallRecording
  }
})(window, navigator)
