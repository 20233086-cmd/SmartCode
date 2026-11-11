"""Build a clean, reproducible source ZIP after frontend build and tests."""
from pathlib import Path
import hashlib, json, zipfile
root=Path(__file__).resolve().parents[1]
output=root.parent/'SmartCode_Backend_Frontend.zip'
excluded={'node_modules','.venv','venv','__pycache__','.pytest_cache','.git','data','.DS_Store'}
files=[]
for path in sorted(root.rglob('*')):
    if not path.is_file(): continue
    rel=path.relative_to(root)
    if any(part in excluded for part in rel.parts): continue
    if path.name=='.env' or path.suffix in {'.pyc','.pyo','.db','.eml'}: continue
    if 'docker' in path.name.lower(): raise RuntimeError('Unexpected container configuration: '+str(rel))
    files.append(path)
if not (root/'frontend/dist/index.html').is_file():raise SystemExit('Run npm run build in frontend first.')
with zipfile.ZipFile(output,'w',zipfile.ZIP_DEFLATED,compresslevel=9) as archive:
    for path in files:archive.write(path,'SmartCode/'+str(path.relative_to(root)))
with zipfile.ZipFile(output) as archive:
    assert archive.testzip() is None
    assert 'SmartCode/backend/.env.example' in archive.namelist()
    assert 'SmartCode/frontend/dist/index.html' in archive.namelist()
print(json.dumps({'file':str(output),'files':len(files),'bytes':output.stat().st_size,'sha256':hashlib.sha256(output.read_bytes()).hexdigest()},indent=2))
