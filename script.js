/*--------------------------------------------------------------------
GGR472 LAB 4: Incorporating GIS Analysis into web maps using Turf.js 
--------------------------------------------------------------------*/

/*--------------------------------------------------------------------
Step 1: INITIALIZE MAP
--------------------------------------------------------------------*/
// Define access token
mapboxgl.accessToken = 'pk.eyJ1IjoiYWhtYWRhc2hyYWYxNTQiLCJhIjoiY2xyaTYzNXlsMDM0eDJpcnhtY3lnb2QzdCJ9.PUhrzYu0LU7a6_Up5_Q-eA';

// Initialize map
const map = new mapboxgl.Map({
    container: 'map', // container id in HTML
    style: 'mapbox://styles/mapbox/dark-v11', // map style
    center: [-79.39, 43.65],  // starting point, longitude/latitude
    zoom: 12 // starting zoom level
});

// Add zoom and rotation controls to the map.
map.addControl(new mapboxgl.NavigationControl());


/*--------------------------------------------------------------------
Step 2: VIEW GEOJSON POINT DATA ON MAP
--------------------------------------------------------------------*/
// Create an empty variable
let colgeojson;

// Fetch GeoJSON from URL and store response
fetch('https://raw.githubusercontent.com/ahmadashraf1/GGR472-Lab4/main/pedcyc_collision_06-21.geojson')
    .then(response => response.json())
    .then(response => {
        // console.log(response); // Check response in console
        colgeojson = response; // Store geojson as variable using URL from fetch response
    });


// Load data to Map
map.on('load', () => {

    // Create bounding box around the collision point data
    bbox = turf.envelope(colgeojson)

    bboxTransformed = turf.transformScale(bbox, 1.1)

    // Store as a feature collection variable
    bboxgeojson = {
        "type": "FeatureCollection",
        "features": [bboxTransformed]
    }

    // Access and store the bounding box coordinates as an array variable
    const minX = bboxTransformed.geometry.coordinates[0][0][0];
    const minY = bboxTransformed.geometry.coordinates[0][0][1];
    const maxX = bboxTransformed.geometry.coordinates[0][2][0];
    const maxY = bboxTransformed.geometry.coordinates[0][2][1];

    let bboxcords = [minX, minY, maxX, maxY]

    // Use bounding box coordinates as argument in the turf hexgrid function
    const hexgrid = turf.hexGrid(bboxcords, 0.5, { units: 'kilometres' });

    let colhex = turf.collect(hexgrid, colgeojson, '_id', 'values')

    let maxcol = 0;


    // Adding count for loop
    colhex.features.forEach((feature) => { // iterate through features
        feature.properties.COUNT = feature.properties.values.length // create new property count to be the length of the values array
        if (feature.properties.COUNT > maxcol) { // if the count of this feature is greater than the current max number collisions
            maxcol = feature.properties.COUNT // set the max collisions variable to be the count for this feature 
        }
    });


    // Add datasource using GeoJSON variable
    map.addSource('toronto-col', {
        type: 'geojson',
        data: colgeojson
    });

    map.addLayer({
        'id': 'toronto-col-pnts',
        'type': 'circle',
        'source': 'toronto-col',
        'paint': {
            'circle-radius': 3,
            'circle-color': 'blue'
        }
    });


    let envresult;
    document.getElementById('bboxbutton').addEventListener('click', () => {
        let enveloped = turf.envelope(musgeojson); // send point geojson to turf, creates an 'envelope' (bounding box) around points
    
        // put the resulting envelope in a geojson format FeatureCollection
        envresult = {
            "type": "FeatureCollection",
            "features": [enveloped]
        };
    
        // add the bounding box we just created to the map
        map.addSource('envelopeGeoJSON', {
            "type": "geojson",
            "data": envresult  // use bbox geojson variable as data source
        });
    
        map.addLayer({
            "id": "musEnvelope",
            "type": "fill",
            "source": "envelopeGeoJSON",
            "paint": {
                'fill-color': "red",
                'fill-opacity': 0.5,
                'fill-outline-color': "black"
            }
        });
    
        document.getElementById('bboxbutton').disabled = true; // disable button after click
    
    });

    
    map.addSource('col-bbox', {
        type:'geojson',
        data: bboxgeojson
    });

    map.addLayer({
        'id': 'col-bbox',
        'type':'fill',
        'source':'col-bbox',
        'paint':
         {
            'fill-color': "red",
            'fill-opacity': 0.2
         }
    });

    // console.log(bboxTransformed)
    // console.log(bboxTransformed.geometry.coordinates)

    // Adding hexgrid
    map.addSource('col-hexgrid', {
        type: 'geojson',
        data: colhex
    });

    // Adding colorscheme and styling hexgrid
    const colorScheme = d3.schemeBlues[5];

    map.addLayer({
        'id': 'col-hexgrid',
        'type': 'fill',
        'source': 'col-hexgrid',
        'paint': {
            'fill-color': [
                'interpolate',
                ['linear'],
                ['get', 'COUNT'],
                0, colorScheme[0],
                maxcol, colorScheme[colorScheme.length - 1]
            ],
            'fill-opacity': 0.3
        }
        // {
        //     'fill-color': "grey",
        //     'fill-opacity': 0.4
        //  }
    });


    // Adding popup
    map.on('click', 'col-hexgrid', (e) => {
        const count = e.features[0].properties.COUNT;
        const coordinates = e.features[0].geometry.coordinates.slice();
    
        new mapboxgl.Popup()
            .setLngLat(e.lngLat)
            .setHTML("Number of Collisions: " + count)
            .addTo(map);

    });

    //adding legend labels
    const minLabel = document.querySelector('.minlabel');
    const maxLabel = document.querySelector('.maxlabel');

    minLabel.textContent = '0';
    maxLabel.textContent = maxcol;


});

/*--------------------------------------------------------------------
    Step 3: CREATE BOUNDING BOX AND HEXGRID
--------------------------------------------------------------------*/
//HINT: All code to create and view the hexgrid will go inside a map load event handler
//      First create a bounding box around the collision point data then store as a feature collection variable
//      Access and store the bounding box coordinates as an array variable
//      Use bounding box coordinates as argument in the turf hexgrid function



/*--------------------------------------------------------------------
Step 4: AGGREGATE COLLISIONS BY HEXGRID
--------------------------------------------------------------------*/
//HINT: Use Turf collect function to collect all '_id' properties from the collision points data for each heaxagon
//      View the collect output in the console. Where there are no intersecting points in polygons, arrays will be empty



// /*--------------------------------------------------------------------
// Step 5: FINALIZE YOUR WEB MAP
// --------------------------------------------------------------------*/
//HINT: Think about the display of your data and usability of your web map.
//      Update the addlayer paint properties for your hexgrid using:
//        - an expression
//        - The COUNT attribute
//        - The maximum number of collisions found in a hexagon
//      Add a legend and additional functionality including pop-up windows


