import {
  getRunById,
  getRunCoordinates,
  updateRunsLengt,
} from "@/utils/db_utils";
import { Run } from "@/utils/TableInterfaces";
import { ActivityDetailsRouteParams, calculate_avg_pace_min_per_km, calculateMapBounds, CoordinateArray, secondsToIsoTime, secondsToMinuteAndSecond } from "@/utils/utils";
import { RouteProp, useRoute } from "@react-navigation/native";
import { useEffect, useState } from "react";
import { ScrollView, StatusBar } from "react-native";
import { Card, Text, useTheme } from "react-native-paper";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import MapboxGl from "@rnmapbox/maps";
import { Feature, GeoJsonProperties, LineString } from "geojson";

export default function ActivityDetails() {
  const theme = useTheme();
  const route = useRoute<RouteProp<ActivityDetailsRouteParams, "ActivityDetails">>();
  const { activity_id } = route.params;

  const [activity, setActivity] = useState<Run | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const [center, setCenter] = useState<CoordinateArray>([0, 0]);
  const [bounds, setBounds] = useState<{
    ne: CoordinateArray;
    sw: CoordinateArray;
  }>({
    ne: [0, 0],
    sw: [0, 0],
  });

  const [lineFeature, setLineFeature] = useState<
    Feature<LineString, GeoJsonProperties>
  >({
    type: "Feature",
    properties: {},
    geometry: {
      type: "LineString",
      coordinates: [],
    },
  });

  useEffect(() => {
    getRunById(activity_id).then((act) => {
      if (act === null) {
        return;
      }
      if ((act as Run).total_distance == 0) {
        updateRunsLengt(activity_id).then((updatedRun) => {
          setActivity(updatedRun);
        });
      } else {
        setActivity(act as Run);
      }
    });
    getRunCoordinates(activity_id).then((data) => {
      setLineFeature({
        type: "Feature",
        properties: {},
        geometry: {
          type: "LineString",
          coordinates: data.map((loc) => [loc.lon, loc.lat]),
        },
      });
      setCenter(calculateCenter(data.map((item) => [item.lon, item.lat])));
      setBounds(calculateMapBounds(data.map((item) => [item.lon, item.lat])));
    });
  }, [activity_id]);
  return (
    <SafeAreaProvider>
      <SafeAreaView
        style={{ flex: 1, backgroundColor: theme.colors.background }}
      >
        <StatusBar translucent hidden={false} barStyle="default"></StatusBar>
        <ScrollView style={{ backgroundColor: theme.colors.background }}>
          <Card style={{ margin: 8 }}>
            <Card.Title title={activity?.name} />
            <Card.Content>
              <Text variant="bodyMedium">Date: {activity?.created_at}</Text>
              <Text variant="bodyMedium">
                Duration: {secondsToIsoTime(activity?.duration ?? 0)}
              </Text>
              <Text variant="bodyMedium">
                Distance: {((activity?.total_distance ?? 0) / 1000).toFixed(2)}Km
              </Text>
              <Text variant="bodyMedium">
                Average Pace: {calculate_avg_pace_min_per_km(activity?.total_distance ?? 0, activity?.duration ?? 0)} min/Km
              </Text>
            </Card.Content>
          </Card>
          <MapboxGl.MapView
            styleURL="mapbox://styles/mapbox/satellite-v9"
            style={{ height: 400 }}
            onDidFinishLoadingMap={() => setMapReady(true)}
          >
            {mapReady && (
              <MapboxGl.Camera
                followPitch={60}
                bounds={{
                  ne: bounds.ne,
                  sw: bounds.sw,
                  paddingTop: 50,
                  paddingBottom: 50,
                  paddingLeft: 50,
                  paddingRight: 50,
                }}
                pitch={60}
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
          </MapboxGl.MapView>
        </ScrollView>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

function calculateCenter(coords: CoordinateArray[]): CoordinateArray {
  if (coords.length === 0) {
    return [0, 0];
  }

  let sumLon = 0;
  let sumLat = 0;

  for (const [lon, lat] of coords) {
    sumLon += lon;
    sumLat += lat;
  }

  return [sumLon / coords.length, sumLat / coords.length];
}
