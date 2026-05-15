// Import Mapbox as an ESM module
import mapboxgl from "https://cdn.jsdelivr.net/npm/mapbox-gl@2.15.0/+esm";
import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm";

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

const svg = d3.select("#map").select("svg");

function getCoords(station) {
  const point = new mapboxgl.LngLat(+station.lon, +station.lat); // Convert lon/lat to Mapbox LngLat
  const { x, y } = map.project(point); // Project to pixel coordinates
  return { cx: x, cy: y }; // Return as object for use in SVG attributes
}

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

  let jsonData;
  try {
    const jsonurl =
      "https://dsc106.com/labs/lab07/data/bluebikes-stations.json" ||
      "assets/bluebikes-stations.json";

    // Await JSON fetch
    const jsonData = await d3.json(jsonurl);

    console.log("Loaded JSON Data (stations):", jsonData); // Log to verify structure

    let stations = jsonData.data.stations;
    console.log("Stations Array:", stations);

    const csvurl =
      "https://dsc106.com/labs/lab07/data/bluebikes-traffic-2024-03.csv" ||
      "assets/bluebikes-traffic-2024-03.csv";
    const trips = await d3.csv(csvurl);
    console.log("Loaded CSV Data (trips):", trips);

    // Count departures per station
    const departures = d3.rollup(
      trips,
      (v) => v.length,
      (d) => d.start_station_id
    );

    // Count arrivals per station
    const arrivals = d3.rollup(
      trips,
      (v) => v.length,
      (d) => d.end_station_id
    );

    // Add traffic properties to each station
    stations = stations.map((station) => {
      let id = station.short_name;
      station.arrivals = arrivals.get(id) ?? 0;
      station.departures = departures.get(id) ?? 0;
      station.totalTraffic = station.arrivals + station.departures;
      return station;
    });

    console.log("Stations with traffic:", stations);

    const radiusScale = d3
      .scaleSqrt()
      .domain([0, d3.max(stations, (d) => d.totalTraffic)])
      .range([0, 25]);

    // Append circles to the SVG for each station
    const circles = svg
      .selectAll("circle")
      .data(stations)
      .enter()
      .append("circle")
      .attr("r", (d) => radiusScale(d.totalTraffic))
      .attr("fill", "steelblue")
      .attr("stroke", "white")
      .attr("stroke-width", 1)
      .attr("opacity", 0.8)
      .each(function (d) {
        d3.select(this)
          .append("title")
          .text(
            `${d.totalTraffic} trips (${d.departures} departures, ${d.arrivals} arrivals)`
          );
      });

    // Function to update circle positions when the map moves/zooms
    function updatePositions() {
      circles
        .attr("cx", (d) => getCoords(d).cx) // Set the x-position using projected coordinates
        .attr("cy", (d) => getCoords(d).cy); // Set the y-position using projected coordinates
    }

    // Initial position update when map loads
    updatePositions();

    // Reposition markers on map interactions
    map.on("move", updatePositions); // Update during map movement
    map.on("zoom", updatePositions); // Update during zooming
    map.on("resize", updatePositions); // Update on window resize
    map.on("moveend", updatePositions); // Final adjustment after movement ends
  } catch (error) {
    console.error("Error loading JSON:", error); // Handle errors
  }
});
