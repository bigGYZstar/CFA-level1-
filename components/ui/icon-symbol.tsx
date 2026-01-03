// Fallback for using MaterialIcons on Android and web.

import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { SymbolWeight, SymbolViewProps } from "expo-symbols";
import { ComponentProps } from "react";
import { OpaqueColorValue, type StyleProp, type TextStyle } from "react-native";

type IconMapping = Record<SymbolViewProps["name"], ComponentProps<typeof MaterialIcons>["name"]>;
type IconSymbolName = keyof typeof MAPPING;

/**
 * Add your SF Symbols to Material Icons mappings here.
 */
const MAPPING = {
  "house.fill": "home",
  "paperplane.fill": "send",
  "chevron.left.forwardslash.chevron.right": "code",
  "chevron.right": "chevron-right",
  // CFA単語帳アプリ用アイコン
  "book.fill": "menu-book",
  "questionmark.circle.fill": "quiz",
  "gearshape.fill": "settings",
  "magnifyingglass": "search",
  "star.fill": "star",
  "star": "star-outline",
  "bookmark.fill": "bookmark",
  "bookmark": "bookmark-border",
  "arrow.left": "arrow-back",
  "checkmark.circle.fill": "check-circle",
  "xmark.circle.fill": "cancel",
  "play.fill": "play-arrow",
  "pause.fill": "pause",
  "arrow.clockwise": "refresh",
  "list.bullet": "list",
  "chart.bar.fill": "bar-chart",
  "clock.fill": "schedule",
  "flag.fill": "flag",
} as IconMapping;

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
  return <MaterialIcons color={color} size={size} name={MAPPING[name]} style={style} />;
}
