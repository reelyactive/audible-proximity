/**
 * Copyright reelyActive 2022
 * We believe in an open Internet of Things
 */


const advlib = require('advlib');
const Barnowl = require('barnowl');
const BarnowlHci = require('barnowl-hci');
const path = require('path');


const DEFAULT_AUDIO_FOLDER_PATH = './data/audio/';
const DEFAULT_PACKET_PROCESSORS = [
    { processor: require('advlib-ble'),
      libraries: [ require('advlib-ble-services'),
                   require('advlib-ble-manufacturers') ],
      options: { ignoreProtocolOverhead: true } }
];
const DEFAULT_PACKET_INTERPRETERS = [ require('advlib-interoperable') ];


/**
 * AudibleProximity Class
 * Programatically play audio files on a portable computer, like the Raspberry
 * Pi, based on its proximity to Bluetooth beacons.
 */
class AudibleProximity {

  /**
   * AudibleProximity constructor
   * @param {Object} options The configuration options.
   * @constructor
   */
  constructor(options) {
    let self = this;
    options = options || {};

    this.audibleDevices = new Map();
    this.audioFolderPath = options.audioFolderPath || DEFAULT_AUDIO_FOLDER_PATH;
    this.packetProcessors = options.packetProcessors ||
                            DEFAULT_PACKET_PROCESSORS;
    this.packetInterpreters = options.packetInterpreters ||
                              DEFAULT_PACKET_INTERPRETERS;

    this.barnowl = createBarnowl(options);
    this.barnowl.on('raddec', (raddec) => { handleRaddec(self, raddec); });
  }

}


/**
 * Create a barnowl instance with a HCI listener.
 * @param {Object} options The configuration options.
 * @return {Barnowl} The Barnowl instance.
 */
function createBarnowl(options) {
  if(!options.hasOwnProperty('barnowl')) {
    options.barnowl = { enableMixing: true };
  }

  let barnowl = new Barnowl(options.barnowl);

  barnowl.addListener(BarnowlHci, {}, BarnowlHci.SocketListener, {});

  return barnowl;
}


/**
 * Handle the given raddec.
 * @param {AudibleProximity} instance The AudibleProximity instance.
 * @param {Raddec} raddec The raddec to handle.
 */
function handleRaddec(instance, raddec) {
  let isKnownAudibleDevice = instance.audibleDevices.has(raddec.signature);

  if(isKnownAudibleDevice) {
    let audibleDevice = instance.audibleDevices.get(raddec.signature);

    audibleDevice.rssi = raddec.toFlattened().rssi;

    instance.audibleDevices.set(raddec.signature, audibleDevice);
  }
  else {
    let processedPackets = advlib.process(raddec.packets,
                                          instance.packetProcessors,
                                          instance.packetInterpreters);
    let isAudible = (processedPackets.hasOwnProperty('uri') &&
                     processedPackets.uri.startsWith('file:/') &&
                     processedPackets.uri.endsWith('.mp3'));

    if(isAudible) {
      let file = path.join(instance.audioFolderPath,
                           new URL(processedPackets.uri).pathname);
      let audibleDevice = { file: file, rssi: raddec.toFlattened().rssi };

      instance.audibleDevices.set(raddec.signature, audibleDevice);
    }
  }
}


module.exports = AudibleProximity;
