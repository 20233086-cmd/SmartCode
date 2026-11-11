import {LessonStudio} from './lesson-studio';
import {UploadControl,ServiceStatus} from "./media";
import React, { useState, useEffect } from "react";
import {
  Plus,
  Users,
  BookOpen,
  Code2,
  Video,
  Upload,
  ArrowRight,
  Copy,
  Download,
  Activity,
  GraduationCap,
  Search,
  Edit3,
  Check,
  Trash2,
  FileText,
  Wifi,
  WifiOff,
  Shield,
  Flag,
  Wallet,
  Settings2,
  Eye,
  CheckCircle2,
} from "lucide-react";
import {
  api,
  post,
  useData,
  useAction,
  useSession,
  go,
  money,
  dateTime,
} from "./api";
import {
  Link,
  Badge,
  Button,
  Card,
  PageTitle,
  Stat,
  ProgressBar,
  Modal,
  Field,
  Tabs,
  Status,
  CodeBlock,
  Empty,
  DataState,
} from "./ui";
function downloadCSV(name, rows) {
  const clean = (v) => {
    let s = String(v ?? "");
    if (/^[=+@\-\t\r]/.test(s)) s = "'" + s;
    return '"' + s.replaceAll('"', '""') + '"';
  };
  const blob = new Blob(
    ["\uFEFF" + rows.map((r) => r.map(clean).join(",")).join("\r\n")],
    { type: "text/csv;charset=utf-8" },
  );
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export function ManageHome() {
  const courses = useData("/manage/courses"),
    classes = useData("/classes"),
    health = useData("/health");
  return (
    <div className="page-container">
      <PageTitle
        eyebrow="SMARTCODE CLASSROOM"
        title="Chào cô/thầy, ngày mới tốt lành!"
        description="Chuẩn bị học liệu, tổ chức lớp học và theo dõi điều học viên cần hỗ trợ."
      />
      <div className="grid three stats-grid">
        <Stat
          icon={BookOpen}
          label="Khóa học quản lý"
          value={courses.data?.length || 0}
        />
        <Stat
          icon={Users}
          tone="purple"
          label="Lớp học"
          value={classes.data?.length || 0}
        />
        <Stat
          icon={Code2}
          tone="green"
          label="Bài thực hành"
          value={courses.data?.reduce((a, c) => a + c.exercises_count, 0) || 0}
        />
      </div>
      <div className="manage-banner">
        <div>
          <Badge tone="white">MỘT KHÔNG GIAN, TOÀN BỘ QUY TRÌNH</Badge>
          <h2>
            Dành nhiều thời gian hơn
            <br />
            cho việc giảng dạy.
          </h2>
          <p>Từ bài giảng video đến những lần thử đầu tiên của học viên.</p>
          <Link className="btn white" to="/manage/classes">
            Mở lớp học <ArrowRight size={17} />
          </Link>
        </div>
        <GraduationCap size={150} strokeWidth={1} />
      </div>
      <div className="grid three mt24">
        {[
          [
            BookOpen,
            "Học liệu",
            "Khóa học, lý thuyết, câu hỏi và video.",
            "/manage/courses",
          ],
          [
            Code2,
            "Ngân hàng bài tập",
            "Đề bài, kiểm thử ẩn/công khai và gợi ý.",
            "/manage/exercises",
          ],
          [
            Activity,
            "Theo dõi lớp học",
            "Kết quả nộp bài và nhóm cần hỗ trợ.",
            "/manage/classes",
          ],
        ].map(([I, t, d, url]) => (
          <Card key={url}>
            <span className="mini-icon purple">
              <I />
            </span>
            <h3>{t}</h3>
            <p>{d}</p>
            <Link to={url} className="text-link">
              Mở quản lý <ArrowRight size={16} />
            </Link>
          </Card>
        ))}
      </div>
      <Card className="mt24">
        <h3>Trạng thái dịch vụ</h3>
        <DataState resource={health}>
          {(d) => (
            <div className="service-grid">
              <div>
                <Badge tone={d.runner ? "green" : "orange"}>
                  {d.runner ? "Đã cấu hình" : "Chưa cấu hình"}
                </Badge>
                <b>Chạy & chấm code</b>
                <small>Judge0 · cấu hình kết nối ở máy chủ</small>
              </div>
              <div>
                <Badge tone={d.ai === "ollama" ? "green" : "blue"}>
                  {d.ai === "ollama" ? "Ollama" : "Gợi ý soạn sẵn"}
                </Badge>
                <b>Trợ giảng</b>
                <small>Gợi ý theo bài và mức độ</small>
              </div>
              <div>
                <Badge tone="orange">
                  {d.payments === "demo" ? "Demo" : "Đang tắt"}
                </Badge>
                <b>Thanh toán</b>
                <small>Không phát sinh giao dịch thật</small>
              </div>
            </div>
          )}
        </DataState>
      </Card>
    </div>
  );
}
export function Classes({ manage = false }) {
  const r = useData("/classes"),
    c = useData(manage ? "/manage/courses" : null),
    [modal, setModal] = useState(false),
    [code, setCode] = useState(""),
    [form, setForm] = useState({ name: "", course_id: "" }),
    [busy, run] = useAction();
  return (
    <div className="page-container">
      <PageTitle
        eyebrow={manage ? "CLASSROOM" : "HỌC CÙNG NHAU"}
        title={manage ? "Lớp học của cô/thầy" : "Lớp học của bạn"}
        description={
          manage
            ? "Mở một không gian thực hành có hướng dẫn."
            : "Nhận bài tập và học theo nhịp của lớp."
        }
      >
        <Button onClick={() => setModal(true)}>
          <Plus size={17} />
          {manage ? "Tạo lớp học" : "Tham gia lớp"}
        </Button>
      </PageTitle>
      <DataState resource={r}>
        {(data) =>
          data.length ? (
            <div className="grid three">
              {data.map((room) => (
                <Card className="class-card" key={room.id}>
                  <div className="class-cover">
                    <GraduationCap size={36} />
                    <Badge tone="white">CLASSROOM</Badge>
                  </div>
                  <div className="class-body">
                    <h3>{room.name}</h3>
                    <p>
                      {room.members_count} học viên · {room.sessions.length}{" "}
                      buổi thực hành
                    </p>
                    <div className="join-code">
                      Mã lớp <b>{room.join_code}</b>
                      <button
                        className="icon-btn"
                        aria-label="Sao chép mã lớp"
                        onClick={() =>
                          run(
                            () => navigator.clipboard.writeText(room.join_code),
                            "Đã sao chép mã lớp.",
                          )
                        }
                      >
                        <Copy size={15} />
                      </button>
                    </div>
                    {manage ? (
                      <Link
                        className="btn primary full"
                        to={"/manage/classes/" + room.id}
                      >
                        Vào lớp <ArrowRight size={16} />
                      </Link>
                    ) : (
                      <div className="class-assignments">
                        {room.sessions
                          .filter((s) => s.status === "open")
                          .map((s) => (
                            <div key={s.id}>
                              <div className="row between">
                                <b>{s.title}</b>
                                <Badge tone={s.allow_hints ? "blue" : "orange"}>
                                  {s.allow_hints ? "Có gợi ý" : "Tắt gợi ý"}
                                </Badge>
                              </div>
                              <small>
                                {s.due_at
                                  ? "Hạn: " + s.due_at.replace("T", " ")
                                  : "Tự học theo lịch cá nhân"}
                              </small>
                              <div className="row wrap mt16">
                                {s.exercise_ids.map((id, i) => (
                                  <Link
                                    key={id}
                                    to={"/code/" + id + "?session=" + s.id}
                                    className="btn secondary small"
                                  >
                                    Bài {i + 1} <ArrowRight size={13} />
                                  </Link>
                                ))}
                              </div>
                            </div>
                          ))}
                        <Link
                          to={"/roadmap/" + room.course_id}
                          className="text-link"
                        >
                          Lộ trình khóa học <ArrowRight size={16} />
                        </Link>
                      </div>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <Empty
              title="Chưa có lớp học"
              action={
                <Button onClick={() => setModal(true)}>
                  {manage ? "Tạo lớp đầu tiên" : "Nhập mã tham gia"}
                </Button>
              }
            />
          )
        }
      </DataState>
      {modal && (
        <Modal
          title={manage ? "Tạo lớp học mới" : "Tham gia bằng mã lớp"}
          onClose={() => setModal(false)}
        >
          <form
            onSubmit={(e) => {
              e.preventDefault();
              run(
                async () => {
                  if (manage)
                    await post("/classes", {
                      ...form,
                      course_id: Number(form.course_id),
                    });
                  else
                    await post(
                      "/classes/join/" + encodeURIComponent(code.trim()),
                    );
                  r.reload();
                  setModal(false);
                },
                manage ? "Đã tạo lớp học." : "Đã tham gia lớp học.",
              );
            }}
          >
            {manage ? (
              <>
                <Field label="Tên lớp">
                  <input
                    required
                    minLength={2}
                    maxLength={200}
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="Java Core · N09"
                  />
                </Field>
                <Field label="Khóa học">
                  <select
                    required
                    value={form.course_id}
                    onChange={(e) =>
                      setForm({ ...form, course_id: e.target.value })
                    }
                  >
                    <option value="">Chọn khóa học</option>
                    {c.data?.map((x) => (
                      <option key={x.id} value={x.id}>
                        {x.title}
                      </option>
                    ))}
                  </select>
                </Field>
              </>
            ) : (
              <>
                <p>
                  Mã tham gia do giảng viên cung cấp. Tài khoản mẫu có thể thử{" "}
                  <b>SCJAVA</b>.
                </p>
                <Field label="Mã lớp">
                  <input
                    required
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                    maxLength={20}
                    placeholder="Ví dụ: SCJAVA"
                  />
                </Field>
              </>
            )}
            <Button busy={busy} className="full">
              {manage ? "Tạo lớp" : "Tham gia"}
            </Button>
          </form>
        </Modal>
      )}
    </div>
  );
}
export function ClassDetail({ id }) {
  const r = useData("/classes/" + id + "/report"),
    rooms = useData("/classes"),
    ex = useData("/manage/exercises"),
    [live, setLive] = useState(null),
    [connected, setConnected] = useState(false),
    [modal, setModal] = useState(false),
    [student, setStudent] = useState(null),
    [submission, setSubmission] = useState(null),
    [form, setForm] = useState({
      title: "",
      due_at: "",
      exercise_ids: [],
      allow_hints: true,
    }),
    [busy, run] = useAction();
  useEffect(() => {
    let socket,
      stopped = false,
      timer;
    const connect = () => {
      socket = new WebSocket(
        `${location.protocol === "https:" ? "wss" : "ws"}://${location.host}/api/classes/${id}/live`,
      );
      socket.onopen = () => setConnected(true);
      socket.onmessage = (e) => {
        try {
          setLive(JSON.parse(e.data));
        } catch {}
      };
      socket.onclose = () => {
        setConnected(false);
        if (!stopped) timer = setTimeout(connect, 5000);
      };
      socket.onerror = () => socket.close();
    };
    connect();
    return () => {
      stopped = true;
      clearTimeout(timer);
      socket?.close();
    };
  }, [id]);
  const data = live || r.data,
    room = rooms.data?.find((x) => x.id === Number(id));
  return (
    <div className="page-container">
      <PageTitle
        eyebrow="CLASSROOM / TỔNG QUAN"
        title={data?.classroom.name || "Theo dõi lớp học"}
        description="Số liệu thực hành toàn khóa học; tự cập nhật mỗi 3 giây khi kết nối trực tiếp."
      >
        <Badge tone={connected ? "green" : "orange"}>
          {connected ? <Wifi size={14} /> : <WifiOff size={14} />}{" "}
          {connected ? "Đang cập nhật" : "Đang kết nối lại"}
        </Badge>
        <Button onClick={() => setModal(true)}>
          <Plus size={17} /> Giao buổi thực hành
        </Button>
      </PageTitle>
      <DataState resource={{ ...r, data, loading: r.loading && !data }}>
        {(d) => (
          <>
            <div className="grid three">
              <Stat label="Học viên" icon={Users} value={d.students.length} />
              <Stat
                label="Đã nộp bài"
                tone="purple"
                value={d.students.filter((x) => x.attempts).length}
              />
              <Stat
                label="Cần hỗ trợ"
                tone="orange"
                value={
                  d.students.filter((x) => x.group === "Cần hỗ trợ").length
                }
              />
            </div>
            <div className="notice blue mt24">
              <Activity size={21} />
              <span>
                <b>Tóm tắt từ quy tắc</b>
                <br />
                {d.summary}
              </span>
            </div>
            <Card className="mt24">
              <div className="section-heading">
                <h3>Kết quả học viên</h3>
                <Button
                  variant="secondary"
                  onClick={() =>
                    downloadCSV("smartcode-class-" + id + ".csv", [
                      ["Ho ten", "Bai dat", "Tong bai", "Luot nop", "Nhom"],
                      ...d.students.map((s) => [
                        s.name,
                        s.solved,
                        s.total,
                        s.attempts,
                        s.group,
                      ]),
                    ])
                  }
                >
                  <Download size={16} /> Xuất CSV
                </Button>
              </div>
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Học viên</th>
                      <th>Tiến độ bài tập</th>
                      <th>Lượt nộp</th>
                      <th>Kết quả gần nhất</th>
                      <th>Nhóm</th>
                      <th />
                    </tr>
                  </thead>
                  <tbody>
                    {d.students.map((s) => (
                      <tr key={s.id}>
                        <td>
                          <b>{s.name}</b>
                        </td>
                        <td>
                          <div className="table-progress">
                            <span>
                              {s.solved}/{s.total}
                            </span>
                            <ProgressBar
                              value={s.total ? (s.solved / s.total) * 100 : 0}
                            />
                          </div>
                        </td>
                        <td>{s.attempts}</td>
                        <td>
                          <Status value={s.last_status} />
                        </td>
                        <td>
                          <Badge
                            tone={s.group === "Cần hỗ trợ" ? "orange" : "green"}
                          >
                            {s.group}
                          </Badge>
                        </td>
                        <td>
                          <Button
                            variant="secondary"
                            onClick={() => setStudent(s)}
                          >
                            Chi tiết
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {!d.students.length && (
                <Empty title="Lớp chưa có học viên">
                  Chia sẻ mã lớp {d.classroom.join_code} để học viên tham gia.
                </Empty>
              )}
              <p className="chart-note">
                Nhóm theo tỷ lệ bài tập đạt: dưới 50% cần hỗ trợ, 50–79% đạt, từ
                80% đạt tốt. Đây không phải dự đoán năng lực bằng AI.
              </p>
            </Card>
            <Card className="mt24">
              <div className="row between">
                <h3>Buổi thực hành</h3>
                <Badge tone="purple">Mã lớp: {d.classroom.join_code}</Badge>
              </div>
              {room?.sessions.map((s) => (
                <div className="session-row" key={s.id}>
                  <div>
                    <h4>{s.title}</h4>
                    <p>
                      {s.exercise_ids.length} bài tập ·{" "}
                      {s.allow_hints
                        ? "Cho phép gợi ý"
                        : "Gợi ý đang tắt khi buổi còn mở"}
                    </p>
                    <small>
                      Hạn: {s.due_at ? s.due_at.replace("T", " ") : "Không đặt"}
                    </small>
                  </div>
                  <div className="row">
                    <Status value={s.status} />
                    <Button
                      variant="secondary"
                      busy={busy}
                      onClick={() =>
                        run(async () => {
                          await api(`/classes/${id}/sessions/${s.id}`, {
                            method: "PATCH",
                            body: {
                              status: s.status === "open" ? "closed" : "open",
                            },
                          });
                          rooms.reload();
                        })
                      }
                    >
                      {s.status === "open" ? "Đóng buổi" : "Mở lại"}
                    </Button>
                  </div>
                </div>
              ))}
            </Card>
          </>
        )}
      </DataState>
      {modal && (
        <Modal wide title="Giao buổi thực hành" onClose={() => setModal(false)}>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              run(async () => {
                await post(`/classes/${id}/sessions`, form);
                setModal(false);
                rooms.reload();
                setForm({
                  title: "",
                  due_at: "",
                  exercise_ids: [],
                  allow_hints: true,
                });
              }, "Đã giao bài và gửi thông báo trong hệ thống.");
            }}
          >
            <div className="grid two">
              <Field label="Tên buổi">
                <input
                  required
                  minLength={2}
                  maxLength={200}
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                />
              </Field>
              <Field label="Hạn hoàn thành (giờ lớp học)">
                <input
                  type="datetime-local"
                  value={form.due_at}
                  onChange={(e) => setForm({ ...form, due_at: e.target.value })}
                />
              </Field>
            </div>
            <label className="check-row">
              <input
                type="checkbox"
                checked={form.allow_hints}
                onChange={(e) =>
                  setForm({ ...form, allow_hints: e.target.checked })
                }
              />{" "}
              Cho phép sử dụng gợi ý
            </label>
            <h4>Chọn bài tập ({form.exercise_ids.length})</h4>
            <div className="exercise-picker">
              {ex.data
                ?.filter((x) => x.course_id === data?.classroom.course_id)
                .map((x) => (
                  <label className="check-row" key={x.id}>
                    <input
                      type="checkbox"
                      checked={form.exercise_ids.includes(x.id)}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          exercise_ids: e.target.checked
                            ? [...form.exercise_ids, x.id]
                            : form.exercise_ids.filter((n) => n !== x.id),
                        })
                      }
                    />
                    {x.title}
                  </label>
                ))}
            </div>
            <Button
              busy={busy}
              disabled={!form.exercise_ids.length}
              className="full mt16"
            >
              Giao bài cho lớp
            </Button>
          </form>
        </Modal>
      )}
      {student && (
        <Modal
          wide
          title={"Kết quả của " + student.name}
          onClose={() => setStudent(null)}
        >
          <p>
            {student.solved}/{student.total} bài đã đạt · Tối đa 15 lượt nộp gần
            nhất
          </p>
          {student.submissions.length ? (
            student.submissions.map((s) => (
              <div className="session-row" key={s.id}>
                <div>
                  <b>{s.exercise_title}</b>
                  <small>{dateTime(s.created_at)}</small>
                </div>
                <div className="row">
                  <Status value={s.status} />
                  <Button
                    variant="secondary"
                    busy={busy}
                    onClick={() =>
                      run(async () =>
                        setSubmission(await api("/submissions/" + s.id)),
                      )
                    }
                  >
                    Xem code
                  </Button>
                </div>
              </div>
            ))
          ) : (
            <Empty title="Chưa nộp bài" />
          )}
          {submission && (
            <Card className="mt16">
              <div className="row between">
                <b>Bài nộp #{submission.id}</b>
                <Status value={submission.status} />
              </div>
              <CodeBlock>{submission.code}</CodeBlock>
            </Card>
          )}
        </Modal>
      )}
    </div>
  );
}
export function ContentManager({ section = "courses" }) {
  const r = useData("/manage/" + section),
    courses = useData("/manage/courses"),
    lessons = useData(section === "exercises" ? "/manage/lessons" : null);
  const [search, setSearch] = useState(""),
    [course, setCourse] = useState(""),
    [editing, setEditing] = useState(null),
    [busy, run] = useAction();
  useEffect(() => {
    const edit = Number(new URLSearchParams(location.hash.split('?')[1]).get('edit'));
    if (edit && r.data) setEditing(r.data.find(x=>x.id===edit) || null);
  }, [r.data]);
  const labels = {
    courses: "Khóa học",
    lessons: "Bài học & video",
    exercises: "Ngân hàng bài tập",
  };
  const blank = () =>
    section === "courses"
      ? {
          title: "",
          language: "python",
          description: "",
          price: 0,
          level: "basic",
          published: true,
          color: "violet",
        }
      : section === "lessons"
        ? {
            course_id: Number(course || courses.data?.[0]?.id) || "",
            title: "",
            content: "",
            code: "",
            position: 1,
            skill: "input_output",
            video_url: "",
            captions_url: "",
            quiz: [],
          }
        : {
            course_id: Number(course || courses.data?.[0]?.id) || "",
            lesson_id: "",
            title: "",
            description: "",
            difficulty: "easy",
            skill: "input_output",
            starter: "",
            tests: [{ input: "", output: "", hidden: false }],
            hints: ["Đọc kỹ đầu vào và xác định kiểu dữ liệu."],
          };
  const save = (e) => {
    e.preventDefault();
    run(async () => {
      const data = { ...editing };
      delete data.id;
      if (section !== "courses") data.course_id = Number(data.course_id);
      if (section === "exercises") data.lesson_id = Number(data.lesson_id);
      await api("/manage/" + section + (editing.id ? "/" + editing.id : ""), {
        method: editing.id ? "PUT" : "POST",
        body: data,
      });
      setEditing(null);
      r.reload();
      courses.reload();
    }, "Đã lưu nội dung.");
  };
  const EditingFrame = section === "exercises" ? ExerciseEditorFrame : Modal;
  if (section === "lessons" && editing) return <LessonStudio key={editing.id || "new"} initial={editing} courses={courses.data || []} QuizEditor={QuizEditor} onClose={()=>{setEditing(null);if(location.hash.includes('?edit='))history.replaceState(null,'',location.hash.split('?')[0])}} onSaved={()=>{setEditing(null);r.reload();courses.reload();if(location.hash.includes('?edit='))history.replaceState(null,'',location.hash.split('?')[0])}}/>;
  return (
    <div className={'page-container '+(editing && section==='exercises' ? 'exercise-editor-open' : '')}>
      <PageTitle
        eyebrow="QUẢN LÝ HỌC LIỆU"
        title={labels[section]}
        description={
          section === "courses"
            ? "Soạn nội dung và xuất bản khi sẵn sàng."
            : section === "lessons"
              ? "Lý thuyết, ví dụ, video, phụ đề và câu hỏi trong cùng một bài học."
              : "Xây bộ kiểm thử rõ ràng để học viên nhận phản hồi đúng."
        }
      >
        <Button onClick={() => setEditing(blank())}>
          <Plus size={17} />{" "}
          {section === "courses"
            ? "Tạo khóa học"
            : section === "lessons"
              ? "Thêm bài học"
              : "Thêm bài tập"}
        </Button>
      </PageTitle>
      <div className="filter-bar">
        <div className="search-input">
          <Search size={18} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm theo tên…"
            aria-label="Tìm nội dung"
          />
        </div>
        {section !== "courses" && (
          <select
            value={course}
            onChange={(e) => setCourse(e.target.value)}
            aria-label="Chọn khóa học"
          >
            <option value="">Tất cả khóa học</option>
            {courses.data?.map((c) => (
              <option value={c.id} key={c.id}>
                {c.title}
              </option>
            ))}
          </select>
        )}
      </div>
      <DataState resource={r}>
        {(data) => {
          const rows = data.filter(
            (x) =>
              x.title.toLowerCase().includes(search.toLowerCase()) &&
              (!course || x.course_id === Number(course)),
          );
          return rows.length ? (
            <Card className="table-card">
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>{section === "courses" ? "Khóa học" : "Nội dung"}</th>
                      <th>{section === "courses" ? "Ngôn ngữ" : "Khóa học"}</th>
                      <th>Thông tin</th>
                      <th />
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((x) => (
                      <tr key={x.id}>
                        <td>
                          <b>{x.title}</b>
                          <small>
                            #{x.id} {x.skill && "· " + x.skill}
                          </small>
                        </td>
                        <td>
                          {section === "courses"
                            ? x.language
                            : courses.data?.find((c) => c.id === x.course_id)
                                ?.title}
                        </td>
                        <td>
                          {section === "courses" ? (
                            <Badge tone={x.published ? "green" : "orange"}>
                              {x.published ? "Đã xuất bản" : "Bản nháp"}
                            </Badge>
                          ) : section === "lessons" ? (
                            <div className="row wrap">
                              <Badge tone={x.video_url ? "green" : "orange"}>
                                {x.video_url ? "Có video" : "Chưa có video"}
                              </Badge>
                              <small>{x.quiz.length} câu hỏi</small>
                            </div>
                          ) : (
                            <>
                              <Badge tone="purple">{x.tests.length} test</Badge>
                              <small>{x.difficulty}</small>
                            </>
                          )}
                        </td>
                        <td>
                          <Button
                            variant="secondary"
                            onClick={() => setEditing(structuredClone(x))}
                          >
                            <Edit3 size={15} /> Chỉnh sửa
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          ) : (
            <Empty title="Chưa có nội dung phù hợp" />
          );
        }}
      </DataState>
      {editing && (
        <EditingFrame
          wide
          title={(editing.id ? "Chỉnh sửa · " : "Tạo mới · ") + labels[section]}
          onClose={() => setEditing(null)}
        >
          <form onSubmit={save}>
            <Field label="Tiêu đề">
              <input
                required
                minLength={2}
                maxLength={200}
                value={editing.title}
                onChange={(e) =>
                  setEditing({ ...editing, title: e.target.value })
                }
              />
            </Field>
            {section === "courses" ? (
              <>
                <div className="grid three">
                  <Field label="Ngôn ngữ">
                    <select
                      value={editing.language}
                      onChange={(e) =>
                        setEditing({ ...editing, language: e.target.value })
                      }
                    >
                      <option value="python">Python</option>
                      <option value="java">Java</option>
                      <option value="javascript">JavaScript</option>
                    </select>
                  </Field>
                  <Field label="Trình độ khóa học">
                    <select value={editing.level || "basic"} onChange={e => setEditing({ ...editing, level: e.target.value, price: e.target.value === "basic" ? 0 : editing.price || 1000 })}>
                      <option value="basic">Cơ bản · Miễn phí</option><option value="intermediate">Vận dụng · Trả phí</option><option value="advanced">Nâng cao · Trả phí</option>
                    </select>
                  </Field>
                  <Field label={(editing.level || "basic") === "basic" ? "Giá: miễn phí" : "Giá khóa học (VND)"}>
                    <input
                      type="number"
                      min={(editing.level || "basic") === "basic" ? 0 : 1000}
                      max={50000000}
                      disabled={(editing.level || "basic") === "basic"}
                      required
                      value={editing.price}
                      onChange={(e) =>
                        setEditing({
                          ...editing,
                          price: Number(e.target.value),
                        })
                      }
                    />
                  </Field>
                  <Field label="Màu thẻ">
                    <select
                      value={editing.color}
                      onChange={(e) =>
                        setEditing({ ...editing, color: e.target.value })
                      }
                    >
                      <option value="violet">Tím</option>
                      <option value="gold">Cam</option>
                      <option value="pink">Hồng</option>
                    </select>
                  </Field>
                </div>
                <Field label="Giới thiệu">
                  <textarea
                    required
                    rows={4}
                    value={editing.description}
                    onChange={(e) =>
                      setEditing({ ...editing, description: e.target.value })
                    }
                  />
                </Field>
                <label className="check-row">
                  <input
                    type="checkbox"
                    checked={editing.published}
                    onChange={(e) =>
                      setEditing({ ...editing, published: e.target.checked })
                    }
                  />{" "}
                  Xuất bản khóa học (bỏ chọn để ẩn khỏi người học)
                </label>
              </>
            ) : (
              <>
                <div className="grid two">
                  <Field label="Khóa học">
                    <select
                      required
                      disabled={section === "lessons" && !!editing.id}
                      value={editing.course_id}
                      onChange={(e) =>
                        setEditing({
                          ...editing,
                          course_id: Number(e.target.value),
                          ...(section === "exercises" ? { lesson_id: "" } : {}),
                        })
                      }
                    >
                      <option value="">Chọn khóa học</option>
                      {courses.data?.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.title}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Nhóm kỹ năng">
                    <select
                      value={editing.skill}
                      onChange={(e) =>
                        setEditing({ ...editing, skill: e.target.value })
                      }
                    >
                      {[
                        "input_output",
                        "variables",
                        "operators",
                        "conditions",
                        "loops",
                        "strings",
                        "arrays",
                        "functions",
                        "algorithms",
                        "review",
                      ].map((s) => (
                        <option key={s}>{s}</option>
                      ))}
                    </select>
                  </Field>
                </div>
                {section === "lessons" ? (
                  <>
                    <Field label="Thứ tự trong khóa">
                      <input
                        type="number"
                        required
                        min={1}
                        max={1000}
                        value={editing.position}
                        onChange={(e) =>
                          setEditing({
                            ...editing,
                            position: Number(e.target.value),
                          })
                        }
                      />
                    </Field>
                    <Field
                      label="Nội dung lý thuyết"
                      hint="Phân tách các đoạn bằng một dòng trống. Văn bản được hiển thị an toàn."
                    >
                      <textarea
                        required
                        rows={8}
                        value={editing.content}
                        onChange={(e) =>
                          setEditing({ ...editing, content: e.target.value })
                        }
                      />
                    </Field>
                    <Field label="Code minh họa">
                      <textarea
                        className="mono"
                        rows={5}
                        value={editing.code}
                        onChange={(e) =>
                          setEditing({ ...editing, code: e.target.value })
                        }
                      />
                    </Field>
                    <MediaField
                      label="Video bài giảng"
                      kind="video"
                      value={editing.video_url}
                      onChange={(v) =>
                        setEditing((x) => ({ ...x, video_url: v }))
                      }
                    />
                    <MediaField
                      label="Phụ đề tiếng Việt"
                      kind="captions"
                      value={editing.captions_url}
                      onChange={(v) =>
                        setEditing((x) => ({ ...x, captions_url: v }))
                      }
                    />
                    <QuizEditor
                      quiz={editing.quiz}
                      onChange={(v) => setEditing({ ...editing, quiz: v })}
                    />
                  </>
                ) : (
                  <>
                    <div className="grid two">
                      <Field label="Bài học liên quan">
                        <select
                          required
                          value={editing.lesson_id}
                          onChange={(e) =>
                            setEditing({
                              ...editing,
                              lesson_id: Number(e.target.value),
                            })
                          }
                        >
                          <option value="">Chọn bài học</option>
                          {lessons.data
                            ?.filter((l) => l.course_id === editing.course_id)
                            .map((l) => (
                              <option key={l.id} value={l.id}>
                                {l.title}
                              </option>
                            ))}
                        </select>
                      </Field>
                      <Field label="Mức độ">
                        <select
                          value={editing.difficulty}
                          onChange={(e) =>
                            setEditing({
                              ...editing,
                              difficulty: e.target.value,
                            })
                          }
                        >
                          <option value="easy">Cơ bản</option>
                          <option value="medium">Vận dụng</option>
                          <option value="hard">Nâng cao</option>
                        </select>
                      </Field>
                    </div>
                    <Field label="Đề bài và định dạng đầu vào/ra">
                      <textarea
                        required
                        rows={5}
                        value={editing.description}
                        onChange={(e) =>
                          setEditing({
                            ...editing,
                            description: e.target.value,
                          })
                        }
                      />
                    </Field>
                    <Field label="Code khởi đầu">
                      <textarea
                        className="mono"
                        rows={5}
                        value={editing.starter}
                        onChange={(e) =>
                          setEditing({ ...editing, starter: e.target.value })
                        }
                      />
                    </Field>
                    <div className="section-heading">
                      <h3>Bộ kiểm thử</h3>
                      <Button
                        type="button"
                        variant="secondary"
                        disabled={editing.tests.length >= 20}
                        onClick={() =>
                          setEditing({
                            ...editing,
                            tests: [
                              ...editing.tests,
                              { input: "", output: "", hidden: true },
                            ],
                          })
                        }
                      >
                        <Plus size={15} /> Thêm test
                      </Button>
                    </div>
                    {editing.tests.map((t, i) => (
                      <div className="test-editor" key={i}>
                        <div className="row between">
                          <b>Test {i + 1}</b>
                          <label className="check-row">
                            <input
                              type="checkbox"
                              checked={!!t.hidden}
                              onChange={(e) =>
                                setEditing({
                                  ...editing,
                                  tests: editing.tests.map((x, j) =>
                                    j === i
                                      ? { ...x, hidden: e.target.checked }
                                      : x,
                                  ),
                                })
                              }
                            />{" "}
                            Test ẩn
                          </label>
                          <button
                            type="button"
                            disabled={editing.tests.length === 1}
                            aria-label="Xóa test"
                            className="icon-btn"
                            onClick={() =>
                              setEditing({
                                ...editing,
                                tests: editing.tests.filter((_, j) => j !== i),
                              })
                            }
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                        <div className="grid two">
                          <Field label="Đầu vào">
                            <textarea
                              className="mono"
                              rows={3}
                              value={t.input}
                              onChange={(e) =>
                                setEditing({
                                  ...editing,
                                  tests: editing.tests.map((x, j) =>
                                    j === i
                                      ? { ...x, input: e.target.value }
                                      : x,
                                  ),
                                })
                              }
                            />
                          </Field>
                          <Field label="Đầu ra mong đợi">
                            <textarea
                              className="mono"
                              rows={3}
                              value={t.output}
                              onChange={(e) =>
                                setEditing({
                                  ...editing,
                                  tests: editing.tests.map((x, j) =>
                                    j === i
                                      ? { ...x, output: e.target.value }
                                      : x,
                                  ),
                                })
                              }
                            />
                          </Field>
                        </div>
                      </div>
                    ))}
                    <Field label="Các gợi ý (mỗi dòng một mức)">
                      <textarea
                        required
                        rows={4}
                        value={editing.hints.join("\n")}
                        onChange={(e) =>
                          setEditing({
                            ...editing,
                            hints: e.target.value.split("\n"),
                          })
                        }
                      />
                    </Field>
                  </>
                )}
              </>
            )}
            <div className="modal-footer">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setEditing(null)}
              >
                Hủy
              </Button>
              <Button busy={busy}>
                <Check size={16} /> Lưu nội dung
              </Button>
            </div>
          </form>
        </EditingFrame>
      )}
    </div>
  );
}
function MediaField({label,kind,value,onChange}) {
 return <div className="media-field"><Field label={label} hint={kind==='video'?'MP4 / WebM hoặc liên kết HTTPS tới video.':'Phụ đề WebVTT (.vtt).'}><input value={value} onChange={e=>onChange(e.target.value)} placeholder="https://…"/></Field><UploadControl kind={kind} onUploaded={m=>onChange(m.url)}/></div>;
}
function QuizEditor({ quiz, onChange }) {
  return (
    <div className="quiz-editor">
      <div className="section-heading">
        <h3>Câu hỏi kiểm tra nhanh</h3>
        <Button
          type="button"
          variant="secondary"
          disabled={quiz.length >= 30}
          onClick={() =>
            onChange([
              ...quiz,
              {
                question: "",
                options: ["", "", ""],
                answer: 0,
                explanation: "",
              },
            ])
          }
        >
          <Plus size={15} /> Thêm câu hỏi
        </Button>
      </div>
      {quiz.map((q, i) => (
        <div className="test-editor" key={i}>
          <div className="row between">
            <b>Câu {i + 1}</b>
            <button
              type="button"
              aria-label="Xóa câu hỏi"
              className="icon-btn"
              onClick={() => onChange(quiz.filter((_, j) => j !== i))}
            >
              <Trash2 size={16} />
            </button>
          </div>
          <Field label="Nội dung câu hỏi">
            <input
              required
              minLength={3}
              value={q.question}
              onChange={(e) =>
                onChange(
                  quiz.map((x, j) =>
                    i === j ? { ...x, question: e.target.value } : x,
                  ),
                )
              }
            />
          </Field>
          {q.options.map((o, n) => (
            <label className="option-editor" key={n}>
              <input
                type="radio"
                aria-label={"Chọn đáp án đúng " + (n + 1)}
                name={"correct-" + i}
                checked={q.answer === n}
                onChange={() =>
                  onChange(
                    quiz.map((x, j) => (i === j ? { ...x, answer: n } : x)),
                  )
                }
              />
              <input
                required
                aria-label={"Lựa chọn " + (n + 1)}
                value={o}
                onChange={(e) =>
                  onChange(
                    quiz.map((x, j) =>
                      i === j
                        ? {
                            ...x,
                            options: x.options.map((v, k) =>
                              k === n ? e.target.value : v,
                            ),
                          }
                        : x,
                    ),
                  )
                }
              />
            </label>
          ))}
          <small>Đánh dấu tròn vào đáp án đúng.</small>
          <Field label="Giải thích">
            <textarea
              rows={2}
              value={q.explanation}
              onChange={(e) =>
                onChange(
                  quiz.map((x, j) =>
                    i === j ? { ...x, explanation: e.target.value } : x,
                  ),
                )
              }
            />
          </Field>
        </div>
      ))}
    </div>
  );
}
export function MediaLibrary() {
  const r = useData("/manage/media"),
    [busy, run] = useAction();
  return (
    <div className="page-container">
      <PageTitle
        title="Thư viện video & phụ đề"
        description="Tệp đã tải lên được gắn vào bài học để người học truy cập."
      >
        <Link to="/manage/lessons" className="btn primary">
          <Plus size={17} /> Thêm video vào bài học
        </Link>
      </PageTitle>
      <DataState resource={r}>
        {(data) =>
          data.length ? (
            <Card className="table-card">
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Tệp</th>
                      <th>Loại</th>
                      <th>Dung lượng</th>
                      <th />
                    </tr>
                  </thead>
                  <tbody>
                    {data.map((m) => (
                      <tr key={m.id}>
                        <td>
                          <b>{m.name}</b>
                          <small>{dateTime(m.created_at)}</small>
                        </td>
                        <td>
                          <Badge tone="purple">
                            {m.kind === "video" ? "Video" : "Phụ đề"}
                          </Badge>
                        </td>
                        <td>{(m.size / 1024 / 1024).toFixed(2)} MB</td>
                        <td>
                          <div className="row">
                            <a
                              className="btn secondary"
                              href={m.url}
                              target="_blank"
                              rel="noreferrer"
                            >
                              <Eye size={16} /> Mở tệp
                            </a>
                            <Button
                              busy={busy}
                              variant="secondary"
                              onClick={() =>
                                run(
                                  () => navigator.clipboard.writeText(m.url),
                                  "Đã sao chép đường dẫn.",
                                )
                              }
                            >
                              Sao chép
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          ) : (
            <Empty title="Chưa có tệp">
              Tải video hoặc phụ đề khi chỉnh sửa bài học.
            </Empty>
          )
        }
      </DataState>
    </div>
  );
}
export function Admin({ section = "overview" }) {
  const r = useData("/admin/" + section),
    users = useData(
      section === "payments" || section === "reports" ? "/admin/users" : null,
    ),
    [search, setSearch] = useState(""),
    [busy, run] = useAction(),
    { user } = useSession();
  const names = {
    overview: "Tổng quan hệ thống",
    users: "Quản lý tài khoản",
    payments: "Giao dịch thử nghiệm",
    reports: "Phản ánh & hỗ trợ",
  };
  return (
    <div className="page-container">
      <PageTitle
        eyebrow="SMARTCODE ADMIN"
        title={names[section]}
        description={
          section === "payments"
            ? "Các giao dịch demo, không tương đương doanh thu thực."
            : "Quản lý hoạt động và giữ trải nghiệm học tập thông suốt."
        }
      />
      <DataState resource={r}>
        {(data) =>
          section === "overview" ? (
            <>
              <div className="grid four">
                <Stat label="Tài khoản" icon={Users} value={data.users} />
                <Stat
                  label="Khóa học"
                  tone="purple"
                  icon={BookOpen}
                  value={data.courses}
                />
                <Stat
                  label="Lượt nộp"
                  tone="green"
                  icon={Code2}
                  value={data.submissions}
                />
                <Stat
                  label="Phản ánh chờ xử lý"
                  tone="orange"
                  icon={Flag}
                  value={data.reports}
                />
              </div>
              <div className="grid three mt24">
                {[
                  [
                    Users,
                    "Tài khoản",
                    "Cấp vai trò giảng viên, quản trị viên hoặc khóa truy cập.",
                    "users",
                  ],
                  [
                    Wallet,
                    "Giao dịch",
                    "Theo dõi đơn hàng và xác nhận chuyển khoản VPBank.",
                    "payments",
                  ],
                  [
                    Flag,
                    "Hỗ trợ",
                    "Xem và đánh dấu phản ánh đã xử lý.",
                    "reports",
                  ],
                ].map(([I, t, d, s]) => (
                  <Card key={s}>
                    <span className="mini-icon purple">
                      <I />
                    </span>
                    <h3>{t}</h3>
                    <p>{d}</p>
                    <Link className="text-link" to={"/admin/" + s}>
                      Quản lý <ArrowRight size={16} />
                    </Link>
                  </Card>
                ))}
              </div>
              <ServiceStatus/>
              <Card className="mt24">
                <h3>Quản lý nội dung</h3>
                <p>
                  Quản trị viên có thể chỉnh sửa học liệu và xem các lớp học
                  trên hệ thống.
                </p>
                <div className="row wrap">
                  <Link className="btn secondary" to="/manage/courses">
                    Khóa học
                  </Link>
                  <Link className="btn secondary" to="/manage/classes">
                    Lớp học
                  </Link>
                </div>
              </Card>
            </>
          ) : (
            <>
              <div className="filter-bar">
                <div className="search-input">
                  <Search size={18} />
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Tìm trong danh sách…"
                    aria-label="Tìm kiếm"
                  />
                </div>
              </div>
              <Card className="table-card">
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        {(section === "users"
                          ? ["Tài khoản", "Vai trò", "Trạng thái", ""]
                          : section === "payments"
                            ? [
                                "Mã giao dịch",
                                "Tài khoản",
                                "Khóa học",
                                "Giá trị mô phỏng",
                                "Trạng thái",
                              ]
                            : ["Người gửi", "Nội dung", "Trạng thái", ""]
                        ).map((t, i) => (
                          <th key={i}>{t}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {data
                        .filter((x) =>
                          JSON.stringify(x)
                            .toLowerCase()
                            .includes(search.toLowerCase()),
                        )
                        .map((x) =>
                          section === "users" ? (
                            <tr key={x.id}>
                              <td>
                                <b>{x.name}</b>
                                <small>{x.email}</small>
                              </td>
                              <td>
                                <select
                                  aria-label={"Vai trò của " + x.name}
                                  disabled={busy || x.id === user.id}
                                  value={x.role}
                                  onChange={(e) =>
                                    run(async () => {
                                      await api("/admin/users/" + x.id, {
                                        method: "PATCH",
                                        body: {
                                          role: e.target.value,
                                          active: x.active,
                                        },
                                      });
                                      r.reload();
                                    }, "Đã cập nhật vai trò.")
                                  }
                                >
                                  <option value="learner">Người học</option>
                                  <option value="teacher">Giảng viên</option>
                                  <option value="admin">Quản trị viên</option>
                                </select>
                              </td>
                              <td>
                                <Badge tone={x.active ? "green" : "red"}>
                                  {x.active ? "Hoạt động" : "Đã khóa"}
                                </Badge>
                              </td>
                              <td>
                                <Button
                                  variant="secondary"
                                  disabled={x.id === user.id}
                                  busy={busy}
                                  onClick={() =>
                                    run(async () => {
                                      await api("/admin/users/" + x.id, {
                                        method: "PATCH",
                                        body: {
                                          role: x.role,
                                          active: !x.active,
                                        },
                                      });
                                      r.reload();
                                    })
                                  }
                                >
                                  {x.active ? "Khóa" : "Mở khóa"}
                                </Button>
                              </td>
                            </tr>
                          ) : section === "payments" ? (
                            <tr key={x.id}>
                              <td>
                                <b>#{x.id}</b>
                                <small>{dateTime(x.created_at)}</small>
                              </td>
                              <td>
                                {users.data?.find((u) => u.id === x.user_id)
                                  ?.name || "#" + x.user_id}
                              </td>
                              <td>#{x.course_id}</td>
                              <td>
                                {money(x.amount)}{" "}
                                <Badge tone="orange">Demo</Badge>
                              </td>
                              <td>
                                <Status value={x.status} />
                              </td>
                            </tr>
                          ) : (
                            <tr key={x.id}>
                              <td>
                                <b>
                                  {users.data?.find((u) => u.id === x.user_id)
                                    ?.name || "#" + x.user_id}
                                </b>
                                <small>{dateTime(x.created_at)}</small>
                              </td>
                              <td className="long-cell">
                                {x.body}
                                {x.exercise_id && (
                                  <small>Bài tập #{x.exercise_id}</small>
                                )}
                              </td>
                              <td>
                                <Status value={x.status} />
                              </td>
                              <td>
                                {x.status === "pending" && (
                                  <Button
                                    variant="secondary"
                                    busy={busy}
                                    onClick={() =>
                                      run(async () => {
                                        await post(
                                          `/admin/reports/${x.id}/resolve`,
                                        );
                                        r.reload();
                                      }, "Đã ghi nhận xử lý.")
                                    }
                                  >
                                    <CheckCircle2 size={16} /> Đã xử lý
                                  </Button>
                                )}
                              </td>
                            </tr>
                          ),
                        )}
                    </tbody>
                  </table>
                </div>
                {!data.length && <Empty title="Chưa có bản ghi" />}
              </Card>
            </>
          )
        }
      </DataState>
    </div>
  );
}

function ExerciseEditorFrame({title,onClose,children}){return <section className="fullpage-editor"><PageTitle title={title} description="Thiết lập đề bài, code khởi đầu, bộ kiểm thử và gợi ý."><Button variant="secondary" onClick={onClose}>← Ngân hàng bài tập</Button></PageTitle><Card>{children}</Card></section>}
