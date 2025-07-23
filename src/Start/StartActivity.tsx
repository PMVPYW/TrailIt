import { Button, Card, Text, useTheme } from "react-native-paper";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import * as Location from "expo-location";
import * as TaskManager from "expo-task-manager";
import { useState, useEffect } from "react";
import { getRunCoordinates, insertRunCoordinate } from "@/utils/db_utils";
import { RunCoordinate } from "@/utils/TableInterfaces";

export default function App() {
  const theme = useTheme();
  const [locations, setLocations] = useState<RunCoordinate[]>([]);
  useEffect(() => {
    getRunCoordinates().then((data) => {
      setLocations(data);
    });
  }, []);

  const [started, setStarted] = useState<boolean>(false);
  return (
    <SafeAreaProvider>
      <SafeAreaView
        style={{ flex: 1, backgroundColor: theme.colors.background }}
      >
        <Card>
          <Card.Content>
            <Text variant="displaySmall">Duration: 00:00:00</Text>
            <Text variant="displaySmall">Distance: 0.00km</Text>
          </Card.Content>
          <Card.Actions>
            {started ? 
            <Button
              mode="contained"
              onPress={() => {
                stop_tracking();setStarted(false)
              }}
            >
              Stop#i18n
            </Button>
            : <Button
              mode="contained"
              onPress={() => {
                start_tracking();setStarted(true);
              }}
            >
              Start#i18n
            </Button>}
          </Card.Actions>
        </Card>
        {locations.map((loc) => (
          <Card>
            <Card.Title title={`${loc.lat} ${loc.lon} ${loc.alt}`}></Card.Title>
          </Card>
        ))}
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

async function start_tracking() {
  
  const foreground: Location.LocationPermissionResponse = await Location.requestForegroundPermissionsAsync();
  if (!foreground.granted) {
    console.error("Foreground permission denied");
    return;
  }

  const background = await Location.requestBackgroundPermissionsAsync();
  if (!background.granted) {
    console.error("Background permission denied");
    return;
  }
  await Location.startLocationUpdatesAsync("location_updates", {
    accuracy: Location.Accuracy.Highest,
    deferredUpdatesDistance: 10,
    showsBackgroundLocationIndicator: true,
  }).catch(console.error);

  const isTracking = await Location.hasStartedLocationUpdatesAsync(
    "location_updates"
  );
  console.log("Started tracking?", isTracking)
}

TaskManager.defineTask(
  "location_updates",
  async ({
    data,
    error,
  }: {
    data: { locations: Location.LocationObject[] };
    error: TaskManager.TaskManagerError | null;
  }) => {
    console.error("entered task");
    if (error) {
      return;
    }
    // Extract the coords from the LocationObject[]
    data.locations.forEach((loc) => insertRunCoordinate(loc));
  }
);

function stop_tracking() {
  Location.stopLocationUpdatesAsync("location_updates");
}