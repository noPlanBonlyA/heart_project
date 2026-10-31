// hls.js ships types only for its main entry; the light build has the same API
declare module 'hls.js/light' {
  export { default } from 'hls.js';
}
