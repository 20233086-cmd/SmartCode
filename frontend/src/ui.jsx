import React, { useEffect, useRef } from "react";
import {
  ArrowRight,
  AlertCircle,
  LoaderCircle,
  LogOut,
  BookOpen,
  Check,
  Code2,
  X,
  ChevronRight,
} from "lucide-react";
import { go, useSession } from "./api";
export const Link = ({ to, children, className = "", ...props }) => (
  <a href={"#" + to} className={className} {...props}>
    {children}
  </a>
);
export const Badge = ({ children, tone = "blue" }) => (
  <span className={"badge " + tone}>{children}</span>
);
export const Button = ({
  children,
  variant = "primary",
  busy = false,
  className = "",
  ...props
}) => (
  <button
    {...props}
    disabled={busy || props.disabled}
    className={`btn ${variant} ${className}`}
  >
    {busy && <LoaderCircle size={16} className="spin" />}
    {children}
  </button>
);
export const Card = ({ children, className = "", ...props }) => (
  <section className={"card " + className} {...props}>
    {children}
  </section>
);
export function LogoutButton({ className = "", ...props }) {
  const { logout, isLoggingOut } = useSession();
  return (
    <Button
      {...props}
      type="button"
      variant="secondary"
      className={"logout-button " + className}
      busy={isLoggingOut}
      aria-busy={isLoggingOut}
      onClick={logout}
    >
      {!isLoggingOut && <LogOut size={16} aria-hidden="true" />}
      <span>{isLoggingOut ? "Đang đăng xuất…" : "Đăng xuất"}</span>
    </Button>
  );
}
export function Empty({ title = "Chưa có dữ liệu", children, action }) {
  return (
    <div className="empty">
      <BookOpen size={30} />
      <h3>{title}</h3>
      <p>{children || "Bắt đầu học để lưu lại hành trình của bạn."}</p>
      {action}
    </div>
  );
}
export function Loading() {
  return (
    <div className="loading" role="status">
      <LoaderCircle className="spin" /> Đang tải dữ liệu…
    </div>
  );
}
export function ErrorBox({ error, retry }) {
  return (
    <Card className="error-box">
      <AlertCircle />
      <div>
        <h3>Chưa tải được nội dung</h3>
        <p>{error?.message || "Vui lòng kiểm tra kết nối với máy chủ."}</p>
        {retry && (
          <Button variant="secondary" onClick={retry}>
            Thử lại
          </Button>
        )}
      </div>
    </Card>
  );
}
export function DataState({ resource, children }) {
  if (resource.loading) return <Loading />;
  if (resource.error)
    return <ErrorBox error={resource.error} retry={resource.reload} />;
  return children(resource.data);
}
export function PageTitle({ eyebrow, title, description, children }) {
  return (
    <header className="page-title">
      <div>
        {eyebrow && <div className="eyebrow">{eyebrow}</div>}
        <h1>{title}</h1>
        {description && <p>{description}</p>}
      </div>
      <div className="title-actions">{children}</div>
    </header>
  );
}
export function Stat({ label, value, icon: Icon, sub, tone = "blue" }) {
  return (
    <Card className={"stat " + tone}>
      <div className="stat-label">
        {label}
        {Icon && <Icon size={18} />}
      </div>
      <strong>{value}</strong>
      {sub && <small>{sub}</small>}
    </Card>
  );
}
export function ProgressBar({ value = 0, color = "blue" }) {
  return (
    <div
      className="progress-track"
      role="progressbar"
      aria-valuenow={Math.round(value)}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className={color}
        style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
      />
    </div>
  );
}
export function Modal({ title, children, onClose, wide = false }) {
  const ref = useRef(null);
  useEffect(() => {
    const before = document.activeElement;
    ref.current?.showModal();
    const dialog = ref.current;
    return () => {
      dialog?.close();
      before?.focus?.();
    };
  }, []);
  return (
    <dialog
      ref={ref}
      className={"modal " + (wide ? "wide" : "")}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="modal-title">
        <h2>{title}</h2>
        <button aria-label="Đóng" className="icon-btn" onClick={onClose}>
          <X />
        </button>
      </div>
      {children}
    </dialog>
  );
}
export function Field({ label, children, hint }) {
  return (
    <label className="field">
      <span>{label}</span>
      {children}
      {hint && <small>{hint}</small>}
    </label>
  );
}
export function Tabs({ items, active, onChange }) {
  return (
    <div className="tabs">
      {items.map((i) => (
        <button
          key={i.id}
          className={active === i.id ? "active" : ""}
          onClick={() => onChange(i.id)}
        >
          {i.icon && <i.icon size={17} />} {i.label}
        </button>
      ))}
    </div>
  );
}
export function CourseCard({ course, action, progress }) {
  return (
    <Card className="course-card">
      <div className={"course-cover " + course.color}>
        <div className="cover-shape" />
        <span className="language-mark">
          {course.language === "java"
            ? "Java"
            : course.language === "python"
              ? "Py"
              : "JS"}
        </span>
        <Badge tone="white">
          {{ basic: "CƠ BẢN", intermediate: "VẬN DỤNG", advanced: "NÂNG CAO" }[course.level || "basic"]}
        </Badge>
        <span className="cover-code">{"{ }"}</span>
      </div>
      <div className="course-body">
        <div className="row between">
          <Badge tone="green">
            {course.price === 0 ? "Miễn phí" : Number(course.price).toLocaleString("vi-VN") + " đ"}
          </Badge>
          <small>{course.lessons_count} bài học</small>
        </div>
        <h3>{course.title}</h3>
        <p>{course.description}</p>
        <div className="course-meta">
          <BookOpen size={15} />
          {course.lessons_count} lý thuyết <Code2 size={15} />
          {course.exercises_count} bài tập
        </div>
        {progress !== undefined && <ProgressBar value={progress} />}
        <div className="course-bottom">
          {action || (
            <Link className="text-link" to={"/courses/" + course.id}>
              Khám phá khóa học <ArrowRight size={16} />
            </Link>
          )}
        </div>
      </div>
    </Card>
  );
}
export function Status({ value }) {
  const names = {
    AC: "Đạt",
    WA: "Sai kết quả",
    CE: "Lỗi biên dịch",
    RE: "Lỗi thực thi",
    TLE: "Quá thời gian",
    paid: "Đã xác nhận",
    pending: "Đang chờ",
    resolved: "Đã xử lý",
    open: "Đang mở",
    closed: "Đã đóng",
  };
  return (
    <Badge
      tone={
        ["AC", "paid", "resolved"].includes(value)
          ? "green"
          : ["WA", "CE", "RE", "TLE"].includes(value)
            ? "red"
            : "blue"
      }
    >
      {names[value] || value}
    </Badge>
  );
}
export const Breadcrumb = ({ items }) => (
  <nav className="breadcrumb">
    {items.map((i, n) => (
      <React.Fragment key={n}>
        {n > 0 && <ChevronRight size={14} />}{" "}
        {i.to ? <Link to={i.to}>{i.label}</Link> : <span>{i.label}</span>}
      </React.Fragment>
    ))}
  </nav>
);
export function CodeBlock({ children }) {
  return (
    <pre className="code-block">
      <code>{children}</code>
    </pre>
  );
}
