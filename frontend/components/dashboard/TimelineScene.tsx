"use client";

import React, { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { Canvas, useThree, useFrame } from "@react-three/fiber";
import {
  Html,
  Text,
  Billboard,
  Box,
  Sphere,
  Cylinder,
  Torus,
  Image as DreiImage
} from "@react-three/drei";
import { useDropzone } from "react-dropzone";
import * as THREE from "three";
import { useBiographyStore } from "../../store/biographyStore";
import { useMediaUpload } from "../../hooks/useMediaUpload";
import { structureChapter } from "../../lib/api";
import type { Message, MediaItem } from "../../types/biography";
import { UserRound } from "lucide-react";

const CURVE_POINTS = [
  new THREE.Vector3(-4.5, 0.4, 0),   // Childhood (0%)
  new THREE.Vector3(-1.5, -0.4, 0),  // Youth (33%)
  new THREE.Vector3(1.5, 0.5, 0),    // Adulthood (66%)
  new THREE.Vector3(4.5, -0.2, 0),   // Legacy (100%)
];

// 1. Camera Controller follows progress along spline
function CameraController({ progress, lastActiveRef }: { progress: number; lastActiveRef: React.RefObject<number> }) {
  const { camera } = useThree();

  useFrame((state) => {
    // Pan camera horizontally based on scroll progress
    const targetX = (progress - 0.5) * 8.0;
    const targetCamPos = new THREE.Vector3(targetX, 0.2, 4.8);
    camera.position.lerp(targetCamPos, 0.08);

    // Look straight ahead at the timeline plane
    const targetLookAt = new THREE.Vector3(camera.position.x, 0, 0);
    camera.lookAt(targetLookAt);

    // Auto-sway when idle
    const elapsed = state.clock.getElapsedTime();
    const idleTime = elapsed * 1000 - (lastActiveRef.current ?? 0);
    if (idleTime > 4000) {
      const swayY = Math.sin(elapsed * 0.35) * 0.08;
      camera.position.y = 0.2 + swayY;
    }
  });

  return null;
}

// 2. Gold floating particle background
function FloatingParticles() {
  const count = 80;
  const meshRef = useRef<THREE.Points>(null);

  const particles = useMemo(() => {
    const temp = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      temp[i * 3] = (Math.random() - 0.5) * 12;
      temp[i * 3 + 1] = (Math.random() - 0.5) * 6;
      temp[i * 3 + 2] = (Math.random() - 0.5) * 2;
    }
    return temp;
  }, []);

  useFrame((state) => {
    if (!meshRef.current) return;
    const elapsed = state.clock.getElapsedTime();
    const positions = meshRef.current.geometry.attributes.position.array as Float32Array;
    for (let i = 0; i < count; i++) {
      positions[i * 3 + 1] -= 0.003; // slowly fall
      if (positions[i * 3 + 1] < -3) positions[i * 3 + 1] = 3; // respawn at top
      positions[i * 3] += Math.sin(elapsed + i) * 0.001; // drift horizontally
    }
    meshRef.current.geometry.attributes.position.needsUpdate = true;
  });

  return (
    <points ref={meshRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[particles, 3]}
          count={count}
          array={particles}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial color="#a67c2e" size={0.06} transparent opacity={0.35} />
    </points>
  );
}

// 3. Winding Timeline Tube Mesh
function TimelineTube() {
  const curve = useMemo(() => new THREE.CatmullRomCurve3(CURVE_POINTS), []);
  return (
    <mesh castShadow receiveShadow>
      <tubeGeometry args={[curve, 64, 0.03, 8, false]} />
      <meshStandardMaterial color="#D4AF37" metalness={0.9} roughness={0.1} emissive="#D4AF37" emissiveIntensity={0.2} />
    </mesh>
  );
}

// 4. Life Stages Marker Nodes with vertical pins and labels matching mockup
function StageMarkers() {
  const curve = useMemo(() => new THREE.CatmullRomCurve3(CURVE_POINTS), []);
  const stages = [
    { progress: 0.35, label: "Childhood", hasPost: true, postHeight: 0.7, color: "#d4a853" },
    { progress: 0.94, label: "Youth", hasPost: false, postHeight: 0, color: "#1c0f2e" },
  ];

  return (
    <>
      {stages.map((stage) => {
        const pathPos = curve.getPointAt(stage.progress);
        const nodeY = stage.postHeight;
        
        return (
          <group key={stage.label} position={[pathPos.x, pathPos.y, 0]}>
            {/* Vertical pin line connecting curve to circle */}
            {stage.hasPost && (
              <mesh position={[0, stage.postHeight / 2, 0]}>
                <boxGeometry args={[0.02, stage.postHeight, 0.01]} />
                <meshStandardMaterial color="#d4a853" />
              </mesh>
            )}

            {/* Small golden dot on the curve connection point */}
            <Sphere args={[0.07, 16, 16]} position={[0, 0, 0]}>
              <meshStandardMaterial color="#d4a853" />
            </Sphere>

            {/* Circle user icon floating node */}
            <group position={[0, stage.postHeight + 0.3, 0]}>
              {/* Gold Diamond */}
              <group position={[0, 0.45, 0]} rotation={[Math.PI / 4, Math.PI / 4, 0]}>
                <Box args={[0.12, 0.12, 0.12]}>
                  <meshStandardMaterial color="#d4a853" metalness={0.9} roughness={0.1} />
                </Box>
              </group>

              {/* Label Text */}
              <Text
                position={[0, 0.8, 0]}
                fontSize={0.24}
                color="#8c6214"
                anchorX="center"
                anchorY="middle"
                font="/fonts/CormorantGaramond-Bold.ttf"
              >
                {stage.label}
              </Text>

              {/* Circular Avatar button */}
              <Html position={[0, 0, 0]} center>
                <div className="h-10 w-10 rounded-full border border-[#d4a853] bg-[#fdfbf7] flex items-center justify-center shadow-lg text-gold-dim">
                  <UserRound className="h-5 w-5 text-[#a67c2e]" />
                </div>
              </Html>
            </group>
          </group>
        );
      })}
    </>
  );
}

// 4b. Paths diamonds matching the gold/purple diamonds on timeline curve
function PathDecorations() {
  const curve = useMemo(() => new THREE.CatmullRomCurve3(CURVE_POINTS), []);
  const decos = [
    { progress: 0.15, color: "#d4a853" },
    { progress: 0.22, color: "#d4a853" },
    { progress: 0.52, color: "#2a1048" },
    { progress: 0.65, color: "#2a1048" },
    { progress: 0.82, color: "#2a1048" },
  ];

  return (
    <>
      {decos.map((d, i) => {
        const pos = curve.getPointAt(d.progress);
        return (
          <group key={i} position={[pos.x, pos.y, 0]} rotation={[Math.PI / 4, Math.PI / 4, 0]}>
            <Box args={[0.09, 0.09, 0.09]}>
              <meshStandardMaterial color={d.color} metalness={0.8} roughness={0.2} />
            </Box>
          </group>
        );
      })}
    </>
  );
}

// 4c. Axis Year line ticks (1980 - 2020) running horizontally underneath path
function TimelineTicks() {
  const years = [
    { year: "1980", x: -4.0 },
    { year: "1990", x: -1.7 },
    { year: "2000", x: 0.6 },
    { year: "2010", x: 2.8 },
    { year: "2020", x: 4.5 },
  ];
  return (
    <group position={[0, -0.8, 0]}>
      {/* Main axis horizontal line */}
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[10, 0.012, 0.01]} />
        <meshStandardMaterial color="#d4a853" opacity={0.22} transparent />
      </mesh>
      {years.map((y) => (
        <group key={y.year} position={[y.x, 0, 0]}>
          {/* Tick mark line */}
          <mesh position={[0, 0.05, 0]}>
            <boxGeometry args={[0.012, 0.12, 0.01]} />
            <meshStandardMaterial color="#d4a853" opacity={0.3} transparent />
          </mesh>
          {/* Year Label */}
          <Text
            position={[0, -0.22, 0]}
            fontSize={0.14}
            color="#8b7250"
          >
            {y.year}
          </Text>
        </group>
      ))}
    </group>
  );
}

// 5. 3D Memory Artifact Mesh
function MemoryArtifact({
  message,
  onInspect,
}: {
  message: Message;
  onInspect: (msg: Message) => void;
}) {
  const store = useBiographyStore();
  const [hovered, setHovered] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const initialPos = (message.metadata as any)?.position3d || [0, 0.2, 0];
  const [pos, setPos] = useState<[number, number, number]>(
    Array.isArray(initialPos) ? [initialPos[0], initialPos[1], initialPos[2]] : [0, 0.2, 0]
  );

  const angle = useMemo(() => (Math.random() * 0.4 - 0.2), []);

  const imageMedia = message.media?.find((m) => m.type === "image");
  const videoMedia = message.media?.find((m) => m.type === "video");
  const audioMedia = message.media?.find((m) => m.type === "audio");

  const scale = hovered ? 1.15 : 1.0;

  const { raycaster } = useThree();
  const plane = useMemo(() => new THREE.Plane(new THREE.Vector3(0, 0, 1), 0), []);

  const handlePointerDown = (e: any) => {
    e.stopPropagation();
    e.target.setPointerCapture(e.pointerId);
    setIsDragging(true);
  };

  const handlePointerUp = (e: any) => {
    e.stopPropagation();
    e.target.releasePointerCapture(e.pointerId);
    setIsDragging(false);
    // Update final position in store to persist
    store.updateMessageMetadata(message.id, { position3d: pos });
  };

  const handlePointerMove = (e: any) => {
    if (!isDragging) return;
    e.stopPropagation();
    const target = new THREE.Vector3();
    raycaster.ray.intersectPlane(plane, target);
    setPos([target.x, target.y, 0]);
  };

  return (
    <group
      position={pos}
      rotation={[0, angle, 0]}
      scale={scale}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHovered(true);
      }}
      onPointerOut={() => setHovered(false)}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerMove={handlePointerMove}
      onClick={(e) => {
        e.stopPropagation();
        if (!isDragging) onInspect(message);
      }}
    >
      {/* 3D Model representation based on memory content type */}
      {imageMedia ? (
        // Polaroid Frame Model
        <group>
          <Box args={[1.1, 1.3, 0.06]} castShadow>
            <meshStandardMaterial color={hovered ? "#ffdca1" : "#fffdf7"} roughness={0.6} />
          </Box>
          <DreiImage
            url={imageMedia.url}
            position={[0, 0.1, 0.035]}
            scale={[0.95, 0.95]}
            transparent
            opacity={0.95}
          />
          {/* Polaroid paper clip */}
          <Box args={[0.15, 0.2, 0.04]} position={[0, 0.65, 0.04]} rotation={[0, 0, -0.1]}>
            <meshStandardMaterial color="#c0c0c0" metalness={0.7} />
          </Box>
        </group>
      ) : videoMedia ? (
        // Blue Glass video slab
        <group>
          <Box args={[1.1, 0.9, 0.08]} castShadow>
            <meshStandardMaterial color="#1a5f7a" transparent opacity={0.7} roughness={0.1} metalness={0.9} />
          </Box>
          {/* Glowing Play Icon */}
          <Torus args={[0.14, 0.03, 8, 16]} position={[0, 0, 0.05]} rotation={[Math.PI / 2, 0, 0]}>
            <meshStandardMaterial color="#ffd875" emissive="#ffd875" emissiveIntensity={0.5} />
          </Torus>
        </group>
      ) : audioMedia ? (
        // Cassette Tape Model constructed from primitives
        <group>
          <Box args={[1.0, 0.6, 0.08]} castShadow>
            <meshStandardMaterial color="#2d2d2d" roughness={0.3} metalness={0.6} />
          </Box>
          {/* Cassette Label sticker */}
          <Box args={[0.6, 0.35, 0.01]} position={[0, 0.05, 0.042]}>
            <meshStandardMaterial color="#fffbe6" roughness={0.8} />
          </Box>
          {/* Spindle Reels */}
          <Cylinder args={[0.08, 0.08, 0.09, 12]} position={[-0.18, 0.05, 0.01]} rotation={[Math.PI / 2, 0, 0]}>
            <meshStandardMaterial color="#D4AF37" />
          </Cylinder>
          <Cylinder args={[0.08, 0.08, 0.09, 12]} position={[0.18, 0.05, 0.01]} rotation={[Math.PI / 2, 0, 0]}>
            <meshStandardMaterial color="#D4AF37" />
          </Cylinder>
        </group>
      ) : (
        // Scroll / Note Paper cylinder representation
        <group>
          <Cylinder args={[0.12, 0.12, 0.9, 16]} rotation={[0, 0, Math.PI / 2]} castShadow>
            <meshStandardMaterial color={hovered ? "#ffe8b3" : "#f2e6cf"} roughness={0.7} />
          </Cylinder>
          {/* Tie Ribbon */}
          <Torus args={[0.125, 0.02, 6, 12]} position={[0, 0, 0]} rotation={[0, 0, 0]}>
            <meshStandardMaterial color="#aa2f38" roughness={0.5} />
          </Torus>
        </group>
      )}

      {/* Floating title above memory */}
      <Billboard position={[0, 0.8, 0]}>
        <Text fontSize={0.14} color="#ffe69a">
          {message.content ? message.content.substring(0, 16) + "..." : "Keepsake"}
        </Text>
      </Billboard>
    </group>
  );
}

// 6. Interactive Raycast Plane for Double-Clicks to Inscribe Notes
function InteractionPlane({ onCanvasClick }: { onCanvasClick: (pos: [number, number, number]) => void }) {
  const planeRef = useRef<THREE.Mesh>(null);
  return (
    <mesh
      ref={planeRef}
      rotation={[0, 0, 0]}
      position={[0, 0, 0]}
      onDoubleClick={(e) => {
        e.stopPropagation();
        onCanvasClick([e.point.x, e.point.y, 0]);
      }}
      receiveShadow
    >
      <planeGeometry args={[100, 100]} />
      <meshStandardMaterial visible={false} />
    </mesh>
  );
}

// MAIN 3D TIMELINE SCENE COMPONENT
export default function TimelineScene({
  onInspectMessage
}: {
  onInspectMessage: (msg: Message) => void;
}) {
  const store = useBiographyStore();
  const { currentChapterId, currentBiographyId, currentUser, messages } = store;
  const { upload, isUploading } = useMediaUpload(currentChapterId);

  const [progress, setProgress] = useState(0.0);
  const [activeInputPos, setActiveInputPos] = useState<[number, number, number] | null>(null);

  const lastActiveRef = useRef(Date.now());
  const curve = useMemo(() => new THREE.CatmullRomCurve3(CURVE_POINTS), []);

  // Update activity stamp for idle triggers
  useEffect(() => {
    const ping = () => { lastActiveRef.current = Date.now(); };
    window.addEventListener("pointermove", ping);
    return () => window.removeEventListener("pointermove", ping);
  }, []);

  // Capture wheel events on canvas to scroll path forward/backward
  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      setProgress((prev) => {
        const step = e.deltaY * 0.00035;
        return Math.max(0.0, Math.min(1.0, prev + step));
      });
    };
    window.addEventListener("wheel", handleWheel);
    return () => window.removeEventListener("wheel", handleWheel);
  }, []);

  const handleCanvasClick = (pos: [number, number, number]) => {
    setActiveInputPos(pos);
  };

  const handleSaveNote = async (text: string) => {
    if (!text.trim() || !activeInputPos) return;

    const userMsgId = crypto.randomUUID();
    const aiMsgId = crypto.randomUUID();

    const userMessage: Message = {
      id: userMsgId,
      chapterId: currentChapterId,
      sender: "user",
      content: text.trim(),
      timestamp: new Date(),
      isEdited: false,
      metadata: {
        position3d: activeInputPos,
        curveProgress: progress
      } as any
    };

    const assistantMessage: Message = {
      id: aiMsgId,
      chapterId: currentChapterId,
      sender: "ai",
      content: "The quill is shaping this note in the scroll archives...",
      timestamp: new Date(),
      isEdited: false,
      metadata: {
        position3d: [activeInputPos[0], activeInputPos[1] + 0.8, activeInputPos[2]],
        curveProgress: progress
      } as any
    };

    store.addMessage(userMessage);
    store.addMessage(assistantMessage);
    setActiveInputPos(null);

    // Silent AI integration
    try {
      if (currentBiographyId) {
        const narrative = await structureChapter(currentBiographyId, currentChapterId, currentUser.id);
        store.updatePreviewNarrative({
          chapterId: currentChapterId,
          chapterTitle: narrative.chapter_title,
          narrativeText: narrative.narrative_text,
          keyThemes: narrative.key_themes,
          suggestedMediaTags: narrative.suggested_media_tags
        });
        store.completeAiMessage(narrative.narrative_text);
      }
    } catch (err) {
      console.error(err);
      store.completeAiMessage("Your memory note has been safely pinned.");
    }
  };

  // Filter memories matching the active chapter that have 3D positions
  const activeChapterMessages = useMemo(() => {
    return messages.filter(
      (m) => m.chapterId === currentChapterId && ((m.metadata as any)?.position3d || m.media?.length)
    );
  }, [messages, currentChapterId]);

  return (
    <div className="relative w-full h-full bg-transparent overflow-hidden select-none p-4">
      {/* Dashed golden border outline */}
      <div className="absolute inset-4 border-2 border-dashed border-[#a67c2e]/45 rounded-3xl pointer-events-none z-10" />

      {/* 3D R3F Canvas Container */}
      <Canvas shadows camera={{ position: [0, 0, 6], fov: 45 }} dpr={[1, 2]} gl={{ alpha: true }}>
        <ambientLight intensity={1.1} color="#f5cf70" />
        {/* PointLight that follows the editor coordinate offset */}
        <pointLight position={[0, 4, 2]} intensity={1.5} color="#ffd875" castShadow />
        
        {/* 3D Timeline Tube */}
        <TimelineTube />

        {/* Floating golden dust particles */}
        <FloatingParticles />

        {/* Stage Markers Label nodes */}
        <StageMarkers />

        {/* Path gold/purple diamonds and ticks axis */}
        <PathDecorations />
        <TimelineTicks />

        {/* Render 3D items inside active chapter */}
        {activeChapterMessages.map((msg) => (
          <MemoryArtifact key={msg.id} message={msg} onInspect={onInspectMessage} />
        ))}

        {/* Double-click interaction grid helper */}
        <InteractionPlane onCanvasClick={handleCanvasClick} />

        {/* Camera glide scroll animator */}
        <CameraController progress={progress} lastActiveRef={lastActiveRef} />

        {/* Floating Click-to-Write Textarea in 3D Space */}
        {activeInputPos && (
          <Html position={activeInputPos} center>
            <div className="parchment-texture border-2 border-gold/40 p-4 rounded-xl shadow-2xl w-72 bg-[#fcf9f2] text-ink z-50">
              <textarea
                autoFocus
                placeholder="Inscribe a memory at this point..."
                className="w-full h-24 bg-transparent text-sm font-serif outline-none resize-none border-b border-gold/20 pb-2 mb-2 placeholder-ink/40"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSaveNote(e.currentTarget.value);
                  }
                }}
              />
              <div className="flex justify-between items-center text-[10px] uppercase tracking-wider text-gold-dim">
                <span>Press Enter to save</span>
                <button
                  type="button"
                  onClick={() => setActiveInputPos(null)}
                  className="text-red-700 font-bold hover:brightness-125"
                >
                  Cancel
                </button>
              </div>
            </div>
          </Html>
        )}
      </Canvas>

      {/* Floating HUD controls instruction */}
      <div className="absolute bottom-5 left-5 pointer-events-none select-none bg-black/40 border border-gold/10 px-3 py-1.5 rounded-lg backdrop-blur-md z-20">
        <p className="text-[10px] text-gold/60 uppercase tracking-widest">
          Mouse Wheel Scroll: Glide Along Timeline · Double-Click empty space: Write Note
        </p>
      </div>
    </div>
  );
}
