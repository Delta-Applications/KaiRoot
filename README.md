# KaiRoot

## About

KaiRoot is a modification/fork of the existing Wallace Toolbox, with bugfixes such as a different root method, busy box installation, and other features from other applications and wiki tweaks to provide an all-in-one universal toolbox.

Based on [LibWallace](https://gist.github.com/plugnburn/00fa61006513cdb0a12adf61a6e425e1), Wallace Toolbox, and several independent researches.

## To-do
- Implement Risky Category
- Change color choice to idk
- Improve UI to open different menus 
- Show Factory Reset Image when performing reset

## Current version

0.0.6

## Current feature list

- ADB root (requires Busybox for the operation, you may use the Busybox Installer to install it if missing)
- Call recording on/auto/off (works on KaiOS 2.5.2 and higher, tested on Nokia 2720 Flip and Nokia 800 Tough)
- Install application package (OmniSD/GerdaPkg compatible, works when developer menu is enabled, tested on Nokias only)
- Override TTL when tethering until reboot (Qualcomm devices only)
- Edit IMEI1 (Nokia and MediaTek devices only)
- Edit IMEI2 (Nokia and MediaTek devices in DSDS configuration only)
- Toggle browser proxy on/off
- Set browser proxy host and port
- Override user agent (dangerous: affects KaiStore accessibility, can't be reset until the factory reset or manual device preferences editing in WebIDE)
- Busybox Telnet Server (speeduploop)
- ALLA App Manager built-in
- OmniSD-Like File Picker for Sideloading built-in
- Tweak Buffersize (Works on Android too, tweak found on Wiki)
- Disable/Enable SIM 2 (Can save some battery, found on Wiki)
- Toggle diagnostics port (Qualcomm devices only)
- Run overclocking script (Qualcomm devices only)
- Enable developer menu and privileged access (via cache injection method)
- Edit Wi-Fi MAC address (Nokia and MediaTek devices only, temporary for MediaTeks)
- Left soft key: Edit Bluetooth MAC address (Nokia devices only)
- Right soft key: Make all pre-installed apps removable from the app menu without affecting system partition (requires Busybox for the operation)

Here is the full list of functions the KaiRoot Wrapper (Used for this application) can run:

```javascript
Developer: {
  ADBRoot: developerADBRoot,
  ToggleDiagPort: developerDiagnostics,
  Menu: developerMenu,
  Overclock: developerOverclock,
  Sideload: developerSideload,
  InstallBusyBox: developerInstallBusybox,
  BusyboxTelnet: developerBusyboxTelnet,
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
    }
``` 
New features could come. Localization is not done yet and Risky category needs to be implemented. Better UI Spatial Navigation will be implemented and the separators will be replaced by list-arrow-items that will open another menu for each category.

## Installation

Use standard WebIDE connection (old Firefox or Pale Moon) or [gdeploy](https://gitlab.com/suborg/gdeploy) to install the app directly onto your device.

You can also use the `build.sh` script to build a mozApps.mgmt.import (OmniSD/KaiRoot) compatible application package from the current Git snapshot. 

The other option would be OmniJB-Final (Smith method developed by Luxferre) that has been modified to install KaiRoot. Please note that this is a work in progress and it is highly suggested to firstly use the original smith method that installs OmniSD found on bhacker's website.

## Credits

Created and improved by [BananaHackers](https://bananahackers.net) group members:

- Luxferre - main research and coding;
- Anthill - Unisoc-compatible rooted `adbd` version;
- fabio_malagas - Unisoc device testing.
- Affe Null - Busybox Expert
- Speeduploop - Telnetd & Different ADBRoot Method
- Lcsunm & LiarOnce - ALLA App Manager
- canicjuz - (Beautiful) KaiUI
- Cyan2048 - Endless Emotional Support
- strukturart - BHackers Admin & God-like Knowledge
