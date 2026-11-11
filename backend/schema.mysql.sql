-- SmartCode 2.0 schema reference. App creates missing tables automatically.
-- This file is for a fresh MySQL database, not a destructive migration.
SET NAMES utf8mb4;

CREATE TABLE users (
	id INTEGER NOT NULL AUTO_INCREMENT, 
	name VARCHAR(100), 
	email VARCHAR(190), 
	password_hash VARCHAR(255), 
	`role` VARCHAR(20), 
	active BOOL, 
	created_at DATETIME, 
	PRIMARY KEY (id)
);

CREATE UNIQUE INDEX ix_users_email ON users (email);

CREATE TABLE courses (
	id INTEGER NOT NULL AUTO_INCREMENT, 
	title VARCHAR(200), 
	language VARCHAR(20), 
	description TEXT, 
	price INTEGER, 
	published BOOL, 
	owner_id INTEGER, 
	color VARCHAR(20), 
	PRIMARY KEY (id), 
	FOREIGN KEY(owner_id) REFERENCES users (id)
);

CREATE TABLE emotion_preferences (
	user_id INTEGER NOT NULL, 
	enabled BOOL, 
	PRIMARY KEY (user_id), 
	FOREIGN KEY(user_id) REFERENCES users (id)
);

CREATE TABLE emotions (
	id INTEGER NOT NULL AUTO_INCREMENT, 
	user_id INTEGER, 
	state VARCHAR(20), 
	source VARCHAR(20), 
	scores JSON, 
	created_at DATETIME, 
	PRIMARY KEY (id), 
	FOREIGN KEY(user_id) REFERENCES users (id)
);

CREATE TABLE media (
	id INTEGER NOT NULL AUTO_INCREMENT, 
	owner_id INTEGER, 
	name VARCHAR(200), 
	stored_name VARCHAR(100), 
	kind VARCHAR(20), 
	size INTEGER, 
	created_at DATETIME, 
	PRIMARY KEY (id), 
	FOREIGN KEY(owner_id) REFERENCES users (id)
);

CREATE TABLE notifications (
	id INTEGER NOT NULL AUTO_INCREMENT, 
	user_id INTEGER, 
	body TEXT, 
	`read` BOOL, 
	created_at DATETIME, 
	PRIMARY KEY (id), 
	FOREIGN KEY(user_id) REFERENCES users (id)
);

CREATE TABLE password_resets (
	id INTEGER NOT NULL AUTO_INCREMENT, 
	user_id INTEGER, 
	token_hash VARCHAR(64), 
	expires_at DATETIME, 
	used BOOL, 
	PRIMARY KEY (id), 
	FOREIGN KEY(user_id) REFERENCES users (id), 
	UNIQUE (token_hash)
);

CREATE INDEX ix_password_resets_user_id ON password_resets (user_id);

CREATE TABLE assessment_attempts (
	id INTEGER NOT NULL AUTO_INCREMENT, 
	user_id INTEGER, 
	course_id INTEGER, 
	exercise_ids JSON, 
	started_at DATETIME, 
	expires_at DATETIME, 
	finished_at DATETIME, 
	drafts JSON, 
	PRIMARY KEY (id), 
	FOREIGN KEY(user_id) REFERENCES users (id), 
	FOREIGN KEY(course_id) REFERENCES courses (id)
);

CREATE INDEX ix_assessment_attempts_user_id ON assessment_attempts (user_id);

CREATE TABLE classrooms (
	id INTEGER NOT NULL AUTO_INCREMENT, 
	name VARCHAR(200), 
	course_id INTEGER, 
	owner_id INTEGER, 
	join_code VARCHAR(20), 
	PRIMARY KEY (id), 
	FOREIGN KEY(course_id) REFERENCES courses (id), 
	FOREIGN KEY(owner_id) REFERENCES users (id), 
	UNIQUE (join_code)
);

CREATE TABLE emotion_notes (
	emotion_id INTEGER NOT NULL, 
	body TEXT, 
	PRIMARY KEY (emotion_id), 
	FOREIGN KEY(emotion_id) REFERENCES emotions (id)
);

CREATE TABLE enrollments (
	id INTEGER NOT NULL AUTO_INCREMENT, 
	user_id INTEGER, 
	course_id INTEGER, 
	created_at DATETIME, 
	PRIMARY KEY (id), 
	UNIQUE (user_id, course_id), 
	FOREIGN KEY(user_id) REFERENCES users (id), 
	FOREIGN KEY(course_id) REFERENCES courses (id)
);

CREATE TABLE learner_surveys (
	id INTEGER NOT NULL AUTO_INCREMENT, 
	user_id INTEGER, 
	course_id INTEGER, 
	answers JSON, 
	updated_at DATETIME, 
	PRIMARY KEY (id), 
	UNIQUE (user_id, course_id), 
	FOREIGN KEY(user_id) REFERENCES users (id), 
	FOREIGN KEY(course_id) REFERENCES courses (id)
);

CREATE TABLE lesson_drafts (
	id INTEGER NOT NULL AUTO_INCREMENT, 
	user_id INTEGER, 
	draft_key VARCHAR(80), 
	course_id INTEGER, 
	payload JSON, 
	updated_at DATETIME, 
	PRIMARY KEY (id), 
	UNIQUE (user_id, draft_key), 
	FOREIGN KEY(user_id) REFERENCES users (id), 
	FOREIGN KEY(course_id) REFERENCES courses (id)
);

CREATE TABLE lessons (
	id INTEGER NOT NULL AUTO_INCREMENT, 
	course_id INTEGER, 
	title VARCHAR(200), 
	content TEXT, 
	code TEXT, 
	position INTEGER, 
	skill VARCHAR(80), 
	video_url TEXT, 
	captions_url TEXT, 
	quiz JSON, 
	PRIMARY KEY (id), 
	FOREIGN KEY(course_id) REFERENCES courses (id)
);

CREATE INDEX ix_lessons_course_id ON lessons (course_id);

CREATE TABLE media_processing (
	media_id INTEGER NOT NULL, 
	status VARCHAR(20), 
	progress INTEGER, 
	duration FLOAT, 
	error TEXT, 
	PRIMARY KEY (media_id), 
	FOREIGN KEY(media_id) REFERENCES media (id)
);

CREATE TABLE payments (
	id INTEGER NOT NULL AUTO_INCREMENT, 
	user_id INTEGER, 
	course_id INTEGER, 
	amount INTEGER, 
	status VARCHAR(20), 
	provider VARCHAR(20), 
	created_at DATETIME, 
	PRIMARY KEY (id), 
	FOREIGN KEY(user_id) REFERENCES users (id), 
	FOREIGN KEY(course_id) REFERENCES courses (id)
);

CREATE TABLE placements (
	id INTEGER NOT NULL AUTO_INCREMENT, 
	user_id INTEGER, 
	course_id INTEGER, 
	scores JSON, 
	created_at DATETIME, 
	PRIMARY KEY (id), 
	FOREIGN KEY(user_id) REFERENCES users (id), 
	FOREIGN KEY(course_id) REFERENCES courses (id)
);

CREATE TABLE class_sessions (
	id INTEGER NOT NULL AUTO_INCREMENT, 
	class_id INTEGER, 
	title VARCHAR(200), 
	due_at VARCHAR(40), 
	exercise_ids JSON, 
	status VARCHAR(20), 
	allow_hints BOOL, 
	PRIMARY KEY (id), 
	FOREIGN KEY(class_id) REFERENCES classrooms (id)
);

CREATE TABLE exercises (
	id INTEGER NOT NULL AUTO_INCREMENT, 
	course_id INTEGER, 
	lesson_id INTEGER, 
	title VARCHAR(200), 
	description TEXT, 
	difficulty VARCHAR(20), 
	skill VARCHAR(80), 
	starter TEXT, 
	tests JSON, 
	hints JSON, 
	time_limit FLOAT, 
	memory_limit INTEGER, 
	PRIMARY KEY (id), 
	FOREIGN KEY(course_id) REFERENCES courses (id), 
	FOREIGN KEY(lesson_id) REFERENCES lessons (id)
);

CREATE TABLE lesson_extras (
	lesson_id INTEGER NOT NULL, 
	thumbnail_url TEXT, 
	resources JSON, 
	PRIMARY KEY (lesson_id), 
	FOREIGN KEY(lesson_id) REFERENCES lessons (id)
);

CREATE TABLE members (
	id INTEGER NOT NULL AUTO_INCREMENT, 
	class_id INTEGER, 
	user_id INTEGER, 
	PRIMARY KEY (id), 
	UNIQUE (class_id, user_id), 
	FOREIGN KEY(class_id) REFERENCES classrooms (id), 
	FOREIGN KEY(user_id) REFERENCES users (id)
);

CREATE TABLE notes (
	id INTEGER NOT NULL AUTO_INCREMENT, 
	user_id INTEGER, 
	lesson_id INTEGER, 
	position FLOAT, 
	body TEXT, 
	created_at DATETIME, 
	PRIMARY KEY (id), 
	FOREIGN KEY(user_id) REFERENCES users (id), 
	FOREIGN KEY(lesson_id) REFERENCES lessons (id)
);

CREATE TABLE progress (
	id INTEGER NOT NULL AUTO_INCREMENT, 
	user_id INTEGER, 
	lesson_id INTEGER, 
	position FLOAT, 
	quiz_score INTEGER, 
	`read` BOOL, 
	first_read_at DATETIME, 
	updated_at DATETIME, 
	PRIMARY KEY (id), 
	UNIQUE (user_id, lesson_id), 
	FOREIGN KEY(user_id) REFERENCES users (id), 
	FOREIGN KEY(lesson_id) REFERENCES lessons (id)
);

CREATE TABLE student_comments (
	id INTEGER NOT NULL AUTO_INCREMENT, 
	class_id INTEGER, 
	user_id INTEGER, 
	teacher_id INTEGER, 
	body TEXT, 
	updated_at DATETIME, 
	PRIMARY KEY (id), 
	UNIQUE (class_id, user_id), 
	FOREIGN KEY(class_id) REFERENCES classrooms (id), 
	FOREIGN KEY(user_id) REFERENCES users (id), 
	FOREIGN KEY(teacher_id) REFERENCES users (id)
);

CREATE TABLE drafts (
	id INTEGER NOT NULL AUTO_INCREMENT, 
	user_id INTEGER, 
	exercise_id INTEGER, 
	code TEXT, 
	active_seconds INTEGER, 
	updated_at DATETIME, 
	PRIMARY KEY (id), 
	UNIQUE (user_id, exercise_id), 
	FOREIGN KEY(user_id) REFERENCES users (id), 
	FOREIGN KEY(exercise_id) REFERENCES exercises (id)
);

CREATE TABLE hints (
	id INTEGER NOT NULL AUTO_INCREMENT, 
	user_id INTEGER, 
	exercise_id INTEGER, 
	level INTEGER, 
	created_at DATETIME, 
	PRIMARY KEY (id), 
	FOREIGN KEY(user_id) REFERENCES users (id), 
	FOREIGN KEY(exercise_id) REFERENCES exercises (id)
);

CREATE TABLE reports (
	id INTEGER NOT NULL AUTO_INCREMENT, 
	user_id INTEGER, 
	exercise_id INTEGER, 
	body TEXT, 
	status VARCHAR(20), 
	created_at DATETIME, 
	PRIMARY KEY (id), 
	FOREIGN KEY(user_id) REFERENCES users (id), 
	FOREIGN KEY(exercise_id) REFERENCES exercises (id)
);

CREATE TABLE session_details (
	session_id INTEGER NOT NULL, 
	`groups` JSON, 
	topic VARCHAR(100), 
	teaching_date VARCHAR(40), 
	summary_note TEXT, 
	PRIMARY KEY (session_id), 
	FOREIGN KEY(session_id) REFERENCES class_sessions (id)
);

CREATE TABLE submissions (
	id INTEGER NOT NULL AUTO_INCREMENT, 
	user_id INTEGER, 
	exercise_id INTEGER, 
	code TEXT, 
	status VARCHAR(30), 
	passed INTEGER, 
	total INTEGER, 
	duration_ms INTEGER, 
	work_seconds INTEGER, 
	results JSON, 
	created_at DATETIME, 
	PRIMARY KEY (id), 
	FOREIGN KEY(user_id) REFERENCES users (id), 
	FOREIGN KEY(exercise_id) REFERENCES exercises (id)
);

CREATE TABLE submission_contexts (
	submission_id INTEGER NOT NULL, 
	assessment_id INTEGER, 
	session_id INTEGER, 
	PRIMARY KEY (submission_id), 
	FOREIGN KEY(submission_id) REFERENCES submissions (id), 
	FOREIGN KEY(assessment_id) REFERENCES assessment_attempts (id), 
	FOREIGN KEY(session_id) REFERENCES class_sessions (id)
);

CREATE INDEX ix_submission_contexts_session_id ON submission_contexts (session_id);

CREATE INDEX ix_submission_contexts_assessment_id ON submission_contexts (assessment_id);
