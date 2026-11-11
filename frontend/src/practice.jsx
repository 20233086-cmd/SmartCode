import React, { useState, useEffect, useRef, lazy, Suspense } from 'react';
import { Play, Send, Lightbulb, Save, Moon, Sun, ChevronRight, Code2, Flag, Clock, Check, Trash2 } from 'lucide-react';
const Editor = lazy(() => import('./CodeEditor'));
import { api, post, useData, useAction, useSession, timeCode } from './api';
import { Button, Badge, Card, DataState, CodeBlock, Link, Modal, Field, Status } from './ui';
import { EmotionPanel } from './emotion';
export function PracticePage({
  id,
  assessmentId = null,
  assessmentTime = null,
  assessmentIndex = '',
  initialDraft,
  onAssessmentFinish
}) {
  const query = new URLSearchParams(location.hash.split('?')[1] || '');
  const sessionId = assessmentId ? null : Number(query.get('session')) || null;
  const r = useData('/exercises/' + id),
    pref = useData('/emotion-preferences'),
    aiStatus = useData('/ai/status');
  const {
    user,
    notify
  } = useSession();
  const [busy, run] = useAction();
  const [code, setCode] = useState(''),
    [stdin, setStdin] = useState(''),
    [result, setResult] = useState(null),
    [saved, setSaved] = useState('Đang tải bản nháp'),
    [hintOpen, setHintOpen] = useState(false),
    [hint, setHint] = useState(null),
    [level, setLevel] = useState(1),
    [emotion, setEmotion] = useState(null),
    [dark, setDark] = useState(false),
    [collapsed, setCollapsed] = useState(false),
    [report, setReport] = useState(false),
    [reportBody, setReportBody] = useState('');
  const ready = useRef(false),
    clock = useRef(0),
    touch = useRef(Date.now()),
    latest = useRef(null),
    failures = useRef(0);
  const cacheKey = `sc:draft:${user?.id}:${assessmentId ? 'assessment:' + assessmentId : sessionId ? 'session:' + sessionId : 'practice'}:${id}`;
  const payload = () => ({
    code,
    stdin,
    active_seconds: clock.current,
    assessment_id: assessmentId,
    session_id: sessionId
  });
  latest.current = payload();
  useEffect(() => {
    if (!r.data) return;
    let local = null;
    try {
      local = sessionStorage.getItem(cacheKey);
    } catch {}
    setCode(local ?? (assessmentId ? initialDraft ?? r.data.starter : r.data.draft ?? r.data.starter));
    setStdin(r.data.samples?.[0]?.input || '');
    clock.current = assessmentId ? 0 : r.data.active_seconds || 0;
    ready.current = true;
    setSaved('Đã tải bản nháp');
  }, [r.data?.id]);
  useEffect(() => {
    const t = setInterval(() => {
      if (ready.current && document.visibilityState === 'visible' && Date.now() - touch.current < 60000) clock.current = Math.min(36000, clock.current + 1);
    }, 1000);
    return () => {
      clearInterval(t);
      if (ready.current && latest.current) api(`/exercises/${id}/draft`, {
        method: 'PUT',
        body: latest.current
      }).catch(() => {});
    };
  }, [id]);
  useEffect(() => {
    if (!ready.current) return;
    try {
      sessionStorage.setItem(cacheKey, code);
    } catch {}
    setSaved('Đang lưu…');
    const t = setTimeout(() => api(`/exercises/${id}/draft`, {
      method: 'PUT',
      body: payload()
    }).then(() => setSaved('Đã tự động lưu bản nháp')).catch(() => setSaved('Chưa lưu được · bấm Lưu để thử lại')), 1000);
    return () => clearTimeout(t);
  }, [code, id]);
  const execute = submitting => run(async () => {
    await api(`/exercises/${id}/draft`, {
      method: 'PUT',
      body: payload()
    });
    setSaved('Đã lưu bản nháp');
    const d = await post(`/exercises/${id}/${submitting ? 'submit' : 'run'}`, payload());
    setResult(d);
    if (submitting) {
      failures.current = d.status === 'AC' ? 0 : failures.current + 1;
      if (!assessmentId && pref.data?.enabled !== false) {
        try {
          setEmotion(await post('/emotions', {
            failures: Math.min(20, failures.current)
          }));
        } catch (e) {
          if (e.status !== 409) notify('Đã chấm bài; chưa lưu được cảm nhận tự động.', 'error');
        }
      }
      ;
      notify(d.status === 'AC' ? 'Đã hoàn thành bài tập!' : 'Đã chấm bài. Xem kết quả từng test bên dưới.');
    }
  });
  const rows = result?.results || [];
  return <div className={'ref-practice ' + (collapsed ? 'problem-collapsed' : '')}><DataState resource={r}>{e => <div className="ref-practice-grid"><aside className="problem-pane"><button className="problem-heading" onClick={() => setCollapsed(!collapsed)}><span className="mini-icon purple"><Code2 size={20} /></span><div><h2>Đề bài</h2><small>Click để {collapsed ? 'mở rộng' : 'thu gọn'}</small></div><ChevronRight size={18} /></button>{!collapsed && <div className="problem-content"><section className="problem-block blue"><h4>Yêu cầu</h4><p>{e.description}</p></section><section className="problem-block blue"><h4>IN　Đầu vào</h4><p>Đọc dữ liệu từ đầu vào tiêu chuẩn (stdin), theo yêu cầu đề bài.</p>{e.samples.map((s, i) => <CodeBlock key={i}>{s.input}</CodeBlock>)}</section><section className="problem-block green"><h4>OUT　Đầu ra</h4><p>In kết quả chính xác, không thêm lời nhắc nhập.</p>{e.samples.map((s, i) => <CodeBlock key={i}>{s.output}</CodeBlock>)}</section><section className="problem-block purple"><h4>Giải thích</h4><p>Thử các ví dụ trước khi nộp. Bộ chấm sẽ kiểm tra thêm những trường hợp ẩn.</p><Link to={'/lesson/' + e.lesson_id}>Xem lý thuyết liên quan</Link></section><h4>Ví dụ</h4>{e.samples.map((s, i) => <div className="sample" key={i}><small>Input: {s.input.trim()}</small><small>Output: {s.output.trim()}</small></div>)}<Button variant="secondary" className="full mt16" onClick={() => setReport(true)}><Flag size={14} /> Báo lỗi đề bài</Button></div>}</aside>
 <main className="practice-main"><Card className="exercise-title"><h1>{e.title}</h1><div className="row"><Badge tone={e.difficulty === 'easy' ? 'green' : e.difficulty === 'medium' ? 'orange' : 'purple'}>{{
                  easy: 'DỄ',
                  medium: 'VỪA',
                  hard: 'KHÓ'
                }[e.difficulty]}</Badge><small>20 XP · Giới hạn {e.time_limit} giây</small></div></Card><Card className="editor-shell"><div className="editor-tools"><Badge tone="blue">{{
                  java: 'Java',
                  python: 'Python',
                  javascript: 'JavaScript'
                }[e.language]} ▾</Badge><button className="icon-btn" aria-label="Đổi nền trình soạn thảo" onClick={() => setDark(!dark)}>{dark ? <Sun size={16} /> : <Moon size={16} />}</button><Button variant="secondary" className="small" busy={busy} onClick={() => execute(false)}>Kiểm tra</Button><small>CODE EDITOR</small></div><Suspense fallback={<div className="editor-loading">Đang tải trình soạn thảo…</div>}><Editor value={code} language={e.language} theme={dark ? 'vs-dark' : 'vs'} onChange={v => {
                touch.current = Date.now();
                setCode(v || '');
              }} /></Suspense><div className="terminal-heading"><span>● ● ●　Terminal / Code Execution</span><button onClick={() => setResult(null)}>Clear</button></div><div className="terminal-body"><Field label="Input"><textarea aria-label="Đầu vào tự chọn" rows={2} value={stdin} onChange={v => setStdin(v.target.value)} /></Field><h4>Output</h4>{result ? <><div className="row between">{result.status && <Status value={result.status} />}<small>{result.passed !== undefined ? `${result.passed}/${result.total} test đạt` : ''}</small></div>{rows.map((x, i) => <details key={i} open={!x.hidden}><summary>Test {i + 1} {x.hidden ? '· ẩn' : ''} · {x.status}</summary>{!x.hidden && <CodeBlock>{x.stdout || x.stderr || x.message || 'Không có đầu ra.'}</CodeBlock>}</details>)}</> : <p className="terminal-empty">Chạy thử để xem kết quả tại đây.</p>}</div></Card><div className="practice-actions"><Button variant="secondary" busy={busy} onClick={() => execute(false)}><Play size={16} /> Chạy thử</Button><Button busy={busy} onClick={() => execute(true)}><Send size={16} /> Nộp bài</Button><Button className="hint-button" disabled={!!assessmentId || e.hints_allowed === false} onClick={() => setHintOpen(true)}><Lightbulb size={16} />{assessmentId ? 'Gợi ý đã tắt trong đánh giá' : 'Gợi ý AI'}</Button></div><div className="draft-status"><span><Check size={13} /> {saved}</span><button aria-label="Lưu bản nháp" onClick={() => run(async () => {
              await api(`/exercises/${id}/draft`, {
                method: 'PUT',
                body: payload()
              });
              setSaved('Đã lưu bản nháp');
            })}><Save size={14} /> Lưu</button></div></main>
 <aside className="practice-support">{assessmentId ? <Card><h3>Thông tin đánh giá</h3><p>Thời gian còn lại</p><div className="assessment-clock">{timeCode(assessmentTime || 0)}</div><h4>Bài thực hành {assessmentIndex}</h4><p>Kết quả dùng để đề xuất lộ trình.</p><Button className="full" onClick={() => onAssessmentFinish(payload())}>Kết thúc đánh giá</Button></Card> : <EmotionPanel onPreferenceChange={() => pref.reload()} value={emotion} onChange={setEmotion} />}</aside>
 {hintOpen && <Modal title="Gợi ý AI" onClose={() => setHintOpen(false)}><p>Gợi ý từng bước để bạn tự tìm ra lời giải. Hệ thống ưu tiên AI Ollama; nếu Ollama chưa chạy hoặc chưa có model, sẽ hiển thị gợi ý dự phòng và lý do.</p><div className="hint-levels">{[1, 2, 3].map(n => <button key={n} className={level === n ? 'active' : ''} onClick={() => setLevel(n)}>Mức {n}</button>)}</div>{aiStatus.data && <div className={`ai-status ${aiStatus.data.model_ready ? 'ready' : 'warning'}`}><strong>{aiStatus.data.model_ready ? 'Ollama đã sẵn sàng' : 'Ollama chưa sẵn sàng'}</strong><small>{aiStatus.data.message} · Model: {aiStatus.data.model}</small></div>}{hint && <div className="hint-answer"><p>{hint.content}</p><small>{hint.provider === 'ollama' ? `AI · Ollama (${hint.model || aiStatus.data?.model || 'local model'})` : 'Gợi ý dự phòng · Giảng viên soạn'} · {hint.source}</small>{hint.notice && <p className="hint-notice">{hint.notice}</p>}</div>}<Button busy={busy} className="full" onClick={() => run(async () => setHint(await post(`/exercises/${id}/hint`, {
            ...payload(),
            level
          })))}>Nhận gợi ý</Button></Modal>}
 {report && <Modal title="Phản ánh nội dung bài tập" onClose={() => setReport(false)}><form onSubmit={v => {
            v.preventDefault();
            run(async () => {
              await post('/reports', {
                exercise_id: Number(id),
                body: reportBody
              });
              setReport(false);
              setReportBody('');
            }, 'Đã gửi phản ánh.');
          }}><Field label="Nội dung"><textarea required minLength={5} maxLength={3000} rows={5} value={reportBody} onChange={v => setReportBody(v.target.value)} /></Field><Button busy={busy}>Gửi phản ánh</Button></form></Modal>}
 </div>}</DataState></div>;
}
