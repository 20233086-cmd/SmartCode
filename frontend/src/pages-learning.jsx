import { LEVEL_NAMES } from "./payments";
import { PracticePage } from "./practice";
import React, { useState, useEffect, useRef, lazy, Suspense } from "react";
import {
  ArrowRight,
  ArrowLeft,
  BookOpen,
  Code2,
  Play,
  Check,
  CheckCircle2,
  Flame,
  Trophy,
  Target,
  Clock,
  BarChart3,
  Sparkles,
  ChevronRight,
  Download,
  Bookmark,
  Send,
  Save,
  RotateCcw,
  Flag,
  Smile,
  Meh,
  Frown,
  GraduationCap,
  Video,
  Search,
  ListChecks,
  Lightbulb,
  Trash2,
} from "lucide-react";
import {
  api,
  post,
  useData,
  useAction,
  useSession,
  go,
  money,
  number,
  dateTime,
  timeCode,
} from "./api";
import {
  Link,
  Badge,
  Button,
  LogoutButton,
  Card,
  PageTitle,
  Stat,
  ProgressBar,
  Modal,
  Field,
  Tabs,
  CourseCard,
  Status,
  Breadcrumb,
  CodeBlock,
  Empty,
  Loading,
  ErrorBox,
  DataState,
} from "./ui";
import { Bars, Lines, Weekly, Donut, Radar } from "./charts";
const CodeEditor = lazy(() => import("./CodeEditor"));
export function Landing() {
  const r = useData("/courses");
  return (
    <>
      <section className="landing-hero">
        <div className="hero-copy">
          <Badge tone="white">TỪ DÒNG CODE ĐẦU TIÊN</Badge>
          <h1>
            Học lập trình.
            <br />
            <span>Hiểu chính mình.</span>
          </h1>
          <p>
            Lý thuyết dễ hiểu, thực hành có hướng dẫn và một lộ trình để bạn
            tiến bộ từng ngày.
          </p>
          <div className="row">
            <Link to="/courses" className="btn primary">
              Bắt đầu khám phá <ArrowRight size={18} />
            </Link>
            <Link to="/login" className="btn glass">
              Đã có tài khoản
            </Link>
          </div>
          <div className="hero-foot">
            <span>
              <CheckCircle2 size={15} /> Java · Python · JavaScript
            </span>
            <span>
              <CheckCircle2 size={15} /> Học theo nhịp của bạn
            </span>
          </div>
        </div>
        <div className="hero-visual">
          <div className="floating-note">
            <span className="mini-icon green">
              <Check size={18} />
            </span>
            <div>
              <b>Một bước nhỏ, mỗi ngày</b>
              <small>Đó là cách bạn trở nên giỏi hơn.</small>
            </div>
          </div>
          <div className="mock-editor">
            <div className="editor-dots">
              <i />
              <i />
              <i />
              <span>hello_smartcode.py</span>
            </div>
            <pre>
              <em># Mọi hành trình đều có điểm bắt đầu</em>
              {"\n\n"}
              <span>def</span> learn_something_new():{"\n"} curiosity ={" "}
              <b>True</b>
              {"\n"} practice = <b>"mỗi ngày"</b>
              {"\n"} <span>return</span> curiosity + practice{"\n\n"}
              <mark>print("Xin chào, SmartCode!")</mark>
            </pre>
            <div className="mock-terminal">
              <CheckCircle2 size={16} /> Xin chào, SmartCode! <span>→</span>
            </div>
          </div>
          <div className="hero-orb">{"</>"}</div>
        </div>
      </section>
      <section className="page-container">
        <PageTitle
          eyebrow="CHỌN ĐIỂM BẮT ĐẦU"
          title="Một lộ trình cho bạn"
          description="Xây chắc nền tảng trước khi chinh phục những bài toán lớn hơn."
        />
        <DataState resource={r}>
          {(data) => (
            <div className="grid three">
              {data.map((c) => (
                <CourseCard key={c.id} course={c} />
              ))}
            </div>
          )}
        </DataState>
        <div className="grid three value-grid">
          {[
            [
              Video,
              "Học để hiểu",
              "Đọc lý thuyết, xem ví dụ và ôn lại bằng câu hỏi ngắn.",
            ],
            [
              Code2,
              "Làm để nhớ",
              "Thực hành trong trình soạn thảo, nhận kết quả và gợi ý theo bài học.",
            ],
            [
              BarChart3,
              "Thấy mình tiến bộ",
              "Nhìn lại kỹ năng, thói quen và các lỗi cần cải thiện trong Insight.",
            ],
          ].map(([I, t, d]) => (
            <Card key={t}>
              <span className="mini-icon purple">
                <I />
              </span>
              <h3>{t}</h3>
              <p>{d}</p>
            </Card>
          ))}
        </div>
      </section>
    </>
  );
}
export function Auth({ register = false }) {
  const { setUser } = useSession();
  const [busy, run] = useAction();
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const submit = (e) => {
    e.preventDefault();
    run(async () => {
      const u = await post("/auth/" + (register ? "register" : "login"), form);
      setUser(u);
      go(
        u.role === "learner"
          ? "/dashboard"
          : u.role === "admin"
            ? "/admin"
            : "/manage",
      );
    });
  };
  return (
    <main className="auth-layout">
      <div className="auth-story">
        <Badge tone="white">SMARTCODE / HỌC KHÔNG NGỪNG</Badge>
        <h1>
          Hôm nay, bạn sẽ
          <br />
          viết điều gì mới?
        </h1>
        <p>
          Mỗi lỗi được sửa là một điều bạn vừa học được.
          <br />
          SmartCode ở đây để cùng bạn đi tiếp.
        </p>
        <div className="auth-art">
          <Code2 size={100} />
          <span>learn. code. grow.</span>
          <div className="orb-one" />
          <div className="orb-two" />
        </div>
        <small>Không cần giỏi để bắt đầu. Hãy bắt đầu để giỏi hơn.</small>
      </div>
      <div className="auth-form">
        <div className="auth-inner">
          <span className="eyebrow">CHÀO MỪNG ĐẾN SMARTCODE</span>
          <h1>{register ? "Bắt đầu hành trình" : "Rất vui gặp lại bạn"}</h1>
          <p>
            {register
              ? "Tạo tài khoản để lưu tiến độ và học theo lộ trình."
              : "Đăng nhập để tiếp tục từ nơi bạn dừng lại."}
          </p>
          <form onSubmit={submit}>
            {register && (
              <Field label="Họ và tên">
                <input
                  required
                  minLength={2}
                  maxLength={100}
                  autoComplete="name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </Field>
            )}
            <Field label="Email">
              <input
                type="email"
                required
                autoComplete="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="ban@example.com"
              />
            </Field>
            <Field
              label="Mật khẩu"
              hint={register ? "Tối thiểu 8 ký tự." : undefined}
            >
              <input
                type="password"
                required
                minLength={register ? 8 : 1}
                maxLength={128}
                autoComplete={register ? "new-password" : "current-password"}
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder="Nhập mật khẩu"
              />
            </Field>
            <Button type="submit" busy={busy} className="full">
              {register ? "Tạo tài khoản" : "Đăng nhập"}{" "}
              <ArrowRight size={18} />
            </Button>
          </form>
          <p className="center">
            {register ? "Bạn đã có tài khoản?" : "Bạn chưa có tài khoản?"}{" "}
            <Link to={register ? "/login" : "/register"}>
              {register ? "Đăng nhập" : "Đăng ký ngay"}
            </Link>
          </p>
          <div className="demo-account">
            <b>Tài khoản trải nghiệm</b>
            <p>
              learner@smartcode.local
              <br />
              Mật khẩu: <code>SmartCode@123</code>
            </p>
            <Button
              variant="secondary"
              onClick={() =>
                setForm({
                  ...form,
                  email: "learner@smartcode.local",
                  password: "SmartCode@123",
                })
              }
            >
              Điền tài khoản mẫu
            </Button>
          </div>
        </div>
      </div>
    </main>
  );
}
export function Dashboard() {
  const { user } = useSession();
  const a = useData("/analytics"),
    c = useData("/my/courses");
  return (
    <div className="page-container">
      <PageTitle
        eyebrow="GÓC HỌC TẬP CỦA BẠN"
        title={`Chào ${user.name.split(" ").slice(-2).join(" ")}, cùng học nhé!`}
        description="Không cần vội. Thêm một bài học hôm nay là thêm một bước tiến."
      />
      <div className="welcome-banner">
        <div>
          <Badge tone="white">HÀNH TRÌNH CỦA BẠN</Badge>
          <h2>Biến sự tò mò thành kỹ năng.</h2>
          <p>
            Chọn một khóa học và bắt đầu với lý thuyết, ví dụ, rồi thực hành.
          </p>
          <Link to="/courses" className="btn white">
            Tiếp tục học <ArrowRight size={17} />
          </Link>
        </div>
        <div className="banner-symbol">{"{ learn(); }"}</div>
      </div>
      <DataState resource={a}>
        {(d) => (
          <>
            <div className="grid four stats-grid">
              <Stat
                icon={Flame}
                tone="orange"
                label="Chuỗi học tập"
                value={`${d.streak} ngày`}
                sub="Dựa trên ngày có nộp bài"
              />
              <Stat
                icon={CheckCircle2}
                tone="green"
                label="Bài đã giải"
                value={d.solved}
                sub="Trong 90 ngày gần nhất"
              />
              <Stat
                icon={Trophy}
                tone="purple"
                label="XP tích lũy"
                value={number(d.xp)}
                sub="20 XP cho mỗi bài đạt lần đầu"
              />
              <Stat
                icon={Target}
                label="Lượt thực hành"
                value={d.submissions}
                sub="Mỗi lần thử đều có giá trị"
              />
            </div>
            <div className="section-heading">
              <h2>Khóa học của bạn</h2>
              <Link to="/courses">
                Xem tất cả <ArrowRight size={16} />
              </Link>
            </div>
            <DataState resource={c}>
              {(courses) =>
                courses.some((x) => x.enrolled) ? (
                  <div className="grid three">
                    {courses
                      .filter((x) => x.enrolled)
                      .map((x) => (
                        <CourseCard
                          key={x.id}
                          course={x}
                          action={
                            <Link
                              className="btn secondary full"
                              to={"/roadmap/" + x.id}
                            >
                              Vào lộ trình <ArrowRight size={16} />
                            </Link>
                          }
                        />
                      ))}
                  </div>
                ) : (
                  <Empty
                    title="Chọn khóa học đầu tiên"
                    action={
                      <Link to="/courses" className="btn primary">
                        Khám phá khóa học
                      </Link>
                    }
                  />
                )
              }
            </DataState>
            <div className="grid two mt24">
              <Card>
                <div className="section-heading">
                  <h3>Nhịp học trong 14 ngày</h3>
                  <Link to="/insight">
                    Insight <ArrowRight size={15} />
                  </Link>
                </div>
                <Bars data={d.days.slice(-14)} />
                {!d.submissions && (
                  <p className="chart-note">
                    Biểu đồ sẽ cập nhật sau lượt nộp bài đầu tiên.
                  </p>
                )}
              </Card>
              <Card className="next-step">
                <span className="mini-icon purple">
                  <Sparkles />
                </span>
                <h2>Hiểu cách mình học</h2>
                <p>
                  Từ lỗi thường gặp đến kỹ năng đã nắm vững, Insight giúp bạn
                  chọn việc cần làm tiếp theo.
                </p>
                <div className="row wrap">
                  <Link to="/skills" className="btn secondary">
                    Xem kỹ năng
                  </Link>
                  <Link to="/insight" className="btn primary">
                    Mở Insight <ArrowRight size={16} />
                  </Link>
                </div>
              </Card>
            </div>
          </>
        )}
      </DataState>
    </div>
  );
}
export function Catalog() {
  const { user } = useSession();
  const r = useData(user ? "/my/courses" : "/courses");
  const [search, setSearch] = useState(""),
    [language, setLanguage] = useState("all"),
    [level, setLevel] = useState("all");
  return (
    <div className="page-container">
      <PageTitle
        eyebrow="KHÁM PHÁ · THỰC HÀNH · TIẾN BỘ"
        title="Chọn hành trình tiếp theo"
        description="Từng bài học được nối với bài tập để bạn áp dụng ngay điều vừa biết."
      />
      <div className="filter-bar">
        <div className="search-input">
          <Search size={18} />
          <input
            aria-label="Tìm khóa học"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Bạn muốn học điều gì?"
          />
        </div>
        <select
          aria-label="Ngôn ngữ"
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
        >
          <option value="all">Tất cả ngôn ngữ</option>
          <option value="java">Java</option>
          <option value="python">Python</option>
          <option value="javascript">JavaScript</option>
        </select>
        <select aria-label="Trình độ khóa học" value={level} onChange={e => setLevel(e.target.value)}>
          <option value="all">Tất cả trình độ</option><option value="basic">Cơ bản · Miễn phí</option><option value="intermediate">Vận dụng · Trả phí</option><option value="advanced">Nâng cao · Trả phí</option>
        </select>
      </div>
      <DataState resource={r}>
        {(data) => {
          const items = data.filter(
            (c) =>
              c.title.toLowerCase().includes(search.toLowerCase()) &&
              (language === "all" || c.language === language) &&
              (level === "all" || (c.level || "basic") === level),
          );
          return items.length ? (
            <div className="grid three">
              {items.map((c) => (
                <CourseCard
                  key={c.id}
                  course={c}
                  action={
                    c.enrolled ? (
                      <Link to={"/roadmap/" + c.id} className="text-link">
                        Tiếp tục học <ArrowRight size={16} />
                      </Link>
                    ) : undefined
                  }
                />
              ))}
            </div>
          ) : (
            <Empty title="Không tìm thấy khóa học">
              Thử một từ khóa hoặc ngôn ngữ khác.
            </Empty>
          );
        }}
      </DataState>
    </div>
  );
}
export function CourseDetail({ id }) {
  const r = useData("/courses/" + id),
    { user } = useSession(),
    mine = useData(user ? "/my/courses" : null);
  const [busy, run] = useAction();
  return (
    <div className="page-container">
      <Breadcrumb
        items={[
          { to: "/courses", label: "Khóa học" },
          { label: "Chi tiết khóa học" },
        ]}
      />
      <DataState resource={r}>
        {(c) => {
          const enrolled =
            mine.data?.some((x) => x.id === c.id && x.enrolled) ||
            user?.role === "admin" ||
            user?.id === c.owner_id;
          const enroll = () => {
            if (!user) return go("/login");
            if (enrolled) return go("/roadmap/" + c.id);
            run(async () => {
              if ((c.level || "basic") === "basic") {
                await post(`/courses/${id}/enroll`);
                go("/roadmap/" + id);
              } else go("/checkout/" + c.id);
            });
          };
          return (
            <>
              <div className="course-detail-head">
                <div>
                  <Badge tone="purple">{LEVEL_NAMES[c.level || "basic"]}</Badge>
                  <h1>{c.title}</h1>
                  <p>{c.description}</p>
                  <div className="row wrap">
                    <span>
                      <BookOpen size={17} /> {c.lessons_count} bài lý thuyết
                    </span>
                    <span>
                      <Code2 size={17} /> {c.exercises_count} bài thực hành
                    </span>
                    <span>
                      <BarChart3 size={17} /> Theo dõi tiến độ
                    </span>
                  </div>
                </div>
                <Card className="enroll-card">
                  <span className="price">
                    {enrolled
                      ? "Đã tham gia"
                      : c.price
                        ? money(c.price)
                        : "Miễn phí"}
                  </span>
                  <Button busy={busy} className="full" onClick={enroll}>
                    {enrolled ? "Vào học ngay" : c.level && c.level !== "basic" ? "Mua khóa học" : "Học miễn phí"}{" "}
                    <ArrowRight size={17} />
                  </Button>
                  {c.price > 0 && !enrolled && (
                    <small>
                      Thanh toán qua QR VPBank, MoMo hoặc ZaloPay. Mở khóa học sau khi xác nhận thanh toán.
                    </small>
                  )}
                </Card>
              </div>
              <div className="grid course-detail-grid">
                <Card>
                  <h2>Nội dung khóa học</h2>
                  <div className="lesson-list">
                    {c.lessons.map((l, i) => (
                      <button
                        className="lesson-row"
                        key={l.id}
                        onClick={() =>
                          enrolled ? go("/lesson/" + l.id) : enroll()
                        }
                      >
                        <span className="lesson-number">
                          {String(i + 1).padStart(2, "0")}
                        </span>
                        <span>
                          <b>{l.title}</b>
                          <small>Lý thuyết · Ví dụ · Câu hỏi · Thực hành</small>
                        </span>
                        <ChevronRight size={18} />
                      </button>
                    ))}
                  </div>
                </Card>
                <div>
                  <Card className="pastel purple">
                    <Sparkles size={26} />
                    <h3>Bắt đầu đúng trình độ</h3>
                    <p>
                      Làm đánh giá đầu vào để biết phần kiến thức nên ưu tiên.
                    </p>
                    <Button
                      variant="secondary"
                      onClick={() =>
                        enrolled ? go("/survey/" + id) : enroll()
                      }
                    >
                      Đánh giá đầu vào
                    </Button>
                  </Card>
                  <Card className="mt24">
                    <h3>Bạn sẽ học như thế nào?</h3>
                    {[
                      "Đọc lý thuyết và xem video có sẵn trong bài.",
                      "Trả lời câu hỏi để kiểm tra mức hiểu.",
                      "Viết code và nhận kết quả từ bộ kiểm thử.",
                      "Xem lại lỗi và tiếp tục theo lộ trình.",
                    ].map((t, i) => (
                      <p className="row start" key={t}>
                        <span className="step-dot">{i + 1}</span>
                        {t}
                      </p>
                    ))}
                  </Card>
                </div>
              </div>

            </>
          );
        }}
      </DataState>
    </div>
  );
}
export function Roadmap({ id }) {
  const r = useData("/courses/" + id + "/roadmap"),
    c = useData("/courses/" + id);
  return (
    <div className="page-container">
      <PageTitle
        eyebrow={c.data?.title || "LỘ TRÌNH"}
        title="Từng bước, vững vàng hơn"
        description="Đọc bài, đạt ít nhất 80% câu hỏi và hoàn thành bài tập để đánh dấu một chặng."
      >
        <Link to={"/placement/" + id} className="btn secondary">
          <ListChecks size={17} /> Đánh giá đầu vào
        </Link>
      </PageTitle>
      <DataState resource={r}>
        {(data) => {
          const done = data.filter((x) => x.completed).length;
          return (
            <div className="roadmap-layout">
              <Card>
                <div className="row between">
                  <h3>Hành trình của bạn</h3>
                  <Badge tone="purple">
                    {done}/{data.length} chặng
                  </Badge>
                </div>
                <ProgressBar
                  value={data.length ? (done / data.length) * 100 : 0}
                />
                <div className="roadmap-list">
                  {data.map((l, i) => (
                    <div
                      key={l.id}
                      className={
                        "roadmap-item " +
                        (l.completed ? "done" : l.recommended ? "current" : "")
                      }
                    >
                      <span className="roadmap-node">
                        {l.completed ? <Check size={20} /> : i + 1}
                      </span>
                      <div className="roadmap-content">
                        <div className="row between wrap">
                          <div>
                            <h3>{l.title}</h3>
                            <p>
                              {l.read ? "Đã đọc" : "Chưa đọc"} · Quiz{" "}
                              {l.quiz_score}% · {l.solved}/{l.exercises} bài đạt
                            </p>
                          </div>
                          <Link
                            className={
                              "btn " + (l.recommended ? "primary" : "secondary")
                            }
                            to={"/lesson/" + l.id}
                          >
                            {l.completed ? "Ôn lại" : "Vào học"}{" "}
                            <ArrowRight size={16} />
                          </Link>
                        </div>
                        {l.recommended && (
                          <small className="blue-text">
                            Đề xuất tiếp theo dựa trên phần bạn chưa hoàn thành.
                          </small>
                        )}
                        <ProgressBar value={l.mastery} />
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
              <div>
                <Card className="pastel purple">
                  <Target size={30} />
                  <h2>Một mục tiêu nhỏ hôm nay</h2>
                  <p>
                    Hoàn thành một bài lý thuyết và thử tự giải một bài tập
                    trước khi mở gợi ý.
                  </p>
                  <Badge tone="purple">
                    Bạn có thể mở mọi chặng đã đăng ký
                  </Badge>
                </Card>
                <Card className="mt24">
                  <h3>Kết quả không chỉ là điểm số</h3>
                  <p>
                    Nhìn lại quá trình thử, sửa lỗi và tìm cách giải qua trang
                    Insight.
                  </p>
                  <Link to="/insight" className="text-link">
                    Xem sự tiến bộ <ArrowRight size={16} />
                  </Link>
                </Card>
              </div>
            </div>
          );
        }}
      </DataState>
    </div>
  );
}
export function LessonPage({ id }) {
  const r = useData("/lessons/" + id), extras = useData(`/lessons/${id}/extras`);
  const [tab, setTab] = useState("theory"),
    [answers, setAnswers] = useState({}),
    [result, setResult] = useState(null),
    [note, setNote] = useState("");
  const [busy, run] = useAction(),
    { notify } = useSession();
  const video = useRef(null),
    lastSave = useRef(0);
  const c = useData(r.data ? "/courses/" + r.data.course_id : null);
  useEffect(() => {
    setTab("theory");
    setAnswers({});
    setResult(null);
    lastSave.current = 0;
  }, [id]);
  const saveProgress = async (read = false) => {
    const position =
      video.current?.currentTime || r.data?.progress?.position || 0;
    await api(`/lessons/${id}/progress`, {
      method: "PUT",
      body: { read, position },
    });
    if (read) {
      notify(
        "Đã ghi nhận phần lý thuyết. Tiếp tục với câu hỏi và bài tập nhé!",
      );
      r.reload();
    }
  };
  return (
    <div className="page-container">
      <Breadcrumb
        items={[
          { to: "/courses", label: "Khóa học" },
          {
            to: r.data ? "/roadmap/" + r.data.course_id : "/courses",
            label: c.data?.title || "Lộ trình",
          },
          { label: "Bài học" },
        ]}
      />
      <DataState resource={r}>
        {(l) => (
          <>
            <PageTitle
              eyebrow={`BÀI ${String(l.position).padStart(2, "0")} · ${c.data?.title || ""}`}
              title={l.title}
              description="Xem, hiểu và thực hành. Tiến độ của bạn được lưu trong tài khoản."
            />
            <div className="lesson-switch"><Link className="active" to={'/lesson/'+id}><BookOpen size={16}/> Lý thuyết</Link><Link to={'/lesson/'+id+'/exercises'}><Code2 size={16}/> Bài tập {l.exercises.length}</Link></div>
            <div className="lesson-layout">
              <div>
                <Card className="video-card">
                  {l.video_url ? (
                    <video
                      ref={video}
                      controls
                      playsInline
                      preload="metadata"
                      src={l.video_url}
                      poster={extras.data?.thumbnail_url || undefined}
                      onLoadedMetadata={() => {
                        if (video.current && l.progress?.position)
                          video.current.currentTime = l.progress.position;
                      }}
                      onPause={() => saveProgress().catch(() => {})}
                      onTimeUpdate={() => {
                        const t = video.current?.currentTime || 0;
                        if (Math.abs(t - lastSave.current) >= 15) {
                          lastSave.current = t;
                          saveProgress().catch(() => {});
                        }
                      }}
                      onEnded={() =>
                        saveProgress(true).catch((e) =>
                          notify(e.message, "error"),
                        )
                      }
                    >
                      {l.captions_url && (
                        <track
                          default
                          kind="subtitles"
                          label="Tiếng Việt"
                          srcLang="vi"
                          src={l.captions_url}
                        />
                      )}
                      Trình duyệt không hỗ trợ phát video.
                    </video>
                  ) : (
                    <div className="video-empty">
                      <span className="play-circle">
                        <Video size={30} />
                      </span>
                      <h2>Bài này đang có học liệu văn bản</h2>
                      <p>
                        Giảng viên chưa thêm video. Bạn có thể học phần lý
                        thuyết và ví dụ ngay bên dưới.
                      </p>
                    </div>
                  )}
                  <div className="video-caption">
                    <span>
                      <Video size={17} />{" "}
                      {l.video_url
                        ? "Video bài giảng · dùng nút CC để bật phụ đề"
                        : "Nội dung video do giảng viên cập nhật"}
                    </span>
                    <Badge tone={l.progress?.read ? "green" : "blue"}>
                      {l.progress?.read ? "Đã học lý thuyết" : "Đang học"}
                    </Badge>
                  </div>
                </Card>
                <Card className="lesson-content mt24">
                  <Tabs
                    active={tab}
                    onChange={setTab}
                    items={[
                      { id: "theory", label: "Lý thuyết", icon: BookOpen },
                      { id: "example", label: "Code mẫu", icon: Code2 },
                      { id: "quiz", label: "Kiểm tra nhanh", icon: ListChecks },
                      { id: "notes", label: "Ghi chú", icon: Bookmark },
                    ]}
                  />
                  {tab === "theory" && (
                    <>
                      <div className="prose">
                        {l.content.split("\n\n").map((p, i) => (
                          <p key={i}>{p}</p>
                        ))}
                      </div>
                      <Button
                        variant="secondary"
                        busy={busy}
                        onClick={() => run(() => saveProgress(true))}
                      >
                        <CheckCircle2 size={17} />{" "}
                        {l.progress?.read
                          ? "Đã đọc lý thuyết"
                          : "Đánh dấu đã đọc"}
                      </Button>
                    </>
                  )}
                  {tab === "example" && (
                    <>
                      <h3>Quan sát ví dụ</h3>
                      <p>
                        Đọc từng dòng, dự đoán kết quả rồi chuyển sang bài tập
                        để tự viết chương trình.
                      </p>
                      <CodeBlock>
                        {l.code || "Giảng viên chưa thêm ví dụ."}
                      </CodeBlock>
                      <a className="btn secondary" href={'data:text/plain;charset=utf-8,'+encodeURIComponent(l.code || '')} download={'bai-'+l.id+({java:'.java',python:'.py',javascript:'.js'}[c.data?.language]||'.txt')}>Tải code mẫu</a>{' '}
                      <Button
                        variant="secondary"
                        onClick={() =>
                          run(async () => {
                            await navigator.clipboard.writeText(l.code || "");
                          }, "Đã sao chép ví dụ.")
                        }
                      >
                        <Code2 size={16} /> Sao chép code
                      </Button>
                    </>
                  )}
                  {tab === "quiz" &&
                    (l.quiz.length ? (
                      <>
                        <div className="quiz-list">
                          {l.quiz.map((q, i) => (
                            <fieldset key={i}>
                              <legend>
                                {i + 1}. {q.question}
                              </legend>
                              {q.options.map((o, j) => (
                                <label
                                  key={j}
                                  className={
                                    "quiz-option " +
                                    (answers[i] === j ? "selected" : "")
                                  }
                                >
                                  <input
                                    type="radio"
                                    name={"quiz" + i}
                                    checked={answers[i] === j}
                                    onChange={() =>
                                      setAnswers({ ...answers, [i]: j })
                                    }
                                  />
                                  {o}
                                </label>
                              ))}
                              {result && (
                                <div
                                  className={
                                    "notice " +
                                    (answers[i] === result.feedback[i].answer
                                      ? "green"
                                      : "orange")
                                  }
                                >
                                  {result.feedback[i].explanation} Đáp án:{" "}
                                  {q.options[result.feedback[i].answer]}
                                </div>
                              )}
                            </fieldset>
                          ))}
                        </div>
                        {result && (
                          <div className="notice purple">
                            Kết quả lượt này: <b>{result.score}%</b>. Hệ thống
                            lưu điểm cao nhất.
                          </div>
                        )}
                        <Button
                          busy={busy}
                          disabled={
                            Object.keys(answers).length !== l.quiz.length
                          }
                          onClick={() =>
                            run(async () =>
                              setResult(
                                await post(`/lessons/${id}/quiz`, {
                                  answers: l.quiz.map((_, i) => answers[i]),
                                }),
                              ),
                            )
                          }
                        >
                          Kiểm tra câu trả lời <Check size={17} />
                        </Button>
                      </>
                    ) : (
                      <Empty title="Chưa có câu hỏi">
                        Bạn có thể chuyển sang phần thực hành.
                      </Empty>
                    ))}
                  {tab === "notes" && (
                    <>
                      <h3>Ghi lại điều vừa hiểu</h3>
                      <form
                        onSubmit={(e) => {
                          e.preventDefault();
                          run(async () => {
                            await post(`/lessons/${id}/notes`, {
                              body: note,
                              position: video.current?.currentTime || 0,
                            });
                            setNote("");
                            r.reload();
                          }, "Đã lưu ghi chú.");
                        }}
                      >
                        <Field label="Ghi chú của bạn">
                          <textarea
                            required
                            maxLength={5000}
                            rows={3}
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                            placeholder="Điểm quan trọng, thắc mắc hoặc cách nhớ của bạn…"
                          />
                        </Field>
                        <Button busy={busy}>
                          <Bookmark size={16} /> Lưu tại{" "}
                          {timeCode(video.current?.currentTime || 0)}
                        </Button>
                      </form>
                      <div className="note-list">
                        {l.notes.map((n) => (
                          <div className="note" key={n.id}>
                            <button
                              className="timestamp"
                              onClick={() => {
                                if (video.current)
                                  video.current.currentTime = n.position;
                              }}
                            >
                              {timeCode(n.position)}
                            </button>
                            <p>{n.body}</p>
                            <button
                              aria-label="Xóa ghi chú"
                              className="icon-btn"
                              onClick={() =>
                                run(async () => {
                                  await api("/notes/" + n.id, {
                                    method: "DELETE",
                                  });
                                  r.reload();
                                })
                              }
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </Card>
                <div className="row between wrap mt24">{c.data?.lessons?.filter(x=>x.position<l.position).slice(-1).map(x=><Link key={x.id} className="btn secondary" to={'/lesson/'+x.id}>← Bài trước</Link>)}{c.data?.lessons?.filter(x=>x.position>l.position).slice(0,1).map(x=><Link key={x.id} className="btn primary" to={'/lesson/'+x.id}>Bài tiếp theo →</Link>)}</div>
                {!!extras.data?.resources?.length && <Card className="mt24"><h3>Tài liệu bài học</h3>{extras.data.resources.map((x,i)=><a key={i} className="resource-link" href={x.url} target="_blank" rel="noreferrer">{x.title || 'Tài liệu '+(i+1)} ↗</a>)}</Card>}
                <Card className="mt24">
                  <div className="section-heading">
                    <h2>Đến lượt bạn thực hành</h2>
                    <Badge tone="purple">{l.exercises.length} bài tập</Badge>
                  </div>
                  {l.exercises.map((e) => (
                    <Link
                      className="exercise-row"
                      key={e.id}
                      to={"/code/" + e.id}
                    >
                      <span className="mini-icon blue">
                        <Code2 size={20} />
                      </span>
                      <div>
                        <b>{e.title}</b>
                        <small>
                          {e.difficulty === "easy" ? "Cơ bản" : "Vận dụng"} ·{" "}
                          {e.skill}
                        </small>
                      </div>
                      <ArrowRight size={18} />
                    </Link>
                  ))}
                </Card>
              </div>
              <aside>
                <Card className="sticky">
                  <h3>Nội dung khóa học</h3>
                  <div className="compact-lessons">
                    {c.data?.lessons.map((x) => (
                      <Link
                        key={x.id}
                        className={x.id === l.id ? "active" : ""}
                        to={"/lesson/" + x.id}
                      >
                        <span>{String(x.position).padStart(2, "0")}</span>
                        {x.title}
                        {x.id === l.id && <Play size={13} />}
                      </Link>
                    ))}
                  </div>
                  <Link
                    to={"/roadmap/" + l.course_id}
                    className="btn secondary full mt16"
                  >
                    Xem toàn bộ lộ trình
                  </Link>
                </Card>
              </aside>
            </div>
          </>
        )}
      </DataState>
    </div>
  );
}
export function CodePage(props) { return <PracticePage {...props}/>; }
export function ReportModal({ exerciseId = null, onClose }) {
  const [body, setBody] = useState(""),
    [busy, run] = useAction();
  return (
    <Modal title="Gửi phản ánh" onClose={onClose}>
      <p>Mô tả lỗi hoặc nội dung cần điều chỉnh để quản trị viên kiểm tra.</p>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          run(async () => {
            await post("/reports", { body, exercise_id: exerciseId });
            onClose();
          }, "Đã gửi phản ánh. Cảm ơn bạn!");
        }}
      >
        <Field label="Nội dung">
          <textarea
            required
            minLength={5}
            maxLength={3000}
            rows={5}
            value={body}
            onChange={(e) => setBody(e.target.value)}
          />
        </Field>
        <Button busy={busy}>
          <Send size={16} /> Gửi phản ánh
        </Button>
      </form>
    </Modal>
  );
}
export function Placement({ id }) {
  const r = useData("/courses/" + id + "/placement"),
    [answers, setAnswers] = useState({}),
    [result, setResult] = useState(null),
    [busy, run] = useAction();
  return (
    <div className="page-container narrow">
      <PageTitle
        eyebrow="ĐÁNH GIÁ ĐẦU VÀO"
        title={result ? "Điểm bắt đầu của bạn" : "Bạn đã biết những gì?"}
        description="Không áp lực điểm số. Kết quả giúp đề xuất bài nên ôn trước."
      />
      <DataState resource={r}>
        {(qs) =>
          result ? (
            <Card>
              <div className="result-icon">
                <Target size={36} />
              </div>
              <h2 className="center">Hãy bắt đầu từ phần cần củng cố</h2>
              <p className="center">{result.notice}</p>
              <div className="skills-list">
                {Object.entries(result.scores).map(([s, v]) => (
                  <div key={s}>
                    <div className="row between">
                      <span>{qs.find((q) => q.skill === s)?.skill}</span>
                      <Badge tone={v ? "green" : "orange"}>
                        {v ? "Trả lời đúng" : "Nên ôn lại"}
                      </Badge>
                    </div>
                    <ProgressBar value={v} />
                  </div>
                ))}
              </div>
              <Link
                to={"/lesson/" + result.recommended_lesson}
                className="btn primary full"
              >
                Vào bài được đề xuất <ArrowRight size={17} />
              </Link>
              <Link to={"/roadmap/" + id} className="btn secondary full mt16">
                Xem toàn bộ lộ trình
              </Link>
            </Card>
          ) : qs.length ? (
            <Card>
              <div className="row between">
                <h3>Kiến thức nền tảng</h3>
                <Badge tone="purple">
                  {Object.keys(answers).length}/{qs.length} câu
                </Badge>
              </div>
              <ProgressBar
                value={(Object.keys(answers).length / qs.length) * 100}
              />
              <div className="quiz-list">
                {qs.map((q, i) => (
                  <fieldset key={i}>
                    <legend>
                      {i + 1}. {q.question}
                    </legend>
                    {q.options.map((o, j) => (
                      <label
                        key={j}
                        className={
                          "quiz-option " + (answers[i] === j ? "selected" : "")
                        }
                      >
                        <input
                          type="radio"
                          name={"placement" + i}
                          checked={answers[i] === j}
                          onChange={() => setAnswers({ ...answers, [i]: j })}
                        />
                        {o}
                      </label>
                    ))}
                  </fieldset>
                ))}
              </div>
              <Button
                className="full"
                busy={busy}
                disabled={Object.keys(answers).length !== qs.length}
                onClick={() =>
                  run(async () =>
                    setResult(
                      await post(`/courses/${id}/placement`, {
                        answers: qs.map((_, i) => answers[i]),
                      }),
                    ),
                  )
                }
              >
                Xem đề xuất học tập <ArrowRight size={16} />
              </Button>
            </Card>
          ) : (
            <Empty title="Chưa có bộ câu hỏi" />
          )
        }
      </DataState>
    </div>
  );
}
export function Insight({ skillsOnly = false }) {
  const [cid, setCid] = useState(""),
    [period, setPeriod] = useState(90),
    [view, setView] = useState("chart");
  const c = useData("/my/courses"),
    q = `?period=${period}${cid ? "&course_id=" + cid : ""}`,
    r = useData("/analytics" + q),
    benchmark = useData("/analytics/benchmark" + q);
  return (
    <div className="page-container">
      <PageTitle
        title={skillsOnly ? "Bản đồ kỹ năng" : "Insight học tập"}
        description={
          skillsOnly
            ? "Mức hoàn thành bài tập theo từng chủ đề."
            : "Hiểu thói quen, kết quả và sự tiến bộ của bạn."
        }
      >
        <select
          value={cid}
          onChange={(e) => setCid(e.target.value)}
          aria-label="Khóa học"
        >
          <option value="">Tất cả khóa đã tham gia</option>
          {c.data
            ?.filter((x) => x.enrolled)
            .map((x) => (
              <option key={x.id} value={x.id}>
                {x.title}
              </option>
            ))}
        </select>
        {!skillsOnly && (
          <select
            value={period}
            onChange={(e) => setPeriod(Number(e.target.value))}
            aria-label="Khoảng thời gian"
          >
            <option value={90}>90 ngày</option>
            <option value={30}>30 ngày</option>
            <option value={7}>7 ngày</option>
          </select>
        )}
      </PageTitle>
      <DataState resource={r}>
        {(d) => {
          const errors = [
              {
                name: "Biên dịch · CE",
                value: d.statuses.CE || 0,
                color: "#f34c63",
              },
              {
                name: "Sai kết quả · WA",
                value: d.statuses.WA || 0,
                color: "#f2a000",
              },
              {
                name: "Thực thi · RE",
                value: d.statuses.RE || 0,
                color: "#9865f4",
              },
              {
                name: "Quá thời gian · TLE",
                value: d.statuses.TLE || 0,
                color: "#ed55aa",
              },
            ],
            attempted = d.style.attempted,
            theory = attempted
              ? Math.round((d.style.theory_first / attempted) * 100)
              : 0,
            hinted = attempted
              ? Math.round((d.style.hinted / attempted) * 100)
              : 0;
          return (
            <>
              {skillsOnly ? (
                <div className="grid two">
                  <Card>
                    <h3>Nền tảng của bạn</h3>
                    <Radar data={d.skills} />
                    <p className="chart-note">
                      Phần trăm bài tập đã đạt trên tổng bài trong mỗi chủ đề,
                      tính toàn bộ lịch sử.
                    </p>
                  </Card>
                  <Card>
                    <h3>Từng bước lấp đầy kiến thức</h3>
                    <div className="skills-list">
                      {d.skills.map((s) => (
                        <div key={s.name}>
                          <div className="row between">
                            <span>{s.title}</span>
                            <b>{s.value}%</b>
                          </div>
                          <ProgressBar value={s.value} color="purple" />
                        </div>
                      ))}
                    </div>
                  </Card>
                </div>
              ) : (
                <>
                  <div className="grid five stats-grid">
                    <Stat
                      tone="orange"
                      label="Ngày hoạt động"
                      value={`${d.active_days} / ${period}`}
                    />
                    <Stat
                      tone="purple"
                      label="XP đạt mới"
                      value={number(d.xp)}
                    />
                    <Stat label="Tổng lượt nộp" value={number(d.submissions)} />
                    <Stat
                      tone="green"
                      label="Lượt nộp đạt"
                      value={number(d.accepted)}
                    />
                    <Stat
                      tone="green"
                      label="Bài đã giải"
                      value={number(d.solved)}
                    />
                  </div>
                  {!d.submissions && (
                    <div className="notice blue">
                      <BarChart3 size={20} />
                      <span>
                        Chưa có lượt nộp trong khoảng này. Các biểu đồ đã sẵn
                        sàng và sẽ cập nhật từ bài làm của bạn.
                      </span>
                    </div>
                  )}
                  <Card className="mt24">
                    <div className="section-heading">
                      <div>
                        <h3>Hoạt động {period} ngày</h3>
                        <p>
                          {d.active_days} ngày hoạt động · {d.submissions} lượt
                          nộp · {d.accepted} lượt đạt
                        </p>
                      </div>
                      <Button
                        variant="secondary"
                        onClick={() =>
                          setView(view === "chart" ? "table" : "chart")
                        }
                      >
                        {view === "chart" ? "Xem bảng số liệu" : "Xem biểu đồ"}
                      </Button>
                    </div>
                    {view === "chart" ? (
                      <Bars data={d.days} height={210} />
                    ) : (
                      <div className="table-wrap limited">
                        <table>
                          <thead>
                            <tr>
                              <th>Ngày UTC</th>
                              <th>Lượt nộp</th>
                              <th>Lượt đạt</th>
                            </tr>
                          </thead>
                          <tbody>
                            {d.days.map((x) => (
                              <tr key={x.date}>
                                <td>{x.date}</td>
                                <td>{x.count}</td>
                                <td>{x.accepted}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                    <p className="chart-note">
                      Mỗi cột là một ngày UTC. Di chuột vào cột để xem giá trị.
                    </p>
                  </Card>
                  <div className="grid two mt24">
                    <Card>
                      <h3>Hoạt động theo tuần</h3>
                      <p>8 khoảng 7 ngày · áp dụng bộ lọc hiện tại</p>
                      <Weekly data={d.weekly} />
                      <small>
                        XP chỉ ghi nhận lần đầu đạt một bài, kể cả khi nộp lại.
                      </small>
                    </Card>
                    <Card>
                      <h3>Phân bố lỗi</h3>
                      <p>
                        {d.submissions - d.accepted} lượt chưa đạt /{" "}
                        {d.submissions} lượt nộp
                      </p>
                      <Donut data={errors} />
                      <p className="chart-note green-text">
                        Các lượt AC được loại khỏi biểu đồ lỗi.
                      </p>
                    </Card>
                  </div>
                  <Card className="mt24">
                    <h3>Xu hướng kết quả theo ngày</h3>
                    <p>Lượt nộp · tối đa 14 ngày gần nhất</p>
                    <Lines
                      data={d.days.slice(-14)}
                      series={[
                        { key: "accepted", name: "AC · Đạt", color: "#0ebc8f" },
                        {
                          key: "compile",
                          name: "CE · Biên dịch",
                          color: "#f34c63",
                        },
                        {
                          key: "wrong",
                          name: "WA · Sai kết quả",
                          color: "#f2a000",
                        },
                      ]}
                    />
                  </Card>
                  <div className="grid two mt24">
                    <Card>
                      <h3>Thời gian thực hành</h3>
                      <div className="pace-number">
                        {d.pace.minutes === null ? "—" : d.pace.minutes}
                        <span>phút / bài đạt</span>
                      </div>
                      <div className="grid two center">
                        <div>
                          <b>{d.pace.sample}</b>
                          <small>Bài có thời gian ghi nhận</small>
                        </div>
                        <div>
                          <b>{benchmark.data?.reference_minutes ?? "—"} phút</b>
                          <small>Trung bình các bài tương ứng</small>
                        </div>
                      </div>
                      <div className="notice blue mt16">{benchmark.data?.percent != null ? `Thời gian của bạn ${Math.abs(benchmark.data.percent)}% ${benchmark.data.percent >= 0 ? "ít hơn" : "nhiều hơn"} mức tham khảo từ ${benchmark.data.sample_count} mẫu ẩn danh.` : "Cần ít nhất 3 mẫu từ người học khác ở các bài tương ứng để so sánh."}</div>
                      <p className="chart-note">
                        Ước lượng từ thời gian tương tác trên trình soạn thảo
                        đến lần đạt đầu tiên; ngừng đếm khi rời tab hoặc không
                        thao tác 60 giây. Không phải xếp hạng tốc độ.
                      </p>
                    </Card>
                    <Card>
                      <h3>Phong cách học</h3>
                      <p>{attempted} bài đã thử trong khoảng được chọn</p>
                      <div className="skills-list">
                        {[
                          ["Đã đọc lý thuyết trước khi nộp", theory, "blue"],
                          [
                            "Thực hành trước / chưa đánh dấu đã đọc",
                            attempted ? 100 - theory : 0,
                            "purple",
                          ],
                          ["Có dùng gợi ý trong kỳ", hinted, "orange"],
                          [
                            "Không dùng gợi ý trong kỳ",
                            attempted ? 100 - hinted : 0,
                            "green",
                          ],
                        ].map(([label, value, color]) => (
                          <div key={label}>
                            <div className="row between">
                              <span>{label}</span>
                              <b>{value}%</b>
                            </div>
                            <ProgressBar value={value} color={color} />
                          </div>
                        ))}
                      </div>
                    </Card>
                  </div>
                  <Card className="mt24">
                    <h3>Gợi ý từ dữ liệu của bạn</h3>
                    <div className="grid three">
                      <div className="notice red">
                        <b>Ôn cách kiểm tra lỗi</b>
                        <p>
                          {errors[0].value} lượt lỗi biên dịch. Đọc dòng báo lỗi
                          và kiểm tra cú pháp trước khi nộp lại.
                        </p>
                      </div>
                      <div className="notice blue">
                        <b>Duy trì nhịp học</b>
                        <p>
                          Bạn có {d.active_days} ngày nộp bài trong {period}{" "}
                          ngày. Đặt một mục tiêu nhỏ phù hợp thời gian của mình.
                        </p>
                      </div>
                      <div className="notice green">
                        <b>Thử giải độc lập</b>
                        <p>
                          Đã dùng gợi ý ở {d.style.hinted}/{attempted} bài. Thử
                          tự mô tả cách giải trước khi hỏi trợ giảng.
                        </p>
                      </div>
                    </div>
                  </Card>
                  <div className="row between mt24 wrap">
                    <small>
                      Thống kê từ dữ liệu tài khoản; không dùng số liệu minh
                      họa.
                    </small>
                    <a
                      className="btn secondary"
                      href={"/api/analytics/export" + q}
                    >
                      <Download size={16} /> Xuất thống kê CSV
                    </a>
                  </div>
                </>
              )}
            </>
          );
        }}
      </DataState>
    </div>
  );
}
export function History() {
  const r = useData("/submissions"),
    [filter, setFilter] = useState("all"),
    [detail, setDetail] = useState(null),
    [busy, run] = useAction();
  return (
    <div className="page-container">
      <PageTitle
        title="Lịch sử nộp bài"
        description="Xem lại cách bạn đã thử, sửa và tiến bộ."
      >
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          aria-label="Lọc kết quả"
        >
          <option value="all">Tất cả kết quả</option>
          {["AC", "WA", "CE", "RE", "TLE"].map((x) => (
            <option key={x}>{x}</option>
          ))}
        </select>
      </PageTitle>
      <DataState resource={r}>
        {(data) =>
          data.filter((x) => filter === "all" || x.status === filter).length ? (
            <Card className="table-card">
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Bài tập</th>
                      <th>Kết quả</th>
                      <th>Test đạt</th>
                      <th>Thời điểm</th>
                      <th />
                    </tr>
                  </thead>
                  <tbody>
                    {data
                      .filter((x) => filter === "all" || x.status === filter)
                      .map((s) => (
                        <tr key={s.id}>
                          <td>
                            <b>{s.exercise_title}</b>
                            <small>#{s.id}</small>
                          </td>
                          <td>
                            <Status value={s.status} />
                          </td>
                          <td>
                            {s.passed}/{s.total}
                          </td>
                          <td>{dateTime(s.created_at)}</td>
                          <td>
                            <Button
                              variant="secondary"
                              busy={busy}
                              onClick={() =>
                                run(async () =>
                                  setDetail(await api("/submissions/" + s.id)),
                                )
                              }
                            >
                              Chi tiết
                            </Button>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </Card>
          ) : (
            <Empty
              title="Chưa có lượt nộp phù hợp"
              action={
                <Link to="/courses" className="btn primary">
                  Vào học
                </Link>
              }
            />
          )
        }
      </DataState>
      {detail && (
        <Modal
          wide
          title={"Bài nộp #" + detail.id}
          onClose={() => setDetail(null)}
        >
          <div className="row between">
            <Status value={detail.status} />
            <span>
              {detail.passed}/{detail.total} test đạt
            </span>
          </div>
          <CodeBlock>{detail.code}</CodeBlock>
          {detail.results.map((t, i) => (
            <div className="notice row between" key={i}>
              <span>
                Test {i + 1} {t.hidden ? "· Ẩn" : ""}
              </span>
              <Status value={t.status} />
            </div>
          ))}
          <Link
            to={"/code/" + detail.exercise_id}
            className="btn primary"
            onClick={() => setDetail(null)}
          >
            Làm lại bài này <ArrowRight size={16} />
          </Link>
        </Modal>
      )}
    </div>
  );
}
export function Emotions() {
  const r = useData("/emotions");
  return (
    <div className="page-container">
      <PageTitle
        title="Nhật ký cảm nhận"
        description="Nhận ra khi nào mình cần chậm lại và khi nào sẵn sàng đi tiếp."
      />
      <DataState resource={r}>
        {(data) => {
          const states = {
            positive: { name: "Tích cực", icon: Smile, color: "#0ebc8f" },
            neutral: { name: "Bình thường", icon: Meh, color: "#4387f4" },
            negative: { name: "Đang gặp khó", icon: Frown, color: "#f2a000" },
          };
          const rows = data
            .slice()
            .reverse()
            .map((e, i) => ({
              date: String(i + 1),
              value: e.state === "positive" ? 3 : e.state === "neutral" ? 2 : 1,
            }));
          return (
            <>
              <div className="grid three">
                {Object.entries(states).map(([s, v]) => (
                  <Stat
                    key={s}
                    label={v.name}
                    value={data.filter((e) => e.state === s).length}
                    icon={v.icon}
                    sub="Trong tối đa 100 lần ghi nhận gần nhất"
                  />
                ))}
              </div>
              <Card className="mt24">
                <h3>Diễn biến cảm nhận</h3>
                {data.length ? (
                  <>
                    <Lines
                      data={rows}
                      series={[
                        {
                          key: "value",
                          name: "1: gặp khó · 2: bình thường · 3: tích cực",
                          color: "#9865f4",
                        },
                      ]}
                    />
                    <p className="chart-note">
                      Mỗi điểm là một lần ghi nhận, từ cũ đến mới. Thang mô tả
                      trạng thái, không phải mức độ chẩn đoán.
                    </p>
                  </>
                ) : (
                  <Empty title="Chưa có cảm nhận nào">
                    Chọn cảm nhận của bạn trong trang thực hành code.
                  </Empty>
                )}
              </Card>
              <Card className="mt24">
                <h3>Lịch sử</h3>
                {data.map((e) => {
                  const s = states[e.state],
                    I = s.icon;
                  return (
                    <div className="emotion-history" key={e.id}>
                      <I style={{ color: s.color }} />
                      <div>
                        <b>{s.name}</b>
                        <small>
                          {e.source === "self-report"
                            ? "Do bạn tự chọn"
                            : "Ước lượng bằng quy tắc từ hành vi nộp bài"}
                        </small>
                      </div>
                      <time>{dateTime(e.created_at)}</time>
                    </div>
                  );
                })}
              </Card>
              <div className="notice blue mt24">
                Tính năng này chưa sử dụng mô hình nhận diện cảm xúc. Bạn luôn
                có thể tự chọn cảm nhận; hệ thống không sử dụng webcam.
              </div>
            </>
          );
        }}
      </DataState>
    </div>
  );
}
export function Leaderboard() {
  const r = useData("/leaderboard");
  return (
    <div className="page-container narrow">
      <PageTitle
        title="Cùng nhau tiến bộ"
        description="Bảng thành tích trong các lớp bạn tham gia. 20 XP cho mỗi bài đạt lần đầu."
      />
      <DataState resource={r}>
        {(data) => (
          <Card>
            {data.map((x, i) => (
              <div className={"leader-row " + (x.me ? "me" : "")} key={i}>
                <span className="rank">
                  {i < 3 ? (
                    <Trophy color={["#e4a624", "#8595ad", "#bf8759"][i]} />
                  ) : (
                    i + 1
                  )}
                </span>
                <span className="avatar">{x.name.slice(-1)}</span>
                <div>
                  <b>
                    {x.name} {x.me && <Badge tone="purple">Bạn</Badge>}
                  </b>
                  <small>{x.solved} bài đã giải</small>
                </div>
                <strong>{number(x.xp)} XP</strong>
              </div>
            ))}
            <p className="chart-note">
              Thứ hạng dựa trên số bài đạt, không phải đánh giá toàn diện năng
              lực.
            </p>
          </Card>
        )}
      </DataState>
    </div>
  );
}
export function Account() {
  const { user, setUser } = useSession(),
    [name, setName] = useState(user.name),
    [password, setPassword] = useState({ old_password: "", new_password: "" }),
    [busy, run] = useAction(),
    [report, setReport] = useState(false);
  return (
    <div className="page-container narrow">
      <PageTitle
        title="Tài khoản của bạn"
        description="Cập nhật thông tin để SmartCode đồng hành cùng bạn."
      />
      <Card>
        <div className="profile-intro">
          <span className="avatar large">{user.name.slice(0, 1)}</span>
          <div>
            <h2>{user.name}</h2>
            <p>{user.email}</p>
            <Badge tone="purple">
              {user.role === "learner"
                ? "Người học"
                : user.role === "teacher"
                  ? "Giảng viên"
                  : "Quản trị viên"}
            </Badge>
            <Link to="/payments" className="payment-history-link">Lịch sử thanh toán <ArrowRight size={15} /></Link>
            <div className="profile-session-actions">
              <LogoutButton />
            </div>
          </div>
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            run(
              async () =>
                setUser(
                  await api("/auth/me", { method: "PATCH", body: { name } }),
                ),
              "Đã cập nhật hồ sơ.",
            );
          }}
        >
          <Field label="Họ và tên">
            <input
              required
              minLength={2}
              maxLength={100}
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </Field>
          <Button busy={busy}>Lưu thay đổi</Button>
        </form>
      </Card>
      <Card className="mt24">
        <h3>Đổi mật khẩu</h3>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            run(async () => {
              await post("/auth/password", password);
              setPassword({ old_password: "", new_password: "" });
            }, "Đã đổi mật khẩu.");
          }}
        >
          <Field label="Mật khẩu hiện tại">
            <input
              required
              type="password"
              autoComplete="current-password"
              value={password.old_password}
              onChange={(e) =>
                setPassword({ ...password, old_password: e.target.value })
              }
            />
          </Field>
          <Field label="Mật khẩu mới" hint="Tối thiểu 8 ký tự">
            <input
              required
              type="password"
              minLength={8}
              maxLength={128}
              autoComplete="new-password"
              value={password.new_password}
              onChange={(e) =>
                setPassword({ ...password, new_password: e.target.value })
              }
            />
          </Field>
          <Button busy={busy} variant="secondary">
            Cập nhật mật khẩu
          </Button>
        </form>
      </Card>
      <Card className="mt24">
        <h3>Cần hỗ trợ?</h3>
        <p>Gửi lỗi giao diện, nội dung hoặc đề xuất cải thiện.</p>
        <Button variant="secondary" onClick={() => setReport(true)}>
          <Flag size={16} /> Gửi phản ánh
        </Button>
      </Card>
      {report && <ReportModal onClose={() => setReport(false)} />}
    </div>
  );
}
export function Notifications() {
  const r = useData("/notifications"),
    [busy, run] = useAction();
  return (
    <div className="page-container narrow">
      <PageTitle
        title="Thông báo"
        description="Thông tin lớp học và phản hồi dành cho bạn."
      />
      <DataState resource={r}>
        {(data) =>
          data.length ? (
            <Card>
              {data.map((n) => (
                <div
                  key={n.id}
                  className={"notification " + (!n.read ? "unread" : "")}
                >
                  <span className="mini-icon blue">
                    <GraduationCap size={20} />
                  </span>
                  <div>
                    <p>{n.body}</p>
                    <small>{dateTime(n.created_at)}</small>
                  </div>
                  {!n.read && (
                    <Button
                      variant="secondary"
                      busy={busy}
                      onClick={() =>
                        run(async () => {
                          await post(`/notifications/${n.id}/read`);
                          r.reload();
                        })
                      }
                    >
                      Đã đọc
                    </Button>
                  )}
                </div>
              ))}
            </Card>
          ) : (
            <Empty title="Chưa có thông báo" />
          )
        }
      </DataState>
    </div>
  );
}
