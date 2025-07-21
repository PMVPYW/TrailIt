import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';
import { FAB, useTheme } from 'react-native-paper';


export default function App() {
  const theme = useTheme();
  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Text style={{ color: theme.colors.onBackground, fontSize: 18 }}>
        Hello, this is {theme.dark ? 'Dark' : 'Light'} mode!
      </Text>
      <FAB icon="plus"></FAB>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});