import React from 'react';
import { View } from 'react-native';

const Icon = (props) => React.createElement(View, props);

const createIconSet = () => Icon;

const Ionicons = Icon;
const MaterialIcons = Icon;
const MaterialCommunityIcons = Icon;
const FontAwesome = Icon;
const FontAwesome5 = Icon;
const Entypo = Icon;
const Feather = Icon;
const AntDesign = Icon;
const SimpleLineIcons = Icon;
const Octicons = Icon;
const Foundation = Icon;
const EvilIcons = Icon;
const Zocial = Icon;

module.exports = {
  createIconSet,
  Ionicons,
  MaterialIcons,
  MaterialCommunityIcons,
  FontAwesome,
  FontAwesome5,
  Entypo,
  Feather,
  AntDesign,
  SimpleLineIcons,
  Octicons,
  Foundation,
  EvilIcons,
  Zocial,
  default: Icon,
};