import React, { useState, useEffect, useRef } from 'react';
import { ArrowRight, ArrowLeft, Check, Clock, Target, Mail, Code2, CheckCircle2 } from 'lucide-react';
import { api, post, useData, useAction, useSession, go, timeCode } from './api';
import { Link, Card, Button, Field, PageTitle, ProgressBar, Badge, Modal, DataState, Empty } from './ui';
import { CodePage } from './pages-learning';
export function AuthScreen({
  mode = 'login'
}) {
  const {
    setUser
  } = useSession();
  const [form, setForm] = useState({
      name: '',
      email: '',
      password: '',
      confirm: ''
    }),
    [sent, setSent] = useState(false);
  const [busy, run] = useAction();
  const titles = {
    login: 'Chào mừng trở lại',
    register: 'Bắt đầu hành trình của bạn',
    forgot: 'Khôi phục mật khẩu',
    reset: 'Đặt mật khẩu mới'
  };
  const submit = e => {
    e.preventDefault();
    run(async () => {
      if (mode === 'forgot') {
        await post('/auth/forgot-password', {
          email: form.email
        });
        setSent(true);
        return;
      }
      if (mode === 'reset') {
        if (form.password !== form.confirm) throw Error('Hai mật khẩu chưa trùng nhau.');
        const token = new URLSearchParams(location.hash.split('?')[1]).get('token');
        await post('/auth/reset-password', {
          token,
          password: form.password
        });
        setSent(true);
        return;
      }
      const u = await post('/auth/' + mode, {
        name: form.name,
        email: form.email,
        password: form.password
      });
      setUser(u);
      go(u.role === 'learner' ? '/dashboard' : u.role === 'admin' ? '/admin' : '/manage');
    });
  };
  return <main className="ref-auth"><aside><Link className="auth-brand" to="/">⌘ SmartCode</Link><div><h1>Mỗi lần thử,<br />một lần tiến bộ.</h1><p>01　Lộ trình rõ ràng, phù hợp năng lực.</p><p>02　Thực hành cùng phản hồi tức thì.</p><p>03　Lưu lại từng bước trưởng thành.</p></div></aside><section><div className="ref-auth-form"><h1>{titles[mode]}</h1><p>Học và thực hành trong cùng một không gian.</p>{sent ? <Card className="auth-success"><Mail size={40} /><h3>{mode === 'forgot' ? 'Kiểm tra hộp thư của bạn' : 'Đã đặt lại mật khẩu'}</h3><p>{mode === 'forgot' ? 'Nếu email đã đăng ký, bạn sẽ nhận hướng dẫn khôi phục. Liên kết có hiệu lực 30 phút.' : 'Bạn có thể đăng nhập bằng mật khẩu mới.'}</p><Link className="btn primary full" to="/login">Đăng nhập</Link></Card> : <form onSubmit={submit}>{mode === 'register' && <Field label="Họ và tên"><input required autoComplete="name" minLength={2} maxLength={100} value={form.name} onChange={e => setForm({
              ...form,
              name: e.target.value
            })} /></Field>}{mode !== 'reset' && <Field label={mode === 'forgot' ? 'Email đã đăng ký' : 'Email'}><input type="email" autoComplete="email" placeholder="ban@example.com" required value={form.email} onChange={e => setForm({
              ...form,
              email: e.target.value
            })} /></Field>}{mode !== 'forgot' && <Field label="Mật khẩu"><input type="password" required autoComplete={mode === 'login' ? 'current-password' : 'new-password'} placeholder="••••••••••" minLength={mode === 'login' ? 1 : 8} maxLength={128} value={form.password} onChange={e => setForm({
              ...form,
              password: e.target.value
            })} /></Field>}{mode === 'reset' && <Field label="Nhập lại mật khẩu"><input type="password" autoComplete="new-password" required minLength={8} value={form.confirm} onChange={e => setForm({
              ...form,
              confirm: e.target.value
            })} /></Field>}{mode === 'login' && <div className="auth-forgot"><Link to="/forgot-password">Quên mật khẩu?</Link></div>}<Button busy={busy} className="full">{{
              login: 'Đăng nhập',
              register: 'Tạo tài khoản',
              forgot: 'Gửi liên kết khôi phục',
              reset: 'Lưu mật khẩu mới'
            }[mode]}</Button></form>}<p className="auth-switch"><Link to="/login">Đăng nhập</Link>　/　<Link to="/register">Tạo tài khoản mới</Link></p><Link className="auth-back" to="/">← Quay lại trang chủ</Link></div></section></main>;
}
export function SurveyWizard({
  id
}) {
  const r = useData(`/courses/${id}/survey`);
  const [step, setStep] = useState(0),
    [answers, setAnswers] = useState([]);
  const [busy, run] = useAction();
  useEffect(() => {
    if (r.data?.answers) setAnswers(r.data.answers);
  }, [r.data]);
  return <div className="survey-shell"><DataState resource={r}>{d => {
        const q = d.questions[step];
        return <Card><div className="row between"><span className="brand">⌘ SmartCode</span><b>{step + 1} / {d.questions.length}</b></div><ProgressBar value={(step + 1) / d.questions.length * 100} /><div className="survey-question"><div className="eyebrow">CÂU {String(step + 1).padStart(2, '0')}</div><h1>{q.title}</h1><div className="survey-options">{q.options.map((x, i) => <button key={i} className={answers[step] === i ? 'selected' : ''} onClick={() => setAnswers(a => {
                const b = [...a];
                b[step] = i;
                return b;
              })}><span>{answers[step] === i ? <Check size={16} /> : String.fromCharCode(65 + i)}</span>{x}</button>)}</div><div className="row between"><Button variant="secondary" disabled={!step} onClick={() => setStep(step - 1)}><ArrowLeft size={16} /> Quay lại</Button><Button busy={busy} disabled={answers[step] === undefined} onClick={() => step < d.questions.length - 1 ? setStep(step + 1) : run(async () => {
                await api(`/courses/${id}/survey`, {
                  method: 'PUT',
                  body: {
                    answers
                  }
                });
                go('/placement/' + id);
              })}>Tiếp tục <ArrowRight size={16} /></Button></div><p className="center mt24">Thông tin này giúp đề xuất điểm bắt đầu phù hợp.</p></div></Card>;
      }}</DataState></div>;
}
export function PlacementFlow({
  id
}) {
  const r = useData(`/courses/${id}/placement`);
  const [step, setStep] = useState(0),
    [answers, setAnswers] = useState([]),
    [result, setResult] = useState(null);
  const [busy, run] = useAction();
  return <div className="page-container narrow"><PageTitle title="Đánh giá đầu vào" description="Kiến thức nền tảng → Thực hành → Lộ trình phù hợp" /><DataState resource={r}>{qs => !qs.length ? <Empty title="Chưa có bộ câu hỏi" /> : result ? <Card className="placement-start"><Target size={46} /><h2>Sẵn sàng cho phần thực hành?</h2><p>Bạn sẽ làm tối đa 3 bài trong 20 phút. Gợi ý được tắt trong lượt đánh giá. Bản nháp tự động lưu để bạn tiếp tục khi tải lại trang.</p><div className="notice blue">Kết quả trắc nghiệm: {Math.round(Object.values(result.scores).reduce((a, b) => a + b, 0) / Object.values(result.scores).length)}%</div><Button busy={busy} onClick={() => run(async () => {
          const a = await post(`/courses/${id}/assessments`);
          go('/assessment/' + a.id);
        })}>Bắt đầu thực hành <ArrowRight size={16} /></Button><Link className="text-link mt16" to={'/roadmap/' + id}>Học lý thuyết trước</Link></Card> : <Card><div className="row between"><h3>Kiểm tra kiến thức</h3><Badge tone="purple">{step + 1} / {qs.length}</Badge></div><ProgressBar value={(step + 1) / qs.length * 100} /><h2 className="mt24">{qs[step].question}</h2><div className="survey-options">{qs[step].options.map((x, i) => <button key={i} className={answers[step] === i ? 'selected' : ''} onClick={() => setAnswers(a => {
            const b = [...a];
            b[step] = i;
            return b;
          })}><span>{String.fromCharCode(65 + i)}</span>{x}</button>)}</div><div className="row between"><Button variant="secondary" disabled={!step} onClick={() => setStep(step - 1)}>Quay lại</Button><Button busy={busy} disabled={answers[step] === undefined} onClick={() => step < qs.length - 1 ? setStep(step + 1) : run(async () => setResult(await post(`/courses/${id}/placement`, {
            answers
          })))}>{step === qs.length - 1 ? 'Hoàn thành lý thuyết' : 'Tiếp theo'} <ArrowRight size={16} /></Button></div></Card>}</DataState></div>;
}
export function AssessmentPage({
  id
}) {
  const r = useData('/assessments/' + id);
  const [index, setIndex] = useState(0),
    [seconds, setSeconds] = useState(null),
    [confirm, setConfirm] = useState(null);
  const [busy, run] = useAction();
  const ending = useRef(false);
  useEffect(() => {
    if (!r.data) return;
    if (r.data.ended) {
      go('/assessment-result/' + id);
      return;
    }
    const remaining = Math.max(0, (new Date(r.data.expires_at + 'Z') - new Date(r.data.server_now + 'Z')) / 1000);
    const end = Date.now() + remaining * 1000;
    const tick = () => {
      const left = Math.max(0, Math.ceil((end - Date.now()) / 1000));
      setSeconds(left);
      if (!left && !ending.current) {
        ending.current = true;
        post('/assessments/' + id + '/finish').then(() => go('/assessment-result/' + id)).catch(() => {
          ending.current = false;
        });
      }
    };
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, [r.data?.id]);
  const a = r.data;
  const eid = a?.exercises[index]?.id;
  return <DataState resource={r}>{d => <><div className="assessment-strip"><b>Đánh giá đầu vào · Không sử dụng gợi ý</b><span><Clock size={16} /> {seconds === null ? '--:--' : timeCode(seconds)}</span><div className="row">{d.exercises.map((e, i) => <button key={e.id} className={index === i ? 'active' : ''} onClick={() => setIndex(i)}>Bài {i + 1}{e.result?.status === 'AC' ? ' ✓' : ''}</button>)}</div></div>{eid && <CodePage key={eid} id={eid} assessmentId={Number(id)} initialDraft={d.drafts?.[String(eid)]} assessmentTime={seconds} assessmentIndex={`${index + 1} / ${d.exercises.length}`} onAssessmentFinish={payload => setConfirm({
        eid,
        payload
      })} />} {confirm && <Modal title="Kết thúc đánh giá?" onClose={() => setConfirm(null)}><p>Bạn có thể xem lại các bài hoặc kết thúc để nhận lộ trình đề xuất.</p><div className="row"><Button variant="secondary" onClick={() => setConfirm(null)}>Xem lại</Button><Button busy={busy} onClick={() => run(async () => {
            try {
              await api(`/exercises/${confirm.eid}/draft`, {
                method: 'PUT',
                body: confirm.payload
              });
            } catch (e) {
              if (e.status !== 409) throw e;
            }
            await post('/assessments/' + id + '/finish');
            go('/assessment-result/' + id);
          })}>Kết thúc đánh giá</Button></div></Modal>}</>}</DataState>;
}
export function AssessmentResult({
  id
}) {
  const r = useData('/assessments/' + id);
  return <div className="page-container narrow"><DataState resource={r}>{a => <Card className="assessment-result"><div className="result-icon"><CheckCircle2 size={44} /></div><h1>Lộ trình đã sẵn sàng</h1><p>Kết quả giúp bạn chọn phần kiến thức cần củng cố.</p><div className="grid two"><Card><strong>{a.solved} / {a.exercises.length}</strong><p>Bài thực hành đạt</p></Card><Card><strong>{Object.keys(a.theory_scores).length ? Math.round(Object.values(a.theory_scores).reduce((x, y) => x + y, 0) / Object.keys(a.theory_scores).length) : 0}%</strong><p>Trắc nghiệm đầu vào</p></Card></div>{a.exercises.map(e => <div className="result-row" key={e.id}><span>{e.title}</span><Badge tone={e.result?.status === 'AC' ? 'green' : 'orange'}>{e.result?.status || 'Chưa có bài chấm'}</Badge></div>)}<p className="chart-note">Bài chưa nộp hoặc chưa kết nối bộ chấm được ghi nhận là chưa đánh giá, không tạo điểm thực hành giả.</p><Link className="btn primary full" to={'/roadmap/' + a.course_id}>Xem lộ trình cá nhân <ArrowRight size={16} /></Link><Link className="btn secondary full mt16" to={'/lesson/' + a.recommended_lesson}>Học phần được đề xuất</Link></Card>}</DataState></div>;
}
