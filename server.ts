import express from "express";
import path from "path";
import { createServer as createHttpServer } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { createServer as createViteServer } from "vite";

async function startServer() {
    const app = express();
    const PORT = 3000;
    const server = createHttpServer(app);

    // Initialize WebSockets on the same server
    const wss = new WebSocketServer({ noServer: true });

    interface PlayerSession {
        id: string;
        ws: WebSocket;
        nickname: string;
        role: "host" | "guest";
        paddleType: string;
    }

    interface Room {
        id: string;
        players: PlayerSession[];
    }

    // Active rooms map (Room ID -> Room structure)
    const rooms = new Map<string, Room>();

    wss.on("connection", (ws: WebSocket) => {
        let currentRoomId: string | null = null;
        let playerId: string | null = null;

        ws.on("message", (message: string) => {
            try {
                const data = JSON.parse(message);

                if (data.type === "join") {
                    const { roomId, nickname, paddleType } = data;
                    currentRoomId = roomId.toUpperCase().trim();
                    playerId = Math.random().toString(36).substring(2, 9);

                    let room = rooms.get(currentRoomId);
                    if (!room) {
                        room = { id: currentRoomId, players: [] };
                        rooms.set(currentRoomId, room);
                    }

                    if (room.players.length >= 2) {
                        ws.send(JSON.stringify({ type: "error", message: "Room is full. Max 2 players." }));
                        return;
                    }

                    const role = room.players.length === 0 ? "host" : "guest";
                    const newPlayer: PlayerSession = {
                        id: playerId,
                        ws,
                        nickname,
                        role,
                        paddleType,
                    };

                    room.players.push(newPlayer);

                    // Get clean list of players for the lobby
                    const playersList = room.players.map(p => ({
                        id: p.id,
                        nickname: p.nickname,
                        role: p.role,
                        paddleType: p.paddleType,
                    }));

                    // Notify everyone in the room about updated layout
                    room.players.forEach(p => {
                        p.ws.send(JSON.stringify({
                            type: "room_state",
                            roomId: currentRoomId,
                            myId: p.id,
                            myRole: p.role,
                            players: playersList,
                        }));
                    });

                    // If the guest just joined, send a warm start match ping
                    if (role === "guest") {
                        room.players.forEach(p => {
                            p.ws.send(JSON.stringify({
                                type: "system_msg",
                                text: "Both players connected. Let the rally begin!",
                            }));
                        });
                    }

                } else if (
                    data.type === "paddle_move" ||
                    data.type === "ball_hit" ||
                    data.type === "ball_toss" ||
                    data.type === "score_point" ||
                    data.type === "restart_match" ||
                    data.type === "reset_rally"
                ) {
                    if (!currentRoomId) return;
                    const room = rooms.get(currentRoomId);
                    if (!room) return;

                    // Relay physics coordinates/vectors or score mutations to the other player immediately
                    room.players.forEach(p => {
                        if (p.id !== playerId) {
                            p.ws.send(message);
                        }
                    });
                }
            } catch (err) {
                console.error("Failed to parse WebSocket signal:", err);
            }
        });

        ws.on("close", () => {
            if (currentRoomId && playerId) {
                const room = rooms.get(currentRoomId);
                if (room) {
                    room.players = room.players.filter(p => p.id !== playerId);
                    if (room.players.length === 0) {
                        rooms.delete(currentRoomId);
                    } else {
                        const playersList = room.players.map(p => ({
                            id: p.id,
                            nickname: p.nickname,
                            role: p.role,
                            paddleType: p.paddleType,
                        }));

                        room.players.forEach(p => {
                            p.ws.send(JSON.stringify({
                                type: "room_state",
                                roomId: currentRoomId,
                                myId: p.id,
                                myRole: p.role,
                                players: playersList,
                            }));
                            p.ws.send(JSON.stringify({
                                type: "system_msg",
                                text: "Your opponent left the arena. Waiting for reconnection...",
                            }));
                        });
                    }
                }
            }
        });
    });

    // Upgrade requests handled on port 3000
    server.on("upgrade", (request, socket, head) => {
        wss.handleUpgrade(request, socket, head, (ws) => {
            wss.emit("connection", ws, request);
        });
    });

    // Health endpoint
    app.get("/api/health", (req, res) => {
        res.json({ status: "ok", activeRooms: rooms.size });
    });

    // Serve static assets or use Vite dev server
    if (process.env.NODE_ENV !== "production") {
        const vite = await createViteServer({
            server: { middlewareMode: true },
            appType: "spa",
        });
        app.use(vite.middlewares);
    } else {
        const distPath = path.join(process.cwd(), "dist");
        app.use(express.static(distPath));
        app.get("*", (req, res) => {
            res.sendFile(path.join(distPath, "index.html"));
        });
    }

    server.listen(PORT, "0.0.0.0", () => {
        console.log(`Server listening on port ${PORT}`);
    });
}

startServer();
