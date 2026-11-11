import React, { useState, useRef, useEffect } from 'react';
import { Upload, RefreshCw, Check, Video, Plus, Eye } from 'lucide-react';
import { api, useData, useAction, timeCode } from './api';
import { Button, Card, Link, Field, Badge, ProgressBar, PageTitle, DataState, Modal, Empty } from './ui';
export function UploadControl({
  kind = 'video',
  onUploaded
}) {
  const [progress, setProgress] = useState(null),
    [error, setError] = useState(''),
    [name, setName] = useState(''),
    [done, setDone] = useState(false);
  const selected = useRef(null),
    request = useRef(null);
  useEffect(() => () => request.current?.abort(), []);
  const start = file => {
    if (!file) return;
    selected.current = file;
    setName(file.name);
    setDone(false);
    setError('');
    if (file.size > 500 * 1024 * 1024) {
      setError('Tệp tối đa 500 MB.');
      return;
    }
    setProgress(0);
    const xhr = new XMLHttpRequest();
    request.current = xhr;
    xhr.open('POST', '/api/manage/media');
    xhr.withCredentials = true;
    const data = new FormData();
    data.append('file', file);
    xhr.upload.onprogress = e => {
      if (e.lengthComputable) setProgress(Math.round(e.loaded / e.total * 100));
    };
    xhr.onload = () => {
      setProgress(null);
      let result;
      try {
        result = JSON.parse(xhr.responseText);
      } catch {
        result = {};
      }
      if (xhr.status >= 200 && xhr.status < 300) {
        setDone(true);
        onUploaded?.(result);
      } else setError(typeof result.detail === 'string' ? result.detail : 'Không thể tải tệp. Vui lòng thử lại.');
    };
    xhr.onerror = () => {
      setProgress(null);
      setError('Kết nối bị gián đoạn. Vui lòng thử lại.');
    };
    xhr.send(data);
  };
  return <div className={'upload-area ' + (error ? 'failed' : '')} onDragOver={e => e.preventDefault()} onDrop={e => {
    e.preventDefault();
    if (progress === null) start(e.dataTransfer.files[0]);
  }}><label><Upload size={24} /><b>{kind === 'video' ? 'Kéo thả video hoặc chọn tệp' : 'Chọn tệp phụ đề'}</b><small>{kind === 'video' ? 'MP4 / WebM · Tối đa 500 MB' : 'Phụ đề WebVTT (.vtt)'}</small><input type="file" aria-label={kind === 'video' ? 'Tải video' : 'Tải phụ đề'} disabled={progress !== null} accept={kind === 'video' ? '.mp4,.webm' : '.vtt'} onChange={e => start(e.target.files[0])} /></label>{name && <small>{name}</small>}{progress !== null && <><ProgressBar value={progress} /><small>{progress < 100 ? `Đang tải ${progress}%` : 'Đang kiểm tra tệp…'}</small></>}{done && <Badge tone="green"><Check size={14} /> Đã tải lên</Badge>}{error && <div className="notice red"><p>{error}</p><Button type="button" variant="secondary" onClick={() => start(selected.current)}>Thử lại</Button></div>}</div>;
}
export function MediaManager() {
  const r = useData('/manage/media-status'),
    lessons = useData('/manage/lessons');
  const [upload, setUpload] = useState(false),
    [kind, setKind] = useState('video'),
    [assign, setAssign] = useState(null),
    [lid, setLid] = useState('');
  const [busy, run] = useAction();
  useEffect(() => {
    if (!r.data?.some(m => m.processing.status === 'processing')) return;
    const t = setInterval(r.reload, 1500);
    return () => clearInterval(t);
  }, [r.data]);
  return <div className="page-container"><PageTitle title="Video bài giảng" description="Quản lý nguồn, trạng thái xử lý và phụ đề."><Button onClick={() => setUpload(true)}><Plus size={16} /> Tải video</Button></PageTitle><DataState resource={r}>{data => <><Card className="table-card"><div className="table-wrap"><table><thead><tr><th>Video / Phụ đề</th><th>Thời lượng</th><th>Trạng thái</th><th>Phụ đề / Bài học</th><th /></tr></thead><tbody>{data.map(m => <tr key={m.id}><td><b>{m.name}</b><small>{(m.size / 1024 / 1024).toFixed(2)} MB · {m.kind === 'video' ? 'Video' : 'VTT'}</small></td><td>{m.processing.duration ? timeCode(m.processing.duration) : '—'}</td><td>{m.processing.status === 'processing' ? <><Badge tone="blue">Đang xử lý {m.processing.progress}%</Badge><ProgressBar value={m.processing.progress} /></> : <Badge tone={m.processing.status === 'ready' ? 'green' : 'red'}>{m.processing.status === 'ready' ? 'Sẵn sàng' : 'Xử lý thất bại'}</Badge>}{m.processing.error && <small>{m.processing.error}</small>}</td><td>{m.lessons.length ? m.lessons.map(l => <div key={l.id}><Link to={'/manage/lessons?edit=' + l.id}>{l.title}</Link><small>{l.captions ? 'VI' : 'Chưa có phụ đề'}</small></div>) : <small>Chưa gắn vào bài học</small>}</td><td><div className="row wrap">{m.processing.status === 'failed' ? <Button className="small" variant="secondary" busy={busy} onClick={() => run(async () => {
                        await api(`/manage/media/${m.id}/retry`, {
                          method: 'POST'
                        });
                        r.reload();
                      })}><RefreshCw size={14} /> Thử lại</Button> : <><a className="btn secondary small" href={m.url} target="_blank" rel="noreferrer">Xem</a><Button className="small" variant="secondary" onClick={() => {
                          setAssign(m);
                          setLid('');
                        }}>Gắn bài học</Button></>}</div></td></tr>)}</tbody></table></div>{!data.length && <Empty title="Chưa có video bài giảng" />}</Card>{data.some(m => m.processing.status === 'processing') && <div className="notice blue mt24"><b>Đang xử lý video</b><p>Bạn có thể tiếp tục biên soạn lý thuyết. Video sẽ sẵn sàng sau khi kiểm tra hoàn tất.</p></div>}</>}</DataState>{upload && <Modal title="Tải học liệu" onClose={() => setUpload(false)}><Field label="Loại tệp"><select value={kind} onChange={e => setKind(e.target.value)}><option value="video">Video bài giảng</option><option value="captions">Phụ đề tiếng Việt</option></select></Field><UploadControl key={kind} kind={kind} onUploaded={() => r.reload()} /><Button className="full mt16" variant="secondary" onClick={() => setUpload(false)}>Hoàn tất</Button></Modal>}{assign && <Modal title="Gắn vào bài học" onClose={() => setAssign(null)}><p>{assign.name}</p><Field label="Chọn bài học"><select value={lid} onChange={e => setLid(e.target.value)}><option value="">Chọn bài học</option>{lessons.data?.map(l => <option key={l.id} value={l.id}>{l.title}</option>)}</select></Field><Button busy={busy} disabled={!lid} onClick={() => run(async () => {
        const l = lessons.data.find(x => x.id === Number(lid));
        await api('/manage/lessons/' + lid, {
          method: 'PUT',
          body: {
            ...l,
            [assign.kind === 'video' ? 'video_url' : 'captions_url']: assign.url
          }
        });
        setAssign(null);
        r.reload();
        lessons.reload();
      }, 'Đã gắn tệp vào bài học.')}>Lưu liên kết</Button></Modal>}</div>;
}
export function ServiceStatus() {
  const r = useData('/system/services');
  return <Card className="mt24"><h3>Dịch vụ</h3><DataState resource={r}>{items => <div className="table-wrap"><table><thead><tr><th>Dịch vụ</th><th>Trạng thái</th><th>Thông tin</th></tr></thead><tbody>{items.map(s => <tr key={s.name}><td>{s.name}</td><td><Badge tone={s.status === 'ready' ? 'green' : s.status === 'unconfigured' ? 'orange' : 'blue'}>{{
                    ready: 'Hoạt động',
                    configured: 'Đã cấu hình',
                    unconfigured: 'Chưa kết nối',
                    fallback: 'Gợi ý biên soạn',
                    local: 'Thử nghiệm cục bộ'
                  }[s.status]}</Badge></td><td>{s.description}</td></tr>)}</tbody></table></div>}</DataState></Card>;
}
