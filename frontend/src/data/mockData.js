// Mock data for Gingerkare Custom Emporium

export const storageUnits = [
  {
    id: 1,
    name: "Small Unit",
    size: "5x5",
    sqft: 25,
    price: 35,
    image: "https://images.unsplash.com/photo-1551313158-73d016a829ae?w=400",
    features: ["Climate Controlled", "Ground Floor", "24/7 Access"],
    available: true,
    rating: 4.8,
    description: "Perfect for seasonal items, small furniture, or boxes."
  },
  {
    id: 2,
    name: "Medium Unit",
    size: "10x10",
    sqft: 100,
    price: 75,
    image: "https://images.unsplash.com/photo-1638847868668-a05a2f69622f?w=400",
    features: ["Climate Controlled", "Drive-Up Access", "24/7 Access"],
    available: true,
    rating: 4.9,
    description: "Ideal for a one-bedroom apartment or small office."
  },
  {
    id: 3,
    name: "Large Unit",
    size: "10x20",
    sqft: 200,
    price: 125,
    image: "https://images.unsplash.com/photo-1600181914037-b14638c1137d?w=400",
    features: ["Climate Controlled", "Drive-Up Access", "24/7 Access", "Power Outlet"],
    available: true,
    rating: 4.7,
    description: "Great for a two-bedroom apartment or business inventory."
  },
  {
    id: 4,
    name: "Extra Large Unit",
    size: "10x30",
    sqft: 300,
    price: 175,
    image: "https://images.unsplash.com/photo-1649313444539-a8900c5cdc54?w=400",
    features: ["Climate Controlled", "Drive-Up Access", "24/7 Access", "Power Outlet"],
    available: false,
    rating: 4.9,
    description: "Perfect for a three-bedroom home or large equipment."
  },
  {
    id: 5,
    name: "Vehicle Storage",
    size: "12x30",
    sqft: 360,
    price: 225,
    image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400",
    features: ["Enclosed", "Climate Controlled", "24/7 Access", "Power Outlet"],
    available: true,
    rating: 5.0,
    description: "Ideal for cars, boats, motorcycles, and RVs."
  },
  {
    id: 6,
    name: "RV/Boat Storage",
    size: "12x40",
    sqft: 480,
    price: 295,
    image: "https://images.unsplash.com/photo-1527786356703-4b100091cd2c?w=400",
    features: ["Covered", "Outdoor Access", "24/7 Access", "Power & Water"],
    available: true,
    rating: 4.8,
    description: "Spacious storage for RVs, boats, and large trailers."
  }
];

export const pawnShopItems = [
  {
    id: 1,
    name: "Gibson Les Paul Electric Guitar",
    category: "Musical Instruments",
    price: 899,
    originalPrice: 1499,
    image: "https://images.unsplash.com/photo-1564186763535-ebb21ef5277f?w=400",
    condition: "Excellent",
    inStock: true,
    description: "Classic Les Paul with original case. Minor cosmetic wear.",
    location: "cave_city_pawn"
  },
  {
    id: 2,
    name: "Rolex Submariner Watch",
    category: "Jewelry & Watches",
    price: 6500,
    originalPrice: 9500,
    image: "https://images.unsplash.com/photo-1523170335258-f5ed11844a49?w=400",
    condition: "Good",
    inStock: true,
    description: "Authentic Rolex Submariner with box and papers.",
    location: "alabama_pawn_storage"
  },
  {
    id: 3,
    name: "Canon EOS R5 Camera",
    category: "Electronics",
    price: 2200,
    originalPrice: 3899,
    image: "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=400",
    condition: "Like New",
    inStock: true,
    description: "Professional mirrorless camera with 24-105mm lens.",
    location: "cave_city_pawn"
  },
  {
    id: 4,
    name: "DeWalt 20V Power Tool Set",
    category: "Tools",
    price: 349,
    originalPrice: 599,
    image: "https://images.unsplash.com/photo-1504148455328-c376907d081c?w=400",
    condition: "Good",
    inStock: true,
    description: "Complete 8-piece cordless tool set with batteries.",
    location: "alabama_pawn_storage"
  },
  {
    id: 5,
    name: "14K Gold Diamond Ring",
    category: "Jewelry & Watches",
    price: 1250,
    originalPrice: 2200,
    image: "https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=400",
    condition: "Excellent",
    inStock: true,
    description: "Beautiful 1.5 carat diamond solitaire in 14K gold.",
    location: "cave_city_pawn"
  },
  {
    id: 6,
    name: "PlayStation 5 Console",
    category: "Electronics",
    price: 399,
    originalPrice: 499,
    image: "https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?w=400",
    condition: "Like New",
    inStock: true,
    description: "PS5 Digital Edition with controller and cables.",
    location: "alabama_pawn_storage"
  },
  {
    id: 7,
    name: "Fender Stratocaster",
    category: "Musical Instruments",
    price: 649,
    originalPrice: 999,
    image: "https://images.unsplash.com/photo-1550985616-10810253b84d?w=400",
    condition: "Good",
    inStock: true,
    description: "American Standard Stratocaster in sunburst finish.",
    location: "cave_city_pawn"
  },
  {
    id: 8,
    name: "Milwaukee M18 Impact Driver",
    category: "Tools",
    price: 129,
    originalPrice: 199,
    image: "https://images.unsplash.com/photo-1572981779307-38b8cabb2407?w=400",
    condition: "Excellent",
    inStock: true,
    description: "Brushless impact driver with 2 batteries and charger.",
    location: "alabama_pawn_storage"
  },
  {
    id: 9,
    name: "MacBook Pro 14\" M3",
    category: "Electronics",
    price: 1599,
    originalPrice: 1999,
    image: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=400",
    condition: "Like New",
    inStock: false,
    description: "2024 MacBook Pro with M3 chip, 16GB RAM, 512GB SSD.",
    location: "cave_city_pawn"
  },
  {
    id: 10,
    name: "Snap-On Wrench Set",
    category: "Tools",
    price: 450,
    originalPrice: 750,
    image: "https://images.unsplash.com/photo-1426927308491-6380b6a9936f?w=400",
    condition: "Good",
    inStock: true,
    description: "Complete metric and SAE combination wrench set.",
    location: "alabama_pawn_storage"
  },
  {
    id: 11,
    name: "Omega Seamaster",
    category: "Jewelry & Watches",
    price: 3200,
    originalPrice: 5500,
    image: "https://images.unsplash.com/photo-1587836374828-4dbafa94cf0e?w=400",
    condition: "Excellent",
    inStock: true,
    description: "Professional diver watch with box and documentation.",
    location: "cave_city_pawn"
  },
  {
    id: 12,
    name: "Pearl Drum Kit",
    category: "Musical Instruments",
    price: 799,
    originalPrice: 1299,
    image: "https://images.unsplash.com/photo-1519892300165-cb5542fb47c7?w=400",
    condition: "Good",
    inStock: true,
    description: "5-piece drum set with cymbals and hardware.",
    location: "alabama_pawn_storage"
  }
];

export const rvServices = [
  {
    id: 1,
    name: "Full RV Inspection",
    price: 199,
    duration: "2-3 hours",
    description: "Comprehensive inspection of all RV systems including electrical, plumbing, HVAC, and structural components.",
    image: "https://images.unsplash.com/photo-1570129476815-ba368ac77013?w=400"
  },
  {
    id: 2,
    name: "Roof Repair & Sealing",
    price: 450,
    duration: "1-2 days",
    description: "Complete roof inspection, repair of leaks, and application of protective sealant coating.",
    image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400"
  },
  {
    id: 3,
    name: "Electrical System Repair",
    price: 150,
    duration: "2-4 hours",
    description: "Diagnosis and repair of 12V/120V electrical issues, inverter problems, and battery systems.",
    image: "https://images.unsplash.com/photo-1621905252507-b35492cc74b4?w=400"
  },
  {
    id: 4,
    name: "Plumbing Repair",
    price: 125,
    duration: "1-3 hours",
    description: "Fix leaks, replace water pumps, repair holding tanks, and winterization services.",
    image: "https://images.unsplash.com/photo-1585704032915-c3400ca199e7?w=400"
  },
  {
    id: 5,
    name: "HVAC Service",
    price: 175,
    duration: "2-4 hours",
    description: "AC repair, furnace maintenance, and complete climate control system service.",
    image: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=400"
  },
  {
    id: 6,
    name: "Interior Restoration",
    price: 1500,
    duration: "3-5 days",
    description: "Complete interior refurbishment including flooring, upholstery, and cabinetry.",
    image: "https://images.unsplash.com/photo-1523987355523-c7b5b0dd90a7?w=400"
  },
  {
    id: 7,
    name: "Exterior Detailing",
    price: 299,
    duration: "4-6 hours",
    description: "Full exterior wash, wax, oxidation removal, and protective coating application.",
    image: "https://images.unsplash.com/photo-1527786356703-4b100091cd2c?w=400"
  },
  {
    id: 8,
    name: "Slide-Out Repair",
    price: 350,
    duration: "2-4 hours",
    description: "Slide-out mechanism repair, seal replacement, and motor diagnostics.",
    image: "https://images.unsplash.com/photo-1543465077-db45d34b88a5?w=400"
  }
];

export const testimonials = [
  {
    id: 1,
    name: "Robert Johnson",
    location: "Dothan, AL",
    rating: 5,
    text: "Best storage facility in Alabama! The staff is incredibly helpful and my unit is always clean and secure. Highly recommend!",
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100"
  },
  {
    id: 2,
    name: "Sarah Williams",
    location: "Enterprise, AL",
    rating: 5,
    text: "Found an amazing deal on a guitar in the catalog. Fair prices and honest service. I'll definitely be back!",
    image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100"
  },
  {
    id: 3,
    name: "Mike Thompson",
    location: "Ozark, AL",
    rating: 5,
    text: "The RV repair team saved my vacation! They fixed my AC in just one day and at a very reasonable price.",
    image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100"
  },
  {
    id: 4,
    name: "Jennifer Davis",
    location: "Headland, AL",
    rating: 5,
    text: "Climate controlled units are perfect for my antique furniture. Professional and trustworthy team!",
    image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100"
  }
];

export const categories = [
  "All Items",
  "Electronics",
  "Jewelry & Watches",
  "Musical Instruments",
  "Tools"
];

export const facilityFeatures = [
  {
    icon: "Shield",
    title: "24/7 Security",
    description: "Round-the-clock video surveillance and gated access for your peace of mind."
  },
  {
    icon: "Thermometer",
    title: "Climate Controlled",
    description: "Temperature and humidity controlled units to protect your valuables."
  },
  {
    icon: "Clock",
    title: "Extended Access",
    description: "Access your belongings 7 days a week with extended hours."
  },
  {
    icon: "Truck",
    title: "Drive-Up Access",
    description: "Convenient drive-up units for easy loading and unloading."
  },
  {
    icon: "CreditCard",
    title: "Flexible Payment",
    description: "Multiple payment options with no long-term contracts required."
  },
  {
    icon: "Users",
    title: "Friendly Staff",
    description: "On-site managers ready to assist you with all your storage needs."
  }
];