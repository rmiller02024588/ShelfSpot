const React = require('react');
const { View } = require('react-native');

const MockMapClustering = ({ children, style, ...props }) => (
  React.createElement(View, { testID: 'map', style, ...props }, children)
);

module.exports = {
  __esModule: true,
  default: MockMapClustering,
};
