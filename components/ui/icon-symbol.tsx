// Fallback for using MaterialIcons on Android and web.

import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { SymbolWeight, SymbolViewProps } from 'expo-symbols';
import { ComponentProps } from 'react';
import { OpaqueColorValue, type StyleProp, type TextStyle } from 'react-native';

type IconMapping = Record<SymbolViewProps['name'], ComponentProps<typeof MaterialIcons>['name']>;
type IconSymbolName = keyof typeof MAPPING;

/**
 * Add your SF Symbols to Material Icons mappings here.
 * - see Material Icons in the [Icons Directory](https://icons.expo.fyi).
 * - see SF Symbols in the [SF Symbols](https://developer.apple.com/sf-symbols/) app.
 */
const MAPPING = {
  // Navigation
  'house.fill': 'home',
  'house': 'home',
  'person.fill': 'person',
  'person': 'person-outline',
  'chevron.left': 'chevron-left',
  'chevron.right': 'chevron-right',
  'xmark': 'close',
  'plus': 'add',
  'checkmark': 'check',

  // Tabs & general UI
  'paperplane.fill': 'send',
  'chevron.left.forwardslash.chevron.right': 'code',
  'gear': 'settings',
  'bell.fill': 'notifications',
  'chart.bar.fill': 'bar-chart',
  'info.circle': 'info-outline',
  'questionmark.circle': 'help-outline',

  // Subject icons
  'book.fill': 'menu-book',
  'bolt.fill': 'flash-on',
  'folder.fill': 'folder',
  'lightbulb': 'lightbulb-outline',
  'headphones': 'headphones',
  'pencil': 'edit',
  'function': 'functions',
  'laptopcomputer': 'laptop',
  'music.note': 'music-note',
  'chart.pie.fill': 'pie-chart',
  'star.fill': 'star',
  'pencil.and.outline': 'edit-note',

  // Recording
  'ear': 'hearing',
  'text.bubble': 'chat',
  'play.fill': 'play-arrow',
  'pause.fill': 'pause',
  'mic.fill': 'mic',
  'play.circle': 'play-circle-outline',

  // Auth & forms
  'lock.fill': 'lock',
  'eye': 'visibility',
  'eye.slash': 'visibility-off',
  'ellipsis': 'more-horiz',

  // Misc
  'line.diagonal': 'show-chart',
  'arrow.up.right': 'trending-up',
  'plus.rectangle.on.rectangle': 'library-add',
} as IconMapping;

/**
 * An icon component that uses native SF Symbols on iOS, and Material Icons on Android and web.
 * This ensures a consistent look across platforms, and optimal resource usage.
 * Icon `name`s are based on SF Symbols and require manual mapping to Material Icons.
 */
export function IconSymbol({
  name,
  size = 24,
  color,
  style,
}: {
  name: IconSymbolName;
  size?: number;
  color: string | OpaqueColorValue;
  style?: StyleProp<TextStyle>;
  weight?: SymbolWeight;
}) {
  const mappedName = MAPPING[name];
  if (!mappedName) {
    // Fallback to a default icon if mapping is missing
    return <MaterialIcons color={color} size={size} name="help-outline" style={style} />;
  }
  return <MaterialIcons color={color} size={size} name={mappedName} style={style} />;
}
