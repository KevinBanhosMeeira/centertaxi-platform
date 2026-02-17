import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Car, MapPin, Navigation, Clock, DollarSign, X } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { MapView } from "@/components/Map";

const PRICE_PER_KM = 3.5; // R$ 3.50 por km

export default function Passenger() {
  const { user, loading, logout } = useAuth();
  const [, setLocation] = useLocation();
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [originCoords, setOriginCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [destinationCoords, setDestinationCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [distance, setDistance] = useState<number | null>(null);
  const [price, setPrice] = useState<number | null>(null);
  const [showRequestForm, setShowRequestForm] = useState(false);
  
  const mapRef = useRef<google.maps.Map | null>(null);
  const originAutocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const destinationAutocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const directionsServiceRef = useRef<google.maps.DirectionsService | null>(null);
  const directionsRendererRef = useRef<google.maps.DirectionsRenderer | null>(null);

  const { data: activeRide, refetch: refetchActiveRide } = trpc.rides.getActive.useQuery(undefined, {
    refetchInterval: 5000, // Poll every 5 seconds
  });

  const requestRide = trpc.rides.request.useMutation({
    onSuccess: () => {
      toast.success("Corrida solicitada com sucesso!");
      refetchActiveRide();
      setShowRequestForm(false);
      setOrigin("");
      setDestination("");
      setOriginCoords(null);
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
    if (!loading && (!user || user.role !== "passenger")) {
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
          map.setCenter(pos);
          map.setZoom(15);
        },
        () => {
          toast.error("Não foi possível obter sua localização");
        }
      );
    }

    // Setup autocomplete for origin
    const originInput = document.getElementById("origin-input") as HTMLInputElement;
    if (originInput) {
      originAutocompleteRef.current = new google.maps.places.Autocomplete(originInput, {
        componentRestrictions: { country: "br" },
      });
      originAutocompleteRef.current.addListener("place_changed", () => {
        const place = originAutocompleteRef.current?.getPlace();
        if (place?.geometry?.location) {
          setOrigin(place.formatted_address || "");
          setOriginCoords({
            lat: place.geometry.location.lat(),
            lng: place.geometry.location.lng(),
          });
        }
      });
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
          }
        }
      });
    }
  }, [originCoords, destinationCoords]);

  const handleRequestRide = () => {
    if (!originCoords || !destinationCoords || !distance || !price) {
      toast.error("Preencha origem e destino");
      return;
    }

    requestRide.mutate({
      originAddress: origin,
      originLat: originCoords.lat.toString(),
      originLng: originCoords.lng.toString(),
      destinationAddress: destination,
      destinationLat: destinationCoords.lat.toString(),
      destinationLng: destinationCoords.lng.toString(),
      distanceKm: distance.toFixed(2),
      priceEstimate: price.toFixed(2),
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
      completed: "Concluída",
      cancelled: "Cancelada",
    };
    return statusMap[status] || status;
  };

  const getStatusColor = (status: string) => {
    const colorMap: Record<string, string> = {
      requested: "text-yellow-500",
      accepted: "text-blue-500",
      in_progress: "text-green-500",
      completed: "text-gray-500",
      cancelled: "text-red-500",
    };
    return colorMap[status] || "text-gray-500";
  };

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card px-4 py-3 flex items-center justify-between z-10">
        <div className="flex items-center gap-2">
          <img src="/logo.png" alt="CenterTáxi" className="h-10 w-auto" />
          <h1 className="text-xl font-bold text-card-foreground">CenterTáxi</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => setLocation("/history")}>
            Histórico
          </Button>
          <Button variant="ghost" size="sm" onClick={() => logout()}>
            Sair
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 relative">
        {/* Map */}
        <div className="absolute inset-0">
          <MapView onMapReady={handleMapReady} />
        </div>

        {/* Active Ride Card */}
        {activeRide && (
          <div className="absolute top-4 left-4 right-4 z-10">
            <Card className="p-4 bg-card border-border shadow-lg">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-primary" />
                    <span className={`font-semibold ${getStatusColor(activeRide.status)}`}>
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
                    <span className="text-card-foreground">{activeRide.originAddress}</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <MapPin className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                    <span className="text-card-foreground">{activeRide.destinationAddress}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-border">
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Navigation className="h-4 w-4" />
                    <span>{activeRide.distanceKm} km</span>
                  </div>
                  <div className="flex items-center gap-1 text-lg font-semibold text-primary">
                    <DollarSign className="h-5 w-5" />
                    <span>R$ {activeRide.priceEstimate}</span>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Request Ride Button */}
        {!activeRide && !showRequestForm && (
          <div className="absolute bottom-8 left-4 right-4 z-10">
            <Button
              size="lg"
              className="w-full shadow-lg"
              onClick={() => setShowRequestForm(true)}
            >
              <MapPin className="h-5 w-5 mr-2" />
              Solicitar corrida
            </Button>
          </div>
        )}

        {/* Request Form */}
        {!activeRide && showRequestForm && (
          <div className="absolute bottom-0 left-0 right-0 z-10 bg-card border-t border-border rounded-t-2xl shadow-2xl">
            <div className="p-4 space-y-4 max-h-[70vh] overflow-y-auto">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-card-foreground">Nova corrida</h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setShowRequestForm(false);
                    setOrigin("");
                    setDestination("");
                    setOriginCoords(null);
                    setDestinationCoords(null);
                    setDistance(null);
                    setPrice(null);
                    if (directionsRendererRef.current) {
                      directionsRendererRef.current.setDirections({ routes: [] } as any);
                    }
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <div className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="origin-input" className="text-card-foreground">Origem</Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 h-4 w-4 text-green-500" />
                    <Input
                      id="origin-input"
                      type="text"
                      placeholder="De onde você está saindo?"
                      value={origin}
                      onChange={(e) => setOrigin(e.target.value)}
                      className="pl-10 bg-background text-foreground border-border"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="destination-input" className="text-card-foreground">Destino</Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 h-4 w-4 text-red-500" />
                    <Input
                      id="destination-input"
                      type="text"
                      placeholder="Para onde você vai?"
                      value={destination}
                      onChange={(e) => setDestination(e.target.value)}
                      className="pl-10 bg-background text-foreground border-border"
                    />
                  </div>
                </div>
              </div>

              {distance && price && (
                <Card className="p-4 bg-primary/10 border-primary/20">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <div className="text-sm text-muted-foreground">Distância estimada</div>
                      <div className="text-lg font-semibold text-foreground">{distance.toFixed(1)} km</div>
                    </div>
                    <div className="space-y-1 text-right">
                      <div className="text-sm text-muted-foreground">Preço estimado</div>
                      <div className="text-2xl font-bold text-primary">R$ {price.toFixed(2)}</div>
                    </div>
                  </div>
                </Card>
              )}

              <Button
                size="lg"
                className="w-full"
                onClick={handleRequestRide}
                disabled={!originCoords || !destinationCoords || requestRide.isPending}
              >
                {requestRide.isPending ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin mr-2" />
                    Solicitando...
                  </>
                ) : (
                  "Confirmar corrida"
                )}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
