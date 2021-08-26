#!/tmp/busybox sh

# KaiRoot package
# SMITH-Omnirun by Luxferre

SETTINGSFILE='/system/b2g/defaults/settings.json'
PREFFILE='/system/b2g/defaults/pref/user.js'
OMNIJA='/system/b2g/omni.ja'
WEBAPPS='/system/b2g/webapps/webapps.json'
 
# mount /system and /sdcard
/tmp/busybox mount -t ext4 -o rw /dev/block/bootdevice/by-name/system /system
/tmp/busybox mount -t vfat -o rw /dev/block/mmcblk1p1 /sdcard

# create backup files on memory card
TIMESTAMP=`date +%s`
/tmp/busybox cp $SETTINGSFILE /sdcard/b2g-settings-backup.${TIMESTAMP}.json
/tmp/busybox cp $PREFFILE /sdcard/b2g-pref-backup.${TIMESTAMP}.json
/tmp/busybox cp $OMNIJA /sdcard/b2g-omni.${TIMESTAMP}.ja
/tmp/busybox cp $WEBAPPS /sdcard/b2g-webapps-backup.${TIMESTAMP}.json

# unmount /sdcard after creating the backup
/tmp/busybox umount /sdcard

# replace the developer menu setting entries
/tmp/busybox sed -i 's/"developer.menu.enabled":false/"developer.menu.enabled":true/g' $SETTINGSFILE
/tmp/busybox sed -i 's/"debug.console.enabled":false/"debug.console.enabled":true/g' $SETTINGSFILE
echo "pref('developer.menu.enabled', true);" >> $PREFFILE
echo "pref('debug.console.enabled', true);" >> $PREFFILE

# try to unpack current omni.ja version

/tmp/busybox mkdir /tmp/omnipatch
/tmp/busybox cp /system/b2g/omni.ja /tmp/omnipatch
cd /tmp/omnipatch
/tmp/unzip -q omni.ja
/tmp/busybox rm omni.ja

# patch the ImportExport module

/tmp/busybox sed -i 's/_openPackage(appFile,meta,false);/_openPackage(appFile,meta,true);isSigned=true;devMode=true;/g' modules/ImportExport.jsm

# try to repack omni.ja file

/tmp/zip -qr9XD omni.ja * > /sdcard/zip_logs.txt

# replace omni.ja with the jailbreak-patched version

/tmp/busybox cp omni.ja $OMNIJA

# place OmniSD package into system installation

/tmp/busybox cp -r /tmp/kairoot.bananahackers.net /system/b2g/webapps/kairoot.bananahackers.net

# patch webapps.json registry

MANCONT=$(/tmp/busybox cat $WEBAPPS)
echo -n ${MANCONT%?} > /tmp/webapps.json
/tmp/busybox cat /tmp/webapps.json /tmp/decl.patch > $WEBAPPS

# unmount /system
/tmp/busybox umount /system
echo "Changes applied"

