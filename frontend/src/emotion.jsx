import React, { useState, useEffect } from 'react';
import { Smile, Meh, Frown, Pause, Play, ArrowRight, Plus, Pencil, Clock } from 'lucide-react';
import { api, post, useData, useAction, dateTime, timeCode } from './api';
import { Card, Button, Link, Badge, ProgressBar, Modal, Field, PageTitle, DataState, Empty } from './ui';
import { Lines } from './charts';
const STATES = [['positive', 'Tích cực', Smile, 'green'], ['neutral', 'Bình thường', Meh, 'blue'], ['negative', 'Tiêu cực', Frown, 'red']];
export function EmotionPanel({
  value,
  onChange,
  onPreferenceChange
}) {
  const pref = useData('/emotion-preferences');
  const [busy, run] = useAction();
  const [rest, setRest] = useState(0);
  useEffect(() => {
    if (!rest) return;
    const t = setInterval(() => setRest(n => Math.max(0, n - 1)), 1000);
    return () => clearInterval(t);
  }, [rest > 0]);
  const enabled = pref.data?.enabled !== false;
  const state = value?.state || 'neutral';
  const chosen = STATES.find(x => x[0] === state) || STATES[1];
  const Icon = chosen[2];
  return <Card className="reference-emotion"><h3>Phân tích cảm xúc</h3><Badge tone="purple">{value?.source === 'heuristic' ? 'ƯỚC LƯỢNG TỪ HOẠT ĐỘNG' : 'CẢM NHẬN CỦA BẠN'}</Badge><small className="live-label">● {enabled ? 'Cập nhật từ hoạt động học' : 'Đã tạm dừng ước lượng'}</small><div className={'emotion-face ' + state}><Icon size={50} /></div><h2>{chosen[1]}</h2><p className={'emotion-message ' + state}>{state === 'negative' ? 'Bạn có muốn nghỉ ngắn 2 phút?' : state === 'positive' ? 'Bạn đang làm tốt. Tiếp tục nhé!' : 'Hãy thử chia bài thành từng bước.'}</p>
 {value?.source === 'heuristic' && value?.scores ? <div className="emotion-probabilities">{STATES.map(([s, label, I, color]) => <div key={s}><div className="row between"><small>{label}</small><b>{value.scores[s]}%</b></div><ProgressBar value={value.scores[s]} color={color} /></div>)}</div> : <p className="chart-note">Chọn cảm nhận để ghi lại trải nghiệm của bạn. Tỷ lệ ước lượng chỉ xuất hiện khi có dữ liệu hoạt động.</p>}
 <h4>Bạn đang cảm thấy thế nào?</h4><div className="emotion-choice">{STATES.map(([s, label]) => <button key={s} aria-pressed={value?.state === s} onClick={() => run(async () => onChange(await post('/emotions', {
        state: s
      })))} disabled={busy}>{label}</button>)}</div>
 <Link className="btn primary full" to="/emotions">Xem diễn biến cảm xúc <ArrowRight size={14} /></Link><Button variant="secondary" className="full mt16" onClick={() => setRest(120)}><Clock size={15} /> Nghỉ ngắn 2 phút</Button>
 <Button variant="secondary" className="full mt16" busy={busy} onClick={() => run(async () => {
      await api('/emotion-preferences', {
        method: 'PUT',
        body: {
          enabled: !enabled
        }
      });
      pref.reload();
      onPreferenceChange?.();
    })}>{enabled ? <Pause size={14} /> : <Play size={14} />} {enabled ? 'Tạm dừng phân tích' : 'Tiếp tục phân tích'}</Button><small className="mt16">Chỉ là gợi ý theo quy tắc; bạn có thể xác nhận lại. Không dùng để chấm điểm năng lực.</small>
 {rest > 0 && <Modal title="Nghỉ ngắn một chút" onClose={() => setRest(0)}><div className="break-clock">{timeCode(rest)}</div><p className="center">Rời mắt khỏi màn hình, thả lỏng vai và hít thở nhẹ nhàng. Bản nháp của bạn vẫn được lưu.</p><Button className="full" onClick={() => setRest(0)}>Tiếp tục học</Button></Modal>}</Card>;
}
export function EmotionDiary() {
  const r = useData('/emotions');
  const [editing, setEditing] = useState(null),
    [form, setForm] = useState({
      state: 'neutral',
      body: ''
    }),
    [day, setDay] = useState('');
  const [busy, run] = useAction();
  const open = e => {
    setEditing(e || {});
    setForm({
      state: e?.state || 'neutral',
      body: e?.body || ''
    });
  };
  return <div className="page-container"><PageTitle title="Diễn biến cảm xúc" description="Tự theo dõi trải nghiệm trong buổi học."><input aria-label="Lọc ngày cảm xúc" type="date" value={day} onChange={e => setDay(e.target.value)} /><Button onClick={() => open()}><Plus size={16} /> Thêm ghi nhận</Button></PageTitle><DataState resource={r}>{data => {
        const rows = data.filter(e => !day || new Date(e.created_at + 'Z').toLocaleDateString('en-CA') === day);
        return <><Card><h3>Thay đổi trong buổi học</h3>{rows.length ? <Lines data={[...rows].reverse().map(e => ({
              date: new Date(e.created_at + 'Z').toLocaleTimeString('vi-VN', {
                hour: '2-digit',
                minute: '2-digit'
              }),
              value: e.state === 'positive' ? 3 : e.state === 'neutral' ? 2 : 1
            }))} series={[{
              key: 'value',
              name: '1 Tiêu cực · 2 Bình thường · 3 Tích cực',
              color: '#8b5cf6'
            }]} /> : <Empty title="Chưa có ghi nhận trong thời gian này" />}<div className="row wrap">{STATES.map(([s, label, I, color]) => <Badge key={s} tone={color}>{label}: {rows.filter(e => e.state === s).length}</Badge>)}</div></Card><Card className="mt24"><h3>Ghi nhận của bạn</h3>{rows.map(e => {
              const v = STATES.find(x => x[0] === e.state);
              const I = v[2];
              return <div className="diary-row" key={e.id}><I size={28} /><div><b>{v[1]}</b><small>{dateTime(e.created_at)} · {e.source === 'heuristic' ? 'Ước lượng theo quy tắc' : 'Bạn tự xác nhận'}</small><p>{e.body || 'Chưa thêm ghi chú.'}</p></div><Button variant="secondary" onClick={() => open(e)}><Pencil size={14} /> Chỉnh cảm xúc đã ghi</Button></div>;
            })}</Card></>;
      }}</DataState>{editing && <Modal title={editing.id ? 'Chỉnh ghi nhận' : 'Thêm ghi nhận'} onClose={() => setEditing(null)}><form onSubmit={e => {
        e.preventDefault();
        run(async () => {
          if (editing.id) await api('/emotions/' + editing.id, {
            method: 'PATCH',
            body: form
          });else await post('/emotions', form);
          setEditing(null);
          r.reload();
        });
      }}><Field label="Cảm nhận"><select value={form.state} onChange={e => setForm({
            ...form,
            state: e.target.value
          })}>{STATES.map(([s, l]) => <option key={s} value={s}>{l}</option>)}</select></Field><Field label="Ghi nhận của bạn"><textarea rows={4} maxLength={2000} value={form.body} onChange={e => setForm({
            ...form,
            body: e.target.value
          })} placeholder="Điều gì khiến bạn cảm thấy như vậy?" /></Field><Button busy={busy}>Lưu ghi nhận</Button></form></Modal>}</div>;
}
