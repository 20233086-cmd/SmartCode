"""Rebuild frontend fixture data with an isolated database. Run with backend dependencies."""
import os, sys, json, tempfile
from pathlib import Path
root=Path(__file__).resolve().parents[1]
tmp=tempfile.TemporaryDirectory(prefix='smartcode-ui-fixtures-')
os.environ.update(DATABASE_URL='sqlite:///'+str(Path(tmp.name)/'ui.db'),SMARTCODE_DATA_DIR=str(Path(tmp.name)/'data'),JWT_SECRET='fixture-only-key-123456789012345678901234567890',AUTO_SEED='true',JUDGE0_URL='',OLLAMA_URL='',DEMO_PASSWORD='SmartCode@123')
sys.path.insert(0,str(root/'backend'))
from fastapi.testclient import TestClient
from app.main import app
common=['/auth/me','/courses','/my/courses','/courses/1','/courses/1/roadmap','/lessons/1','/lessons/1/extras','/exercises/1','/health','/analytics','/analytics/benchmark','/submissions','/emotions','/emotion-preferences','/notifications','/leaderboard','/classes','/courses/1/placement','/courses/1/survey']
staff=['/manage/courses','/manage/lessons','/manage/exercises','/manage/media','/manage/media-status','/classes/1/report','/classes/1/sessions/1/details','/classes/1/sessions/1/report','/classes/1/students/1','/manage/lesson-drafts/lesson-1','/manage/lesson-drafts/new-1']
result={}
with TestClient(app) as client:
    for role in ['learner','teacher','admin']:
        assert client.post('/api/auth/login',json={'email':role+'@smartcode.local','password':'SmartCode@123'}).status_code==200
        paths=common+(staff if role!='learner' else [])+(['/admin/overview','/admin/users','/admin/payments','/admin/reports','/system/services'] if role=='admin' else [])
        result[role]={}
        for path in paths:
            response=client.get('/api'+path);assert response.status_code==200,(path,response.text)
            result[role][path]=response.json()
        if role=='learner':
            a=client.post('/api/courses/1/assessments').json()
            result[role]['/assessments/1']=a
            result[role]['/courses/1/assessments']=a
            client.post(f'/api/assessments/{a["id"]}/finish')
            result[role]['/assessments/1/finish']=client.get('/api/assessments/1').json()
(root/'frontend/src/test/fixtures.json').write_text(json.dumps(result,ensure_ascii=False,indent=2),encoding='utf-8')
print('Exported',sum(map(len,result.values())),'API responses for three roles.')
