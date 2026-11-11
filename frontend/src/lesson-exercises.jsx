import React from 'react';
import { ArrowRight, Code2, Check, BookOpen } from 'lucide-react';
import { useData } from './api';
import { Link, Card, Badge, PageTitle, DataState, ProgressBar, Empty } from './ui';
export function LessonExercises({
  id
}) {
  const r = useData('/lessons/' + id),
    history = useData('/submissions');
  const course = useData(r.data ? '/courses/' + r.data.course_id : null);
  const solved = new Set((history.data || []).filter(s => s.status === 'AC').map(s => s.exercise_id));
  return <div className="page-container"><DataState resource={r}>{l => {
        const done = l.exercises.filter(e => solved.has(e.id)).length;
        return <><PageTitle eyebrow={`${course.data?.title || 'KHÓA HỌC'} / BÀI ${String(l.position).padStart(2, '0')}`} title={l.title} description={`${l.exercises.length} bài tập · ${done} bài hoàn thành`} /><div className="lesson-switch"><Link to={'/lesson/' + id}><BookOpen size={16} /> Lý thuyết</Link><Link className="active" to={'/lesson/' + id + '/exercises'}><Code2 size={16} /> Bài tập {l.exercises.length}</Link></div><Card className="lesson-exercise-list"><div className="row between"><h2>Danh sách bài tập</h2><Badge tone="purple">{done} / {l.exercises.length}</Badge></div><ProgressBar value={l.exercises.length ? done / l.exercises.length * 100 : 0} />{l.exercises.map((e, i) => <div className="reference-exercise-row" key={e.id}><div><h3>{i + 1}. {e.title}</h3><small>{e.skill} · 20 XP</small></div><Badge tone={solved.has(e.id) ? 'green' : e.difficulty === 'easy' ? 'blue' : 'orange'}>{solved.has(e.id) ? 'Đã hoàn thành' : {
                  easy: 'DỄ',
                  medium: 'VỪA',
                  hard: 'KHÓ'
                }[e.difficulty]}</Badge><Link className="btn primary" to={'/code/' + e.id}>{solved.has(e.id) ? 'Làm lại' : 'Làm bài'} <ArrowRight size={15} /></Link></div>)}{!l.exercises.length && <Empty title="Giảng viên đang chuẩn bị bài tập" />}</Card><div className="row between wrap mt24"><Link className="btn secondary" to={'/lesson/' + id}>← Xem lý thuyết</Link><Link to={'/roadmap/' + l.course_id}>Xem tất cả bài học</Link>{l.exercises.length > 0 && <Link className="btn primary" to={'/code/' + (l.exercises.find(e => !solved.has(e.id)) || l.exercises[0]).id}>Tiếp tục thực hành <ArrowRight size={16} /></Link>}</div></>;
      }}</DataState></div>;
}
