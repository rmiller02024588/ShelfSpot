import React from 'react';
import { View } from 'react-native';

const Icon = (props) => React.createElement(View, props);

Icon.createIconSet = () => Icon;
Icon.Ionicons = Icon;
Icon.MaterialIcons = Icon;
Icon.MaterialCommunityIcons = Icon;
Icon.FontAwesome = Icon;
Icon.FontAwesome5 = Icon;
Icon.Entypo = Icon;
Icon.Feather = Icon;
Icon.AntDesign = Icon;
Icon.SimpleLineIcons = Icon;
Icon.Octicons = Icon;
Icon.Foundation = Icon;
Icon.EvilIcons = Icon;
Icon.Zocial = Icon;
Icon.default = Icon;

module.exports = Icon;
