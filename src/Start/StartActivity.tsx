import { Button, Card, Text, useTheme } from "react-native-paper";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import * as Location from "expo-location";
import * as TaskManager from "expo-task-manager";
import { useState, useEffect } from "react";
import { getRunCoordinates, insertRunCoordinate } from "@/utils/db_utils";
import { RunCoordinate } from "@/utils/TableInterfaces";
import MapboxGl from "@rnmapbox/maps";
import type { Feature, LineString, GeoJsonProperties } from "geojson";

MapboxGl.setAccessToken(
  "sk.eyJ1IjoicG12MjI0MjY5OCIsImEiOiJjbWRlaGhiODQwMmdlMm9zZWp3am81bm85In0.c7fCa_eQPmViQGrndi6Y4Q"
);

export default function App() {
  const theme = useTheme();
  const [mapReady, setMapReady] = useState(false);
  const [locations, setLocations] = useState<RunCoordinate[]>([]);
  const [startPosition, setStartPosition] = useState<Location.LocationObject>();
  useEffect(() => {
    const interval = setInterval(() => {
      getRunCoordinates().then(setLocations);
    }, 1000);

    const requestPermissionsAndGetLocation = async () => {
      const foreground: Location.LocationPermissionResponse =
        await Location.requestForegroundPermissionsAsync();
      if (!foreground.granted) {
        console.error("Foreground permission denied");
        return;
      }

      const background = await Location.requestBackgroundPermissionsAsync();
      if (!background.granted) {
        console.error("Background permission denied");
        return;
      }
      setStartPosition(
        await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Highest,
        })
      );
    };

    requestPermissionsAndGetLocation();
    return () => clearInterval(interval);
  }, []);

  const lineFeature: Feature<LineString, GeoJsonProperties> = {
    type: "Feature",
    properties: {},
    geometry: {
      type: "LineString",
      coordinates: locations.map((loc) => [loc.lon, loc.lat]),
    },
  };

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
            {started ? (
              <Button
                mode="contained"
                onPress={() => {
                  stop_tracking();
                  setStarted(false);
                }}
              >
                Stop#i18n
              </Button>
            ) : (
              <Button
                mode="contained"
                onPress={() => {
                  start_tracking();
                  setStarted(true);
                }}
              >
                Start#i18n
              </Button>
            )}
          </Card.Actions>
        </Card>
        <MapboxGl.MapView
          styleURL="mapbox://styles/mapbox/satellite-v9"
          style={{ flex: 1 }}
          onDidFinishLoadingMap={() => setMapReady(true)}
        >
          {mapReady && (
            <MapboxGl.Camera
              zoomLevel={15}
              pitch={60}
              centerCoordinate={[
                startPosition?.coords.longitude ?? 0,
                startPosition?.coords.latitude ?? 0,
              ]}
            />
          )}
          <MapboxGl.RasterDemSource
            id="mapbox-dem"
            url="mapbox://mapbox.terrain-rgb"
            tileSize={512}
          >
            <MapboxGl.Terrain sourceID="mapbox-dem" style={{exaggeration: 1.5}} />
          </MapboxGl.RasterDemSource>
          <MapboxGl.ShapeSource id="lineSource" shape={lineFeature}>
            <MapboxGl.LineLayer
              id="lineLayer"
              style={{
                lineColor: "blue",
                lineWidth: 3,
                lineCap: "round",
                lineJoin: "round",
              }}
            />
          </MapboxGl.ShapeSource>
        </MapboxGl.MapView>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

async function start_tracking() {
  const foreground: Location.LocationPermissionResponse =
    await Location.requestForegroundPermissionsAsync();
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
    foregroundService: {
      notificationTitle: "Tracking your run",
      notificationBody: "Location updates in background",
    },
  }).catch(console.error);

  const isTracking = await Location.hasStartedLocationUpdatesAsync(
    "location_updates"
  );
  console.log("Started tracking?", isTracking);
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
