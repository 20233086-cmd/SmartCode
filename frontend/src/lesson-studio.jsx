import React, { useEffect, useState } from 'react';
import { ArrowLeft, Save, Eye, Send, Plus, Trash2, Video } from 'lucide-react';
import { api, useData, useAction, dateTime } from './api';
import { Button, Card, Field, Badge, Modal, CodeBlock } from './ui';
import { UploadControl } from './media';
const SKILLS = ['input_output', 'variables', 'operators', 'conditions', 'loops', 'strings', 'arrays', 'functions', 'algorithms', 'review'];
export function LessonStudio({
  initial,
  courses,
  onClose,
  onSaved,
  QuizEditor
}) {
  const [form, setForm] = useState(() => structuredClone(initial));
  const [extras, setExtras] = useState({
    thumbnail_url: '',
    resources: []
  });
  const [preview, setPreview] = useState(false),
    [publishedId, setPublishedId] = useState(initial.id);
  const [busy, run] = useAction();
  const draftKey = initial.id ? 'lesson-' + initial.id : 'new-' + initial.course_id;
  const draft = useData('/manage/lesson-drafts/' + draftKey);
  const savedExtras = useData(initial.id ? `/lessons/${initial.id}/extras` : null);
  useEffect(() => {
    if (savedExtras.data) setExtras(savedExtras.data);
  }, [savedExtras.data]);
  const change = (key, value) => setForm(s => ({
    ...s,
    [key]: value
  }));
  const saveDraft = () => run(async () => {
    await api('/manage/lesson-drafts/' + draftKey, {
      method: 'PUT',
      body: {
        course_id: Number(form.course_id),
        payload: {
          form,
          extras
        }
      }
    });
    draft.reload();
  }, 'Đã lưu bản nháp. Nội dung đang hiển thị cho học viên chưa thay đổi.');
  const publish = e => {
    e.preventDefault();
    run(async () => {
      const payload = {
        ...form,
        course_id: Number(form.course_id)
      };
      delete payload.id;
      const saved = await api('/manage/lessons' + (publishedId ? '/' + publishedId : ''), {
        method: publishedId ? 'PUT' : 'POST',
        body: payload
      });
      setPublishedId(saved.id);
      await api(`/manage/lessons/${saved.id}/extras`, {
        method: 'PUT',
        body: extras
      });
      await api('/manage/lesson-drafts/' + draftKey, {
        method: 'DELETE'
      });
      onSaved();
    }, 'Đã lưu bài học. Học viên có thể xem khi khóa học được xuất bản.');
  };
  const course = courses.find(c => c.id === Number(form.course_id));
  return <div className="page-container lesson-studio">
    <div className="row between wrap studio-heading"><div><button className="text-button" onClick={onClose}><ArrowLeft size={15} /> Bài học & video</button><h1>{initial.id ? 'Soạn bài học' : 'Thêm bài học mới'}</h1><p>{course?.title} / {form.title || 'Nội dung mới'}</p></div><div className="row wrap"><Button variant="secondary" busy={busy} onClick={saveDraft}><Save size={16} /> Lưu bản nháp</Button><Button variant="secondary" onClick={() => setPreview(true)}><Eye size={16} /> Xem trước</Button><Button form="lesson-publish" busy={busy}><Send size={16} /> Xuất bản bài học</Button></div></div>
    {draft.data?.payload && <div className="notice blue row between wrap"><span>Có bản nháp đã lưu {dateTime(draft.data.updated_at)}.</span><Button variant="secondary" className="small" onClick={() => {
        setForm(draft.data.payload.form);
        setExtras(draft.data.payload.extras || {
          thumbnail_url: '',
          resources: []
        });
      }}>Khôi phục bản nháp</Button></div>}
    <form id="lesson-publish" className="studio-grid" onSubmit={publish}><div>
      <Card><div className="row between"><h3>Thông tin bài học</h3><Badge tone="blue">Bài {form.position}</Badge></div><Field label="Tên bài học"><input required minLength={2} maxLength={200} value={form.title} onChange={e => change('title', e.target.value)} /></Field><div className="grid two"><Field label="Khóa học"><select required disabled={!!initial.id} value={form.course_id} onChange={e => change('course_id', Number(e.target.value))}>{courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}</select></Field><Field label="Chủ đề"><select value={form.skill} onChange={e => change('skill', e.target.value)}>{SKILLS.map(k => <option key={k}>{k}</option>)}</select></Field></div></Card>
      <Card className="mt24"><h3><Video size={20} /> Video bài giảng</h3><UploadControl onUploaded={m => change('video_url', m.url)} /><Field label="Đường dẫn video" hint="Chọn tệp trên hoặc nhập liên kết HTTPS tới MP4/WebM."><input value={form.video_url} onChange={e => change('video_url', e.target.value)} placeholder="https://…" /></Field>{form.video_url && <video className="studio-video" controls preload="metadata" poster={extras.thumbnail_url || undefined} src={form.video_url} />}
        <Field label="Phụ đề tiếng Việt"><input value={form.captions_url} onChange={e => change('captions_url', e.target.value)} placeholder="https://… hoặc /api/media/…" /></Field><UploadControl kind="captions" onUploaded={m => change('captions_url', m.url)} />
      </Card>
      <Card className="mt24"><h3>Nội dung lý thuyết</h3><p>Chia đoạn bằng một dòng trống. Các ví dụ được trình bày trong phần code mẫu.</p><Field label="Bài giảng"><textarea required rows={12} value={form.content} onChange={e => change('content', e.target.value)} /></Field><Field label="Code minh họa"><textarea className="mono" rows={8} value={form.code} onChange={e => change('code', e.target.value)} /></Field></Card>
      <Card className="mt24"><QuizEditor quiz={form.quiz} onChange={v => change('quiz', v)} /></Card>
    </div><aside><Card><h3>Xuất bản</h3><Badge tone={course?.published ? 'green' : 'orange'}>{course?.published ? 'Khóa học đang hiển thị' : 'Khóa học đang ẩn'}</Badge><p>Bản nháp được lưu riêng. Xuất bản sẽ cập nhật bài học cho người đã ghi danh trong khóa.</p><Field label="Thứ tự bài học"><input required type="number" min={1} max={1000} value={form.position} onChange={e => change('position', Number(e.target.value))} /></Field><Button type="submit" busy={busy} className="full">Xuất bản bài học</Button></Card>
      <Card className="mt24"><h3>Ảnh đại diện video</h3><Field label="URL ảnh HTTPS"><input type="url" pattern="https://.*" value={extras.thumbnail_url} onChange={e => setExtras({
              ...extras,
              thumbnail_url: e.target.value
            })} placeholder="https://…" /></Field>{extras.thumbnail_url && <img className="studio-thumbnail" src={extras.thumbnail_url} alt="Ảnh đại diện bài giảng" />}</Card>
      <Card className="mt24"><h3>Tài liệu đính kèm</h3>{extras.resources.map((x, i) => <div className="studio-resource" key={i}><Field label={'Tên tài liệu ' + (i + 1)}><input required maxLength={200} value={x.title} onChange={e => setExtras({
                ...extras,
                resources: extras.resources.map((v, j) => j === i ? {
                  ...v,
                  title: e.target.value
                } : v)
              })} /></Field><Field label="Liên kết HTTPS"><input required type="url" pattern="https://.*" value={x.url} onChange={e => setExtras({
                ...extras,
                resources: extras.resources.map((v, j) => j === i ? {
                  ...v,
                  url: e.target.value
                } : v)
              })} /></Field><Button type="button" variant="secondary" className="small" onClick={() => setExtras({
              ...extras,
              resources: extras.resources.filter((_, j) => i !== j)
            })}><Trash2 size={14} /> Bỏ tài liệu</Button></div>)}<Button type="button" variant="secondary" className="full" disabled={extras.resources.length >= 10} onClick={() => setExtras({
            ...extras,
            resources: [...extras.resources, {
              title: '',
              url: ''
            }]
          })}><Plus size={15} /> Thêm tài liệu</Button></Card>
    </aside></form>
    {preview && <Modal wide title="Xem trước bài học" onClose={() => setPreview(false)}><h1>{form.title}</h1>{form.video_url && <video className="studio-video" controls src={form.video_url} poster={extras.thumbnail_url || undefined}>{form.captions_url && <track kind="subtitles" src={form.captions_url} srcLang="vi" label="Tiếng Việt" />}</video>}<div className="prose">{form.content.split('\n\n').map((p, i) => <p key={i}>{p}</p>)}</div><CodeBlock>{form.code}</CodeBlock><p>{form.quiz.length} câu kiểm tra nhanh</p></Modal>}
  </div>;
}
