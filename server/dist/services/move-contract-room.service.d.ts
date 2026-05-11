export type MoveContractRoomFailure = {
    ok: false;
    status: number;
    message: string;
};
export type MoveContractRoomOk = {
    ok: true;
};
/**
 * Өрөө солих хүсэлт шийдвэрлэгдэх үед гэрээний өрөөг шилжүүлнэ (/contracts/me-д гарна).
 */
export declare function moveStudentContractToRoom(userId: string, newRoomId: string): Promise<MoveContractRoomFailure | MoveContractRoomOk>;
