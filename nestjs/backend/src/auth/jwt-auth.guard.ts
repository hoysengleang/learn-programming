import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

// Legacy custom jwt version:
// import {
//   CanActivate,
//   ExecutionContext,
//   Injectable,
//   UnauthorizedException,
// } from '@nestjs/common';
// import { ConfigService } from '@nestjs/config';
// import * as jwt from 'jsonwebtoken';
// import { AuthUser } from './auth-user';
//
// type RequestWithAuth = {
//   headers: Record<string, string | string[] | undefined>;
//   user?: AuthUser;
// };
//
// @Injectable()
// export class JwtAuthGuard implements CanActivate {
//   constructor(private readonly config: ConfigService) {}
//
//   canActivate(context: ExecutionContext): boolean {
//     const request = context
//       .switchToHttp()
//       .getRequest<RequestWithAuth>();
//     const headerValue = request.headers.authorization;
//     const header = Array.isArray(headerValue) ? headerValue[0] : headerValue;
//     const token = header?.startsWith('Bearer ') ? header.slice(7) : null;
//
//     if (!token) {
//       throw new UnauthorizedException('Access token is required.');
//     }
//
//     const secret = this.config.get<string>('JWT_SECRET');
//     if (!secret) {
//       throw new Error('JWT_SECRET is required.');
//     }
//
//     try {
//       const payload = jwt.verify(token, secret) as jwt.JwtPayload;
//
//       if (!payload.sub || typeof payload.sub !== 'string') {
//         throw new UnauthorizedException('Invalid access token.');
//       }
//
//       request.user = {
//         id: payload.sub,
//         email: typeof payload.email === 'string' ? payload.email : '',
//       };
//
//       return true;
//     } catch {
//       throw new UnauthorizedException('Invalid access token.');
//     }
//   }
// }

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
