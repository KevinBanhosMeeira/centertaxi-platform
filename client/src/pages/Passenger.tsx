import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Loader2, MapPin, Navigation, Clock, DollarSign, X, User, Bell, Calendar, Search, Home, History, ChevronDown } from "lucide-react";
import { useState, useEffect, useRef, useCallback } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { MapView } from "@/components/Map";

const PRICE_PER_KM = 3.5;

type TabType = "home" | "activity" | "account";

export default function Passenger() {
  const { user, loading, logout } = useAuth();
  const [, setLocation] = useLocation();
  const [destination, setDestination] = useState("");
  const [originCoords, setOriginCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [destinationCoords, setDestinationCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [distance, setDistance] = useState<number | null>(null);
  const [price, setPrice] = useState<number | null>(null);
  const [showPriceSheet, setShowPriceSheet] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>("home");
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [scheduleDate, setScheduleDate] = useState("");
  const [scheduleTime, setScheduleTime] = useState("");
  const [isScheduled, setIsScheduled] = useState(false);

  const mapRef = useRef<google.maps.Map | null>(null);
  const destinationAutocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const directionsServiceRef = useRef<google.maps.DirectionsService | null>(null);
  const directionsRendererRef = useRef<google.maps.DirectionsRenderer | null>(null);
  const driverMarkerRef = useRef<google.maps.Marker | null>(null);
  const passengerMarkerRef = useRef<google.maps.Marker | null>(null);
  const driverDirectionsRendererRef = useRef<google.maps.DirectionsRenderer | null>(null);
  const originMarkerRef = useRef<google.maps.Marker | null>(null);
  const destinationMarkerRef = useRef<google.maps.Marker | null>(null);

  const { data: activeRide, refetch: refetchActiveRide } = trpc.rides.getActive.useQuery(undefined, {
    refetchInterval: 5000,
  });

  const { data: rideHistory } = trpc.rides.getHistory.useQuery(undefined, {
    enabled: activeTab === "activity",
  });

  const { data: recentAddresses } = trpc.addressHistory.getRecent.useQuery(undefined, {
    enabled: activeTab === "home",
  });

  const saveAddress = trpc.addressHistory.save.useMutation();

  const { data: driverLocation } = trpc.location.getDriver.useQuery(
    { driverId: activeRide?.driverId || 0 },
    {
      enabled: !!activeRide?.driverId && (activeRide.status === "accepted" || activeRide.status === "in_progress"),
      refetchInterval: 3000,
    }
  );

  const requestRide = trpc.rides.request.useMutation({
    onSuccess: () => {
      toast.success(isScheduled ? "Corrida agendada com sucesso!" : "Corrida solicitada!");
      refetchActiveRide();
      setShowPriceSheet(false);
      setDestination("");
      setDestinationCoords(null);
      setDistance(null);
      setPrice(null);
      setIsScheduled(false);
      setScheduleDate("");
      setScheduleTime("");
      if (directionsRendererRef.current) {
        directionsRendererRef.current.setDirections({ routes: [] } as any);
      }
      if (destinationMarkerRef.current) {
        destinationMarkerRef.current.setMap(null);
        destinationMarkerRef.current = null;
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
      // Clean up markers
      if (driverMarkerRef.current) {
        driverMarkerRef.current.setMap(null);
        driverMarkerRef.current = null;
      }
      if (passengerMarkerRef.current) {
        passengerMarkerRef.current.setMap(null);
        passengerMarkerRef.current = null;
      }
      if (driverDirectionsRendererRef.current) {
        driverDirectionsRendererRef.current.setDirections({ routes: [] } as any);
      }
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

  const handleMapReady = useCallback((map: google.maps.Map) => {
    mapRef.current = map;
    directionsServiceRef.current = new google.maps.DirectionsService();
    directionsRendererRef.current = new google.maps.DirectionsRenderer({
      map,
      suppressMarkers: true,
      polylineOptions: {
        strokeColor: "#E63946",
        strokeWeight: 4,
      },
    });
    driverDirectionsRendererRef.current = new google.maps.DirectionsRenderer({
      map,
      suppressMarkers: true,
      polylineOptions: {
        strokeColor: "#003DA5",
        strokeWeight: 5,
        strokeOpacity: 0.8,
      },
    });

    // Disable some controls for cleaner mobile look
    map.setOptions({
      mapTypeControl: false,
      fullscreenControl: false,
      streetViewControl: false,
      zoomControl: true,
    });

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const pos = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          setOriginCoords(pos);
          map.setCenter(pos);
          map.setZoom(16);
          
          // Add origin marker (Ponto A)
          if (originMarkerRef.current) {
            originMarkerRef.current.setMap(null);
          }
          originMarkerRef.current = new google.maps.Marker({
            position: pos,
            map,
            title: "Sua localização",
            label: {
              text: "A",
              color: "white",
              fontWeight: "bold",
            },
            icon: {
              path: google.maps.SymbolPath.CIRCLE,
              scale: 12,
              fillColor: "#003DA5",
              fillOpacity: 1,
              strokeColor: "white",
              strokeWeight: 3,
            },
          });
        },
        () => {
          // Fallback to São Paulo center
          const spCenter = { lat: -23.5505, lng: -46.6333 };
          setOriginCoords(spCenter);
          map.setCenter(spCenter);
          map.setZoom(14);
        }
      );
    }

    // Setup autocomplete
    setTimeout(() => {
      const destinationInput = document.getElementById("destination-input") as HTMLInputElement;
      if (destinationInput) {
        const autocomplete = new google.maps.places.Autocomplete(destinationInput, {
          componentRestrictions: { country: "br" },
        });
        destinationAutocompleteRef.current = autocomplete;
        autocomplete.addListener("place_changed", () => {
          const place = autocomplete.getPlace();
          if (place?.geometry?.location) {
            setDestination(place.formatted_address || "");
            setDestinationCoords({
              lat: place.geometry.location.lat(),
              lng: place.geometry.location.lng(),
            });
          }
        });
      }
    }, 500);
  }, []);

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
              
              // Save address to history
              if (destination && destinationCoords) {
                saveAddress.mutate({
                  address: destination,
                  lat: destinationCoords.lat.toString(),
                  lng: destinationCoords.lng.toString(),
                });
              }
              
              // Add destination marker (Ponto B)
              if (destinationMarkerRef.current) {
                destinationMarkerRef.current.setMap(null);
              }
              destinationMarkerRef.current = new google.maps.Marker({
                position: destinationCoords,
                map: mapRef.current!,
                title: "Destino",
                label: {
                  text: "B",
                  color: "white",
                  fontWeight: "bold",
                },
                icon: {
                  path: google.maps.SymbolPath.CIRCLE,
                  scale: 12,
                  fillColor: "#E63946",
                  fillOpacity: 1,
                  strokeColor: "white",
                  strokeWeight: 3,
                },
              });
              
              // Adjust map bounds to show both markers
              const bounds = new google.maps.LatLngBounds();
              bounds.extend(originCoords);
              bounds.extend(destinationCoords);
              mapRef.current?.fitBounds(bounds, 100);
            }
          } else {
            toast.error("Não foi possível calcular a rota");
          }
        }
      );
    }
  }, [originCoords, destinationCoords]);

  // Update driver marker when location changes
  useEffect(() => {
    if (!mapRef.current || !activeRide || !driverLocation) return;
    const map = mapRef.current;

    // Create or update passenger marker
    if (!passengerMarkerRef.current && originCoords) {
      passengerMarkerRef.current = new google.maps.Marker({
        position: originCoords,
        map,
        title: "Você",
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 10,
          fillColor: "#E63946",
          fillOpacity: 1,
          strokeColor: "#fff",
          strokeWeight: 3,
        },
        zIndex: 10,
      });
    }

    const driverPos = { lat: parseFloat(driverLocation.lat), lng: parseFloat(driverLocation.lng) };

    if (!driverMarkerRef.current) {
      driverMarkerRef.current = new google.maps.Marker({
        position: driverPos,
        map,
        title: "Motorista",
        icon: {
          path: "M17.402,0H5.643C2.526,0,0,3.467,0,6.584v34.804c0,3.116,2.526,5.644,5.643,5.644h11.759c3.116,0,5.644-2.527,5.644-5.644V6.584C23.044,3.467,20.518,0,17.402,0z M22.057,14.188v11.665l-2.729,0.351v-4.806L22.057,14.188z M20.625,10.773c-1.016,3.9-2.219,8.51-2.219,8.51H4.638l-2.222-8.51C2.417,10.773,11.3,7.755,20.625,10.773z M3.748,21.713v4.492l-2.73-0.349V14.502L3.748,21.713z M1.018,37.938V27.579l2.73,0.343v8.196L1.018,37.938z M2.575,40.882l2.218-3.336h13.771l2.219,3.336H2.575z M19.328,35.805v-7.872l2.729-0.355v10.048L19.328,35.805z",
          scale: 0.7,
          fillColor: "#003DA5",
          fillOpacity: 1,
          strokeColor: "#fff",
          strokeWeight: 2,
          anchor: new google.maps.Point(12, 24),
        },
        zIndex: 20,
      });
    } else {
      driverMarkerRef.current.setPosition(driverPos);
    }

    // Draw route from driver to passenger
    if (activeRide.status === "accepted" && originCoords && directionsServiceRef.current && driverDirectionsRendererRef.current) {
      directionsServiceRef.current.route(
        {
          origin: driverPos,
          destination: originCoords,
          travelMode: google.maps.TravelMode.DRIVING,
        },
        (result, status) => {
          if (status === "OK" && result) {
            driverDirectionsRendererRef.current?.setDirections(result);
          }
        }
      );
    }

    // Fit bounds
    const bounds = new google.maps.LatLngBounds();
    bounds.extend(driverPos);
    if (originCoords) bounds.extend(originCoords);
    map.fitBounds(bounds, { top: 80, bottom: 280, left: 40, right: 40 });
  }, [driverLocation, activeRide, originCoords]);

  const handleRequestRide = () => {
    if (!originCoords || !destinationCoords || !distance || !price) {
      toast.error("Selecione um destino válido");
      return;
    }

    const mutationData: any = {
      originLat: originCoords.lat.toString(),
      originLng: originCoords.lng.toString(),
      originAddress: "Localização atual",
      destinationLat: destinationCoords.lat.toString(),
      destinationLng: destinationCoords.lng.toString(),
      destinationAddress: destination,
      distanceKm: distance.toFixed(2),
      priceEstimate: price.toFixed(2),
    };

    if (isScheduled && scheduleDate && scheduleTime) {
      mutationData.scheduledAt = new Date(`${scheduleDate}T${scheduleTime}`).toISOString();
      mutationData.isScheduled = "1";
    }

    requestRide.mutate(mutationData);
  };

  const handleFavoriteClick = (address: string) => {
    setDestination(address);
    const destinationInput = document.getElementById("destination-input") as HTMLInputElement;
    if (destinationInput) {
      destinationInput.value = address;
      // Trigger geocoding for the address
      if (mapRef.current) {
        const geocoder = new google.maps.Geocoder();
        geocoder.geocode({ address: address + ", São Paulo, SP, Brasil" }, (results, status) => {
          if (status === "OK" && results && results[0]) {
            const location = results[0].geometry.location;
            setDestinationCoords({
              lat: location.lat(),
              lng: location.lng(),
            });
          }
        });
      }
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "requested": return "Procurando motorista...";
      case "accepted": return "Motorista a caminho";
      case "in_progress": return "Em andamento";
      case "completed": return "Corrida concluída";
      case "cancelled": return "Corrida cancelada";
      default: return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "requested": return "text-amber-500";
      case "accepted": return "text-[#003DA5]";
      case "in_progress": return "text-green-600";
      case "completed": return "text-gray-500";
      case "cancelled": return "text-[#E63946]";
      default: return "text-gray-500";
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Bom dia";
    if (hour < 18) return "Boa tarde";
    return "Boa noite";
  };

  const getMinDate = () => {
    const now = new Date();
    return now.toISOString().split("T")[0];
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <Loader2 className="h-8 w-8 animate-spin text-[#003DA5]" />
      </div>
    );
  }

  // ==================== ACTIVITY TAB ====================
  if (activeTab === "activity") {
    return (
      <div className="flex flex-col h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-[#003DA5] text-white px-4 py-4 flex items-center gap-3 shadow-md">
          <img src="/logo.png" alt="CenterTáxi" className="h-9 w-auto rounded-lg bg-white p-0.5" />
          <h1 className="text-lg font-bold">Minhas Corridas</h1>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto pb-20">
          <div className="p-4 space-y-3">
            {!rideHistory || rideHistory.length === 0 ? (
              <div className="text-center py-16">
                <Clock className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                <p className="text-gray-500 text-lg">Nenhuma corrida realizada</p>
                <p className="text-gray-400 text-sm mt-1">Suas corridas aparecerão aqui</p>
              </div>
            ) : (
              rideHistory.map((ride) => (
                <Card key={ride.id} className="p-4 bg-white border border-gray-100 shadow-sm">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500">
                        {new Date(ride.createdAt).toLocaleDateString("pt-BR", {
                          day: "2-digit", month: "2-digit", year: "numeric",
                          hour: "2-digit", minute: "2-digit",
                        })}
                      </span>
                      <span className={`text-xs font-semibold ${getStatusColor(ride.status)}`}>
                        {getStatusText(ride.status)}
                      </span>
                    </div>
                    <div className="space-y-1.5">
                      <div className="flex items-start gap-2">
                        <div className="w-2.5 h-2.5 rounded-full bg-green-500 mt-1.5 flex-shrink-0" />
                        <span className="text-sm text-gray-700 line-clamp-1">{ride.originAddress}</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <div className="w-2.5 h-2.5 rounded-full bg-[#E63946] mt-1.5 flex-shrink-0" />
                        <span className="text-sm text-gray-700 line-clamp-1">{ride.destinationAddress}</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                      <span className="text-xs text-gray-500">{ride.distanceKm} km</span>
                      <span className="text-base font-bold text-[#003DA5]">R$ {ride.priceEstimate}</span>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>
        </main>

        {/* Bottom Navigation */}
        <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
      </div>
    );
  }

  // ==================== ACCOUNT TAB ====================
  if (activeTab === "account") {
    return (
      <div className="flex flex-col h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-[#003DA5] text-white px-4 py-4 flex items-center gap-3 shadow-md">
          <img src="/logo.png" alt="CenterTáxi" className="h-9 w-auto rounded-lg bg-white p-0.5" />
          <h1 className="text-lg font-bold">Minha Conta</h1>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto pb-20">
          <div className="p-4 space-y-4">
            {/* Profile Card */}
            <Card className="p-6 bg-white border border-gray-100 shadow-sm">
              <div className="flex items-center gap-4">
                <div className="h-16 w-16 rounded-full bg-[#003DA5] flex items-center justify-center text-white text-2xl font-bold">
                  {user?.name?.charAt(0)?.toUpperCase() || "U"}
                </div>
                <div className="flex-1">
                  <h2 className="text-lg font-bold text-gray-900">{user?.name || "Usuário"}</h2>
                  <p className="text-sm text-gray-500">{user?.email || ""}</p>
                  <p className="text-xs text-[#003DA5] font-medium mt-1">Passageiro</p>
                </div>
              </div>
            </Card>

            {/* Menu Items */}
            <Card className="bg-white border border-gray-100 shadow-sm divide-y divide-gray-100">
              <button className="w-full flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors text-left" onClick={() => toast.info("Em breve!")}>
                <div className="h-10 w-10 rounded-full bg-blue-50 flex items-center justify-center">
                  <User className="h-5 w-5 text-[#003DA5]" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900">Editar Perfil</p>
                  <p className="text-xs text-gray-500">Nome, telefone, foto</p>
                </div>
                <ChevronDown className="h-5 w-5 text-gray-400 -rotate-90" />
              </button>

              <button className="w-full flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors text-left" onClick={() => toast.info("Em breve!")}>
                <div className="h-10 w-10 rounded-full bg-green-50 flex items-center justify-center">
                  <DollarSign className="h-5 w-5 text-green-600" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900">Formas de Pagamento</p>
                  <p className="text-xs text-gray-500">Pix, cartão, saldo</p>
                </div>
                <ChevronDown className="h-5 w-5 text-gray-400 -rotate-90" />
              </button>

              <button className="w-full flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors text-left" onClick={() => toast.info("Em breve!")}>
                <div className="h-10 w-10 rounded-full bg-amber-50 flex items-center justify-center">
                  <Bell className="h-5 w-5 text-amber-600" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900">Notificações</p>
                  <p className="text-xs text-gray-500">Configurar alertas</p>
                </div>
                <ChevronDown className="h-5 w-5 text-gray-400 -rotate-90" />
              </button>

              <button className="w-full flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors text-left" onClick={() => toast.info("Em breve!")}>
                <div className="h-10 w-10 rounded-full bg-purple-50 flex items-center justify-center">
                  <MapPin className="h-5 w-5 text-purple-600" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900">Endereços Salvos</p>
                  <p className="text-xs text-gray-500">Casa, trabalho, favoritos</p>
                </div>
                <ChevronDown className="h-5 w-5 text-gray-400 -rotate-90" />
              </button>
            </Card>

            {/* Logout */}
            <Button
              variant="outline"
              className="w-full py-6 text-[#E63946] border-[#E63946] hover:bg-red-50"
              onClick={() => {
                logout();
                setLocation("/");
              }}
            >
              Sair da Conta
            </Button>

            {/* Version */}
            <p className="text-center text-xs text-gray-400 pt-2">CenterTáxi v1.0.0</p>
          </div>
        </main>

        {/* Bottom Navigation */}
        <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
      </div>
    );
  }

  // ==================== HOME TAB (MAP) ====================
  return (
    <div className="flex flex-col h-screen bg-white">
      {/* Map Area - takes remaining space above bottom sheet */}
      <div className="relative flex-1 min-h-0">
        {/* Map fills this container */}
        <div className="absolute inset-0">
          <MapView
            onMapReady={handleMapReady}
            className="w-full h-full"
            initialCenter={{ lat: -23.5505, lng: -46.6333 }}
            initialZoom={14}
          />
        </div>

        {/* Header overlay on map */}
        <div className="absolute top-0 left-0 right-0 z-10 p-3 pointer-events-none">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 bg-white/95 backdrop-blur-sm rounded-full px-3 py-1.5 shadow-lg pointer-events-auto">
              <img src="/logo.png" alt="CenterTáxi" className="h-8 w-auto" />
            </div>
            <div className="flex items-center gap-2 pointer-events-auto">
              <button
                className="bg-white/95 backdrop-blur-sm rounded-full p-2.5 shadow-lg"
                onClick={() => toast.info("Notificações em breve!")}
              >
                <Bell className="h-5 w-5 text-gray-700" />
              </button>
            </div>
          </div>
        </div>

        {/* Center on me button */}
        {originCoords && !activeRide && (
          <button
            className="absolute bottom-4 right-4 z-10 bg-white rounded-full p-3 shadow-lg"
            onClick={() => {
              if (mapRef.current && originCoords) {
                mapRef.current.setCenter(originCoords);
                mapRef.current.setZoom(16);
              }
            }}
          >
            <Navigation className="h-5 w-5 text-[#003DA5]" />
          </button>
        )}
      </div>

      {/* Bottom Sheet - Fixed at bottom, above navigation */}
      <div className="bg-white border-t border-gray-200 shadow-[0_-4px_20px_rgba(0,0,0,0.08)]">
        {/* Drag handle */}
        <div className="flex justify-center pt-2 pb-1">
          <div className="w-10 h-1 bg-gray-300 rounded-full" />
        </div>

        {/* ESTADO 1: SEM CORRIDA ATIVA */}
        {!activeRide && (
          <div className="px-4 pb-3 space-y-3">
            {/* Greeting */}
            <h2 className="text-lg font-semibold text-gray-900">
              {getGreeting()}, {user?.name?.split(" ")[0] || "Usuário"}
            </h2>

            {/* Search + Schedule */}
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="destination-input"
                  type="text"
                  placeholder="Para onde?"
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  className="pl-10 pr-4 py-5 text-sm rounded-xl border-gray-200 bg-gray-50 focus:bg-white"
                />
              </div>
              <button
                className={`flex items-center gap-1.5 px-3 py-3 rounded-xl border transition-colors ${
                  isScheduled ? "bg-[#003DA5] text-white border-[#003DA5]" : "bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100"
                }`}
                onClick={() => setShowScheduleModal(true)}
              >
                <Calendar className="h-4 w-4" />
                <span className="text-xs font-medium whitespace-nowrap">
                  {isScheduled ? "Agendado" : "Agendar"}
                </span>
              </button>
            </div>

            {/* Schedule info */}
            {isScheduled && scheduleDate && scheduleTime && (
              <div className="flex items-center justify-between bg-blue-50 rounded-xl px-3 py-2">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-[#003DA5]" />
                  <span className="text-sm text-[#003DA5] font-medium">
                    {new Date(`${scheduleDate}T${scheduleTime}`).toLocaleDateString("pt-BR", {
                      day: "2-digit", month: "2-digit",
                    })} às {scheduleTime}
                  </span>
                </div>
                <button
                  className="text-xs text-[#E63946] font-medium"
                  onClick={() => {
                    setIsScheduled(false);
                    setScheduleDate("");
                    setScheduleTime("");
                  }}
                >
                  Cancelar
                </button>
              </div>
            )}

            {/* Recent Addresses */}
            {!showPriceSheet && recentAddresses && recentAddresses.length > 0 && (
              <div className="space-y-1">
                <p className="text-xs font-medium text-gray-500 px-2 mb-1">Endereços recentes</p>
                {recentAddresses.map((addr) => (
                  <button
                    key={addr.id}
                    className="w-full flex items-center gap-3 p-2.5 hover:bg-gray-50 rounded-xl transition-colors text-left"
                    onClick={() => {
                      setDestination(addr.address);
                      setDestinationCoords({
                        lat: parseFloat(addr.lat),
                        lng: parseFloat(addr.lng),
                      });
                    }}
                  >
                    <div className="h-9 w-9 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                      <Clock className="h-4 w-4 text-gray-500" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-sm text-gray-900 truncate">{addr.address}</p>
                      <p className="text-xs text-gray-500">São Paulo - SP</p>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* Price Estimate */}
            {showPriceSheet && distance && price && (
              <div className="space-y-3 pt-2 border-t border-gray-100">
                <h3 className="text-sm font-semibold text-gray-900">Escolha como viajar</h3>

                {/* CenterTáxi Comum */}
                <div className="p-3 border-2 border-[#003DA5] rounded-xl bg-blue-50/30">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <span className="text-3xl">🚕</span>
                      <div>
                        <h4 className="font-semibold text-sm text-gray-900">CenterTáxi Comum</h4>
                        <p className="text-xs text-gray-500">Liberdade pra se mover!</p>
                        <p className="text-xs text-green-600 font-medium">Até 1% de cashback</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-bold text-[#E63946]">R$ {price.toFixed(2)}</p>
                      <p className="text-[10px] text-gray-500">{distance.toFixed(1)} km · {Math.ceil(distance / 0.5)} min</p>
                    </div>
                  </div>
                </div>

                {/* CenterTáxi Bag */}
                <div className="p-3 border border-gray-200 rounded-xl opacity-60">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <span className="text-3xl">🚖</span>
                      <div>
                        <h4 className="font-semibold text-sm text-gray-900">CenterTáxi Bag</h4>
                        <p className="text-xs text-gray-500">Mais espaço, mais liberdade!</p>
                      </div>
                    </div>
                    <p className="text-xl font-bold text-gray-400">R$ {(price * 1.3).toFixed(2)}</p>
                  </div>
                </div>

                {/* Payment */}
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                  <div className="flex items-center gap-2.5">
                    <span className="text-xl">💳</span>
                    <div>
                      <p className="font-medium text-sm text-gray-900">Pix + Saldo</p>
                      <p className="text-xs text-gray-500">Forma de pagamento</p>
                    </div>
                  </div>
                  <ChevronDown className="h-4 w-4 text-gray-400 -rotate-90" />
                </div>

                {/* Confirm Button */}
                <Button
                  size="lg"
                  className="w-full bg-[#003DA5] hover:bg-[#002D7F] text-white py-5 text-base rounded-xl shadow-lg"
                  onClick={handleRequestRide}
                  disabled={requestRide.isPending}
                >
                  {requestRide.isPending ? (
                    <><Loader2 className="h-5 w-5 animate-spin mr-2" /> Solicitando...</>
                  ) : isScheduled ? (
                    "Agendar CenterTáxi Comum"
                  ) : (
                    "Confirmar CenterTáxi Comum"
                  )}
                </Button>
              </div>
            )}
          </div>
        )}

        {/* ESTADO 2: COM CORRIDA ATIVA */}
        {activeRide && (
          <div className="px-4 pb-3">
            <div className="p-4 border-2 border-[#003DA5] rounded-xl bg-blue-50/30">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {activeRide.status === "requested" && (
                      <div className="h-2.5 w-2.5 rounded-full bg-amber-500 animate-pulse" />
                    )}
                    {activeRide.status === "accepted" && (
                      <div className="h-2.5 w-2.5 rounded-full bg-[#003DA5] animate-pulse" />
                    )}
                    {activeRide.status === "in_progress" && (
                      <div className="h-2.5 w-2.5 rounded-full bg-green-500 animate-pulse" />
                    )}
                    <span className="font-semibold text-sm text-gray-900">
                      {getStatusText(activeRide.status)}
                    </span>
                  </div>
                  {(activeRide.status === "requested" || activeRide.status === "accepted") && (
                    <button
                      className="text-xs text-[#E63946] font-medium"
                      onClick={() => cancelRide.mutate({ rideId: activeRide.id })}
                      disabled={cancelRide.isPending}
                    >
                      Cancelar
                    </button>
                  )}
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-start gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-green-500 mt-1.5 flex-shrink-0" />
                    <span className="text-sm text-gray-700 line-clamp-1">{activeRide.originAddress}</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-[#E63946] mt-1.5 flex-shrink-0" />
                    <span className="text-sm text-gray-700 line-clamp-1">{activeRide.destinationAddress}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-gray-200">
                  <span className="text-xs text-gray-500 flex items-center gap-1">
                    <Navigation className="h-3.5 w-3.5" /> {activeRide.distanceKm} km
                  </span>
                  <span className="text-lg font-bold text-[#003DA5]">
                    R$ {activeRide.priceEstimate}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Navigation */}
      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Schedule Modal */}
      {showScheduleModal && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40" onClick={() => setShowScheduleModal(false)}>
          <div
            className="w-full max-w-lg bg-white rounded-t-2xl p-5 space-y-4 animate-in slide-in-from-bottom"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900">Agendar Corrida</h3>
              <button onClick={() => setShowScheduleModal(false)}>
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Data</label>
                <input
                  type="date"
                  value={scheduleDate}
                  min={getMinDate()}
                  onChange={(e) => setScheduleDate(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#003DA5] focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Horário</label>
                <input
                  type="time"
                  value={scheduleTime}
                  onChange={(e) => setScheduleTime(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#003DA5] focus:border-transparent"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                variant="outline"
                className="flex-1 py-5 rounded-xl"
                onClick={() => {
                  setIsScheduled(false);
                  setScheduleDate("");
                  setScheduleTime("");
                  setShowScheduleModal(false);
                }}
              >
                Agora
              </Button>
              <Button
                className="flex-1 py-5 rounded-xl bg-[#003DA5] hover:bg-[#002D7F] text-white"
                onClick={() => {
                  if (!scheduleDate || !scheduleTime) {
                    toast.error("Selecione data e horário");
                    return;
                  }
                  setIsScheduled(true);
                  setShowScheduleModal(false);
                  toast.success(`Agendado para ${new Date(`${scheduleDate}T${scheduleTime}`).toLocaleDateString("pt-BR")} às ${scheduleTime}`);
                }}
              >
                Confirmar
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ==================== BOTTOM NAVIGATION COMPONENT ====================
function BottomNav({ activeTab, onTabChange }: { activeTab: TabType; onTabChange: (tab: TabType) => void }) {
  return (
    <nav className="bg-white border-t border-gray-200 px-2 py-1.5 flex items-center justify-around safe-area-bottom">
      <button
        className={`flex flex-col items-center gap-0.5 px-4 py-1.5 rounded-lg transition-colors ${
          activeTab === "home" ? "text-[#003DA5]" : "text-gray-400"
        }`}
        onClick={() => onTabChange("home")}
      >
        <Home className="h-5 w-5" />
        <span className="text-[10px] font-medium">Início</span>
      </button>
      <button
        className={`flex flex-col items-center gap-0.5 px-4 py-1.5 rounded-lg transition-colors ${
          activeTab === "activity" ? "text-[#003DA5]" : "text-gray-400"
        }`}
        onClick={() => onTabChange("activity")}
      >
        <History className="h-5 w-5" />
        <span className="text-[10px] font-medium">Atividade</span>
      </button>
      <button
        className={`flex flex-col items-center gap-0.5 px-4 py-1.5 rounded-lg transition-colors ${
          activeTab === "account" ? "text-[#003DA5]" : "text-gray-400"
        }`}
        onClick={() => onTabChange("account")}
      >
        <User className="h-5 w-5" />
        <span className="text-[10px] font-medium">Conta</span>
      </button>
    </nav>
  );
}
