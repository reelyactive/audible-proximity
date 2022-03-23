/**
 * Copyright reelyActive 2022
 * We believe in an open Internet of Things
 */


const advlib = require('advlib');
const Barnowl = require('barnowl');
const BarnowlHci = require('barnowl-hci');
const mpg = require('mpg123');
const path = require('path');


const DEFAULT_AUDIO_FOLDER_PATH = './data/audio/';
const DEFAULT_MAX_CONCURRENT_PLAYERS = 2;
const DEFAULT_MAX_VOLUME_RSSI = -60;
const DEFAULT_AUDIO_UPDATE_MILLISECONDS = 500;
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
    this.maxVolumeRSSI = options.maxVolumeRSSI || DEFAULT_MAX_VOLUME_RSSI;
    this.packetProcessors = options.packetProcessors ||
                            DEFAULT_PACKET_PROCESSORS;
    this.packetInterpreters = options.packetInterpreters ||
                              DEFAULT_PACKET_INTERPRETERS;

    this.barnowl = createBarnowl(options);
    this.barnowl.on('raddec', (raddec) => { handleRaddec(self, raddec); });
    this.players = createPlayers(options);

    setInterval(updateAudioPlayback, DEFAULT_AUDIO_UPDATE_MILLISECONDS, self);
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
 * Create an array of media players.
 * @param {Object} options The configuration options.
 * @return {Array} The media players.
 */
function createPlayers(options) {
  let maxConcurrentPlayers = options.maxConcurrentPlayers ||
                             DEFAULT_MAX_CONCURRENT_PLAYERS;
  let players = [];

  for(let cPlayer = 0; cPlayer < maxConcurrentPlayers; cPlayer++) {
    let player = { instance: new mpg.MpgPlayer() };
    players.push(player);
  }

  return players;
}


/**
 * Handle the given raddec.
 * @param {AudibleProximity} instance The AudibleProximity instance.
 * @param {Raddec} raddec The raddec to handle.
 */
function handleRaddec(instance, raddec) {
  let isKnownAudibleDevice = instance.audibleDevices.has(raddec.signature);
  let rssi = raddec.rssiSignature[0].rssi;
  let targetVolume = 0;

  if(rssi) {
    targetVolume = 100 - Math.max(instance.maxVolumeRSSI - rssi, 0);
  }

  if(isKnownAudibleDevice) {
    let audibleDevice = instance.audibleDevices.get(raddec.signature);

    audibleDevice.targetVolume = targetVolume;

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
      let audibleDevice = { file: file, targetVolume: targetVolume };

      instance.audibleDevices.set(raddec.signature, audibleDevice);
    }
  }
}


/**
 * Update the audio playback.
 * @param {AudibleProximity} instance The AudibleProximity instance.
 */
function updateAudioPlayback(instance) {
  if(instance.audibleDevices.size === 0) {
    return;
  }

  let closestAudibleDevices = new Map([...instance.audibleDevices.entries()]
                        .sort((a, b) => b[1].targetVolume - a[1].targetVolume));

  closestAudibleDevices.forEach((audibleDevice, index) => {
    if(index < instance.players.length) {
      let player = instance.players[index].instance;

      // TODO: implement intended functionality rather than single play
      player.volume(audibleDevice.targetVolume);
      player.play(audibleDevice.file);
    }
  });
}


module.exports = AudibleProximity;
