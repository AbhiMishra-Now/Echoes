"use client";
import { Html } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useRef, useState } from "react";
import * as THREE from "three";
import type { MemoryItem } from "../../types/scroll";
function Knot({ memory, position, onClick }: { memory: MemoryItem; position: [number, number, number]; onClick: (memory: MemoryItem) => void }) { const mesh = useRef<THREE.Mesh>(null); const [hover, setHover] = useState(false); useFrame(({ clock }) => { const pulse = 1 + Math.sin(clock.elapsedTime * 3 + memory.timestamp) * .12; if (mesh.current) mesh.current.scale.setScalar(pulse); }); return <mesh ref={mesh} position={position} onClick={() => onClick(memory)} onPointerOver={() => setHover(true)} onPointerOut={() => setHover(false)}><sphereGeometry args={[.1, 16, 16]}/><meshStandardMaterial color="#D4AF37" emissive="#9a6a06" emissiveIntensity={.8} metalness={.8}/>{hover && <Html distanceFactor={8}><span className="scroll-knot-tooltip">{memory.type === "audio" ? "Voice Note" : memory.type === "image" ? "Photo" : "Video"}</span></Html>}</mesh>; }
/** Clickable media waypoints, mapped from normalized chapter/timestamp coordinates. */
export function MemoryKnots({ memories, onMemoryClick }: { memories: MemoryItem[]; onMemoryClick: (memory: MemoryItem) => void }) { return <>{memories.map(memory => <Knot key={memory.id} memory={memory} onClick={onMemoryClick} position={[-1.55 + (memory.timestamp * 3.1), 1.55 - (memory.chapterIndex * .45), .12]}/>)}</>; }
