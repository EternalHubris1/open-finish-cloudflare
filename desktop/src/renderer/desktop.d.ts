export {};

declare global {
  interface Window {
    eternalDesktop: {
      getRuntimeInfo(): Promise<{
        appVersion: string;
        defaultRemoteApiUrl: string;
      }>;
      probeRemoteApi(remoteApiUrl: string): Promise<{
        reachable: boolean;
        remoteApiUrl: string;
        status: number | null;
        authenticationRequired: boolean;
      }>;
    };
  }
}
