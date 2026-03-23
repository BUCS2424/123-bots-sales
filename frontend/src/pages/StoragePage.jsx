import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, Filter, Star, Check, X, Warehouse } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Checkbox } from '../components/ui/checkbox';
import { storageUnits } from '../data/mockData';
import { useCart } from '../context/CartContext';
import { toast } from '../hooks/use-toast';

const storageSizeOptions = [
  { value: 'all', label: 'All Sizes' },
  { value: '5x5', label: '5x5 (25 sq ft)' },
  { value: '5x10', label: '5x10 (50 sq ft)' },
  { value: '10x10', label: '10x10 (100 sq ft)' },
  { value: '10x15', label: '10x15 (150 sq ft)' },
  { value: '10x20', label: '10x20 (200 sq ft)' },
  { value: '10x30', label: '10x30 (300 sq ft)' },
  { value: 'vehicle', label: 'Vehicle/RV Storage' },
];

const StoragePage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSize, setSelectedSize] = useState(searchParams.get('size') || 'all');
  const [sortBy, setSortBy] = useState('price-low');
  const [filters, setFilters] = useState({
    climateControlled: false,
    driveUp: false,
    available: false,
  });
  const { addToCart } = useCart();

  // Update URL when size changes
  useEffect(() => {
    if (selectedSize && selectedSize !== 'all') {
      setSearchParams({ size: selectedSize });
    } else {
      setSearchParams({});
    }
  }, [selectedSize, setSearchParams]);

  const handleAddToCart = (unit) => {
    addToCart(unit, 'storage');
    toast({
      title: 'Added to Cart',
      description: `${unit.name} (${unit.size}) has been added to your cart.`,
    });
  };

  const filteredUnits = storageUnits
    .filter((unit) => {
      // Size filter
      if (selectedSize && selectedSize !== 'all') {
        if (selectedSize === 'vehicle') {
          // Match vehicle/RV storage units
          if (!unit.name.toLowerCase().includes('vehicle') && !unit.name.toLowerCase().includes('rv') && !unit.name.toLowerCase().includes('boat')) {
            return false;
          }
        } else {
          // Match by size
          if (!unit.size.includes(selectedSize.split('x')[0])) {
            return false;
          }
        }
      }
      if (filters.climateControlled && !unit.features.includes('Climate Controlled')) return false;
      if (filters.driveUp && !unit.features.includes('Drive-Up Access')) return false;
      if (filters.available && !unit.available) return false;
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return unit.name.toLowerCase().includes(query) || unit.size.toLowerCase().includes(query);
      }
      return true;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'price-low':
          return a.price - b.price;
        case 'price-high':
          return b.price - a.price;
        case 'size-small':
          return a.sqft - b.sqft;
        case 'size-large':
          return b.sqft - a.sqft;
        case 'rating':
          return b.rating - a.rating;
        default:
          return 0;
      }
    });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Banner */}
      <section className="bg-[#1e3a5f] text-white py-16">
        <div className="max-w-7xl mx-auto px-4">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Storage Units</h1>
          <p className="text-xl text-gray-300 max-w-2xl">
            Find the perfect storage unit for your needs. From small lockers to large vehicle storage.
          </p>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Search and Filters */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-8">
          <div className="grid md:grid-cols-12 gap-4">
            <div className="md:col-span-3">
              <Select value={selectedSize} onValueChange={setSelectedSize}>
                <SelectTrigger>
                  <div className="flex items-center gap-2">
                    <Warehouse className="w-4 h-4 text-gray-400" />
                    <SelectValue placeholder="Select Size" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  {storageSizeOptions.map((size) => (
                    <SelectItem key={size.value} value={size.value}>
                      {size.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="md:col-span-4 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                type="text"
                placeholder="Search units..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <div className="md:col-span-2">
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger>
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="price-low">Price: Low to High</SelectItem>
                  <SelectItem value="price-high">Price: High to Low</SelectItem>
                  <SelectItem value="size-small">Size: Small to Large</SelectItem>
                  <SelectItem value="size-large">Size: Large to Small</SelectItem>
                  <SelectItem value="rating">Highest Rated</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="md:col-span-3 flex flex-wrap gap-4 items-center">
              <label className="flex items-center gap-2 cursor-pointer">
                <Checkbox
                  checked={filters.climateControlled}
                  onCheckedChange={(checked) => setFilters({ ...filters, climateControlled: checked })}
                />
                <span className="text-sm">Climate Controlled</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <Checkbox
                  checked={filters.driveUp}
                  onCheckedChange={(checked) => setFilters({ ...filters, driveUp: checked })}
                />
                <span className="text-sm">Drive-Up</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <Checkbox
                  checked={filters.available}
                  onCheckedChange={(checked) => setFilters({ ...filters, available: checked })}
                />
                <span className="text-sm">Available Only</span>
              </label>
            </div>
          </div>
        </div>

        {/* Results Count */}
        <div className="flex justify-between items-center mb-6">
          <p className="text-gray-600">
            Showing <span className="font-semibold text-[#1e3a5f]">{filteredUnits.length}</span> storage units
          </p>
        </div>

        {/* Units Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredUnits.map((unit) => (
            <Card key={unit.id} className="overflow-hidden hover:shadow-xl transition-all duration-300 group">
              <div className="relative">
                <img
                  src={unit.image}
                  alt={unit.name}
                  className="w-full h-56 object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute top-3 right-3 flex gap-2">
                  {unit.available ? (
                    <Badge className="bg-green-600">Available</Badge>
                  ) : (
                    <Badge className="bg-gray-600">Sold Out</Badge>
                  )}
                </div>
                <div className="absolute bottom-3 left-3">
                  <Badge className="bg-[#c41e3a] text-white">
                    1st Month FREE
                  </Badge>
                </div>
              </div>
              
              <CardContent className="p-5">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="text-xl font-bold text-[#1e3a5f]">{unit.name}</h3>
                    <p className="text-gray-500">{unit.size} ({unit.sqft} sq ft)</p>
                  </div>
                  <div className="flex items-center gap-1 bg-yellow-50 px-2 py-1 rounded">
                    <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    <span className="font-semibold text-sm">{unit.rating}</span>
                  </div>
                </div>
                
                <p className="text-gray-600 text-sm mb-4">{unit.description}</p>
                
                <div className="flex flex-wrap gap-2 mb-4">
                  {unit.features.map((feature, index) => (
                    <span
                      key={index}
                      className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full flex items-center gap-1"
                    >
                      <Check className="w-3 h-3 text-green-600" />
                      {feature}
                    </span>
                  ))}
                </div>
                
                <div className="flex justify-between items-center pt-4 border-t">
                  <div>
                    <span className="text-sm text-gray-500">Starting at</span>
                    <p className="text-2xl font-bold text-[#c41e3a]">
                      ${unit.price}<span className="text-sm font-normal text-gray-500">/mo</span>
                    </p>
                  </div>
                  <Button
                    onClick={() => handleAddToCart(unit)}
                    disabled={!unit.available}
                    className="bg-[#c41e3a] hover:bg-[#a01830] text-white"
                  >
                    {unit.available ? 'Reserve Now' : 'Unavailable'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredUnits.length === 0 && (
          <div className="text-center py-12">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="w-10 h-10 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No units found</h3>
            <p className="text-gray-500">Try adjusting your filters or search criteria.</p>
          </div>
        )}
      </div>

      {/* Size Guide Section */}
      <section className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-[#1e3a5f] text-center mb-8">
            Not Sure What Size You Need?
          </h2>
          <div className="grid md:grid-cols-4 gap-6">
            {[
              { size: '5x5', sqft: 25, desc: 'Small closet, boxes, seasonal items', items: 'Fits: 5-10 boxes' },
              { size: '10x10', sqft: 100, desc: 'One-bedroom apartment', items: 'Fits: Furniture + 50 boxes' },
              { size: '10x20', sqft: 200, desc: 'Two-bedroom apartment', items: 'Fits: Full home contents' },
              { size: '10x30', sqft: 300, desc: 'Three-bedroom house', items: 'Fits: Large furniture + appliances' },
            ].map((guide, index) => (
              <Card key={index} className="text-center p-6 hover:shadow-lg transition-shadow">
                <div className="w-16 h-16 bg-[#c41e3a]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-xl font-bold text-[#c41e3a]">{guide.size}</span>
                </div>
                <h3 className="font-bold text-[#1e3a5f] mb-1">{guide.sqft} sq ft</h3>
                <p className="text-gray-600 text-sm mb-2">{guide.desc}</p>
                <p className="text-xs text-gray-400">{guide.items}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default StoragePage;