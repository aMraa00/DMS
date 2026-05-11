import type { IUser } from '../models/User.model.js';
/** WEST `POST .../students/login`-ийн бодит хариу болон хувилбарууд */
export type WestLoginResponse = {
    success?: boolean;
    token?: string;
    message?: string;
    user?: Record<string, unknown>;
    student?: Record<string, unknown>;
    data?: Record<string, unknown>;
};
/** WEST SSO; амжилттай бол `user` эсвэл `student`/`data` объектыг буцаана. */
export declare function westStudentLogin(loginName: string, password: string, url: string, timeoutMs: number): Promise<WestLoginResponse>;
export declare function westPayloadToProfile(body: WestLoginResponse): Partial<IUser> & {
    westLoginName: string;
};
