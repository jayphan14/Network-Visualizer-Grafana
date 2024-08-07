import React, {useState} from 'react';
import { PanelProps } from '@grafana/data';
import { SimpleOptions } from 'types';
import { css} from '@emotion/css';
import { useStyles2 } from '@grafana/ui';
import { PanelDataErrorView } from '@grafana/runtime';
import { GoogleMap, Marker, DrawingManager, useJsApiLoader} from '@react-google-maps/api';
import { locationService } from '@grafana/runtime';

interface Props extends PanelProps<SimpleOptions> {}

const getStyles = () => {
  return {
    wrapper: css`
      font-family: Open Sans;
      position: relative;
    `,
    map: css`
      height: 100%;
      width: 100%;
    `,
    button: css`
      position: absolute; /* Position relative to the wrapper */
      bottom: 10px;
      left: 10px;
      display: inline;
      padding: 10px 20px;
      background-color: #007bff;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      z-index: 1000;
    `,
    saveButton: css`
      position: absolute; /* Position relative to the wrapper */
      bottom: 10px;
      left: 100px;
      display: inline;
      padding: 10px 20px;
      background-color: #007bff;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      z-index: 1000; 
    `,
  };
};

export const SimplePanel: React.FC<Props> = ({ options, data, width, height, fieldConfig, id }) => {
  const styles = useStyles2(getStyles);

  const grafanaVariableToUpdate = options?.variable

  const [polygonSelection, setPolygonSelection] = useState<Array<any>>([])

  if (data.series.length === 0) {
    return <PanelDataErrorView fieldConfig={fieldConfig} panelId={id} data={data} needsStringField />;
  }

  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: "AIzaSyCYBXr6DR2HCvtlo2Jo5c0Vlup818cCF00",
    libraries: ['drawing']
  })

  const mapContainerStyle = {
    width: `${width}px`,
    height: `${height}px`,
  };

  const center = {
    lat: 40.4774,
    lng: -74.2591,
    zoom: 10,
  };

  


  var lats = data.series[0].fields.find(field => field.name == "latitude")?.values;
  var longs =  data.series[0].fields.find(field => field.name === "longitude")?.values;

  var combined = lats?.map((lat, index) => ({
    latitude: lat,
    longitude: longs?.[index]
  }));
  const onLoad = () => {}

  const onPolygonComplete = (polygon: google.maps.Polygon) => {
    setPolygonSelection([...polygonSelection , polygon])
  };

  const updateGrafanaVariable = () => {
    // Convert polygonSelection into an array of arrays of points
    const polygonsData = polygonSelection.map(polygon => {
      const path = polygon.getPath();
      return path.getArray().map((latLng: { lat: () => any; lng: () => any; }) => ({
        latitude: latLng.lat(),
        longitude: latLng.lng(),
      }));
    });
  
    // Update the Grafana variable with the serialized data
    locationService.partial({ [`var-${grafanaVariableToUpdate}`]: JSON.stringify(polygonsData) }, true);
  };
  const onReset = async () => {
    polygonSelection.forEach(polygon => polygon.setMap(null))
    setPolygonSelection([])
    locationService.partial({ [`var-${grafanaVariableToUpdate}`]: JSON.stringify([]) }, true);
  }

  return (
    isLoaded ? (
    <div className={styles.wrapper}>     
        <GoogleMap
          id="map"
          mapContainerStyle={mapContainerStyle}
          zoom={10}
          center={center}
        >
          <DrawingManager
            onLoad={onLoad}
            onPolygonComplete={onPolygonComplete} 
            options={{
              drawingMode: google.maps.drawing.OverlayType.POLYGON,
              drawingControl: true,
              drawingControlOptions: {
                position: google.maps.ControlPosition.TOP_CENTER,
                drawingModes: [google.maps.drawing.OverlayType.POLYGON],
              },
            }}
          />
          {combined?.map((location, index) => (
            <Marker
              key={index}
              position={{ lat: location.latitude, lng: location.longitude }}
            />
          ))}
        </GoogleMap>
        <button className={styles.saveButton} onClick={updateGrafanaVariable}> Save </button>
        <button className={styles.button} onClick={onReset}> Reset </button>
    </div>
  ) : <></>
);
};
