import React from 'react';
import { GoogleMap, useLoadScript, Marker } from '@react-google-maps/api';
import { trpc } from '../../trpc';

const DriverMap = () => {
  const { isLoaded } = useLoadScript({ googleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY! });
  const toggleOnline = trpc.driver.toggleOnline.useMutation();

  if (!isLoaded) return <div>Carregando mapa...</div>;

  return (
    <div style={{ height: '100vh' }}>
      <GoogleMap
        mapContainerStyle={{ width: '100%', height: '100%' }}
        center={{ lat: -23.5505, lng: -46.6333 }} // São Paulo default
        zoom={12}
      >
        <Marker position={{ lat: -23.5505, lng: -46.6333 }} />
      </GoogleMap>
      <button onClick={() => toggleOnline.mutate({ isOnline: true })}>
        Ficar Online
      </button>
      {/* Futuro: Lista corridas próximas via WS */}
    </div>
  );
};

export default DriverMap;
