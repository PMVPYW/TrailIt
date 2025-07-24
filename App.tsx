import { BottomNavigation, Text } from "react-native-paper";
import RunsList from "@/Runs/RunsList";
import StartActivity from "@/Start/StartActivity";
import { useState } from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { NavigationContainer } from "@react-navigation/native";
import ActivityDetails from "@/ActivityDetails/ActivityDetails";
import { RootStackParamList, Route } from "@/utils/utils";

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen
          name="HomeTabs"
          component={BottomTabs}
          options={{ headerShown: false }}
        />
        <Stack.Screen name="ActivityDetails" component={ActivityDetails} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

function BottomTabs() {
  const [index, setIndex] = useState(0);
  const [routes] = useState<Route[]>([
    {
      key: "activity",
      title: "Activity#i18n",
      focusedIcon: "run-fast",
      unfocusedIcon: "run",
    },
    {
      key: "start",
      title: "Start#i18n",
      focusedIcon: "radiobox-marked",
      unfocusedIcon: "radiobox-marked",
    },
  ]);

  function renderScene({ route }: { route: Route }) {
  switch (route.key) {
    case "activity":
      return <RunsList />;
    case "start":
      return <StartActivity />;
    default:
      return null;
  }
}

  return (
    <BottomNavigation
      navigationState={{ index, routes }}
      onIndexChange={setIndex}
      renderScene={renderScene}
    />
  );
}
