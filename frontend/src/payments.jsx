import React, { useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, BookOpen, CheckCircle2, Clock, Copy, Download, ExternalLink, Landmark, LockKeyhole, QrCode, RefreshCw, Settings2, ShieldCheck, Wallet } from "lucide-react";
import { api, post, useData, useAction, useSession, go, money, dateTime } from "./api";
import { Badge, Breadcrumb, Button, Card, DataState, Empty, Field, Link, Modal, PageTitle, Stat } from "./ui";

export const LEVEL_NAMES = { basic: "Cơ bản", intermediate: "Vận dụng", advanced: "Nâng cao" };
const PROVIDERS = { vpbank: "VPBank", momo: "MoMo", zalopay: "ZaloPay" };
const STATUS = {
  creating: ["Đang khởi tạo", "orange"], pending: ["Chờ thanh toán", "orange"],
  awaiting_review: ["Chờ đối soát", "purple"], paid: ["Đã thanh toán", "green"],
  failed: ["Không thành công", "red"], expired: ["Hết hạn QR", "gray"],
  cancelled: ["Đã hủy", "gray"], rejected: ["Chưa được xác nhận", "red"],
};
const active = p => ["pending", "creating", "awaiting_review"].includes(p?.status);
function PaymentStatus({ value }) {
  const [label, tone] = STATUS[value] || [value, "gray"];
  return <Badge tone={tone}>{label}</Badge>;
}
function SandboxNote({ order }) {
  return order.environment === "sandbox" ? <div className="billing-notice sandbox" role="note">Môi trường thử nghiệm {PROVIDERS[order.provider]}. Dùng tài khoản/app thử nghiệm của cổng thanh toán; giao dịch này không được tính vào doanh thu thật.</div> : null;
}

export function CheckoutPage({ id }) {
  const course = useData("/courses/" + id), methods = useData("/payments/options");
  const [selected, setSelected] = useState("vpbank");
  const [busy, run] = useAction();
  const key = useRef(null);
  if (!key.current) key.current = crypto.randomUUID();
  return <div className="page-container billing-page">
    <Breadcrumb items={[{ to: "/courses", label: "Khóa học" }, { to: "/courses/" + id, label: "Chi tiết khóa học" }, { label: "Thanh toán" }]} />
    <PageTitle eyebrow="ĐẦU TƯ CHO BƯỚC TIẾN TIẾP THEO" title="Mở khóa hành trình của bạn" description="Chọn phương thức thanh toán phù hợp. Tiến độ học được lưu trong tài khoản hiện tại." />
    <DataState resource={course}>{c => c.level === "basic" ? <Empty title="Khóa học này hoàn toàn miễn phí" action={<Link className="btn primary" to={"/courses/" + id}>Vào học ngay</Link>} /> :
      <div className="billing-grid">
        <div><Card><div className="section-heading"><h2>Phương thức thanh toán</h2><ShieldCheck size={22} /></div>
          <DataState resource={methods}>{data => <>
            <fieldset className="payment-methods"><legend className="sr-only">Chọn phương thức thanh toán</legend>{data.methods.map(m => <label key={m.id} className={"payment-method " + (selected === m.id ? "selected " : "") + (!m.available ? "unavailable" : "")}>
              <input type="radio" name="payment-method" value={m.id} checked={selected === m.id} onChange={() => setSelected(m.id)} />
              <span className={"provider-mark " + m.id}>{m.id === "vpbank" ? <QrCode /> : m.id === "momo" ? "M" : "Z"}</span>
              <span className="method-copy"><strong>{m.name}</strong><small>{m.available ? m.id === "vpbank" ? "Quét QR · Ngân hàng nhận tiền VPBank" : "Thanh toán trên cổng " + m.name : m.reason}</small></span>
              {m.id === "vpbank" ? <Badge tone="green">Mặc định</Badge> : m.environment === "sandbox" && <Badge tone="orange">Thử nghiệm</Badge>}
            </label>)}</fieldset>
            <div className="billing-notice">{selected === "vpbank" ? "Sau khi chuyển khoản, gửi thông báo trên trang đơn hàng. Quản trị viên kiểm tra giao dịch VPBank rồi mở khóa học cho bạn." : "Khóa học được mở sau khi hệ thống xác minh thanh toán với cổng. Bạn có thể theo dõi kết quả trong Lịch sử thanh toán."}</div>
            {selected !== "vpbank" && data.methods.find(m => m.id === selected)?.environment === "sandbox" && <SandboxNote order={{ provider: selected, environment: "sandbox" }} />}
            <Button className="full" busy={busy} disabled={!data.methods.find(m => m.id === selected)?.available} onClick={() => run(async () => {
              const p = await post("/payments", { course_id: id, provider: selected, idempotency_key: key.current });
              go("/payments/" + p.id);
            })}>Tiếp tục thanh toán <ArrowRight size={18} /></Button>
          </>}</DataState>
        </Card><Link className="text-link billing-back" to={"/courses/" + id}><ArrowLeft size={16} /> Quay lại khóa học</Link></div>
        <Card className="order-summary"><span className="mini-icon purple"><BookOpen /></span><Badge tone="purple">{LEVEL_NAMES[c.level]}</Badge><h2>{c.title}</h2>
          <p>{c.lessons_count} bài lý thuyết · {c.exercises_count} bài thực hành</p><ul className="purchase-benefits"><li><CheckCircle2 size={17} /> Học liệu theo lộ trình</li><li><CheckCircle2 size={17} /> Thực hành và theo dõi tiến độ</li><li><CheckCircle2 size={17} /> Lưu quyền học trên tài khoản</li></ul>
          <div className="order-total"><span>Tổng thanh toán</span><strong>{money(c.price)}</strong></div><small>Thanh toán một lần cho khóa học này.</small>
          <Link to="/payments" className="text-link">Lịch sử thanh toán <ArrowRight size={15} /></Link>
        </Card>
      </div>
    }</DataState>
  </div>;
}

function BankDetails({ order }) {
  const [busy, run] = useAction();
  const rows = [["Ngân hàng", "VPBank"], ["Số tài khoản", order.bank.account_number], ["Người thụ hưởng", order.bank.account_name], ["Số tiền", money(order.amount)], ["Nội dung chuyển khoản", order.bank.content]];
  return <dl className="transfer-details">{rows.map(([label, value]) => <div key={label}><dt>{label}</dt><dd><strong>{value}</strong>{["Số tài khoản", "Nội dung chuyển khoản"].includes(label) && <Button variant="ghost" busy={busy} aria-label={"Sao chép " + label.toLowerCase()} onClick={() => run(() => navigator.clipboard.writeText(value), "Đã sao chép.")}><Copy size={16} /></Button>}</dd></div>)}</dl>;
}

export function PaymentPage({ id }) {
  const r = useData("/payments/" + id, { background: true });
  const [busy, run] = useAction(), [dialog, setDialog] = useState(""), [note, setNote] = useState(""), [notPaid, setNotPaid] = useState(false);
  const [checkMessage, setCheckMessage] = useState("");
  const p = r.data;
  useEffect(() => {
    if (!active(p)) return;
    const timer = setInterval(r.reload, 7000);
    return () => clearInterval(timer);
  }, [p?.status, r.reload]);
  useEffect(() => {
    if (!p || p.provider === "vpbank" || !active(p)) return;
    let cancelled = false;
    const check = async () => {
      try { await post(`/payments/${id}/refresh`); if (!cancelled) { setCheckMessage(""); r.reload(); } }
      catch (e) { if (!cancelled) setCheckMessage(e.message); }
    };
    check();
    const timer = setInterval(check, 65000);
    return () => { cancelled = true; clearInterval(timer); };
  }, [id, p?.provider, p?.status]);
  return <div className="page-container billing-page"><Breadcrumb items={[{ to: "/payments", label: "Lịch sử thanh toán" }, { label: "Đơn hàng" }]} />
    <DataState resource={r}>{order => <>
      <PageTitle eyebrow={order.code} title={order.status === "paid" ? "Khóa học đã sẵn sàng!" : "Hoàn tất đăng ký khóa học"} description={order.course_title}><PaymentStatus value={order.status} /></PageTitle>
      <SandboxNote order={order} />
      {order.status === "paid" ? <Card className="payment-success"><span className="success-circle"><CheckCircle2 size={42} /></span><h2>Bắt đầu bước tiến mới</h2><p>Quyền học đã được thêm vào tài khoản của bạn.</p><Button onClick={() => go("/roadmap/" + order.course_id)}>Vào học ngay <ArrowRight size={18} /></Button><small>{money(order.amount)} · {PROVIDERS[order.provider]} · {dateTime(order.paid_at)}</small></Card> :
        <div className="billing-grid"><Card className="payment-panel">
          {order.provider === "vpbank" ? <>
            <div className="section-heading"><h2>Chuyển khoản VPBank</h2><Landmark size={22} /></div>
            {order.qr_url ? <><div className="qr-frame"><img src={order.qr_url} alt={"Mã QR thanh toán VPBank cho đơn " + order.code} width="280" height="280" /><span><QrCode size={16} /> QUÉT BẰNG ỨNG DỤNG NGÂN HÀNG</span></div>
              <a className="text-link qr-download" href={order.qr_url + "?download=true"} download><Download size={16} /> Tải mã QR</a><p className="qr-expiry"><Clock size={16} /> Hạn chuyển khoản: {dateTime(order.expires_at)}</p></> :
              <div className="payment-wait"><Clock size={36} /><h3>{order.status === "awaiting_review" ? "Đã gửi thông báo chuyển khoản" : "Mã QR không còn hiển thị"}</h3><p>{order.status === "awaiting_review" ? "Quản trị viên sẽ đối chiếu số tiền và nội dung giao dịch. Trang này tự cập nhật khi được xác nhận." : "Kiểm tra trạng thái bên dưới. Nếu đã chuyển tiền, liên hệ quản trị viên kèm mã đơn hàng."}</p></div>}
            <BankDetails order={order} />
            <div className="billing-notice">Kiểm tra tên người thụ hưởng trên ứng dụng ngân hàng. Chuyển đúng số tiền và giữ nguyên nội dung {order.bank.content} để đối soát.</div>
            {["pending", "expired"].includes(order.status) && <><Button className="full" onClick={() => setDialog("report")}>Tôi đã chuyển khoản <CheckCircle2 size={17} /></Button><Button className="full" variant="ghost" onClick={() => { setNotPaid(false); setDialog("cancel"); }}>Hủy đơn chưa chuyển khoản</Button></>}
          </> : <>
            <div className={"wallet-hero " + order.provider}><Wallet size={40} /><h2>Thanh toán qua {PROVIDERS[order.provider]}</h2><strong>{money(order.amount)}</strong></div>
            <p>Hoàn tất giao dịch trên cổng {PROVIDERS[order.provider]}. Sau khi quay lại, hệ thống sẽ kiểm tra và cập nhật quyền học.</p>
            {order.pay_url ? <a className="btn primary full" href={order.pay_url}>Mở {PROVIDERS[order.provider]} <ExternalLink size={17} /></a> : <div className="billing-notice">{order.status === "creating" ? "Đang xác minh yêu cầu khởi tạo. Không cần tạo hoặc thanh toán thêm đơn mới." : order.payment_window_expired && active(order) ? "Đã qua thời gian thanh toán dự kiến. Hệ thống đang đối chiếu với cổng; nếu bạn đã trả tiền, hãy giữ mã đơn hàng." : "Liên kết thanh toán không còn khả dụng."}</div>}
          </>}
          {order.review_note && <p className="billing-notice">{order.review_note}</p>}
          {checkMessage && <p role="status" className="billing-notice">{checkMessage}</p>}
          <Button variant="secondary" busy={busy} className="full mt16" onClick={() => run(async () => { if (order.provider !== "vpbank") await post(`/payments/${id}/refresh`); r.reload(); })}><RefreshCw size={17} /> Kiểm tra trạng thái</Button>
          {["failed", "expired", "cancelled", "rejected"].includes(order.status) && <Link className="btn secondary full mt16" to={"/checkout/" + order.course_id}>Quay lại đăng ký khóa học</Link>}
        </Card><Card className="order-summary"><Badge tone="purple">THÔNG TIN ĐƠN HÀNG</Badge><h2>{order.course_title}</h2><div className="order-total"><span>Tổng thanh toán</span><strong>{money(order.amount)}</strong></div><dl className="transfer-details"><div><dt>Phương thức</dt><dd>{PROVIDERS[order.provider]}</dd></div><div><dt>Ngày tạo</dt><dd>{dateTime(order.created_at)}</dd></div><div><dt>Trạng thái</dt><dd><PaymentStatus value={order.status} /></dd></div></dl><p className="row"><LockKeyhole size={18} /> Quyền học mở sau khi xác nhận thanh toán.</p><Link className="text-link" to="/payments">Xem tất cả đơn hàng <ArrowRight size={16} /></Link></Card></div>}
      {dialog && <Modal title={dialog === "report" ? "Thông báo đã chuyển khoản" : "Hủy đơn hàng này?"} onClose={() => !busy && setDialog("")}>
        {dialog === "report" ? <><p>Thông báo này gửi tới quản trị viên để kiểm tra tài khoản VPBank. Khóa học sẽ mở sau khi giao dịch được đối chiếu.</p><Field label="Mã giao dịch / ghi chú (nếu có)"><textarea rows={3} maxLength={500} value={note} onChange={e => setNote(e.target.value)} /></Field><Button busy={busy} className="full" onClick={() => run(async () => { await post(`/payments/${id}/report-transfer`, { note }); setDialog(""); r.reload(); }, "Đã gửi thông báo chuyển khoản.")}>Gửi thông báo</Button></> : <><p>Nếu đã chuyển tiền, hãy gửi thông báo chuyển khoản để được đối soát. Hủy đơn không hoàn lại tiền đã chuyển.</p><label className="billing-checkbox"><input type="checkbox" checked={notPaid} onChange={e => setNotPaid(e.target.checked)} /> Tôi chưa chuyển khoản cho đơn này.</label><Button busy={busy} disabled={!notPaid} onClick={() => run(async () => { await post(`/payments/${id}/cancel`); setDialog(""); r.reload(); })}>Xác nhận hủy đơn</Button></>}
      </Modal>}
    </>}</DataState>
  </div>;
}

export function PaymentHistory() {
  const r = useData("/payments/mine");
  return <div className="page-container billing-page"><PageTitle eyebrow="TÀI KHOẢN CỦA BẠN" title="Lịch sử thanh toán" description="Theo dõi đơn hàng và mở lại thông tin thanh toán khi cần."><Link to="/courses" className="btn primary">Khám phá khóa học <ArrowRight size={16} /></Link></PageTitle><DataState resource={r}>{orders => orders.length ? <div className="payment-history">{orders.map(p => <Card key={p.id}><div className="history-order-heading"><div><small>{p.code} · {dateTime(p.created_at)}</small><h3>{p.course_title}</h3></div><PaymentStatus value={p.status} /></div><div className="row between wrap"><span>{PROVIDERS[p.provider]} {p.environment === "sandbox" && <Badge tone="orange">Thử nghiệm</Badge>}</span><strong>{money(p.amount)}</strong><Link className="btn secondary" to={"/payments/" + p.id}>{p.status === "paid" ? "Xem kết quả" : "Xem đơn hàng"} <ArrowRight size={16} /></Link></div></Card>)}</div> : <Empty title="Bạn chưa có đơn thanh toán">Các khóa Cơ bản được học miễn phí. Đơn mua khóa Vận dụng và Nâng cao sẽ xuất hiện ở đây.</Empty>}</DataState></div>;
}

export function AdminPayments() {
  const orders = useData("/billing/admin/orders"), config = useData("/billing/admin/settings"), legacy = useData("/admin/payments");
  const [bank, setBank] = useState(null), [showSettings, setShowSettings] = useState(false), [filter, setFilter] = useState("all"), [search, setSearch] = useState("");
  const [review, setReview] = useState(null), [amount, setAmount] = useState(""), [reference, setReference] = useState(""), [note, setNote] = useState(""), [verified, setVerified] = useState(false);
  const [busy, run] = useAction();
  useEffect(() => { if (config.data) setBank({ account_number: config.data.account_number, account_name: config.data.account_name, enabled: config.data.enabled }); }, [config.data]);
  const openReview = p => { setReview(p); setAmount(""); setReference(""); setNote(""); setVerified(false); };
  const submitReview = action => run(async () => {
    await post(`/billing/admin/orders/${review.id}/review`, { action, amount_received: Number(amount || 0), transaction_id: reference, note, confirmed_in_bank: verified });
    setReview(null); orders.reload();
  }, action === "approve" ? "Đã xác nhận và mở khóa học." : "Đã lưu kết quả đối soát.");
  return <div className="page-container billing-page admin-billing"><PageTitle eyebrow="SMARTCODE ADMIN" title="Thanh toán & đối soát" description="Quản lý đơn mua khóa học, kiểm tra chuyển khoản VPBank và trạng thái ví điện tử."><Button variant="secondary" onClick={() => setShowSettings(!showSettings)}><Settings2 size={17} /> Cấu hình thanh toán</Button></PageTitle>
    <DataState resource={config}>{c => <>
      <div className="payment-config-strip">{c.methods.map(m => <span key={m.id}><span className={"connection-dot " + (m.available ? "ready" : "")} />{PROVIDERS[m.id]}<small>{m.available ? m.environment === "sandbox" ? "Thử nghiệm" : "Đã cấu hình" : "Chưa cấu hình"}</small></span>)}</div>
      {!c.methods[0].available && <div className="billing-notice">Nhập tài khoản nhận tiền tại VPBank trong Cấu hình thanh toán để tạo mã QR.</div>}
      {(showSettings || !c.methods[0].available) && bank && <Card className="bank-settings"><h2><Landmark size={22} /> Tài khoản VPBank nhận tiền</h2><p>Ngân hàng cố định là VPBank. Thay đổi áp dụng cho đơn mới; đơn đã tạo giữ nguyên người thụ hưởng.</p><form onSubmit={e => { e.preventDefault(); run(async () => { await api("/billing/admin/settings", { method: "PUT", body: bank }); config.reload(); }, "Đã lưu cấu hình VPBank."); }}>
        <div className="grid two"><Field label="Số tài khoản VPBank"><input inputMode="numeric" pattern="[0-9]{6,19}" maxLength={19} required={bank.enabled} value={bank.account_number} onChange={e => setBank({ ...bank, account_number: e.target.value })} /></Field><Field label="Tên người thụ hưởng"><input maxLength={100} required={bank.enabled} value={bank.account_name} onChange={e => setBank({ ...bank, account_name: e.target.value })} /></Field></div>
        <label className="billing-checkbox"><input type="checkbox" checked={bank.enabled} onChange={e => setBank({ ...bank, enabled: e.target.checked })} /> Bật thanh toán QR VPBank</label><Button type="submit" busy={busy}>Lưu tài khoản nhận tiền</Button>
      </form><div className="billing-notice">MoMo/ZaloPay: nhập thông tin đối tác và khóa bí mật trong backend/.env theo HUONG_DAN_THANH_TOAN.md. Môi trường ví: <strong>{c.mode}</strong>. Địa chỉ nhận kết quả: <strong>{c.public_url || "Chưa cấu hình HTTPS công khai"}</strong>.</div></Card>}
    </>}</DataState>
    <DataState resource={orders}>{data => { const paid = data.filter(x => x.status === "paid" && x.environment === "production"); const shown = data.filter(p => (filter === "all" || p.status === filter) && [p.code, p.course_title, p.user_email, p.user_name].join(" ").toLowerCase().includes(search.toLowerCase())); return <>
      <div className="grid three mt24"><Stat label="Tiền đã xác nhận" value={money(paid.reduce((n, x) => n + x.amount, 0))} icon={Wallet} tone="green" /><Stat label="Chờ đối soát VPBank" value={data.filter(p => p.status === "awaiting_review").length} icon={Clock} tone="orange" /><Stat label="Đơn hàng" value={data.length} icon={BookOpen} /></div>
      <small>Thống kê tối đa 1.000 đơn gần nhất. Không cộng giao dịch sandbox hoặc demo cũ vào tiền đã xác nhận.</small>
      <div className="filter-bar mt24"><input aria-label="Tìm đơn hàng" placeholder="Mã đơn, khóa học, tên hoặc email…" value={search} onChange={e => setSearch(e.target.value)} /><select aria-label="Trạng thái đơn hàng" value={filter} onChange={e => setFilter(e.target.value)}><option value="all">Tất cả trạng thái</option>{Object.entries(STATUS).map(([key, value]) => <option value={key} key={key}>{value[0]}</option>)}</select><Button variant="secondary" onClick={orders.reload}><RefreshCw size={16} /> Tải lại</Button></div>
      {shown.length ? <Card className="table-card"><div className="table-wrap"><table><thead><tr><th>Đơn / Học viên</th><th>Khóa học</th><th>Thanh toán</th><th>Trạng thái</th><th>Thao tác</th></tr></thead><tbody>{shown.map(p => <tr key={p.id}><td><b>{p.code}</b><small>{p.user_name}</small><small>{p.user_email}</small></td><td>{p.course_title}<small>{dateTime(p.created_at)}</small></td><td><b>{money(p.amount)}</b><small>{PROVIDERS[p.provider]} {p.environment === "sandbox" && "· Thử nghiệm"}</small></td><td><PaymentStatus value={p.status} /></td><td><Button variant="secondary" onClick={() => openReview(p)}>{p.provider === "vpbank" && p.status !== "paid" ? "Đối soát" : "Chi tiết"}</Button></td></tr>)}</tbody></table></div></Card> : <Empty title="Chưa có đơn hàng phù hợp" />}
    </>; }}</DataState>
    {!!legacy.data?.length && <details className="legacy-payments"><summary>Giao dịch demo cũ ({legacy.data.length}) · không tính doanh thu</summary><div className="table-wrap"><table><thead><tr><th>ID</th><th>Khóa học</th><th>Giá trị mô phỏng</th><th>Trạng thái cũ</th></tr></thead><tbody>{legacy.data.map(x => <tr key={x.id}><td>{x.id}</td><td>#{x.course_id}</td><td>{money(x.amount)}</td><td>{x.status}</td></tr>)}</tbody></table></div></details>}
    {review && <Modal wide title={"Đối soát đơn " + review.code} onClose={() => !busy && setReview(null)}>
      <div className="row between wrap"><h3>{review.course_title}</h3><PaymentStatus value={review.status} /></div><p>{review.user_name} · {review.user_email}</p><SandboxNote order={review} />
      {review.bank && <BankDetails order={review} />}<p><b>Học viên cung cấp:</b> {review.customer_note || "Chưa có ghi chú."}</p>{review.review_note && <p><b>Kết quả đối soát:</b> {review.review_note}</p>}
      {review.provider === "vpbank" && review.status !== "paid" ? <>
        <div className="billing-notice">Mở lịch sử giao dịch VPBank và đối chiếu người nhận, số tiền, nội dung {review.code}. Ghi chú của học viên chỉ là thông tin tham khảo.</div>
        <div className="grid two"><Field label="Số tiền thực nhận (VND)"><input type="number" min="0" value={amount} onChange={e => setAmount(e.target.value)} /></Field><Field label="Mã giao dịch VPBank"><input maxLength={100} value={reference} onChange={e => setReference(e.target.value)} /></Field></div>
        <Field label="Ghi chú / lý do từ chối"><textarea rows={2} maxLength={500} value={note} onChange={e => setNote(e.target.value)} /></Field>
        <label className="billing-checkbox"><input type="checkbox" checked={verified} onChange={e => setVerified(e.target.checked)} /> Tôi đã kiểm tra tiền thực nhận và nội dung giao dịch trong VPBank.</label><div className="row wrap"><Button busy={busy} disabled={!verified || Number(amount) !== review.amount || reference.trim().length < 3} onClick={() => submitReview("approve")}>Xác nhận và mở khóa học</Button><Button variant="secondary" busy={busy} disabled={note.trim().length < 5} onClick={() => submitReview("reject")}>Từ chối xác nhận</Button></div>
      </> : <p>{review.status === "paid" ? `Mã giao dịch: ${review.transaction_id} · ${dateTime(review.paid_at)}` : "Trạng thái ví điện tử được xác minh qua cổng thanh toán."}</p>}
      <details className="payment-audit"><summary>Nhật ký xử lý ({review.audits?.length || 0})</summary>{review.audits?.map(a => <p key={a.id}><small>{dateTime(a.created_at)} · {a.actor_id ? "Tài khoản #" + a.actor_id : "Hệ thống"}</small><br />{a.action} · {a.detail}</p>)}</details>
    </Modal>}
  </div>;
}
