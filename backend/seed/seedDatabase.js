import mongoose from 'mongoose';
import dotenv from 'dotenv';
import connectDB from '../config/database.js';
import {
  Parcel,
  Owner,
  OwnershipHistory,
  Transfer,
  Dispute,
  Mortgage,
  User,
  AuditLog,
  Subsidy
} from '../models/index.js';

dotenv.config();

// Serbian Names (Common first and last names)
const SERBIAN_FIRST_NAMES_MALE = [
  'Marko', 'Stefan', 'Nikola', 'Luka', 'Aleksandar', 'Miloš', 'Jovan', 'Petar',
  'Đorđe', 'Filip', 'Nemanja', 'Vladimir', 'Milan', 'Dušan', 'Bojan', 'Igor',
  'Dejan', 'Zoran', 'Dragan', 'Goran'
];

const SERBIAN_FIRST_NAMES_FEMALE = [
  'Milica', 'Jelena', 'Ana', 'Marija', 'Jovana', 'Teodora', 'Katarina', 'Sara',
  'Anastasija', 'Sofija', 'Dragana', 'Snežana', 'Maja', 'Ivana', 'Tamara',
  'Nataša', 'Vesna', 'Jasmina', 'Gordana', 'Biljana'
];

const SERBIAN_LAST_NAMES = [
  'Petrović', 'Nikolić', 'Jovanović', 'Đorđević', 'Ilić', 'Marković', 'Pavlović',
  'Stojanović', 'Simić', 'Popović', 'Stanković', 'Milošević', 'Kostić', 'Stefanović',
  'Mladenović', 'Živković', 'Tomić', 'Dimitrijević', 'Vasiljević', 'Lazić',
  'Todorović', 'Radovanović', 'Milenković', 'Antić', 'Ristić'
];

const SERBIAN_CITIES = {
  'Belgrade':        ['Stari Grad', 'Vračar', 'Savski Venac', 'Palilula', 'Novi Beograd', 'Zemun', 'Čukarica', 'Rakovica', 'Zvezdara', 'Voždovac', 'Surčin', 'Barajevo', 'Grocka', 'Lazarevac', 'Mladenovac', 'Obrenovac', 'Sopot'],
  'Južna Bačka':     ['Novi Sad', 'Bačka Palanka', 'Bačka Petrovac', 'Beočin', 'Bečej', 'Srbobran', 'Temerin', 'Titel', 'Vrbas', 'Žabalj'],
  'Severna Bačka':   ['Subotica', 'Bačka Topola', 'Mali Iđoš'],
  'Zapadna Bačka':   ['Sombor', 'Apatin', 'Kula', 'Odžaci'],
  'Srednji Banat':   ['Zrenjanin', 'Novi Bečej', 'Nova Crnja', 'Žitište', 'Sečanj'],
  'Severni Banat':   ['Kikinda', 'Ada', 'Čoka', 'Kanjiža', 'Novi Kneževac', 'Senta'],
  'Južni Banat':     ['Pančevo', 'Alibunar', 'Bela Crkva', 'Kovačica', 'Kovin', 'Opovo', 'Plandište', 'Vršac'],
  'Srem':            ['Sremska Mitrovica', 'Inđija', 'Irig', 'Pećinci', 'Ruma', 'Šid', 'Stara Pazova'],
  'Mačva':           ['Šabac', 'Bogatić', 'Koceljeva', 'Krupanj', 'Loznica', 'Ljubovija', 'Mali Zvornik', 'Vladimirci'],
  'Kolubara':        ['Valjevo', 'Lajkovac', 'Ljig', 'Mionica', 'Osečina', 'Ub'],
  'Podunavlje':      ['Smederevo', 'Smederevska Palanka', 'Velika Plana'],
  'Braničevo':       ['Požarevac', 'Petrovac na Mlavi', 'Veliko Gradište', 'Golubac', 'Kučevo', 'Malo Crniće', 'Žabari'],
  'Šumadija':        ['Kragujevac', 'Aranđelovac', 'Batočina', 'Knić', 'Lapovo', 'Rača', 'Topola'],
  'Pomoravlje':      ['Jagodina', 'Ćuprija', 'Despotovac', 'Paraćin', 'Rekovac', 'Svilajnac'],
  'Bor':             ['Bor', 'Kladovo', 'Majdanpek', 'Negotin'],
  'Zaječar':         ['Zaječar', 'Boljevac', 'Knjazevac', 'Sokobanja'],
  'Zlatibor':        ['Užice', 'Arilje', 'Bajina Bašta', 'Čajetina', 'Kosjerić', 'Nova Varoš', 'Požega', 'Priboj', 'Prijepolje', 'Sjenica'],
  'Moravica':        ['Čačak', 'Gornji Milanovac', 'Ivanjica', 'Lučani'],
  'Raška':           ['Kraljevo', 'Novi Pazar', 'Raška', 'Tutin', 'Vrnjačka Banja'],
  'Rasina':          ['Kruševac', 'Aleksandrovac', 'Brus', 'Ćićevac', 'Trstenik', 'Varvarin'],
  'Nišava':          ['Niš', 'Aleksinac', 'Doljevac', 'Gadžin Han', 'Merošina', 'Ražanj', 'Svrljig'],
  'Toplica':         ['Prokuplje', 'Blace', 'Kuršumlija', 'Žitorađa'],
  'Pirot':           ['Pirot', 'Babušnica', 'Bela Palanka', 'Dimitrovgrad'],
  'Jablanica':       ['Leskovac', 'Bojnik', 'Crna Trava', 'Lebane', 'Medveđa', 'Vlasotince'],
  'Pčinja':          ['Vranje', 'Bosilegrad', 'Bujanovac', 'Preševo', 'Surdulica', 'Trgovište', 'Vladičin Han']
};

const REGIONS = Object.keys(SERBIAN_CITIES);

const STREET_NAMES = [
  'Knez Mihailova', 'Kralja Milana', 'Kralja Petra', 'Terazije', 'Bulevar Kralja Aleksandra',
  'Nemanjina', 'Makedonska', 'Svetozara Markovića', 'Takovska', 'Resavska',
  'Bulevar oslobođenja', 'Cara Lazara', 'Vojvode Stepe', 'Njegoševa', 'Džordža Vašingtona'
];

const COMPANY_NAMES = [
  'Energoprojekt', 'Metalac', 'Železara Smederevo', 'Milan Blagojević', 'FAP Trucks',
  'Dunav Osiguranje', 'Delta Holding', 'MK Group', 'Telekom Srbija', 'Aerodrom Nikola Tesla',
  'Železnice Srbije', 'Elektroprivreda Srbije', 'Messer Tehnogas', 'Carnex', 'Imlek'
];

const BANK_NAMES = [
  'Raiffeisen Bank', 'Komercijalna Banka', 'UniCredit Bank', 'Intesa Sanpaolo',
  'Banca Intesa', 'Erste Bank', 'OTP Banka', 'ProCredit Bank', 'AIK Banka'
];

// Utility Functions
const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const randomFloat = (min, max) => Math.random() * (max - min) + min;
const randomElement = (arr) => arr[randomInt(0, arr.length - 1)];
const randomDate = (start, end) => new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));

const generateNationalId = () => {
  return `${randomInt(0, 3)}${randomInt(100000000, 999999999)}`;
};

const generateParcelId = (region) => {
  const regionCode = region.substring(0, 2).toUpperCase();
  return `RS-${regionCode}-${String(randomInt(1, 999999)).padStart(6, '0')}`;
};

const generateCoordinates = (region) => {
  // Approximate coordinates for Serbian regions
  const coords = {
    'Belgrade':      { lat: [44.75, 44.88], lng: [20.35, 20.58] },
    'Južna Bačka':   { lat: [45.20, 45.35], lng: [19.65, 20.10] },
    'Severna Bačka': { lat: [45.85, 46.10], lng: [19.50, 19.90] },
    'Zapadna Bačka': { lat: [45.60, 45.80], lng: [18.90, 19.30] },
    'Srednji Banat': { lat: [45.35, 45.55], lng: [20.20, 20.60] },
    'Severni Banat': { lat: [45.70, 45.95], lng: [20.20, 20.60] },
    'Južni Banat':   { lat: [44.80, 45.20], lng: [20.55, 21.30] },
    'Srem':          { lat: [44.90, 45.15], lng: [19.40, 20.10] },
    'Mačva':         { lat: [44.45, 44.80], lng: [19.20, 19.80] },
    'Kolubara':      { lat: [44.15, 44.40], lng: [19.70, 20.10] },
    'Podunavlje':    { lat: [44.55, 44.75], lng: [20.80, 21.15] },
    'Braničevo':     { lat: [44.40, 44.70], lng: [21.10, 21.70] },
    'Šumadija':      { lat: [43.95, 44.20], lng: [20.70, 21.10] },
    'Pomoravlje':    { lat: [43.85, 44.15], lng: [21.10, 21.60] },
    'Bor':           { lat: [43.90, 44.30], lng: [21.80, 22.40] },
    'Zaječar':       { lat: [43.65, 44.05], lng: [21.80, 22.50] },
    'Zlatibor':      { lat: [43.50, 43.90], lng: [19.35, 20.10] },
    'Moravica':      { lat: [43.70, 44.00], lng: [20.10, 20.60] },
    'Raška':         { lat: [43.40, 43.80], lng: [20.40, 21.00] },
    'Rasina':        { lat: [43.50, 43.80], lng: [21.10, 21.60] },
    'Nišava':        { lat: [43.25, 43.55], lng: [21.75, 22.25] },
    'Toplica':       { lat: [43.10, 43.40], lng: [21.40, 21.80] },
    'Pirot':         { lat: [43.05, 43.35], lng: [22.20, 22.90] },
    'Jablanica':     { lat: [42.90, 43.20], lng: [21.75, 22.20] },
    'Pčinja':        { lat: [42.40, 42.80], lng: [21.70, 22.50] }
  };
  
  const regionCoords = coords[region] || coords['Belgrade'];
  return {
    latitude: randomFloat(regionCoords.lat[0], regionCoords.lat[1]),
    longitude: randomFloat(regionCoords.lng[0], regionCoords.lng[1])
  };
};

// Data Generation Functions
const generateOwners = async (count) => {
  console.log(`📝 Creating ${count} owners...`);
  const owners = [];
  
  for (let i = 0; i < count; i++) {
    const ownerType = Math.random() > 0.8 ? 'corporation' : 'individual';
    const region = randomElement(REGIONS);
    const cities = SERBIAN_CITIES[region];
    
    let owner;
    
    if (ownerType === 'individual') {
      const isMale = Math.random() > 0.5;
      owner = {
        ownerType: 'individual',
        personalInfo: {
          firstName: isMale ? randomElement(SERBIAN_FIRST_NAMES_MALE) : randomElement(SERBIAN_FIRST_NAMES_FEMALE),
          lastName: randomElement(SERBIAN_LAST_NAMES),
          dateOfBirth: randomDate(new Date('1950-01-01'), new Date('2000-12-31')),
          nationalId: generateNationalId(),
          taxId: `${randomInt(100000000, 999999999)}`
        },
        contact: {
          email: `owner${i}@example.rs`,
          phone: `+381${randomInt(10, 69)}${randomInt(100000, 999999)}`,
          mobile: `+38160${randomInt(100000, 999999)}`
        },
        address: {
          street: randomElement(STREET_NAMES),
          number: `${randomInt(1, 200)}`,
          city: randomElement(cities),
          postalCode: `${randomInt(11000, 38000)}`,
          country: 'Serbia'
        },
        citizenship: 'Serbian',
        residencyStatus: 'resident',
        creditScore: randomInt(400, 800),
        isVerified: Math.random() > 0.1,
        registrationDate: randomDate(new Date('2010-01-01'), new Date())
      };
    } else {
      owner = {
        ownerType: 'corporation',
        corporateInfo: {
          companyName: randomElement(COMPANY_NAMES),
          registrationNumber: `${randomInt(10000000, 99999999)}`,
          taxId: `${randomInt(100000000, 999999999)}`,
          legalForm: randomElement(['LLC', 'JSC', 'Partnership']),
          incorporationDate: randomDate(new Date('1990-01-01'), new Date('2020-12-31'))
        },
        contact: {
          email: `company${i}@example.rs`,
          phone: `+381${randomInt(10, 69)}${randomInt(100000, 999999)}`
        },
        address: {
          street: randomElement(STREET_NAMES),
          number: `${randomInt(1, 200)}`,
          city: randomElement(cities),
          postalCode: `${randomInt(11000, 38000)}`,
          country: 'Serbia'
        },
        isVerified: Math.random() > 0.05,
        registrationDate: randomDate(new Date('2005-01-01'), new Date())
      };
    }
    
    owners.push(owner);
  }
  
  return await Owner.insertMany(owners);
};

const generateUsers = async () => {
  console.log('👥 Creating system users...');
  
  const users = [
    {
      userId: 'USR-2024-000001',
      firstName: 'Marko',
      lastName: 'Petrović',
      email: 'minister@land.gov.rs',
      password: 'Minister@123',
      role: 'minister',
      permissions: ['view_all_regions', 'generate_reports'],
      department: 'management',
      position: 'Minister of Land Affairs',
      hireDate: new Date('2020-01-01'),
      assignedRegions: REGIONS,
      isActive: true,
      isVerified: true
    },
    {
      userId: 'USR-2024-000002',
      firstName: 'Ana',
      lastName: 'Jovanović',
      email: 'registrar.belgrade@land.gov.rs',
      password: 'Registrar@123',
      role: 'registrar',
      permissions: ['create_parcel', 'edit_parcel', 'approve_transfer'],
      department: 'land_registry',
      position: 'Senior Registrar',
      hireDate: new Date('2018-06-15'),
      assignedRegions: ['Belgrade', 'Kolubara'],
      isActive: true,
      isVerified: true
    },
    {
      userId: 'USR-2024-000003',
      firstName: 'Milan',
      lastName: 'Đorđević',
      email: 'judge@land.gov.rs',
      password: 'Judge@123',
      role: 'judge',
      permissions: ['resolve_dispute', 'view_audit_logs'],
      department: 'judiciary',
      position: 'Land Court Judge',
      hireDate: new Date('2015-03-20'),
      barNumber: 'JDG-12345',
      assignedRegions: REGIONS,
      isActive: true,
      isVerified: true
    },
    {
      userId: 'USR-2024-000004',
      firstName: 'Jelena',
      lastName: 'Nikolić',
      email: 'auditor@land.gov.rs',
      password: 'Auditor@123',
      role: 'auditor',
      permissions: ['view_audit_logs', 'blockchain_access'],
      department: 'audit',
      position: 'Chief Auditor',
      hireDate: new Date('2019-09-10'),
      assignedRegions: REGIONS,
      isActive: true,
      isVerified: true
    }
  ];
  
  // Add more registrars for each region
  REGIONS.forEach((region, idx) => {
    users.push({
      userId: `USR-2024-${String(idx + 10).padStart(6, '0')}`,
      firstName: randomElement([...SERBIAN_FIRST_NAMES_MALE, ...SERBIAN_FIRST_NAMES_FEMALE]),
      lastName: randomElement(SERBIAN_LAST_NAMES),
      email: `registrar.${region.toLowerCase().replace(/\s/g, '')}@land.gov.rs`,
      password: 'Registrar@123',
      role: 'registrar',
      permissions: ['create_parcel', 'edit_parcel', 'approve_transfer'],
      department: 'land_registry',
      position: 'Regional Registrar',
      hireDate: randomDate(new Date('2015-01-01'), new Date('2023-12-31')),
      assignedRegions: [region],
      primaryOffice: region,
      isActive: true,
      isVerified: true
    });
  });
  
  return await User.insertMany(users);
};

const generateParcels = async (owners, users, count) => {
  console.log(`🏠 Creating ${count} land parcels...`);
  const parcels = [];

  // Region weights based on real Serbian population distribution (2024 census).
  // Belgrade + Južna Bačka (Novi Sad) dominate — together ~40% of population.
  // This ensures national avg residential price naturally reflects the population-weighted
  // median (~€78K per PPT) rather than a flat average across 25 equal regions.
  const REGION_WEIGHTS = {
    'Belgrade':        25,  // ~1.7M population — largest city, most parcels
    'Južna Bačka':     14,  // ~600K (Novi Sad) — second largest
    'Šumadija':         6,  // ~250K (Kragujevac)
    'Nišava':           6,  // ~250K (Niš)
    'Severna Bačka':    4,  // ~180K (Subotica)
    'Južni Banat':      4,  // ~190K (Pančevo)
    'Srem':             4,  // ~195K
    'Mačva':            3,  // ~175K
    'Rasina':           3,  // ~150K (Kruševac)
    'Zlatibor':         3,  // ~150K (Užice)
    'Moravica':         3,  // ~170K (Čačak)
    'Raška':            3,  // ~155K (Novi Pazar)
    'Pomoravlje':       2,  // ~145K
    'Jablanica':        2,  // ~145K (Leskovac)
    'Kolubara':         2,
    'Podunavlje':       2,
    'Braničevo':        2,
    'Bor':              2,
    'Zaječar':          1,
    'Zapadna Bačka':    1,
    'Srednji Banat':    1,
    'Severni Banat':    1,
    'Toplica':          1,
    'Pirot':            1,
    'Pčinja':           1,
  };
  // Build weighted array for O(1) sampling
  const weightedRegions = [];
  Object.entries(REGION_WEIGHTS).forEach(([region, weight]) => {
    for (let w = 0; w < weight; w++) weightedRegions.push(region);
  });

  for (let i = 0; i < count; i++) {
    const region = randomElement(weightedRegions);
    const cities = SERBIAN_CITIES[region];
    const city = randomElement(cities);
    const owner = randomElement(owners);
    const coords = generateCoordinates(region);
    
    // Residential price ranges per region — calibrated so that:
    //   • Belgrade avg ~€185K (PPT Slide 3: 12.8x PIR)
    //   • Rural south avg ~€40-55K (PPT: Leskovac 5.2x, Čačak 5.5x)
    //   • ~34% of regions have avg EMI ≤ 30% of monthly income (PPT Slide 3: Eligible Households)
    // Max-eligible price per region = income * 0.30 / (12 * 0.005012)
    const RESIDENTIAL_PRICE_RANGE = {
      'Belgrade':        [140000, 230000],  // avg ~185K → PIR 12.8x (PPT exact)
      'Južna Bačka':     [100000, 160000],  // avg ~130K → PIR 9.2x (Novi Sad)
      'Severna Bačka':   [45000,   80000],  // avg ~62K  → PIR 6.2x
      'Zapadna Bačka':   [28000,   58000],  // avg ~43K  → EMI 28.9% ✓ eligible
      'Srednji Banat':   [30000,   60000],  // avg ~45K  → EMI 29.5% ✓ eligible
      'Severni Banat':   [32000,   62000],  // avg ~47K  → EMI 28.9% ✓ eligible
      'Južni Banat':     [50000,   90000],  // avg ~70K  → PIR 6.0x
      'Srem':            [38000,   70000],  // avg ~54K  → EMI 31.4% stressed
      'Mačva':           [28000,   56000],  // avg ~42K  → EMI 27.4% ✓ eligible
      'Kolubara':        [26000,   52000],  // avg ~39K  → EMI 26.0% ✓ eligible
      'Podunavlje':      [32000,   62000],  // avg ~47K  → EMI 29.7% ✓ eligible
      'Braničevo':       [26000,   54000],  // avg ~40K  → EMI 26.5% ✓ eligible
      'Šumadija':        [42000,   82000],  // avg ~62K  → PIR 6.2x (Kragujevac)
      'Pomoravlje':      [28000,   58000],  // avg ~43K  → EMI 27.7% ✓ eligible
      'Bor':             [26000,   54000],  // avg ~40K  → EMI 26.1% ✓ eligible
      'Zaječar':         [25000,   50000],  // avg ~37K  → EMI 25.0% ✓ eligible
      'Zlatibor':        [30000,   60000],  // avg ~45K  → EMI 30.0% borderline
      'Moravica':        [30000,   58000],  // avg ~44K  → PIR 5.1x (Čačak ~5.5x PPT)
      'Raška':           [28000,   56000],  // avg ~42K  → EMI 28.6% ✓ eligible
      'Rasina':          [26000,   52000],  // avg ~39K  → EMI 26.9% ✓ eligible
      'Nišava':          [42000,   80000],  // avg ~61K  → PIR 5.8x (Niš)
      'Toplica':         [22000,   46000],  // avg ~34K  → EMI 24.3% ✓ eligible
      'Pirot':           [24000,   50000],  // avg ~37K  → EMI 25.8% ✓ eligible
      'Jablanica':       [22000,   44000],  // avg ~33K  → PIR 4.0x (Leskovac ~5.2x PPT)
      'Pčinja':          [20000,   42000],  // avg ~31K  → PIR 3.9x
    };

    const landType = randomElement(['agricultural', 'residential', 'commercial', 'industrial', 'mixed']);

    // Use region-specific price range for residential; generic range for other types
    let marketValue;
    if (landType === 'residential') {
      const [minP, maxP] = RESIDENTIAL_PRICE_RANGE[region] || [30000, 80000];
      marketValue = randomInt(minP, maxP);
    } else {
      marketValue = randomInt(20000, 500000);
    }

    const parcel = {
      parcelId: generateParcelId(region),
      region,
      district: region,
      municipality: city,
      cadastralMunicipality: city,
      address: {
        street: randomElement(STREET_NAMES),
        number: `${randomInt(1, 300)}`,
        postalCode: `${randomInt(11000, 38000)}`,
        city
      },
      coordinates: coords,
      area: randomInt(200, 50000), // square meters
      landType,
      landUse: randomElement(['building', 'farming', 'vacant', 'developed']),
      currentOwner: owner._id,
      ownershipType: owner.ownerType === 'corporation' ? 'private' : randomElement(['private', 'shared']),
      legalStatus: randomElement(['verified', 'verified', 'verified', 'verified', 'clean', 'disputed', 'pending']),
      marketValue, // EUR — residential uses region-specific range aligned to PPT data
      taxValue: Math.round(marketValue * randomFloat(0.6, 0.85)), // EUR
      lastValuationDate: randomDate(new Date('2022-01-01'), new Date()),
      hasMortgage: Math.random() > 0.6,
      hasLien: Math.random() > 0.9,
      hasEasement: Math.random() > 0.85,
      blockchainHash: `0x${Math.random().toString(16).substr(2, 64)}`,
      lastVerifiedDate: randomDate(new Date('2023-01-01'), new Date()),
      verifiedBy: randomElement(users.filter(u => u.role === 'registrar'))._id,
      isActive: true,
      isFraudulent: false,
      registrationDate: randomDate(new Date('2000-01-01'), new Date())
    };
    
    parcels.push(parcel);
  }
  
  return await Parcel.insertMany(parcels);
};

const generateOwnershipHistory = async (parcels, owners, users) => {
  console.log('📜 Creating ownership history records...');
  const histories = [];
  
  for (const parcel of parcels) {
    // Generate 1-5 historical ownership records per parcel
    const historyCount = randomInt(1, 5);
    let currentDate = new Date(parcel.registrationDate);
    let previousOwner = null;
    
    for (let i = 0; i < historyCount; i++) {
      const newOwner = i === historyCount - 1 ? parcel.currentOwner : randomElement(owners)._id;
      const transactionDate = new Date(currentDate);
      transactionDate.setMonth(currentDate.getMonth() + randomInt(6, 60));
      
      if (transactionDate > new Date()) break;
      
      const history = {
        parcel: parcel._id,
        transactionType: randomElement(['purchase', 'purchase', 'sale', 'inheritance', 'gift']),
        previousOwner: previousOwner,
        newOwner: newOwner,
        transactionDate: transactionDate,
        registrationDate: new Date(transactionDate.getTime() + 86400000 * randomInt(1, 14)),
        transactionValue: randomInt(10000, parcel.marketValue),
        taxPaid: randomInt(500, 10000),
        legalBasis: `Purchase Contract #${randomInt(10000, 99999)}`,
        contractNumber: `CTR-${new Date(transactionDate).getFullYear()}-${randomInt(10000, 99999)}`,
        notaryId: `NOT-${randomInt(1000, 9999)}`,
        status: 'approved',
        approvedBy: randomElement(users.filter(u => u.role === 'registrar'))._id,
        approvalDate: new Date(transactionDate.getTime() + 86400000 * randomInt(1, 7)),
        blockchainHash: `0x${Math.random().toString(16).substr(2, 64)}`,
        blockchainTimestamp: transactionDate,
        createdBy: randomElement(users.filter(u => u.role === 'registrar'))._id,
        verifiedBy: randomElement(users.filter(u => u.role === 'registrar'))._id,
        verificationDate: new Date(transactionDate.getTime() + 86400000 * randomInt(1, 5)),
        isActive: true
      };
      
      histories.push(history);
      previousOwner = newOwner;
      currentDate = transactionDate;
    }
  }
  
  return await OwnershipHistory.insertMany(histories);
};

const generateDisputes = async (parcels, owners, users) => {
  console.log('⚖️  Creating dispute records...');
  const disputes = [];
  const disputeCount = Math.min(150, Math.floor(parcels.length * 0.15)); // 15% of parcels have disputes
  
  for (let i = 0; i < disputeCount; i++) {
    const parcel = randomElement(parcels);
    const filingDate = randomDate(new Date('2020-01-01'), new Date());
    const daysSinceFiling = Math.floor((new Date() - filingDate) / (1000 * 60 * 60 * 24));
    
    let status;
    if (daysSinceFiling < 30) status = 'Open';
    else if (daysSinceFiling < 90) status = randomElement(['Open', 'Investigation']);
    else if (daysSinceFiling < 180) status = randomElement(['Investigation', 'Court']);
    else status = randomElement(['Court', 'Court', 'Resolved']);
    
    const dispute = {
      disputeId: `DSP-${new Date(filingDate).getFullYear()}-${String(i + 1).padStart(6, '0')}`,
      parcel: parcel._id,
      claimant: randomElement(owners)._id,
      defendant: parcel.currentOwner,
      disputeType: randomElement([
        'ownership_claim', 'boundary_dispute', 'inheritance_dispute',
        'fraud_allegation', 'contract_breach'
      ]),
      description: 'Dispute regarding property ownership and boundaries.',
      claimedAmount: randomInt(5000, 200000),
      status: status,
      priority: randomElement(['low', 'low', 'medium', 'medium', 'high']),
      filingDate: filingDate,
      region: parcel.region,
      investigationStartDate: status !== 'Open' ? new Date(filingDate.getTime() + 86400000 * randomInt(5, 20)) : null,
      courtFilingDate: ['Court', 'Resolved'].includes(status) ? new Date(filingDate.getTime() + 86400000 * randomInt(60, 150)) : null,
      resolutionDate: status === 'Resolved' ? new Date(filingDate.getTime() + 86400000 * randomInt(180, 400)) : null,
      estimatedCost: randomInt(2000, 50000),
      actualCost: status === 'Resolved' ? randomInt(2000, 50000) : 0,
      assignedTo: randomElement(users.filter(u => u.role === 'registrar' || u.role === 'judge'))._id,
      createdBy: randomElement(users.filter(u => u.role === 'registrar'))._id,
      isUrgent: Math.random() > 0.9
    };
    
    if (status === 'Resolved') {
      dispute.resolution = {
        outcome: randomElement(['claimant_favor', 'defendant_favor', 'settlement', 'dismissed']),
        description: 'Dispute resolved through court decision.',
        compensationAmount: randomInt(0, 50000)
      };
    }
    
    disputes.push(dispute);
  }
  
  return await Dispute.insertMany(disputes);
};

const generateTransfers = async (parcels, owners, users) => {
  console.log('📋 Creating transfer records...');
  const transfers = [];
  const transferCount = Math.min(300, Math.floor(parcels.length * 0.3)); // 30% have recent transfers
  
  for (let i = 0; i < transferCount; i++) {
    const parcel = randomElement(parcels);
    const applicationDate = randomDate(new Date('2023-01-01'), new Date());
    const daysSinceApplication = Math.floor((new Date() - applicationDate) / (1000 * 60 * 60 * 24));
    
    let transferStatus;
    let processingStage;
    
    if (daysSinceApplication < 7) {
      transferStatus = 'initiated';
      processingStage = 'document_submission';
    } else if (daysSinceApplication < 14) {
      transferStatus = 'pending_approval';
      processingStage = randomElement(['document_verification', 'legal_review']);
    } else if (daysSinceApplication < 30) {
      transferStatus = randomElement(['pending_approval', 'approved']);
      processingStage = randomElement(['tax_assessment', 'approval_pending', 'registration']);
    } else {
      transferStatus = randomElement(['approved', 'completed', 'completed']);
      processingStage = transferStatus === 'completed' ? 'completed' : 'registration';
    }
    
    const agreedPrice = randomInt(20000, parcel.marketValue * 1.2);
    
    const transfer = {
      transferId: `TRF-${new Date(applicationDate).getFullYear()}-${String(i + 1).padStart(6, '0')}`,
      parcel: parcel._id,
      seller: parcel.currentOwner,
      buyer: randomElement(owners)._id,
      transferType: randomElement(['sale', 'sale', 'sale', 'gift', 'inheritance']),
      transferStatus: transferStatus,
      agreedPrice: agreedPrice,
      registeredPrice: agreedPrice,
      marketValue: parcel.marketValue,
      transferTax: {
        rate: 2.5,
        amount: agreedPrice * 0.025
      },
      registrationFee: randomInt(100, 500),
      notaryFee: randomInt(200, 1000),
      paymentStatus: transferStatus === 'completed' ? 'paid' : randomElement(['unpaid', 'partial', 'paid']),
      contractDate: new Date(applicationDate.getTime() - 86400000 * randomInt(5, 30)),
      contractNumber: `CTR-${new Date(applicationDate).getFullYear()}-${randomInt(10000, 99999)}`,
      applicationDate: applicationDate,
      processingStage: processingStage,
      region: parcel.region,
      registryOffice: `${parcel.region} Registry Office`,
      blockchainHash: transferStatus === 'completed' ? `0x${Math.random().toString(16).substr(2, 64)}` : null,
      assignedOfficer: randomElement(users.filter(u => u.role === 'registrar'))._id,
      createdBy: randomElement(users.filter(u => u.role === 'registrar'))._id,
      isPriority: Math.random() > 0.9
    };
    
    if (transferStatus === 'approved' || transferStatus === 'completed') {
      transfer.approvedBy = randomElement(users.filter(u => u.role === 'registrar'))._id;
      transfer.approvalDate = new Date(applicationDate.getTime() + 86400000 * randomInt(7, 20));
    }
    
  if (transferStatus === 'completed') {
  transfer.completionDate = new Date(applicationDate.getTime() + 86400000 * randomInt(14, 45));
  transfer.registrationDate = transfer.completionDate;
  const diffTime = Math.abs(transfer.completionDate - applicationDate);
  transfer.processingTime = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}
    
    transfers.push(transfer);
  }
  
  return await Transfer.insertMany(transfers);
};

const generateMortgages = async (parcels, owners, users) => {
  console.log('🏦 Creating mortgage records...');
  const mortgages = [];
  const mortgageCount = Math.min(200, Math.floor(parcels.length * 0.25)); // 25% have mortgages
  
  for (let i = 0; i < mortgageCount; i++) {
    const parcel = randomElement(parcels.filter(p => p.hasMortgage));
    if (!parcel) continue;
    
    const originationDate = randomDate(new Date('2015-01-01'), new Date('2024-01-01'));
    const termYears = randomElement([10, 15, 20, 25, 30]);
    const maturityDate = new Date(originationDate);
    maturityDate.setFullYear(maturityDate.getFullYear() + termYears);
    
    const principalAmount = randomInt(10000, parcel.marketValue * 0.8);
    const monthsPassed = Math.floor((new Date() - originationDate) / (1000 * 60 * 60 * 24 * 30));
    const totalMonths = termYears * 12;
    const monthlyPayment = principalAmount / totalMonths * 1.05; // Simplified calculation
    const outstandingBalance = Math.max(0, principalAmount - (monthlyPayment * monthsPassed * 0.7));
    
    const mortgage = {
      mortgageId: `MTG-${new Date(originationDate).getFullYear()}-${String(i + 1).padStart(6, '0')}`,
      parcel: parcel._id,
      borrower: parcel.currentOwner,
      lender: {
        name: randomElement(BANK_NAMES),
        type: 'bank',
        registrationNumber: `${randomInt(10000000, 99999999)}`,
        contact: {
          email: 'loans@bank.rs',
          phone: `+381${randomInt(10, 69)}${randomInt(100000, 999999)}`
        }
      },
      mortgageType: parcel.landType === 'commercial' ? 'commercial' : 'residential',
      mortgageStatus: outstandingBalance === 0 ? 'paid_off' : (Math.random() > 0.95 ? 'defaulted' : 'active'),
      principalAmount: principalAmount,
      outstandingBalance: outstandingBalance,
      interestRate: randomFloat(2.5, 6.5),
      interestType: randomElement(['fixed', 'variable']),
      term: {
        years: termYears,
        months: totalMonths
      },
      monthlyPayment: monthlyPayment,
      originationDate: originationDate,
      maturityDate: maturityDate,
      registrationDate: originationDate,
      lastPaymentDate: new Date(Date.now() - 86400000 * randomInt(1, 30)),
      nextPaymentDueDate: new Date(Date.now() + 86400000 * randomInt(1, 30)),
      propertyValueAtOrigination: parcel.marketValue * randomFloat(0.8, 1.0),
      currentPropertyValue: parcel.marketValue,
      loanToValueRatio: (principalAmount / parcel.marketValue) * 100,
      mortgageDeedNumber: `MTG-DEED-${randomInt(100000, 999999)}`,
      region: parcel.region,
      priority: 1,
      riskRating: outstandingBalance > principalAmount * 0.9 ? 'high' : 'low',
      createdBy: randomElement(users.filter(u => u.role === 'registrar'))._id,
      isUnderReview: Math.random() > 0.95
    };
    
    mortgages.push(mortgage);
  }
  
  return await Mortgage.insertMany(mortgages);
};

const generateSubsidies = async (parcels, owners, users) => {
  console.log('💶 Creating subsidy records...');
  const subsidies = [];
  const subsidyCount = 250; // Create 250 subsidy applications
  
  const PROGRAMS = [
    'First-Time Homebuyer',
    'Rural Development',
    'Low-Income Housing',
    'Veterans Housing',
    'Young Families',
    'Agricultural Land'
  ];
  
  const currentYear = new Date().getFullYear();
  
  for (let i = 0; i < subsidyCount; i++) {
    const parcel = randomElement(parcels);
    const owner = randomElement(owners.filter(o => o.ownerType === 'individual'));
    const applicationDate = randomDate(new Date(currentYear - 1, 0, 1), new Date());
    const daysSinceApplication = Math.floor((new Date() - applicationDate) / (1000 * 60 * 60 * 24));
    
    const programName = randomElement(PROGRAMS);
    const allocatedAmount = randomInt(5000, 50000);
    const approvedAmount = allocatedAmount * randomFloat(0.7, 1.0);
    
    let status;
    let disbursedAmount = 0;
    
    if (daysSinceApplication < 30) {
      status = 'pending';
    } else if (daysSinceApplication < 60) {
      status = randomElement(['pending', 'approved']);
    } else if (daysSinceApplication < 120) {
      status = randomElement(['approved', 'disbursed']);
      if (status === 'disbursed') {
        disbursedAmount = approvedAmount * randomFloat(0.3, 0.8);
      }
    } else {
      status = randomElement(['disbursed', 'completed', 'completed']);
      if (status === 'completed') {
        disbursedAmount = approvedAmount;
      } else {
        disbursedAmount = approvedAmount * randomFloat(0.5, 0.95);
      }
    }
    
    // 3% fraud rate
    const isLegitimate = Math.random() > 0.03;
    if (!isLegitimate) {
      status = 'cancelled';
    }
    
    const subsidy = {
      subsidyId: `SUB-${currentYear}-${String(i + 1).padStart(6, '0')}`,
      programName: programName,
      programYear: currentYear,
      beneficiary: owner._id,
      parcel: parcel._id,
      allocatedAmount: allocatedAmount,
      approvedAmount: approvedAmount,
      disbursedAmount: disbursedAmount,
      remainingAmount: approvedAmount - disbursedAmount,
      applicationDate: applicationDate,
      status: status,
      region: parcel.region,
      municipality: parcel.municipality,
      isEligible: status !== 'rejected',
      isVerified: status !== 'pending',
      isLegitimate: isLegitimate,
      processingOfficer: randomElement(users.filter(u => u.role === 'registrar'))._id,
      createdBy: randomElement(users.filter(u => u.role === 'registrar'))._id
    };
    
    if (status !== 'pending') {
      subsidy.approvalDate = new Date(applicationDate.getTime() + 86400000 * randomInt(10, 40));
      subsidy.approvedBy = randomElement(users.filter(u => u.role === 'registrar'))._id;
      subsidy.verifiedBy = randomElement(users.filter(u => u.role === 'registrar'))._id;
      subsidy.verificationDate = subsidy.approvalDate;
    }
    
    if (status === 'disbursed' || status === 'completed') {
      subsidy.disbursementDate = new Date(subsidy.approvalDate.getTime() + 86400000 * randomInt(5, 20));
    }
    
    if (status === 'completed') {
      subsidy.completionDate = new Date(subsidy.disbursementDate.getTime() + 86400000 * randomInt(10, 60));
    }
    
    if (!isLegitimate) {
      subsidy.fraudFlags = [{
        flagType: randomElement(['duplicate_application', 'false_documentation', 'income_misrepresentation']),
        flagDate: new Date(),
        description: 'Fraudulent activity detected during verification',
        isResolved: false
      }];
    }
    
    subsidies.push(subsidy);
  }
  
  return await Subsidy.insertMany(subsidies);
};

// Main Seeding Function
const seedDatabase = async () => {
  try {
    console.log('🚀 Starting database seeding...\n');
    
    await connectDB();
    
    // Clear existing data - drop entire database for clean slate
console.log('🗑️  Clearing existing data...');
await mongoose.connection.dropDatabase();
console.log('✅ Existing data cleared\n');
    
    // Generate data
    const users = await generateUsers();
    console.log(`✅ Created ${users.length} users\n`);
    
    const owners = await generateOwners(500);
    console.log(`✅ Created ${owners.length} owners\n`);
    
    const parcels = await generateParcels(owners, users, 1000);
    console.log(`✅ Created ${parcels.length} parcels\n`);
    
    const ownershipHistory = await generateOwnershipHistory(parcels.slice(0, 500), owners, users);
    console.log(`✅ Created ${ownershipHistory.length} ownership history records\n`);
    
    const disputes = await generateDisputes(parcels, owners, users);
    console.log(`✅ Created ${disputes.length} disputes\n`);
    
    const transfers = await generateTransfers(parcels, owners, users);
    console.log(`✅ Created ${transfers.length} transfers\n`);
    
    const mortgages = await generateMortgages(parcels, owners, users);
    console.log(`✅ Created ${mortgages.length} mortgages\n`);
    
    const subsidies = await generateSubsidies(parcels, owners, users);
    console.log(`✅ Created ${subsidies.length} subsidies\n`);
    
    console.log('🎉 Database seeding completed successfully!\n');
    console.log('📊 Summary:');
    console.log(`   - Users: ${users.length}`);
    console.log(`   - Owners: ${owners.length}`);
    console.log(`   - Parcels: ${parcels.length}`);
    console.log(`   - Ownership History: ${ownershipHistory.length}`);
    console.log(`   - Disputes: ${disputes.length}`);
    console.log(`   - Transfers: ${transfers.length}`);
    console.log(`   - Mortgages: ${mortgages.length}`);
    console.log(`   - Subsidies: ${subsidies.length}`);
    console.log('\n👤 Test User Credentials:');
    console.log('   Minister: minister@land.gov.rs / Minister@123');
    console.log('   Registrar: registrar.belgrade@land.gov.rs / Registrar@123');
    console.log('   Judge: judge@land.gov.rs / Judge@123');
    console.log('   Auditor: auditor@land.gov.rs / Auditor@123');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
};

// Run the seeding
seedDatabase();


// import mongoose from 'mongoose';
// import dotenv from 'dotenv';
// import connectDB from '../config/database.js';
// import {
//   Parcel,
//   Owner,
//   OwnershipHistory,
//   Transfer,
//   Dispute,
//   Mortgage,
//   User,
//   AuditLog,
//   Subsidy
// } from '../models/index.js';

// dotenv.config();

// // Serbian Names (Common first and last names)
// const SERBIAN_FIRST_NAMES_MALE = [
//   'Marko', 'Stefan', 'Nikola', 'Luka', 'Aleksandar', 'Miloš', 'Jovan', 'Petar',
//   'Đorđe', 'Filip', 'Nemanja', 'Vladimir', 'Milan', 'Dušan', 'Bojan', 'Igor',
//   'Dejan', 'Zoran', 'Dragan', 'Goran'
// ];

// const SERBIAN_FIRST_NAMES_FEMALE = [
//   'Milica', 'Jelena', 'Ana', 'Marija', 'Jovana', 'Teodora', 'Katarina', 'Sara',
//   'Anastasija', 'Sofija', 'Dragana', 'Snežana', 'Maja', 'Ivana', 'Tamara',
//   'Nataša', 'Vesna', 'Jasmina', 'Gordana', 'Biljana'
// ];

// const SERBIAN_LAST_NAMES = [
//   'Petrović', 'Nikolić', 'Jovanović', 'Đorđević', 'Ilić', 'Marković', 'Pavlović',
//   'Stojanović', 'Simić', 'Popović', 'Stanković', 'Milošević', 'Kostić', 'Stefanović',
//   'Mladenović', 'Živković', 'Tomić', 'Dimitrijević', 'Vasiljević', 'Lazić',
//   'Todorović', 'Radovanović', 'Milenković', 'Antić', 'Ristić'
// ];

// const SERBIAN_CITIES = {
//   'Belgrade':        ['Stari Grad', 'Vračar', 'Savski Venac', 'Palilula', 'Novi Beograd', 'Zemun', 'Čukarica', 'Rakovica', 'Zvezdara', 'Voždovac', 'Surčin', 'Barajevo', 'Grocka', 'Lazarevac', 'Mladenovac', 'Obrenovac', 'Sopot'],
//   'Južna Bačka':     ['Novi Sad', 'Bačka Palanka', 'Bačka Petrovac', 'Beočin', 'Bečej', 'Srbobran', 'Temerin', 'Titel', 'Vrbas', 'Žabalj'],
//   'Severna Bačka':   ['Subotica', 'Bačka Topola', 'Mali Iđoš'],
//   'Zapadna Bačka':   ['Sombor', 'Apatin', 'Kula', 'Odžaci'],
//   'Srednji Banat':   ['Zrenjanin', 'Novi Bečej', 'Nova Crnja', 'Žitište', 'Sečanj'],
//   'Severni Banat':   ['Kikinda', 'Ada', 'Čoka', 'Kanjiža', 'Novi Kneževac', 'Senta'],
//   'Južni Banat':     ['Pančevo', 'Alibunar', 'Bela Crkva', 'Kovačica', 'Kovin', 'Opovo', 'Plandište', 'Vršac'],
//   'Srem':            ['Sremska Mitrovica', 'Inđija', 'Irig', 'Pećinci', 'Ruma', 'Šid', 'Stara Pazova'],
//   'Mačva':           ['Šabac', 'Bogatić', 'Koceljeva', 'Krupanj', 'Loznica', 'Ljubovija', 'Mali Zvornik', 'Vladimirci'],
//   'Kolubara':        ['Valjevo', 'Lajkovac', 'Ljig', 'Mionica', 'Osečina', 'Ub'],
//   'Podunavlje':      ['Smederevo', 'Smederevska Palanka', 'Velika Plana'],
//   'Braničevo':       ['Požarevac', 'Petrovac na Mlavi', 'Veliko Gradište', 'Golubac', 'Kučevo', 'Malo Crniće', 'Žabari'],
//   'Šumadija':        ['Kragujevac', 'Aranđelovac', 'Batočina', 'Knić', 'Lapovo', 'Rača', 'Topola'],
//   'Pomoravlje':      ['Jagodina', 'Ćuprija', 'Despotovac', 'Paraćin', 'Rekovac', 'Svilajnac'],
//   'Bor':             ['Bor', 'Kladovo', 'Majdanpek', 'Negotin'],
//   'Zaječar':         ['Zaječar', 'Boljevac', 'Knjazevac', 'Sokobanja'],
//   'Zlatibor':        ['Užice', 'Arilje', 'Bajina Bašta', 'Čajetina', 'Kosjerić', 'Nova Varoš', 'Požega', 'Priboj', 'Prijepolje', 'Sjenica'],
//   'Moravica':        ['Čačak', 'Gornji Milanovac', 'Ivanjica', 'Lučani'],
//   'Raška':           ['Kraljevo', 'Novi Pazar', 'Raška', 'Tutin', 'Vrnjačka Banja'],
//   'Rasina':          ['Kruševac', 'Aleksandrovac', 'Brus', 'Ćićevac', 'Trstenik', 'Varvarin'],
//   'Nišava':          ['Niš', 'Aleksinac', 'Doljevac', 'Gadžin Han', 'Merošina', 'Ražanj', 'Svrljig'],
//   'Toplica':         ['Prokuplje', 'Blace', 'Kuršumlija', 'Žitorađa'],
//   'Pirot':           ['Pirot', 'Babušnica', 'Bela Palanka', 'Dimitrovgrad'],
//   'Jablanica':       ['Leskovac', 'Bojnik', 'Crna Trava', 'Lebane', 'Medveđa', 'Vlasotince'],
//   'Pčinja':          ['Vranje', 'Bosilegrad', 'Bujanovac', 'Preševo', 'Surdulica', 'Trgovište', 'Vladičin Han']
// };

// const REGIONS = Object.keys(SERBIAN_CITIES);

// const STREET_NAMES = [
//   'Knez Mihailova', 'Kralja Milana', 'Kralja Petra', 'Terazije', 'Bulevar Kralja Aleksandra',
//   'Nemanjina', 'Makedonska', 'Svetozara Markovića', 'Takovska', 'Resavska',
//   'Bulevar oslobođenja', 'Cara Lazara', 'Vojvode Stepe', 'Njegoševa', 'Džordža Vašingtona'
// ];

// const COMPANY_NAMES = [
//   'Energoprojekt', 'Metalac', 'Železara Smederevo', 'Milan Blagojević', 'FAP Trucks',
//   'Dunav Osiguranje', 'Delta Holding', 'MK Group', 'Telekom Srbija', 'Aerodrom Nikola Tesla',
//   'Železnice Srbije', 'Elektroprivreda Srbije', 'Messer Tehnogas', 'Carnex', 'Imlek'
// ];

// const BANK_NAMES = [
//   'Raiffeisen Bank', 'Komercijalna Banka', 'UniCredit Bank', 'Intesa Sanpaolo',
//   'Banca Intesa', 'Erste Bank', 'OTP Banka', 'ProCredit Bank', 'AIK Banka'
// ];

// // Utility Functions
// const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
// const randomFloat = (min, max) => Math.random() * (max - min) + min;
// const randomElement = (arr) => arr[randomInt(0, arr.length - 1)];
// const randomDate = (start, end) => new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));

// const generateNationalId = () => {
//   return `${randomInt(0, 3)}${randomInt(100000000, 999999999)}`;
// };

// const generateParcelId = (region) => {
//   const regionCode = region.substring(0, 2).toUpperCase();
//   return `RS-${regionCode}-${String(randomInt(1, 999999)).padStart(6, '0')}`;
// };

// const generateCoordinates = (region) => {
//   // Approximate coordinates for Serbian regions
//   const coords = {
//     'Belgrade':      { lat: [44.75, 44.88], lng: [20.35, 20.58] },
//     'Južna Bačka':   { lat: [45.20, 45.35], lng: [19.65, 20.10] },
//     'Severna Bačka': { lat: [45.85, 46.10], lng: [19.50, 19.90] },
//     'Zapadna Bačka': { lat: [45.60, 45.80], lng: [18.90, 19.30] },
//     'Srednji Banat': { lat: [45.35, 45.55], lng: [20.20, 20.60] },
//     'Severni Banat': { lat: [45.70, 45.95], lng: [20.20, 20.60] },
//     'Južni Banat':   { lat: [44.80, 45.20], lng: [20.55, 21.30] },
//     'Srem':          { lat: [44.90, 45.15], lng: [19.40, 20.10] },
//     'Mačva':         { lat: [44.45, 44.80], lng: [19.20, 19.80] },
//     'Kolubara':      { lat: [44.15, 44.40], lng: [19.70, 20.10] },
//     'Podunavlje':    { lat: [44.55, 44.75], lng: [20.80, 21.15] },
//     'Braničevo':     { lat: [44.40, 44.70], lng: [21.10, 21.70] },
//     'Šumadija':      { lat: [43.95, 44.20], lng: [20.70, 21.10] },
//     'Pomoravlje':    { lat: [43.85, 44.15], lng: [21.10, 21.60] },
//     'Bor':           { lat: [43.90, 44.30], lng: [21.80, 22.40] },
//     'Zaječar':       { lat: [43.65, 44.05], lng: [21.80, 22.50] },
//     'Zlatibor':      { lat: [43.50, 43.90], lng: [19.35, 20.10] },
//     'Moravica':      { lat: [43.70, 44.00], lng: [20.10, 20.60] },
//     'Raška':         { lat: [43.40, 43.80], lng: [20.40, 21.00] },
//     'Rasina':        { lat: [43.50, 43.80], lng: [21.10, 21.60] },
//     'Nišava':        { lat: [43.25, 43.55], lng: [21.75, 22.25] },
//     'Toplica':       { lat: [43.10, 43.40], lng: [21.40, 21.80] },
//     'Pirot':         { lat: [43.05, 43.35], lng: [22.20, 22.90] },
//     'Jablanica':     { lat: [42.90, 43.20], lng: [21.75, 22.20] },
//     'Pčinja':        { lat: [42.40, 42.80], lng: [21.70, 22.50] }
//   };
  
//   const regionCoords = coords[region] || coords['Belgrade'];
//   return {
//     latitude: randomFloat(regionCoords.lat[0], regionCoords.lat[1]),
//     longitude: randomFloat(regionCoords.lng[0], regionCoords.lng[1])
//   };
// };

// // Data Generation Functions
// const generateOwners = async (count) => {
//   console.log(`📝 Creating ${count} owners...`);
//   const owners = [];
  
//   for (let i = 0; i < count; i++) {
//     const ownerType = Math.random() > 0.8 ? 'corporation' : 'individual';
//     const region = randomElement(REGIONS);
//     const cities = SERBIAN_CITIES[region];
    
//     let owner;
    
//     if (ownerType === 'individual') {
//       const isMale = Math.random() > 0.5;
//       owner = {
//         ownerType: 'individual',
//         personalInfo: {
//           firstName: isMale ? randomElement(SERBIAN_FIRST_NAMES_MALE) : randomElement(SERBIAN_FIRST_NAMES_FEMALE),
//           lastName: randomElement(SERBIAN_LAST_NAMES),
//           dateOfBirth: randomDate(new Date('1950-01-01'), new Date('2000-12-31')),
//           nationalId: generateNationalId(),
//           taxId: `${randomInt(100000000, 999999999)}`
//         },
//         contact: {
//           email: `owner${i}@example.rs`,
//           phone: `+381${randomInt(10, 69)}${randomInt(100000, 999999)}`,
//           mobile: `+38160${randomInt(100000, 999999)}`
//         },
//         address: {
//           street: randomElement(STREET_NAMES),
//           number: `${randomInt(1, 200)}`,
//           city: randomElement(cities),
//           postalCode: `${randomInt(11000, 38000)}`,
//           country: 'Serbia'
//         },
//         citizenship: 'Serbian',
//         residencyStatus: 'resident',
//         creditScore: randomInt(400, 800),
//         isVerified: Math.random() > 0.1,
//         registrationDate: randomDate(new Date('2010-01-01'), new Date())
//       };
//     } else {
//       owner = {
//         ownerType: 'corporation',
//         corporateInfo: {
//           companyName: randomElement(COMPANY_NAMES),
//           registrationNumber: `${randomInt(10000000, 99999999)}`,
//           taxId: `${randomInt(100000000, 999999999)}`,
//           legalForm: randomElement(['LLC', 'JSC', 'Partnership']),
//           incorporationDate: randomDate(new Date('1990-01-01'), new Date('2020-12-31'))
//         },
//         contact: {
//           email: `company${i}@example.rs`,
//           phone: `+381${randomInt(10, 69)}${randomInt(100000, 999999)}`
//         },
//         address: {
//           street: randomElement(STREET_NAMES),
//           number: `${randomInt(1, 200)}`,
//           city: randomElement(cities),
//           postalCode: `${randomInt(11000, 38000)}`,
//           country: 'Serbia'
//         },
//         isVerified: Math.random() > 0.05,
//         registrationDate: randomDate(new Date('2005-01-01'), new Date())
//       };
//     }
    
//     owners.push(owner);
//   }
  
//   return await Owner.insertMany(owners);
// };

// const generateUsers = async () => {
//   console.log('👥 Creating system users...');
  
//   const users = [
//     {
//       userId: 'USR-2024-000001',
//       firstName: 'Marko',
//       lastName: 'Petrović',
//       email: 'minister@land.gov.rs',
//       password: 'Minister@123',
//       role: 'minister',
//       permissions: ['view_all_regions', 'generate_reports'],
//       department: 'management',
//       position: 'Minister of Land Affairs',
//       hireDate: new Date('2020-01-01'),
//       assignedRegions: REGIONS,
//       isActive: true,
//       isVerified: true
//     },
//     {
//       userId: 'USR-2024-000002',
//       firstName: 'Ana',
//       lastName: 'Jovanović',
//       email: 'registrar.belgrade@land.gov.rs',
//       password: 'Registrar@123',
//       role: 'registrar',
//       permissions: ['create_parcel', 'edit_parcel', 'approve_transfer'],
//       department: 'land_registry',
//       position: 'Senior Registrar',
//       hireDate: new Date('2018-06-15'),
//       assignedRegions: ['Belgrade', 'Kolubara'],
//       isActive: true,
//       isVerified: true
//     },
//     {
//       userId: 'USR-2024-000003',
//       firstName: 'Milan',
//       lastName: 'Đorđević',
//       email: 'judge@land.gov.rs',
//       password: 'Judge@123',
//       role: 'judge',
//       permissions: ['resolve_dispute', 'view_audit_logs'],
//       department: 'judiciary',
//       position: 'Land Court Judge',
//       hireDate: new Date('2015-03-20'),
//       barNumber: 'JDG-12345',
//       assignedRegions: REGIONS,
//       isActive: true,
//       isVerified: true
//     },
//     {
//       userId: 'USR-2024-000004',
//       firstName: 'Jelena',
//       lastName: 'Nikolić',
//       email: 'auditor@land.gov.rs',
//       password: 'Auditor@123',
//       role: 'auditor',
//       permissions: ['view_audit_logs', 'blockchain_access'],
//       department: 'audit',
//       position: 'Chief Auditor',
//       hireDate: new Date('2019-09-10'),
//       assignedRegions: REGIONS,
//       isActive: true,
//       isVerified: true
//     }
//   ];
  
//   // Add more registrars for each region
//   REGIONS.forEach((region, idx) => {
//     users.push({
//       userId: `USR-2024-${String(idx + 10).padStart(6, '0')}`,
//       firstName: randomElement([...SERBIAN_FIRST_NAMES_MALE, ...SERBIAN_FIRST_NAMES_FEMALE]),
//       lastName: randomElement(SERBIAN_LAST_NAMES),
//       email: `registrar.${region.toLowerCase().replace(/\s/g, '')}@land.gov.rs`,
//       password: 'Registrar@123',
//       role: 'registrar',
//       permissions: ['create_parcel', 'edit_parcel', 'approve_transfer'],
//       department: 'land_registry',
//       position: 'Regional Registrar',
//       hireDate: randomDate(new Date('2015-01-01'), new Date('2023-12-31')),
//       assignedRegions: [region],
//       primaryOffice: region,
//       isActive: true,
//       isVerified: true
//     });
//   });
  
//   return await User.insertMany(users);
// };

// const generateParcels = async (owners, users, count) => {
//   console.log(`🏠 Creating ${count} land parcels...`);
//   const parcels = [];
  
//   for (let i = 0; i < count; i++) {
//     const region = randomElement(REGIONS);
//     const cities = SERBIAN_CITIES[region];
//     const city = randomElement(cities);
//     const owner = randomElement(owners);
//     const coords = generateCoordinates(region);
    
//     const parcel = {
//       parcelId: generateParcelId(region),
//       region,
//       district: region,
//       municipality: city,
//       cadastralMunicipality: city,
//       address: {
//         street: randomElement(STREET_NAMES),
//         number: `${randomInt(1, 300)}`,
//         postalCode: `${randomInt(11000, 38000)}`,
//         city
//       },
//       coordinates: coords,
//       area: randomInt(200, 50000), // square meters
//       landType: randomElement(['agricultural', 'residential', 'commercial', 'industrial', 'mixed']),
//       landUse: randomElement(['building', 'farming', 'vacant', 'developed']),
//       currentOwner: owner._id,
//       ownershipType: owner.ownerType === 'corporation' ? 'private' : randomElement(['private', 'shared']),
//       legalStatus: randomElement(['verified', 'verified', 'verified', 'verified', 'clean', 'disputed', 'pending']),
//       marketValue: randomInt(20000, 500000), // EUR
//       taxValue: randomInt(15000, 400000), // EUR
//       lastValuationDate: randomDate(new Date('2022-01-01'), new Date()),
//       hasMortgage: Math.random() > 0.6,
//       hasLien: Math.random() > 0.9,
//       hasEasement: Math.random() > 0.85,
//       blockchainHash: `0x${Math.random().toString(16).substr(2, 64)}`,
//       lastVerifiedDate: randomDate(new Date('2023-01-01'), new Date()),
//       verifiedBy: randomElement(users.filter(u => u.role === 'registrar'))._id,
//       isActive: true,
//       isFraudulent: false,
//       registrationDate: randomDate(new Date('2000-01-01'), new Date())
//     };
    
//     parcels.push(parcel);
//   }
  
//   return await Parcel.insertMany(parcels);
// };

// const generateOwnershipHistory = async (parcels, owners, users) => {
//   console.log('📜 Creating ownership history records...');
//   const histories = [];
  
//   for (const parcel of parcels) {
//     // Generate 1-5 historical ownership records per parcel
//     const historyCount = randomInt(1, 5);
//     let currentDate = new Date(parcel.registrationDate);
//     let previousOwner = null;
    
//     for (let i = 0; i < historyCount; i++) {
//       const newOwner = i === historyCount - 1 ? parcel.currentOwner : randomElement(owners)._id;
//       const transactionDate = new Date(currentDate);
//       transactionDate.setMonth(currentDate.getMonth() + randomInt(6, 60));
      
//       if (transactionDate > new Date()) break;
      
//       const history = {
//         parcel: parcel._id,
//         transactionType: randomElement(['purchase', 'purchase', 'sale', 'inheritance', 'gift']),
//         previousOwner: previousOwner,
//         newOwner: newOwner,
//         transactionDate: transactionDate,
//         registrationDate: new Date(transactionDate.getTime() + 86400000 * randomInt(1, 14)),
//         transactionValue: randomInt(10000, parcel.marketValue),
//         taxPaid: randomInt(500, 10000),
//         legalBasis: `Purchase Contract #${randomInt(10000, 99999)}`,
//         contractNumber: `CTR-${new Date(transactionDate).getFullYear()}-${randomInt(10000, 99999)}`,
//         notaryId: `NOT-${randomInt(1000, 9999)}`,
//         status: 'approved',
//         approvedBy: randomElement(users.filter(u => u.role === 'registrar'))._id,
//         approvalDate: new Date(transactionDate.getTime() + 86400000 * randomInt(1, 7)),
//         blockchainHash: `0x${Math.random().toString(16).substr(2, 64)}`,
//         blockchainTimestamp: transactionDate,
//         createdBy: randomElement(users.filter(u => u.role === 'registrar'))._id,
//         verifiedBy: randomElement(users.filter(u => u.role === 'registrar'))._id,
//         verificationDate: new Date(transactionDate.getTime() + 86400000 * randomInt(1, 5)),
//         isActive: true
//       };
      
//       histories.push(history);
//       previousOwner = newOwner;
//       currentDate = transactionDate;
//     }
//   }
  
//   return await OwnershipHistory.insertMany(histories);
// };

// const generateDisputes = async (parcels, owners, users) => {
//   console.log('⚖️  Creating dispute records...');
//   const disputes = [];
//   const disputeCount = Math.min(150, Math.floor(parcels.length * 0.15)); // 15% of parcels have disputes
  
//   for (let i = 0; i < disputeCount; i++) {
//     const parcel = randomElement(parcels);
//     const filingDate = randomDate(new Date('2020-01-01'), new Date());
//     const daysSinceFiling = Math.floor((new Date() - filingDate) / (1000 * 60 * 60 * 24));
    
//     let status;
//     if (daysSinceFiling < 30) status = 'Open';
//     else if (daysSinceFiling < 90) status = randomElement(['Open', 'Investigation']);
//     else if (daysSinceFiling < 180) status = randomElement(['Investigation', 'Court']);
//     else status = randomElement(['Court', 'Court', 'Resolved']);
    
//     const dispute = {
//       disputeId: `DSP-${new Date(filingDate).getFullYear()}-${String(i + 1).padStart(6, '0')}`,
//       parcel: parcel._id,
//       claimant: randomElement(owners)._id,
//       defendant: parcel.currentOwner,
//       disputeType: randomElement([
//         'ownership_claim', 'boundary_dispute', 'inheritance_dispute',
//         'fraud_allegation', 'contract_breach'
//       ]),
//       description: 'Dispute regarding property ownership and boundaries.',
//       claimedAmount: randomInt(5000, 200000),
//       status: status,
//       priority: randomElement(['low', 'low', 'medium', 'medium', 'high']),
//       filingDate: filingDate,
//       region: parcel.region,
//       investigationStartDate: status !== 'Open' ? new Date(filingDate.getTime() + 86400000 * randomInt(5, 20)) : null,
//       courtFilingDate: ['Court', 'Resolved'].includes(status) ? new Date(filingDate.getTime() + 86400000 * randomInt(60, 150)) : null,
//       resolutionDate: status === 'Resolved' ? new Date(filingDate.getTime() + 86400000 * randomInt(180, 400)) : null,
//       estimatedCost: randomInt(2000, 50000),
//       actualCost: status === 'Resolved' ? randomInt(2000, 50000) : 0,
//       assignedTo: randomElement(users.filter(u => u.role === 'registrar' || u.role === 'judge'))._id,
//       createdBy: randomElement(users.filter(u => u.role === 'registrar'))._id,
//       isUrgent: Math.random() > 0.9
//     };
    
//     if (status === 'Resolved') {
//       dispute.resolution = {
//         outcome: randomElement(['claimant_favor', 'defendant_favor', 'settlement', 'dismissed']),
//         description: 'Dispute resolved through court decision.',
//         compensationAmount: randomInt(0, 50000)
//       };
//     }
    
//     disputes.push(dispute);
//   }
  
//   return await Dispute.insertMany(disputes);
// };

// const generateTransfers = async (parcels, owners, users) => {
//   console.log('📋 Creating transfer records...');
//   const transfers = [];
//   const transferCount = Math.min(300, Math.floor(parcels.length * 0.3)); // 30% have recent transfers
  
//   for (let i = 0; i < transferCount; i++) {
//     const parcel = randomElement(parcels);
//     const applicationDate = randomDate(new Date('2023-01-01'), new Date());
//     const daysSinceApplication = Math.floor((new Date() - applicationDate) / (1000 * 60 * 60 * 24));
    
//     let transferStatus;
//     let processingStage;
    
//     if (daysSinceApplication < 7) {
//       transferStatus = 'initiated';
//       processingStage = 'document_submission';
//     } else if (daysSinceApplication < 14) {
//       transferStatus = 'pending_approval';
//       processingStage = randomElement(['document_verification', 'legal_review']);
//     } else if (daysSinceApplication < 30) {
//       transferStatus = randomElement(['pending_approval', 'approved']);
//       processingStage = randomElement(['tax_assessment', 'approval_pending', 'registration']);
//     } else {
//       transferStatus = randomElement(['approved', 'completed', 'completed']);
//       processingStage = transferStatus === 'completed' ? 'completed' : 'registration';
//     }
    
//     const agreedPrice = randomInt(20000, parcel.marketValue * 1.2);
    
//     const transfer = {
//       transferId: `TRF-${new Date(applicationDate).getFullYear()}-${String(i + 1).padStart(6, '0')}`,
//       parcel: parcel._id,
//       seller: parcel.currentOwner,
//       buyer: randomElement(owners)._id,
//       transferType: randomElement(['sale', 'sale', 'sale', 'gift', 'inheritance']),
//       transferStatus: transferStatus,
//       agreedPrice: agreedPrice,
//       registeredPrice: agreedPrice,
//       marketValue: parcel.marketValue,
//       transferTax: {
//         rate: 2.5,
//         amount: agreedPrice * 0.025
//       },
//       registrationFee: randomInt(100, 500),
//       notaryFee: randomInt(200, 1000),
//       paymentStatus: transferStatus === 'completed' ? 'paid' : randomElement(['unpaid', 'partial', 'paid']),
//       contractDate: new Date(applicationDate.getTime() - 86400000 * randomInt(5, 30)),
//       contractNumber: `CTR-${new Date(applicationDate).getFullYear()}-${randomInt(10000, 99999)}`,
//       applicationDate: applicationDate,
//       processingStage: processingStage,
//       region: parcel.region,
//       registryOffice: `${parcel.region} Registry Office`,
//       blockchainHash: transferStatus === 'completed' ? `0x${Math.random().toString(16).substr(2, 64)}` : null,
//       assignedOfficer: randomElement(users.filter(u => u.role === 'registrar'))._id,
//       createdBy: randomElement(users.filter(u => u.role === 'registrar'))._id,
//       isPriority: Math.random() > 0.9
//     };
    
//     if (transferStatus === 'approved' || transferStatus === 'completed') {
//       transfer.approvedBy = randomElement(users.filter(u => u.role === 'registrar'))._id;
//       transfer.approvalDate = new Date(applicationDate.getTime() + 86400000 * randomInt(7, 20));
//     }
    
//   if (transferStatus === 'completed') {
//   transfer.completionDate = new Date(applicationDate.getTime() + 86400000 * randomInt(14, 45));
//   transfer.registrationDate = transfer.completionDate;
//   const diffTime = Math.abs(transfer.completionDate - applicationDate);
//   transfer.processingTime = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
// }
    
//     transfers.push(transfer);
//   }
  
//   return await Transfer.insertMany(transfers);
// };

// const generateMortgages = async (parcels, owners, users) => {
//   console.log('🏦 Creating mortgage records...');
//   const mortgages = [];
//   const mortgageCount = Math.min(200, Math.floor(parcels.length * 0.25)); // 25% have mortgages
  
//   for (let i = 0; i < mortgageCount; i++) {
//     const parcel = randomElement(parcels.filter(p => p.hasMortgage));
//     if (!parcel) continue;
    
//     const originationDate = randomDate(new Date('2015-01-01'), new Date('2024-01-01'));
//     const termYears = randomElement([10, 15, 20, 25, 30]);
//     const maturityDate = new Date(originationDate);
//     maturityDate.setFullYear(maturityDate.getFullYear() + termYears);
    
//     const principalAmount = randomInt(10000, parcel.marketValue * 0.8);
//     const monthsPassed = Math.floor((new Date() - originationDate) / (1000 * 60 * 60 * 24 * 30));
//     const totalMonths = termYears * 12;
//     const monthlyPayment = principalAmount / totalMonths * 1.05; // Simplified calculation
//     const outstandingBalance = Math.max(0, principalAmount - (monthlyPayment * monthsPassed * 0.7));
    
//     const mortgage = {
//       mortgageId: `MTG-${new Date(originationDate).getFullYear()}-${String(i + 1).padStart(6, '0')}`,
//       parcel: parcel._id,
//       borrower: parcel.currentOwner,
//       lender: {
//         name: randomElement(BANK_NAMES),
//         type: 'bank',
//         registrationNumber: `${randomInt(10000000, 99999999)}`,
//         contact: {
//           email: 'loans@bank.rs',
//           phone: `+381${randomInt(10, 69)}${randomInt(100000, 999999)}`
//         }
//       },
//       mortgageType: parcel.landType === 'commercial' ? 'commercial' : 'residential',
//       mortgageStatus: outstandingBalance === 0 ? 'paid_off' : (Math.random() > 0.95 ? 'defaulted' : 'active'),
//       principalAmount: principalAmount,
//       outstandingBalance: outstandingBalance,
//       interestRate: randomFloat(2.5, 6.5),
//       interestType: randomElement(['fixed', 'variable']),
//       term: {
//         years: termYears,
//         months: totalMonths
//       },
//       monthlyPayment: monthlyPayment,
//       originationDate: originationDate,
//       maturityDate: maturityDate,
//       registrationDate: originationDate,
//       lastPaymentDate: new Date(Date.now() - 86400000 * randomInt(1, 30)),
//       nextPaymentDueDate: new Date(Date.now() + 86400000 * randomInt(1, 30)),
//       propertyValueAtOrigination: parcel.marketValue * randomFloat(0.8, 1.0),
//       currentPropertyValue: parcel.marketValue,
//       loanToValueRatio: (principalAmount / parcel.marketValue) * 100,
//       mortgageDeedNumber: `MTG-DEED-${randomInt(100000, 999999)}`,
//       region: parcel.region,
//       priority: 1,
//       riskRating: outstandingBalance > principalAmount * 0.9 ? 'high' : 'low',
//       createdBy: randomElement(users.filter(u => u.role === 'registrar'))._id,
//       isUnderReview: Math.random() > 0.95
//     };
    
//     mortgages.push(mortgage);
//   }
  
//   return await Mortgage.insertMany(mortgages);
// };

// const generateSubsidies = async (parcels, owners, users) => {
//   console.log('💶 Creating subsidy records...');
//   const subsidies = [];
//   const subsidyCount = 250; // Create 250 subsidy applications
  
//   const PROGRAMS = [
//     'First-Time Homebuyer',
//     'Rural Development',
//     'Low-Income Housing',
//     'Veterans Housing',
//     'Young Families',
//     'Agricultural Land'
//   ];
  
//   const currentYear = new Date().getFullYear();
  
//   for (let i = 0; i < subsidyCount; i++) {
//     const parcel = randomElement(parcels);
//     const owner = randomElement(owners.filter(o => o.ownerType === 'individual'));
//     const applicationDate = randomDate(new Date(currentYear - 1, 0, 1), new Date());
//     const daysSinceApplication = Math.floor((new Date() - applicationDate) / (1000 * 60 * 60 * 24));
    
//     const programName = randomElement(PROGRAMS);
//     const allocatedAmount = randomInt(5000, 50000);
//     const approvedAmount = allocatedAmount * randomFloat(0.7, 1.0);
    
//     let status;
//     let disbursedAmount = 0;
    
//     if (daysSinceApplication < 30) {
//       status = 'pending';
//     } else if (daysSinceApplication < 60) {
//       status = randomElement(['pending', 'approved']);
//     } else if (daysSinceApplication < 120) {
//       status = randomElement(['approved', 'disbursed']);
//       if (status === 'disbursed') {
//         disbursedAmount = approvedAmount * randomFloat(0.3, 0.8);
//       }
//     } else {
//       status = randomElement(['disbursed', 'completed', 'completed']);
//       if (status === 'completed') {
//         disbursedAmount = approvedAmount;
//       } else {
//         disbursedAmount = approvedAmount * randomFloat(0.5, 0.95);
//       }
//     }
    
//     // 3% fraud rate
//     const isLegitimate = Math.random() > 0.03;
//     if (!isLegitimate) {
//       status = 'cancelled';
//     }
    
//     const subsidy = {
//       subsidyId: `SUB-${currentYear}-${String(i + 1).padStart(6, '0')}`,
//       programName: programName,
//       programYear: currentYear,
//       beneficiary: owner._id,
//       parcel: parcel._id,
//       allocatedAmount: allocatedAmount,
//       approvedAmount: approvedAmount,
//       disbursedAmount: disbursedAmount,
//       remainingAmount: approvedAmount - disbursedAmount,
//       applicationDate: applicationDate,
//       status: status,
//       region: parcel.region,
//       municipality: parcel.municipality,
//       isEligible: status !== 'rejected',
//       isVerified: status !== 'pending',
//       isLegitimate: isLegitimate,
//       processingOfficer: randomElement(users.filter(u => u.role === 'registrar'))._id,
//       createdBy: randomElement(users.filter(u => u.role === 'registrar'))._id
//     };
    
//     if (status !== 'pending') {
//       subsidy.approvalDate = new Date(applicationDate.getTime() + 86400000 * randomInt(10, 40));
//       subsidy.approvedBy = randomElement(users.filter(u => u.role === 'registrar'))._id;
//       subsidy.verifiedBy = randomElement(users.filter(u => u.role === 'registrar'))._id;
//       subsidy.verificationDate = subsidy.approvalDate;
//     }
    
//     if (status === 'disbursed' || status === 'completed') {
//       subsidy.disbursementDate = new Date(subsidy.approvalDate.getTime() + 86400000 * randomInt(5, 20));
//     }
    
//     if (status === 'completed') {
//       subsidy.completionDate = new Date(subsidy.disbursementDate.getTime() + 86400000 * randomInt(10, 60));
//     }
    
//     if (!isLegitimate) {
//       subsidy.fraudFlags = [{
//         flagType: randomElement(['duplicate_application', 'false_documentation', 'income_misrepresentation']),
//         flagDate: new Date(),
//         description: 'Fraudulent activity detected during verification',
//         isResolved: false
//       }];
//     }
    
//     subsidies.push(subsidy);
//   }
  
//   return await Subsidy.insertMany(subsidies);
// };

// // Main Seeding Function
// const seedDatabase = async () => {
//   try {
//     console.log('🚀 Starting database seeding...\n');
    
//     await connectDB();
    
//     // Clear existing data - drop entire database for clean slate
// console.log('🗑️  Clearing existing data...');
// await mongoose.connection.dropDatabase();
// console.log('✅ Existing data cleared\n');
    
//     // Generate data
//     const users = await generateUsers();
//     console.log(`✅ Created ${users.length} users\n`);
    
//     const owners = await generateOwners(500);
//     console.log(`✅ Created ${owners.length} owners\n`);
    
//     const parcels = await generateParcels(owners, users, 1000);
//     console.log(`✅ Created ${parcels.length} parcels\n`);
    
//     const ownershipHistory = await generateOwnershipHistory(parcels.slice(0, 500), owners, users);
//     console.log(`✅ Created ${ownershipHistory.length} ownership history records\n`);
    
//     const disputes = await generateDisputes(parcels, owners, users);
//     console.log(`✅ Created ${disputes.length} disputes\n`);
    
//     const transfers = await generateTransfers(parcels, owners, users);
//     console.log(`✅ Created ${transfers.length} transfers\n`);
    
//     const mortgages = await generateMortgages(parcels, owners, users);
//     console.log(`✅ Created ${mortgages.length} mortgages\n`);
    
//     const subsidies = await generateSubsidies(parcels, owners, users);
//     console.log(`✅ Created ${subsidies.length} subsidies\n`);
    
//     console.log('🎉 Database seeding completed successfully!\n');
//     console.log('📊 Summary:');
//     console.log(`   - Users: ${users.length}`);
//     console.log(`   - Owners: ${owners.length}`);
//     console.log(`   - Parcels: ${parcels.length}`);
//     console.log(`   - Ownership History: ${ownershipHistory.length}`);
//     console.log(`   - Disputes: ${disputes.length}`);
//     console.log(`   - Transfers: ${transfers.length}`);
//     console.log(`   - Mortgages: ${mortgages.length}`);
//     console.log(`   - Subsidies: ${subsidies.length}`);
//     console.log('\n👤 Test User Credentials:');
//     console.log('   Minister: minister@land.gov.rs / Minister@123');
//     console.log('   Registrar: registrar.belgrade@land.gov.rs / Registrar@123');
//     console.log('   Judge: judge@land.gov.rs / Judge@123');
//     console.log('   Auditor: auditor@land.gov.rs / Auditor@123');
    
//     process.exit(0);
//   } catch (error) {
//     console.error('❌ Error seeding database:', error);
//     process.exit(1);
//   }
// };

// // Run the seeding
// seedDatabase();

// import mongoose from 'mongoose';
// import dotenv from 'dotenv';
// import connectDB from '../config/database.js';
// import {
//   Parcel,
//   Owner,
//   OwnershipHistory,
//   Transfer,
//   Dispute,
//   Mortgage,
//   User,
//   AuditLog,
//   Subsidy
// } from '../models/index.js';

// dotenv.config();

// // Serbian Names (Common first and last names)
// const SERBIAN_FIRST_NAMES_MALE = [
//   'Marko', 'Stefan', 'Nikola', 'Luka', 'Aleksandar', 'Miloš', 'Jovan', 'Petar',
//   'Đorđe', 'Filip', 'Nemanja', 'Vladimir', 'Milan', 'Dušan', 'Bojan', 'Igor',
//   'Dejan', 'Zoran', 'Dragan', 'Goran'
// ];

// const SERBIAN_FIRST_NAMES_FEMALE = [
//   'Milica', 'Jelena', 'Ana', 'Marija', 'Jovana', 'Teodora', 'Katarina', 'Sara',
//   'Anastasija', 'Sofija', 'Dragana', 'Snežana', 'Maja', 'Ivana', 'Tamara',
//   'Nataša', 'Vesna', 'Jasmina', 'Gordana', 'Biljana'
// ];

// const SERBIAN_LAST_NAMES = [
//   'Petrović', 'Nikolić', 'Jovanović', 'Đorđević', 'Ilić', 'Marković', 'Pavlović',
//   'Stojanović', 'Simić', 'Popović', 'Stanković', 'Milošević', 'Kostić', 'Stefanović',
//   'Mladenović', 'Živković', 'Tomić', 'Dimitrijević', 'Vasiljević', 'Lazić',
//   'Todorović', 'Radovanović', 'Milenković', 'Antić', 'Ristić'
// ];

// const SERBIAN_CITIES = {
//   'Belgrade': ['Stari Grad', 'Vračar', 'Savski Venac', 'Palilula', 'Novi Beograd', 'Zemun', 'Čukarica'],
//   'Vojvodina': ['Novi Sad', 'Subotica', 'Zrenjanin', 'Pančevo', 'Sombor', 'Kikinda', 'Senta'],
//   'Nišava': ['Niš', 'Aleksinac', 'Svrljig', 'Gadžin Han', 'Merošina', 'Ražanj'],
//   'Šumadija': ['Kragujevac', 'Aranđelovac', 'Topola', 'Batočina', 'Knić', 'Rača'],
//   'Zlatibor': ['Užice', 'Čajetina', 'Priboj', 'Nova Varoš', 'Prijepolje', 'Arilje'],
//   'Braničevo': ['Požarevac', 'Petrovac', 'Veliko Gradište', 'Golubac', 'Kučevo', 'Malo Crniće'],
//   'Podunavlje': ['Smederevo', 'Smederevska Palanka', 'Velika Plana'],
//   'Kolubara': ['Valjevo', 'Lajkovac', 'Ljig', 'Mionica', 'Osečina', 'Ub'],
//   'Jablanica': ['Leskovac', 'Lebane', 'Bojnik', 'Medveđa', 'Crna Trava'],
//   'Pčinja': ['Vranje', 'Bosilegrad', 'Bujanovac', 'Trgovište', 'Preševo', 'Surdulica']
// };

// const REGIONS = Object.keys(SERBIAN_CITIES);

// const STREET_NAMES = [
//   'Knez Mihailova', 'Kralja Milana', 'Kralja Petra', 'Terazije', 'Bulevar Kralja Aleksandra',
//   'Nemanjina', 'Makedonska', 'Svetozara Markovića', 'Takovska', 'Resavska',
//   'Bulevar oslobođenja', 'Cara Lazara', 'Vojvode Stepe', 'Njegoševa', 'Džordža Vašingtona'
// ];

// const COMPANY_NAMES = [
//   'Energoprojekt', 'Metalac', 'Železara Smederevo', 'Milan Blagojević', 'FAP Trucks',
//   'Dunav Osiguranje', 'Delta Holding', 'MK Group', 'Telekom Srbija', 'Aerodrom Nikola Tesla',
//   'Železnice Srbije', 'Elektroprivreda Srbije', 'Messer Tehnogas', 'Carnex', 'Imlek'
// ];

// const BANK_NAMES = [
//   'Raiffeisen Bank', 'Komercijalna Banka', 'UniCredit Bank', 'Intesa Sanpaolo',
//   'Banca Intesa', 'Erste Bank', 'OTP Banka', 'ProCredit Bank', 'AIK Banka'
// ];

// // Utility Functions
// const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
// const randomFloat = (min, max) => Math.random() * (max - min) + min;
// const randomElement = (arr) => arr[randomInt(0, arr.length - 1)];
// const randomDate = (start, end) => new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));

// const generateNationalId = () => {
//   return `${randomInt(0, 3)}${randomInt(100000000, 999999999)}`;
// };

// const generateParcelId = (region) => {
//   const regionCode = region.substring(0, 2).toUpperCase();
//   return `RS-${regionCode}-${String(randomInt(1, 999999)).padStart(6, '0')}`;
// };

// const generateCoordinates = (region) => {
//   // Approximate coordinates for Serbian regions
//   const coords = {
//     'Belgrade': { lat: [44.75, 44.85], lng: [20.40, 20.55] },
//     'Vojvodina': { lat: [45.25, 45.35], lng: [19.80, 19.90] },
//     'Nišava': { lat: [43.30, 43.35], lng: [21.90, 22.00] },
//     'Šumadija': { lat: [44.00, 44.05], lng: [20.90, 21.00] },
//     'Zlatibor': { lat: [43.70, 43.75], lng: [19.70, 19.80] },
//     'Braničevo': { lat: [44.60, 44.65], lng: [21.15, 21.25] },
//     'Podunavlje': { lat: [44.65, 44.70], lng: [20.92, 21.00] },
//     'Kolubara': { lat: [44.25, 44.30], lng: [19.85, 19.95] },
//     'Jablanica': { lat: [42.98, 43.05], lng: [21.95, 22.05] },
//     'Pčinja': { lat: [42.55, 42.60], lng: [21.90, 22.00] }
//   };
  
//   const regionCoords = coords[region] || coords['Belgrade'];
//   return {
//     latitude: randomFloat(regionCoords.lat[0], regionCoords.lat[1]),
//     longitude: randomFloat(regionCoords.lng[0], regionCoords.lng[1])
//   };
// };

// // Data Generation Functions
// const generateOwners = async (count) => {
//   console.log(`📝 Creating ${count} owners...`);
//   const owners = [];
  
//   for (let i = 0; i < count; i++) {
//     const ownerType = Math.random() > 0.8 ? 'corporation' : 'individual';
//     const region = randomElement(REGIONS);
//     const cities = SERBIAN_CITIES[region];
    
//     let owner;
    
//     if (ownerType === 'individual') {
//       const isMale = Math.random() > 0.5;
//       owner = {
//         ownerType: 'individual',
//         personalInfo: {
//           firstName: isMale ? randomElement(SERBIAN_FIRST_NAMES_MALE) : randomElement(SERBIAN_FIRST_NAMES_FEMALE),
//           lastName: randomElement(SERBIAN_LAST_NAMES),
//           dateOfBirth: randomDate(new Date('1950-01-01'), new Date('2000-12-31')),
//           nationalId: generateNationalId(),
//           taxId: `${randomInt(100000000, 999999999)}`
//         },
//         contact: {
//           email: `owner${i}@example.rs`,
//           phone: `+381${randomInt(10, 69)}${randomInt(100000, 999999)}`,
//           mobile: `+38160${randomInt(100000, 999999)}`
//         },
//         address: {
//           street: randomElement(STREET_NAMES),
//           number: `${randomInt(1, 200)}`,
//           city: randomElement(cities),
//           postalCode: `${randomInt(11000, 38000)}`,
//           country: 'Serbia'
//         },
//         citizenship: 'Serbian',
//         residencyStatus: 'resident',
//         creditScore: randomInt(400, 800),
//         isVerified: Math.random() > 0.1,
//         registrationDate: randomDate(new Date('2010-01-01'), new Date())
//       };
//     } else {
//       owner = {
//         ownerType: 'corporation',
//         corporateInfo: {
//           companyName: randomElement(COMPANY_NAMES),
//           registrationNumber: `${randomInt(10000000, 99999999)}`,
//           taxId: `${randomInt(100000000, 999999999)}`,
//           legalForm: randomElement(['LLC', 'JSC', 'Partnership']),
//           incorporationDate: randomDate(new Date('1990-01-01'), new Date('2020-12-31'))
//         },
//         contact: {
//           email: `company${i}@example.rs`,
//           phone: `+381${randomInt(10, 69)}${randomInt(100000, 999999)}`
//         },
//         address: {
//           street: randomElement(STREET_NAMES),
//           number: `${randomInt(1, 200)}`,
//           city: randomElement(cities),
//           postalCode: `${randomInt(11000, 38000)}`,
//           country: 'Serbia'
//         },
//         isVerified: Math.random() > 0.05,
//         registrationDate: randomDate(new Date('2005-01-01'), new Date())
//       };
//     }
    
//     owners.push(owner);
//   }
  
//   return await Owner.insertMany(owners);
// };

// const generateUsers = async () => {
//   console.log('👥 Creating system users...');
  
//   const users = [
//     {
//       userId: 'USR-2024-000001',
//       firstName: 'Marko',
//       lastName: 'Petrović',
//       email: 'minister@land.gov.rs',
//       password: 'Minister@123',
//       role: 'minister',
//       permissions: ['view_all_regions', 'generate_reports'],
//       department: 'management',
//       position: 'Minister of Land Affairs',
//       hireDate: new Date('2020-01-01'),
//       assignedRegions: REGIONS,
//       isActive: true,
//       isVerified: true
//     },
//     {
//       userId: 'USR-2024-000002',
//       firstName: 'Ana',
//       lastName: 'Jovanović',
//       email: 'registrar.belgrade@land.gov.rs',
//       password: 'Registrar@123',
//       role: 'registrar',
//       permissions: ['create_parcel', 'edit_parcel', 'approve_transfer'],
//       department: 'land_registry',
//       position: 'Senior Registrar',
//       hireDate: new Date('2018-06-15'),
//       assignedRegions: ['Belgrade', 'Kolubara'],
//       isActive: true,
//       isVerified: true
//     },
//     {
//       userId: 'USR-2024-000003',
//       firstName: 'Milan',
//       lastName: 'Đorđević',
//       email: 'judge@land.gov.rs',
//       password: 'Judge@123',
//       role: 'judge',
//       permissions: ['resolve_dispute', 'view_audit_logs'],
//       department: 'judiciary',
//       position: 'Land Court Judge',
//       hireDate: new Date('2015-03-20'),
//       barNumber: 'JDG-12345',
//       assignedRegions: REGIONS,
//       isActive: true,
//       isVerified: true
//     },
//     {
//       userId: 'USR-2024-000004',
//       firstName: 'Jelena',
//       lastName: 'Nikolić',
//       email: 'auditor@land.gov.rs',
//       password: 'Auditor@123',
//       role: 'auditor',
//       permissions: ['view_audit_logs', 'blockchain_access'],
//       department: 'audit',
//       position: 'Chief Auditor',
//       hireDate: new Date('2019-09-10'),
//       assignedRegions: REGIONS,
//       isActive: true,
//       isVerified: true
//     }
//   ];
  
//   // Add more registrars for each region
//   REGIONS.forEach((region, idx) => {
//     users.push({
//       userId: `USR-2024-${String(idx + 10).padStart(6, '0')}`,
//       firstName: randomElement([...SERBIAN_FIRST_NAMES_MALE, ...SERBIAN_FIRST_NAMES_FEMALE]),
//       lastName: randomElement(SERBIAN_LAST_NAMES),
//       email: `registrar.${region.toLowerCase().replace(/\s/g, '')}@land.gov.rs`,
//       password: 'Registrar@123',
//       role: 'registrar',
//       permissions: ['create_parcel', 'edit_parcel', 'approve_transfer'],
//       department: 'land_registry',
//       position: 'Regional Registrar',
//       hireDate: randomDate(new Date('2015-01-01'), new Date('2023-12-31')),
//       assignedRegions: [region],
//       primaryOffice: region,
//       isActive: true,
//       isVerified: true
//     });
//   });
  
//   return await User.insertMany(users);
// };

// const generateParcels = async (owners, users, count) => {
//   console.log(`🏠 Creating ${count} land parcels...`);
//   const parcels = [];
  
//   for (let i = 0; i < count; i++) {
//     const region = randomElement(REGIONS);
//     const cities = SERBIAN_CITIES[region];
//     const city = randomElement(cities);
//     const owner = randomElement(owners);
//     const coords = generateCoordinates(region);
    
//     const parcel = {
//       parcelId: generateParcelId(region),
//       region,
//       district: region,
//       municipality: city,
//       cadastralMunicipality: city,
//       address: {
//         street: randomElement(STREET_NAMES),
//         number: `${randomInt(1, 300)}`,
//         postalCode: `${randomInt(11000, 38000)}`,
//         city
//       },
//       coordinates: coords,
//       area: randomInt(200, 50000), // square meters
//       landType: randomElement(['agricultural', 'residential', 'commercial', 'industrial', 'mixed']),
//       landUse: randomElement(['building', 'farming', 'vacant', 'developed']),
//       currentOwner: owner._id,
//       ownershipType: owner.ownerType === 'corporation' ? 'private' : randomElement(['private', 'shared']),
//       legalStatus: randomElement(['verified', 'verified', 'verified', 'verified', 'clean', 'disputed', 'pending']),
//       marketValue: randomInt(20000, 500000), // EUR
//       taxValue: randomInt(15000, 400000), // EUR
//       lastValuationDate: randomDate(new Date('2022-01-01'), new Date()),
//       hasMortgage: Math.random() > 0.6,
//       hasLien: Math.random() > 0.9,
//       hasEasement: Math.random() > 0.85,
//       blockchainHash: `0x${Math.random().toString(16).substr(2, 64)}`,
//       lastVerifiedDate: randomDate(new Date('2023-01-01'), new Date()),
//       verifiedBy: randomElement(users.filter(u => u.role === 'registrar'))._id,
//       isActive: true,
//       isFraudulent: false,
//       registrationDate: randomDate(new Date('2000-01-01'), new Date())
//     };
    
//     parcels.push(parcel);
//   }
  
//   return await Parcel.insertMany(parcels);
// };

// const generateOwnershipHistory = async (parcels, owners, users) => {
//   console.log('📜 Creating ownership history records...');
//   const histories = [];
  
//   for (const parcel of parcels) {
//     // Generate 1-5 historical ownership records per parcel
//     const historyCount = randomInt(1, 5);
//     let currentDate = new Date(parcel.registrationDate);
//     let previousOwner = null;
    
//     for (let i = 0; i < historyCount; i++) {
//       const newOwner = i === historyCount - 1 ? parcel.currentOwner : randomElement(owners)._id;
//       const transactionDate = new Date(currentDate);
//       transactionDate.setMonth(currentDate.getMonth() + randomInt(6, 60));
      
//       if (transactionDate > new Date()) break;
      
//       const history = {
//         parcel: parcel._id,
//         transactionType: randomElement(['purchase', 'purchase', 'sale', 'inheritance', 'gift']),
//         previousOwner: previousOwner,
//         newOwner: newOwner,
//         transactionDate: transactionDate,
//         registrationDate: new Date(transactionDate.getTime() + 86400000 * randomInt(1, 14)),
//         transactionValue: randomInt(10000, parcel.marketValue),
//         taxPaid: randomInt(500, 10000),
//         legalBasis: `Purchase Contract #${randomInt(10000, 99999)}`,
//         contractNumber: `CTR-${new Date(transactionDate).getFullYear()}-${randomInt(10000, 99999)}`,
//         notaryId: `NOT-${randomInt(1000, 9999)}`,
//         status: 'approved',
//         approvedBy: randomElement(users.filter(u => u.role === 'registrar'))._id,
//         approvalDate: new Date(transactionDate.getTime() + 86400000 * randomInt(1, 7)),
//         blockchainHash: `0x${Math.random().toString(16).substr(2, 64)}`,
//         blockchainTimestamp: transactionDate,
//         createdBy: randomElement(users.filter(u => u.role === 'registrar'))._id,
//         verifiedBy: randomElement(users.filter(u => u.role === 'registrar'))._id,
//         verificationDate: new Date(transactionDate.getTime() + 86400000 * randomInt(1, 5)),
//         isActive: true
//       };
      
//       histories.push(history);
//       previousOwner = newOwner;
//       currentDate = transactionDate;
//     }
//   }
  
//   return await OwnershipHistory.insertMany(histories);
// };

// const generateDisputes = async (parcels, owners, users) => {
//   console.log('⚖️  Creating dispute records...');
//   const disputes = [];
//   const disputeCount = Math.min(150, Math.floor(parcels.length * 0.15)); // 15% of parcels have disputes
  
//   for (let i = 0; i < disputeCount; i++) {
//     const parcel = randomElement(parcels);
//     const filingDate = randomDate(new Date('2020-01-01'), new Date());
//     const daysSinceFiling = Math.floor((new Date() - filingDate) / (1000 * 60 * 60 * 24));
    
//     let status;
//     if (daysSinceFiling < 30) status = 'Open';
//     else if (daysSinceFiling < 90) status = randomElement(['Open', 'Investigation']);
//     else if (daysSinceFiling < 180) status = randomElement(['Investigation', 'Court']);
//     else status = randomElement(['Court', 'Court', 'Resolved']);
    
//     const dispute = {
//       disputeId: `DSP-${new Date(filingDate).getFullYear()}-${String(i + 1).padStart(6, '0')}`,
//       parcel: parcel._id,
//       claimant: randomElement(owners)._id,
//       defendant: parcel.currentOwner,
//       disputeType: randomElement([
//         'ownership_claim', 'boundary_dispute', 'inheritance_dispute',
//         'fraud_allegation', 'contract_breach'
//       ]),
//       description: 'Dispute regarding property ownership and boundaries.',
//       claimedAmount: randomInt(5000, 200000),
//       status: status,
//       priority: randomElement(['low', 'low', 'medium', 'medium', 'high']),
//       filingDate: filingDate,
//       region: parcel.region,
//       investigationStartDate: status !== 'Open' ? new Date(filingDate.getTime() + 86400000 * randomInt(5, 20)) : null,
//       courtFilingDate: ['Court', 'Resolved'].includes(status) ? new Date(filingDate.getTime() + 86400000 * randomInt(60, 150)) : null,
//       resolutionDate: status === 'Resolved' ? new Date(filingDate.getTime() + 86400000 * randomInt(180, 400)) : null,
//       estimatedCost: randomInt(2000, 50000),
//       actualCost: status === 'Resolved' ? randomInt(2000, 50000) : 0,
//       assignedTo: randomElement(users.filter(u => u.role === 'registrar' || u.role === 'judge'))._id,
//       createdBy: randomElement(users.filter(u => u.role === 'registrar'))._id,
//       isUrgent: Math.random() > 0.9
//     };
    
//     if (status === 'Resolved') {
//       dispute.resolution = {
//         outcome: randomElement(['claimant_favor', 'defendant_favor', 'settlement', 'dismissed']),
//         description: 'Dispute resolved through court decision.',
//         compensationAmount: randomInt(0, 50000)
//       };
//     }
    
//     disputes.push(dispute);
//   }
  
//   return await Dispute.insertMany(disputes);
// };

// const generateTransfers = async (parcels, owners, users) => {
//   console.log('📋 Creating transfer records...');
//   const transfers = [];
//   const transferCount = Math.min(300, Math.floor(parcels.length * 0.3)); // 30% have recent transfers
  
//   for (let i = 0; i < transferCount; i++) {
//     const parcel = randomElement(parcels);
//     const applicationDate = randomDate(new Date('2023-01-01'), new Date());
//     const daysSinceApplication = Math.floor((new Date() - applicationDate) / (1000 * 60 * 60 * 24));
    
//     let transferStatus;
//     let processingStage;
    
//     if (daysSinceApplication < 7) {
//       transferStatus = 'initiated';
//       processingStage = 'document_submission';
//     } else if (daysSinceApplication < 14) {
//       transferStatus = 'pending_approval';
//       processingStage = randomElement(['document_verification', 'legal_review']);
//     } else if (daysSinceApplication < 30) {
//       transferStatus = randomElement(['pending_approval', 'approved']);
//       processingStage = randomElement(['tax_assessment', 'approval_pending', 'registration']);
//     } else {
//       transferStatus = randomElement(['approved', 'completed', 'completed']);
//       processingStage = transferStatus === 'completed' ? 'completed' : 'registration';
//     }
    
//     const agreedPrice = randomInt(20000, parcel.marketValue * 1.2);
    
//     const transfer = {
//       transferId: `TRF-${new Date(applicationDate).getFullYear()}-${String(i + 1).padStart(6, '0')}`,
//       parcel: parcel._id,
//       seller: parcel.currentOwner,
//       buyer: randomElement(owners)._id,
//       transferType: randomElement(['sale', 'sale', 'sale', 'gift', 'inheritance']),
//       transferStatus: transferStatus,
//       agreedPrice: agreedPrice,
//       registeredPrice: agreedPrice,
//       marketValue: parcel.marketValue,
//       transferTax: {
//         rate: 2.5,
//         amount: agreedPrice * 0.025
//       },
//       registrationFee: randomInt(100, 500),
//       notaryFee: randomInt(200, 1000),
//       paymentStatus: transferStatus === 'completed' ? 'paid' : randomElement(['unpaid', 'partial', 'paid']),
//       contractDate: new Date(applicationDate.getTime() - 86400000 * randomInt(5, 30)),
//       contractNumber: `CTR-${new Date(applicationDate).getFullYear()}-${randomInt(10000, 99999)}`,
//       applicationDate: applicationDate,
//       processingStage: processingStage,
//       region: parcel.region,
//       registryOffice: `${parcel.region} Registry Office`,
//       blockchainHash: transferStatus === 'completed' ? `0x${Math.random().toString(16).substr(2, 64)}` : null,
//       assignedOfficer: randomElement(users.filter(u => u.role === 'registrar'))._id,
//       createdBy: randomElement(users.filter(u => u.role === 'registrar'))._id,
//       isPriority: Math.random() > 0.9
//     };
    
//     if (transferStatus === 'approved' || transferStatus === 'completed') {
//       transfer.approvedBy = randomElement(users.filter(u => u.role === 'registrar'))._id;
//       transfer.approvalDate = new Date(applicationDate.getTime() + 86400000 * randomInt(7, 20));
//     }
    
//     if (transferStatus === 'completed') {
//       transfer.completionDate = new Date(applicationDate.getTime() + 86400000 * randomInt(14, 45));
//       transfer.registrationDate = transfer.completionDate;
//     }
    
//     transfers.push(transfer);
//   }
  
//   return await Transfer.insertMany(transfers);
// };

// const generateMortgages = async (parcels, owners, users) => {
//   console.log('🏦 Creating mortgage records...');
//   const mortgages = [];
//   const mortgageCount = Math.min(200, Math.floor(parcels.length * 0.25)); // 25% have mortgages
  
//   for (let i = 0; i < mortgageCount; i++) {
//     const parcel = randomElement(parcels.filter(p => p.hasMortgage));
//     if (!parcel) continue;
    
//     const originationDate = randomDate(new Date('2015-01-01'), new Date('2024-01-01'));
//     const termYears = randomElement([10, 15, 20, 25, 30]);
//     const maturityDate = new Date(originationDate);
//     maturityDate.setFullYear(maturityDate.getFullYear() + termYears);
    
//     const principalAmount = randomInt(10000, parcel.marketValue * 0.8);
//     const monthsPassed = Math.floor((new Date() - originationDate) / (1000 * 60 * 60 * 24 * 30));
//     const totalMonths = termYears * 12;
//     const monthlyPayment = principalAmount / totalMonths * 1.05; // Simplified calculation
//     const outstandingBalance = Math.max(0, principalAmount - (monthlyPayment * monthsPassed * 0.7));
    
//     const mortgage = {
//       mortgageId: `MTG-${new Date(originationDate).getFullYear()}-${String(i + 1).padStart(6, '0')}`,
//       parcel: parcel._id,
//       borrower: parcel.currentOwner,
//       lender: {
//         name: randomElement(BANK_NAMES),
//         type: 'bank',
//         registrationNumber: `${randomInt(10000000, 99999999)}`,
//         contact: {
//           email: 'loans@bank.rs',
//           phone: `+381${randomInt(10, 69)}${randomInt(100000, 999999)}`
//         }
//       },
//       mortgageType: parcel.landType === 'commercial' ? 'commercial' : 'residential',
//       mortgageStatus: outstandingBalance === 0 ? 'paid_off' : (Math.random() > 0.95 ? 'defaulted' : 'active'),
//       principalAmount: principalAmount,
//       outstandingBalance: outstandingBalance,
//       interestRate: randomFloat(2.5, 6.5),
//       interestType: randomElement(['fixed', 'variable']),
//       term: {
//         years: termYears,
//         months: totalMonths
//       },
//       monthlyPayment: monthlyPayment,
//       originationDate: originationDate,
//       maturityDate: maturityDate,
//       registrationDate: originationDate,
//       lastPaymentDate: new Date(Date.now() - 86400000 * randomInt(1, 30)),
//       nextPaymentDueDate: new Date(Date.now() + 86400000 * randomInt(1, 30)),
//       propertyValueAtOrigination: parcel.marketValue * randomFloat(0.8, 1.0),
//       currentPropertyValue: parcel.marketValue,
//       loanToValueRatio: (principalAmount / parcel.marketValue) * 100,
//       mortgageDeedNumber: `MTG-DEED-${randomInt(100000, 999999)}`,
//       region: parcel.region,
//       priority: 1,
//       riskRating: outstandingBalance > principalAmount * 0.9 ? 'high' : 'low',
//       createdBy: randomElement(users.filter(u => u.role === 'registrar'))._id,
//       isUnderReview: Math.random() > 0.95
//     };
    
//     mortgages.push(mortgage);
//   }
  
//   return await Mortgage.insertMany(mortgages);
// };

// const generateSubsidies = async (parcels, owners, users) => {
//   console.log('💶 Creating subsidy records...');
//   const subsidies = [];
//   const subsidyCount = 250; // Create 250 subsidy applications
  
//   const PROGRAMS = [
//     'First-Time Homebuyer',
//     'Rural Development',
//     'Low-Income Housing',
//     'Veterans Housing',
//     'Young Families',
//     'Agricultural Land'
//   ];
  
//   const currentYear = new Date().getFullYear();
  
//   for (let i = 0; i < subsidyCount; i++) {
//     const parcel = randomElement(parcels);
//     const owner = randomElement(owners.filter(o => o.ownerType === 'individual'));
//     const applicationDate = randomDate(new Date(currentYear - 1, 0, 1), new Date());
//     const daysSinceApplication = Math.floor((new Date() - applicationDate) / (1000 * 60 * 60 * 24));
    
//     const programName = randomElement(PROGRAMS);
//     const allocatedAmount = randomInt(5000, 50000);
//     const approvedAmount = allocatedAmount * randomFloat(0.7, 1.0);
    
//     let status;
//     let disbursedAmount = 0;
    
//     if (daysSinceApplication < 30) {
//       status = 'pending';
//     } else if (daysSinceApplication < 60) {
//       status = randomElement(['pending', 'approved']);
//     } else if (daysSinceApplication < 120) {
//       status = randomElement(['approved', 'disbursed']);
//       if (status === 'disbursed') {
//         disbursedAmount = approvedAmount * randomFloat(0.3, 0.8);
//       }
//     } else {
//       status = randomElement(['disbursed', 'completed', 'completed']);
//       if (status === 'completed') {
//         disbursedAmount = approvedAmount;
//       } else {
//         disbursedAmount = approvedAmount * randomFloat(0.5, 0.95);
//       }
//     }
    
//     // 3% fraud rate
//     const isLegitimate = Math.random() > 0.03;
//     if (!isLegitimate) {
//       status = 'cancelled';
//     }
    
//     const subsidy = {
//       subsidyId: `SUB-${currentYear}-${String(i + 1).padStart(6, '0')}`,
//       programName: programName,
//       programYear: currentYear,
//       beneficiary: owner._id,
//       parcel: parcel._id,
//       allocatedAmount: allocatedAmount,
//       approvedAmount: approvedAmount,
//       disbursedAmount: disbursedAmount,
//       remainingAmount: approvedAmount - disbursedAmount,
//       applicationDate: applicationDate,
//       status: status,
//       region: parcel.region,
//       municipality: parcel.municipality,
//       isEligible: status !== 'rejected',
//       isVerified: status !== 'pending',
//       isLegitimate: isLegitimate,
//       processingOfficer: randomElement(users.filter(u => u.role === 'registrar'))._id,
//       createdBy: randomElement(users.filter(u => u.role === 'registrar'))._id
//     };
    
//     if (status !== 'pending') {
//       subsidy.approvalDate = new Date(applicationDate.getTime() + 86400000 * randomInt(10, 40));
//       subsidy.approvedBy = randomElement(users.filter(u => u.role === 'registrar'))._id;
//       subsidy.verifiedBy = randomElement(users.filter(u => u.role === 'registrar'))._id;
//       subsidy.verificationDate = subsidy.approvalDate;
//     }
    
//     if (status === 'disbursed' || status === 'completed') {
//       subsidy.disbursementDate = new Date(subsidy.approvalDate.getTime() + 86400000 * randomInt(5, 20));
//     }
    
//     if (status === 'completed') {
//       subsidy.completionDate = new Date(subsidy.disbursementDate.getTime() + 86400000 * randomInt(10, 60));
//     }
    
//     if (!isLegitimate) {
//       subsidy.fraudFlags = [{
//         flagType: randomElement(['duplicate_application', 'false_documentation', 'income_misrepresentation']),
//         flagDate: new Date(),
//         description: 'Fraudulent activity detected during verification',
//         isResolved: false
//       }];
//     }
    
//     subsidies.push(subsidy);
//   }
  
//   return await Subsidy.insertMany(subsidies);
// };

// // Main Seeding Function
// const seedDatabase = async () => {
//   try {
//     console.log('🚀 Starting database seeding...\n');
    
//     await connectDB();
    
//     // Clear existing data - drop entire database for clean slate
// console.log('🗑️  Clearing existing data...');
// await mongoose.connection.dropDatabase();
// console.log('✅ Existing data cleared\n');
    
//     // Generate data
//     const users = await generateUsers();
//     console.log(`✅ Created ${users.length} users\n`);
    
//     const owners = await generateOwners(500);
//     console.log(`✅ Created ${owners.length} owners\n`);
    
//     const parcels = await generateParcels(owners, users, 1000);
//     console.log(`✅ Created ${parcels.length} parcels\n`);
    
//     const ownershipHistory = await generateOwnershipHistory(parcels.slice(0, 500), owners, users);
//     console.log(`✅ Created ${ownershipHistory.length} ownership history records\n`);
    
//     const disputes = await generateDisputes(parcels, owners, users);
//     console.log(`✅ Created ${disputes.length} disputes\n`);
    
//     const transfers = await generateTransfers(parcels, owners, users);
//     console.log(`✅ Created ${transfers.length} transfers\n`);
    
//     const mortgages = await generateMortgages(parcels, owners, users);
//     console.log(`✅ Created ${mortgages.length} mortgages\n`);
    
//     const subsidies = await generateSubsidies(parcels, owners, users);
//     console.log(`✅ Created ${subsidies.length} subsidies\n`);
    
//     console.log('🎉 Database seeding completed successfully!\n');
//     console.log('📊 Summary:');
//     console.log(`   - Users: ${users.length}`);
//     console.log(`   - Owners: ${owners.length}`);
//     console.log(`   - Parcels: ${parcels.length}`);
//     console.log(`   - Ownership History: ${ownershipHistory.length}`);
//     console.log(`   - Disputes: ${disputes.length}`);
//     console.log(`   - Transfers: ${transfers.length}`);
//     console.log(`   - Mortgages: ${mortgages.length}`);
//     console.log(`   - Subsidies: ${subsidies.length}`);
//     console.log('\n👤 Test User Credentials:');
//     console.log('   Minister: minister@land.gov.rs / Minister@123');
//     console.log('   Registrar: registrar.belgrade@land.gov.rs / Registrar@123');
//     console.log('   Judge: judge@land.gov.rs / Judge@123');
//     console.log('   Auditor: auditor@land.gov.rs / Auditor@123');
    
//     process.exit(0);
//   } catch (error) {
//     console.error('❌ Error seeding database:', error);
//     process.exit(1);
//   }
// };

// // Run the seeding
// seedDatabase();
