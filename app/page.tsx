"use client";

import {
  ArrowLeft,
  Check,
  ChevronRight,
  Clipboard,
  Crosshair,
  LocateFixed,
  Map as MapIcon,
  Navigation,
  Phone,
  Plus,
  Radio,
  ShieldAlert,
  Sparkles,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useMemo, useState } from "react";

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

type Position = {
  latitude: number;
  longitude: number;
  accuracy: number;
};

type CaseRecord = {
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
};

const CONTACT_NUMBER = "0448466556";
const MARINE_NUMBER = "1300130372";

const animals: Animal[] = [
  {
    id: "koala",
    icon: "🐨",
    name: "Koala",
    question: "What is the koala doing?",
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
        label: "Dead or not moving",
        urgency: "now",
        headline: "Call — a joey may still need help",
        do: ["Mark the exact spot", "Stay safely clear of traffic", "Call trained rescuers"],
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
        label: "Dead or not moving",
        urgency: "now",
        headline: "Call — a joey may still need help",
        do: ["Mark the exact spot", "Stay clear of traffic", "Call trained rescuers"],
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
    id: "lizard",
    icon: "🦎",
    name: "Goanna or blue-tongue",
    question: "What is happening?",
    paths: [
      {
        label: "Hurt",
        urgency: "now",
        headline: "Keep back and call",
        do: ["Secure dogs", "Note its exact location and movement"],
        avoid: ["Do not corner or handle it"],
        tags: ["injured"],
      },
      {
        label: "Stuck or trapped",
        urgency: "now",
        headline: "Keep the area quiet and call",
        do: ["Keep people and dogs away", "Photograph the situation from a distance"],
        avoid: ["Do not pull or cut anything unless directed"],
        tags: ["trapped"],
      },
      {
        label: "Just visiting",
        urgency: "watch",
        headline: "Give it time to move on",
        do: ["Bring dogs inside", "Leave an open escape route"],
        avoid: ["Do not feed or chase it"],
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
    id: "seabird",
    icon: "🪽",
    name: "Seabird or shorebird",
    question: "What is wrong?",
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

const mapPins = [
  { id: "demo-1", animal: "Koala", icon: "🐨", x: 30, y: 67, state: "watch" },
  { id: "demo-2", animal: "Seabird", icon: "🪽", x: 71, y: 25, state: "now" },
  { id: "demo-3", animal: "Wallaby", icon: "🦘", x: 53, y: 49, state: "soon" },
];

const urgencyLabels: Record<Urgency, string> = {
  emergency: "Danger — act now",
  now: "Call now",
  soon: "Call soon",
  watch: "Keep watch",
};

function positionOnMap(position: Position) {
  const west = 153.36;
  const east = 153.56;
  const north = -27.34;
  const south = -27.78;
  const x = Math.max(4, Math.min(96, ((position.longitude - west) / (east - west)) * 100));
  const y = Math.max(4, Math.min(96, ((north - position.latitude) / (north - south)) * 100));
  return { x, y };
}

function MapView({
  livePosition,
  locationEnabled,
  locationMessage,
  onToggleLocation,
  cases,
}: {
  livePosition: Position | null;
  locationEnabled: boolean;
  locationMessage: string;
  onToggleLocation: () => void;
  cases: CaseRecord[];
}) {
  const me = livePosition ? positionOnMap(livePosition) : null;
  const casePins = cases
    .filter((item) => item.latitude !== undefined && item.longitude !== undefined)
    .map((item) => ({
      ...item,
      ...positionOnMap({
        latitude: item.latitude!,
        longitude: item.longitude!,
        accuracy: 0,
      }),
    }));

  return (
    <section className="map-card" aria-label="Minjerribah wildlife map">
      <div className="map-surface">
        <div className="ocean-grain" />
        <div className="island-shadow" />
        <div className="island">
          <div className="lake lake-one" />
          <div className="lake lake-two" />
          <div className="track track-one" />
          <div className="track track-two" />
          <div className="track track-three" />
        </div>
        <span className="place-label point-lookout">Point Lookout</span>
        <span className="place-label amity">Amity</span>
        <span className="place-label dunwich">Dunwich</span>
        <span className="place-label brown-lake">Brown Lake</span>
        <span className="place-label main-beach">Main Beach</span>

        {mapPins.map((pin) => (
          <motion.button
            className={`map-pin pin-${pin.state}`}
            key={pin.id}
            style={{ left: `${pin.x}%`, top: `${pin.y}%` }}
            initial={{ scale: 0, y: 10 }}
            animate={{ scale: 1, y: 0 }}
            transition={{ type: "spring", delay: 0.15 }}
            aria-label={`${pin.animal} map marker`}
          >
            {pin.icon}
          </motion.button>
        ))}

        {casePins.map((pin) => (
          <button
            className={`map-pin pin-${pin.urgency}`}
            key={pin.id}
            style={{ left: `${pin.x}%`, top: `${pin.y}%` }}
            aria-label={`${pin.animal} saved case`}
          >
            {pin.icon}
          </button>
        ))}

        {me && (
          <motion.div
            className="my-location"
            style={{ left: `${me.x}%`, top: `${me.y}%` }}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            aria-label="Your current location"
          >
            <span className="accuracy-ring" />
            <span className="location-dot">
              <Navigation size={13} fill="currentColor" />
            </span>
          </motion.div>
        )}

        <div className="map-title">
          <span>MINJERRIBAH</span>
          <small>North Stradbroke Island</small>
        </div>

        <button
          type="button"
          className={`location-toggle ${locationEnabled ? "is-on" : ""}`}
          onClick={onToggleLocation}
          aria-pressed={locationEnabled}
        >
          <LocateFixed size={19} />
          <span>{locationEnabled ? "My location on" : "Show my location"}</span>
          <i aria-hidden="true" />
        </button>

        {locationMessage && <div className="map-toast">{locationMessage}</div>}
      </div>

      <div className="map-caption">
        <div>
          <span className="eyebrow">Island field map</span>
          <strong>{cases.length ? `${cases.length} saved on this phone` : "Ready offline"}</strong>
        </div>
        <div className="map-legend">
          <span><i className="legend-dot red" /> urgent</span>
          <span><i className="legend-dot amber" /> watch</span>
        </div>
      </div>
    </section>
  );
}

function TriageFlow({
  livePosition,
  onClose,
  onSave,
}: {
  livePosition: Position | null;
  onClose: () => void;
  onSave: (record: CaseRecord) => void;
}) {
  const [step, setStep] = useState<"animal" | "question" | "action" | "report" | "saved">("animal");
  const [animal, setAnimal] = useState<Animal | null>(null);
  const [path, setPath] = useState<Path | null>(null);
  const [place, setPlace] = useState("");
  const [useLocation, setUseLocation] = useState(Boolean(livePosition));
  const [savedCase, setSavedCase] = useState<CaseRecord | null>(null);

  function chooseAnimal(selected: Animal) {
    setAnimal(selected);
    setStep("question");
  }

  function choosePath(selected: Path) {
    setPath(selected);
    setStep("action");
  }

  function saveReport() {
    if (!animal || !path) return;
    const id = `WRM-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
    const record: CaseRecord = {
      id,
      animal: animal.name,
      icon: animal.icon,
      urgency: path.urgency,
      situation: path.label,
      createdAt: new Date().toISOString(),
      latitude: useLocation ? livePosition?.latitude : undefined,
      longitude: useLocation ? livePosition?.longitude : undefined,
      place: place.trim(),
      status: path.urgency === "watch" ? "Sighting logged" : "Awaiting responder",
    };
    onSave(record);
    setSavedCase(record);
    setStep("saved");
  }

  async function copyAlert() {
    if (!savedCase) return;
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
          <div className="progress-pips" aria-label={`Step ${["animal", "question", "action", "report", "saved"].indexOf(step) + 1} of 5`}>
            {["animal", "question", "action", "report"].map((item) => (
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
                {animal.hint && <div className="safety-note"><ShieldAlert size={19} /><span>{animal.hint}</span></div>}
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

            {step === "action" && animal && path && (
              <motion.div key="action" className="flow-page" initial={{ opacity: 0, x: 18 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -18 }}>
                <div className={`urgency-badge urgency-${path.urgency}`}>
                  <Radio size={17} />
                  {urgencyLabels[path.urgency]}
                </div>
                <h2>{path.headline}</h2>
                <p className="lead">Your safety comes first. Only do what you can from a safe position.</p>

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
                {livePosition ? (
                  <label className="gps-choice">
                    <input type="checkbox" checked={useLocation} onChange={(event) => setUseLocation(event.target.checked)} />
                    <span className="gps-icon"><Crosshair size={20} /></span>
                    <span>
                      <strong>Use my current GPS</strong>
                      <small>Accurate to about {Math.round(livePosition.accuracy)} metres</small>
                    </span>
                  </label>
                ) : (
                  <div className="safety-note"><LocateFixed size={19} /><span>Turn on “My location” from the map for an exact GPS point.</span></div>
                )}

                <label className="text-field">
                  <span>Landmark or place</span>
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

                <button className="save-button" onClick={saveReport} disabled={!useLocation && !place.trim()}>
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
  const [locationMessage, setLocationMessage] = useState("");
  const [triageOpen, setTriageOpen] = useState(false);
  const [cases, setCases] = useState<CaseRecord[]>([]);
  const [activeTab, setActiveTab] = useState<"map" | "cases">("map");

  useEffect(() => {
    const saved = localStorage.getItem("wrm-cases");
    if (saved) {
      try {
        setCases(JSON.parse(saved));
      } catch {
        localStorage.removeItem("wrm-cases");
      }
    }
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => undefined);
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
  }

  const recentCases = useMemo(() => cases.slice(0, 8), [cases]);

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
          <motion.div key="map-tab" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <MapView
              livePosition={livePosition}
              locationEnabled={locationEnabled}
              locationMessage={locationMessage}
              onToggleLocation={toggleLocation}
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
          </motion.div>
        ) : (
          <motion.section className="cases-page" key="cases-tab" initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }}>
            <span className="eyebrow">Stored only on this phone</span>
            <h1>Cases & sightings</h1>
            <p className="lead">Local records remain available without reception.</p>
            {recentCases.length ? (
              <div className="case-list">
                {recentCases.map((item) => (
                  <article className="case-row" key={item.id}>
                    <span className="case-animal">{item.icon}</span>
                    <div>
                      <strong>{item.animal}</strong>
                      <span>{item.situation}</span>
                      <small>{item.id} · {new Date(item.createdAt).toLocaleString("en-AU")}</small>
                    </div>
                    <i className={`status-light urgency-${item.urgency}`} />
                  </article>
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <span>🐾</span>
                <strong>No cases on this phone yet</strong>
                <p>Reports you save offline will appear here.</p>
                <button onClick={() => setTriageOpen(true)}>Start a report</button>
              </div>
            )}
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
            onClose={() => setTriageOpen(false)}
            onSave={saveCase}
          />
        )}
      </AnimatePresence>
    </main>
  );
}
