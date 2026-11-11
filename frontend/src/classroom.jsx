import React, { useState, useEffect } from 'react';
import { Plus, ArrowRight, Users, Download, RefreshCw, Check, Eye, BookOpen, Wifi, ChevronRight, FileText } from 'lucide-react';
import { api, post, useData, useAction, go, dateTime } from './api';
import { Link, Card, Button, Badge, ProgressBar, PageTitle, Field, Modal, DataState, Status, Empty, Stat, CodeBlock } from './ui';
const LEVELS = [['easy', 'Cơ bản', 'Easy'], ['medium', 'Vận dụng', 'Medium'], ['hard', 'Nâng cao', 'Hard']];
function exportCSV(name, rows) {
  const safe = v => {
    let t = String(v ?? '');
    if (/^[=+@\-\t\r]/.test(t)) t = "'" + t;
    return '"' + t.replaceAll('"', '""') + '"';
  };
  const url = URL.createObjectURL(new Blob(['\ufeff' + rows.map(r => r.map(safe).join(',')).join('\r\n')], {
    type: 'text/csv;charset=utf-8'
  }));
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export function ClassOverview({
  id
}) {
  const rooms = useData('/classes'),
    bank = useData('/manage/exercises');
  const [setup, setSetup] = useState(false);
  const room = rooms.data?.find(x => x.id === Number(id));
  return <div className="page-container"><DataState resource={rooms}>{() => !room ? <Empty title="Không tìm thấy lớp" /> : <><PageTitle title={room.name} description={`Khóa học / ${room.name} • ${room.members_count} học viên`}><Link className="btn secondary" to={`/manage/classes/${id}/students`}>Danh sách học viên</Link><Button onClick={() => setSetup(true)}><Plus size={16} /> Thêm buổi học</Button></PageTitle><div className="session-list">{room.sessions.map((s, i) => <Card key={s.id} className="ref-session-card"><div className="row between"><div className="row"><span className="session-number">{i + 1}</span><div><h3>{s.title}</h3><p>{s.exercise_ids.length} bài thực hành • {s.status === 'open' ? 'Đang diễn ra' : 'Đã kết thúc'}</p></div></div><Link className="btn primary" to={`/manage/classes/${id}/sessions/${s.id}/live`}>Dashboard <ArrowRight size={15} /></Link></div><div className="grid three">{LEVELS.map(([k, l, en]) => <Link key={k} className={'session-level ' + k} to={`/manage/classes/${id}/sessions/${s.id}`}><b>{l} · {en}</b><small>{(s.groups?.[k] || s.exercise_ids.filter(eid => bank.data?.find(e => e.id === eid)?.difficulty === k)).length} bài tập trong nhóm</small></Link>)}</div><div className="row between mt16"><small>Hạn: {s.due_at ? s.due_at.replace('T', ' ') : 'Chưa đặt'}</small><Link to={`/manage/classes/${id}/sessions/${s.id}/report`}>Báo cáo buổi học →</Link></div></Card>)}{!room.sessions.length && <Empty title="Chưa có buổi học" action={<Button onClick={() => setSetup(true)}>Tạo buổi đầu tiên</Button>} />}</div>{setup && <SessionSetup room={room} exercises={bank.data || []} onClose={() => setSetup(false)} onSaved={s => {
          setSetup(false);
          rooms.reload();
          go(`/manage/classes/${id}/sessions/${s.id}`);
        }} />}</>}</DataState></div>;
}
function SessionSetup({
  room,
  exercises,
  onClose,
  onSaved
}) {
  const [step, setStep] = useState(0),
    [form, setForm] = useState({
      title: '',
      topic: '',
      date: '',
      due: '',
      allow_hints: true,
      ids: []
    }),
    [created, setCreated] = useState(null);
  const [busy, run] = useAction();
  const items = exercises.filter(x => x.course_id === room.course_id);
  const create = () => run(async () => {
    let s = created;
    if (!s) {
      s = await post(`/classes/${room.id}/sessions`, {
        title: form.title,
        due_at: form.due,
        allow_hints: form.allow_hints,
        exercise_ids: form.ids
      });
      setCreated(s);
    }
    await api(`/classes/${room.id}/sessions/${s.id}/groups`, {
      method: 'PUT',
      body: {
        topic: form.topic,
        teaching_date: form.date,
        groups: Object.fromEntries(LEVELS.map(([k]) => [k, form.ids.filter(id => items.find(e => e.id === id)?.difficulty === k)]))
      }
    });
    setStep(3);
    setTimeout(() => onSaved(s), 500);
  });
  return <Modal wide title="Setup nhanh buổi học" onClose={busy ? () => {} : onClose}><div className="setup-steps">{['Thông tin', 'Xác nhận', 'Đang tạo', 'Hoàn tất'].map((t, i) => <span key={t} className={(busy ? 2 : step) === i ? 'active' : ''}>{i + 1}. {t}</span>)}</div>{step === 0 ? <form onSubmit={e => {
      e.preventDefault();
      setStep(1);
    }}><Field label="TIÊU ĐỀ BUỔI HỌC *"><input required minLength={2} maxLength={200} value={form.title} onChange={e => setForm({
          ...form,
          title: e.target.value
        })} placeholder="Buổi 03 — Vòng lặp for" /></Field><div className="grid two"><Field label="CHỦ ĐỀ *"><input required maxLength={100} value={form.topic} onChange={e => setForm({
            ...form,
            topic: e.target.value
          })} placeholder="Vòng lặp (loops)" /></Field><Field label="NGÀY DẠY"><input type="date" value={form.date} onChange={e => setForm({
            ...form,
            date: e.target.value
          })} /></Field></div><Field label="HẠN HOÀN THÀNH"><input type="datetime-local" value={form.due} onChange={e => setForm({
          ...form,
          due: e.target.value
        })} /></Field><div className="notice blue"><b>LỚP HỌC</b><p>{room.name} • {room.members_count} học viên</p></div><h3>Nguồn bài tập</h3><p>Chọn bài từ ngân hàng và phân vào nhóm phù hợp.</p><div className="exercise-picker">{items.map(x => <label key={x.id} className="check-row"><input type="checkbox" checked={form.ids.includes(x.id)} onChange={e => setForm({
            ...form,
            ids: e.target.checked ? [...form.ids, x.id] : form.ids.filter(v => v !== x.id)
          })} />{x.title}<Badge tone="purple">{x.difficulty}</Badge></label>)}</div><Link className="text-link mt16" to="/manage/exercises">Biên soạn thêm bài tập trong ngân hàng →</Link><label className="check-row mt16"><input type="checkbox" checked={form.allow_hints} onChange={e => setForm({
          ...form,
          allow_hints: e.target.checked
        })} /> Cho phép sử dụng gợi ý</label><div className="modal-actions"><Button type="button" variant="secondary" onClick={onClose}>Hủy</Button><Button disabled={!form.ids.length}>Xem trước <ArrowRight size={16} /></Button></div></form> : step === 3 ? <div className="center"><Check size={48} /><h2>Đã tạo buổi học</h2></div> : <><h2>{form.title}</h2><p>{room.name} · {form.topic} · {form.date || 'Chưa đặt ngày'}</p><div className="grid three">{LEVELS.map(([k, l]) => <Card key={k}><h3>{l}</h3>{form.ids.filter(id => items.find(e => e.id === id)?.difficulty === k).map(id => <p key={id}>{items.find(e => e.id === id)?.title}</p>)}</Card>)}</div><div className="modal-actions"><Button variant="secondary" disabled={busy} onClick={() => setStep(0)}>Quay lại</Button><Button busy={busy} onClick={create}>Xác nhận tạo buổi học</Button></div></>}</Modal>;
}
export function SessionGroups({
  classId,
  id
}) {
  const r = useData(`/classes/${classId}/sessions/${id}/details`),
    bank = useData('/manage/exercises');
  const [target, setTarget] = useState(null),
    [selected, setSelected] = useState([]),
    [search, setSearch] = useState('');
  const [busy, run] = useAction();
  const open = k => {
    setTarget(k);
    setSelected(r.data?.groups[k] || []);
  };
  const save = () => run(async () => {
    const groups = {
      ...r.data.groups
    };
    for (const [k] of LEVELS) groups[k] = k === target ? selected : (groups[k] || []).filter(x => !selected.includes(x));
    await api(`/classes/${classId}/sessions/${id}/groups`, {
      method: 'PUT',
      body: {
        groups,
        topic: r.data.topic,
        teaching_date: r.data.teaching_date
      }
    });
    setTarget(null);
    r.reload();
  }, 'Đã cập nhật nhóm bài tập.');
  return <div className="page-container"><DataState resource={r}>{d => <><PageTitle title={d.title} description={`${d.classroom.name} / Buổi học / Gán bài theo mức độ`}><Button onClick={() => open('easy')}><Plus size={16} /> Gán bài tập</Button></PageTitle><div className="grid three assignment-columns">{LEVELS.map(([k, label, en]) => <Card key={k}><div className="row between"><h3>{label} ({en})</h3><Badge tone="blue">{(d.groups[k] || []).length} bài tập</Badge></div>{(d.groups[k] || []).map(eid => {
              const e = bank.data?.find(x => x.id === eid);
              return <div className="assignment-item" key={eid}><b>{e?.title || `Bài #${eid}`}</b><Badge tone="purple">{e?.skill || ''}</Badge><small>{e?.tests?.length || 0} bộ test</small><Button className="small" variant="secondary" busy={busy} onClick={() => run(async () => {
                  await api(`/classes/${classId}/sessions/${id}/groups`, {
                    method: 'PUT',
                    body: {
                      groups: {
                        ...d.groups,
                        [k]: d.groups[k].filter(x => x !== eid)
                      },
                      topic: d.topic,
                      teaching_date: d.teaching_date
                    }
                  });
                  r.reload();
                })}>Bỏ khỏi nhóm</Button></div>;
            })}<Button variant="secondary" className="full" onClick={() => open(k)}><Plus size={14} /> Thêm bài vào nhóm</Button></Card>)}</div><div className="row wrap mt24"><Link className="btn primary" to={`/manage/classes/${classId}/sessions/${id}/live`}>Mở Dashboard trực tiếp</Link><Link className="btn secondary" to={`/manage/classes/${classId}/sessions/${id}/report`}>Báo cáo buổi học</Link><Link to={`/manage/classes/${classId}`}>Về danh sách buổi</Link></div>{target && <Modal wide title="Gán bài tập vào buổi học" onClose={() => setTarget(null)}><h4>CHỌN NHÓM</h4><div className="group-pills">{LEVELS.map(([k, l, en]) => <button className={target === k ? 'active' : ''} key={k} onClick={() => open(k)}>{l} ({en})</button>)}</div><h4 className="mt24">CHỌN BÀI TỪ NGÂN HÀNG ({selected.length} ĐÃ CHỌN)</h4><input placeholder="Tìm tên bài hoặc chủ đề…" aria-label="Tìm bài tập" value={search} onChange={e => setSearch(e.target.value)} /><div className="exercise-picker mt16">{bank.data?.filter(e => e.course_id === d.classroom.course_id && `${e.title} ${e.skill}`.toLowerCase().includes(search.toLowerCase())).map(e => <label className="check-row" key={e.id}><input type="checkbox" checked={selected.includes(e.id)} onChange={v => setSelected(v.target.checked ? [...selected, e.id] : selected.filter(x => x !== e.id))} /><b>{e.title}</b><Badge tone="purple">{e.skill}</Badge></label>)}</div><div className="modal-actions"><Button variant="secondary" onClick={() => setTarget(null)}>Hủy</Button><Button busy={busy} onClick={save}>Gán {selected.length} bài tập</Button></div></Modal>}</>}</DataState></div>;
}
export function SessionReport({
  classId,
  id,
  live = false
}) {
  const r = useData(`/classes/${classId}/sessions/${id}/report`, {
    background: true
  });
  const [status, setStatus] = useState(''),
    [exercise, setExercise] = useState(''),
    [detail, setDetail] = useState(null),
    [comment, setComment] = useState('');
  const [busy, run] = useAction();
  useEffect(() => {
    if (r.data) setComment(r.data.summary_note || '');
  }, [r.data?.session.id]);
  useEffect(() => {
    if (!live) return;
    const t = setInterval(() => {
      if (document.visibilityState === 'visible') r.reload();
    }, 3000);
    return () => clearInterval(t);
  }, [id, live]);
  return <div className="page-container"><DataState resource={r}>{d => {
        const rows = d.submissions.filter(s => (!status || s.status === status) && (!exercise || s.exercise_id === Number(exercise)));
        return <><PageTitle title={live ? 'Dashboard bài tập' : 'Báo cáo buổi học'} description={d.session.title}><Badge tone={d.session.status === 'open' ? 'green' : 'blue'}>{d.session.status === 'open' ? 'Đang trực tiếp' : 'Đã kết thúc'}</Badge>{live ? <Button busy={busy} onClick={() => run(async () => {
              await api(`/classes/${classId}/sessions/${id}`, {
                method: 'PATCH',
                body: {
                  status: d.session.status === 'open' ? 'closed' : 'open'
                }
              });
              r.reload();
            })}>{d.session.status === 'open' ? 'Kết thúc' : 'Mở lại buổi học'}</Button> : <Button variant="secondary" onClick={() => exportCSV('bao-cao-buoi-' + id + '.csv', [['Học viên', 'Bài tập', 'Kết quả', 'Test đạt', 'Tổng test', 'Thời gian'], ...rows.map(s => [s.student_name, s.exercise_title, s.status, s.passed, s.total, dateTime(s.created_at)])])}><Download size={16} /> Xuất báo cáo CSV</Button>}</PageTitle><div className="grid four"><Stat label={live ? 'Tổng sinh viên' : 'Đã tham gia'} value={live ? d.students.length : `${d.attended} / ${d.students.length}`} tone="blue" /><Stat label={live ? 'Đã tham gia' : 'Hoàn thành toàn bộ'} value={live ? d.attended : d.completed} tone="green" /><Stat label={live ? 'Chưa tham gia' : 'Cần hỗ trợ'} value={live ? d.students.length - d.attended : d.students.filter(s => s.group === 'Cần hỗ trợ').length} tone="orange" /><Stat label="Điểm trung bình" value={d.average} tone="purple" /></div><Card className="class-summary mt24"><div className="row between"><h3>Tóm tắt buổi học</h3><Button className="small" variant="secondary" onClick={r.reload}><RefreshCw size={14} /> Cập nhật</Button></div><Badge tone="purple">{live ? '● LIVE · ' : ' '}TỪ KẾT QUẢ BÀI NỘP</Badge><h4 className="mt16">1. TỔNG QUAN</h4><p>{d.summary}</p><h4>2. ĐIỂM MẠNH</h4><p>{d.completed ? `${d.completed} học viên đã hoàn thành toàn bộ bài được giao.` : 'Cần thêm bài nộp để nhận xét kết quả hoàn thành.'}</p><h4>3. NỘI DUNG CẦN HỖ TRỢ</h4><p>{d.submissions.some(s => s.status !== 'AC') ? 'Xem các bài chưa đạt trong bảng phía dưới và hướng dẫn học viên kiểm tra từng trường hợp thử.' : 'Chưa ghi nhận bài nộp lỗi trong buổi học.'}</p>{!live && <><Field label="Nhận xét của giảng viên"><textarea rows={3} value={comment} onChange={e => setComment(e.target.value)} maxLength={5000} /></Field><Button busy={busy} onClick={() => run(() => api(`/classes/${classId}/sessions/${id}/summary`, {
                method: 'PUT',
                body: {
                  body: comment
                }
              }), 'Đã lưu nhận xét buổi học.')}>Lưu nhận xét</Button></>}</Card><Card className="table-card mt24"><div className="table-toolbar"><h3>{live ? 'Hoạt động của học viên' : 'Chi tiết bài nộp'}</h3><div className="row wrap"><select aria-label="Lọc kết quả" value={status} onChange={e => setStatus(e.target.value)}><option value="">Tất cả kết quả</option>{['AC', 'WA', 'CE', 'RE', 'TLE'].map(s => <option key={s}>{s}</option>)}</select><select aria-label="Lọc theo bài" value={exercise} onChange={e => setExercise(e.target.value)}><option value="">Lọc theo bài</option>{d.exercises.map(e => <option key={e.id} value={e.id}>{e.title}</option>)}</select></div></div><div className="table-wrap"><table><thead><tr><th>Học viên</th><th>Bài tập</th><th>Kết quả</th><th>Test</th><th>Thời gian</th><th /></tr></thead><tbody>{rows.map(s => <tr key={s.id}><td><Link to={`/manage/classes/${classId}/students/${s.user_id}`}>{s.student_name}</Link></td><td>{s.exercise_title}</td><td><Status value={s.status} /></td><td>{s.passed}/{s.total}</td><td>{dateTime(s.created_at)}</td><td><Button variant="secondary" className="small" onClick={() => run(async () => setDetail(await api('/submissions/' + s.id)))}>Chi tiết</Button></td></tr>)}</tbody></table></div>{!rows.length && <Empty title="Chưa có bài nộp phù hợp" />}</Card><Card className="mt24"><h3>Danh sách học viên</h3>{d.students.map(s => <div key={s.id} className="student-line"><Link to={`/manage/classes/${classId}/students/${s.id}`}>{s.name}</Link><ProgressBar value={s.total ? s.solved / s.total * 100 : 0} /><span>{s.solved}/{s.total} bài</span><Badge tone={s.score >= 5 ? 'green' : 'orange'}>{s.attempts ? s.group : 'Chưa tham gia'}</Badge></div>)}</Card><Link className="text-link mt24" to={`/manage/classes/${classId}/sessions/${id}`}>← Quản lý nhóm bài tập</Link>{detail && <Modal wide title={'Bài nộp #' + detail.id} onClose={() => setDetail(null)}><Status value={detail.status} /><CodeBlock>{detail.code}</CodeBlock></Modal>}</>;
      }}</DataState></div>;
}
export function StudentList({
  classId
}) {
  const r = useData(`/classes/${classId}/report`);
  return <div className="page-container"><PageTitle title="Danh sách học viên" description="Theo dõi tiến độ và hỗ trợ từng người học." /><DataState resource={r}>{d => <Card className="table-card"><div className="table-wrap"><table><thead><tr><th>Học viên</th><th>Bài đã đạt</th><th>Lượt nộp</th><th>Nhóm</th><th /></tr></thead><tbody>{d.students.map(s => <tr key={s.id}><td>{s.name}</td><td>{s.solved}/{s.total}</td><td>{s.attempts}</td><td><Badge tone={s.group === 'Cần hỗ trợ' ? 'orange' : 'green'}>{s.group}</Badge></td><td><Link to={`/manage/classes/${classId}/students/${s.id}`}>Chi tiết →</Link></td></tr>)}</tbody></table></div></Card>}</DataState></div>;
}
export function StudentPage({
  classId,
  id
}) {
  const r = useData(`/classes/${classId}/students/${id}`);
  const [comment, setComment] = useState(''),
    [sub, setSub] = useState(null);
  const [busy, run] = useAction();
  useEffect(() => {
    if (r.data) setComment(r.data.comment);
  }, [r.data]);
  return <div className="page-container"><DataState resource={r}>{d => <><PageTitle title={'Tiến độ học viên ' + d.name} description={d.classroom.name + ' / Hồ sơ học tập'} /><div className="grid four"><Stat label="Bài đã hoàn thành" value={`${d.solved} / ${d.exercises.length}`} tone="green" /><Stat label="Lần hoạt động cuối" value={d.last_active ? new Date(d.last_active + 'Z').toLocaleTimeString('vi-VN', {
            hour: '2-digit',
            minute: '2-digit'
          }) : '—'} sub={d.last_active ? dateTime(d.last_active) : 'Chưa có bài nộp'} tone="blue" /><Stat label="Kỹ năng cần ôn" value={d.exercises.find(x => x.status !== 'AC')?.skill || 'Đã hoàn thành'} tone="orange" /><Stat label="Gợi ý đã dùng" value={`${d.hints} lượt`} tone="purple" /></div><Card className="table-card mt24"><div className="table-wrap"><table><thead><tr><th>Bài tập</th><th>Lần nộp</th><th>Kết quả</th><th>Hướng xử lý</th><th /></tr></thead><tbody>{d.exercises.map(e => <tr key={e.id}><td>{e.title}</td><td>{e.attempts}</td><td><Status value={e.status} /> {e.passed}/{e.total}</td><td>{e.status === 'AC' ? 'Đã hoàn thành' : `Ôn kỹ năng ${e.skill}`}</td><td>{e.submission_id ? <Button className="small" variant="secondary" onClick={() => run(async () => setSub(await api('/submissions/' + e.submission_id)))}>Xem bài nộp</Button> : <Link to={'/lesson/' + e.lesson_id}>Xem học liệu</Link>}</td></tr>)}</tbody></table></div></Card><Card className="mt24"><h3>Nhận xét của giảng viên</h3><textarea rows={4} aria-label="Nhận xét của giảng viên" maxLength={5000} value={comment} onChange={e => setComment(e.target.value)} /><Button className="mt16" busy={busy} onClick={() => run(() => api(`/classes/${classId}/students/${id}/comment`, {
            method: 'PUT',
            body: {
              body: comment
            }
          }), 'Đã lưu nhận xét.')}>Lưu nhận xét</Button></Card>{sub && <Modal wide title={'Bài nộp #' + sub.id} onClose={() => setSub(null)}><Status value={sub.status} /><CodeBlock>{sub.code}</CodeBlock></Modal>}</>}</DataState></div>;
}
export function SessionDirectory({
  reports = false
}) {
  const r = useData('/classes');
  return <div className="page-container"><PageTitle title={reports ? 'Báo cáo lớp' : 'Buổi học trực tiếp'} description="Chọn buổi học để theo dõi kết quả riêng." /><DataState resource={r}>{rooms => <div className="grid two">{rooms.flatMap(c => c.sessions.map(s => <Card key={s.id}><Badge tone="blue">{c.name}</Badge><h3 className="mt16">{s.title}</h3><p>{s.exercise_ids.length} bài tập · {s.status === 'open' ? 'Đang mở' : 'Đã kết thúc'}</p><Link className="btn primary" to={`/manage/classes/${c.id}/sessions/${s.id}/${reports ? 'report' : 'live'}`}>{reports ? 'Xem báo cáo' : 'Mở Dashboard'} <ArrowRight size={16} /></Link></Card>))}</div>}</DataState></div>;
}
