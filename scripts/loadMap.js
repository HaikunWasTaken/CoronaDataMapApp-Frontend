const url = 'http://corona-data-map-app.us-east-1.elasticbeanstalk.com';
//const url = 'http://localhost:3000'

var basicData, premiumData;

mapboxgl.accessToken = 'pk.eyJ1IjoibWszMDYiLCJhIjoiY2tlNXNmZGhtMDV3NjJ4bWl2ZmZzZjN2NSJ9.BN7hDrnIXUftAl5u2bVxVQ';
const map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/mapbox/streets-v11',
    center: [7, 50],
    zoom: 4,
    minZoom: 3,
    maxBounds: [
        [-180, -85],
        [180, 85]
    ],
    dragRotate: false
});

map.on('load', function() {

    var previousFeature = { 'type': 'Feature', 'properties': { 'geounit': 'test' } };

    map.addSource('map-polygons', {
        type: 'vector',
        url: 'mapbox://mk306.4vqclbsd'
    });

    map.addLayer({
        'id': 'polygon-layer-fill',
        'type': 'fill',
        'source': 'map-polygons',
        'source-layer': 'world_map-1qp8pm',
        'paint': {
            //'fill-color': '#ffae00', 
            'fill-color': '#008888',
            'fill-opacity': 0.4
        },
    });

    map.addLayer({
        'id': 'polygon-layer-outline',
        'type': 'line',
        'source': 'map-polygons',
        'source-layer': 'world_map-1qp8pm',
        'paint': {
            'line-color': '#2f3640',
            'line-width': 2
        },
    });

    map.on('mouseenter', 'polygon-layer-fill', function(e) {
        $('.tooltip').show();
        map.getCanvas().style.cursor = 'pointer';
    });

    map.on('mousemove', 'polygon-layer-fill', function(e) {
        if (e.features.length > 0) {
            //Single out the first found feature.
            var feature = e.features[0];
            var countrySlug = feature.properties.slug;
            if (!(feature.properties.name == previousFeature.properties.name)) {
                console.log(feature.properties.slug);
                getBasicDataFromBackend(countrySlug);
            }
            previousFeature = feature;
        }
    });

    map.on('click', 'polygon-layer-fill', function(e) {
        if (e.features.length > 0) {
            //Single out the first found feature.
            var feature = e.features[0];
            var countrySlug = feature.properties.slug;
            getPremiumDataFromBackend(countrySlug);
            getCountryDataFromBackend(countrySlug);
            map.flyTo({ center: e.lngLat, zoom: 5 })
            if ($('.side-bar').is(':hidden')) {
                $('.side-bar').animate({
                    width: 'toggle',
                }, 500);
            }
        }
    });

    $('.side-bar').click(function() {
        $('.side-bar').animate({
            width: 'toggle',
        }, 500);
    });

    map.on('mouseleave', 'polygon-layer-fill', function() {
        $('.tooltip').hide();

        // Reset the cursor style
        map.getCanvas().style.cursor = '';
    });
});

function getBasicDataFromBackend(countrySlug) {
    var toDate = getToDate();
    var fromDate = getFromDate();

    const option = {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                slug: countrySlug,
                from: fromDate,
                to: toDate
            })
        }
        //console.log(option);
    fetch(url + '/basic', option)
        .then(response => {
            if (!response.ok) {
                throw Error(response.status);
            }
            return response.json();
        })
        .then(data => {
            basicData = data;
            //console.log(basicData); // LOOK INTO THIS
            evaluateBasicData(basicData);
        }).catch(error => {
            console.log(error);
        });
}

function evaluateBasicData(data) {
    var country = '<h3>' + data.Country + '</h3>'
    var template = '';

    template += '<li><strong>Active: </strong>' + data.Active + '</li>';
    template += '<li><strong>Confirmed: </strong>' + data.Confirmed + '</li>';
    template += '<li><strong>Recoveries: </strong>' + data.Recovered + '</li>';
    template += '<li><strong>Deaths: </strong>' + data.Deaths + '</li>';

    document.getElementById('tooltip-country').innerHTML = country;
    document.getElementById('tooltip-data').innerHTML = template;
}

function getPremiumDataFromBackend(countrySlug) {
    var toDate = getToDate();
    var fromDate = getFromDate();

    const option = {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            slug: countrySlug,
            from: fromDate,
            to: toDate
        })
    }

    fetch(url + '/premium', option)
        .then(response => {
            if (!response.ok) {
                throw Error(response.status);
            }
            return response.json();
        })
        .then(data => {
            premiumData = data;
            //console.log(premiumData);
            evaluatePremiumData(premiumData);
        }).catch(error => {
            console.log(error);
        });
}

function evaluatePremiumData(data) {
    //data = data[data.length - 1];
    var country = '<h3>' + data.Country + '</h3>'
    var date = '<h4>' + new Date(data.Date).toLocaleDateString() + '</h4>';
    var template = '';

    template += '<li><strong>Case Fatality Ratio: </strong>' + data.CaseFatalityRatio + '</li>';
    template += '<li><strong>New Cases: </strong>' + data.NewCases + '</li>';
    template += '<li><strong>New Cases per Million: </strong>' + data.NewCasesPerMillion + '</li>';
    template += '<li><strong>New Deaths: </strong>' + data.NewDeaths + '</li>';
    template += '<li><strong>New Deaths per Million: </strong>' + data.NewDeathsPerMillion + '</li>';
    template += '<li><strong>Total Cases: </strong>' + data.TotalCases + '</li>';
    template += '<li><strong>Total Cases per Million: </strong>' + data.TotalCasesPerMillion + '</li>';
    template += '<li><strong>Total Deaths: </strong>' + data.TotalDeaths + '</li>';
    template += '<li><strong>Total Deaths per Million: </strong>' + data.TotalDeathsPerMillion + '</li>';

    document.getElementById('side-bar-country').innerHTML = country;
    document.getElementById('side-bar-date').innerHTML = date;
    document.getElementById('side-bar-premium-data').innerHTML = template;
}

function getCountryDataFromBackend(countrySlug) {
    const option = {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug: countrySlug })
    }

    fetch(url + '/country', option)
        .then(response => {
            if (!response.ok) {
                throw Error(response.status);
            }
            return response.json();
        })
        .then(data => {
            countryData = data;
            //console.log(countryData);
            evaluateCountryData(countryData);
        }).catch(error => {
            console.log(error);
        });
}

function evaluateCountryData(data) {
    var template = '';

    template += '<li><strong>Population: </strong>' + data.Population + '</li>';
    template += '<li><strong>Population Density: </strong>' + data.PopulationDensity + '</li>';
    template += '<li><strong>Median Age: </strong>' + data.MedianAge + '</li>';
    template += '<li><strong>Aged 65 or Older: </strong>' + data.Aged65Older + '</li>';
    template += '<li><strong>Aged 70 or Older: </strong>' + data.Aged70Older + '</li>';

    document.getElementById('side-bar-country-data').innerHTML = template;
}

function getToDate() {
    var toDate = new Date();
    toDate = toDate.toISOString().split('T')[0] + 'T00:00:00Z';
    //console.log('To: ' + toDate);
    return toDate;
}

function getFromDate() {
    var fromDate = new Date();
    fromDate.setDate(fromDate.getDate() - 1);
    fromDate = fromDate.toISOString().split('T')[0] + 'T00:00:00Z';
    //console.log('From: ' + fromDate);
    return fromDate;
}

const geocoder = new MapboxGeocoder({
    accessToken: mapboxgl.accessToken,
    mapboxgl: mapboxgl
});

function search() {
    var queryString = document.getElementById('input').value.toLowerCase();
    queryString = queryString.trim().replace(/ /g, '-');
    console.log(queryString);
    const option = {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: queryString })
    }

    fetch(url + '/search', option)
        .then(response => {
            if (!response.ok) {
                throw Error(response.status);
            }
            return response.json();
        })
        .then(data => {
            console.log(data);
            if (data.features.length > 0 && data.features[0].bbox != null) {
                map.fitBounds(data.features[0].bbox);
            } else {
                alert('Invalid query! Please use the English name for your desired destination')
            }
        }).catch(error => {
            console.log(error);
        });
}

function handle(event) {
    try {
        if (event.keyCode === 13) {
            search();
        }
    } catch (error) {
        console.log(error);
    }
}