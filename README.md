# Slideshow for RaspberryPi
Start a slideshow in fullscreen Chromium on startup for Raspberry Pi  

## Required
- RaspberryPi with Raspbian Jessie
- NodeJS with ES6 (v6+)
- Node forever: `sudo npm -g install forever`
- USB library: `sudo apt-get install build-essential libudev-dev`

## Install
- `npm install`

## Config
- `volumesDir` - Directory where USB disks are mounted (default /media/pi/)
- `imagesDirName` - Images directory name
- `slideshowInterval` - Time in ms for each image to be shown
- `slideshowTransition` - Time in ms for transition between images

## How it works
- When app is started it looks for image folder on USB disks (`<volumesDir>/**/<imageDirName>`)
    - If no image dir is found it will use the default image folder `./images`
- Server is started with hosting images from found image folder
- Config can be overwritten by creating a `SETTINGS.txt` file in images folder
    - Settings file must be formatted in INI style: `lideshowInterval=N`
- When a USB stick is attached the app will restart and the slideshow  will be refreshed with the new images folder

## Get it running

### Starting app on boot
`sudo nano /etc/init.d/slideshow-raspberrypi`

```
#!/bin/sh
#/etc/init.d/slideshow-raspberrypi

export PATH=$PATH:/usr/local/bin
export NODE_PATH=$NODE_PATH:/usr/local/lib/node_modules

case "$1" in
  start)
  exec forever --sourceDir=/home/pi/code/Slideshow.RasberryPi/ index.js
 ;;
stop)
  exec forever stop --sourceDir=/home/pi/code/Slideshow.RasberryPi index.js
  ;;
*)
  echo "Usage: /etc/init.d/slideshow-raspberrypi {start|stop}"
  exit 1
  ;;
esac

exit 0
```

`sudo chmod 755 /etc/init.d/slideshow-raspberrypi`

`sudo update-rc.d slideshow-raspberrypi defaults`

http://www.slidequest.com/q/70ang

### Starting Chromeium on in fullscreen on boot
`cp /etc/xdg/lxsession/LXDE-pi/autostart /home/pi/.config/lxsession/LXDE-pi/autostart`

`sudo nano /home/pi/.config/lxsession/LXDE-pi/autostart`

```
@lxpanel --profile LXDE-pi
@pcmanfm --desktop --profile LXDE-pi
@xscreensaver -no-splash
@point-rpi
@chromium-browser --incognito --kiosk http://localhost:3000/
```

https://raspberrypi.stackexchange.com/questions/40631/setting-up-a-kiosk-with-chromium

## Force screen to stay on
`sudo nano /etc/lightdm/lightdm.conf`

Add the following lines to the `[SeatDefaults]` section:
```
xserver-command=X -s 0 dpms
```

http://www.raspberry-projects.com/pi/pi-operating-systems/raspbian/gui/disable-screen-sleep