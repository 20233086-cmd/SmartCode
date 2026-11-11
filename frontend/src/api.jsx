import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
} from "react";
export async function api(path, opts = {}) {
  const { body, ...rest } = opts;
  const isForm = body instanceof FormData;
  const response = await fetch("/api" + path, {
    credentials: "include",
    ...rest,
    headers: {
      ...(!isForm && body !== undefined
        ? { "Content-Type": "application/json" }
        : {}),
      ...(opts.headers || {}),
    },
    body: body === undefined ? undefined : isForm ? body : JSON.stringify(body),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = Array.isArray(data.detail)
      ? data.detail
          .map((d) => `${d.loc?.slice(1).join(".")}: ${d.msg}`)
          .join("; ")
      : data.detail;
    const error = new Error(
      message || "Không thể thực hiện yêu cầu. Vui lòng thử lại.",
    );
    error.status = response.status;
    throw error;
  }
  return data;
}
export const post = (path, body = {}) => api(path, { method: "POST", body });
export function useData(path, { background = false } = {}) {
  const previousPath = useRef(null);
  const [state, setState] = useState({
    data: null,
    loading: true,
    error: null,
  });
  const [version, setVersion] = useState(0);
  useEffect(() => {
    let valid = true;
    if (!path) {
      setState({ data: null, loading: false, error: null });
      return;
    }
    const keep = background && previousPath.current === path;
    previousPath.current = path;
    setState((s) => ({ data: keep ? s.data : null, loading: !keep || !s.data, error: null }));
    api(path)
      .then((data) => valid && setState({ data, loading: false, error: null }))
      .catch(
        (error) => valid && setState({ data: null, loading: false, error }),
      );
    return () => {
      valid = false;
    };
  }, [path, version]);
  return { ...state, reload: useCallback(() => setVersion((v) => v + 1), []) };
}
const SessionContext = createContext(null);
export const useSession = () => useContext(SessionContext);
export function SessionProvider({ children }) {
  const [user, setUser] = useState(null),
    [loading, setLoading] = useState(true),
    [isLoggingOut, setIsLoggingOut] = useState(false),
    [toast, setToast] = useState(null);
  const logoutPending = useRef(false);
  useEffect(() => {
    api("/auth/me")
      .then(setUser)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);
  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(null), 5500);
      return () => clearTimeout(t);
    }
  }, [toast]);
  const notify = useCallback(
    (message, type = "success") => setToast({ message, type }),
    [],
  );
  const logout = async () => {
    if (logoutPending.current) return;
    logoutPending.current = true;
    setIsLoggingOut(true);
    try {
      await post("/auth/logout");
      setUser(null);
      go("/login");
      notify("Đã đăng xuất.");
    } catch (e) {
      notify("Chưa đăng xuất được. " + e.message, "error");
    } finally {
      logoutPending.current = false;
      setIsLoggingOut(false);
    }
  };
  return (
    <SessionContext.Provider value={{ user, setUser, loading, notify, logout, isLoggingOut }}>
      {children}
      {toast && (
        <div
          className={"toast " + toast.type}
          role="status"
          onClick={() => setToast(null)}
        >
          {toast.type === "error" ? "⚠" : "✓"} {toast.message}
        </div>
      )}
    </SessionContext.Provider>
  );
}
export function useAction() {
  const [busy, setBusy] = useState(false);
  const { notify } = useSession();
  return [
    busy,
    async (fn, success) => {
      if (busy) return;
      setBusy(true);
      try {
        const result = await fn();
        if (success) notify(success);
        return result;
      } catch (e) {
        notify(e.message, "error");
        return undefined;
      } finally {
        setBusy(false);
      }
    },
  ];
}
export function go(path) {
  location.hash = path;
}
export function useRoute() {
  const [route, setRoute] = useState(location.hash.slice(1) || "/");
  useEffect(() => {
    const change = () => {
      setRoute(location.hash.slice(1) || "/");
      window.scrollTo(0, 0);
    };
    addEventListener("hashchange", change);
    return () => removeEventListener("hashchange", change);
  }, []);
  return route;
}
export const money = (n) => Number(n || 0).toLocaleString("vi-VN") + " đ";
export const number = (n) => Number(n || 0).toLocaleString("vi-VN");
export const dateTime = (s) =>
  s
    ? new Date(s.endsWith("Z") || s.includes("+") ? s : s + "Z").toLocaleString(
        "vi-VN",
      )
    : "—";
export const timeCode = (s) =>
  `${Math.floor((s || 0) / 60)}:${String(Math.floor((s || 0) % 60)).padStart(2, "0")}`;
