/** @type {import('@capacitor/background-runner').RunnerConfig} */
module.exports = {
  label: 'com.neighborlink.background',
  src: 'background.js',
  event: 'syncOfflineQueue',
  repeat: true,
  interval: 15,       // minutes — iOS BGAppRefresh minimum
  autoSchedule: true,
};
