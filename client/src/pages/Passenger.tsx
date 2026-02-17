import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Loader2, MapPin, Navigation, Clock, DollarSign, X, User, Bell, Calendar, Search } from "lucide-react";
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
  const [showPriceSheet, setShowPriceSheet] = useState(false);
  
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
      setShowPriceSheet(false);
      setDestination("");
      setDestinationCoords(null);
      setDistance(null);
      setPrice(null);
      
      // Clear route from map
      if (directionsRendererRef.current) {
        directionsRendererRef.current.setDirections({ routes: [] } as any);
      }
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

  // Calculate route when destination is selected
  useEffect(() => {
    if (originCoords && destinationCoords && directionsServiceRef.current && directionsRendererRef.current) {
      directionsServiceRef.current.route(
        {
          origin: originCoords,
          destination: destinationCoords,
          travelMode: google.maps.TravelMode.DRIVING,
        },
        (result, status) => {
          if (status === "OK" && result) {
            directionsRendererRef.current?.setDirections(result);
            const route = result.routes[0];
            if (route) {
              const distanceInMeters = route.legs[0]?.distance?.value || 0;
              const distanceInKm = distanceInMeters / 1000;
              setDistance(distanceInKm);
              setPrice(distanceInKm * PRICE_PER_KM);
              setShowPriceSheet(true);
            }
          } else {
            toast.error("Não foi possível calcular a rota");
          }
        }
      );
    }
  }, [originCoords, destinationCoords]);

  const handleRequestRide = () => {
    if (!originCoords || !destinationCoords || !distance || !price) {
      toast.error("Selecione um destino válido");
      return;
    }

    requestRide.mutate({
      originLat: originCoords.lat.toString(),
      originLng: originCoords.lng.toString(),
      originAddress: "Localização atual",
      destinationLat: destinationCoords.lat.toString(),
      destinationLng: destinationCoords.lng.toString(),
      destinationAddress: destination,
      distanceKm: distance.toFixed(2),
      priceEstimate: price.toFixed(2),
    });
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "requested":
        return "Procurando motorista...";
      case "accepted":
        return "Motorista a caminho";
      case "in_progress":
        return "Em andamento";
      case "completed":
        return "Corrida concluída";
      case "cancelled":
        return "Corrida cancelada";
      default:
        return status;
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Bom dia";
    if (hour < 18) return "Boa tarde";
    return "Boa noite";
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin text-[#003DA5]" />
      </div>
    );
  }

  return (
    <div className="relative h-screen w-full overflow-hidden">
      {/* Map - Full Screen */}
      <div className="absolute inset-0">
        <MapView onMapReady={handleMapReady} />
      </div>

      {/* Header - Logo and Actions */}
      <div className="absolute top-0 left-0 right-0 z-10 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 bg-white rounded-full px-4 py-2 shadow-lg">
            <img src="/logo.png" alt="CenterTáxi" className="h-8 w-auto" />
          </div>
          <div className="flex items-center gap-2">
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
      </div>

      {/* Bottom Sheet - ESTADO 1: SEM CORRIDA ATIVA */}
      {!activeRide && (
        <div className="absolute bottom-0 left-0 right-0 z-20 bg-white rounded-t-3xl shadow-2xl">
          <div className="p-6 space-y-4">
            {/* Greeting */}
            <div className="mb-2">
              <h2 className="text-xl font-semibold text-gray-900">
                {getGreeting()}, {user?.name?.split(" ")[0] || "Usuário"}
              </h2>
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <Input
                id="destination-input"
                type="text"
                placeholder="Buscar destino"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                className="pl-12 pr-14 py-6 text-base rounded-2xl border-gray-200 bg-gray-50"
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
            {!showPriceSheet && (
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
            )}

            {/* Price Estimate Sheet */}
            {showPriceSheet && distance && price && (
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
      )}

      {/* Bottom Sheet - ESTADO 2: COM CORRIDA ATIVA */}
      {activeRide && (
        <div className="absolute bottom-0 left-0 right-0 z-20 bg-white rounded-t-3xl shadow-2xl">
          <div className="p-6">
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
          </div>
        </div>
      )}
    </div>
  );
}
