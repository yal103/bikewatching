// Import Mapbox as an ESM module
import mapboxgl from "https://cdn.jsdelivr.net/npm/mapbox-gl@2.15.0/+esm";

// Check that Mapbox GL JS is loaded
console.log("Mapbox GL JS Loaded:", mapboxgl);

// Set your Mapbox access token here
mapboxgl.accessToken =
  "pk.eyJ1IjoieWFsMTAzIiwiYSI6ImNtcDR2bzNhdTBmZTQycW9scnBxaW1menAifQ.tY_hVCEIqHFLZ_Rl1T-BzQ";

// Initialize the map
const map = new mapboxgl.Map({
  container: "map", // ID of the div where the map will render
  style: "mapbox://styles/yal103/cmp4wmv02001t01su56ftbyjz", // Map style
  center: [-71.09415, 42.36027], // [longitude, latitude]
  zoom: 12, // Initial zoom level
  minZoom: 5, // Minimum allowed zoom
  maxZoom: 18, // Maximum allowed zoom
});

const bikeLaneStyle = {
  type: "line",
  paint: {
    "line-color": "green",
    "line-width": 3,
    "line-opacity": 0.4,
  },
};

map.on("load", async () => {
  // Boston bike lanes
  map.addSource("boston_route", {
    type: "geojson",
    data: "https://bostonopendata-boston.opendata.arcgis.com/datasets/boston::existing-bike-network-2022.geojson",
  });

  map.addLayer({
    ...bikeLaneStyle,
    id: "boston-bike-lanes",
    source: "boston_route",
  });

  map.addSource("cambridge_route", {
    type: "geojson",
    data: "https://raw.githubusercontent.com/cambridgegis/cambridgegis_data/main/Recreation/Bike_Facilities/RECREATION_BikeFacilities.geojson",
  });

  map.addLayer({
    ...bikeLaneStyle,
    id: "cambridge-bike-lanes",
    source: "cambridge_route",
  });
});
