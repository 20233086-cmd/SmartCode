"""Regression tests for the learning and classroom flows from the reference pack."""
import re
from datetime import timedelta
from email import policy
from email.parser import BytesParser
from app import main
from app.db import Session
from app.models import AssessmentAttempt, PasswordReset, now, User, Lesson, SubmissionContext, ClassSession
from app.security import hash_password
from conftest import login

async def accepted(code, language, tests, *args):
    return [dict(passed=True,status='AC',hidden=t.get('hidden',False),stdout='5',stderr='',time='0.01',memory=1024) for t in tests]

def request_reset(client,tmp_path,monkeypatch):
    monkeypatch.delenv('SMTP_HOST',raising=False)
    monkeypatch.setenv('MAIL_OUTBOX',str(tmp_path))
    r=client.post('/api/auth/forgot-password',json={'email':'learner@smartcode.local'})
    assert r.status_code==200 and 'token' not in r.json()
    msg=BytesParser(policy=policy.default).parsebytes(next(tmp_path.glob('*.eml')).read_bytes())
    return re.search(r'token=([A-Za-z0-9_-]+)',msg.get_content()).group(1)

def test_reset_single_use_revokes_old_session(learner,tmp_path,monkeypatch):
    old=learner.cookies.get('sc_session');raw=request_reset(learner,tmp_path,monkeypatch)
    with Session() as db: assert db.query(PasswordReset).first().token_hash!=raw
    data={'token':raw,'password':'Updated@123'}
    assert learner.post('/api/auth/reset-password',json=data).status_code==200
    assert learner.get('/api/auth/me',headers={'Authorization':'Bearer '+old}).status_code==401
    assert learner.post('/api/auth/reset-password',json=data).status_code==400
    assert learner.post('/api/auth/login',json={'email':'learner@smartcode.local','password':'Updated@123'}).status_code==200

def test_reset_expiry_generic_unknown_email(client,tmp_path,monkeypatch):
    raw=request_reset(client,tmp_path,monkeypatch)
    with Session() as db:
        db.query(PasswordReset).first().expires_at=now()-timedelta(seconds=1);db.commit()
    assert client.post('/api/auth/reset-password',json={'token':raw,'password':'Updated@123'}).status_code==400
    r=client.post('/api/auth/forgot-password',json={'email':'unknown@example.com'})
    assert r.status_code==200 and len(list(tmp_path.glob('*.eml')))==1

def test_password_change_refreshes_this_session_only(learner):
    old=learner.cookies.get('sc_session')
    assert learner.post('/api/auth/password',json={'old_password':'SmartCode@123','new_password':'Updated@123'}).status_code==200
    assert learner.get('/api/auth/me').status_code==200
    assert learner.get('/api/auth/me',headers={'Authorization':'Bearer '+old}).status_code==401

def test_survey_validates_persists_and_requires_enrollment(learner):
    data=learner.get('/api/courses/1/survey').json()
    assert len(data['questions'])==7 and data['answers']==[]
    assert learner.put('/api/courses/1/survey',json={'answers':[0]}).status_code==422
    assert learner.put('/api/courses/1/survey',json={'answers':[9]*7}).status_code==400
    answers=[0,1,2,0,1,2,0]
    assert learner.put('/api/courses/1/survey',json={'answers':answers}).status_code==200
    assert learner.get('/api/courses/1/survey').json()['answers']==answers
    learner.post('/api/auth/register',json={'name':'Test User','email':'fresh@example.com','password':'Password@123'})
    assert learner.get('/api/courses/1/survey').status_code==403

def test_assessment_resume_no_hint_deadline_and_submission(learner,monkeypatch):
    a=learner.post('/api/courses/1/assessments').json();aid=a['id'];eid=a['exercises'][0]['id']
    assert len(a['exercises'])==3 and learner.post('/api/courses/1/assessments').json()['id']==aid
    assert learner.post(f'/api/exercises/{eid}/hint',json={'code':'','level':1}).status_code==403
    assert learner.post(f'/api/exercises/{eid}/submit',json={'code':''}).status_code==409
    payload={'assessment_id':aid,'code':'assessment code','active_seconds':12}
    assert learner.put(f'/api/exercises/{eid}/draft',json=payload).status_code==200
    assert learner.get(f'/api/assessments/{aid}').json()['drafts'][str(eid)]=='assessment code'
    monkeypatch.setattr(main,'judge',accepted)
    assert learner.post(f'/api/exercises/{eid}/submit',json=payload).status_code==200
    assert learner.get(f'/api/assessments/{aid}').json()['solved']==1
    with Session() as db:
        assert db.query(SubmissionContext).first().assessment_id==aid
        db.get(AssessmentAttempt,aid).expires_at=now()-timedelta(seconds=1);db.commit()
    assert learner.put(f'/api/exercises/{eid}/draft',json=payload).status_code==409
    assert learner.post(f'/api/exercises/{eid}/run',json=payload).status_code==409
    assert learner.get(f'/api/assessments/{aid}').json()['ended'] is True
    assert learner.post(f'/api/assessments/{aid}/finish').status_code==200
    assert learner.post(f'/api/assessments/{aid}/finish').status_code==200

def test_assessment_ownership_and_exercise_membership(learner):
    a=learner.post('/api/courses/1/assessments').json()
    assert learner.put('/api/exercises/20/draft',json={'code':'x','assessment_id':a['id']}).status_code==400
    login(learner,'teacher')
    assert learner.get(f'/api/assessments/{a["id"]}').status_code==403
    assert learner.post(f'/api/assessments/{a["id"]}/finish').status_code==403

def test_groups_and_reports_are_session_scoped(learner,monkeypatch):
    login(learner,'teacher');path='/api/classes/1/sessions/1/groups'
    assert learner.put(path,json={'groups':{'easy':[1],'hard':[1]}}).status_code==400
    assert learner.put(path,json={'groups':{'easy':[21]}}).status_code==400
    assert learner.put(path,json={'groups':{'easy':[1,2],'medium':[3],'hard':[]},'topic':'Test'}).status_code==200
    assert learner.get('/api/classes').json()[0]['sessions'][0]['groups']['easy']==[1,2]
    login(learner,'learner');monkeypatch.setattr(main,'judge',accepted)
    assert learner.post('/api/exercises/1/submit',json={'code':'outside session'}).status_code==200
    assert learner.post('/api/exercises/2/submit',json={'code':'session work','session_id':1}).status_code==200
    assert learner.post('/api/exercises/4/submit',json={'code':'wrong task','session_id':1}).status_code==400
    login(learner,'teacher');report=learner.get('/api/classes/1/sessions/1/report').json()
    assert len(report['submissions'])==1 and report['students'][0]['solved']==1
    assert learner.put('/api/classes/1/sessions/1/summary',json={'body':'Cần ôn thêm vòng lặp.'}).status_code==200
    assert learner.get('/api/classes/1/sessions/1/report').json()['summary_note']=='Cần ôn thêm vòng lặp.'
    with Session() as db: db.get(ClassSession,1).status='closed';db.commit()
    login(learner,'learner')
    assert learner.post('/api/exercises/2/submit',json={'code':'late','session_id':1}).status_code==409

def test_student_comments_and_report_permissions(learner):
    assert learner.get('/api/classes/1/sessions/1/report').status_code==403
    login(learner,'teacher')
    assert learner.put('/api/classes/1/students/1/comment',json={'body':'Tiếp tục luyện tập.'}).status_code==200
    assert learner.get('/api/classes/1/students/1').json()['comment']=='Tiếp tục luyện tập.'
    assert learner.get('/api/classes/1/students/999').status_code==404
    with Session() as db:
        db.add(User(name='Other teacher',email='other@example.com',password_hash=hash_password('Password@123'),role='teacher'));db.commit()
    learner.post('/api/auth/login',json={'email':'other@example.com','password':'Password@123'})
    assert learner.get('/api/classes/1/students/1').status_code==403

def test_emotion_pause_manual_edit_and_ownership(learner):
    assert learner.put('/api/emotion-preferences',json={'enabled':False}).json()['enabled'] is False
    assert learner.post('/api/emotions',json={'failures':5}).status_code==409
    e=learner.post('/api/emotions',json={'state':'negative','body':'Chưa hiểu vòng lặp.'}).json()
    assert e['scores'] is None
    r=learner.patch(f'/api/emotions/{e["id"]}',json={'state':'positive','body':'Đã hiểu sau khi xem bài giảng.'})
    assert r.status_code==200 and r.json()['body'].startswith('Đã hiểu')
    assert learner.get('/api/emotions').json()[0]['body'].startswith('Đã hiểu')
    login(learner,'teacher')
    assert learner.patch(f'/api/emotions/{e["id"]}',json={'state':'neutral'}).status_code==403

def test_media_validation_retry_and_resources(learner):
    login(learner,'teacher')
    seeded=learner.get('/api/manage/media-status').json()
    assert all(m['lessons'] for m in seeded)
    bad=learner.post('/api/manage/media',files={'file':('bad.mp4',b'not a video','video/mp4')}).json()
    assert next(x for x in learner.get('/api/manage/media-status').json() if x['id']==bad['id'])['processing']['status']=='failed'
    assert learner.post(f'/api/manage/media/{bad["id"]}/retry').status_code==200
    good=learner.post('/api/manage/media',files={'file':('captions.vtt',b'WEBVTT\n\n00:00.000 --> 00:01.000\nHello','text/vtt')}).json()
    assert next(x for x in learner.get('/api/manage/media-status').json() if x['id']==good['id'])['processing']['status']=='ready'
    assert learner.put('/api/manage/lessons/1/extras',json={'thumbnail_url':'javascript:alert(1)'}).status_code==400
    payload={'thumbnail_url':'https://example.com/poster.jpg','resources':[{'title':'Tài liệu','url':'https://example.com/notes.pdf'}]}
    assert learner.put('/api/manage/lessons/1/extras',json=payload).status_code==200
    login(learner,'learner')
    assert learner.get('/api/lessons/1/extras').json()['resources']==payload['resources']
    assert learner.get('/api/manage/media-status').status_code==403

def test_lesson_draft_preserves_published_material(learner):
    login(learner,'teacher')
    with Session() as db: before=db.get(Lesson,1).title
    payload={'course_id':1,'payload':{'form':{'title':'Bản nháp'},'extras':{}}}
    assert learner.put('/api/manage/lesson-drafts/lesson-1',json=payload).status_code==200
    assert learner.get('/api/manage/lesson-drafts/lesson-1').json()['payload']==payload['payload']
    with Session() as db: assert db.get(Lesson,1).title==before
    assert learner.delete('/api/manage/lesson-drafts/lesson-1').status_code==200
    assert learner.get('/api/manage/lesson-drafts/lesson-1').json()['payload'] is None
    login(learner,'learner')
    assert learner.put('/api/manage/lesson-drafts/lesson-1',json=payload).status_code==403

def test_empty_benchmark_and_configured_service_states(learner):
    b=learner.get('/api/analytics/benchmark?course_id=1').json()
    assert b['learner_minutes'] is None and b['reference_minutes'] is None and b['percent'] is None
    assert learner.get('/api/system/services').status_code==403
    login(learner,'admin');rows=learner.get('/api/system/services').json()
    assert rows[0]['status']=='unconfigured' and rows[2]['status']=='ready'

def test_roadmap_prioritizes_weak_placement_without_faking_completion(learner):
    from app.models import Placement
    with Session() as db:
        db.add(Placement(user_id=1,course_id=1,scores={'input_output':100,'variables':0}));db.commit()
    rows=learner.get('/api/courses/1/roadmap').json()
    next_item=next(x for x in rows if x['recommended'])
    assert next_item['skill']=='variables' and next_item['needs_review'] is True
    assert all(not x['completed'] for x in rows)
