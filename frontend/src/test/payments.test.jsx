import React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor, cleanup } from "@testing-library/react";
import App from "../App";
import { SessionProvider } from "../api";

let role, methods, order, requests, course;
const response = data => ({ ok: true, status: 200, json: async () => structuredClone(data) });
function mount(path) {
  window.history.replaceState({}, "", "/#" + path);
  return render(<SessionProvider><App /></SessionProvider>);
}
beforeEach(() => {
  role = "learner"; requests = [];
  window.scrollTo = vi.fn();
  HTMLDialogElement.prototype.showModal = function () { this.open = true; };
  HTMLDialogElement.prototype.close = function () { this.open = false; };
  course = { id: 4, title: "Python vận dụng", language: "python", description: "Học xử lý dữ liệu", level: "intermediate", price: 199000, lessons_count: 3, exercises_count: 3, lessons: [], owner_id: 2 };
  methods = { default_provider: "vpbank", bank: "VPBank", bank_bin: "970432", methods: [
    { id: "vpbank", name: "QR chuyển khoản VPBank", available: true, environment: "production" },
    { id: "momo", name: "MoMo", available: false, reason: "Cổng thanh toán chưa được cấu hình.", environment: "sandbox" },
    { id: "zalopay", name: "ZaloPay", available: false, reason: "Cổng thanh toán chưa được cấu hình.", environment: "sandbox" },
  ] };
  order = { id: 10, code: "SCTEST123456", course_id: 4, course_title: course.title, amount: 199000, provider: "vpbank", environment: "production", status: "pending", created_at: "2026-10-13T00:00:00", expires_at: "2030-01-01T00:00:00", bank: { name: "VPBank", bin: "970432", account_number: "000000000001", account_name: "TEST ONLY", content: "SCTEST123456" }, qr_url: "/api/payments/10/qr.svg", user_name: "Người học", user_email: "learner@example.com", audits: [] };
  global.fetch = vi.fn(async (url, options = {}) => {
    const path = String(url).replace('/api', '').split('?')[0];
    const body = options.body ? JSON.parse(options.body) : undefined;
    requests.push({ path, method: options.method || "GET", body });
    if (path === '/auth/me') return response({ id: 1, name: "Người học", email: "learner@example.com", role });
    if (path === '/payments/options') return response(methods);
    if (path === '/courses/4') return response(course);
    if (path === '/my/courses' || path === '/courses') return response([course]);
    if (path === '/analytics') return response({ streak: 0 });
    if (path === '/payments' && options.method === 'POST') return response(order);
    if (path === '/payments/10/report-transfer') { order = { ...order, status: "awaiting_review", qr_url: "", customer_note: body.note }; return response(order); }
    if (path === '/payments/10' || path === '/payments/10/refresh') return response(order);
    if (path === '/payments/mine' || path === '/billing/admin/orders') return response([order]);
    if (path === '/billing/admin/settings') return response({ ...methods, account_number: "000000000001", account_name: "TEST ONLY", enabled: true, mode: "sandbox", public_url: "" });
    if (path === '/billing/admin/orders/10/review') { order = { ...order, status: "paid" }; return response(order); }
    return response([]);
  });
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); });

describe("Course checkout and payment administration", () => {
  it("defaults to VPBank and sends course identity, not a client-controlled price", async () => {
    mount('/checkout/4');
    const bank = await screen.findByRole('radio', { name: /QR chuyển khoản VPBank/ });
    expect(bank.checked).toBe(true);
    expect(screen.queryByText('Vietcombank')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: /Tiếp tục thanh toán/ }));
    await waitFor(() => expect(requests.some(x => x.path === '/payments' && x.method === 'POST')).toBe(true));
    const sent = requests.find(x => x.path === '/payments' && x.method === 'POST').body;
    expect(sent).toMatchObject({ course_id: 4, provider: 'vpbank' });
    expect(sent.idempotency_key).toBeTruthy(); expect(sent.amount).toBeUndefined();
    await waitFor(() => expect(location.hash).toBe('#/payments/10'));
  });
  it("does not submit a payment method that has not been configured", async () => {
    mount('/checkout/4');
    fireEvent.click(await screen.findByRole('radio', { name: /MoMo/ }));
    expect(screen.getByRole('button', { name: /Tiếp tục thanh toán/ }).disabled).toBe(true);
    expect(requests.filter(x => x.method === 'POST')).toHaveLength(0);
  });
  it("free basic courses do not expose a paid checkout", async () => {
    course = { ...course, level: 'basic', price: 0 };
    mount('/checkout/4');
    expect(await screen.findByText('Khóa học này hoàn toàn miễn phí')).toBeTruthy();
    expect(screen.queryByRole('button', { name: /Tiếp tục thanh toán/ })).toBeNull();
  });
  it("reports a transfer for review without displaying a paid result", async () => {
    mount('/payments/10');
    expect(await screen.findByAltText(/Mã QR thanh toán VPBank/)).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: /Tôi đã chuyển khoản/ }));
    fireEvent.change(screen.getByLabelText(/Mã giao dịch \/ ghi chú/), { target: { value: 'REF-123' } });
    fireEvent.click(screen.getByRole('button', { name: 'Gửi thông báo' }));
    expect(await screen.findByText('Đã gửi thông báo chuyển khoản', { selector: 'h3' })).toBeTruthy();
    expect(screen.queryByText('Khóa học đã sẵn sàng!')).toBeNull();
    expect(screen.queryByRole('button', { name: /Vào học ngay/ })).toBeNull();
    expect(requests.some(x => x.path.endsWith('confirm-demo'))).toBe(false);
  });
  it("opens learning only when the server reports payment success", async () => {
    order = { ...order, status: 'paid', paid_at: '2026-10-13T00:05:00', qr_url: '' };
    mount('/payments/10');
    expect(await screen.findByText('Khóa học đã sẵn sàng!')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: /Vào học ngay/ }));
    expect(location.hash).toBe('#/roadmap/4');
  });
  it("shows payment history with a link back to the order", async () => {
    mount('/payments');
    expect(await screen.findByRole('link', { name: /Xem đơn hàng/ })).toHaveProperty('hash', '#/payments/10');
  });
  it("requires bank evidence and the exact amount before admin approval", async () => {
    role = 'admin'; order.status = 'awaiting_review';
    mount('/admin/payments');
    fireEvent.click(await screen.findByRole('button', { name: 'Đối soát' }));
    const approve = screen.getByRole('button', { name: 'Xác nhận và mở khóa học' });
    expect(approve.disabled).toBe(true);
    fireEvent.change(screen.getByLabelText('Số tiền thực nhận (VND)'), { target: { value: '1' } });
    fireEvent.change(screen.getByLabelText('Mã giao dịch VPBank'), { target: { value: 'VPBREF123' } });
    fireEvent.click(screen.getByRole('checkbox', { name: /Tôi đã kiểm tra tiền thực nhận/ }));
    expect(approve.disabled).toBe(true);
    fireEvent.change(screen.getByLabelText('Số tiền thực nhận (VND)'), { target: { value: '199000' } });
    expect(approve.disabled).toBe(false);
    fireEvent.click(approve);
    await waitFor(() => expect(requests.find(x => x.path === '/billing/admin/orders/10/review')?.body).toMatchObject({ action: 'approve', amount_received: 199000, confirmed_in_bank: true, transaction_id: 'VPBREF123' }));
  });
});
