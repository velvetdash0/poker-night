import { createContext, useContext } from 'react';
import { StyleSheet, Text, type TextProps } from 'react-native';
import { colors, font, type FontWeight } from '../src/theme';

export const FontsReadyContext = createContext(false);

type Props = TextProps & {
  weight?: FontWeight;
  color?: string;
};

export function AppText({ weight = 'medium', color = colors.ink, style, ...props }: Props) {
  const ready = useContext(FontsReadyContext);
  return (
    <Text
      maxFontSizeMultiplier={1.3}
      {...props}
      style={[styles.base, { color, fontFamily: ready ? font[weight] : undefined }, style]}
    />
  );
}

const styles = StyleSheet.create({
  base: {
    includeFontPadding: false,
  },
});
