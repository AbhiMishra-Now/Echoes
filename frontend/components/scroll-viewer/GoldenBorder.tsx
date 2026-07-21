"use client";
import { useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
const vertex = "varying vec2 vUv; void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}";
const fragment = "uniform float time; varying vec2 vUv; void main(){float wave=.5+.5*sin((vUv.x+vUv.y)*28.0-time*3.0); vec3 gold=mix(vec3(.45,.25,.02),vec3(1.,.86,.32),wave); float edge=pow(1.-abs(vUv.y-.5)*2.,2.); gl_FragColor=vec4(gold,edge);}";
/** Procedural gold trim shader: the animated sine wave approximates moving metallic highlights. */
export function GoldenBorder({ width, height }: { width: number; height: number }) { const material = useMemo(() => new THREE.ShaderMaterial({ transparent: true, uniforms: { time: { value: 0 } }, vertexShader: vertex, fragmentShader: fragment }), []); useFrame(({ clock }) => { material.uniforms.time.value = clock.elapsedTime; }); return <group>{[[0, height / 2 - .12, width, .18], [0, -height / 2 + .12, width, .18], [-width / 2 + .12, 0, .18, height], [width / 2 - .12, 0, .18, height]].map(([x, y, w, h], index) => <mesh key={index} position={[x, y, .025]}><planeGeometry args={[w, h]}/><primitive object={material}/></mesh>)}</group>; }
