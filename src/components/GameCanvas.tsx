import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { GameMode, Difficulty, PaddleType, ServiceStatus } from "../types";
import { TABLE_DIMENSIONS, PADDLE_CONFIGS, DIFFICULTY_CONFIGS } from "../utils/configs";
import { audioManager } from "../audio/AudioManager";

interface GameCanvasProps {
  gameMode: GameMode;
  difficulty: Difficulty;
  paddleType: PaddleType;
  onScoreUpdate: (playerScore: number, aiScore: number) => void;
  onStatusUpdate: (statusText: string) => void;
  onSetService: (status: ServiceStatus) => void;
  isPaused: boolean;
  score: { player: number; opponent: number };
  onResetScores: () => void;
  gameStateTrigger: number; // Increment to reset rally
}

export const GameCanvas: React.FC<GameCanvasProps> = ({
  gameMode,
  difficulty,
  paddleType,
  onScoreUpdate,
  onStatusUpdate,
  onSetService,
  isPaused,
  score,
  gameStateTrigger,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [cursorUnlocked, setCursorUnlocked] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Alt") {
        e.preventDefault();
        setCursorUnlocked((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  // Keep configs in refs so animation loop gets fresh values without recreating everything
  const paddleConfigRef = useRef(PADDLE_CONFIGS[paddleType]);
  const difficultyConfigRef = useRef(DIFFICULTY_CONFIGS[difficulty]);

  useEffect(() => {
    paddleConfigRef.current = PADDLE_CONFIGS[paddleType];
  }, [paddleType]);

  useEffect(() => {
    difficultyConfigRef.current = DIFFICULTY_CONFIGS[difficulty];
  }, [difficulty]);

  // Core physical/state variables
  const isMouseDown = useRef(false);
  const lastTossTime = useRef(0);
  const lastTableBounceTime = useRef(0);
  const hasFiredServe = useRef(false);

  const rallyState = useRef({
    scorePlayer: score.player,
    scoreOpponent: score.opponent,
    isRallyActive: false,
    lastStriker: null as "PLAYER" | "OPPONENT" | null,
    bouncesOnTable: 0,
    bouncesPlayerCourt: 0,
    bouncesOpponentCourt: 0,
    serveStatus: ServiceStatus.PLAYER_SERVE as ServiceStatus,
    servedFirstBounceSelf: false,
    servedFirstBounceOpponent: false,
    rallyBounces: 0, // contacts in current point
    awaitingServeTuck: true,
    isScorePending: false,
  });

  // Sync scores from parent
  useEffect(() => {
    rallyState.current.scorePlayer = score.player;
    rallyState.current.scoreOpponent = score.opponent;
  }, [score]);

  // Restart trigger
  useEffect(() => {
    if (gameMode !== GameMode.MENU) {
      resetBall(rallyState.current.serveStatus === ServiceStatus.PLAYER_SERVE ? "PLAYER" : "OPPONENT");
    }
  }, [gameStateTrigger, gameMode]);

  // Handle serve state change from user selection
  useEffect(() => {
    if (gameMode !== GameMode.MENU) {
      // Rotate serve appropriately
      const totalPoints = score.player + score.opponent;
      const playerServes = Math.floor(totalPoints / 2) % 2 === 0;
      const currentServes = playerServes ? ServiceStatus.PLAYER_SERVE : ServiceStatus.OPPONENT_SERVE;
      rallyState.current.serveStatus = currentServes;
      onSetService(currentServes);
      resetBall(playerServes ? "PLAYER" : "OPPONENT");
    }
  }, [gameMode]);

  // Ball physics configuration
  const ballPhysics = useRef({
    position: new THREE.Vector3(0, 0.9, -1.0),
    velocity: new THREE.Vector3(0, 0, 0),
    spin: new THREE.Vector3(0, 0, 0), // (spinX = topspin, spinY = sidespin, spinZ = roll)
    radius: 0.024, // 24mm size for visual clarity (slightly larger than real 20mm for comfortable hitting)
    mass: 0.0027, // 2.7g
    elasticityTable: 0.82,
    elasticityPaddle: 0.88,
    isTossed: false,
  });

  // Mouse tracking to project onto a 3D Plane
  const mouse = useRef({ x: 0, y: 0 });
  const paddleTarget = useRef({ x: 0, y: 0.82, z: -1.45 });
  const playerPaddlePos = useRef({ x: 0, y: 0.82, z: -1.45 });
  const playerPaddleVel = useRef({ x: 0, y: 0, z: 0 });
  const prevPlayerPaddlePos = useRef({ x: 0, y: 0.82, z: -1.45 });

  const aiPaddlePos = useRef({ x: 0, y: 0.82, z: 1.45 });
  const aiPaddleVel = useRef({ x: 0, y: 0, z: 0 });
  const aiPaddleTarget = useRef({ x: 0, y: 0.82, z: 1.45 });
  const aiReactTimer = useRef(0);
  const aiDelayBuffer = useRef<Array<{ time: number; x: number; y: number; z: number }>>([]);

  // Particle systems
  const particles = useRef<Array<{ mesh: THREE.Mesh; life: number; maxLife: number; velocity: THREE.Vector3 }>>([]);
  const pulseRings = useRef<Array<{ mesh: THREE.Mesh; life: number; maxLife: number; scaleSpeed: number }>>([]);
  const trails = useRef<Array<{ mesh: THREE.Mesh; life: number; maxLife: number }>>([]);

  const sceneRef = useRef<THREE.Scene | null>(null);

  // Ball reset helper
  function resetBall(server: "PLAYER" | "OPPONENT") {
    ballPhysics.current.spin.set(0, 0, 0);
    ballPhysics.current.isTossed = false;
    rallyState.current.isRallyActive = false;
    rallyState.current.lastStriker = null;
    rallyState.current.bouncesOnTable = 0;
    rallyState.current.bouncesPlayerCourt = 0;
    rallyState.current.bouncesOpponentCourt = 0;
    rallyState.current.servedFirstBounceSelf = false;
    rallyState.current.servedFirstBounceOpponent = false;
    rallyState.current.rallyBounces = 0;
    rallyState.current.awaitingServeTuck = true;
    rallyState.current.isScorePending = false;
    lastTableBounceTime.current = 0;
    hasFiredServe.current = false;

    if (server === "PLAYER") {
      ballPhysics.current.position.set(0, 0.82 + 0.12, -1.35);
      ballPhysics.current.velocity.set(0, 0, 0);
      onStatusUpdate("YOUR SERVE — CLICK TO TOSS BALL");
      rallyState.current.serveStatus = ServiceStatus.PLAYER_SERVE;
      onSetService(ServiceStatus.PLAYER_SERVE);
    } else {
      // Opponent ready to serve
      ballPhysics.current.position.set(0.1, 0.82 + 0.12, 1.35);
      ballPhysics.current.velocity.set(0, 0, 0);
      onStatusUpdate("OPPONENT PREPARING TO SERVE...");
      rallyState.current.serveStatus = ServiceStatus.OPPONENT_SERVE;
      onSetService(ServiceStatus.OPPONENT_SERVE);

      // Programmed delay for Opponent Serve
      setTimeout(() => {
        if (rallyState.current.serveStatus === ServiceStatus.OPPONENT_SERVE && !ballPhysics.current.isTossed && gameMode !== GameMode.MENU) {
          tossOpponentBall();
        }
      }, 1500);
    }
  }

  function tossOpponentBall() {
    if (isPaused || gameMode === GameMode.MENU) return;
    ballPhysics.current.isTossed = true;
    ballPhysics.current.velocity.set(0, 3.8, 0); // throw upwards
    onStatusUpdate("OPPONENT SERVING...");

    // Opponent hitting timer
    setTimeout(() => {
      if (rallyState.current.serveStatus === ServiceStatus.OPPONENT_SERVE && ballPhysics.current.isTossed && gameMode !== GameMode.MENU) {
        opponentServeHit();
      }
    }, 450);
  }

  function opponentServeHit() {
    if (isPaused || gameMode === GameMode.MENU) return;
    // Calculate precise target on the player's side of the table
    // Must hit opponent table first (Y=0.76, Z in [0, 1.37]) then player side (Z in [-1.37, 0])
    const diff = difficultyConfigRef.current;
    const targetX = (Math.random() - 0.5) * TABLE_DIMENSIONS.width * 0.7;
    // Serve target on opponent table side
    const targetFirstZ = TABLE_DIMENSIONS.length * 0.25; // closer to AI net
    // Serve target on player court side
    const targetSecondZ = -TABLE_DIMENSIONS.length * 0.35; // mid player side

    // We can solve simple projectile motion or add simple direct velocity
    // AI strikes downwards aiming at the table
    const xVel = (targetX - ballPhysics.current.position.x) * 2.1;
    const yVel = -2.1; // downward strike
    const zVel = -5.0 - (Math.random() * 1.5); // shoot towards player

    ballPhysics.current.velocity.set(xVel, yVel, zVel);

    // Apply some slight mock serving spin based on AI parameters
    const topspin = -10 - Math.random() * 30 * diff.spinAggression;
    const sidespin = (Math.random() - 0.5) * 40 * diff.spinAggression;
    ballPhysics.current.spin.set(topspin, sidespin, 0);

    rallyState.current.lastStriker = "OPPONENT";
    rallyState.current.isRallyActive = true;
    audioManager.playPaddleHit(0.8, true);
    triggerPulseRing(aiPaddlePos.current, 0xff7e6b);
    onStatusUpdate("RALLY ACTIVE");
  }

  // Handle scoring points
  function scorePoint(winner: "PLAYER" | "OPPONENT", reasonText: string) {
    if (rallyState.current.isScorePending) return;
    rallyState.current.isScorePending = true;

    // Immediately stop ball dynamics and clear serve/rally status during celebration to prevent looping
    ballPhysics.current.isTossed = false;
    ballPhysics.current.velocity.set(0, 0, 0);
    rallyState.current.serveStatus = ServiceStatus.NONE;
    onSetService(ServiceStatus.NONE);

    if (winner === "PLAYER") {
      const nextScore = rallyState.current.scorePlayer + 1;
      rallyState.current.scorePlayer = nextScore;
      audioManager.playScorePoint(true);
      onScoreUpdate(nextScore, rallyState.current.scoreOpponent);
      onStatusUpdate(`POINT YOU! — ${reasonText}`);
    } else {
      const nextScore = rallyState.current.scoreOpponent + 1;
      rallyState.current.scoreOpponent = nextScore;
      audioManager.playScorePoint(false);
      onScoreUpdate(rallyState.current.scorePlayer, nextScore);
      onStatusUpdate(`POINT BOT! — ${reasonText}`);
    }

    // Toggle serve rules: serve changes every 2 total points
    // Unless in Practice mode, then player serves forever
    setTimeout(() => {
      if (gameMode === GameMode.MENU) return;
      if (gameMode === GameMode.PRACTICE) {
        resetBall("PLAYER");
      } else {
        // Rotating serve every 2 serves
        const totalPoints = rallyState.current.scorePlayer + rallyState.current.scoreOpponent;
        const playerServes = Math.floor(totalPoints / 2) % 2 === 0;
        resetBall(playerServes ? "PLAYER" : "OPPONENT");
      }
    }, 2000);
  }

  // Create pulse visual indicator
  function triggerPulseRing(pos: THREE.Vector3 | { x: number; y: number; z: number }, hexColor: number) {
    if (!sceneRef.current) return;
    const geo = new THREE.RingGeometry(0.02, 0.22, 32);
    const mat = new THREE.MeshBasicMaterial({
      color: hexColor,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.7,
      depthWrite: false,
    });
    const ring = new THREE.Mesh(geo, mat);
    ring.position.set(pos.x, pos.y, pos.z);
    ring.rotation.x = Math.PI / 2; // Flat horizontal plane
    sceneRef.current.add(ring);
    pulseRings.current.push({
      mesh: ring,
      life: 0,
      maxLife: 24, // 24 frames
      scaleSpeed: 0.1,
    });
  }

  // Trigger floating hit sparks
  function triggerSparks(pos: THREE.Vector3, hexColor: number) {
    if (!sceneRef.current) return;
    for (let i = 0; i < 15; i++) {
      const geo = new THREE.SphereGeometry(0.008, 6, 6);
      const mat = new THREE.MeshBasicMaterial({
        color: hexColor,
        transparent: true,
        opacity: 0.9,
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.copy(pos);

      const velocity = new THREE.Vector3(
        (Math.random() - 0.5) * 2.0,
        Math.random() * 2.2 + 0.5,
        (Math.random() - 0.5) * 2.0
      );

      sceneRef.current.add(mesh);
      particles.current.push({
        mesh,
        life: 0,
        maxLife: 30 + Math.random() * 20,
        velocity,
      });
    }
  }

  // Main canvas initialization setup
  useEffect(() => {
    if (!canvasRef.current || !containerRef.current) return;

    // Dimensions
    let width = containerRef.current.clientWidth;
    let height = containerRef.current.clientHeight;

    // 1. Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color("#F5F2ED"); // Soft warm monochrome cream beige
    sceneRef.current = scene;

    // Soft fog for beautiful distance blending
    scene.fog = new THREE.FogExp2("#F5F2ED", 0.12);

    // 2. Camera setup
    const camera = new THREE.PerspectiveCamera(54, width / height, 0.1, 50);
    // Over-table view looking down table length
    camera.position.set(0, 1.48, -2.55);
    camera.lookAt(0, 0.76 + 0.08, -0.2); // Look slightly past player's table side

    // 3. WebGLRenderer Setup
    const renderer = new THREE.WebGLRenderer({
      canvas: canvasRef.current,
      antialias: true,
      alpha: false,
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    // 4. Lighting design (Studio Atmosphere, cozy warm-beige fill)
    const ambientLight = new THREE.AmbientLight("#fcefe0", 0.7);
    scene.add(ambientLight);

    const warmKeyLight = new THREE.DirectionalLight("#fff4e3", 1.4);
    warmKeyLight.position.set(2, 4.5, -2.5);
    warmKeyLight.castShadow = true;
    warmKeyLight.shadow.mapSize.width = 1024;
    warmKeyLight.shadow.mapSize.height = 1024;
    warmKeyLight.shadow.camera.near = 0.5;
    warmKeyLight.shadow.camera.far = 15;
    // Set tight bounding box for sharp soft contact shadows
    const d = 2.5;
    warmKeyLight.shadow.camera.left = -d;
    warmKeyLight.shadow.camera.right = d;
    warmKeyLight.shadow.camera.top = d;
    warmKeyLight.shadow.camera.bottom = -d;
    warmKeyLight.shadow.bias = -0.0005;
    scene.add(warmKeyLight);

    // Warm accent lights around the field for depth
    const subtlePoint = new THREE.PointLight("#ff8e6e", 0.5, 8);
    subtlePoint.position.set(-1.8, 1.2, 0.5);
    scene.add(subtlePoint);

    const goldFillLight = new THREE.DirectionalLight("#e5b072", 0.4);
    goldFillLight.position.set(-3, 2.5, 3);
    scene.add(goldFillLight);

    // 5. Environmental Props - Premium abstract geometry
    // Rounded arch backdrop
    const archMat = new THREE.MeshStandardMaterial({
      color: "#eae2d5",
      roughness: 0.6,
      metalness: 0.1,
    });

    const archRadius = 1.3;
    const archTube = 0.08;
    const archGeo = new THREE.TorusGeometry(archRadius, archTube, 32, 48, Math.PI);
    const archMesh = new THREE.Mesh(archGeo, archMat);
    archMesh.position.set(-2.4, 0.0, 1.2);
    archMesh.rotation.y = Math.PI / 4;
    archMesh.castShadow = true;
    archMesh.receiveShadow = true;
    scene.add(archMesh);

    // Aesthetic Cylinders, cubes, spheres piled for balance
    const cylinderGeo = new THREE.CylinderGeometry(0.18, 0.18, 1.2, 32);
    const cyl1 = new THREE.Mesh(cylinderGeo, archMat);
    cyl1.position.set(-2.7, 0.6, -0.5);
    cyl1.castShadow = true;
    cyl1.receiveShadow = true;
    scene.add(cyl1);

    const sphereGeo = new THREE.SphereGeometry(0.32, 32, 32);
    const sph1 = new THREE.Mesh(sphereGeo, archMat);
    sph1.position.set(-2.2, 0.32, -1.8);
    sph1.castShadow = true;
    sph1.receiveShadow = true;
    scene.add(sph1);

    // Cones/Chevrons on the right side
    const coneGeo = new THREE.ConeGeometry(0.24, 0.6, 32);
    const cone1 = new THREE.Mesh(coneGeo, archMat);
    cone1.position.set(2.4, 0.3, 0.5);
    cone1.castShadow = true;
    cone1.receiveShadow = true;
    scene.add(cone1);

    // Soft spherical sculpture right background
    const sph2 = new THREE.Mesh(sphereGeo, archMat);
    sph2.position.set(2.5, 1.1, 1.5);
    sph2.castShadow = true;
    sph2.receiveShadow = true;
    scene.add(sph2);

    // Stacked beige blocks right side
    const cubeGeo = new THREE.BoxGeometry(0.28, 0.2, 0.28);
    const block1 = new THREE.Mesh(cubeGeo, archMat);
    block1.position.set(2.9, 0.1, -0.6);
    block1.castShadow = true;
    scene.add(block1);

    const block2 = new THREE.Mesh(cubeGeo, archMat);
    block2.position.set(2.9, 0.3, -0.6);
    block2.rotation.y = 0.3;
    block2.castShadow = true;
    scene.add(block2);

    const block3 = new THREE.Mesh(cubeGeo, archMat);
    block3.position.set(2.9, 0.5, -0.6);
    block3.rotation.y = -0.15;
    block3.castShadow = true;
    scene.add(block3);

    // Smooth soft satin floor
    const floorGeo = new THREE.PlaneGeometry(24, 24);
    const floorMat = new THREE.MeshStandardMaterial({
      color: "#ebdcc9",
      roughness: 0.9,
      metalness: 0.05,
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = 0;
    floor.receiveShadow = true;
    scene.add(floor);

    // Glowing stage ring surrounding table
    const stageRingGeo = new THREE.RingGeometry(2.3, 2.33, 64);
    const stageRingMat = new THREE.MeshBasicMaterial({
      color: "#fae0cd", // gold glow
      transparent: true,
      opacity: 0.5,
      side: THREE.DoubleSide,
    });
    const stageRing = new THREE.Mesh(stageRingGeo, stageRingMat);
    stageRing.rotation.x = -Math.PI / 2;
    stageRing.position.y = 0.01;
    scene.add(stageRing);

    // 6. Table tennis structural modeling
    // Real proportions: L=2.74, W=1.525, Y=0.76 (table leg height)
    const tableMaterial = new THREE.MeshStandardMaterial({
      color: "#8fa9bf", // Pale beautiful light blue satin table
      roughness: 0.38,
      metalness: 0.1,
    });

    const tableTopGeo = new THREE.BoxGeometry(TABLE_DIMENSIONS.width, 0.04, TABLE_DIMENSIONS.length);
    const tableTop = new THREE.Mesh(tableTopGeo, tableMaterial);
    // Table surface height Y is 0.76m. Let's position the box appropriately so surface is at Y = 0.76
    tableTop.position.set(0, TABLE_DIMENSIONS.height - 0.02, 0);
    tableTop.receiveShadow = true;
    tableTop.castShadow = true;
    scene.add(tableTop);

    // White boundaries lines on table
    const whiteLineMat = new THREE.MeshBasicMaterial({ color: "#ffffff", side: THREE.DoubleSide });

    // Edge borders (Width border)
    const endBorder1 = new THREE.Mesh(new THREE.PlaneGeometry(TABLE_DIMENSIONS.width, 0.015), whiteLineMat);
    endBorder1.rotation.x = -Math.PI / 2;
    endBorder1.position.set(0, TABLE_DIMENSIONS.height + 0.001, -TABLE_DIMENSIONS.length / 2);
    scene.add(endBorder1);

    const endBorder2 = new THREE.Mesh(new THREE.PlaneGeometry(TABLE_DIMENSIONS.width, 0.015), whiteLineMat);
    endBorder2.rotation.x = -Math.PI / 2;
    endBorder2.position.set(0, TABLE_DIMENSIONS.height + 0.001, TABLE_DIMENSIONS.length / 2);
    scene.add(endBorder2);

    // Long borders
    const sideBorder1 = new THREE.Mesh(new THREE.PlaneGeometry(0.015, TABLE_DIMENSIONS.length), whiteLineMat);
    sideBorder1.rotation.x = -Math.PI / 2;
    sideBorder1.position.set(-TABLE_DIMENSIONS.width / 2, TABLE_DIMENSIONS.height + 0.001, 0);
    scene.add(sideBorder1);

    const sideBorder2 = new THREE.Mesh(new THREE.PlaneGeometry(0.015, TABLE_DIMENSIONS.length), whiteLineMat);
    sideBorder2.rotation.x = -Math.PI / 2;
    sideBorder2.position.set(TABLE_DIMENSIONS.width / 2, TABLE_DIMENSIONS.height + 0.001, 0);
    scene.add(sideBorder2);

    // Center division line (separates courts for serving)
    const centerLine = new THREE.Mesh(new THREE.PlaneGeometry(0.006, TABLE_DIMENSIONS.length), whiteLineMat);
    centerLine.rotation.x = -Math.PI / 2;
    centerLine.position.set(0, TABLE_DIMENSIONS.height + 0.0015, 0);
    scene.add(centerLine);

    // Sleek minimalist legs
    const legGeo = new THREE.CylinderGeometry(0.04, 0.04, TABLE_DIMENSIONS.height - 0.04, 24);
    const legMat = new THREE.MeshStandardMaterial({
      color: "#eae5dc", // matching backdrop
      roughness: 0.5,
      metalness: 0.1,
    });

    const lx = TABLE_DIMENSIONS.width / 2 - 0.12;
    const lz = TABLE_DIMENSIONS.length / 2 - 0.15;
    const ly = (TABLE_DIMENSIONS.height - 0.04) / 2;

    const leg1 = new THREE.Mesh(legGeo, legMat);
    leg1.position.set(-lx, ly, -lz);
    leg1.castShadow = true;
    leg1.receiveShadow = true;
    scene.add(leg1);

    const leg2 = new THREE.Mesh(legGeo, legMat);
    leg2.position.set(lx, ly, -lz);
    leg2.castShadow = true;
    leg2.receiveShadow = true;
    scene.add(leg2);

    const leg3 = new THREE.Mesh(legGeo, legMat);
    leg3.position.set(-lx, ly, lz);
    leg3.castShadow = true;
    leg3.receiveShadow = true;
    scene.add(leg3);

    const leg4 = new THREE.Mesh(legGeo, legMat);
    leg4.position.set(lx, ly, lz);
    leg4.castShadow = true;
    leg4.receiveShadow = true;
    scene.add(leg4);

    // 7. Net system
    // Real proportions: net height from top of table is 15.25cm (0.1525m)
    const netPostsGeo = new THREE.CylinderGeometry(0.008, 0.008, TABLE_DIMENSIONS.netHeight + 0.02, 16);
    const postMat = new THREE.MeshStandardMaterial({ color: "#fffefe", metalness: 0.8, roughness: 0.2 });

    const netPostLeft = new THREE.Mesh(netPostsGeo, postMat);
    netPostLeft.position.set(-TABLE_DIMENSIONS.netWidth / 2, TABLE_DIMENSIONS.height + TABLE_DIMENSIONS.netHeight / 2, 0);
    netPostLeft.castShadow = true;
    scene.add(netPostLeft);

    const netPostRight = new THREE.Mesh(netPostsGeo, postMat);
    netPostRight.position.set(TABLE_DIMENSIONS.netWidth / 2, TABLE_DIMENSIONS.height + TABLE_DIMENSIONS.netHeight / 2, 0);
    netPostRight.castShadow = true;
    scene.add(netPostRight);

    // Net mesh
    const netMeshGeo = new THREE.PlaneGeometry(TABLE_DIMENSIONS.netWidth, TABLE_DIMENSIONS.netHeight - 0.015);

    // Create highly detailed procedural net grid canvas texture
    const netCanvas = document.createElement("canvas");
    netCanvas.width = 64;
    netCanvas.height = 64;
    const netCtx = netCanvas.getContext("2d");
    if (netCtx) {
      netCtx.clearRect(0, 0, 64, 64);
      // Faint dark mesh backing for physical depth
      netCtx.fillStyle = "rgba(25, 20, 15, 0.25)";
      netCtx.fillRect(0, 0, 64, 64);

      // Draw double-crossed textured nylon ropes
      netCtx.strokeStyle = "rgba(235, 230, 222, 0.92)";
      netCtx.lineWidth = 3.5;
      netCtx.beginPath();
      for (let i = -64; i <= 128; i += 16) {
        netCtx.moveTo(i, 0);
        netCtx.lineTo(i + 64, 64);

        netCtx.moveTo(i + 64, 0);
        netCtx.lineTo(i, 64);
      }
      netCtx.stroke();
    }
    const netTexture = new THREE.CanvasTexture(netCanvas);
    netTexture.wrapS = THREE.RepeatWrapping;
    netTexture.wrapT = THREE.RepeatWrapping;
    // Repeat beautifully matching the dimensions of a standard tennis table
    netTexture.repeat.set(70, 7);

    const netMeshMat = new THREE.MeshStandardMaterial({
      map: netTexture,
      transparent: true,
      side: THREE.DoubleSide,
      roughness: 0.9,
      metalness: 0.1,
    });
    const netMesh = new THREE.Mesh(netMeshGeo, netMeshMat);
    netMesh.position.set(0, TABLE_DIMENSIONS.height + TABLE_DIMENSIONS.netHeight / 2, 0);
    netMesh.castShadow = true;
    scene.add(netMesh);

    // White strip top of net
    const netStripGeo = new THREE.BoxGeometry(TABLE_DIMENSIONS.netWidth, 0.01, 0.005);
    const netStripMat = new THREE.MeshStandardMaterial({ color: "#ffffff", roughness: 0.8 });
    const netStrip = new THREE.Mesh(netStripGeo, netStripMat);
    netStrip.position.set(0, TABLE_DIMENSIONS.height + TABLE_DIMENSIONS.netHeight, 0);
    scene.add(netStrip);

    // 8. Ball graphic setup
    const ballVisualGeo = new THREE.SphereGeometry(ballPhysics.current.radius, 32, 32);
    // Glowing orbital, warm yellow matte color
    const ballVisualMat = new THREE.MeshStandardMaterial({
      color: "#ffefe0",
      roughness: 0.2,
      metalness: 0.1,
      emissive: "#ffdcb5",
      emissiveIntensity: 0.55,
    });
    const ballMesh = new THREE.Mesh(ballVisualGeo, ballVisualMat);
    ballMesh.position.copy(ballPhysics.current.position);
    ballMesh.castShadow = true;
    scene.add(ballMesh);

    // Light-weight soft shadow plane beneath ball
    const ballShadowGeo = new THREE.PlaneGeometry(0.12, 0.12);
    const ballShadowMat = new THREE.MeshBasicMaterial({
      color: "#000000",
      transparent: true,
      opacity: 0.0, // Managed dynamically
      depthWrite: false,
    });
    const ballShadow = new THREE.Mesh(ballShadowGeo, ballShadowMat);
    ballShadow.rotation.x = -Math.PI / 2;
    scene.add(ballShadow);

    // 9. Paddles Graphic setup
    // Human paddle: selection affects color/size
    const createPaddleMesh = (colorHex: string) => {
      const g = new THREE.Group();

      // 1. Central Wood Core Disk (Professional blade base)
      const coreGeo = new THREE.CylinderGeometry(0.084, 0.084, 0.008, 40);
      const woodMat = new THREE.MeshStandardMaterial({
        color: "#d8c3a5", // Natural light brown wood color
        roughness: 0.7,
      });
      const core = new THREE.Mesh(coreGeo, woodMat);
      core.rotation.x = Math.PI / 2;
      core.castShadow = true;
      g.add(core);

      // 2. Back rubber facing the camera/player (customized chosen style color)
      const faceGeo = new THREE.CylinderGeometry(0.082, 0.082, 0.002, 40);
      const rubberMat = new THREE.MeshStandardMaterial({
        color: colorHex,
        roughness: 0.45,
        metalness: 0.05,
      });
      const blade = new THREE.Mesh(faceGeo, rubberMat);
      blade.name = "rubberFace";
      blade.position.set(0, 0, -0.005); // closer to camera (negative Z), so the player sees this side
      blade.rotation.x = Math.PI / 2;
      blade.castShadow = true;
      g.add(blade);

      // 3. Wooden handle
      const handleGeo = new THREE.BoxGeometry(0.016, 0.07, 0.014);
      const handle = new THREE.Mesh(handleGeo, woodMat);
      handle.position.set(0, -0.11, 0);
      handle.castShadow = true;
      g.add(handle);

      // 4. Front rubber facing the table/opponent (always professional solid black rubber)
      const backGeo = new THREE.CylinderGeometry(0.082, 0.082, 0.002, 32);
      const blackRubber = new THREE.MeshStandardMaterial({ color: "#222222", roughness: 0.5 });
      const backBlade = new THREE.Mesh(backGeo, blackRubber);
      backBlade.position.set(0, 0, 0.005); // facing positive Z (towards opponent table side)
      backBlade.rotation.x = Math.PI / 2;
      g.add(backBlade);

      return g;
    };

    const humanPaddleGroup = createPaddleMesh(paddleConfigRef.current.color);
    scene.add(humanPaddleGroup);

    // AI paddle: floating golden/grey visual
    const aiPaddleGroup = createPaddleMesh("#3d3d3d"); // Matte black/grey rubber for AI
    scene.add(aiPaddleGroup);

    // 10. Handle window resizing safely
    const resizeObserver = new ResizeObserver((entries) => {
      for (let entry of entries) {
        width = entry.contentRect.width;
        height = entry.contentRect.height;
        if (camera) {
          camera.aspect = width / height;
          camera.updateProjectionMatrix();
        }
        renderer.setSize(width, height);
      }
    });
    resizeObserver.observe(containerRef.current);

    // Mouse interactive plane collision
    // Map mouse position within container back to physical X and Y values
    const handleMouseMove = (e: MouseEvent) => {
      if (!canvasRef.current) return;
      const rect = canvasRef.current.getBoundingClientRect();
      const x = -(((e.clientX - rect.left) / rect.width) * 2 - 1);
      const y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      mouse.current.x = x;
      mouse.current.y = y;

      // Project mouse into X and Y physical paddle coordinate ranges
      // Player paddle moves mostly in plane Z = -1.45 (just behind table edge)
      // Limit bounds to avoid moving paddle out of natural hitting ranges
      paddleTarget.current.x = x * TABLE_DIMENSIONS.width * 1.05;
      // Height centered around the table surface height (0.76m) ranging up or down slightly
      paddleTarget.current.y = 0.76 + (y + 0.3) * 0.44;
      // Hovering near the edge
      paddleTarget.current.z = -1.45 + (y < 0 ? y * 0.15 : 0);
    };

    // Toss / Hit trigger
    const handleTouchStart = (e: TouchEvent) => {
      isMouseDown.current = true;
      if (e.touches.length > 0) {
        const touch = e.touches[0];
        if (!canvasRef.current) return;
        const rect = canvasRef.current.getBoundingClientRect();
        const x = -(((touch.clientX - rect.left) / rect.width) * 2 - 1);
        const y = -((touch.clientY - rect.top) / rect.height) * 2 + 1;

        mouse.current.x = x;
        mouse.current.y = y;
        paddleTarget.current.x = x * TABLE_DIMENSIONS.width * 1.05;
        paddleTarget.current.y = 0.76 + (y + 0.3) * 0.44;
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        const touch = e.touches[0];
        if (!canvasRef.current) return;
        const rect = canvasRef.current.getBoundingClientRect();
        const x = -(((touch.clientX - rect.left) / rect.width) * 2 - 1);
        const y = -((touch.clientY - rect.top) / rect.height) * 2 + 1;

        mouse.current.x = x;
        mouse.current.y = y;
        paddleTarget.current.x = x * TABLE_DIMENSIONS.width * 1.05;
        paddleTarget.current.y = 0.76 + (y + 0.3) * 0.44;
      }
    };

    const handleTouchEnd = () => {
      isMouseDown.current = false;
    };

    const handleMouseDown = () => {
      isMouseDown.current = true;
    };

    const handleMouseUp = () => {
      isMouseDown.current = false;
    };

    const handleMouseClick = () => {
      if (isPaused || gameMode === GameMode.MENU) return;

      // If ball hasn't been served and it's player serve
      if (
        rallyState.current.serveStatus === ServiceStatus.PLAYER_SERVE &&
        !ballPhysics.current.isTossed
      ) {
        ballPhysics.current.isTossed = true;
        lastTossTime.current = performance.now();
        ballPhysics.current.velocity.set(0, 4.0, 0); // throw straight upwards
        onStatusUpdate("BALL TOSSED — SWIPE OR CLICK TO SERVE!");
        audioManager.playTableBounce(0.3); // tiny toss sound
      } else if (
        rallyState.current.serveStatus === ServiceStatus.PLAYER_SERVE &&
        ballPhysics.current.isTossed
      ) {
        // Cooldown for 250ms after tossing to prevent double click fast triggers
        if (performance.now() - lastTossTime.current < 250) return;

        // Quality of life: If they click *while the ball is tossed*, execute a clean automatic serve
        const xDiff = ballPhysics.current.position.x - playerPaddlePos.current.x;
        const yDiff = ballPhysics.current.position.y - playerPaddlePos.current.y;
        const distance2D = Math.sqrt(xDiff * xDiff + yDiff * yDiff);

        // If paddle is reasonably near the tossed ball, trigger a safe elegant legal serve
        if (distance2D < 0.32 && !hasFiredServe.current) {
          const ballY = ballPhysics.current.position.y;
          const ballZ = ballPhysics.current.position.z;

          // Advanced physics serve calculator: ensures ball bounces on player court and ALWAYS clears net beautifully
          const targetBounceZ = -0.72; // lands safely in the middle-back of our side
          const outVelZ = 4.6; // perfect forward speed to bounce and glide over the net
          const t = (targetBounceZ - ballZ) / outVelZ;
          const yTarget = TABLE_DIMENSIONS.height + ballPhysics.current.radius;

          let outVelY = (yTarget - ballY + 4.905 * t * t) / t;
          outVelY = Math.max(-2.4, Math.min(-1.7, outVelY)); // perfectly tuned legal limit for robust bounce and clearance

          ballPhysics.current.velocity.set(
            (Math.random() - 0.5) * 0.4, // slight horizontal angle
            outVelY,                      // computed perfect downward dip
            outVelZ                       // computed perfect speed
          );
          ballPhysics.current.spin.set(15, 0, 0); // nice slight topspin

          hasFiredServe.current = true;
          rallyState.current.lastStriker = "PLAYER";
          rallyState.current.bouncesOnTable = 0;
          rallyState.current.bouncesPlayerCourt = 0;
          rallyState.current.bouncesOpponentCourt = 0;

          audioManager.playPaddleHit(0.75, false);
          triggerPulseRing(playerPaddlePos.current, 0xff8c00);
          triggerSparks(ballPhysics.current.position, 0xff7e6b);
          onStatusUpdate("RALLY ACTIVE");
        }
      }
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("touchstart", handleTouchStart);
    window.addEventListener("touchmove", handleTouchMove);
    window.addEventListener("touchend", handleTouchEnd);
    window.addEventListener("mousedown", handleMouseDown);
    window.addEventListener("mouseup", handleMouseUp);
    window.addEventListener("click", handleMouseClick);

    // 11. Animation frame rate loop (144fps capped by browser requestAnimationFrame)
    let lastTime = performance.now();
    let frameCount = 0;
    let id: number;

    const gameLoop = () => {
      if (!sceneRef.current) return;
      id = requestAnimationFrame(gameLoop);

      const currentTime = performance.now();
      let dt = (currentTime - lastTime) / 1000;
      lastTime = currentTime;

      // Cap delta-time to avoid extreme physics simulation skips when unfocused
      if (dt > 0.05) dt = 0.05;

      if (!isPaused && gameMode !== GameMode.MENU) {
        frameCount++;

        // --- PADDLE POSITION INTERPOLATION (SMOOTH INERTIA) ---
        prevPlayerPaddlePos.current.x = playerPaddlePos.current.x;
        prevPlayerPaddlePos.current.y = playerPaddlePos.current.y;
        prevPlayerPaddlePos.current.z = playerPaddlePos.current.z;

        // Dynamic interpolation logic for premium heavy paddle feel
        const paddleSlack = 0.16; // Lerping stiffness (less than 1 means smooth smoothing)
        playerPaddlePos.current.x += (paddleTarget.current.x - playerPaddlePos.current.x) * paddleSlack;
        playerPaddlePos.current.y += (paddleTarget.current.y - playerPaddlePos.current.y) * paddleSlack;
        playerPaddlePos.current.z += (paddleTarget.current.z - playerPaddlePos.current.z) * paddleSlack;

        // Calculate actual paddle velocity
        playerPaddleVel.current.x = (playerPaddlePos.current.x - prevPlayerPaddlePos.current.x) / Math.max(0.001, dt);
        playerPaddleVel.current.y = (playerPaddlePos.current.y - prevPlayerPaddlePos.current.y) / Math.max(0.001, dt);
        playerPaddleVel.current.z = (playerPaddlePos.current.z - prevPlayerPaddlePos.current.z) / Math.max(0.001, dt);

        // Apply visual rotation based on sweeping direction (tilting looks AMAZING)
        humanPaddleGroup.position.set(playerPaddlePos.current.x, playerPaddlePos.current.y, playerPaddlePos.current.z);
        humanPaddleGroup.rotation.y = (playerPaddleVel.current.x * 0.02) + (mouse.current.x * 0.2); // Face target
        humanPaddleGroup.rotation.x = Math.PI / 16 + (playerPaddleVel.current.y * -0.015); // Tilt up or down

        // Update selected color matching (only for the front rubber face mesh)
        humanPaddleGroup.children.forEach((child) => {
          if (child.name === "rubberFace" && child instanceof THREE.Mesh && child.material instanceof THREE.MeshStandardMaterial) {
            if (child.material.color.getHexString() !== paddleConfigRef.current.color.replace("#", "").toLowerCase()) {
              // Quick update on run-time selections
              child.material.color.set(paddleConfigRef.current.color);
            }
          }
        });

        // --- AI WORKINGS (HUMAN BEHAVIOR INTELLIGENT ROUTING) ---
        const aiDiff = difficultyConfigRef.current;

        // Gather ball history to mock reaction delays
        aiDelayBuffer.current.push({
          time: currentTime,
          x: ballPhysics.current.position.x,
          y: ballPhysics.current.position.y,
          z: ballPhysics.current.position.z,
        });

        // Purge old values
        const reactionTimeMs = aiDiff.reactionTime * 1000;
        while (aiDelayBuffer.current.length > 1 && (currentTime - aiDelayBuffer.current[0].time) > reactionTimeMs) {
          aiDelayBuffer.current.shift();
        }

        // AI tracks the delayed ball position
        const trackedBall = aiDelayBuffer.current[0] || ballPhysics.current.position;

        // AI positioning target: Z-depth resides at +1.45m mostly
        aiPaddleTarget.current.z = 1.45;

        // Anticipated hit spot. If the ball is moving towards the AI side (positive velocity)
        if (ballPhysics.current.velocity.z > 0.0) {
          // Pre-solve linear tracking target based on velocity towards the baseline
          const zDistance = 1.45 - ballPhysics.current.position.z;
          const interceptTime = Math.max(0.01, zDistance / ballPhysics.current.velocity.z);

          // Projected crossing coordinates
          let targetX = ballPhysics.current.position.x + ballPhysics.current.velocity.x * interceptTime;
          let targetY = ballPhysics.current.position.y + ballPhysics.current.velocity.y * interceptTime;

          // Cap target calculations so AI doesn't run infinitely off table
          targetX = Math.max(-TABLE_DIMENSIONS.width * 0.65, Math.min(TABLE_DIMENSIONS.width * 0.65, targetX));
          targetY = Math.max(TABLE_DIMENSIONS.height + 0.05, Math.min(TABLE_DIMENSIONS.height + 0.45, targetY));

          // Introduce AI error rates to Rookie / Casual
          if (Math.random() < aiDiff.errorRate * 0.02) {
            targetX += (Math.random() - 0.5) * 0.35;
            targetY += (Math.random() - 0.5) * 0.2;
          }

          aiPaddleTarget.current.x = targetX;
          aiPaddleTarget.current.y = targetY;
        } else {
          // Soft return to center court when waiting passively
          aiPaddleTarget.current.x += (0.0 - aiPaddleTarget.current.x) * 0.06;
          aiPaddleTarget.current.y += (0.76 + 0.15 - aiPaddleTarget.current.y) * 0.06;
        }

        // Interpolate AI physical movement speeds according to difficulty limits
        const maxDist = aiDiff.speedLimit * dt;
        const dx = aiPaddleTarget.current.x - aiPaddlePos.current.x;
        const dy = aiPaddleTarget.current.y - aiPaddlePos.current.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist > maxDist && dist > 0.001) {
          aiPaddlePos.current.x += (dx / dist) * maxDist;
          aiPaddlePos.current.y += (dy / dist) * maxDist;
        } else {
          aiPaddlePos.current.x += dx * 0.2;
          aiPaddlePos.current.y += dy * 0.2;
        }
        aiPaddlePos.current.z = 1.45;

        // Apply values to visual mesh
        aiPaddleGroup.position.set(aiPaddlePos.current.x, aiPaddlePos.current.y, aiPaddlePos.current.z);
        aiPaddleGroup.rotation.y = (aiPaddlePos.current.x * -0.15) - Math.PI; // Face player
        aiPaddleGroup.rotation.x = -Math.PI / 16; // slightly tilted down forward

        // --- HIGH FIDELITY BALL PHYSICAL GRAPHICS ---
        if (ballPhysics.current.isTossed) {
          // Apply Gravitational constants (standard 9.81 m/s^2)
          ballPhysics.current.velocity.y -= 9.81 * dt;

          // Apply standard air-drag forces (speeds decelerate naturally)
          const airDragK = 0.18; // clean soft coefficient
          const speed = ballPhysics.current.velocity.length();
          const dragForce = ballPhysics.current.velocity.clone().multiplyScalar(-airDragK * speed);
          ballPhysics.current.velocity.addScaledVector(dragForce, dt);

          // Apply MAGNUS EFFECT (curvy trajectory physics based on rotational spins!)
          // ForceMagnus = S x V (spin cross speed vector) * Magnus coefficient
          const magnusConst = 0.035; // refined coefficient for clean controlled curves
          const magnusForce = new THREE.Vector3()
            .crossVectors(ballPhysics.current.spin, ballPhysics.current.velocity)
            .multiplyScalar(magnusConst);
          // Zero out the Z component of Magnus effect so heavy horizontal swipes (sidespin)
          // do not pull down/push forward forward velocity. This guarantees precise corner-to-corner shots.
          magnusForce.z = 0;
          ballPhysics.current.velocity.addScaledVector(magnusForce, dt);

          // Apply coordinates updates
          ballPhysics.current.position.addScaledVector(ballPhysics.current.velocity, dt);

          // Render rotating details matching spins on visual mesh
          ballMesh.rotateOnAxis(new THREE.Vector3(1, 0, 0), ballPhysics.current.spin.x * dt * 0.05);
          ballMesh.rotateOnAxis(new THREE.Vector3(0, 1, 0), ballPhysics.current.spin.y * dt * 0.05);

          // Apply shadow projection coordinates & sizes on table
          if (ballPhysics.current.position.y >= TABLE_DIMENSIONS.height) {
            ballShadow.position.set(ballPhysics.current.position.x, TABLE_DIMENSIONS.height + 0.002, ballPhysics.current.position.z);
            const heightDiff = ballPhysics.current.position.y - TABLE_DIMENSIONS.height;
            const sizeMult = Math.max(0.1, 1 - heightDiff * 1.5);
            ballShadow.scale.set(sizeMult, sizeMult, 1);
            ballShadow.material.opacity = Math.max(0, 0.45 - heightDiff * 0.8);
          } else {
            ballShadow.material.opacity = 0.0;
          }

          // Generate glowing trailing lines
          if (frameCount % 2 === 0) {
            const trGeo = new THREE.SphereGeometry(ballPhysics.current.radius * 0.85, 8, 8);
            const trMat = new THREE.MeshBasicMaterial({
              color: "#ffefe0",
              transparent: true,
              opacity: 0.28,
            });
            const trMesh = new THREE.Mesh(trGeo, trMat);
            trMesh.position.copy(ballPhysics.current.position);
            scene.add(trMesh);
            trails.current.push({
              mesh: trMesh,
              life: 0,
              maxLife: 15,
            });
          }

          // --- BOUNCE AND COLLISIONS CHECKS ---

          // 1. Table bounce collision check
          // Table dimensions are Width [-width/2, width/2] and Length [-length/2, length/2]
          const tableXBound = TABLE_DIMENSIONS.width / 2;
          const tableZBound = TABLE_DIMENSIONS.length / 2;

          const isAboveTableX = Math.abs(ballPhysics.current.position.x) <= tableXBound;
          const isAboveTableZ = Math.abs(ballPhysics.current.position.z) <= tableZBound;
          const isAboveTable = isAboveTableX && isAboveTableZ;

          // The ball contacts the table surface at Y = 0.76 (incorporate visual spherical radius)
          if (isAboveTable && ballPhysics.current.position.y <= TABLE_DIMENSIONS.height + ballPhysics.current.radius) {
            if (ballPhysics.current.velocity.y < 0) {
              const now = performance.now();
              if (now - lastTableBounceTime.current >= 120) {
                lastTableBounceTime.current = now;

                // Physical bounce bounce trigger!
                ballPhysics.current.position.y = TABLE_DIMENSIONS.height + ballPhysics.current.radius;
                ballPhysics.current.velocity.y = -ballPhysics.current.velocity.y * ballPhysics.current.elasticityTable;

                // --- SPIN FORCE TRANSFERS ON CONTACTS ---
                // Spin vectors modify velocities on bounce. Topspin (X spin) accelerates forwards (Z).
                // Sidespin (Y spin) throws left/right (X).
                const frictionFactor = 0.08;
                ballPhysics.current.velocity.z += ballPhysics.current.spin.x * ballPhysics.current.radius * frictionFactor;
                ballPhysics.current.velocity.x += ballPhysics.current.spin.y * ballPhysics.current.radius * frictionFactor;

                // Contact friction decays ball rotational speed
                ballPhysics.current.spin.multiplyScalar(0.70);

                // Sound ping synth
                const intensity = Math.min(1.0, Math.max(0.1, Math.abs(ballPhysics.current.velocity.y) / 3));
                audioManager.playTableBounce(intensity);
                triggerPulseRing(ballPhysics.current.position, 0xefdcc9);

                rallyState.current.bouncesOnTable++;

                // Check division of bounds
                // Player court is Z < 0. Opponent court is Z > 0.
                const isPlayerCourtSide = ballPhysics.current.position.z < 0;

                if (isPlayerCourtSide) {
                  rallyState.current.bouncesPlayerCourt++;
                  rallyState.current.rallyBounces++;

                  // Game rules details checking
                  if (rallyState.current.serveStatus === ServiceStatus.PLAYER_SERVE) {
                    if (!rallyState.current.servedFirstBounceSelf) {
                      rallyState.current.servedFirstBounceSelf = true;
                    } else {
                      // Double bounce on players side during player serve!
                      scorePoint("OPPONENT", "BALL BOUNCED TWICE ON YOUR COURT");
                    }
                  } else if (rallyState.current.serveStatus === ServiceStatus.OPPONENT_SERVE) {
                    if (rallyState.current.servedFirstBounceSelf) {
                      // It had already bounced on Opponent side and now bounced on yours. This is correct serving!
                      rallyState.current.servedFirstBounceOpponent = true;
                      rallyState.current.serveStatus = ServiceStatus.NONE; // Rally is fully in play now!
                    } else {
                      // Serve hit player court directly without bouncing on AI side!
                      scorePoint("PLAYER", "AI SERVE FAILED TO BOUNCE ON ITS COURT ONLY");
                    }
                  } else {
                    // Normal play rally. If bounces on player side exceeding 1
                    if (rallyState.current.bouncesPlayerCourt > 1) {
                      scorePoint("OPPONENT", "BALL BOUNCED TWICE ON YOUR COURT");
                    }
                  }
                } else {
                  // Opponent court (Z > 0)
                  rallyState.current.bouncesOpponentCourt++;
                  rallyState.current.rallyBounces++;

                  if (rallyState.current.serveStatus === ServiceStatus.PLAYER_SERVE) {
                    if (rallyState.current.servedFirstBounceSelf) {
                      // Ball served correctly. Now bounced on opponent side
                      rallyState.current.servedFirstBounceOpponent = true;
                      rallyState.current.serveStatus = ServiceStatus.NONE; // rally active
                    } else {
                      // Served directly to opponent court without bouncing on player side first!
                      scorePoint("OPPONENT", "YOUR SERVE MUST BOUNCE ON YOUR COURT FIRST");
                    }
                  } else if (rallyState.current.serveStatus === ServiceStatus.OPPONENT_SERVE) {
                    if (!rallyState.current.servedFirstBounceSelf) {
                      rallyState.current.servedFirstBounceSelf = true;
                    } else {
                      // Double bounce on AI court on its serve
                      scorePoint("PLAYER", "AI SERVE BOUNCED TWICE ON AI COURT");
                    }
                  } else {
                    // Normal play rally
                    if (rallyState.current.bouncesOpponentCourt > 1) {
                      scorePoint("PLAYER", "BALL BOUNCED TWICE ON AI COURT");
                    }
                  }
                }
              }
            }
          }

          // 2. Net impact collision check
          // Net is located at Z = 0. Its width is TABLE_DIMENSIONS.netWidth. Its height is TABLE_DIMENSIONS.netHeight
          const prevZ = ballPhysics.current.position.z - ballPhysics.current.velocity.z * dt;
          const currentZ = ballPhysics.current.position.z;

          // Crosses Z = 0 plane
          if ((prevZ < 0 && currentZ >= 0) || (prevZ > 0 && currentZ <= 0)) {
            const netHeightMax = TABLE_DIMENSIONS.height + TABLE_DIMENSIONS.netHeight;
            const netWidthMax = TABLE_DIMENSIONS.netWidth / 2;

            const isWithinNetHeight = ballPhysics.current.position.y <= netHeightMax;
            const isWithinNetWidth = Math.abs(ballPhysics.current.position.x) <= netWidthMax;

            if (isWithinNetHeight && isWithinNetWidth) {
              // Net collision response!
              audioManager.playNetTouch();
              // Back out of net plane and reverse velocity
              ballPhysics.current.position.z = prevZ;
              ballPhysics.current.velocity.z = -ballPhysics.current.velocity.z * 0.28;
              ballPhysics.current.velocity.y *= 0.8;
              // Reset rotations
              ballPhysics.current.spin.set(0, 0, 0);

              // Net touches during serve rotators rule
              if (rallyState.current.serveStatus !== ServiceStatus.NONE) {
                // If it hits net and was legal trajectory but just clip, let's declare let
                // Let's simplified to: serving player loses point, keep pace brisk and fun
                if (rallyState.current.lastStriker === "PLAYER") {
                  scorePoint("OPPONENT", "SERVE HIT THE NET");
                } else {
                  scorePoint("PLAYER", "AI SERVE HIT THE NET");
                }
              }
            }
          }

          // 3. Human paddle collision check (Player strike)
          // Player operates near Z = -1.45m. Hit boundary box checking
          const ballZ = ballPhysics.current.position.z;
          const userZ = playerPaddlePos.current.z;

          // Detect pass-by threshold
          // On player serve, require the tossed ball to have lost its momentum AND respected the toss cooldown (250ms) before hitting
          if (
            ballZ < -1.1 &&
            ballZ >= -1.6 &&
            (ballPhysics.current.velocity.z < 0 ||
              (rallyState.current.serveStatus === ServiceStatus.PLAYER_SERVE &&
                ballPhysics.current.velocity.z <= 0.01 &&
                ballPhysics.current.velocity.y < 1.8 &&
                performance.now() - lastTossTime.current > 250))
          ) {
            // Check radial proximity of ball to user paddle center
            const xDiff = ballPhysics.current.position.x - playerPaddlePos.current.x;
            const yDiff = ballPhysics.current.position.y - playerPaddlePos.current.y;
            const distance2D = Math.sqrt(xDiff * xDiff + yDiff * yDiff);

            // Sweets spot hitting threshold (default paddle width is ~0.16m, radius is 0.082m)
            // Control paddle increases sweet spot width multipliers
            const sweetSpotLimit = 0.12 * paddleConfigRef.current.controlFactor;

            if (distance2D <= sweetSpotLimit) {
              // Strike triggers!
              const userPower = paddleConfigRef.current.powerFactor;

              // Calculate 2D swipe speed of the paddle to determine the dynamic force of the hit
              const swingSpeed2D = Math.sqrt(
                playerPaddleVel.current.x * playerPaddleVel.current.x +
                playerPaddleVel.current.y * playerPaddleVel.current.y
              );

              // Solid forward shot pacing: base speed + bonus speed proportional to swipe force
              let outVelZ = 4.6 + Math.min(8.5, swingSpeed2D * 0.35) * userPower;
              outVelZ = Math.min(15.0, outVelZ);

              // Apply horizontal and vertical placement vectors depending on swipe angles!
              // X velocity: natural reflection + sweet spot offset + paddle slide speed
              let outVelX = (xDiff / sweetSpotLimit) * 1.5 + playerPaddleVel.current.x * 0.42;
              outVelX = Math.max(-5.0, Math.min(5.0, outVelX));

              // Y velocity: nice, forgiving base lift to guarantee net clearance by default,
              // plus dynamic height addition from mouse swipe up/down.
              const baseLift = 2.0;
              const contactLiftVec = (yDiff / sweetSpotLimit) * 1.5;
              const swipeLiftVec = playerPaddleVel.current.y * 0.28;

              let outVelY = baseLift + contactLiftVec + swipeLiftVec;

              // IF HOLDING CLICK during serve: hit ball downwards so it bounces on player court first (ideal for manual serve!)
              // We only allow this when serveStatus is PLAYER_SERVE and they haven't fired the serve yet,
              // so holding click has zero weird side effects on normal active rallies or subsequent hits!
              if (isMouseDown.current && rallyState.current.serveStatus === ServiceStatus.PLAYER_SERVE && !hasFiredServe.current) {
                // Advanced physics serve calculator: calculates precise downward angle based on height hit
                const ballY = ballPhysics.current.position.y;
                const ballZ = ballPhysics.current.position.z;

                const targetBounceZ = -0.72; // lands safely in the middle-back of our side
                const outVelZ_computed = 4.6; // perfect forward speed to bounce and glide over the net nicely
                const t = (targetBounceZ - ballZ) / outVelZ_computed;
                const yTarget = TABLE_DIMENSIONS.height + ballPhysics.current.radius;

                outVelY = (yTarget - ballY + 4.905 * t * t) / t;
                outVelY = Math.max(-2.4, Math.min(-1.7, outVelY)); // perfectly tuned legal limit for robust bounce and clearance

                outVelZ = outVelZ_computed;
                hasFiredServe.current = true;
              } else {
                // If swinging aggressively downwards, allow a low drive/smash (down to 1.0),
                // otherwise maintain a beautiful secure arc (minimum 1.7) to clear the net.
                const minAllowedY = playerPaddleVel.current.y < -1.0 ? 1.0 : 1.7;
                outVelY = Math.max(minAllowedY, Math.min(6.5, outVelY));
              }

              ballPhysics.current.velocity.set(outVelX, outVelY, outVelZ);

              // --- ACCELERATED SWIPE SPIN GENERATIONS ---
              // Upward strike: positive SpinX (topspin)
              // Downward strike: negative SpinX (backspin)
              // Horizontal strike: SpinY (sidespin)
              const customSpinFactor = paddleConfigRef.current.spinFactor * 14.0;
              const appliedSpinX = playerPaddleVel.current.y * customSpinFactor;
              const appliedSpinY = -playerPaddleVel.current.x * customSpinFactor * 0.85;

              // Bound spin ranges
              ballPhysics.current.spin.set(
                Math.max(-80, Math.min(80, appliedSpinX)),
                Math.max(-80, Math.min(80, appliedSpinY)),
                0
              );

              // Manage game stats on hit
              rallyState.current.lastStriker = "PLAYER";
              hasFiredServe.current = true;
              rallyState.current.bouncesOnTable = 0;
              rallyState.current.bouncesPlayerCourt = 0;
              rallyState.current.bouncesOpponentCourt = 0;

              // Register points when hits were correctly executed
              audioManager.playPaddleHit(Math.min(1.0, 0.4 + outVelZ * 0.05), false);
              triggerPulseRing(playerPaddlePos.current, 0xff8c00); // golden ring
              triggerSparks(ballPhysics.current.position, 0xff7e6b);

              onStatusUpdate("RALLY ACTIVE");
            }
          }

          // 4. Opponent paddle collision check (AI strike)
          // AI operates at Z = 1.45m
          if (ballZ > 1.1 && ballZ <= 1.6 && ballPhysics.current.velocity.z > 0) {
            const xDiff = ballPhysics.current.position.x - aiPaddlePos.current.x;
            const yDiff = ballPhysics.current.position.y - aiPaddlePos.current.y;
            const distance2D = Math.sqrt(xDiff * xDiff + yDiff * yDiff);

            const aiHitLimit = 0.12;

            if (distance2D <= aiHitLimit) {
              // AI Strike return!
              const aiDiff = difficultyConfigRef.current;

              // AI decides target landing area on player's side of table
              // Table length ranges from [-1.37, 0] on player side. Width [-0.76, +0.76]
              // AI places wide shots depending on diff.placeAggression
              const strikePlacementX = (Math.random() - 0.5) * TABLE_DIMENSIONS.width * 0.8 * aiDiff.placeAggression;
              const strikePlacementZ = -TABLE_DIMENSIONS.length * (0.3 + Math.random() * 0.55);

              // Calculate physics speeds needed to reach target
              const targetDistZ = strikePlacementZ - ballPhysics.current.position.z; // negative vector
              let timeToTransit = 0.35 + Math.random() * 0.15; // travel seconds

              // Impossible diff speeds up rallies
              if (aiDiff.id === Difficulty.IMPOSSIBLE) {
                timeToTransit = 0.22;
              }

              const outVelZ = targetDistZ / timeToTransit; // will be negative
              const outVelX = (strikePlacementX - ballPhysics.current.position.x) / timeToTransit;

              // Height arc velocity solver (adds gravity component)
              const gAction = 0.5 * 9.81 * timeToTransit;
              const outVelY = (TABLE_DIMENSIONS.height + 0.1 - ballPhysics.current.position.y) / timeToTransit + gAction;

              ballPhysics.current.velocity.set(outVelX, Math.max(1.8, outVelY), outVelZ);

              // AI applies spins depending on aggressive scores
              const topspin = -12.0 - (Math.random() * 32.0 * aiDiff.spinAggression);
              const sidespin = (Math.random() - 0.5) * 45.0 * aiDiff.spinAggression;
              ballPhysics.current.spin.set(topspin, sidespin, 0);

              rallyState.current.lastStriker = "OPPONENT";
              rallyState.current.bouncesOnTable = 0;
              rallyState.current.bouncesPlayerCourt = 0;
              rallyState.current.bouncesOpponentCourt = 0;

              audioManager.playPaddleHit(0.85, true);
              triggerPulseRing(aiPaddlePos.current, 0x4fc3f7); // blue ring
              triggerSparks(ballPhysics.current.position, 0x81d4fa);
            }
          }

          // 5. Out bounds floor collision check (Ball drops below ground)
          // OR ball flies extremely far off the boundaries
          const outOfBoundsLimits =
            ballPhysics.current.position.y < TABLE_DIMENSIONS.height - 0.4 ||
            Math.abs(ballPhysics.current.position.z) > 2.8 ||
            Math.abs(ballPhysics.current.position.x) > 1.8;

          if (outOfBoundsLimits) {
            // Ball has dropped off or missed. Determine scorer!
            if (rallyState.current.serveStatus !== ServiceStatus.NONE) {
              // Failed during serving
              if (rallyState.current.lastStriker === "PLAYER") {
                scorePoint("OPPONENT", "YOUR SERVE DROPPED OUT OF BOUNDS");
              } else if (rallyState.current.lastStriker === "OPPONENT") {
                scorePoint("PLAYER", "AI SERVE LANDED OUT OF BOUNDS");
              } else {
                // Ball was tossed but player let it drop without hitting
                if (rallyState.current.serveStatus === ServiceStatus.PLAYER_SERVE) {
                  scorePoint("OPPONENT", "YOU TOSSED AND MISSED SERVE CONTACT");
                } else {
                  scorePoint("PLAYER", "AI MISSED SERVE CONTACT");
                }
              }
            } else {
              // Normal rally scoring check
              const striker = rallyState.current.lastStriker;

              if (striker === "PLAYER") {
                // Player hit last. Check if it bounced on opponent table court first before going out!
                if (rallyState.current.bouncesOpponentCourt >= 1) {
                  scorePoint("PLAYER", "BALL WAS OUT (AI MISSED LANDING)");
                } else {
                  scorePoint("OPPONENT", "YOU HIT THE BALL OUT AND WIDE");
                }
              } else if (striker === "OPPONENT") {
                // Opponent hit last. Check if it bounced on player court first!
                if (rallyState.current.bouncesPlayerCourt >= 1) {
                  scorePoint("OPPONENT", "BALL WAS OUT (YOU MISSED LANDING)");
                } else {
                  scorePoint("PLAYER", "AI HIT THE BALL OUT");
                }
              } else {
                // Double miss safety reset
                resetBall("PLAYER");
              }
            }
          }
        } // End of playing active simulation

        // Update ball visual position
        ballMesh.position.copy(ballPhysics.current.position);

        // --- SUBTLE CINEMATIC CAMERA SWAYS ---
        // Breaths camera position smoothly depending on mouse coordinates for premium immersive feel
        const defaultCamX = 0;
        const defaultCamY = 1.40;
        const defaultCamZ = -2.55;
        const swayStrengthX = 0.24 * mouse.current.x;
        const swayStrengthY = 0.08 * mouse.current.y;

        camera.position.x += (defaultCamX + swayStrengthX - camera.position.x) * 0.04;
        camera.position.y += (defaultCamY + swayStrengthY - camera.position.y) * 0.04;
        camera.position.z += (defaultCamZ - camera.position.z) * 0.04;

        // Make camera look slightly ahead targeting ball plane
        const baseLookAt = new THREE.Vector3(0, 0.76 + 0.05, -0.15);
        const ballFocus = ballPhysics.current.position.clone();
        // Blend camera target between base and ball positions slightly for soft track sways
        const cameraTarget = new THREE.Vector3().addScaledVector(baseLookAt, 0.85).addScaledVector(ballFocus, 0.15);
        camera.lookAt(cameraTarget);
      }

      // --- RENDERS GRAPHICS ENGINE PARTICLES LIFECYCLES ---
      // 1. Trails fading lifecycle updates
      for (let i = trails.current.length - 1; i >= 0; i--) {
        const item = trails.current[i];
        item.life++;
        const ratio = 1 - item.life / item.maxLife;

        if (ratio <= 0) {
          scene.remove(item.mesh);
          item.mesh.geometry.dispose();
          if (Array.isArray(item.mesh.material)) {
            item.mesh.material.forEach((m) => m.dispose());
          } else {
            item.mesh.material.dispose();
          }
          trails.current.splice(i, 1);
        } else {
          item.mesh.scale.set(ratio, ratio, ratio);
          if (item.mesh.material instanceof THREE.Material) {
            item.mesh.material.opacity = 0.2 * ratio;
          }
        }
      }

      // 2. Pulse expand ring lifecycle updates
      for (let i = pulseRings.current.length - 1; i >= 0; i--) {
        const item = pulseRings.current[i];
        item.life++;
        const ratio = item.life / item.maxLife;

        if (ratio >= 1.0) {
          scene.remove(item.mesh);
          item.mesh.geometry.dispose();
          if (Array.isArray(item.mesh.material)) {
            item.mesh.material.forEach((m) => m.dispose());
          } else {
            item.mesh.material.dispose();
          }
          pulseRings.current.splice(i, 1);
        } else {
          const sc = 1 + ratio * 3.5;
          item.mesh.scale.set(sc, sc, 1);
          if (item.mesh.material instanceof THREE.Material) {
            item.mesh.material.opacity = 0.6 * (1 - ratio);
          }
        }
      }

      // 3. Sparks particle lifecycles physics updates
      for (let i = particles.current.length - 1; i >= 0; i--) {
        const item = particles.current[i];
        item.life++;
        const ratio = 1 - item.life / item.maxLife;

        if (ratio <= 0) {
          scene.remove(item.mesh);
          item.mesh.geometry.dispose();
          if (Array.isArray(item.mesh.material)) {
            item.mesh.material.forEach((m) => m.dispose());
          } else {
            item.mesh.material.dispose();
          }
          particles.current.splice(i, 1);
        } else {
          // Downward gravity pull
          item.velocity.y -= 9.81 * dt;
          item.mesh.position.addScaledVector(item.velocity, dt);
          item.mesh.scale.set(ratio, ratio, ratio);
          if (item.mesh.material instanceof THREE.Material) {
            item.mesh.material.opacity = ratio;
          }
        }
      }

      // Redraw scene
      renderer.render(scene, camera);
    };

    // Begin looping
    gameLoop();

    // Cleanups
    return () => {
      cancelAnimationFrame(id);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("touchstart", handleTouchStart);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", handleTouchEnd);
      window.removeEventListener("mousedown", handleMouseDown);
      window.removeEventListener("mouseup", handleMouseUp);
      window.removeEventListener("click", handleMouseClick);
      resizeObserver.disconnect();

      // Clear Three resources
      trails.current.forEach((t) => scene.remove(t.mesh));
      pulseRings.current.forEach((p) => scene.remove(p.mesh));
      particles.current.forEach((p) => scene.remove(p.mesh));
      renderer.dispose();
    };
  }, [gameMode, isPaused]);

  return (
    <div
      id="game-container"
      ref={containerRef}
      className={`w-full h-full relative select-none ${cursorUnlocked ? "cursor-default" : "cursor-none"}`}
    >
      <canvas ref={canvasRef} className="w-full h-full block" />
      {cursorUnlocked && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 px-5 py-2.5 bg-[#4A433F]/90 backdrop-blur-md rounded-full text-[10px] text-[#F5F2ED] uppercase tracking-[0.2em] font-bold shadow-lg z-50 pointer-events-none animate-pulse">
          Cursor Unlocked • Press ALT to lock and play
        </div>
      )}
    </div>
  );
};
