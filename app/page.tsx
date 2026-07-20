"use client";

import {
  ArrowLeft,
  Check,
  ChevronRight,
  Clipboard,
  Crosshair,
  Download,
  Info,
  LocateFixed,
  Map as MapIcon,
  MapPin,
  Phone,
  Plus,
  Radio,
  Search,
  Send,
  ShieldAlert,
  Sparkles,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useMemo, useState } from "react";
import { RealMap } from "./RealMap";

type Urgency = "emergency" | "now" | "soon" | "watch";

type Path = {
  label: string;
  urgency: Urgency;
  headline: string;
  do: string[];
  avoid: string[];
  tags?: string[];
};

type Animal = {
  id: string;
  icon: string;
  name: string;
  question: string;
  hint?: string;
  paths: Path[];
};

type SnakeIdentity = {
  id: string;
  name: string;
  danger: "Treat as highly venomous" | "Non-venomous — still keep back" | "Treat as dangerous";
  cues: string;
};

export type Position = {
  latitude: number;
  longitude: number;
  accuracy: number;
};

export type CaseRecord = {
  id: string;
  animal: string;
  icon: string;
  urgency: Urgency;
  situation: string;
  createdAt: string;
  latitude?: number;
  longitude?: number;
  place: string;
  status: string;
  locationSource?: "gps" | "pin" | "description";
};

const CONTACT_NUMBER = "0448466556";
const MARINE_NUMBER = "1300130372";
const PUBLIC_APP_URL =
  "https://wildlife-rescue-minjerribah.auraofintelligence.workers.dev";

function getCasesUrl() {
  if (typeof window === "undefined") return `${PUBLIC_APP_URL}/#cases`;
  return `${window.location.origin}/#cases`;
}

function encodeCaseData(record: CaseRecord) {
  return btoa(unescape(encodeURIComponent(JSON.stringify(record))));
}

function decodeCaseData(encoded: string): CaseRecord | null {
  try {
    const record = JSON.parse(decodeURIComponent(escape(atob(encoded))));
    if (
      typeof record?.id !== "string" ||
      typeof record?.animal !== "string" ||
      typeof record?.urgency !== "string" ||
      typeof record?.situation !== "string"
    ) {
      return null;
    }
    return record as CaseRecord;
  } catch {
    return null;
  }
}

function extractCaseFromAlert(text: string) {
  const match = /\[WRM-DATA\]([\s\S]+?)\[\/WRM-DATA\]/.exec(text.trim());
  if (!match) return null;
  return decodeCaseData(match[1].trim());
}

function formatCaseAlert(record: CaseRecord, casesUrl = getCasesUrl()) {
  const location =
    record.latitude !== undefined
      ? `${record.latitude.toFixed(5)}, ${record.longitude?.toFixed(5)}`
      : record.place || "Location needs confirmation";

  return `WRM ALERT - ${record.animal.toUpperCase()} - ${urgencyLabels[record.urgency].toUpperCase()}
${record.situation}
${location}
Case: ${record.id}

[WRM-DATA]${encodeCaseData(record)}[/WRM-DATA]

Open WRM Cases: ${casesUrl}
Copy this whole text into the "Paste a WRM alert text" field, then tap "Import case to this phone".`;
}

function smsHref(record: CaseRecord) {
  const body = encodeURIComponent(formatCaseAlert(record));
  const isAppleMobile =
    typeof navigator !== "undefined" &&
    /iPhone|iPad|iPod/i.test(navigator.userAgent);
  return `sms:${CONTACT_NUMBER}${isAppleMobile ? "&" : "?"}body=${body}`;
}

function downloadFile(filename: string, contents: string, type: string) {
  const url = URL.createObjectURL(new Blob([contents], { type }));
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function csvCell(value: unknown) {
  return `"${String(value ?? "").replaceAll('"', '""')}"`;
}

function casesToCsv(records: CaseRecord[]) {
  const headings = [
    "case_id",
    "created_at",
    "animal",
    "urgency",
    "situation",
    "status",
    "latitude",
    "longitude",
    "location_source",
    "place",
  ];
  const rows = records.map((record) =>
    [
      record.id,
      record.createdAt,
      record.animal,
      record.urgency,
      record.situation,
      record.status,
      record.latitude,
      record.longitude,
      record.locationSource,
      record.place,
    ]
      .map(csvCell)
      .join(","),
  );
  return [headings.map(csvCell).join(","), ...rows].join("\r\n");
}

function copyTextWithFallback(text: string) {
  if (typeof document === "undefined") return false;

  const textArea = document.createElement("textarea");
  textArea.value = text;
  textArea.setAttribute("readonly", "");
  textArea.style.position = "fixed";
  textArea.style.top = "0";
  textArea.style.left = "0";
  textArea.style.opacity = "0";
  document.body.appendChild(textArea);
  textArea.focus();
  textArea.select();

  let copied = false;
  try {
    copied = document.execCommand("copy");
  } catch {
    copied = false;
  }

  document.body.removeChild(textArea);
  return copied;
}

const snakeIdentities: SnakeIdentity[] = [
  {
    id: "unknown",
    name: "Not sure / cannot see safely",
    danger: "Treat as dangerous",
    cues: "The safest and most useful answer. Do not move closer for a better look.",
  },
  {
    id: "sea-snake",
    name: "Sea snake",
    danger: "Treat as highly venomous",
    cues: "In the sea, surf or washed ashore; often has a flattened, paddle-shaped tail.",
  },
  {
    id: "brown",
    name: "Eastern brown or brown-looking snake",
    danger: "Treat as highly venomous",
    cues: "Often slender and fast-moving, but colour can be brown, orange, grey or almost black. Colour alone cannot identify it.",
  },
  {
    id: "red-bellied-black",
    name: "Red-bellied black or similar black snake",
    danger: "Treat as highly venomous",
    cues: "Glossy black above, sometimes with red or pink visible along the lower sides; often near water. Other dangerous snakes can look similar.",
  },
  {
    id: "carpet-python",
    name: "Carpet python",
    danger: "Non-venomous — still keep back",
    cues: "Usually heavy-bodied, olive to brown, with cream and dark blotches forming a repeated pattern.",
  },
  {
    id: "tree-snake",
    name: "Common or green tree snake",
    danger: "Non-venomous — still keep back",
    cues: "Very slender and agile with a long whip-like tail. Colour varies widely from green and olive to brown, black or blue.",
  },
  {
    id: "other",
    name: "Other / does not match",
    danger: "Treat as dangerous",
    cues: "South-east Queensland has many other snake species, including highly venomous ones.",
  },
];

const animals: Animal[] = [
  {
    id: "koala",
    icon: "🐨",
    name: "Koala",
    question: "What is the koala doing?",
    hint: "A frightened or injured koala can cause serious scratches with its claws. Keep people and dogs well back.",
    paths: [
      {
        label: "On the ground",
        urgency: "now",
        headline: "Keep back and call now",
        do: ["Bring dogs and people inside or well away", "Keep the exact tree or spot in view", "Call Wildlife Rescue Minjerribah"],
        avoid: ["Do not pick it up or crowd it", "Do not stand between it and a tree"],
        tags: ["grounded", "urgent"],
      },
      {
        label: "Hit or visibly injured",
        urgency: "now",
        headline: "Make the area safe and call now",
        do: ["Use hazard lights if you are safely off the road", "Watch from a safe distance", "Record which way it moves"],
        avoid: ["Do not enter traffic", "Do not chase or handle it"],
        tags: ["injured", "possible vehicle strike"],
      },
      {
        label: "In a yard with dogs",
        urgency: "now",
        headline: "Secure the dogs and call",
        do: ["Bring every dog inside", "Keep the koala’s escape route clear", "Watch from inside if possible"],
        avoid: ["Do not approach or try to move it"],
        tags: ["dog risk"],
      },
      {
        label: "In a tree and looks well",
        urgency: "watch",
        headline: "A healthy sighting can be logged",
        do: ["Photograph from a distance if safe", "Note the tree and time"],
        avoid: ["Do not disturb it for a better photo"],
        tags: ["sighting"],
      },
    ],
  },
  {
    id: "kangaroo",
    icon: "🦘",
    name: "Kangaroo",
    question: "Which best describes the kangaroo?",
    hint: "Kangaroos are powerful wild animals. Never corner one: it can kick, scratch and cause severe injury.",
    paths: [
      {
        label: "Alive, cannot get up",
        urgency: "now",
        headline: "Keep well back and call now",
        do: ["Keep dogs and onlookers away", "Use hazard lights only from a safe position", "Keep its location in view"],
        avoid: ["Do not corner it — a frightened roo can kick", "Do not enter traffic"],
        tags: ["grounded", "urgent"],
      },
      {
        label: "Moving but hurt",
        urgency: "now",
        headline: "Watch its direction and call",
        do: ["Stay well back", "Note direction, speed and visible injuries", "Record each new location"],
        avoid: ["Do not follow closely or chase it"],
        tags: ["mobile", "injured"],
      },
      {
        label: "Recently dead or not moving",
        urgency: "now",
        headline: "Report immediately — a joey may still be saved",
        do: ["Treat a recently dead kangaroo as urgent", "Mark the exact spot", "Stay safely clear of traffic", "Call trained rescuers immediately"],
        avoid: ["Do not check the pouch", "Do not move the animal"],
        tags: ["possible pouch young"],
      },
      {
        label: "Looks healthy",
        urgency: "watch",
        headline: "Log the sighting if useful",
        do: ["Give it space", "Note location and direction"],
        avoid: ["Do not approach for a photograph"],
        tags: ["sighting"],
      },
    ],
  },
  {
    id: "wallaby",
    icon: "🦘",
    name: "Wallaby",
    question: "Which best describes the wallaby?",
    hint: "An injured or cornered wallaby may kick, scratch or bite. Give it a clear escape route.",
    paths: [
      {
        label: "Alive, cannot get up",
        urgency: "now",
        headline: "Let it settle and call now",
        do: ["Keep dogs and people away", "Watch quietly from a distance", "Mark the exact location"],
        avoid: ["Do not chase, corner or handle it"],
        tags: ["grounded", "urgent"],
      },
      {
        label: "Moving but hurt",
        urgency: "now",
        headline: "Watch its direction and call",
        do: ["Note which way it travels", "Record visible injuries", "Keep a safe distance"],
        avoid: ["Do not follow closely"],
        tags: ["mobile", "injured"],
      },
      {
        label: "Recently dead or not moving",
        urgency: "now",
        headline: "Report immediately — a joey may still be saved",
        do: ["Treat a recently dead wallaby as urgent", "Mark the exact spot", "Stay clear of traffic", "Call trained rescuers immediately"],
        avoid: ["Do not check the pouch or move the animal"],
        tags: ["possible pouch young"],
      },
      {
        label: "Looks healthy",
        urgency: "watch",
        headline: "Give it space",
        do: ["Log a sighting if it adds useful information"],
        avoid: ["Do not approach or feed it"],
        tags: ["sighting"],
      },
    ],
  },
  {
    id: "echidna",
    icon: "🦔",
    name: "Echidna",
    question: "What is happening?",
    paths: [
      {
        label: "Hurt or on a road",
        urgency: "now",
        headline: "Mark the spot and call",
        do: ["Keep dogs away", "Watch from a safe place", "Record its original location"],
        avoid: ["Do not move it or place anything over it"],
        tags: ["injured"],
      },
      {
        label: "Dug itself in",
        urgency: "soon",
        headline: "Give it quiet space",
        do: ["Move people and pets away", "Call for advice"],
        avoid: ["Do not dig it out or pull at its legs"],
        tags: ["sheltering"],
      },
      {
        label: "Wandering and looks well",
        urgency: "watch",
        headline: "Let it continue",
        do: ["Keep dogs away", "Log the sighting from a distance"],
        avoid: ["Do not relocate it"],
        tags: ["sighting"],
      },
    ],
  },
  {
    id: "possum",
    icon: "🌙",
    name: "Possum or glider",
    question: "What have you noticed?",
    paths: [
      {
        label: "On the ground or out in daylight",
        urgency: "now",
        headline: "Keep pets in and call",
        do: ["Watch from a distance", "Record whether it can climb or move"],
        avoid: ["Do not touch, box or feed it"],
        tags: ["abnormal behaviour"],
      },
      {
        label: "Caught by a cat or dog",
        urgency: "now",
        headline: "Call even if it looks unhurt",
        do: ["Secure the pet inside", "Keep the animal in sight from a distance"],
        avoid: ["Do not handle it"],
        tags: ["pet attack", "urgent"],
      },
      {
        label: "Baby alone",
        urgency: "now",
        headline: "Watch quietly and call",
        do: ["Keep pets inside", "Watch from indoors if possible", "Note whether an adult returns"],
        avoid: ["Do not touch or move it"],
        tags: ["young animal"],
      },
      {
        label: "Healthy at night",
        urgency: "watch",
        headline: "A normal night-time sighting",
        do: ["Give it space and keep pets inside"],
        avoid: ["Do not feed it"],
        tags: ["sighting"],
      },
    ],
  },
  {
    id: "snake",
    icon: "🐍",
    name: "Snake",
    question: "Where is the snake?",
    hint: "Do not move closer to identify or photograph it. Treat an unknown snake as dangerous.",
    paths: [
      {
        label: "Inside a building",
        urgency: "emergency",
        headline: "Move people and pets away",
        do: ["Leave the room if you can do so safely", "Close the internal door", "Watch possible exits from well away", "Call for a licensed snake catcher"],
        avoid: ["Do not trap, follow, touch or approach it", "If anyone may have been bitten, call 000"],
        tags: ["dangerous animal", "inside"],
      },
      {
        label: "Yard, campsite or public space",
        urgency: "now",
        headline: "Clear the area and call",
        do: ["Bring children and pets inside", "Watch from a secure distance", "Tell others not to approach"],
        avoid: ["Do not try to identify, catch or move it"],
        tags: ["dangerous animal"],
      },
      {
        label: "Road or bush",
        urgency: "soon",
        headline: "Give it a wide path",
        do: ["Stay well back", "Let it move away", "Call if it is injured or cannot leave"],
        avoid: ["Do not block its escape"],
        tags: ["sighting"],
      },
      {
        label: "Beach, rocks or water",
        urgency: "now",
        headline: "Keep clear of the waterline and call",
        do: ["Keep people, children and dogs well away", "Note whether it is in the water, surf or above the high-tide line", "Photograph only from your existing safe distance"],
        avoid: ["Do not touch it, push it into the water or assume it is dead", "Do not stand between it and open water"],
        tags: ["possible sea snake", "dangerous animal"],
      },
      {
        label: "Injured or trapped",
        urgency: "now",
        headline: "Keep everyone back and call",
        do: ["Mark the location from a safe distance", "Call trained responders"],
        avoid: ["Do not approach regardless of species"],
        tags: ["injured", "dangerous animal"],
      },
    ],
  },
  {
    id: "goanna",
    icon: "🦎",
    name: "Goanna",
    question: "What is the goanna doing?",
    hint: "Goannas have powerful claws, teeth and tails. An injured or cornered goanna can cause serious injury.",
    paths: [
      {
        label: "Hurt",
        urgency: "now",
        headline: "Keep back and call",
        do: ["Secure dogs and move people well away", "Note its exact location and movement"],
        avoid: ["Do not corner, handle or block its escape", "Keep hands and face well clear"],
        tags: ["injured", "claw and bite risk"],
      },
      {
        label: "Stuck or trapped",
        urgency: "now",
        headline: "Keep the area quiet and call",
        do: ["Keep people and dogs away", "Photograph the situation from a distance"],
        avoid: ["Do not pull or cut anything unless directed", "Do not try to restrain it"],
        tags: ["trapped", "claw and bite risk"],
      },
      {
        label: "Just visiting",
        urgency: "watch",
        headline: "Give it time to move on",
        do: ["Bring dogs inside", "Leave an open escape route"],
        avoid: ["Do not feed, chase or corner it"],
        tags: ["sighting"],
      },
    ],
  },
  {
    id: "blue-tongue",
    icon: "🦎",
    name: "Blue-tongue lizard",
    question: "What is the blue-tongue doing?",
    hint: "Blue-tongues are not venomous, but a distressed wild animal may still bite. Do not pick it up.",
    paths: [
      {
        label: "Hurt",
        urgency: "now",
        headline: "Keep pets back and call",
        do: ["Note its exact location", "Watch from a comfortable distance"],
        avoid: ["Do not pick it up, feed it or put it in a box"],
        tags: ["injured"],
      },
      {
        label: "Stuck or trapped",
        urgency: "now",
        headline: "Leave the rescue to a responder",
        do: ["Keep people and pets away", "Photograph what has trapped it from a distance"],
        avoid: ["Do not pull, cut or handle it unless a responder directs you"],
        tags: ["trapped"],
      },
      {
        label: "Just visiting",
        urgency: "watch",
        headline: "Give it time to move on",
        do: ["Bring pets inside", "Leave an open escape route"],
        avoid: ["Do not chase, feed or relocate it"],
        tags: ["sighting"],
      },
    ],
  },
  {
    id: "turtle",
    icon: "🐢",
    name: "Sea turtle",
    question: "What is happening?",
    paths: [
      {
        label: "Washed up or stranded",
        urgency: "now",
        headline: "Keep the beach clear and call",
        do: ["Keep crowds, dogs and drones well back", "Record landmarks and the exact beach position", "Call the marine stranding hotline too"],
        avoid: ["Do not push it into the water or pour anything on it"],
        tags: ["marine stranding"],
      },
      {
        label: "Tangled in line or net",
        urgency: "now",
        headline: "Do not pull the line",
        do: ["Keep people and dogs back", "Photograph the entanglement from a safe distance", "Call responders and the marine hotline"],
        avoid: ["Do not cut, pull or remove hooks"],
        tags: ["entanglement"],
      },
      {
        label: "Hatchlings out",
        urgency: "now",
        headline: "Darken and clear the path",
        do: ["Turn off nearby lights", "Keep people and dogs away", "Call immediately"],
        avoid: ["Do not pick up or shepherd hatchlings"],
        tags: ["hatchlings"],
      },
      {
        label: "Swimming oddly",
        urgency: "soon",
        headline: "Keep watch from shore",
        do: ["Note its direction", "Record a distant photo or video", "Call with your observations"],
        avoid: ["Do not enter the water to approach it"],
        tags: ["mobile", "marine"],
      },
    ],
  },
  {
    id: "marine-mammal",
    icon: "🐋",
    name: "Dolphin, whale or dugong",
    question: "What are you seeing?",
    paths: [
      {
        label: "Stranded or in the shallows",
        urgency: "now",
        headline: "Keep well back and call both numbers",
        do: ["Clear people, dogs and drones", "Note landmarks and tide conditions", "Call Wildlife Rescue and the marine hotline"],
        avoid: ["Do not push it out or try to hold it upright"],
        tags: ["marine stranding"],
      },
      {
        label: "Tangled",
        urgency: "now",
        headline: "Track from a safe distance",
        do: ["Note direction of travel", "Photograph or video without approaching", "Call both numbers"],
        avoid: ["Do not enter the water or pull trailing gear"],
        tags: ["entanglement", "mobile"],
      },
      {
        label: "Distressed or behaving oddly",
        urgency: "now",
        headline: "Observe and call",
        do: ["Note breathing, direction and nearby hazards", "Keep vessels and people away"],
        avoid: ["Do not approach by boat, board or drone"],
        tags: ["marine"],
      },
      {
        label: "Dead",
        urgency: "now",
        headline: "Keep clear and report it",
        do: ["Mark the exact location", "Call both response numbers"],
        avoid: ["Do not touch or allow dogs near it"],
        tags: ["deceased", "marine"],
      },
    ],
  },
  {
    id: "shark",
    icon: "🦈",
    name: "Shark or ray",
    question: "What are you seeing?",
    hint: "Do not enter the water or approach the head, mouth or tail. A stranded or entangled shark or ray can thrash without warning.",
    paths: [
      {
        label: "Stranded or washed up",
        urgency: "now",
        headline: "Clear the area and call now",
        do: ["Keep people and dogs well away", "Mark the exact beach position and tide line", "Call Wildlife Rescue Minjerribah"],
        avoid: ["Do not touch, drag or push it into the water", "Do not stand near its head or tail"],
        tags: ["marine stranding", "dangerous animal"],
      },
      {
        label: "Tangled or hooked",
        urgency: "now",
        headline: "Keep clear and call now",
        do: ["Record the gear and exact location from shore or a secure position", "Keep other water users away"],
        avoid: ["Do not enter the water, pull the line or remove hooks", "Do not attempt to restrain it"],
        tags: ["entanglement", "dangerous animal"],
      },
      {
        label: "Distressed in shallow water",
        urgency: "now",
        headline: "Get everyone out and call",
        do: ["Tell people to leave the water calmly", "Watch its direction from land", "Call Wildlife Rescue Minjerribah"],
        avoid: ["Do not wade, swim or paddle closer", "Do not herd it towards open water"],
        tags: ["marine", "dangerous animal"],
      },
      {
        label: "Healthy sighting",
        urgency: "watch",
        headline: "Leave the water and give it space",
        do: ["Alert nearby water users or lifesavers", "Note its location and direction from land"],
        avoid: ["Do not follow it or enter the water for a photo"],
        tags: ["sighting", "marine"],
      },
    ],
  },
  {
    id: "pelican",
    icon: "🪿",
    name: "Pelican or large waterbird",
    question: "What is wrong?",
    hint: "Pelicans are waterbirds, not birds of prey. Their long beaks and powerful wings can injure your face or eyes when distressed.",
    paths: [
      {
        label: "Hooked or tangled",
        urgency: "now",
        headline: "Keep well back and call",
        do: ["Keep people and dogs away", "Watch where it moves", "Note any trailing line or hook"],
        avoid: ["Do not grab its beak, wings or neck", "Do not cut trailing line or pull a hook"],
        tags: ["fishing gear", "beak risk"],
      },
      {
        label: "Cannot fly or visibly hurt",
        urgency: "now",
        headline: "Give it room and call",
        do: ["Keep a clear circle around the bird", "Record whether a wing is drooping"],
        avoid: ["Do not chase, cover or throw it into the air", "Keep your face and eyes well away"],
        tags: ["grounded", "beak risk"],
      },
      {
        label: "Oiled or looks sick",
        urgency: "now",
        headline: "Do not touch it",
        do: ["Keep the area quiet", "Call with its exact location"],
        avoid: ["Do not wash, feed or handle it"],
        tags: ["sick"],
      },
      {
        label: "Healthy sighting",
        urgency: "watch",
        headline: "Give it normal space",
        do: ["Keep dogs away and let it move freely"],
        avoid: ["Do not feed or crowd it"],
        tags: ["sighting"],
      },
    ],
  },
  {
    id: "seabird",
    icon: "🪽",
    name: "Other seabird or shorebird",
    question: "What is wrong?",
    hint: "Any distressed bird may peck, scratch, flap or strike at eyes. Keep your face and hands away.",
    paths: [
      {
        label: "Hooked or tangled",
        urgency: "now",
        headline: "Keep it calm and call",
        do: ["Keep people and dogs back", "Keep watching if it moves", "Note any trailing line"],
        avoid: ["Do not cut it free or pull the hook"],
        tags: ["fishing gear"],
      },
      {
        label: "Cannot fly",
        urgency: "now",
        headline: "Give it space and call",
        do: ["Keep dogs leashed and people back", "Record whether a wing is drooping"],
        avoid: ["Do not chase or throw it into the air"],
        tags: ["grounded"],
      },
      {
        label: "Oiled or looks sick",
        urgency: "now",
        headline: "Do not touch it",
        do: ["Keep the area quiet", "Call with its exact location"],
        avoid: ["Do not wash, feed or handle it"],
        tags: ["sick"],
      },
      {
        label: "Chick alone",
        urgency: "watch",
        headline: "Watch from a distance",
        do: ["Keep dogs leashed", "Look for parents without moving closer", "Call if clearly hurt or still alone"],
        avoid: ["Do not move the chick"],
        tags: ["young animal"],
      },
    ],
  },
  {
    id: "land-bird",
    icon: "🐦",
    name: "Land bird",
    question: "What happened?",
    hint: "Any distressed bird may peck, scratch or strike at eyes. Do not handle it unless a trained responder directs you.",
    paths: [
      {
        label: "Hit a window or vehicle",
        urgency: "soon",
        headline: "Keep watch without approaching",
        do: ["Keep pets and people away", "Call sooner if it is bleeding or badly injured", "Note whether it recovers"],
        avoid: ["Do not throw it into the air"],
        tags: ["collision"],
      },
      {
        label: "Caught by a cat or dog",
        urgency: "now",
        headline: "Call even if it looks well",
        do: ["Secure the pet inside", "Keep the bird in sight from a distance"],
        avoid: ["Do not handle or release it yourself"],
        tags: ["pet attack", "urgent"],
      },
      {
        label: "Baby on the ground",
        urgency: "soon",
        headline: "Check from a distance",
        do: ["Keep pets inside", "Note whether it is feathered and whether parents return", "Call if bald, injured or alone near dusk"],
        avoid: ["Do not move it without advice"],
        tags: ["young animal"],
      },
      {
        label: "Tangled or hooked",
        urgency: "now",
        headline: "Keep it calm and call",
        do: ["Keep people and pets back", "Watch where it moves"],
        avoid: ["Do not cut it free or pull hooks"],
        tags: ["entanglement"],
      },
    ],
  },
  {
    id: "raptor",
    icon: "🦅",
    name: "Bird of prey",
    question: "What is happening?",
    paths: [
      {
        label: "Hurt or grounded",
        urgency: "now",
        headline: "Stay well back and call",
        do: ["Keep dogs and onlookers away", "Mark an exact landmark"],
        avoid: ["Do not approach, cover or handle it — talons can injure"],
        tags: ["grounded", "talon risk"],
      },
      {
        label: "Tangled or caught",
        urgency: "now",
        headline: "Clear the area and call",
        do: ["Photograph the situation from a distance", "Keep spectators away"],
        avoid: ["Do not cut or pull at the material"],
        tags: ["entanglement", "talon risk"],
      },
      {
        label: "Healthy sighting",
        urgency: "watch",
        headline: "Enjoy it from a distance",
        do: ["Log the sighting if useful"],
        avoid: ["Do not approach nests or roosts"],
        tags: ["sighting"],
      },
    ],
  },
  {
    id: "bat",
    icon: "🦇",
    name: "Flying-fox or bat",
    question: "What is happening?",
    hint: "Never touch a bat, even if it looks dead. Only vaccinated, trained handlers should approach.",
    paths: [
      {
        label: "On the ground or hurt",
        urgency: "emergency",
        headline: "Keep everyone and every pet away",
        do: ["Move people and pets well back", "Watch from a secure distance", "Call immediately"],
        avoid: ["Do not touch, cover or move it"],
        tags: ["human health risk"],
      },
      {
        label: "Caught on a fence or net",
        urgency: "emergency",
        headline: "Do not try to release it",
        do: ["Clear the area", "Call trained bat responders", "Note whether powerlines are involved"],
        avoid: ["Do not touch the bat or material around it"],
        tags: ["entanglement", "human health risk"],
      },
      {
        label: "Someone was scratched or bitten",
        urgency: "emergency",
        headline: "Wash the wound and seek urgent care",
        do: ["Wash thoroughly with soap and running water", "Seek urgent medical advice immediately", "Call 000 if the person is in immediate danger"],
        avoid: ["Do not delay medical assessment", "Do not try to catch the bat"],
        tags: ["human exposure"],
      },
      {
        label: "Several are sick or dead",
        urgency: "emergency",
        headline: "Keep clear and call",
        do: ["Keep people and pets away", "Record the number from a distance"],
        avoid: ["Do not touch any animal"],
        tags: ["multiple animals", "human health risk"],
      },
    ],
  },
  {
    id: "other",
    icon: "🐾",
    name: "Other animal",
    question: "Which is the safest description?",
    paths: [
      {
        label: "Injured, trapped or distressed",
        urgency: "now",
        headline: "Keep back and call",
        do: ["Keep people and pets away", "Record the location and what you can see"],
        avoid: ["Do not touch, feed or attempt a rescue"],
        tags: ["unidentified", "urgent"],
      },
      {
        label: "May be dangerous",
        urgency: "emergency",
        headline: "Move away and call",
        do: ["Put a solid barrier or safe distance between you and the animal", "Warn others without approaching"],
        avoid: ["Do not attempt to identify or contain it"],
        tags: ["unidentified", "dangerous animal"],
      },
      {
        label: "Looks healthy",
        urgency: "watch",
        headline: "Observe without disturbing it",
        do: ["Log a distant sighting if useful"],
        avoid: ["Do not approach or feed it"],
        tags: ["unidentified", "sighting"],
      },
    ],
  },
  {
    id: "unsure",
    icon: "◌",
    name: "Not sure",
    question: "What can you safely tell from where you are?",
    hint: "Not knowing the species never delays a call.",
    paths: [
      {
        label: "It looks hurt or cannot move",
        urgency: "now",
        headline: "Keep back and call",
        do: ["Keep people and pets away", "Mark the exact location", "Describe only what you can see safely"],
        avoid: ["Do not move closer to identify it"],
        tags: ["unidentified", "urgent"],
      },
      {
        label: "It may be dangerous",
        urgency: "emergency",
        headline: "Move everyone away",
        do: ["Get behind a solid barrier or increase distance", "Call from safety"],
        avoid: ["Do not approach, trap or photograph it up close"],
        tags: ["unidentified", "dangerous animal"],
      },
      {
        label: "It is moving normally",
        urgency: "watch",
        headline: "Watch from a respectful distance",
        do: ["Log a distant photo and location if useful"],
        avoid: ["Do not follow or disturb it"],
        tags: ["unidentified", "sighting"],
      },
    ],
  },
];

const urgencyLabels: Record<Urgency, string> = {
  emergency: "Danger — act now",
  now: "Call now",
  soon: "Call soon",
  watch: "Keep watch",
};

function TriageFlow({
  livePosition,
  droppedPosition,
  onClose,
  onSave,
}: {
  livePosition: Position | null;
  droppedPosition: Position | null;
  onClose: () => void;
  onSave: (record: CaseRecord) => void;
}) {
  const [step, setStep] = useState<"animal" | "snake-identify" | "question" | "action" | "report" | "saved">("animal");
  const [animal, setAnimal] = useState<Animal | null>(null);
  const [path, setPath] = useState<Path | null>(null);
  const [snakeIdentity, setSnakeIdentity] = useState<SnakeIdentity | null>(null);
  const [place, setPlace] = useState("");
  const [locationChoice, setLocationChoice] = useState<
    "gps" | "pin" | "description"
  >(droppedPosition ? "pin" : livePosition ? "gps" : "description");
  const [taggedPosition, setTaggedPosition] = useState<Position | null>(null);
  const [taggingPosition, setTaggingPosition] = useState(false);
  const [tagPositionMessage, setTagPositionMessage] = useState("");
  const [savedCase, setSavedCase] = useState<CaseRecord | null>(null);
  const [copyMessage, setCopyMessage] = useState("");
  const [showAlertText, setShowAlertText] = useState(false);

  function chooseAnimal(selected: Animal) {
    setAnimal(selected);
    setStep(selected.id === "snake" ? "snake-identify" : "question");
  }

  function chooseSnakeIdentity(selected: SnakeIdentity) {
    setSnakeIdentity(selected);
    setStep("question");
  }

  function choosePath(selected: Path) {
    setPath(selected);
    setStep("action");
  }

  function saveReport() {
    if (!animal || !path) return;
    const selectedPosition =
      locationChoice === "pin"
        ? droppedPosition
        : locationChoice === "gps"
          ? taggedPosition ?? livePosition
          : null;
    const id = `WRM-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
    const record: CaseRecord = {
      id,
      animal: animal.name,
      icon: animal.icon,
      urgency: path.urgency,
      situation:
        animal.id === "snake" && snakeIdentity
          ? `${snakeIdentity.name} · ${path.label}`
          : path.label,
      createdAt: new Date().toISOString(),
      latitude: selectedPosition?.latitude,
      longitude: selectedPosition?.longitude,
      place: place.trim(),
      status: path.urgency === "watch" ? "Sighting logged" : "Awaiting responder",
      locationSource: selectedPosition ? locationChoice : "description",
    };
    onSave(record);
    setSavedCase(record);
    setCopyMessage("");
    setShowAlertText(false);
    setStep("saved");
  }

  function tagCurrentPosition() {
    if (!navigator.geolocation) {
      setTagPositionMessage("This device cannot provide a GPS position.");
      return;
    }
    setTaggingPosition(true);
    setTagPositionMessage("Finding GPS, then improving accuracy…");
    let bestPosition: Position | null = null;
    let watchId: number | undefined;
    let timeoutId: number | undefined;

    const finish = () => {
      if (watchId !== undefined) navigator.geolocation.clearWatch(watchId);
      if (timeoutId !== undefined) window.clearTimeout(timeoutId);
      setTaggingPosition(false);
      if (bestPosition) {
        setTaggedPosition(bestPosition);
        setLocationChoice("gps");
        setTagPositionMessage(
          `Best position tagged · about ${Math.round(bestPosition.accuracy)} m accuracy`,
        );
      } else {
        setTagPositionMessage(
          "GPS was not available. Add a landmark or go back and drop a map pin.",
        );
      }
    };

    watchId = navigator.geolocation.watchPosition(
      (result) => {
        const position = {
          latitude: result.coords.latitude,
          longitude: result.coords.longitude,
          accuracy: result.coords.accuracy,
        };
        if (!bestPosition || position.accuracy < bestPosition.accuracy) {
          bestPosition = position;
          setTaggedPosition(position);
          setLocationChoice("gps");
        }
        setTagPositionMessage(
          position.accuracy <= 20
            ? `Good GPS fix · about ${Math.round(position.accuracy)} m`
            : `Improving accuracy… best about ${Math.round(bestPosition.accuracy)} m`,
        );
        if (position.accuracy <= 20) finish();
      },
      () => {
        finish();
      },
      { enableHighAccuracy: true, maximumAge: 0, timeout: 15000 },
    );
    timeoutId = window.setTimeout(finish, 12000);
  }

  async function copyAlert() {
    if (!savedCase) return;
    const alertText = formatCaseAlert(savedCase);

    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(alertText);
        setCopyMessage("Copied. Paste it into SMS, WhatsApp or the rescue chat.");
        setShowAlertText(false);
        return;
      }
    } catch {
      // iPhone in-app browsers can block clipboard writes even from a tap.
    }

    const copiedByFallback = copyTextWithFallback(alertText);
    setCopyMessage(
      copiedByFallback
        ? "Copied. Paste it into SMS, WhatsApp or the rescue chat."
        : "Could not auto-copy here. Press and hold the alert text below, then copy.",
    );
    setShowAlertText(true);
    return;

    const location =
      savedCase.latitude !== undefined
        ? `${savedCase.latitude.toFixed(5)}, ${savedCase.longitude?.toFixed(5)}`
        : savedCase.place || "Location needs confirmation";
    const text = `WRM ALERT · ${savedCase.animal.toUpperCase()} · ${urgencyLabels[savedCase.urgency].toUpperCase()}
${savedCase.situation}
${location}
Case: ${savedCase.id}

[WRM-DATA]${btoa(unescape(encodeURIComponent(JSON.stringify(savedCase))))}[/WRM-DATA]`;
    await navigator.clipboard?.writeText(text);
  }

  function goBack() {
    if (step === "question") setStep("animal");
    if (step === "question" && animal?.id === "snake") setStep("snake-identify");
    if (step === "snake-identify") setStep("animal");
    if (step === "action") setStep("question");
    if (step === "report") setStep("action");
    if (step === "saved") onClose();
  }

  return (
    <motion.div
      className="flow-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="flow-sheet"
        initial={{ y: "12%" }}
        animate={{ y: 0 }}
        exit={{ y: "12%" }}
        transition={{ type: "spring", damping: 28, stiffness: 260 }}
      >
        <header className="flow-header">
          <button className="icon-button" onClick={goBack} aria-label="Go back">
            <ArrowLeft size={22} />
          </button>
          <div className="progress-pips" aria-label="Triage progress">
            {(animal?.id === "snake"
              ? ["animal", "snake-identify", "question", "action", "report"]
              : ["animal", "question", "action", "report"]
            ).map((item) => (
              <span key={item} className={item === step ? "active" : ""} />
            ))}
          </div>
          <button className="icon-button" onClick={onClose} aria-label="Close">
            <X size={22} />
          </button>
        </header>

        <div className="flow-body">
          <AnimatePresence mode="wait">
            {step === "animal" && (
              <motion.div key="animal" className="flow-page" initial={{ opacity: 0, x: 18 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -18 }}>
                <span className="eyebrow">First, from a safe distance</span>
                <h2>What animal can you see?</h2>
                <p className="lead">It is okay not to know. Never move closer just to identify it.</p>
                <div className="universal-safety">
                  <ShieldAlert size={20} />
                  <span><strong>Injured, trapped or distressed?</strong> Assume it may defend itself. Keep your face, hands, children and pets well away.</span>
                </div>
                <div className="animal-grid">
                  {animals.map((item) => (
                    <button key={item.id} className="animal-choice" onClick={() => chooseAnimal(item)}>
                      <span className="animal-emoji">{item.icon}</span>
                      <span>{item.name}</span>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            {step === "question" && animal && (
              <motion.div key="question" className="flow-page" initial={{ opacity: 0, x: 18 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -18 }}>
                <span className="animal-hero">{animal.icon}</span>
                <span className="eyebrow">{animal.name}</span>
                <h2>{animal.question}</h2>
                <div className="safety-note">
                  <ShieldAlert size={19} />
                  <span>{animal.hint ?? "An injured, trapped or distressed wild animal may defend itself. Keep back and do not handle it."}</span>
                </div>
                <div className="path-list">
                  {animal.paths.map((item) => (
                    <button key={item.label} className="path-choice" onClick={() => choosePath(item)}>
                      <span>{item.label}</span>
                      <ChevronRight size={20} />
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            {step === "snake-identify" && animal?.id === "snake" && (
              <motion.div key="snake-identify" className="flow-page" initial={{ opacity: 0, x: 18 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -18 }}>
                <span className="animal-hero">🐍</span>
                <span className="eyebrow">Only from where you already are</span>
                <h2>Which is the closest match?</h2>
                <div className="safety-note"><ShieldAlert size={19} /><span>Never move closer to identify a snake. A visual match is only a clue, not proof that it is safe.</span></div>
                <div className="snake-identity-list">
                  {snakeIdentities.map((identity) => (
                    <button
                      key={identity.id}
                      className={`snake-identity-choice ${identity.id === "unknown" ? "safest-choice" : ""}`}
                      onClick={() => chooseSnakeIdentity(identity)}
                    >
                      <span>
                        <strong>{identity.name}</strong>
                        <small>{identity.cues}</small>
                        <em className={identity.danger.startsWith("Non-venomous") ? "low-danger" : ""}>{identity.danger}</em>
                      </span>
                      <ChevronRight size={20} />
                    </button>
                  ))}
                </div>
                <p className="source-note">Draft identification cues based on Queensland Government guidance. Wildlife Rescue Minjerribah must confirm the island species list.</p>
              </motion.div>
            )}

            {step === "action" && animal && path && (
              <motion.div key="action" className="flow-page" initial={{ opacity: 0, x: 18 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -18 }}>
                <div className={`urgency-badge urgency-${path.urgency}`}>
                  <Radio size={17} />
                  {urgencyLabels[path.urgency]}
                </div>
                {animal.id === "snake" && snakeIdentity && (
                  <div className="identity-result">
                    <span>Possible identification</span>
                    <strong>{snakeIdentity.name}</strong>
                    <small>{snakeIdentity.danger}</small>
                  </div>
                )}
                <h2>{path.headline}</h2>
                <p className="lead">Your safety comes first. Only do what you can from a safe position.</p>

                {animal.id === "snake" && (
                  <div className="snake-bite-alert">
                    <strong>Possible bite?</strong>
                    <span>Call 000 immediately. Keep the person still. Do not wash the bite or try to catch the snake.</span>
                  </div>
                )}

                <div className="action-card do-card">
                  <strong><Check size={18} /> Do this now</strong>
                  {path.do.map((item) => <p key={item}>{item}</p>)}
                </div>
                <div className="action-card avoid-card">
                  <strong><X size={18} /> Avoid</strong>
                  {path.avoid.map((item) => <p key={item}>{item}</p>)}
                </div>

                <a className="primary-call" href={`tel:${CONTACT_NUMBER}`}>
                  <Phone size={20} fill="currentColor" />
                  Call Wildlife Rescue
                  <span>0448 466 556</span>
                </a>
                {(animal.id === "turtle" || animal.id === "marine-mammal") && (
                  <a className="secondary-call" href={`tel:${MARINE_NUMBER}`}>
                    Marine stranding hotline · 1300 130 372
                  </a>
                )}
                <button className="continue-button" onClick={() => setStep("report")}>
                  Record accurate details <ChevronRight size={20} />
                </button>
              </motion.div>
            )}

            {step === "report" && animal && path && (
              <motion.div key="report" className="flow-page" initial={{ opacity: 0, x: 18 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -18 }}>
                <span className="eyebrow">Help responders find it quickly</span>
                <h2>Where exactly is the animal?</h2>
                {livePosition || taggedPosition ? (
                  <label className="gps-choice">
                    <input
                      type="radio"
                      name="location-choice"
                      checked={locationChoice === "gps"}
                      onChange={() => setLocationChoice("gps")}
                    />
                    <span className="gps-icon"><Crosshair size={20} /></span>
                    <span>
                      <strong>Use my current GPS</strong>
                      <small>
                        Accurate to about{" "}
                        {Math.round((taggedPosition ?? livePosition)!.accuracy)} metres
                        {taggedPosition ? " · one-time tag" : ""}
                      </small>
                    </span>
                  </label>
                ) : (
                  <div className="tag-position-card">
                    <LocateFixed size={21} />
                    <span>
                      <strong>At the animal now?</strong>
                      <small>Save one GPS position without turning on live map tracking.</small>
                    </span>
                    <button
                      type="button"
                      onClick={tagCurrentPosition}
                      disabled={taggingPosition}
                    >
                      {taggingPosition ? "Finding…" : "Tag my position"}
                    </button>
                    {tagPositionMessage && <p>{tagPositionMessage}</p>}
                  </div>
                )}

                {droppedPosition && (
                  <label className="gps-choice pin-choice">
                    <input
                      type="radio"
                      name="location-choice"
                      checked={locationChoice === "pin"}
                      onChange={() => setLocationChoice("pin")}
                    />
                    <span className="gps-icon"><MapPin size={20} /></span>
                    <span>
                      <strong>Use the pin I dropped</strong>
                      <small>
                        {droppedPosition.latitude.toFixed(5)},{" "}
                        {droppedPosition.longitude.toFixed(5)}
                      </small>
                    </span>
                  </label>
                )}

                <label className="text-field">
                  <span>Landmark or place {locationChoice !== "description" ? "(helpful)" : ""}</span>
                  <textarea
                    value={place}
                    onChange={(event) => setPlace(event.target.value)}
                    placeholder="For example: north side of East Coast Road, opposite the Brown Lake turn-off"
                    rows={4}
                  />
                  <small>Road side, direction of travel and a nearby landmark save responder time.</small>
                </label>

                <div className="accuracy-prompts">
                  <span>Before saving, notice:</span>
                  <div><i /> Is it still there?</div>
                  <div><i /> Can it move? Which direction?</div>
                  <div><i /> Is traffic, water, wire or a pet involved?</div>
                </div>

                <button
                  className="save-button"
                  onClick={saveReport}
                  disabled={locationChoice === "description" && !place.trim()}
                >
                  Save case on this phone
                </button>
              </motion.div>
            )}

            {step === "saved" && savedCase && (
              <motion.div key="saved" className="flow-page saved-page" initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }}>
                <motion.div className="success-mark" initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", delay: 0.1 }}>
                  <Check size={34} />
                </motion.div>
                <span className="eyebrow">Saved offline</span>
                <h2>{savedCase.animal} case created</h2>
                <div className="case-code">{savedCase.id}</div>
                <p className="lead">This report is safely stored on this phone. Copy the alert into a text or group chat to hand it over.</p>
                <button className="share-button" onClick={copyAlert}>
                  <Clipboard size={20} />
                  Copy responder alert
                </button>
                <a className="sms-button" href={smsHref(savedCase)}>
                  <Send size={20} />
                  Text Wildlife Rescue
                </a>
                {copyMessage && <p className="copy-feedback">{copyMessage}</p>}
                {showAlertText && (
                  <label className="copy-fallback">
                    <span>Responder alert text</span>
                    <textarea
                      readOnly
                      value={formatCaseAlert(savedCase)}
                      onFocus={(event) => event.target.select()}
                    />
                  </label>
                )}
                <button className="continue-button" onClick={onClose}>Back to the map</button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="draft-strip">
          <Sparkles size={14} />
          Draft guidance awaiting Wildlife Rescue Minjerribah review
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function Home() {
  const [locationEnabled, setLocationEnabled] = useState(false);
  const [livePosition, setLivePosition] = useState<Position | null>(null);
  const [droppedPosition, setDroppedPosition] = useState<Position | null>(null);
  const [locationMessage, setLocationMessage] = useState("");
  const [triageOpen, setTriageOpen] = useState(false);
  const [cases, setCases] = useState<CaseRecord[]>([]);
  const [activeTab, setActiveTab] = useState<"map" | "cases">("map");
  const [importText, setImportText] = useState("");
  const [caseMessage, setCaseMessage] = useState("");
  const [deletePendingId, setDeletePendingId] = useState<string | null>(null);
  const [caseQuery, setCaseQuery] = useState("");
  const [animalFilter, setAnimalFilter] = useState("all");
  const [caseSort, setCaseSort] = useState<"newest" | "oldest" | "animal" | "case">("newest");

  useEffect(() => {
    const saved = localStorage.getItem("wrm-cases");
    if (saved) {
      try {
        setCases(JSON.parse(saved));
      } catch {
        localStorage.removeItem("wrm-cases");
      }
    }
    const isLocalPreview = ["localhost", "127.0.0.1"].includes(
      window.location.hostname,
    );
    if ("serviceWorker" in navigator && !isLocalPreview) {
      navigator.serviceWorker.register("/sw.js").catch(() => undefined);
    }
    if (window.location.hash === "#cases") {
      setActiveTab("cases");
    }
  }, []);

  useEffect(() => {
    if (!locationEnabled || !navigator.geolocation) return;
    const watch = navigator.geolocation.watchPosition(
      (result) => {
        setLivePosition({
          latitude: result.coords.latitude,
          longitude: result.coords.longitude,
          accuracy: result.coords.accuracy,
        });
        setLocationMessage(`Location found · about ${Math.round(result.coords.accuracy)} m accuracy`);
        window.setTimeout(() => setLocationMessage(""), 3200);
      },
      () => {
        setLocationEnabled(false);
        setLocationMessage("Location permission was not available");
      },
      { enableHighAccuracy: true, maximumAge: 10000, timeout: 15000 },
    );
    return () => navigator.geolocation.clearWatch(watch);
  }, [locationEnabled]);

  function toggleLocation() {
    if (!navigator.geolocation) {
      setLocationMessage("This device does not provide GPS location");
      return;
    }
    setLocationEnabled((current) => !current);
    if (locationEnabled) {
      setLivePosition(null);
      setLocationMessage("Your live location is off");
    } else {
      setLocationMessage("Finding your location…");
    }
  }

  function saveCase(record: CaseRecord) {
    setCases((current) => {
      const next = [record, ...current];
      localStorage.setItem("wrm-cases", JSON.stringify(next));
      return next;
    });
    if (record.locationSource === "pin") {
      setDroppedPosition(null);
    }
  }

  function dropIncidentPin(position: Position) {
    setDroppedPosition(position);
    setTriageOpen(true);
  }

  async function copyCaseAlert(record: CaseRecord) {
    await navigator.clipboard?.writeText(formatCaseAlert(record));
    setCaseMessage(`${record.id} alert copied`);
    window.setTimeout(() => setCaseMessage(""), 2600);
  }

  function importCaseAlert() {
    const record = extractCaseFromAlert(importText);
    if (!record) {
      setCaseMessage("No WRM case data found in that text");
      return;
    }

    setCases((current) => {
      const withoutDuplicate = current.filter((item) => item.id !== record.id);
      const next = [record, ...withoutDuplicate];
      localStorage.setItem("wrm-cases", JSON.stringify(next));
      return next;
    });
    setImportText("");
    setCaseMessage(`${record.id} imported onto this phone`);
    window.setTimeout(() => setCaseMessage(""), 3200);
  }

  function deleteLocalCase(record: CaseRecord) {
    if (deletePendingId !== record.id) {
      setDeletePendingId(record.id);
      setCaseMessage(`Tap delete again to remove ${record.id} from this phone`);
      return;
    }

    setCases((current) => {
      const next = current.filter((item) => item.id !== record.id);
      localStorage.setItem("wrm-cases", JSON.stringify(next));
      return next;
    });
    setDeletePendingId(null);
    setCaseMessage(`${record.id} deleted from this phone`);
    window.setTimeout(() => setCaseMessage(""), 3200);
  }

  function exportFieldArchive() {
    const date = new Date().toISOString().slice(0, 10);
    const archive = {
      format: "wrm-field-archive",
      version: 1,
      exportedAt: new Date().toISOString(),
      cases,
    };
    downloadFile(
      `wrm-field-archive-${date}.json`,
      JSON.stringify(archive, null, 2),
      "application/json",
    );
    setCaseMessage(`${cases.length} cases backed up`);
  }

  function exportCasesCsv() {
    const date = new Date().toISOString().slice(0, 10);
    downloadFile(
      `wrm-cases-${date}.csv`,
      casesToCsv(cases),
      "text/csv;charset=utf-8",
    );
    setCaseMessage(`${cases.length} cases exported for reporting`);
  }

  async function importFieldArchive(file: File | undefined) {
    if (!file) return;
    try {
      const parsed = JSON.parse(await file.text());
      if (
        parsed?.format !== "wrm-field-archive" ||
        !Array.isArray(parsed?.cases)
      ) {
        throw new Error("Not a WRM archive");
      }
      const imported = parsed.cases.filter(
        (record: CaseRecord) =>
          typeof record?.id === "string" &&
          typeof record?.animal === "string" &&
          typeof record?.createdAt === "string",
      ) as CaseRecord[];
      setCases((current) => {
        const merged = new Map(current.map((record) => [record.id, record]));
        imported.forEach((record) => merged.set(record.id, record));
        const next = [...merged.values()].sort((left, right) =>
          right.createdAt.localeCompare(left.createdAt),
        );
        localStorage.setItem("wrm-cases", JSON.stringify(next));
        return next;
      });
      setCaseMessage(`${imported.length} archived cases merged onto this device`);
    } catch {
      setCaseMessage("That file is not a valid WRM Field Archive");
    }
  }

  const caseAnimals = useMemo(
    () => [...new Set(cases.map((record) => record.animal))].sort(),
    [cases],
  );
  const filteredCases = useMemo(() => {
    const query = caseQuery.trim().toLocaleLowerCase("en-AU");
    const filtered = cases.filter((record) => {
      const matchesAnimal =
        animalFilter === "all" || record.animal === animalFilter;
      const haystack = [
        record.id,
        record.animal,
        record.situation,
        record.place,
        record.status,
      ]
        .join(" ")
        .toLocaleLowerCase("en-AU");
      return matchesAnimal && (!query || haystack.includes(query));
    });
    return filtered.sort((left, right) => {
      if (caseSort === "oldest") return left.createdAt.localeCompare(right.createdAt);
      if (caseSort === "animal") return left.animal.localeCompare(right.animal);
      if (caseSort === "case") return left.id.localeCompare(right.id);
      return right.createdAt.localeCompare(left.createdAt);
    });
  }, [animalFilter, caseQuery, caseSort, cases]);

  return (
    <main className="app-shell">
      <header className="topbar">
        <div className="brand">
          <span className="brand-mark">W</span>
          <div>
            <strong>Wildlife Rescue</strong>
            <span>MINJERRIBAH</span>
          </div>
        </div>
        <a className="call-pill" href={`tel:${CONTACT_NUMBER}`} aria-label="Call Wildlife Rescue Minjerribah">
          <Phone size={17} fill="currentColor" />
          <span>Call rescue</span>
        </a>
      </header>

      <AnimatePresence mode="wait">
        {activeTab === "map" ? (
          <motion.div className="map-tab-frame" key="map-tab" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="map-tab">
              <RealMap
              livePosition={livePosition}
              locationEnabled={locationEnabled}
              locationMessage={locationMessage}
              onToggleLocation={toggleLocation}
              droppedPosition={droppedPosition}
              onDropPosition={dropIncidentPin}
              cases={cases}
              />

            <section className="help-panel">
              <span className="eyebrow">Safety first · takes about 30 seconds</span>
              <h1>Wildlife needs help?</h1>
              <p>Tell us what you can see. We’ll help you stay safe and collect what a responder needs.</p>
              <button className="start-button" onClick={() => setTriageOpen(true)}>
                <span className="start-icon"><Plus size={27} /></span>
                <span>
                  <strong>Start a wildlife report</strong>
                  <small>Injured, distressed or dangerous animal</small>
                </span>
                <ChevronRight size={22} />
              </button>
              <div className="quick-actions">
                <button onClick={() => setTriageOpen(true)}>
                  <span>🐾</span>
                  Log a sighting
                </button>
                <button onClick={() => setActiveTab("cases")}>
                  <span>◎</span>
                  Open cases
                </button>
              </div>
              </section>
            </div>
          </motion.div>
        ) : (
          <motion.section id="cases-top" className="cases-page" key="cases-tab" initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }}>
            <span className="eyebrow">Stored only on this phone</span>
            <h1>Cases & sightings</h1>
            <p className="lead">Local records remain available without reception.</p>
            <details className="app-guide">
              <summary>
                <Info size={18} />
                How offline storage and sharing work
              </summary>
              <div>
                <h2>Private by design</h2>
                <p>
                  The app shell and offline map are kept in the browser cache.
                  Cases are stored separately in this browser on this device.
                  There is no WRM database, account or automatic upload.
                </p>
                <p className="guide-warning">
                  Clearing this website’s browser data, deleting the app, or
                  losing the phone may delete its local cases. Export a Field
                  Archive regularly.
                </p>
                <h2>Share one case</h2>
                <p>
                  Tap SMS to send the WRM alert. The receiver opens the Cases
                  page, pastes the complete text into the alert field, and
                  imports it onto their device.
                </p>
                <h2>Keep the organisation’s history</h2>
                <p>
                  Nominate one WRM-owned phone or laptop as the archive keeper.
                  Import alerts sent by volunteers, then download a dated Field
                  Archive after each shift or rescue period. Keep copies in two
                  organisation-controlled locations.
                </p>
                <p>
                  The CSV export opens in Excel or other spreadsheet tools for
                  reporting, grants, outcome summaries, maps and visualisations.
                </p>
              </div>
            </details>
            <section className="sms-import-panel" aria-label="Import a WRM alert">
              <label className="text-field">
                <span>Paste a WRM alert text</span>
                <textarea
                  value={importText}
                  onChange={(event) => setImportText(event.target.value)}
                  placeholder="Paste the SMS or group-chat alert here"
                  rows={3}
                />
              </label>
              <button className="import-button" onClick={importCaseAlert} disabled={!importText.trim()}>
                <Upload size={18} />
                Import case to this phone
              </button>
              {caseMessage && <p className="case-message">{caseMessage}</p>}
            </section>
            {cases.length > 0 && (
              <div className="case-tools" aria-label="Find and sort cases">
                <label className="case-search">
                  <Search size={14} />
                  <input
                    value={caseQuery}
                    onChange={(event) => setCaseQuery(event.target.value)}
                    placeholder="Case / type / place"
                    aria-label="Search cases"
                  />
                </label>
                <select
                  value={animalFilter}
                  onChange={(event) => setAnimalFilter(event.target.value)}
                  aria-label="Filter by animal"
                >
                  <option value="all">All animals</option>
                  {caseAnimals.map((animalName) => (
                    <option key={animalName} value={animalName}>{animalName}</option>
                  ))}
                </select>
                <select
                  value={caseSort}
                  onChange={(event) =>
                    setCaseSort(event.target.value as typeof caseSort)
                  }
                  aria-label="Sort cases"
                >
                  <option value="newest">Newest</option>
                  <option value="oldest">Oldest</option>
                  <option value="animal">Animal A–Z</option>
                  <option value="case">Case ID</option>
                </select>
                <a href="#field-archive">Export ↓</a>
              </div>
            )}
            {filteredCases.length ? (
              <div className="case-list">
                {filteredCases.map((item) => (
                  <article className="case-row" key={item.id}>
                    <span className="case-animal">{item.icon}</span>
                    <div>
                      <strong>{item.animal}</strong>
                      <span>{item.situation}</span>
                      <small>{item.id} · {new Date(item.createdAt).toLocaleString("en-AU")}</small>
                      <span className="case-location">
                        {item.latitude !== undefined
                          ? `${item.latitude.toFixed(5)}, ${item.longitude?.toFixed(5)}`
                          : item.place || "Location needs confirmation"}
                      </span>
                      <span className="case-actions">
                        <button onClick={() => copyCaseAlert(item)}>
                          <Clipboard size={15} />
                          Copy
                        </button>
                        <a href={smsHref(item)}>
                          <Send size={15} />
                          SMS
                        </a>
                        <button
                          className={deletePendingId === item.id ? "danger" : ""}
                          onClick={() => deleteLocalCase(item)}
                        >
                          <Trash2 size={15} />
                          {deletePendingId === item.id ? "Sure?" : "Delete"}
                        </button>
                      </span>
                    </div>
                    <i className={`status-light urgency-${item.urgency}`} />
                  </article>
                ))}
              </div>
            ) : cases.length ? (
              <div className="empty-state compact-empty">
                <span>⌕</span>
                <strong>No matching cases</strong>
                <button
                  onClick={() => {
                    setCaseQuery("");
                    setAnimalFilter("all");
                  }}
                >
                  Clear filters
                </button>
              </div>
            ) : (
              <div className="empty-state">
                <span>🐾</span>
                <strong>No cases on this phone yet</strong>
                <p>Reports you save offline will appear here.</p>
                <button onClick={() => setTriageOpen(true)}>Start a report</button>
              </div>
            )}
            <section id="field-archive" className="field-archive-panel" aria-label="WRM Field Archive">
              <div>
                <span className="eyebrow">Long-term records</span>
                <h2>WRM Field Archive</h2>
                <p>Back up every case on this device or prepare the data for reports.</p>
              </div>
              <div className="archive-actions">
                <button onClick={exportFieldArchive} disabled={!cases.length}>
                  <Download size={17} />
                  Backup archive
                </button>
                <button onClick={exportCasesCsv} disabled={!cases.length}>
                  <Download size={17} />
                  Reporting CSV
                </button>
                <label>
                  <Upload size={17} />
                  Merge archive
                  <input
                    type="file"
                    accept="application/json,.json"
                    onChange={(event) => {
                      void importFieldArchive(event.target.files?.[0]);
                      event.target.value = "";
                    }}
                  />
                </label>
              </div>
              <a className="back-to-cases" href="#cases-top">↑ Top</a>
            </section>
          </motion.section>
        )}
      </AnimatePresence>

      <nav className="bottom-nav" aria-label="Main navigation">
        <button className={activeTab === "map" ? "active" : ""} onClick={() => setActiveTab("map")}>
          <MapIcon size={21} />
          <span>Map</span>
        </button>
        <button className="rescue-nav" onClick={() => setTriageOpen(true)} aria-label="New report">
          <Plus size={26} />
        </button>
        <button className={activeTab === "cases" ? "active" : ""} onClick={() => setActiveTab("cases")}>
          <Radio size={21} />
          <span>Cases</span>
        </button>
      </nav>

      <AnimatePresence>
        {triageOpen && (
          <TriageFlow
            livePosition={livePosition}
            droppedPosition={droppedPosition}
            onClose={() => setTriageOpen(false)}
            onSave={saveCase}
          />
        )}
      </AnimatePresence>
    </main>
  );
}
