import { ScrollView, StatusBar } from "react-native";
import { Card, Text, useTheme } from "react-native-paper";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { generate_tables, getRuns } from "@/utils/db_utils";
import { useEffect, useState } from "react";
import { Run } from "@/utils/TableInterfaces";
import { secondsToIsoTime } from "@/utils/utils";

export default function App() {
    const [runs, setRuns] = useState<Run[]>([]);

  useEffect(() => {
    generate_tables().then(() => {
      getRuns().then((data: Run[]) => {
        setRuns(data);
      });
    });
  }, []);
  const theme = useTheme();

  return (
    <SafeAreaProvider>
      <SafeAreaView
        style={{ flex: 1, backgroundColor: theme.colors.background }}
      >
        <StatusBar translucent hidden={false} barStyle="default"></StatusBar>
        <ScrollView
          style={{ backgroundColor: theme.colors.background }}
        >
          {runs.map((run: Run) => (<Card key={run.id} style={{margin: 8}}>
            <Card.Title title={run.name} titleVariant="displayLarge"></Card.Title>
            <Card.Content>
              <Text variant="bodyMedium">Distance: {run.total_distance/1000} km |#i18n</Text>
              <Text variant="bodyMedium">Duration: {secondsToIsoTime(run.duration)} |#i18n</Text>
              <Text variant="bodyMedium">Difficulty: {run.difficulty}</Text>
              <Text variant="bodyMedium">Date: {run.created_at}</Text>
            </Card.Content>
          </Card>))}
          
        </ScrollView>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}