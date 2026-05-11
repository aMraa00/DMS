/**
 * Демо хэрэглэгчдийг idempotent горимоор оруулах — local нэвтрэлт:
 * `{ mode: "local", email, password }` (нууц үгийг процессын төгсгөлд консолоор харуулна)
 */
export declare function seedDemoUsers(): Promise<{
    count: number;
    demoPassword: string;
}>;
