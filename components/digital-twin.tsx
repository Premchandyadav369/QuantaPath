"use client"

import { useRef, useState } from "react"
import { Canvas, useFrame } from "@react-three/fiber"
import { OrbitControls, Box, Sphere, Line } from "@react-three/drei"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import * as THREE from 'three'

function AnimatedVehicle({ startPos, endPos }: { startPos: [number, number, number], endPos: [number, number, number] }) {
  const meshRef = useRef<THREE.Mesh>(null!)
  const [progress, setProgress] = useState(0)

  useFrame((state, delta) => {
    setProgress((p) => {
      const np = p + delta * 0.2
      return np > 1 ? 0 : np
    })

    if (meshRef.current) {
      meshRef.current.position.lerpVectors(
        new THREE.Vector3(...startPos),
        new THREE.Vector3(...endPos),
        progress
      )
    }
  })

  return (
    <Box ref={meshRef} args={[0.3, 0.3, 0.5]} position={startPos}>
      <meshStandardMaterial color="red" />
    </Box>
  )
}

export function DigitalTwin3D() {
  const routePoints: [number, number, number][] = [
    [-2, 0, -2],
    [2, 0, -1],
    [1, 0, 2],
    [-3, 0, 1]
  ]

  return (
    <Card className="w-full h-[500px] flex flex-col">
      <CardHeader>
        <CardTitle>3D Logistics Digital Twin</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 p-0 overflow-hidden rounded-b-lg bg-slate-900">
        <Canvas camera={{ position: [0, 5, 5], fov: 50 }}>
          <ambientLight intensity={0.5} />
          <pointLight position={[10, 10, 10]} intensity={1} />

          <OrbitControls makeDefault />

          {/* Ground Plane */}
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.2, 0]}>
            <planeGeometry args={[10, 10]} />
            <meshStandardMaterial color="#2a3b4c" />
          </mesh>

          {/* Warehouses/Stops */}
          {routePoints.map((pos, i) => (
            <Sphere key={i} args={[0.2, 16, 16]} position={pos}>
              <meshStandardMaterial color="blue" />
            </Sphere>
          ))}

          {/* Route Lines */}
          <Line
            points={routePoints.map(p => new THREE.Vector3(...p))}
            color="white"
            lineWidth={2}
          />
          {/* Close the loop */}
          <Line
            points={[new THREE.Vector3(...routePoints[routePoints.length - 1]), new THREE.Vector3(...routePoints[0])]}
            color="white"
            lineWidth={2}
          />

          {/* Vehicles */}
          <AnimatedVehicle startPos={routePoints[0]} endPos={routePoints[1]} />
          <AnimatedVehicle startPos={routePoints[2]} endPos={routePoints[3]} />

        </Canvas>
      </CardContent>
    </Card>
  )
}
