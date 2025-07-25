import { Button, Card, Text, useTheme } from "react-native-paper";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import * as Location from "expo-location";
import * as TaskManager from "expo-task-manager";
import { useState, useEffect } from "react";
import {
  CreateEmptyRun,
  getRunCoordinates,
  insertRunCoordinate,
  updateRun,
} from "@/utils/db_utils";
import { Run, RunCoordinate } from "@/utils/TableInterfaces";
import MapboxGl from "@rnmapbox/maps";
import type { Feature, LineString, GeoJsonProperties } from "geojson";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { calculateTotalDistance, secondsToIsoTime } from "@/utils/utils";

MapboxGl.setAccessToken(
  "sk.eyJ1IjoicG12MjI0MjY5OCIsImEiOiJjbWRlaGhiODQwMmdlMm9zZWp3am81bm85In0.c7fCa_eQPmViQGrndi6Y4Q"
);

export default function App() {
  const theme = useTheme();
  const [mapReady, setMapReady] = useState(false);
  const [locations, setLocations] = useState<RunCoordinate[]>([]);
  const [startPosition, setStartPosition] = useState<Location.LocationObject>();
  const [currentRun, setCurrentRun] = useState<Run | null>();
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [timeSpent, setTimeSpent] = useState<number>(0);
  const [started, setStarted] = useState<boolean>(false);
  const [distance, setDistance] = useState<number>(0);

  useEffect(() => {
    if (!currentRun) {
      return;
    }
    AsyncStorage.setItem("currentRunId", (currentRun?.id ?? -1).toString());
    const interval = setInterval(() => {
      getRunCoordinates(currentRun?.id).then((locs) => {
        setLocations(locs);
      });
    }, 1000);
    return () => {
      clearInterval(interval);
    };
  }, [currentRun]);

  useEffect(()=>{
    setDistance(calculateTotalDistance(locations));
  }, [locations]);

  useEffect(() => {
    let animationFrameId: number;

    const updateTime = () => {
      if (!started || !startTime) {
        return;
      }
      const now = Date.now();
      setTimeSpent((now - startTime.getTime()) / 1000);
      animationFrameId = requestAnimationFrame(updateTime);
    };

    updateTime();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [started, startTime]);

  useEffect(() => {
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
  }, []);

  const lineFeature: Feature<LineString, GeoJsonProperties> = {
    type: "Feature",
    properties: {},
    geometry: {
      type: "LineString",
      coordinates: locations.map((loc) => [loc.lon, loc.lat]),
    },
  };
  return (
    <SafeAreaProvider>
      <SafeAreaView
        style={{ flex: 1, backgroundColor: theme.colors.background }}
      >
        <Card>
          <Card.Content>
            <Text variant="displaySmall">
              Duration: {secondsToIsoTime(timeSpent)}
            </Text>
            <Text variant="displaySmall">
              Distance: {distance.toFixed(2)}km
            </Text>
          </Card.Content>
          <Card.Actions>
            {started ? (
              <Button
                mode="contained"
                onPress={() => {
                  stop_tracking();
                  setStarted(false);
                  if (startTime == null || currentRun == null) {
                    return;
                  }
                  const duration =
                    (new Date().getTime() - startTime.getTime()) / 1000;
                  console.log(duration, secondsToIsoTime(duration));
                  updateRun({
                    ...currentRun,
                    duration: duration,
                    total_distance: distance*1000,
                  });
                  setCurrentRun(null);
                }}
              >
                Stop#i18n
              </Button>
            ) : (
              <Button
                mode="contained"
                onPress={async () => {
                  start_tracking();
                  const c_run = await CreateEmptyRun();
                  setCurrentRun(c_run);
                  setStartTime(new Date());
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
              followUserLocation={true}
              followPitch={60}
              followZoomLevel={15}
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
            <MapboxGl.Terrain
              sourceID="mapbox-dem"
              style={{ exaggeration: 1.5 }}
            />
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
          <MapboxGl.LocationPuck
            puckBearing="course"
            puckBearingEnabled={true}
            pulsing={{ isEnabled: true, color: "blue" }}
          />
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
    deferredUpdatesDistance: 0,
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
if (!TaskManager.isTaskDefined("location_updates")) {
  TaskManager.defineTask(
    "location_updates",
    async ({
      data,
      error,
    }: {
      data: { locations: Location.LocationObject[] };
      error: TaskManager.TaskManagerError | null;
    }) => {
      if (error) {
        return;
      }
      console.error("entered task");
      // Extract the coords from the LocationObject[]
      const currentRunId = Number(await AsyncStorage.getItem("currentRunId"));
      if (currentRunId < 0) {
        return;
      }
      data.locations.forEach((loc) => insertRunCoordinate(currentRunId, loc));
    }
  );
}

function stop_tracking() {
  Location.stopLocationUpdatesAsync("location_updates");
}
