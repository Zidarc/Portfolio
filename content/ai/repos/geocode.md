# GeoCode: the repository

- Repository: https://github.com/Zidarc/GEOCODE
- Main language: JavaScript
- Last pushed: 2025-11-16

## README

# GEOCODE Workshop

A web-based geospatial mapping and analysis platform designed for educational purposes, featuring interactive maps, geocoding capabilities, and geographic data visualization.

## Features

- **Interactive Map Visualization**: Built with [Leaflet.js](map1/index.html) for responsive, zoomable map display
- **Geocoding Support**: Multiple geocoding providers including:
  - OpenStreetMap Nominatim
  - Mapbox
  - MapQuest
  - Photon
  - What3Words
- **Measurement Tools**: Measure distances and areas directly on the map with [leaflet-measure.js](map1/js/leaflet-measure.js)
- **Educational Data**: Pre-loaded datasets including:
  - Schools in Karachi
  - Universities in Karachi
  - Custom education institutes
- **Responsive Design**: Mobile-friendly interface with light/dark theme toggle

## Project Structure

```
GEOCODE/
├── index.html                 # Main landing page
├── map1/                      # Interactive mapping application
│   ├── index.html            # Map interface
│   ├── css/                  # Styling (Leaflet, geocoder, measure controls)
│   ├── js/                   # Libraries and scripts
│   │   ├── leaflet.js
│   │   ├── leaflet-control-geocoder.Geocoder.js
│   │   ├── leaflet-measure.js
│   │   └── qgis2web_expressions.js
│   ├── data/                 # GeoJSON datasets
│   └── legend/               # Map legends
├── pages/                    # Additional pages
│   ├── blog.html            # Blog/facts section
│   ├── gallery.html         # Photo gallery
│   └── credit.html          # Credits page
├── assets/                  # Static resources
│   ├── css/                 # Stylesheets
│   │   ├── index.css
│   │   ├── blog.css
│   │   ├── gallery.css
│   │   └── credit.css
│   ├── js/                  # Application scripts
│   │   ├── index.js
│   │   ├── blog.js
│   │   └── credit.js
│   └── images/              # Image assets
└── README.md
```

## Getting Started

### Prerequisites
- Modern web browser with JavaScript enabled
- No build process required (runs directly in browser)

### Installation

1. Clone or download the repository:
```bash
git clone https://github.com/zidarc/GEOCODE.git
cd GEOCODE
```

2. Open in a web browser:
   - Simply open `index.html` in your browser, or
   - Serve locally using a simple HTTP server:
```bash
python -m http.server 8000
# or
npx http-server
```

3. Visit the live site: [https://zidarc.github.io/GEOCODE/](https://zidarc.github.io/GEOCODE/#12/24.9139/67.0565)

## Map Features

### Geocoding
Search for locations using the geocoder control - supports multiple address formats and returns precise coordinates.

### Layer Legend
Built-in legend displays:
- **Universities** (Red markers)
- **Schools** (Blue markers)
- **Colleges** (Orange markers)

## Pages

- **Home** ([index.html](index.html)): Main map interface with featured location view
- **Gallery** ([pages/gallery.html](pages/gallery.html)): Curated collection of geographic images

## Theming

Toggle between light and dark modes using the theme switch in the navigation header.

## Technologies Used

- **Frontend**: HTML5, CSS3, Vanilla JavaScript
- **Mapping**: [Leaflet.js](https://leafletjs.com/)
- **Geocoding**: Multiple providers via [Leaflet Control Geocoder](https://github.com/perliedman/leaflet-control-geocoder)
- **Data Format**: GeoJSON

## Data Sources

Educational facilities data for Karachi:
- [amenity_school_Karachi_10000_1.js](map1/data/amenity_school_Karachi_10000_1.js)
- [amenity_university_Karachi_15000_2.js](map1/data/amenity_university_Karachi_15000_2.js)
- [Custom_education_institutes_3.js](map1/data/Custom_education_institutes_3.js)

### Adding New Data
Place GeoJSON files in `map1/data/` and reference them in [map1/index.html](map1/index.html)

### Customizing Styles
- Map styling: `map1/css/qgis2web.css`
- General styling: `assets/css/index.css`
- Page-specific: `assets/css/blog.css`, `assets/css/gallery.css`, `assets/css/credit.css`

### Modifying Map Behavior
- Main map logic: `assets/js/index.js`
- Blog functionality: `assets/js/blog.js`
- Credits page: `assets/js/credit.js`
