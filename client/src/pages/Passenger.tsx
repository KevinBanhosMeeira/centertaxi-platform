import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Loader2, MapPin, Navigation, Clock, DollarSign, X, User, Bell, Calendar } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { MapView } from "@/components/Map";

const PRICE_PER_KM = 3.5; // R$ 3.50 por km

export default function Passenger() {
  const { user, loading, logout } = useAuth();
  const [, setLocation] = useLocation();
  const [destination, setDestination] = useState("");
  const [originCoords, setOriginCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [destinationCoords, setDestinationCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [distance, setDistance] = useState<number | null>(null);
  const [price, setPrice] = useState<number | null>(null);
  const [showBottomSheet, setShowBottomSheet] = useState(false);
  
  const mapRef = useRef<google.maps.Map | null>(null);
  const destinationAutocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const directionsServiceRef = useRef<google.maps.DirectionsService | null>(null);
  const directionsRendererRef = useRef<google.maps.DirectionsRenderer | null>(null);

  const { data: activeRide, refetch: refetchActiveRide } = trpc.rides.getActive.useQuery(undefined, {
    refetchInterval: 5000,
  });

  const requestRide = trpc.rides.request.useMutation({
    onSuccess: () => {
      toast.success("Corrida solicitada!");
      refetchActiveRide();
      setShowBottomSheet(false);
      setDestination("");
      setDestinationCoords(null);
      setDistance(null);
      setPrice(null);
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao solicitar corrida");
    },
  });

  const cancelRide = trpc.rides.cancel.useMutation({
    onSuccess: () => {
      toast.success("Corrida cancelada");
      refetchActiveRide();
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao cancelar corrida");
    },
  });

  useEffect(() => {
    if (!loading && !user) {
      setLocation("/");
    }
  }, [user, loading, setLocation]);

  const handleMapReady = (map: google.maps.Map) => {
    mapRef.current = map;
    directionsServiceRef.current = new google.maps.DirectionsService();
    directionsRendererRef.current = new google.maps.DirectionsRenderer({
      map: map,
      suppressMarkers: false,
    });

    // Get user's current location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const pos = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          setOriginCoords(pos);
          map.setCenter(pos);
          map.setZoom(15);
        },
        () => {
          toast.error("Não foi possível obter sua localização");
        }
      );
    }

    // Setup autocomplete for destination
    const destinationInput = document.getElementById("destination-input") as HTMLInputElement;
    if (destinationInput) {
      destinationAutocompleteRef.current = new google.maps.places.Autocomplete(destinationInput, {
        componentRestrictions: { country: "br" },
      });
      destinationAutocompleteRef.current.addListener("place_changed", () => {
        const place = destinationAutocompleteRef.current?.getPlace();
        if (place?.geometry?.location) {
          setDestination(place.formatted_address || "");
          setDestinationCoords({
            lat: place.geometry.location.lat(),
            lng: place.geometry.location.lng(),
          });
        }
      });
    }
  };

  useEffect(() => {
    if (originCoords && destinationCoords && directionsServiceRef.current && directionsRendererRef.current) {
      const request: google.maps.DirectionsRequest = {
        origin: originCoords,
        destination: destinationCoords,
        travelMode: google.maps.TravelMode.DRIVING,
      };

      directionsServiceRef.current.route(request, (result, status) => {
        if (status === google.maps.DirectionsStatus.OK && result) {
          directionsRendererRef.current?.setDirections(result);
          const route = result.routes[0];
          if (route?.legs[0]) {
            const distanceInKm = route.legs[0].distance!.value / 1000;
            setDistance(distanceInKm);
            setPrice(distanceInKm * PRICE_PER_KM);
            setShowBottomSheet(true);
          }
        }
      });
    }
  }, [originCoords, destinationCoords]);

  const handleRequestRide = () => {
    if (!originCoords || !destinationCoords || !distance || !price) {
      toast.error("Selecione um destino");
      return;
    }

    // Get origin address from geocoder
    const geocoder = new google.maps.Geocoder();
    geocoder.geocode({ location: originCoords }, (results, status) => {
      if (status === "OK" && results && results[0]) {
        requestRide.mutate({
          originAddress: results[0].formatted_address,
          originLat: originCoords.lat.toString(),
          originLng: originCoords.lng.toString(),
          destinationAddress: destination,
          destinationLat: destinationCoords.lat.toString(),
          destinationLng: destinationCoords.lng.toString(),
          distanceKm: distance.toFixed(2),
          priceEstimate: price.toFixed(2),
        });
      }
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const getStatusText = (status: string) => {
    const statusMap: Record<string, string> = {
      requested: "Procurando motorista...",
      accepted: "Motorista a caminho",
      in_progress: "Em andamento",
    };
    return statusMap[status] || status;
  };

  return (
    <div className="h-screen flex flex-col bg-background relative">
      {/* Map Fullscreen */}
      <div className="absolute inset-0">
        <MapView onMapReady={handleMapReady} />
      </div>

      {/* Top Bar */}
      <div className="absolute top-0 left-0 right-0 z-20 p-4">
        <div className="flex items-center justify-between">
          {/* Logo Button */}
          <Button
            className="bg-[#003DA5] hover:bg-[#002D7F] text-white rounded-full px-6 py-2 h-auto shadow-lg"
            onClick={() => setLocation("/history")}
          >
            <img src="/logo.png" alt="CenterTáxi" className="h-6 w-auto mr-2" />
            <span className="font-semibold">Center Táxi</span>
          </Button>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="bg-white rounded-full shadow-lg"
            >
              <Calendar className="h-5 w-5 text-gray-700" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="bg-white rounded-full shadow-lg"
            >
              <Bell className="h-5 w-5 text-gray-700" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="bg-white rounded-full shadow-lg"
              onClick={() => setLocation("/history")}
            >
              <User className="h-5 w-5 text-gray-700" />
            </Button>
          </div>
        </div>

        {/* Tabs: Agora / Agendar */}
        <div className="flex items-center gap-2 mt-4 justify-center">
          <Button className="bg-[#003DA5] hover:bg-[#002D7F] text-white rounded-full px-8 py-2 shadow-lg">
            Agora
          </Button>
          <Button variant="outline" className="bg-white text-gray-700 rounded-full px-8 py-2 shadow-lg">
            Agendar
          </Button>
        </div>
      </div>

      {/* Bottom Sheet - Always visible */}
      <div className="absolute bottom-0 left-0 right-0 z-20 bg-white rounded-t-3xl shadow-2xl">
        <div className="p-6 space-y-4">
          {/* Active Ride Status */}
          {activeRide ? (
            <Card className="p-4 bg-white border-2 border-[#003DA5]">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-[#003DA5]" />
                    <span className="font-semibold text-gray-900">
                      {getStatusText(activeRide.status)}
                    </span>
                  </div>
                  {(activeRide.status === "requested" || activeRide.status === "accepted") && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => cancelRide.mutate({ rideId: activeRide.id })}
                      disabled={cancelRide.isPending}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                
                <div className="space-y-2 text-sm">
                  <div className="flex items-start gap-2">
                    <MapPin className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700">{activeRide.originAddress}</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <MapPin className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700">{activeRide.destinationAddress}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t">
                  <div className="flex items-center gap-1 text-sm text-gray-600">
                    <Navigation className="h-4 w-4" />
                    <span>{activeRide.distanceKm} km</span>
                  </div>
                  <div className="flex items-center gap-1 text-lg font-semibold text-[#E63946]">
                    <DollarSign className="h-5 w-5" />
                    <span>R$ {activeRide.priceEstimate}</span>
                  </div>
                </div>
              </div>
            </Card>
          ) : (
            <>
              {/* Greeting */}
              <div className="text-center mb-2">
                <h2 className="text-xl font-semibold text-gray-900">
                  Boa {new Date().getHours() < 12 ? "dia" : new Date().getHours() < 18 ? "tarde" : "noite"}, {user?.name?.split(" ")[0]}
                </h2>
              </div>

              {/* Search Input */}
              <div className="relative">
                <MapPin className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  id="destination-input"
                  type="text"
                  placeholder="Buscar destino"
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  className="pl-12 pr-4 py-6 text-base rounded-2xl border-gray-200 bg-gray-50"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 rounded-full"
                >
                  <Calendar className="h-5 w-5 text-gray-600" />
                </Button>
              </div>

              {/* Favorite Locations */}
              <div className="space-y-2">
                <div className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-xl cursor-pointer">
                  <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center">
                    <Clock className="h-5 w-5 text-gray-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Rua José Bernardo Pinto, 333</p>
                    <p className="text-sm text-gray-500">São Paulo - SP</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-xl cursor-pointer">
                  <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center">
                    <Clock className="h-5 w-5 text-gray-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Rodoviaria Tiete</p>
                    <p className="text-sm text-gray-500">São Paulo - SP</p>
                  </div>
                </div>
              </div>
            </>
          )}

            {/* Bottom Sheet - Price Estimate */}
            {showBottomSheet && distance && price && (
              <div className="space-y-4 pt-4 border-t">
                <h3 className="text-lg font-semibold text-gray-900">Escolha como viajar</h3>
                
                {/* Ride Option - CenterTáxi Comum */}
                <Card className="p-4 border-2 border-[#003DA5] bg-white">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="text-4xl">🚕</div>
                      <div>
                        <h4 className="font-semibold text-gray-900">CenterTáxi Comum</h4>
                        <p className="text-sm text-gray-600">Liberdade pra se mover !</p>
                        <p className="text-sm text-green-600 font-medium">✅ Até 1% de cashback</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-[#E63946]">R$ {price.toFixed(2)}</p>
                      <p className="text-xs text-gray-500">{distance.toFixed(1)} km • {Math.ceil(distance / 0.5)} min</p>
                    </div>
                  </div>
                </Card>

                {/* Ride Option - CenterTáxi Bag */}
                <Card className="p-4 border border-gray-200 bg-white opacity-75">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="text-4xl">🚖</div>
                      <div>
                        <h4 className="font-semibold text-gray-900">CenterTáxi Bag</h4>
                        <p className="text-sm text-gray-600">Mais espaço, mais liberdade !</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-[#E63946]">R$ {price.toFixed(2)}</p>
                    </div>
                  </div>
                </Card>

                {/* Payment Method */}
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl">
                  <div className="flex items-center gap-3">
                    <div className="text-2xl">💳</div>
                    <div>
                      <p className="font-medium text-gray-900">Pix + Saldo</p>
                      <p className="text-sm text-gray-600">Forma de pagamento</p>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon">
                    <Navigation className="h-5 w-5 text-gray-600 rotate-90" />
                  </Button>
                </div>

                {/* Confirm Button */}
                <Button
                  size="lg"
                  className="w-full bg-[#003DA5] hover:bg-[#002D7F] text-white py-6 text-lg rounded-2xl shadow-lg"
                  onClick={handleRequestRide}
                  disabled={requestRide.isPending}
                >
                  {requestRide.isPending ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin mr-2" />
                      Solicitando...
                    </>
                  ) : (
                    "Confirmar CenterTáxi Comum"
                  )}
                </Button>
              </div>
            )}
        </div>
      </div>
    </div>
  );
}
