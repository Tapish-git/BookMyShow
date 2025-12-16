export { };

interface ProcessEnv {
    [key: string]: string | undefined;
    VITE_API_BASE_URL: string;
    NODE_ENV: 'development' | 'production' | 'test';
}

interface Process {
    env: ProcessEnv;
}

declare global {
    var process: Process;
}
