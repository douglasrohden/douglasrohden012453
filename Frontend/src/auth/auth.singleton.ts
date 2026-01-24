export type LogoutFn = (redirectTo?: string) => void;

export const auth = {
  logout: (() => {}) as LogoutFn,
  bindLogout(fn: LogoutFn) {
    this.logout = fn;
  },
};
