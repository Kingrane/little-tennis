import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { RoundedBox, Edges } from '@react-three/drei'
import * as THREE from 'three'
import { TABLE, PALETTE } from '@/utils/constants'

/**
 * Regulation table tennis table with premium finish.
 * Real dimensions: length 2.74m × width 1.525m × height 0.76m.
 * Soft emissive gold edge glow. Matte blue playing surface.
 */

/* Net — procedural mesh: a fine grid drawn with thin lines + emissive top. */
function Net() {
  const { length, netHeight } = TABLE

  // Build a grid of line segments as a single BufferGeometry (one draw call).
  const geo = useMemo(() => {
    const positions: number[] = []
    const cellsX = 60
    const cellsY = 12
    const w = length
    const h = netHeight

    // verticals
    for (let i = 0; i <= cellsX; i++) {
      const x = -w / 2 + (i / cellsX) * w
      positions.push(x, 0, 0, x, h, 0)
    }
    // horizontals
    for (let j = 0; j <= cellsY; j++) {
      const y = (j / cellsY) * h
      positions.push(-w / 2, y, 0, w / 2, y, 0)
    }

    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
    return g
  }, [length, netHeight])

  // Net sits on the centerline, top at TABLE.height + netHeight.
  const topY = TABLE.height + TABLE.netHeight
  const centerlineZ = 0

  return (
    <group position={[0, topY - TABLE.netHeight, centerlineZ]}>
      {/* Net mesh (line segments) */}
      <lineSegments geometry={geo}>
        <lineBasicMaterial
          color={'#F2EAD8'}
          transparent
          opacity={0.55}
        />
      </lineSegments>

      {/* Emissive top tape — gold */}
      <mesh position={[0, TABLE.netHeight + 0.004, 0]}>
        <boxGeometry args={[TABLE.length, 0.008, 0.004]} />
        <meshStandardMaterial
          color={PALETTE.gold}
          emissive={PALETTE.gold}
          emissiveIntensity={1.6}
          roughness={0.4}
        />
      </mesh>

      {/* Two posts */}
      {[-1, 1].map((s) => (
        <mesh
          key={s}
          position={[(s * TABLE.length) / 2, TABLE.netHeight / 2, 0]}
          castShadow
        >
          <cylinderGeometry args={[0.012, 0.012, TABLE.netHeight + 0.05, 16]} />
          <meshStandardMaterial color={PALETTE.gold} metalness={0.7} roughness={0.3} />
        </mesh>
      ))}
    </group>
  )
}

/* Table surface, frame, legs. */
function TableBody() {
  const { length, width, height, thickness, cornerRadius } = TABLE
  const topY = height

  return (
    <group>
      {/* Playing surface */}
      <RoundedBox
        args={[length, thickness, width]}
        radius={cornerRadius}
        smoothness={5}
        position={[0, topY, 0]}
        castShadow
        receiveShadow
      >
        <meshStandardMaterial
          color={PALETTE.blue}
          roughness={0.55}
          metalness={0.0}
          envMapIntensity={0.4}
        />
        {/* Soft gold emissive edges via Drei Edges */}
        <Edges threshold={15} color={PALETTE.gold}>
          <lineBasicMaterial
            color={PALETTE.gold}
            transparent
            opacity={0.85}
          />
        </Edges>
      </RoundedBox>

      {/* Emissive edge glow ring — slightly larger RoundedBox, additive */}
      <RoundedBox
        args={[length + 0.06, thickness + 0.04, width + 0.06]}
        radius={cornerRadius + 0.03}
        smoothness={5}
        position={[0, topY, 0]}
      >
        <meshBasicMaterial
          color={PALETTE.gold}
          transparent
          opacity={0.0}
        />
      </RoundedBox>

      {/* Center line (along length) */}
      <mesh position={[0, topY + thickness / 2 + 0.001, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[length, 0.02]} />
        <meshBasicMaterial color={'#FFFFFF'} transparent opacity={0.45} />
      </mesh>

      {/* Side lines (along width) — back & front */}
      {[-1, 1].map((s) => (
        <mesh
          key={s}
          position={[(s * (length / 2 - 0.01)), topY + thickness / 2 + 0.001, 0]}
          rotation={[-Math.PI / 2, 0, 0]}
        >
          <planeGeometry args={[0.02, width]} />
          <meshBasicMaterial color={'#FFFFFF'} transparent opacity={0.45} />
        </mesh>
      ))}

      {/* Edge lines (along length) on each long side */}
      {[-1, 1].map((s) => (
        <mesh
          key={s}
          position={[0, topY + thickness / 2 + 0.001, s * (width / 2 - 0.01)]}
          rotation={[-Math.PI / 2, 0, 0]}
        >
          <planeGeometry args={[length, 0.02]} />
          <meshBasicMaterial color={'#FFFFFF'} transparent opacity={0.45} />
        </mesh>
      ))}

      {/* Under-frame: two I-beam-like side rails + cross supports */}
      {[-1, 1].map((s) => (
        <mesh
          key={s}
          position={[0, height - thickness - 0.06, s * (width / 2 - 0.18)]}
          castShadow
        >
          <boxGeometry args={[length - 0.4, 0.04, 0.08]} />
          <meshStandardMaterial color={PALETTE.beigeDark} roughness={0.7} />
        </mesh>
      ))}

      {/* Legs — 4 cylinders, matte dark beige */}
      {[
        [-1, -1],
        [-1, 1],
        [1, -1],
        [1, 1],
      ].map(([sx, sz], i) => (
        <mesh
          key={i}
          position={[
            sx * (length / 2 - 0.22),
            height / 2 - 0.02,
            sz * (width / 2 - 0.22),
          ]}
          castShadow
        >
          <cylinderGeometry args={[0.04, 0.05, height - 0.04, 24]} />
          <meshStandardMaterial color={PALETTE.beigeDark} roughness={0.8} />
        </mesh>
      ))}
    </group>
  )
}

export default function Table() {
  const groupRef = useRef<THREE.Group>(null)

  // Subtle table "settle" — barely perceptible premium idle motion.
  useFrame((state) => {
    if (!groupRef.current) return
    const t = state.clock.elapsedTime
    groupRef.current.position.y = Math.sin(t * 0.5) * 0.0008
  })

  return (
    <group ref={groupRef}>
      <TableBody />
      <Net />
    </group>
  )
}
