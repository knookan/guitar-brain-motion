/* Current runtime suites; old studio layout snapshots are retained as references. */
const groups=['library','practice','harmony-diagram','theory','guitar','harmony','export','voicing','voicing-ui','scales-harmony','chord-matching','makam-tuning','preferences-makam','harmony-atlas','harmony-ui','orbit','pool-playback','scene','visual','mobile-pwa-export','standalone','workspace-layout'];
async function run(){
  const names=groups.flatMap(name=>require('./'+name+'.test.cjs'));
  require('./motion.test.cjs');
  names.push(...await require('./audio.test.cjs')(),...await require('./pwa-launch.test.cjs')());
  for(const name of names)console.log('✓ '+name);
  console.log(names.length+' core/audio checks + 9 voice-route checks passed.');
}
run().catch(error=>{console.error(error);process.exitCode=1;});
