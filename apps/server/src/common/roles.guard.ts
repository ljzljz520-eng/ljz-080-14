import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from './roles.decorator.js';
import { UserRole } from '../database/types.js';

/**
 * 极简角色守卫：演示环境通过请求头 x-user-role / x-user-id 识别身份。
 * manager=管家(PC端)  caregiver=护工(H5)  family=家属(H5)
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!required || required.length === 0) return true;

    const req = context.switchToHttp().getRequest<{
      headers: Record<string, string | undefined>;
    }>();
    const role =
      (req.headers['x-user-role'] as UserRole | undefined) ?? 'manager';
    if (!required.includes(role)) {
      throw new ForbiddenException('当前角色无权访问该功能');
    }
    return true;
  }
}
