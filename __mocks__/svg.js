// __mocks__/svg.js
// Allows Jest to handle SVG imports, often used with @svgr
//export default 'SvgrURL'; // Or a simple string/component mock
const SvgrComponent = 'div';
export default {
  SvgrURL: 'SvgrURL',
  ReactComponent: SvgrComponent,
};
