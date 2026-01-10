// Fallback for using MaterialIcons on Android and web.

import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { SymbolWeight } from "expo-symbols";
import { ComponentProps } from "react";
import { OpaqueColorValue, type StyleProp, type TextStyle } from "react-native";

// SF Symbol名からMaterial Icons名へのマッピング
const MAPPING = {
  "house.fill": "home",
  "paperplane.fill": "send",
  "chevron.left.forwardslash.chevron.right": "code",
  "chevron.right": "chevron-right",
  "book.fill": "book",
  "book.pages.fill": "menu-book",
  "questionmark.circle.fill": "help",
  "gamepad.fill": "sports-esports",
  "gamecontroller.fill": "sports-esports",
  "gearshape.fill": "settings",
  "magnifyingglass": "search",
  "star.fill": "star",
  "star": "star-outline",
  "bookmark.fill": "bookmark",
  "bookmark": "bookmark-border",
  "arrow.left": "arrow-back",
  "chevron.left": "chevron-left",
  "checkmark.circle.fill": "check-circle",
  "xmark.circle.fill": "cancel",
  "play.fill": "play-arrow",
  "pause.fill": "pause",
  "arrow.clockwise": "refresh",
  "list.bullet": "list",
  "chart.bar.fill": "bar-chart",
  "clock.fill": "schedule",
  "flag.fill": "flag",
  // SRSアルゴリズム設定用
  "brain": "psychology",
  "xmark": "close",
  "info.circle": "info",
  // 音声再生用
  "speaker.wave.2.fill": "volume-up",
  "volume.2.fill": "volume-up",
  "speaker.slash.fill": "volume-off",
} as const;

type IconSymbolName = keyof typeof MAPPING;

/**
 * An icon component that uses native SF Symbols on iOS, and Material Icons on Android and web.
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
  const iconName = MAPPING[name] as ComponentProps<typeof MaterialIcons>["name"];
  return <MaterialIcons color={color} size={size} name={iconName} style={style} />;
}
