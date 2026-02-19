import { WebSocketServer, WebSocket } from "ws";
import type { Server } from "http";
import type {
  WSMessage,
  WSAuthPayload,
  ConnectedClient,
  WSRideOfferedPayload,
  WSRideStatusChangedPayload,
  WSDriverLocationPayload,
} from "./types";

/**
 * WebSocket Server Manager
 * Handles real-time communication between passengers, drivers, and admin
 */

class RealtimeManager {
  private wss: WebSocketServer | null = null;
  private clients: Map<WebSocket, ConnectedClient> = new Map();
  private rideRooms: Map<number, Set<WebSocket>> = new Map(); // rideId -> Set of WebSocket connections

  /**
   * Initialize WebSocket server
   */
  initialize(server: Server) {
    this.wss = new WebSocketServer({ server, path: "/ws" });

    this.wss.on("connection", (ws: WebSocket) => {
      console.log("[WebSocket] New connection");

      ws.on("message", (data: Buffer) => {
        try {
          const message: WSMessage = JSON.parse(data.toString());
          this.handleMessage(ws, message);
        } catch (error) {
          console.error("[WebSocket] Failed to parse message:", error);
          this.sendError(ws, "Invalid message format");
        }
      });

      ws.on("close", () => {
        console.log("[WebSocket] Connection closed");
        this.handleDisconnect(ws);
      });

      ws.on("error", (error) => {
        console.error("[WebSocket] Error:", error);
      });
    });

    console.log("[WebSocket] Server initialized on /ws");
  }

  /**
   * Handle incoming messages
   */
  private handleMessage(ws: WebSocket, message: WSMessage) {
    switch (message.type) {
      case "auth":
        this.handleAuth(ws, message.payload as WSAuthPayload);
        break;
      case "driver_location_update":
        this.handleDriverLocationUpdate(ws, message.payload as WSDriverLocationPayload);
        break;
      case "ping":
        this.send(ws, { type: "pong", payload: {}, timestamp: Date.now() });
        break;
      default:
        console.warn("[WebSocket] Unknown message type:", message.type);
    }
  }

  /**
   * Authenticate client
   */
  private handleAuth(ws: WebSocket, payload: WSAuthPayload) {
    const client: ConnectedClient = {
      userId: payload.userId,
      role: payload.role,
    };

    this.clients.set(ws, client);
    console.log(`[WebSocket] Client authenticated: userId=${payload.userId}, role=${payload.role}`);

    this.send(ws, {
      type: "auth",
      payload: { success: true },
      timestamp: Date.now(),
    });
  }

  /**
   * Handle driver location updates
   */
  private handleDriverLocationUpdate(ws: WebSocket, payload: WSDriverLocationPayload) {
    const client = this.clients.get(ws);
    
    if (!client || client.role !== "driver") {
      this.sendError(ws, "Unauthorized: Only drivers can send location updates");
      return;
    }

    // If driver is in an active ride, broadcast location to that ride's room
    if (payload.rideId) {
      this.broadcastToRide(payload.rideId, {
        type: "driver_location_update",
        payload,
        timestamp: Date.now(),
      }, ws); // Exclude sender
    }
  }

  /**
   * Notify driver about new ride offer
   */
  notifyRideOffered(driverId: number, payload: WSRideOfferedPayload) {
    const driverWs = this.findClientByUserId(driverId, "driver");
    
    if (driverWs) {
      this.send(driverWs, {
        type: "ride_offered",
        payload,
        timestamp: Date.now(),
      });
      console.log(`[WebSocket] Ride ${payload.rideId} offered to driver ${driverId}`);
    } else {
      console.warn(`[WebSocket] Driver ${driverId} not connected`);
    }
  }

  /**
   * Notify about ride status change
   */
  notifyRideStatusChanged(rideId: number, payload: WSRideStatusChangedPayload) {
    this.broadcastToRide(rideId, {
      type: "ride_status_changed",
      payload,
      timestamp: Date.now(),
    });
    console.log(`[WebSocket] Ride ${rideId} status changed: ${payload.oldStatus} -> ${payload.newStatus}`);
  }

  /**
   * Notify about driver location update
   */
  notifyDriverLocationUpdate(rideId: number, payload: WSDriverLocationPayload) {
    this.broadcastToRide(rideId, {
      type: "driver_location_update",
      payload,
      timestamp: Date.now(),
    });
  }

  /**
   * Join a ride room
   */
  joinRideRoom(rideId: number, userId: number, role: "passenger" | "driver") {
    const ws = this.findClientByUserId(userId, role);
    
    if (ws) {
      if (!this.rideRooms.has(rideId)) {
        this.rideRooms.set(rideId, new Set());
      }
      this.rideRooms.get(rideId)!.add(ws);
      
      // Update client's active ride
      const client = this.clients.get(ws);
      if (client) {
        client.activeRideId = rideId;
      }
      
      console.log(`[WebSocket] ${role} ${userId} joined ride room ${rideId}`);
    }
  }

  /**
   * Leave a ride room
   */
  leaveRideRoom(rideId: number, userId: number, role: "passenger" | "driver") {
    const ws = this.findClientByUserId(userId, role);
    
    if (ws) {
      const room = this.rideRooms.get(rideId);
      if (room) {
        room.delete(ws);
        if (room.size === 0) {
          this.rideRooms.delete(rideId);
        }
      }
      
      // Clear client's active ride
      const client = this.clients.get(ws);
      if (client) {
        client.activeRideId = undefined;
      }
      
      console.log(`[WebSocket] ${role} ${userId} left ride room ${rideId}`);
    }
  }

  /**
   * Broadcast message to all clients in a ride room
   */
  private broadcastToRide(rideId: number, message: WSMessage, exclude?: WebSocket) {
    const room = this.rideRooms.get(rideId);
    
    if (room) {
      room.forEach((ws) => {
        if (ws !== exclude && ws.readyState === WebSocket.OPEN) {
          this.send(ws, message);
        }
      });
    }
  }

  /**
   * Find client WebSocket by userId and role
   */
  private findClientByUserId(userId: number, role: "passenger" | "driver" | "admin"): WebSocket | null {
    const entries = Array.from(this.clients.entries());
    for (const [ws, client] of entries) {
      if (client.userId === userId && client.role === role && ws.readyState === WebSocket.OPEN) {
        return ws;
      }
    }
    return null;
  }

  /**
   * Send message to specific client
   */
  private send(ws: WebSocket, message: WSMessage) {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message));
    }
  }

  /**
   * Send error message
   */
  private sendError(ws: WebSocket, error: string) {
    this.send(ws, {
      type: "error",
      payload: { error },
      timestamp: Date.now(),
    });
  }

  /**
   * Handle client disconnect
   */
  private handleDisconnect(ws: WebSocket) {
    const client = this.clients.get(ws);
    
    if (client) {
      // Remove from ride rooms
      if (client.activeRideId) {
        const room = this.rideRooms.get(client.activeRideId);
        if (room) {
          room.delete(ws);
          if (room.size === 0) {
            this.rideRooms.delete(client.activeRideId);
          }
        }
      }
      
      this.clients.delete(ws);
      console.log(`[WebSocket] Client disconnected: userId=${client.userId}, role=${client.role}`);
    }
  }

  /**
   * Get connected clients count
   */
  getConnectedCount(): number {
    return this.clients.size;
  }

  /**
   * Get active ride rooms count
   */
  getActiveRoomsCount(): number {
    return this.rideRooms.size;
  }
}

// Singleton instance
export const realtimeManager = new RealtimeManager();
