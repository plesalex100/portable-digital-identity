import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();

import Person from "./models/Person.js";

const FIRST_NAMES = [
    "James", "Maria", "Yuki", "Ahmed", "Sofia", "Chen", "Olga", "Raj",
    "Fatima", "Lucas", "Aiko", "Mohammed", "Elena", "Wei", "Anna",
    "Carlos", "Ingrid", "Hiroshi", "Priya", "Lars", "Mei", "Omar",
    "Isabella", "Kenji", "Amara", "Viktor", "Lena", "Ravi", "Sana",
    "Thomas", "Yara", "Diego", "Hana", "Nikolai", "Chloe", "Arjun",
    "Freya", "Hassan", "Julia", "Takeshi", "Leila", "Mateo", "Anya",
    "Sven", "Nadia", "Marco", "Sakura", "Emeka", "Zara", "Felix",
];

const LAST_NAMES = [
    "Smith", "Garcia", "Tanaka", "Al-Rashid", "Petrova", "Wang", "Johansson",
    "Patel", "Fernandez", "Kim", "Nakamura", "Hassan", "Muller", "Li",
    "Novak", "Santos", "Bergstrom", "Yamamoto", "Sharma", "Andersen",
    "Chen", "Abbas", "Rossi", "Suzuki", "Okafor", "Ivanov", "Fischer",
    "Kumar", "Mohamad", "Jensen", "Dubois", "Rodriguez", "Takahashi",
    "Volkov", "Durand", "Singh", "Lindqvist", "Ali", "Kowalski", "Sato",
    "Ibrahim", "Herrera", "Kozlov", "Eriksson", "Da Silva", "Park",
    "Moreau", "Adeyemi", "Hoffman", "Nguyen",
];

const NATIONALITIES = [
    "United States", "Spain", "Japan", "Saudi Arabia", "Russia", "China",
    "Sweden", "India", "Brazil", "South Korea", "Germany", "Egypt",
    "France", "United Kingdom", "Czech Republic", "Mexico", "Norway",
    "Australia", "Nigeria", "Denmark", "Italy", "Turkey", "Canada",
    "Netherlands", "Argentina", "Poland", "Thailand", "Colombia",
    "Portugal", "Switzerland",
];

// Fixed set of flights — all 100 passengers are spread across these 4 flights
const FLIGHTS = [
    { flightNumber: "EK204", airline: "Emirates",         departure: "AMS", arrival: "DXB", gate: "B3",  boardingHoursFromNow: 0.5 },
    { flightNumber: "LH372", airline: "Lufthansa",        departure: "AMS", arrival: "FRA", gate: "A7",  boardingHoursFromNow: 1.5 },
    { flightNumber: "BA438", airline: "British Airways",   departure: "AMS", arrival: "LHR", gate: "C5",  boardingHoursFromNow: 2.5 },
    { flightNumber: "DL147", airline: "Delta",             departure: "AMS", arrival: "JFK", gate: "D6",  boardingHoursFromNow: 4.0 },
];

const STATUSES = [
    "checked-in",
    "security-screening",
    "security-cleared",
    "at-gate",
    "boarding",
    "boarded",
    "flagged",
] as const;

// Weighted distribution: most passengers are further along in the flow
const STATUS_WEIGHTS = [8, 5, 15, 25, 20, 22, 5];


function pick<T>(arr: T[]): T {
    return arr[Math.floor(Math.random() * arr.length)];
}

function pickWeighted<T>(arr: readonly T[], weights: number[]): T {
    const total = weights.reduce((a, b) => a + b, 0);
    let r = Math.random() * total;
    for (let i = 0; i < arr.length; i++) {
        r -= weights[i];
        if (r <= 0) return arr[i];
    }
    return arr[arr.length - 1];
}

function randomPassport(): string {
    const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const letter = letters[Math.floor(Math.random() * 26)];
    const digits = String(Math.floor(10000000 + Math.random() * 90000000));
    return `${letter}${digits}`;
}

function randomSeat(): string {
    const row = Math.floor(1 + Math.random() * 42);
    const col = "ABCDEFHJK"[Math.floor(Math.random() * 9)];
    return `${row}${col}`;
}

function randomVerificationScore(status: string): number {
    if (status === "flagged") {
        return parseFloat((30 + Math.random() * 35).toFixed(1));
    }
    return parseFloat((88 + Math.random() * 12).toFixed(1));
}

function generatePerson(flight: typeof FLIGHTS[number]) {
    const firstName = pick(FIRST_NAMES);
    const lastName = pick(LAST_NAMES);
    const status = pickWeighted(STATUSES, STATUS_WEIGHTS);

    const now = new Date();
    const boardingTime = new Date(now.getTime() + flight.boardingHoursFromNow * 3600000 + (Math.random() * 10 - 5) * 60000);
    const enrolledAt = new Date(Date.now() - Math.floor(Math.random() * 7200000));

    return {
        name: `${firstName} ${lastName}`,
        enrolledAt,
        nationality: pick(NATIONALITIES),
        passportNumber: randomPassport(),
        flightNumber: flight.flightNumber,
        airline: flight.airline,
        departure: flight.departure,
        arrival: flight.arrival,
        gate: flight.gate,
        seat: randomSeat(),
        boardingTime,
        status,
        verificationScore: randomVerificationScore(status),
        metadata: { isFakeUser: true },
    };
}

async function seed() {
    const { MONGO_URL, DATABASE_NAME } = process.env;

    if (!MONGO_URL || !DATABASE_NAME) {
        console.error("Missing MONGO_URL or DATABASE_NAME in .env");
        process.exit(1);
    }

    await mongoose.connect(MONGO_URL, { dbName: DATABASE_NAME });
    console.log(`Connected to ${DATABASE_NAME}`);

    // Clear existing persons
    const deleted = await Person.deleteMany({});
    console.log(`Cleared ${deleted.deletedCount} existing persons`);

    // Generate 100 passengers spread across 4 flights (~25 each)
    const passengers: ReturnType<typeof generatePerson>[] = [];
    for (let i = 0; i < 100; i++) {
        const flight = FLIGHTS[i % FLIGHTS.length];
        passengers.push(generatePerson(flight));
    }

    const result = await Person.insertMany(passengers);
    console.log(`Seeded ${result.length} passengers`);

    // Print summary
    const statusCounts: Record<string, number> = {};
    for (const p of passengers) {
        statusCounts[p.status] = (statusCounts[p.status] || 0) + 1;
    }
    console.log("\nStatus distribution:");
    for (const [status, count] of Object.entries(statusCounts).sort((a, b) => b[1] - a[1])) {
        console.log(`  ${status}: ${count}`);
    }

    const flightCounts: Record<string, number> = {};
    for (const p of passengers) {
        flightCounts[p.flightNumber] = (flightCounts[p.flightNumber] || 0) + 1;
    }
    console.log("\nFlight distribution:");
    for (const [flight, count] of Object.entries(flightCounts).sort((a, b) => b[1] - a[1])) {
        const f = FLIGHTS.find(f => f.flightNumber === flight)!;
        console.log(`  ${flight} (${f.airline} → ${f.arrival}, gate ${f.gate}): ${count} pax`);
    }

    await mongoose.disconnect();
    console.log("\nDone!");
}

seed().catch((err) => {
    console.error("Seed failed:", err);
    process.exit(1);
});
