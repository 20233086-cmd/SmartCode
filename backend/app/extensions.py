"""Additional learning flows. New tables are additive, preserving existing databases."""
import os, json, secrets, hashlib, smtplib, shutil, subprocess, time
from datetime import timedelta
from email.message import EmailMessage
from pathlib import Path
from typing import Literal
from fastapi import APIRouter, Depends, HTTPException, Request, BackgroundTasks
from pydantic import BaseModel, Field
from sqlalchemy import text
from .db import get_db, Session
from .models import *
from .security import current, staff, admin, hash_password
from .services import serialize
from . import config
from .main import required, enrolled, own_room, own_course, _attempts

router = APIRouter(prefix='/api')

class ResetRequest(BaseModel):
    email: str = Field(min_length=5, max_length=190)
class ResetConfirm(BaseModel):
    token: str = Field(min_length=32, max_length=200)
    password: str = Field(min_length=8, max_length=128)

@router.post('/auth/forgot-password')
def forgot(data: ResetRequest, request: Request, db=Depends(get_db)):
    key = 'reset:' + request.client.host
    ts = time.monotonic()
    _attempts[key] = [v for v in _attempts[key] if ts-v < 60]
    if len(_attempts[key]) >= 5:
        raise HTTPException(429, 'Vui lòng chờ một phút rồi thử lại.')
    _attempts[key].append(ts)
    user = db.query(User).filter_by(email=data.email.strip().lower(), active=True).first()
    if user:
        raw = secrets.token_urlsafe(32)
        db.query(PasswordReset).filter_by(user_id=user.id, used=False).update({'used': True})
        db.add(PasswordReset(user_id=user.id, token_hash=hashlib.sha256(raw.encode()).hexdigest(), expires_at=now()+timedelta(minutes=30)))
        db.commit()
        base = os.getenv('PUBLIC_APP_URL', 'http://127.0.0.1:8000').rstrip('/')
        link = base + '/#/reset-password?token=' + raw
        msg = EmailMessage()
        msg['Subject'] = 'SmartCode - Khôi phục mật khẩu'
        msg['From'] = os.getenv('SMTP_FROM', 'SmartCode <noreply@smartcode.local>')
        msg['To'] = user.email
        msg.set_content(f'Xin chào {user.name},\n\nĐặt lại mật khẩu tại: {link}\nLiên kết dùng một lần và hết hạn sau 30 phút.\nNếu bạn không yêu cầu, hãy bỏ qua thư này.\n')
        if os.getenv('SMTP_HOST'):
            try:
                with smtplib.SMTP(os.environ['SMTP_HOST'], int(os.getenv('SMTP_PORT', '587')), timeout=10) as smtp:
                    if os.getenv('SMTP_TLS', 'true') == 'true': smtp.starttls()
                    if os.getenv('SMTP_USER'): smtp.login(os.environ['SMTP_USER'], os.environ.get('SMTP_PASSWORD', ''))
                    smtp.send_message(msg)
            except (OSError, smtplib.SMTPException):
                raise HTTPException(503, 'Dịch vụ gửi thư đang bận. Vui lòng thử lại sau.')
        else:
            # Development mailbox, accessible only from the server filesystem, never an API.
            outbox = Path(os.getenv('MAIL_OUTBOX', str(config.DATA/'mail_outbox')))
            outbox.mkdir(parents=True, exist_ok=True)
            path = outbox/(secrets.token_hex(12)+'.eml')
            with os.fdopen(os.open(path, os.O_WRONLY|os.O_CREAT|os.O_EXCL, 0o600), 'w', encoding='utf-8') as f:
                f.write(msg.as_string())
    return {'message': 'Nếu email đã đăng ký, hướng dẫn khôi phục sẽ được gửi đến hộp thư của bạn.'}

@router.post('/auth/reset-password')
def reset(data: ResetConfirm, db=Depends(get_db)):
    row = db.query(PasswordReset).filter_by(token_hash=hashlib.sha256(data.token.encode()).hexdigest(), used=False).first()
    if not row or row.expires_at <= now():
        raise HTTPException(400, 'Liên kết đã hết hạn hoặc đã được sử dụng.')
    user = required(db, User, row.user_id)
    if not user.active: raise HTTPException(400, 'Tài khoản không hoạt động.')
    # Atomic claim prevents concurrent reuse of a valid reset link.
    changed = db.query(PasswordReset).filter_by(id=row.id, used=False).update({'used':True})
    if changed != 1: raise HTTPException(400, 'Liên kết đã được sử dụng.')
    user.password_hash = hash_password(data.password)
    db.commit()
    return {'ok':True}

SURVEY = [
 {'title':'Bạn đã học lập trình trước đây chưa?', 'options':['Tôi mới bắt đầu.','Tôi đã học một số kiến thức cơ bản.','Tôi đã xây dựng một dự án nhỏ.']},
 {'title':'Mục tiêu học của bạn là gì?', 'options':['Hiểu kiến thức nền tảng.','Cải thiện kỹ năng làm bài tập.','Chuẩn bị xây dựng dự án.']},
 {'title':'Bạn thường học lập trình như thế nào?', 'options':['Xem video và đọc lý thuyết trước.','Thực hành và tìm hiểu khi gặp khó.','Kết hợp lý thuyết với thực hành.']},
 {'title':'Bạn hiểu biến và kiểu dữ liệu đến mức nào?', 'options':['Tôi chưa biết rõ.','Tôi có thể khai báo và sử dụng biến.','Tôi có thể giải thích và xử lý ép kiểu.']},
 {'title':'Bạn đã từng dùng vòng lặp để xử lý một danh sách chưa?', 'options':['Chưa, tôi mới bắt đầu học lập trình.','Đã sử dụng for và while trong bài tập.','Có thể kết hợp vòng lặp với mảng và hàm.']},
 {'title':'Bạn có thể dành bao nhiêu thời gian mỗi ngày?', 'options':['Khoảng 15 phút.','Khoảng 30 phút.','Khoảng 60 phút trở lên.']},
 {'title':'Khi gặp lỗi, bạn thường làm gì?', 'options':['Cần hướng dẫn từng bước.','Đọc thông báo lỗi và thử sửa.','Tự kiểm tra bằng nhiều trường hợp thử.']},
]
class SurveyIn(BaseModel):
    answers: list[int] = Field(min_length=7, max_length=7)
@router.get('/courses/{cid}/survey')
def survey(cid:int, u=Depends(current), db=Depends(get_db)):
    enrolled(db,u,cid)
    saved=db.query(LearnerSurvey).filter_by(user_id=u.id,course_id=cid).first()
    return {'questions':SURVEY,'answers':saved.answers if saved else []}
@router.put('/courses/{cid}/survey')
def save_survey(cid:int,data:SurveyIn,u=Depends(current),db=Depends(get_db)):
    enrolled(db,u,cid)
    if any(x not in [0,1,2] for x in data.answers): raise HTTPException(400,'Lựa chọn không hợp lệ.')
    saved=db.query(LearnerSurvey).filter_by(user_id=u.id,course_id=cid).first()
    if not saved: saved=LearnerSurvey(user_id=u.id,course_id=cid);db.add(saved)
    saved.answers=data.answers;db.commit()
    return serialize(saved)

def assessment_payload(a,db):
    subs=db.query(Submission).join(SubmissionContext,SubmissionContext.submission_id==Submission.id).filter(SubmissionContext.assessment_id==a.id).order_by(Submission.created_at.desc()).all()
    exercises=[required(db,Exercise,eid) for eid in a.exercise_ids]
    latest={}
    for s in subs:
        latest.setdefault(s.exercise_id,serialize(s,('code','results')))
    p=db.query(Placement).filter_by(user_id=a.user_id,course_id=a.course_id).order_by(Placement.id.desc()).first()
    missed=next((e for e in exercises if latest.get(e.id,{}).get('status')!='AC'),exercises[-1])
    return {**serialize(a),'server_now':now(),'ended':bool(a.finished_at or now()>=a.expires_at),
            'exercises':[{'id':e.id,'title':e.title,'skill':e.skill,'result':latest.get(e.id)} for e in exercises],
            'solved':sum(v.get('status')=='AC' for v in latest.values()),'theory_scores':p.scores if p else {},
            'recommended_lesson':missed.lesson_id}
@router.post('/courses/{cid}/assessments')
def start_assessment(cid:int,u=Depends(current),db=Depends(get_db)):
    enrolled(db,u,cid)
    active=db.query(AssessmentAttempt).filter_by(user_id=u.id,course_id=cid,finished_at=None).filter(AssessmentAttempt.expires_at>now()).first()
    if active:return assessment_payload(active,db)
    exercises=db.query(Exercise).filter_by(course_id=cid).order_by(Exercise.lesson_id,Exercise.id).all()
    selected=[];seen=set()
    for e in exercises:
        if e.skill not in seen: selected.append(e.id);seen.add(e.skill)
        if len(selected)==3:break
    if not selected:raise HTTPException(400,'Khóa học chưa có bài thực hành đầu vào.')
    a=AssessmentAttempt(user_id=u.id,course_id=cid,exercise_ids=selected,expires_at=now()+timedelta(minutes=20),drafts={})
    db.add(a);db.commit();return assessment_payload(a,db)
def own_assessment(db,u,aid):
    a=required(db,AssessmentAttempt,aid)
    if a.user_id!=u.id:raise HTTPException(403,'Bạn không sở hữu lượt đánh giá này.')
    return a
@router.get('/assessments/{aid}')
def assessment(aid:int,u=Depends(current),db=Depends(get_db)):
    return assessment_payload(own_assessment(db,u,aid),db)
@router.post('/assessments/{aid}/finish')
def finish_assessment(aid:int,u=Depends(current),db=Depends(get_db)):
    a=own_assessment(db,u,aid)
    if not a.finished_at:a.finished_at=min(now(),a.expires_at);db.commit()
    return assessment_payload(a,db)

def check_context(db,u,eid,data):
    aid=getattr(data,'assessment_id',None);sid=getattr(data,'session_id',None)
    if aid and sid:raise HTTPException(400,'Chỉ chọn một chế độ thực hành.')
    if aid:
        a=own_assessment(db,u,aid)
        if a.finished_at or now()>=a.expires_at:raise HTTPException(409,'Đánh giá đã kết thúc. Bản nháp trước đó vẫn được lưu.')
        if eid not in a.exercise_ids:raise HTTPException(400,'Bài không thuộc đánh giá.')
    elif db.query(AssessmentAttempt).filter_by(user_id=u.id,finished_at=None).filter(AssessmentAttempt.expires_at>now()).all():
        if any(eid in a.exercise_ids for a in db.query(AssessmentAttempt).filter_by(user_id=u.id,finished_at=None).filter(AssessmentAttempt.expires_at>now())):
            raise HTTPException(409,'Mở bài từ lượt đánh giá đang diễn ra để tiếp tục.')
    if sid:
        s=required(db,ClassSession,sid)
        if not db.query(Member).filter_by(class_id=s.class_id,user_id=u.id).first():raise HTTPException(403,'Bạn chưa tham gia lớp.')
        if s.status!='open':raise HTTPException(409,'Buổi học đã kết thúc.')
        if eid not in s.exercise_ids:raise HTTPException(400,'Bài không thuộc buổi học.')
    return aid,sid

class GroupIn(BaseModel):
    groups: dict[str,list[int]]
    topic: str = Field(default='', max_length=100)
    teaching_date: str = Field(default='', max_length=40)
@router.get('/classes/{rid}/sessions/{sid}/details')
def session_details(rid:int,sid:int,u=Depends(staff),db=Depends(get_db)):
    room=own_room(db,u,rid);s=required(db,ClassSession,sid)
    if s.class_id!=rid:raise HTTPException(404)
    detail=db.get(SessionDetails,sid)
    groups=detail.groups if detail and detail.groups else {k:[eid for eid in s.exercise_ids if required(db,Exercise,eid).difficulty==k] for k in ['easy','medium','hard']}
    return {**serialize(s),'classroom':serialize(room),'groups':groups,'topic':detail.topic if detail else '', 'teaching_date':detail.teaching_date if detail else ''}
@router.put('/classes/{rid}/sessions/{sid}/groups')
def save_groups(rid:int,sid:int,data:GroupIn,u=Depends(staff),db=Depends(get_db)):
    room=own_room(db,u,rid);s=required(db,ClassSession,sid)
    if s.class_id!=rid:raise HTTPException(404)
    if set(data.groups)-{'easy','medium','hard'}:raise HTTPException(400,'Nhóm không hợp lệ.')
    ids=[v for group in data.groups.values() for v in group]
    if len(ids)!=len(set(ids)) or len(ids)>60:raise HTTPException(400,'Mỗi bài chỉ được gán vào một nhóm; tối đa 60 bài.')
    for eid in ids:
        if required(db,Exercise,eid).course_id!=room.course_id:raise HTTPException(400,'Bài tập phải thuộc khóa học của lớp.')
    d=db.get(SessionDetails,sid)
    if not d:d=SessionDetails(session_id=sid);db.add(d)
    d.groups=data.groups;d.topic=data.topic;d.teaching_date=data.teaching_date
    s.exercise_ids=ids;db.commit();return session_details(rid,sid,u,db)

def session_report_data(db,u,rid,sid):
    own_room(db,u,rid);s=required(db,ClassSession,sid)
    if s.class_id!=rid:raise HTTPException(404)
    allsubs=db.query(Submission).join(SubmissionContext,SubmissionContext.submission_id==Submission.id).filter(SubmissionContext.session_id==sid).order_by(Submission.created_at.desc()).all()
    members=db.query(User).join(Member,Member.user_id==User.id).filter(Member.class_id==rid).all()
    ids=s.exercise_ids
    rows=[]
    for member in members:
        subs=[a for a in allsubs if a.user_id==member.id and a.exercise_id in ids]
        solved=len({a.exercise_id for a in subs if a.status=='AC'})
        score=round(10*solved/len(ids),1) if ids else 0
        rows.append({'id':member.id,'name':member.name,'solved':solved,'total':len(ids),'attempts':len(subs),'score':score,'last_status':subs[0].status if subs else 'Chưa làm','group':'Cần hỗ trợ' if score<5 else 'Đạt','submissions':[serialize(a,('code','results')) for a in subs]})
    exercise_names={e.id:e.title for e in db.query(Exercise).filter(Exercise.id.in_(ids))}
    names={m.id:m.name for m in members}
    rowsubs=[{**serialize(a,('code','results')),'student_name':names.get(a.user_id,''),'exercise_title':exercise_names.get(a.exercise_id,'')} for a in allsubs if a.exercise_id in ids and a.user_id in names]
    attended=sum(r['attempts']>0 for r in rows)
    done=sum(r['solved']==len(ids) and bool(ids) for r in rows)
    detail=db.get(SessionDetails,sid)
    return {'session':serialize(s),'students':rows,'submissions':rowsubs,'attended':attended,'completed':done,'average':round(sum(r['score'] for r in rows)/len(rows),1) if rows else 0,
            'summary':f'{attended}/{len(rows)} học viên đã nộp bài; {done} hoàn thành toàn bộ. {sum(r["group"]=="Cần hỗ trợ" for r in rows)} học viên cần hỗ trợ thêm.',
            'summary_note':detail.summary_note if detail else '', 'exercises':[{'id':k,'title':v} for k,v in exercise_names.items()]}
@router.get('/classes/{rid}/sessions/{sid}/report')
def session_report(rid:int,sid:int,u=Depends(staff),db=Depends(get_db)):
    return session_report_data(db,u,rid,sid)
class CommentIn(BaseModel):
    body:str=Field(max_length=5000)
@router.put('/classes/{rid}/sessions/{sid}/summary')
def summary_note(rid:int,sid:int,data:CommentIn,u=Depends(staff),db=Depends(get_db)):
    session_details(rid,sid,u,db)
    d=db.get(SessionDetails,sid)
    if not d:d=SessionDetails(session_id=sid,groups={});db.add(d)
    d.summary_note=data.body;db.commit();return {'ok':True}
@router.get('/classes/{rid}/students/{uid}')
def student_detail(rid:int,uid:int,u=Depends(staff),db=Depends(get_db)):
    room=own_room(db,u,rid)
    if not db.query(Member).filter_by(class_id=rid,user_id=uid).first():raise HTTPException(404)
    person=required(db,User,uid);exs=db.query(Exercise).filter_by(course_id=room.course_id).all();ids=[e.id for e in exs]
    subs=db.query(Submission).filter(Submission.user_id==uid,Submission.exercise_id.in_(ids)).order_by(Submission.created_at.desc()).all()
    hints=db.query(Hint).filter(Hint.user_id==uid,Hint.exercise_id.in_(ids)).count()
    rows=[]
    for ex in exs:
        ss=[s for s in subs if s.exercise_id==ex.id];ac=next((s for s in ss if s.status=='AC'),None)
        recent=ac or (ss[0] if ss else None)
        rows.append({'id':ex.id,'title':ex.title,'skill':ex.skill,'attempts':len(ss),'status':recent.status if recent else 'Chưa làm','passed':recent.passed if recent else 0,'total':len(ex.tests),'lesson_id':ex.lesson_id,'submission_id':recent.id if recent else None})
    note=db.query(StudentComment).filter_by(class_id=rid,user_id=uid).first()
    return {'id':uid,'name':person.name,'classroom':serialize(room),'exercises':rows,'hints':hints,'last_active':subs[0].created_at if subs else None,'comment':note.body if note else '', 'solved':sum(r['status']=='AC' for r in rows)}
@router.put('/classes/{rid}/students/{uid}/comment')
def student_comment(rid:int,uid:int,data:CommentIn,u=Depends(staff),db=Depends(get_db)):
    student_detail(rid,uid,u,db)
    note=db.query(StudentComment).filter_by(class_id=rid,user_id=uid).first()
    if not note:note=StudentComment(class_id=rid,user_id=uid,teacher_id=u.id);db.add(note)
    note.body=data.body;note.teacher_id=u.id;db.commit();return {'ok':True}

class PreferenceIn(BaseModel):
    enabled:bool
@router.get('/emotion-preferences')
def emotion_pref(u=Depends(current),db=Depends(get_db)):
    p=db.get(EmotionPreference,u.id);return {'enabled':p.enabled if p else True}
@router.put('/emotion-preferences')
def set_emotion_pref(data:PreferenceIn,u=Depends(current),db=Depends(get_db)):
    p=db.get(EmotionPreference,u.id)
    if not p:p=EmotionPreference(user_id=u.id);db.add(p)
    p.enabled=data.enabled;db.commit();return {'enabled':p.enabled}
class EmotionEdit(BaseModel):
    state:Literal['positive','neutral','negative']
    body:str=Field(default='',max_length=2000)
@router.patch('/emotions/{eid}')
def edit_emotion(eid:int,data:EmotionEdit,u=Depends(current),db=Depends(get_db)):
    e=required(db,Emotion,eid)
    if e.user_id!=u.id:raise HTTPException(403)
    e.state=data.state;e.source='self-report';e.scores=None
    note=db.get(EmotionNote,eid)
    if not note:note=EmotionNote(emotion_id=eid);db.add(note)
    note.body=data.body;db.commit();return {**serialize(e),'body':note.body}


def process_media(mid):
    with Session() as db:
        m=db.get(Media,mid);p=db.get(MediaProcessing,mid)
        if not m or not p:return
        p.status='processing';p.progress=20;p.error='';db.commit()
        try:
            path=config.UPLOADS/m.stored_name
            if not path.is_file() or path.stat().st_size==0:raise ValueError('Tệp trống hoặc không tồn tại.')
            with path.open('rb') as stream: head=stream.read(256)
            if m.kind=='captions' and not head.lstrip(b'\xef\xbb\xbf').startswith(b'WEBVTT'):raise ValueError('Phụ đề cần có tiêu đề WEBVTT.')
            if m.kind=='video':
                ext=path.suffix.lower()
                if ext=='.mp4' and b'ftyp' not in head[:40]:raise ValueError('Tệp không phải MP4 hợp lệ.')
                if ext=='.webm' and not head.startswith(b'\x1aE\xdf\xa3'):raise ValueError('Tệp không phải WebM hợp lệ.')
                p.progress=60;db.commit()
                probe=shutil.which('ffprobe')
                if probe:
                    result=subprocess.run([probe,'-v','error','-show_entries','format=duration','-of','json',str(path)],capture_output=True,text=True,timeout=30)
                    if result.returncode:raise ValueError('Không thể đọc video. Hãy kiểm tra hoặc tải lại tệp.')
                    val=json.loads(result.stdout).get('format',{}).get('duration')
                    p.duration=float(val) if val else None
            p.status='ready';p.progress=100
        except Exception as error:
            p.status='failed';p.error=str(error)[:500];p.progress=0
        db.commit()
def media_status(m,db):
    p=db.get(MediaProcessing,m.id)
    url=f'/api/media/{m.id}'
    linked=db.query(Lesson).filter((Lesson.video_url==url)|(Lesson.captions_url==url)).all()
    return {**serialize(m,('stored_name',)),'url':f'/api/media/{m.id}','processing':serialize(p) if p else {'status':'ready','progress':100,'duration':None,'error':''},'lessons':[{'id':l.id,'title':l.title,'captions':bool(l.captions_url)} for l in linked]}
@router.get('/manage/media-status')
def media_statuses(u=Depends(staff),db=Depends(get_db)):
    q=db.query(Media)
    if u.role!='admin':q=q.filter_by(owner_id=u.id)
    return [media_status(m,db) for m in q.order_by(Media.id.desc())]
@router.post('/manage/media/{mid}/retry')
def retry_media(mid:int,bg:BackgroundTasks,u=Depends(staff),db=Depends(get_db)):
    m=required(db,Media,mid)
    if m.owner_id!=u.id and u.role!='admin':raise HTTPException(403)
    p=db.get(MediaProcessing,mid)
    if not p:p=MediaProcessing(media_id=mid);db.add(p)
    p.status='processing';p.progress=0;p.error='';db.commit();bg.add_task(process_media,mid)
    return {'ok':True}
class ExtrasIn(BaseModel):
    thumbnail_url:str=Field(default='',max_length=2000)
    resources:list[dict]=Field(default_factory=list,max_length=10)
@router.get('/lessons/{lid}/extras')
def extras(lid:int,u=Depends(current),db=Depends(get_db)):
    l=required(db,Lesson,lid);enrolled(db,u,l.course_id)
    d=db.get(LessonExtras,lid);return serialize(d) if d else {'thumbnail_url':'','resources':[]}
@router.put('/manage/lessons/{lid}/extras')
def save_extras(lid:int,data:ExtrasIn,u=Depends(staff),db=Depends(get_db)):
    l=required(db,Lesson,lid);own_course(db,u,l.course_id)
    urls=[data.thumbnail_url]+[str(r.get('url','')) for r in data.resources]
    if any(v and not v.startswith('https://') for v in urls):raise HTTPException(400,'Tài nguyên cần dùng liên kết HTTPS.')
    d=db.get(LessonExtras,lid)
    if not d:d=LessonExtras(lesson_id=lid);db.add(d)
    d.thumbnail_url=data.thumbnail_url;d.resources=data.resources;db.commit();return serialize(d)
@router.get('/system/services')
def service_status(u=Depends(admin),db=Depends(get_db)):
    db.execute(text('SELECT 1'))
    return [{'name':'Chấm bài tự động','status':'configured' if os.getenv('JUDGE0_URL') else 'unconfigured','description':'Đã cấu hình endpoint; trạng thái kết nối được kiểm tra khi chạy bài.' if os.getenv('JUDGE0_URL') else 'Chưa kết nối bộ chấm.'},
            {'name':'Gợi ý AI','status':'configured' if os.getenv('OLLAMA_URL') else 'fallback','description':'Đã cấu hình Ollama.' if os.getenv('OLLAMA_URL') else 'Đang dùng gợi ý do giảng viên biên soạn.'},
            {'name':'Cơ sở dữ liệu','status':'ready','description':'Kết nối và truy vấn thành công.'},
            {'name':'Gửi thư khôi phục','status':'configured' if os.getenv('SMTP_HOST') else 'local','description':'Đã cấu hình SMTP.' if os.getenv('SMTP_HOST') else 'Hộp thư thử nghiệm cục bộ.'}]
@router.get('/analytics/benchmark')
def benchmark(course_id:int|None=None,period:int=90,u=Depends(current),db=Depends(get_db)):
    since=now()-timedelta(days=max(7,min(period,90)))
    q=db.query(Submission).join(Exercise,Exercise.id==Submission.exercise_id).filter(Submission.created_at>=since,Submission.status=='AC',Submission.work_seconds>0)
    if course_id:enrolled(db,u,course_id);q=q.filter(Exercise.course_id==course_id)
    first={}
    for s in q.order_by(Submission.created_at):first.setdefault((s.user_id,s.exercise_id),s.work_seconds)
    mine=[v for (uid,eid),v in first.items() if uid==u.id]
    ids={eid for (uid,eid) in first if uid==u.id}
    peers=[v for (uid,eid),v in first.items() if uid!=u.id and eid in ids]
    a=sum(mine)/len(mine)/60 if mine else None;b=sum(peers)/len(peers)/60 if len(peers)>=3 else None
    return {'learner_minutes':round(a,1) if a else None,'reference_minutes':round(b,1) if b else None,'sample_count':len(peers),'percent':round((b-a)/b*100) if a and b else None}

class LessonDraftIn(BaseModel):
    course_id: int
    payload: dict

@router.get('/manage/lesson-drafts/{key}')
def lesson_draft(key:str,u=Depends(staff),db=Depends(get_db)):
    d=db.query(LessonDraft).filter_by(user_id=u.id,draft_key=key).first()
    if d: own_course(db,u,d.course_id)
    return serialize(d) if d else {'payload':None}

@router.put('/manage/lesson-drafts/{key}')
def save_lesson_draft(key:str,data:LessonDraftIn,u=Depends(staff),db=Depends(get_db)):
    own_course(db,u,data.course_id)
    if len(key)>80 or len(json.dumps(data.payload,ensure_ascii=False))>200000:
        raise HTTPException(400,'Bản nháp quá lớn.')
    d=db.query(LessonDraft).filter_by(user_id=u.id,draft_key=key).first()
    if not d: d=LessonDraft(user_id=u.id,draft_key=key);db.add(d)
    d.course_id=data.course_id;d.payload=data.payload;d.updated_at=now();db.commit()
    return serialize(d)

@router.delete('/manage/lesson-drafts/{key}')
def delete_lesson_draft(key:str,u=Depends(staff),db=Depends(get_db)):
    d=db.query(LessonDraft).filter_by(user_id=u.id,draft_key=key).first()
    if d: own_course(db,u,d.course_id);db.delete(d);db.commit()
    return {'ok':True}
