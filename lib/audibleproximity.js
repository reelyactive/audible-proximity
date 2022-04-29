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
const DEFAULT_MIN_VOLUME_RSSI = -80;
const DEFAULT_AUDIO_UPDATE_MILLISECONDS = 500;
const DEFAULT_STALE_THRESHOLD_MILLISECONDS = 10000;
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
    this.minVolumeRSSI = options.minVolumeRSSI || DEFAULT_MIN_VOLUME_RSSI;
    this.staleThresholdMilliseconds = options.staleThresholdMilliseconds ||
                                      DEFAULT_STALE_THRESHOLD_MILLISECONDS;
    this.packetProcessors = options.packetProcessors ||
                            DEFAULT_PACKET_PROCESSORS;
    this.packetInterpreters = options.packetInterpreters ||
                              DEFAULT_PACKET_INTERPRETERS;
    this.isDebug = options.isDebug || false;

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
    let player = { instance: new mpg.MpgPlayer(), file: null, volume: 0 };
    player.instance.on('error', (error) => { console.log(error.message); });
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

  if(rssi > instance.maxVolumeRSSI) {
    targetVolume = 100;
  }
  else if(rssi > instance.minVolumeRSSI) {
    targetVolume = (rssi - instance.minVolumeRSSI) *
                   (100 / (instance.maxVolumeRSSI - instance.minVolumeRSSI));
  }

  if(isKnownAudibleDevice) {
    let audibleDevice = instance.audibleDevices.get(raddec.signature);
    let newTargetVolume = (audibleDevice.targetVolume + targetVolume) / 2;

    audibleDevice.targetVolume = newTargetVolume;
    audibleDevice.timestamp = raddec.timestamp;

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
      let audibleDevice = {
          file: file,
          targetVolume: targetVolume,
          timestamp: raddec.timestamp
      };

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
    if(instance.isDebug) {
      console.log('No audible devices in proximity');
    }
    return;
  }

  let staleThreshold = Date.now() - instance.staleThresholdMilliseconds;

  // First loop: progressively reduce the volume of devices no longer detected
  //             until they are stale and "muted" 
  instance.audibleDevices.forEach((audibleDevice) => {
    if(audibleDevice.timestamp < staleThreshold) {
      audibleDevice.targetVolume = 0;
    }
    else {
      let staleRatio = Math.max(Date.now() - audibleDevice.timestamp, 0) /
                       (instance.staleThresholdMilliseconds * 2);
      audibleDevice.targetVolume *= (1 - staleRatio);
    }
  });

  let concurrencyCount = 0;
  let unplayedDevices = [];
  let availablePlayers = Array(instance.players.length).fill(true);
  let closestAudibleDevices = new Map([...instance.audibleDevices.entries()]
                        .sort((a, b) => b[1].targetVolume - a[1].targetVolume));

  // Second loop: update players already matched with audible devices
  closestAudibleDevices.forEach((audibleDevice) => {
    if(concurrencyCount++ < instance.players.length) {
      let playerIndex = updatePlayers(instance.players, audibleDevice);

      // There is no player assigned to this audibleDevice
      if(playerIndex === null) {
        unplayedDevices.push(audibleDevice);
      }
      else {
        availablePlayers[playerIndex] = false;
      }
    }
  });

  // Third loop: update remaining players with loudest audible devices
  unplayedDevices.forEach((audibleDevice) => {
    for(let index = 0; index < availablePlayers.length; index++) {
      if(availablePlayers[index] === true) {
        let player = instance.players[index];
        player.instance.volume(audibleDevice.targetVolume);
        player.volume = audibleDevice.targetVolume;
        player.file = audibleDevice.file;
        if(audibleDevice.targetVolume > 0) {
          player.instance.play(audibleDevice.file);
        }
        else {
          player.instance.stop();
        }
        availablePlayers[index] = false;
        index = availablePlayers.length;
      }
    }
  });

  if(instance.isDebug) {
    printStatus(instance);
  }
}


/**
 * Update the players with the given audible device settings.
 * @param {Array} players The array of players.
 * @param {Object} audibleDevice The audible device settings.
 */
function updatePlayers(players, audibleDevice) {
  let playerIndex = null;

  players.forEach((player, index) => {
    if(player.file === audibleDevice.file) {
      let updatedVolume = (audibleDevice.targetVolume + player.volume) / 2;
      playerIndex = index;
      player.instance.volume(updatedVolume);
      player.volume = updatedVolume;
      if(player.instance.track === null) {
        player.instance.play(audibleDevice.file);
      }
    }
  });

  return playerIndex;
}


/**
 * Print the current status to the console.
 * @param {AudibleProximity} instance The AudibleProximity instance.
 */
function printStatus(instance) {
  console.log('\r\n----- Playing:');
  instance.players.forEach(player => {
    console.log(player.file + ' @ ' + Math.round(player.volume));
  });
  console.log('----- Based on:');
  instance.audibleDevices.forEach(device => {
    console.log(device.file + ' @ ' + Math.round(device.targetVolume));
  });
}


module.exports = AudibleProximity;
