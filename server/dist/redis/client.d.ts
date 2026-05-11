import { Redis } from 'ioredis';
export declare function getRedis(): Redis | null;
export declare function rememberRefresh(userId: string, jti: string, ttlSeconds: number): Promise<void>;
export declare function forgetRefresh(userId: string, jti: string): Promise<void>;
export declare function hasRefresh(userId: string, jti: string): Promise<boolean>;
