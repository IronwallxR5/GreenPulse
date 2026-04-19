import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import ProjectRepository from '../repositories/project.repository';
import RbacService from '../services/rbac.service';

interface SocketJwtPayload {
  userId: number;
}

interface SubscribePayload {
  projectId: number;
}

interface SubscribeAck {
  ok: boolean;
  message?: string;
  projectId?: number;
}

interface ThresholdAlertPayload {
  projectId: number;
  totalCO2: number;
  budget: number;
  message: string;
  timestamp: string;
}

let ioInstance: Server | null = null;
const projectRepository = new ProjectRepository();
const rbacService = new RbacService();

const getRoomName = (projectId: number) => `project:${projectId}`;

const parseToken = (socket: Socket): string | null => {
  const authToken = typeof socket.handshake.auth.token === 'string'
    ? socket.handshake.auth.token
    : undefined;
  const queryToken = typeof socket.handshake.query.token === 'string'
    ? socket.handshake.query.token
    : undefined;

  return authToken || queryToken || null;
};

const verifyToken = (token: string): number => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('Server configuration error');
  }

  const decoded = jwt.verify(token, secret) as SocketJwtPayload;
  return decoded.userId;
};

const subscribeProject = async (
  socket: Socket,
  payload: SubscribePayload,
  acknowledge?: (response: SubscribeAck) => void,
) => {
  const projectId = Number(payload?.projectId);
  if (!Number.isInteger(projectId) || projectId <= 0) {
    acknowledge?.({ ok: false, message: 'Invalid project id' });
    return;
  }

  const project = await projectRepository.findById(projectId);
  if (!project || !rbacService.hasProjectPermission(project, socket.data.userId, 'PROJECT_VIEW')) {
    acknowledge?.({ ok: false, message: 'Unauthorized project subscription' });
    return;
  }

  await socket.join(getRoomName(projectId));
  acknowledge?.({ ok: true, projectId });
};

const unsubscribeProject = async (
  socket: Socket,
  payload: SubscribePayload,
  acknowledge?: (response: SubscribeAck) => void,
) => {
  const projectId = Number(payload?.projectId);
  if (!Number.isInteger(projectId) || projectId <= 0) {
    acknowledge?.({ ok: false, message: 'Invalid project id' });
    return;
  }

  await socket.leave(getRoomName(projectId));
  acknowledge?.({ ok: true, projectId });
};

export const initializeAlertSocketGateway = (httpServer: HttpServer): Server => {
  const io = new Server(httpServer, {
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:5173',
      credentials: true,
    },
    transports: ['websocket', 'polling'],
  });

  io.use((socket, next) => {
    try {
      const token = parseToken(socket);
      if (!token) {
        next(new Error('Authentication token is required'));
        return;
      }

      socket.data.userId = verifyToken(token);
      next();
    } catch (error) {
      next(new Error('Invalid or expired token'));
    }
  });

  io.on('connection', (socket) => {
    socket.emit('connected', { timestamp: new Date().toISOString() });

    socket.on('subscribe-project', (payload: SubscribePayload, acknowledge?: (response: SubscribeAck) => void) => {
      void subscribeProject(socket, payload, acknowledge).catch(() => {
        acknowledge?.({ ok: false, message: 'Failed to subscribe project' });
      });
    });

    socket.on('unsubscribe-project', (payload: SubscribePayload, acknowledge?: (response: SubscribeAck) => void) => {
      void unsubscribeProject(socket, payload, acknowledge).catch(() => {
        acknowledge?.({ ok: false, message: 'Failed to unsubscribe project' });
      });
    });
  });

  ioInstance = io;
  return io;
};

export const emitThresholdAlertToProject = (payload: ThresholdAlertPayload) => {
  if (!ioInstance) {
    return;
  }

  ioInstance.to(getRoomName(payload.projectId)).emit('threshold-alert', payload);
};
