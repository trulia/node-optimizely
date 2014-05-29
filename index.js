/**
 * Gateway to assorted js+jquery-node engines
 * requires choosen engine in a sync manner
 */

// export definition
module.exports = gatewaySync;

function gatewaySync(engine)
{
  return require('./lib/'+engine);
}
