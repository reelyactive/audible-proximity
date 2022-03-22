/**
 * Copyright reelyActive 2022
 * We believe in an open Internet of Things
 */


const advlib = require('advlib');
const Barnowl = require('barnowl');
const BarnowlHci = require('barnowl-hci');


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
  // TODO
}



module.exports = AudibleProximity;
