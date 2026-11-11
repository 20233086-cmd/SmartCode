import React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  render,
  screen,
  fireEvent,
  waitFor,
  cleanup,
  within,
} from "@testing-library/react";
import App from "../App";
import { SessionProvider } from "../api";
import fixtures from "./fixtures.json";
vi.mock("../CodeEditor", () => ({
  default: ({ value, onChange }) => (
    <textarea
      aria-label="Trình soạn thảo code"
      value={value}
      onChange={(e) => onChange(e.target.value)}
    />
  ),
}));
let role = "learner",
  requests = [];
function mount(path) {
  window.history.replaceState({}, "", "/#" + path);
  return render(
    <SessionProvider>
      <App />
    </SessionProvider>,
  );
}
beforeEach(() => {
  role = "learner";
  requests = [];
  window.scrollTo = vi.fn();
  HTMLDialogElement.prototype.showModal = function () {
    this.open = true;
  };
  HTMLDialogElement.prototype.close = function () {
    this.open = false;
  };
  global.fetch = vi.fn(async (url, opts = {}) => {
    const path = String(url).replace("/api", "").split("?")[0];
    const method = opts.method || "GET";
    requests.push({
      path,
      method,
      body: opts.body ? JSON.parse(opts.body) : undefined,
    });
    if (path === "/auth/me" && role === "guest")
      return {
        ok: false,
        status: 401,
        json: async () => ({ detail: "Đăng nhập" }),
      };
    let data = fixtures[role === "guest" ? "learner" : role][path];
    if (method !== "GET") {
      if (path === "/auth/login") {
        role = "learner";
        data = fixtures.learner["/auth/me"];
      } else if (path === "/auth/logout") {
        role = "guest";
        data = { ok: true };
      } else if (path === "/lessons/1/quiz")
        data = {
          score: 100,
          feedback: [
            { answer: 0, explanation: "stdout là đầu ra." },
            { answer: 1, explanation: "Chỉ in kết quả." },
          ],
        };
      else if (path.includes("/draft"))
        data = { saved_at: "2026-10-12T00:00:00" };
      else if (path === "/emotions")
        data = { state: "negative", source: "self-report" };
      else if (path.includes("/hint"))
        data = {
          content: "Đọc kỹ đầu vào.",
          provider: "rule-based",
          source: "Nhập xuất",
        };
      else if (path === "/courses/1/assessments") data=fixtures.learner[path];
      else data = { ok: true };
    }
    return {
      ok: true,
      status: 200,
      json: async () => structuredClone(data ?? []),
    };
  });
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});
describe("SmartCode UI flows", () => {
  it("loads the learner dashboard from API data", async () => {
    mount("/dashboard");
    expect(
      await screen.findByText("Tổng quan học tập"),
    ).toBeTruthy();
    expect(await screen.findByText("Python cơ bản")).toBeTruthy();
    expect(screen.getAllByText("0 ngày").length).toBeGreaterThan(0);
  });
  it("submits credentials and enters the dashboard", async () => {
    role = "guest";
    mount("/login");
    await screen.findByText("Chào mừng trở lại");
    fireEvent.change(screen.getByLabelText("Email"),{target:{value:"learner@smartcode.local"}});
    fireEvent.change(screen.getByLabelText("Mật khẩu"),{target:{value:"SmartCode@123"}});
    fireEvent.click(screen.getByRole("button", { name: /^Đăng nhập/ }));
    await screen.findByText("Tổng quan học tập");
    expect(requests.find((x) => x.path === "/auth/login").body.email).toBe(
      "learner@smartcode.local",
    );
  });
  it("logs out from the account page and blocks account access after reload", async () => {
    mount("/account");
    await screen.findByText("Tài khoản của bạn");
    fireEvent.click(within(document.querySelector(".profile-session-actions")).getByRole("button", { name: "Đăng xuất" }));
    await screen.findByText("Chào mừng trở lại");
    expect(window.location.hash).toBe("#/login");
    expect(global.fetch).toHaveBeenCalledWith("/api/auth/logout", expect.objectContaining({ method: "POST", credentials: "include" }));
    expect(screen.queryByText("Tài khoản của bạn")).toBeNull();
    cleanup();
    mount("/account");
    await screen.findByText("Đăng nhập để tiếp tục học");
    expect(screen.queryByDisplayValue(fixtures.learner["/auth/me"].name)).toBeNull();
  });
  it.each([
    ["learner", "/dashboard"],
    ["teacher", "/manage"],
    ["admin", "/admin"],
  ])("lets %s log out from navigation", async (account, path) => {
    role = account;
    mount(path);
    fireEvent.click(await screen.findByRole("button", { name: "Đăng xuất" }));
    await screen.findByText("Chào mừng trở lại");
    expect(requests.filter(x => x.path === "/auth/logout")).toHaveLength(1);
  });
  it("offers logout in the expanded learner navigation menu", async () => {
    mount("/account");
    await screen.findByText("Tài khoản của bạn");
    fireEvent.click(screen.getByRole("button", { name: "Mở menu điều hướng" }));
    fireEvent.click(within(document.querySelector(".reference-nav-inner nav.open")).getByRole("button", { name: "Đăng xuất" }));
    await screen.findByText("Chào mừng trở lại");
  });
  it("disables all logout buttons while the request is pending", async () => {
    const originalFetch = global.fetch.getMockImplementation();
    let complete;
    global.fetch.mockImplementation((url, opts) => url === "/api/auth/logout"
      ? new Promise(resolve => { complete = resolve; })
      : originalFetch(url, opts));
    mount("/account");
    const buttons = await screen.findAllByRole("button", { name: "Đăng xuất" });
    fireEvent.click(buttons[0]);
    expect(screen.getAllByRole("button", { name: "Đang đăng xuất…" }).every(button => button.disabled)).toBe(true);
    buttons.forEach(button => fireEvent.click(button));
    expect(global.fetch.mock.calls.filter(([url]) => url === "/api/auth/logout")).toHaveLength(1);
    complete({ ok: true, status: 200, json: async () => ({ ok: true }) });
    await screen.findByText("Chào mừng trở lại");
  });
  it("keeps the account available and allows retry when logout fails", async () => {
    const originalFetch = global.fetch.getMockImplementation();
    global.fetch.mockImplementation((url, opts) => url === "/api/auth/logout"
      ? Promise.reject(new Error("Mất kết nối máy chủ."))
      : originalFetch(url, opts));
    mount("/account");
    fireEvent.click((await screen.findAllByRole("button", { name: "Đăng xuất" }))[0]);
    await screen.findByText(/Chưa đăng xuất được.*Mất kết nối/);
    expect(window.location.hash).toBe("#/account");
    expect(screen.getByText("Tài khoản của bạn")).toBeTruthy();
    expect(screen.getAllByRole("button", { name: "Đăng xuất" }).every(button => !button.disabled)).toBe(true);
    global.fetch.mockImplementation(originalFetch);
    fireEvent.click(screen.getAllByRole("button", { name: "Đăng xuất" })[0]);
    await screen.findByText("Chào mừng trở lại");
  });
  it("includes a real video source, captions, and graded quiz flow", async () => {
    const { container } = mount("/lesson/1");
    await screen.findByText("Đến lượt bạn thực hành");
    const video = container.querySelector("video");
    expect(video?.getAttribute("src")).toMatch(/^\/api\/media\//);
    expect(container.querySelector("track")?.getAttribute("src")).toMatch(
      /^\/api\/media\//,
    );
    fireEvent.click(screen.getByRole("button", { name: /Kiểm tra nhanh/ }));
    fireEvent.click(screen.getByLabelText("5"));
    fireEvent.click(
      screen.getByLabelText("Chỉ số kết quả theo đúng định dạng"),
    );
    fireEvent.click(
      screen.getByRole("button", { name: /Kiểm tra câu trả lời/ }),
    );
    expect(await screen.findByText("100%")).toBeTruthy();
    expect(
      requests.find((x) => x.path === "/lessons/1/quiz").body.answers,
    ).toEqual([0, 1]);
  });
  it("shows all Insight charts, filters and CSV download", async () => {
    mount("/insight");
    await screen.findByText("Hoạt động 90 ngày");
    for (const name of [
      "Hoạt động theo tuần",
      "Phân bố lỗi",
      "Xu hướng kết quả theo ngày",
      "Thời gian thực hành",
      "Phong cách học",
    ])
      expect(screen.getByText(name)).toBeTruthy();
    fireEvent.change(screen.getByLabelText("Khoảng thời gian"), {
      target: { value: "30" },
    });
    await waitFor(() =>
      expect(
        screen
          .getByRole("link", { name: /Xuất thống kê CSV/ })
          .getAttribute("href"),
      ).toContain("period=30"),
    );
    expect(requests.some((x) => x.path === "/analytics")).toBe(true);
  });
  it("saves code draft and records learner self-report", async () => {
    mount("/code/1");
    const editor = await screen.findByLabelText("Trình soạn thảo code");
    fireEvent.change(editor, { target: { value: "print(5)" } });
    fireEvent.click(screen.getByLabelText("Lưu bản nháp"));
    await waitFor(() =>
      expect(
        requests.some(
          (x) => x.path === "/exercises/1/draft" && x.body.code === "print(5)",
        ),
      ).toBe(true),
    );
    await waitFor(() =>
      expect(screen.getByRole("button", { name: /Tiêu cực/ }).disabled).toBe(
        false,
      ),
    );
    fireEvent.click(screen.getByRole("button", { name: /Tiêu cực/ }));
    expect(
      await screen.findByText(
        "Bạn có muốn nghỉ ngắn 2 phút?",
      ),
    ).toBeTruthy();
  });
  it("opens teacher lesson editor including video and quiz fields", async () => {
    role = "teacher";
    mount("/manage/lessons");
    await screen.findByText("Nội dung");
    fireEvent.click(screen.getAllByRole("button", { name: /Chỉnh sửa/ })[0]);
    expect(await screen.findByRole("heading", {name:"Video bài giảng"})).toBeTruthy();
    expect(screen.getByText("Phụ đề tiếng Việt")).toBeTruthy();
    expect(screen.getByText("Câu hỏi kiểm tra nhanh")).toBeTruthy();
  });
  it("blocks management views for learners", async () => {
    mount("/admin/users");
    expect(await screen.findByText("Bạn chưa có quyền truy cập")).toBeTruthy();
    expect(requests.some((x) => x.path === "/admin/users")).toBe(false);
  });
  it("loads admin account roles from the backend", async () => {
    role = "admin";
    mount("/admin/users");
    expect(await screen.findByText("Quản lý tài khoản")).toBeTruthy();
    expect(await screen.findByText("teacher@smartcode.local")).toBeTruthy();
    expect(
      screen.getByLabelText("Vai trò của Giảng viên Minh Anh"),
    ).toBeTruthy();
  });
});

describe('Reference-pack flows',()=>{
  it('requests password reset without disclosing account existence',async()=>{
    role='guest';mount('/forgot-password');await screen.findByText('Khôi phục mật khẩu');
    fireEvent.change(screen.getByLabelText('Email đã đăng ký'),{target:{value:'learner@smartcode.local'}});
    fireEvent.click(screen.getByRole('button',{name:'Gửi liên kết khôi phục'}));
    await screen.findByText('Kiểm tra hộp thư của bạn');
    expect(requests.find(x=>x.path==='/auth/forgot-password').body).toEqual({email:'learner@smartcode.local'});
  });
  it('completes all seven survey steps and persists answers',async()=>{
    mount('/survey/1');const questions=fixtures.learner['/courses/1/survey'].questions;
    for(const q of questions){await screen.findByText(q.title);fireEvent.click(screen.getByRole('button',{name:'A '+q.options[0]}));fireEvent.click(screen.getByRole('button',{name:/Tiếp tục/}))}
    await waitFor(()=>expect(requests.find(x=>x.path==='/courses/1/survey'&&x.method==='PUT')?.body.answers).toEqual([0,0,0,0,0,0,0]));
    await screen.findByText('Đánh giá đầu vào');
  });
  it('keeps assessment drafts scoped and disables hints',async()=>{
    mount('/assessment/1');const editor=await screen.findByLabelText('Trình soạn thảo code');
    expect(screen.getByRole('button',{name:'Gợi ý đã tắt trong đánh giá'}).disabled).toBe(true);
    fireEvent.change(editor,{target:{value:'assessment solution'}});fireEvent.click(screen.getByLabelText('Lưu bản nháp'));
    await waitFor(()=>expect(requests.some(x=>x.path==='/exercises/1/draft'&&x.body?.assessment_id===1&&x.body.code==='assessment solution')).toBe(true));
  });
  it('carries session context into code drafts',async()=>{
    mount('/code/1?session=1');const editor=await screen.findByLabelText('Trình soạn thảo code');
    fireEvent.change(editor,{target:{value:'classroom solution'}});fireEvent.click(screen.getByLabelText('Lưu bản nháp'));
    await waitFor(()=>expect(requests.some(x=>x.path==='/exercises/1/draft'&&x.body?.session_id===1)).toBe(true));
  });
  it('saves a learner-authored emotion diary note',async()=>{
    mount('/emotions');await screen.findByText('Diễn biến cảm xúc');fireEvent.click(screen.getByRole('button',{name:'Thêm ghi nhận'}));
    fireEvent.change(screen.getByLabelText('Cảm nhận'),{target:{value:'positive'}});
    fireEvent.change(screen.getByLabelText('Ghi nhận của bạn'),{target:{value:'Đã hiểu bài vòng lặp.'}});
    fireEvent.click(screen.getByRole('button',{name:'Lưu ghi nhận'}));
    await waitFor(()=>expect(requests.find(x=>x.path==='/emotions'&&x.method==='POST')?.body).toEqual({state:'positive',body:'Đã hiểu bài vòng lặp.'}));
  });
  it('assigns exercise groups for a single classroom session',async()=>{
    role='teacher';mount('/manage/classes/1/sessions/1');await screen.findByText('Cơ bản (Easy)');
    fireEvent.click(screen.getByRole('button',{name:'Gán bài tập'}));await screen.findByText('Gán bài tập vào buổi học');
    fireEvent.click(screen.getByRole('button',{name:/^Gán \d+ bài tập$/}));
    await waitFor(()=>expect(requests.some(x=>x.path==='/classes/1/sessions/1/groups'&&x.method==='PUT'&&x.body.groups.easy)).toBe(true));
  });
  it('saves a private teacher comment for the correct student',async()=>{
    role='teacher';mount('/manage/classes/1/students/1');await screen.findByText('Tiến độ học viên Nguyễn Văn A');
    fireEvent.change(screen.getByLabelText('Nhận xét của giảng viên'),{target:{value:'Ôn lại điều kiện.'}});
    fireEvent.click(screen.getByRole('button',{name:'Lưu nhận xét'}));
    await waitFor(()=>expect(requests.find(x=>x.path==='/classes/1/students/1/comment')?.body).toEqual({body:'Ôn lại điều kiện.'}));
  });
  it('saves a lesson draft without publishing live content',async()=>{
    role='teacher';mount('/manage/lessons');await screen.findByText('Nội dung');
    fireEvent.click(screen.getAllByRole('button',{name:/Chỉnh sửa/})[0]);await screen.findByText('Soạn bài học');
    fireEvent.change(screen.getByLabelText('Tên bài học'),{target:{value:'Bản nháp bài giảng mới'}});
    fireEvent.click(screen.getByRole('button',{name:'Lưu bản nháp'}));
    await waitFor(()=>expect(requests.some(x=>x.path==='/manage/lesson-drafts/lesson-1'&&x.method==='PUT'&&x.body.payload.form.title==='Bản nháp bài giảng mới')).toBe(true));
    expect(requests.some(x=>x.path==='/manage/lessons/1'&&x.method==='PUT')).toBe(false);
  });
  it('includes the supplemental lesson files and previous/next navigation',async()=>{
    mount('/lesson/1');await screen.findByText('Đến lượt bạn thực hành');
    expect((await screen.findByRole('link',{name:/Bài tiếp theo/})).getAttribute('href')).toBe('#/lesson/2');
    fireEvent.click(screen.getByRole('button',{name:'Code mẫu'}));
    expect(screen.getByRole('link',{name:'Tải code mẫu'}).getAttribute('download')).toMatch(/\.java$/);
  });
  it.each([
    ['learner','/roadmap/1','Danh sách chủ đề'],
    ['learner','/lesson/1/exercises','Danh sách bài tập'],
    ['learner','/skills','Bản đồ kỹ năng'],
    ['learner','/history','Lịch sử nộp bài'],
    ['learner','/assessment-result/1','Lộ trình đã sẵn sàng'],
    ['teacher','/manage/classes/1','Java Core · N09'],
    ['teacher','/manage/classes/1/sessions/1/report','Báo cáo buổi học'],
    ['teacher','/manage/classes/1/sessions/1/live','Dashboard bài tập'],
    ['teacher','/manage/media','Video bài giảng'],
    ['admin','/admin','Dịch vụ'],
  ])('renders %s route %s from backend fixtures',async(account,path,title)=>{
    role=account;mount(path);
    expect((await screen.findAllByText(title)).length).toBeGreaterThan(0);
    expect(screen.queryByText('Trang chưa hiển thị được')).toBeNull();
  });
});
