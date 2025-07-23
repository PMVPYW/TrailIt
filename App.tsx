import { BottomNavigation, Text } from "react-native-paper";
import RunsList from "@/Runs/RunsList"
import StartActivity from "@/Start/StartActivity"
import { useState } from "react";


export default function App() {
  const [index, setIndex] = useState(0);
  const [routes] = useState([
    { key: 'activity', title: 'Activity#i18n', focusedIcon: 'run-fast', unfocusedIcon: 'run'},
    { key: 'start', title: 'Start#i18n', focusedIcon: 'radiobox-marked', unfocusedIcon: 'radiobox-marked'}
  ]);

  const renderScene = BottomNavigation.SceneMap({
    activity: RunsList,
    start: StartActivity
  });


  return <BottomNavigation navigationState={{ index, routes }}
      onIndexChange={setIndex}
      renderScene={renderScene}/>
}
