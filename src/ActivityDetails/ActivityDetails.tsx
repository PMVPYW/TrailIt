import { getRunById, getRunCoordinates } from "@/utils/db_utils";
import { Run } from "@/utils/TableInterfaces";
import { CoordinateArray, secondsToIsoTime } from "@/utils/utils";
import { useRoute } from "@react-navigation/native";
import { useEffect, useState } from "react";
import { ScrollView, StatusBar } from "react-native";
import { Card, Text, useTheme } from "react-native-paper";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import MapboxGl from "@rnmapbox/maps";
import { Feature, GeoJsonProperties, LineString } from "geojson";

export default function ActivityDetails() {
  const theme = useTheme();
  const route = useRoute();
  const { activity_id } = route.params;

  const [activity, setActivity] = useState<Run | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const [center, setCenter] = useState<CoordinateArray>([0, 0]);

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
      setActivity(act as Run);
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
      setCenter(calculateCenter(data.map(item=>[item.lon, item.lat])));
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
            </Card.Content>
          </Card>
          <MapboxGl.MapView
            styleURL="mapbox://styles/mapbox/satellite-v9"
            style={{ height: 400 }}
            onDidFinishLoadingMap={() => setMapReady(true)}
          >
            {mapReady && (
              <MapboxGl.Camera
                followUserLocation={true}
                followPitch={60}
                followZoomLevel={15}
                zoomLevel={15}
                pitch={60}
                centerCoordinate={center}
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
