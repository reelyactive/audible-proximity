audible-proximity
=================

Programatically play audio files on a portable computer, like the Raspberry Pi, based on its proximity to Bluetooth beacons.  If using a Pi, our [Prepare a headless Raspberry Pi from scratch](https://reelyactive.github.io/diy/pi-prep/) is the ideal starting point. 


Installation
------------

Clone this repository, and from its root folder, run `npm install` to install all dependencies.

If using a Pi, we recommend installing as follows:
```
mkdir ~/reelyActive
cd ~/reelyActive
git clone https://github.com/reelyactive/audible-proximity.git
cd audible-proximity
npm install
```


Quick Start
-----------

To start __audible-proximity__ run `npm start` again from the root folder.

If an EPERM error is encountered, follow the instructions for [assigning privileges](https://github.com/reelyactive/barnowl-hci/#assigning-privileges) in barnowl-hci.


Prerequisites
-------------

__audible-proximity__ requires the [mpg123](https://www.mpg123.de/) lightweight media player, which can easily be installed on Ubuntu/Debian Linux distributions (such as that on a Raspberry Pi) with the command `sudo apt install mpg123`


Audio Files
-----------

By default, audio files are expected to be found in the data/audio subfolder of this repository and have the form __xxxxxxx.mp3__ where each 'x' is a hexadecimal character (0-9 or a-f), for example 0123abc.mp3.

A Bluetooth beacon transmitting an [InteroperaBLE Identifier](https://reelyactive.github.io/interoperable-identifier/) with the entity UUID __496f4944-434f-4445-b73e-2e2f2e6d7033__ will have its 28-bit instance ID interpreted as the filename of the associated .mp3 file.

An audio file is included to facilitate out-of-the-box testing (data/audio/0000000.mp3).  To trigger this audio file, configure a Bluetooth beacon (or a beacon simulator app for mobile devices) as Eddystone-UID with the following parameters:
- _Namespace ID:_ 496f49442e2f2e6d7033
- _Instance ID:_ 000000000000


Debug Mode
----------

Alternatively, start __audible-proximity__ with the command `npm run debug` to print status updates to the console for debugging and to facilitate the tweaking of parameters.


Run-on-Boot
-----------

To run __audible-proximity__ automatically every time the Pi boots up:
- Copy the unit file to the systemd system folder with the command `sudo cp units/audible-proximity-pi.service /lib/systemd/system`
- Enable the audible-proximity service with the command `sudo systemctl enable audible-proximity-pi.service`
- Start the audible-proximity service with the command `sudo systemctl start audible-proximity-pi.service`

Note that it may be necessary to edit the WorkingDirectory and/or ExecStart paths to match the installed location of the __audible-proximity__ repository and npm, respectively.


License
-------

MIT License

Copyright (c) 2022 [reelyActive](https://www.reelyactive.com)

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR 
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, 
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE 
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER 
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, 
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN 
THE SOFTWARE.
