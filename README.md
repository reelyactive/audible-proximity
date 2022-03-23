audible-proximity
=================

Programatically play audio files on a portable computer, like the Raspberry Pi, based on its proximity to Bluetooth beacons.


Installation
------------

Clone this repository, and from its root folder, run `npm install` to install all dependencies.


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
