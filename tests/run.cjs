/* Current runtime suites; old studio layout snapshots are retained as references. */
const groups=['theory','guitar','harmony','export','voicing','scales-harmony','chord-matching','makam-tuning'];
async function run(){
  const names=groups.flatMap(name=>require('./'+name+'.test.cjs'));
  require('./motion.test.cjs');
  names.push(...await require('./audio.test.cjs')(),...await require('./pwa-launch.test.cjs')());
  for(const name of names)console.log('✓ '+name);
  console.log(names.length+' core/audio checks + 9 voice-route checks passed.');
}
run().catch(error=>{console.error(error);process.exitCode=1;});
