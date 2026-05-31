import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Search, MapPin, Bed, Bath, Home, ChevronDown, SlidersHorizontal, X } from "lucide-react";
import { AnimatedSection, AnimatedStagger } from "@/components/AnimatedSection";

const AMENITIES = ["WiFi", "Parking", "AC", "Gym", "Pool", "Power Backup", "Security", "Lift"];
const PROPERTY_TYPES = ["Apartment", "House", "Villa", "Studio", "Penthouse", "Duplex", "PG"];

const INDIAN_STATES = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Goa", "Gujarat",
  "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala", "Madhya Pradesh",
  "Maharashtra", "Manipur", "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab",
  "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh",
  "Uttarakhand", "West Bengal", "Delhi", "Chandigarh",
];

type Listing = {
  id: string; name: string; address: string; city: string; state: string;
  priceMonthly: number; amenities: string[]; description: string; images: string[];
  bedrooms: number; bathrooms: number; propertyType: string; units: number; available: boolean;
};

export default function BrowseProperties() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [q, setQ] = useState("");
  const [selectedState, setSelectedState] = useState("");
  const [selectedCity, setSelectedCity] = useState("");
  const [maxPrice, setMaxPrice] = useState(100000);
  const [selectedType, setSelectedType] = useState("");
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);
  const [minBed, setMinBed] = useState(0);
  const [showFilters, setShowFilters] = useState(false);

  const [cities, setCities] = useState<string[]>([]);
  const [loadingCities, setLoadingCities] = useState(false);

  const navigate = useNavigate();

  // Fetch distinct cities when state changes
  useEffect(() => {
    if (!selectedState) { setCities([]); setSelectedCity(""); return; }
    setLoadingCities(true);
    supabase
      .from("properties")
      .select("city")
      .eq("state", selectedState)
      .eq("available", true)
      .not("city", "is", null)
      .neq("city", "")
      .order("city")
      .then(({ data }) => {
        const unique = [...new Set((data ?? []).map((r: any) => r.city).filter(Boolean))] as string[];
        setCities(unique);
        if (!unique.includes(selectedCity)) setSelectedCity("");
        setLoadingCities(false);
      });
  }, [selectedState]);

  // Fetch listings
  useEffect(() => {
    setLoading(true);
    let query = supabase
      .from("properties")
      .select("*")
      .eq("available", true);

    if (selectedState) query = query.eq("state", selectedState);
    if (selectedCity) query = query.eq("city", selectedCity);
    if (selectedType) query = query.eq("property_type", selectedType);
    if (maxPrice < 100000) query = query.lte("price_monthly", maxPrice);
    if (minBed > 0) query = query.gte("bedrooms", minBed);

    query.order("created_at", { ascending: false }).then(({ data, error }) => {
      if (!error && data) {
        let results = data.map((r: any) => ({
          id: r.id, name: r.name, address: r.address ?? "", city: r.city ?? "", state: r.state ?? "",
          priceMonthly: Number(r.price_monthly) || 0, amenities: r.amenities ?? [],
          description: r.description ?? "", images: r.images ?? [],
          bedrooms: Number(r.bedrooms) || 1, bathrooms: Number(r.bathrooms) || 1,
          propertyType: r.property_type ?? "Apartment", units: Number(r.units) || 1, available: r.available ?? true,
        })) as Listing[];

        // Client-side filter for amenities
        if (selectedAmenities.length > 0) {
          results = results.filter((l) => selectedAmenities.every((a) => l.amenities.includes(a)));
        }

        // Search filter
        if (q.trim()) {
          const s = q.trim().toLowerCase();
          results = results.filter((l) =>
            l.name.toLowerCase().includes(s) || l.city.toLowerCase().includes(s) ||
            l.state.toLowerCase().includes(s) || l.address.toLowerCase().includes(s) ||
            l.description.toLowerCase().includes(s)
          );
        }

        setListings(results);
      }
      setLoading(false);
    });
  }, [selectedState, selectedCity, selectedType, maxPrice, minBed, selectedAmenities, q]);

  const toggleAmenity = (a: string) => {
    setSelectedAmenities((prev) => prev.includes(a) ? prev.filter((x) => x !== a) : [...prev, a]);
  };

  const clearFilters = () => {
    setQ(""); setSelectedState(""); setSelectedCity(""); setMaxPrice(100000);
    setSelectedType(""); setSelectedAmenities([]); setMinBed(0);
  };

  const hasFilters = selectedState || selectedCity || selectedType || selectedAmenities.length > 0 || minBed > 0 || maxPrice < 100000 || q.trim();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-gradient-primary py-16 md:py-24 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "radial-gradient(circle at 25% 25%, white 1px, transparent 1px)", backgroundSize: "40px 40px" }} />
        <div className="container relative">
          <AnimatedSection className="text-center">
            <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-primary-foreground/80 mb-3 font-display">
              <Home className="h-3.5 w-3.5" />
              Find Your Home
            </div>
            <h1 className="font-display text-4xl md:text-6xl font-bold text-primary-foreground text-balance">
              Browse Properties
            </h1>
            <p className="mt-4 text-primary-foreground/80 text-lg max-w-2xl mx-auto font-alt">
              Discover premium rental properties across India. Your next home awaits.
            </p>
          </AnimatedSection>
        </div>
      </div>

      <div className="container py-8">
        {/* Search bar */}
        <div className="flex gap-3 items-center mb-6 flex-wrap">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, city, or address..."
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="pl-9"
            />
          </div>
          <Button variant="outline" onClick={() => setShowFilters(!showFilters)} className="gap-2">
            <SlidersHorizontal className="h-4 w-4" />
            Filters
            {hasFilters && <Badge variant="secondary" className="ml-1 h-5 w-5 p-0 rounded-full grid place-items-center text-[10px]">!</Badge>}
          </Button>
          {hasFilters && (
            <Button variant="ghost" size="sm" onClick={clearFilters} className="text-muted-foreground gap-1">
              <X className="h-3 w-3" /> Clear
            </Button>
          )}
        </div>

        {/* Filter panel */}
        {showFilters && (
          <AnimatedSection className="rounded-xl border border-border bg-gradient-card p-6 mb-8">
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {/* State */}
              <div className="space-y-2">
                <Label>State</Label>
                <Select value={selectedState} onValueChange={setSelectedState}>
                  <SelectTrigger><SelectValue placeholder="All states" /></SelectTrigger>
                  <SelectContent>
                    {INDIAN_STATES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              {/* City */}
              <div className="space-y-2">
                <Label>City</Label>
                <Select value={selectedCity} onValueChange={setSelectedCity} disabled={!selectedState}>
                  <SelectTrigger>
                    <SelectValue placeholder={!selectedState ? "Select state first" : "All cities"} />
                  </SelectTrigger>
                  <SelectContent>
                    {loadingCities ? (
                      <SelectItem value="__loading" disabled>Loading...</SelectItem>
                    ) : cities.length === 0 ? (
                      <SelectItem value="__none" disabled>No cities found</SelectItem>
                    ) : (
                      cities.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)
                    )}
                  </SelectContent>
                </Select>
                {!selectedState && <p className="text-[10px] text-muted-foreground">Select a state first</p>}
              </div>

              {/* Property Type */}
              <div className="space-y-2">
                <Label>Property Type</Label>
                <Select value={selectedType} onValueChange={setSelectedType}>
                  <SelectTrigger><SelectValue placeholder="All types" /></SelectTrigger>
                  <SelectContent>
                    {PROPERTY_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              {/* Max Price */}
              <div className="space-y-2">
                <Label>Max Monthly Rent: ₹{maxPrice.toLocaleString("en-IN")}</Label>
                <Slider
                  value={[maxPrice]}
                  onValueChange={([v]) => setMaxPrice(v)}
                  min={5000}
                  max={100000}
                  step={5000}
                />
                <div className="flex justify-between text-[10px] text-muted-foreground">
                  <span>₹5K</span>
                  <span>₹1L</span>
                </div>
              </div>

              {/* Bedrooms */}
              <div className="space-y-2">
                <Label>Min Bedrooms</Label>
                <div className="flex gap-2">
                  {[0, 1, 2, 3, 4].map((n) => (
                    <Button
                      key={n}
                      type="button"
                      variant={minBed === n ? "default" : "outline"}
                      size="sm"
                      onClick={() => setMinBed(n)}
                      className="flex-1"
                    >
                      {n === 0 ? "Any" : n}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Amenities */}
              <div className="space-y-2 sm:col-span-2 lg:col-span-2">
                <Label>Amenities</Label>
                <div className="flex flex-wrap gap-2">
                  {AMENITIES.map((a) => (
                    <Badge
                      key={a}
                      variant={selectedAmenities.includes(a) ? "default" : "outline"}
                      className="cursor-pointer transition-smooth hover:opacity-80"
                      onClick={() => toggleAmenity(a)}
                    >
                      {a}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </AnimatedSection>
        )}

        {/* Results */}
        {loading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="rounded-xl border border-border bg-gradient-card p-6 animate-pulse">
                <div className="h-40 bg-muted rounded-lg mb-4" />
                <div className="h-5 bg-muted rounded w-3/4 mb-2" />
                <div className="h-4 bg-muted rounded w-1/2 mb-4" />
                <div className="h-4 bg-muted rounded w-full" />
              </div>
            ))}
          </div>
        ) : listings.length === 0 ? (
          <div className="text-center py-20">
            <Home className="h-12 w-12 mx-auto text-muted-foreground/40 mb-4" />
            <h3 className="font-display font-semibold text-lg">No properties found</h3>
            <p className="text-muted-foreground mt-1">Try adjusting your filters or search query.</p>
            {hasFilters && <Button variant="outline" className="mt-4" onClick={clearFilters}>Clear all filters</Button>}
          </div>
        ) : (
          <>
            <p className="text-sm text-muted-foreground mb-4 font-num">
              Found {listings.length} property{listings.length !== 1 ? "ies" : "y"}
            </p>
            <AnimatedStagger className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6" baseDelay={50} staggerMs={60}>
              {listings.map((l) => (
                <div
                  key={l.id}
                  className="group rounded-xl border border-border/60 bg-gradient-card overflow-hidden hover-lift-premium"
                >
                  {/* Image placeholder */}
                  <div className="h-48 bg-gradient-primary/20 relative overflow-hidden">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Home className="h-12 w-12 text-primary/20" />
                    </div>
                    <Badge className="absolute top-3 left-3" variant="secondary">
                      {l.propertyType}
                    </Badge>
                    <div className="absolute top-3 right-3">
                      <Badge variant={l.available ? "default" : "secondary"} className="text-[10px]">
                        {l.available ? "Available" : "Occupied"}
                      </Badge>
                    </div>
                    {/* Price badge */}
                    <div className="absolute bottom-3 left-3">
                      <span className="text-sm font-bold text-primary-foreground bg-primary/90 px-3 py-1 rounded-lg font-num">
                        ₹{l.priceMonthly.toLocaleString("en-IN")}/mo
                      </span>
                    </div>
                  </div>

                  <div className="p-5 space-y-3">
                    <h3 className="font-display font-semibold text-lg group-hover:text-primary transition-smooth">
                      {l.name}
                    </h3>

                    <div className="flex items-start gap-1.5 text-sm text-muted-foreground">
                      <MapPin className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                      <span className="font-alt">{l.address}, {l.city}, {l.state}</span>
                    </div>

                    <div className="flex items-center gap-4 text-sm text-muted-foreground font-num">
                      <span className="flex items-center gap-1"><Bed className="h-3.5 w-3.5" /> {l.bedrooms} BHK</span>
                      <span className="flex items-center gap-1"><Bath className="h-3.5 w-3.5" /> {l.bathrooms}</span>
                    </div>

                    {l.amenities.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {l.amenities.slice(0, 4).map((a) => (
                          <Badge key={a} variant="outline" className="text-[10px] font-normal">{a}</Badge>
                        ))}
                        {l.amenities.length > 4 && (
                          <Badge variant="outline" className="text-[10px] font-normal">+{l.amenities.length - 4}</Badge>
                        )}
                      </div>
                    )}

                    {l.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2 font-alt">
                        {l.description}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </AnimatedStagger>
          </>
        )}
      </div>
    </div>
  );
}
