/**
 * Full reset script: wipe S3 bucket, clean DB, re-seed fresh data.
 * Usage: pnpm reset
 */
import mongoose from "mongoose";
import dotenv from "dotenv";
import {
    S3Client,
    ListObjectsV2Command,
    DeleteObjectsCommand,
} from "@aws-sdk/client-s3";

dotenv.config();

// ─── S3 cleanup ──────────────────────────────────────────────────────────────

async function emptyS3Bucket() {
    const { AWS_REGION, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_S3_BUCKET } = process.env;

    if (!AWS_REGION || !AWS_ACCESS_KEY_ID || !AWS_SECRET_ACCESS_KEY || !AWS_S3_BUCKET) {
        console.log("⚠  AWS env vars not set — skipping S3 cleanup");
        return;
    }

    const s3 = new S3Client({
        region: AWS_REGION,
        credentials: {
            accessKeyId: AWS_ACCESS_KEY_ID,
            secretAccessKey: AWS_SECRET_ACCESS_KEY,
        },
    });

    let totalDeleted = 0;
    let continuationToken: string | undefined;

    do {
        const list = await s3.send(
            new ListObjectsV2Command({
                Bucket: AWS_S3_BUCKET,
                ContinuationToken: continuationToken,
            }),
        );

        const objects = list.Contents ?? [];
        if (objects.length === 0) break;

        await s3.send(
            new DeleteObjectsCommand({
                Bucket: AWS_S3_BUCKET,
                Delete: { Objects: objects.map((o) => ({ Key: o.Key! })) },
            }),
        );

        totalDeleted += objects.length;
        continuationToken = list.IsTruncated ? list.NextContinuationToken : undefined;
    } while (continuationToken);

    console.log(`S3: deleted ${totalDeleted} objects from ${AWS_S3_BUCKET}`);
}

// ─── DB cleanup ──────────────────────────────────────────────────────────────

async function cleanDatabase() {
    const { MONGO_URL, DATABASE_NAME } = process.env;

    if (!MONGO_URL || !DATABASE_NAME) {
        console.error("Missing MONGO_URL or DATABASE_NAME in .env");
        process.exit(1);
    }

    await mongoose.connect(MONGO_URL, { dbName: DATABASE_NAME });
    console.log(`Connected to ${DATABASE_NAME}`);

    const db = mongoose.connection.db!;
    const collections = await db.listCollections().toArray();

    for (const col of collections) {
        await db.dropCollection(col.name);
        console.log(`DB: dropped collection "${col.name}"`);
    }

    if (collections.length === 0) {
        console.log("DB: no collections to drop");
    }
}

// ─── Seed (reuses existing seed logic inline) ────────────────────────────────

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

const FLIGHTS = [
    { flightNumber: "EK204", airline: "Emirates",       departure: "AMS", arrival: "DXB", gate: "B3", boardingHoursFromNow: 0.5 },
    { flightNumber: "LH372", airline: "Lufthansa",      departure: "AMS", arrival: "FRA", gate: "A7", boardingHoursFromNow: 1.5 },
    { flightNumber: "BA438", airline: "British Airways", departure: "AMS", arrival: "LHR", gate: "C5", boardingHoursFromNow: 2.5 },
    { flightNumber: "DL147", airline: "Delta",           departure: "AMS", arrival: "JFK", gate: "D6", boardingHoursFromNow: 4.0 },
];

const STATUSES = [
    "checked-in",
    "passed-check-in",
    "passed-immigration",
    "at-duty-free",
    "at-lounge",
    "passed-gate",
] as const;

const STATUS_WEIGHTS = [10, 15, 20, 15, 12, 28];

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

function randomVerificationScore(): number {
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
        verificationScore: randomVerificationScore(),
        metadata: { isFakeUser: true },
    };
}

async function seedDatabase() {
    const passengers = [];
    for (let i = 0; i < 100; i++) {
        const flight = FLIGHTS[i % FLIGHTS.length];
        passengers.push(generatePerson(flight));
    }

    const result = await Person.insertMany(passengers);
    console.log(`Seed: inserted ${result.length} passengers`);

    // Summary
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
        console.log(`  ${flight} (${f.airline} -> ${f.arrival}, gate ${f.gate}): ${count} pax`);
    }
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function main() {
    console.log("=== FULL RESET ===\n");

    // 1. Empty S3 bucket
    console.log("--- Step 1: Emptying S3 bucket ---");
    await emptyS3Bucket();

    // 2. Drop all DB collections
    console.log("\n--- Step 2: Cleaning database ---");
    await cleanDatabase();

    // 3. Re-seed
    console.log("\n--- Step 3: Seeding fresh data ---");
    await seedDatabase();

    await mongoose.disconnect();
    console.log("\n=== RESET COMPLETE ===");
}

main().catch((err) => {
    console.error("Reset failed:", err);
    process.exit(1);
});
