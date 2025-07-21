import { registerRootComponent } from "expo";
import { Appearance, ColorSchemeName, useColorScheme } from "react-native";
import {
  PaperProvider,
  MD3LightTheme,
  MD3DarkTheme,
  MD3Theme,
} from "react-native-paper";

import App from "./App";
import { useEffect, useState } from "react";

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately

export default function Main() {
  const [colorScheme, setColorScheme] = useState<ColorSchemeName>(
    useColorScheme()
  );
  const [theme, setTheme] = useState<MD3Theme>(
    colorScheme == "light" ? MD3LightTheme : MD3DarkTheme
  );

  useEffect(() => {
    const appearanceSubscription = Appearance.addChangeListener(
      ({ colorScheme }) => {
        setColorScheme(colorScheme);
      }
    );
    return () => appearanceSubscription.remove();
  }, []);

  useEffect(() => {
    setTheme(colorScheme == "light" ? MD3LightTheme : MD3DarkTheme);
  }, [colorScheme]);
  return (
    <PaperProvider theme={theme}>
      <App />
    </PaperProvider>
  );
}
registerRootComponent(Main);
