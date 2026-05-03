import { Injectable, NestMiddleware, UnauthorizedException } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';
import passport from 'passport';
import { AuthUser } from './auth-user';

type RequestWithAuth = Request & {
  user?: AuthUser;
};

@Injectable()
export class JwtAuthMiddleware implements NestMiddleware {
  use(request: RequestWithAuth, response: Response, next: NextFunction) {
    passport.authenticate(
      'jwt',
      { session: false },
      (error: unknown, user?: AuthUser) => {
        if (error) {
          return next(error);
        }

        if (!user) {
          return next(new UnauthorizedException('Invalid access token.'));
        }

        request.user = user;
        return next();
      },
    )(request, response, next);
  }
}
